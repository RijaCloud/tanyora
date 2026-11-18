<?php
/**
 * 2424 Platform Health module
 * Description: Sonde de sante REST pour les load balancers et la supervision.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('PLATFORM_2424_HEALTH_MODULE_VERSION')) {
    define('PLATFORM_2424_HEALTH_MODULE_VERSION', '1.0.0');
}

if (!function_exists('platform_health_secret')) {
    function platform_health_secret() {
        if (function_exists('platform_auth_secret')) {
            return (string) platform_auth_secret();
        }

        if (defined('PLATFORM_SUBMISSIONS_SECRET') && PLATFORM_SUBMISSIONS_SECRET) {
            return (string) PLATFORM_SUBMISSIONS_SECRET;
        }

        $env = getenv('PLATFORM_SUBMISSIONS_SECRET');

        return $env ? (string) $env : '';
    }
}

if (!function_exists('platform_health_request_is_trusted')) {
    /**
     * La sonde publique reste volontairement muette. Le detail n'est expose
     * qu'aux appelants qui presentent le secret interne partage avec Next.js.
     */
    function platform_health_request_is_trusted(WP_REST_Request $request) {
        $expected = platform_health_secret();
        if ($expected === '') {
            return false;
        }

        $received = (string) $request->get_header('x-2424-internal-secret');
        if ($received === '') {
            return false;
        }

        return hash_equals($expected, $received);
    }
}

if (!function_exists('platform_health_elapsed_ms')) {
    function platform_health_elapsed_ms($start) {
        return (float) round((microtime(true) - (float) $start) * 1000, 2);
    }
}

if (!function_exists('platform_health_bootstrap_ms')) {
    /**
     * Temps ecoule entre l'arrivee de la requete sur PHP et l'execution du
     * handler. C'est le cout du bootstrap WordPress seul, hors requete metier :
     * la metrique qui permet de distinguer un WordPress lent d'une requete lente.
     */
    function platform_health_bootstrap_ms() {
        $started = isset($_SERVER['REQUEST_TIME_FLOAT']) ? (float) $_SERVER['REQUEST_TIME_FLOAT'] : 0.0;
        if ($started <= 0) {
            return null;
        }

        return platform_health_elapsed_ms($started);
    }
}

if (!function_exists('platform_health_check_database')) {
    function platform_health_check_database() {
        global $wpdb;

        if (!isset($wpdb) || !is_object($wpdb)) {
            return array(
                'status' => 'down',
                'latencyMs' => null,
                'error' => 'wpdb indisponible.',
            );
        }

        $started = microtime(true);
        $suppress = $wpdb->suppress_errors(true);
        $value = $wpdb->get_var('SELECT 1');
        $wpdb->suppress_errors($suppress);
        $latency = platform_health_elapsed_ms($started);

        if ((string) $value !== '1') {
            return array(
                'status' => 'down',
                'latencyMs' => $latency,
                'error' => 'La base ne repond pas au ping.',
            );
        }

        return array(
            'status' => 'up',
            'latencyMs' => $latency,
        );
    }
}

if (!function_exists('platform_health_log_option_bytes')) {
    /**
     * Poids serialise du journal applicatif. Cette option est reecrite en
     * entier a chaque evenement logge : au-dela de quelques centaines de Ko
     * elle devient un point de contention sur wp_options.
     */
    function platform_health_log_option_bytes() {
        global $wpdb;

        if (!isset($wpdb) || !is_object($wpdb) || !defined('PLATFORM_2424_LOG_OPTION')) {
            return null;
        }

        $bytes = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT LENGTH(option_value) FROM {$wpdb->options} WHERE option_name = %s LIMIT 1",
                PLATFORM_2424_LOG_OPTION
            )
        );

        return $bytes === null ? 0 : (int) $bytes;
    }
}

if (!function_exists('platform_health_collect_details')) {
    function platform_health_collect_details($database) {
        global $wp_version;

        $catchup_option = 'platform_submissions_expiration_catchup_2026_07_05';

        $details = array(
            'pluginVersion' => defined('PLATFORM_2424_PLUGIN_VERSION') ? PLATFORM_2424_PLUGIN_VERSION : null,
            'healthModuleVersion' => PLATFORM_2424_HEALTH_MODULE_VERSION,
            'wordpressVersion' => isset($wp_version) ? (string) $wp_version : null,
            'phpVersion' => PHP_VERSION,
            'bootstrapMs' => platform_health_bootstrap_ms(),
            'database' => $database,
            'runtime' => array(
                'externalObjectCache' => function_exists('wp_using_ext_object_cache') ? (bool) wp_using_ext_object_cache() : false,
                'wpCronDisabled' => defined('DISABLE_WP_CRON') && DISABLE_WP_CRON,
                'debugEnabled' => defined('WP_DEBUG') && WP_DEBUG,
                'memoryPeakMb' => (float) round(memory_get_peak_usage(true) / 1048576, 1),
            ),
            'diagnostics' => array(
                // Garde du rattrapage d'expiration. Absente, elle relance un
                // balayage integral des annonces publiees a chaque requete.
                'expirationCatchupGuardSet' => (bool) get_option($catchup_option, false),
                'logOptionBytes' => platform_health_log_option_bytes(),
                'mediaCleanupQueue' => function_exists('platform_submissions_media_cleanup_diagnostics')
                    ? platform_submissions_media_cleanup_diagnostics()
                    : array('available' => false),
            ),
        );

        $modules = array(
            'auth' => 'platform_auth_secret',
            'submissions' => 'platform_submissions_secret',
            'billing' => 'platform_billing_get_subscription_snapshot',
            'mvola' => 'platform_2424_is_mvola_enabled',
            'ads' => 'platform_2424_ads_register_post_type',
            'revalidate' => 'next_revalidate_send_payload',
        );

        $loaded_modules = array();
        foreach ($modules as $module_name => $probe_function) {
            $loaded_modules[$module_name] = function_exists($probe_function);
        }
        $details['modules'] = $loaded_modules;

        $details['integrations'] = array(
            'woocommerce' => class_exists('WooCommerce'),
            'woocommerceSubscriptions' => function_exists('wcs_get_users_subscriptions'),
            'wpGraphql' => class_exists('WPGraphQL') || function_exists('graphql'),
        );

        return $details;
    }
}

if (!function_exists('platform_health_build_response')) {
    function platform_health_build_response(WP_REST_Request $request) {
        $database = platform_health_check_database();
        $is_healthy = $database['status'] === 'up';

        $payload = array(
            'ok' => $is_healthy,
            'service' => '2424-platform',
            'time' => gmdate('c'),
        );

        if (platform_health_request_is_trusted($request)) {
            $payload['details'] = platform_health_collect_details($database);
        }

        $response = new WP_REST_Response($payload, $is_healthy ? 200 : 503);
        $response->header('Cache-Control', 'no-store, max-age=0');

        return $response;
    }
}

add_action('rest_api_init', function () {
    register_rest_route('2424/v1', '/health', array(
        'methods' => WP_REST_Server::READABLE,
        'permission_callback' => '__return_true',
        'callback' => 'platform_health_build_response',
    ));
});
