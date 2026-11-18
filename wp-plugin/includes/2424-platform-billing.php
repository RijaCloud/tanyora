<?php
/**
 * 2424 Platform Billing module
 * Description: Internal WooCommerce billing bridge for the Next.js frontend.
 * Version: 1.0.1
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!function_exists('platform_billing_log')) {
    function platform_billing_log($message, $context = array()) {
        if (function_exists('platform_2424_log_event')) {
            platform_2424_log_event('info', 'billing', $message, $context);
            return;
        }

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $suffix = empty($context) ? '' : ' ' . wp_json_encode($context);
            error_log('[2424-billing] ' . $message . $suffix);
        }
    }
}

if (!function_exists('platform_billing_secret')) {
    function platform_billing_secret() {
        if (function_exists('platform_auth_secret')) {
            return platform_auth_secret();
        }

        if (defined('PLATFORM_SUBMISSIONS_SECRET') && PLATFORM_SUBMISSIONS_SECRET) {
            return PLATFORM_SUBMISSIONS_SECRET;
        }

        $env = getenv('PLATFORM_SUBMISSIONS_SECRET');
        return $env ? $env : '';
    }
}

if (!function_exists('platform_billing_ensure_request_authorized')) {
    function platform_billing_ensure_request_authorized(WP_REST_Request $request) {
        $expected = platform_billing_secret();
        if (!$expected) {
            return new WP_Error('platform_billing_missing_secret', 'Platform billing secret is not configured.', array('status' => 500));
        }

        $received = (string) $request->get_header('x-2424-internal-secret');
        if (!$received || !hash_equals($expected, $received)) {
            return new WP_Error('platform_billing_forbidden', 'Invalid platform billing secret.', array('status' => 403));
        }

        return true;
    }
}

if (!function_exists('platform_billing_plan_product_map')) {
    function platform_billing_read_product_id($constant_name, $env_name, $fallback) {
        if (defined($constant_name) && absint(constant($constant_name)) > 0) {
            return absint(constant($constant_name));
        }

        $env = getenv($env_name);
        if ($env && absint($env) > 0) {
            return absint($env);
        }

        return absint($fallback);
    }

    function platform_billing_plan_product_map() {
        $default_map = array(
            'monthly' => array(
                'essentiel' => platform_billing_read_product_id('PLATFORM_WC_PRODUCT_ID_ESSENTIEL', 'PLATFORM_WC_PRODUCT_ID_ESSENTIEL', 33),
                'business' => platform_billing_read_product_id('PLATFORM_WC_PRODUCT_ID_BUSINESS', 'PLATFORM_WC_PRODUCT_ID_BUSINESS', 34),
            ),
            'annual' => array(
                'essentiel' => platform_billing_read_product_id('PLATFORM_WC_PRODUCT_ID_ESSENTIEL_ANNUAL', 'PLATFORM_WC_PRODUCT_ID_ESSENTIEL_ANNUAL', 0),
                'business' => platform_billing_read_product_id('PLATFORM_WC_PRODUCT_ID_BUSINESS_ANNUAL', 'PLATFORM_WC_PRODUCT_ID_BUSINESS_ANNUAL', 0),
            ),
        );

        $staging_map = array(
            'monthly' => array(
                'essentiel' => platform_billing_read_product_id('PLATFORM_WC_PRODUCT_ID_ESSENTIEL_STAGING', 'PLATFORM_WC_PRODUCT_ID_ESSENTIEL_STAGING', 16),
                'business' => platform_billing_read_product_id('PLATFORM_WC_PRODUCT_ID_BUSINESS_STAGING', 'PLATFORM_WC_PRODUCT_ID_BUSINESS_STAGING', 17),
            ),
            'annual' => array(
                'essentiel' => platform_billing_read_product_id('PLATFORM_WC_PRODUCT_ID_ESSENTIEL_ANNUAL_STAGING', 'PLATFORM_WC_PRODUCT_ID_ESSENTIEL_ANNUAL_STAGING', 0),
                'business' => platform_billing_read_product_id('PLATFORM_WC_PRODUCT_ID_BUSINESS_ANNUAL_STAGING', 'PLATFORM_WC_PRODUCT_ID_BUSINESS_ANNUAL_STAGING', 0),
            ),
        );

        $site_url = '';
        if (function_exists('home_url')) {
            $site_url = (string) home_url('/');
        }

        $host = wp_parse_url($site_url, PHP_URL_HOST);
        $environment = function_exists('wp_get_environment_type') ? wp_get_environment_type() : '';
        $normalized_host = is_string($host) ? strtolower($host) : '';
        $is_staging_host = in_array($normalized_host, array('back.2424.mg', '2424-backoffice.mijary.com', 'staging.2424.mg'), true);
        $is_staging_env = is_string($environment) && strtolower($environment) === 'staging';

        $map = ($is_staging_host || $is_staging_env) ? $staging_map : $default_map;

        // Admin-selected annual products take precedence over legacy SKU and
        // environment mappings, matching the product selectors in the pricing UI.
        foreach (array('essentiel', 'business') as $plan_id) {
            $selected_product_id = absint(get_option('platform_2424_annual_product_id_' . $plan_id, 0));
            if ($selected_product_id > 0) {
                $map['annual'][$plan_id] = $selected_product_id;
            }
        }

        return apply_filters('platform_billing_plan_product_map', $map, array(
            'environment' => $environment,
            'host' => $host,
            'default_map' => $default_map,
            'staging_map' => $staging_map,
        ));
    }
}

if (!function_exists('platform_billing_product_to_plan_map')) {
    function platform_billing_product_to_plan_map() {
        $map = array();
        foreach (platform_billing_plan_product_map() as $period_map) {
            if (!is_array($period_map)) {
                continue;
            }

            foreach ($period_map as $plan_id => $product_id) {
                $product_id = absint($product_id);
                if ($product_id > 0) {
                    $map[$product_id] = $plan_id;
                }
            }
        }

        return $map;
    }
}

if (!function_exists('platform_billing_get_product_id_for_plan')) {
    function platform_billing_get_product_id_for_plan($plan_id, $billing_period = 'monthly') {
        $map = platform_billing_plan_product_map();
        $billing_period = platform_billing_normalize_billing_period($billing_period);
        return isset($map[$billing_period][$plan_id]) ? absint($map[$billing_period][$plan_id]) : 0;
    }
}

if (!function_exists('platform_billing_get_product_id_by_sku')) {
    function platform_billing_get_product_id_by_sku($sku) {
        $sku = sanitize_text_field((string) $sku);
        if ($sku === '' || !function_exists('wc_get_product_id_by_sku')) {
            return 0;
        }

        return absint(wc_get_product_id_by_sku($sku));
    }
}

if (!function_exists('platform_billing_read_product_sku')) {
    function platform_billing_read_product_sku($constant_name, $env_name, $fallback) {
        if (defined($constant_name)) {
            $value = sanitize_text_field((string) constant($constant_name));
            if ($value !== '') {
                return $value;
            }
        }

        $env = getenv($env_name);
        if ($env) {
            $value = sanitize_text_field((string) $env);
            if ($value !== '') {
                return $value;
            }
        }

        return sanitize_text_field((string) $fallback);
    }
}

if (!function_exists('platform_billing_plan_product_sku_map')) {
    function platform_billing_plan_product_sku_map() {
        return array(
            'monthly' => array(
                'essentiel' => platform_billing_read_product_sku('PLATFORM_WC_PRODUCT_SKU_ESSENTIEL', 'PLATFORM_WC_PRODUCT_SKU_ESSENTIEL', 'essentiel'),
                'business' => platform_billing_read_product_sku('PLATFORM_WC_PRODUCT_SKU_BUSINESS', 'PLATFORM_WC_PRODUCT_SKU_BUSINESS', 'business'),
            ),
            'annual' => array(
                'essentiel' => platform_billing_read_product_sku('PLATFORM_WC_PRODUCT_SKU_ESSENTIEL_ANNUAL', 'PLATFORM_WC_PRODUCT_SKU_ESSENTIEL_ANNUAL', sanitize_text_field((string) get_option('platform_2424_annual_sku_essentiel', 'essentiel-12-months'))),
                'business' => platform_billing_read_product_sku('PLATFORM_WC_PRODUCT_SKU_BUSINESS_ANNUAL', 'PLATFORM_WC_PRODUCT_SKU_BUSINESS_ANNUAL', sanitize_text_field((string) get_option('platform_2424_annual_sku_business', 'business-12-months'))),
            ),
        );
    }
}

if (!function_exists('platform_billing_get_plan_id_for_sku')) {
    function platform_billing_get_plan_id_for_sku($sku) {
        $sku = sanitize_text_field((string) $sku);
        if ($sku === '') {
            return 'free';
        }

        foreach (platform_billing_plan_product_sku_map() as $period_map) {
            if (!is_array($period_map)) {
                continue;
            }

            $map = array_flip($period_map);
            if (isset($map[$sku])) {
                return $map[$sku];
            }
        }

        return 'free';
    }
}

if (!function_exists('platform_billing_resolve_product_id')) {
    function platform_billing_resolve_product_id($plan_id, $payload = array()) {
        $plan_id = sanitize_key((string) $plan_id);
        $billing_period = platform_billing_normalize_billing_period($payload['billingPeriod'] ?? 'monthly');
        $explicit_product_sku = sanitize_text_field((string) ($payload['wpProductSku'] ?? ''));
        if ($explicit_product_sku !== '') {
            $product_id_from_sku = platform_billing_get_product_id_by_sku($explicit_product_sku);
            if ($product_id_from_sku > 0) {
                return $product_id_from_sku;
            }
        }

        // Le serveur reste la source de verite lorsque le SKU Next pointe vers
        // un ancien catalogue ou qu'une instance de staging utilise d'autres IDs.
        $sku_map = platform_billing_plan_product_sku_map();
        $configured_sku = sanitize_text_field((string) ($sku_map[$billing_period][$plan_id] ?? ''));
        if ($configured_sku !== '') {
            $product_id_from_configured_sku = platform_billing_get_product_id_by_sku($configured_sku);
            if ($product_id_from_configured_sku > 0) {
                return $product_id_from_configured_sku;
            }
        }

        return platform_billing_get_product_id_for_plan($plan_id, $billing_period);
    }
}

if (!function_exists('platform_billing_get_plan_id_for_product')) {
    function platform_billing_get_plan_id_for_product($product_id) {
        $product_id = absint($product_id);
        if (!$product_id) {
            return 'free';
        }

        if (function_exists('wc_get_product')) {
            $product = wc_get_product($product_id);
            if ($product && method_exists($product, 'get_sku')) {
                $plan_id_from_sku = platform_billing_get_plan_id_for_sku($product->get_sku());
                if ($plan_id_from_sku !== 'free') {
                    return $plan_id_from_sku;
                }
            }
        }

        $map = platform_billing_product_to_plan_map();
        return isset($map[$product_id]) ? $map[$product_id] : 'free';
    }
}

if (!function_exists('platform_billing_default_snapshot')) {
    function platform_billing_default_snapshot() {
        return array(
            'planId' => 'free',
            'status' => 'none',
            'billingProvider' => 'woocommerce-subscriptions',
            'billingPeriod' => 'monthly',
            'renewsAt' => null,
            'startedAt' => null,
            'wcSubscriptionId' => null,
            'wcCustomerId' => null,
            'stripeCustomerId' => null,
            'accessGrant' => null,
        );
    }
}

if (!function_exists('platform_billing_valid_plan_ids')) {
    function platform_billing_valid_plan_ids() {
        return array('free', 'essentiel', 'business');
    }
}

if (!function_exists('platform_billing_valid_statuses')) {
    function platform_billing_valid_statuses() {
        return array('none', 'active', 'trialing', 'past_due', 'canceled');
    }
}

if (!function_exists('platform_billing_valid_periods')) {
    function platform_billing_valid_periods() {
        return array('monthly', 'annual');
    }
}

if (!function_exists('platform_billing_normalize_billing_period')) {
    function platform_billing_normalize_billing_period($value) {
        $value = sanitize_key((string) $value);
        return in_array($value, platform_billing_valid_periods(), true) ? $value : 'monthly';
    }
}

if (!function_exists('platform_billing_get_plan_monthly_price_ar')) {
    function platform_billing_get_plan_monthly_price_ar($plan_id) {
        $plan_id = sanitize_key((string) $plan_id);
        $fallbacks = array(
            'essentiel' => 15000.0,
            'business' => 75000.0,
        );

        $product_id = 0;
        $sku_map = platform_billing_plan_product_sku_map();
        $monthly_sku = sanitize_text_field((string) ($sku_map['monthly'][$plan_id] ?? ''));

        if ($monthly_sku !== '') {
            $product_id = platform_billing_get_product_id_by_sku($monthly_sku);
        }

        if ($product_id <= 0) {
            $product_id = platform_billing_get_product_id_for_plan($plan_id);
        }

        if ($product_id > 0 && function_exists('wc_get_product')) {
            $product = wc_get_product($product_id);
            if ($product && method_exists($product, 'get_price')) {
                $price = $product->get_price();
                if ($price !== '' && is_numeric($price) && is_finite((float) $price) && (float) $price >= 0) {
                    return (float) $price;
                }
            }
        }

        return isset($fallbacks[$plan_id]) ? (float) $fallbacks[$plan_id] : 0.0;
    }
}

if (!function_exists('platform_billing_get_plan_annual_price_ar')) {
    function platform_billing_get_plan_annual_price_ar($plan_id) {
        $plan_id = sanitize_key((string) $plan_id);
        $product_id = platform_billing_get_product_id_for_plan($plan_id, 'annual');
        $sku_map = platform_billing_plan_product_sku_map();
        $annual_sku = sanitize_text_field((string) ($sku_map['annual'][$plan_id] ?? ''));

        if ($product_id <= 0 && $annual_sku !== '') {
            $product_id = platform_billing_get_product_id_by_sku($annual_sku);
        }

        if ($product_id > 0 && function_exists('wc_get_product')) {
            $product = wc_get_product($product_id);
            if ($product && method_exists($product, 'get_price')) {
                $price = $product->get_price();
                if ($price !== '' && is_numeric($price) && is_finite((float) $price) && (float) $price >= 0) {
                    return (float) $price;
                }
            }
        }

        return null;
    }
}

if (!function_exists('platform_billing_get_plan_regular_price_ar')) {
    function platform_billing_get_plan_regular_price_ar($plan_id, $period) {
        $plan_id = sanitize_key((string) $plan_id);
        $period = platform_billing_normalize_billing_period($period);
        $sku_map = platform_billing_plan_product_sku_map();
        $product_id = $period === 'annual' ? platform_billing_get_product_id_for_plan($plan_id, 'annual') : 0;
        if (!$product_id) {
            $product_id = platform_billing_get_product_id_by_sku($sku_map[$period][$plan_id] ?? '');
        }
        if (!$product_id) {
            $product_id = platform_billing_get_product_id_for_plan($plan_id, $period);
        }
        $product = $product_id && function_exists('wc_get_product') ? wc_get_product($product_id) : false;
        if (!$product || !method_exists($product, 'get_regular_price')) return null;
        $price = $product->get_regular_price();
        return $price !== '' && is_numeric($price) && is_finite((float) $price) && (float) $price >= 0 ? (float) $price : null;
    }
}

if (!function_exists('platform_billing_get_plan_pricing_snapshot')) {
    function platform_billing_get_plan_pricing_snapshot($plan_id) {
        $plan_id = sanitize_key((string) $plan_id);
        $monthly_price = platform_billing_get_plan_monthly_price_ar($plan_id);
        $annual_gross_amount = round($monthly_price * 12, 2);
        $annual_final_amount = platform_billing_get_plan_annual_price_ar($plan_id);
        $annual_available = $annual_final_amount !== null && $annual_final_amount >= 0;
        $annual_savings_amount = $annual_available ? max(0.0, round($annual_gross_amount - (float) $annual_final_amount, 2)) : 0.0;
        $annual_savings_percent = ($annual_available && $annual_gross_amount > 0)
            ? (float) round(($annual_savings_amount / $annual_gross_amount) * 100, 2)
            : 0.0;

        return array(
            'planId' => $plan_id,
            'monthlyPriceAr' => $monthly_price,
            'monthlyRegularPriceAr' => platform_billing_get_plan_regular_price_ar($plan_id, 'monthly'),
            'annual' => array(
                'available' => (bool) $annual_available,
                'grossAmountAr' => $annual_gross_amount,
                'regularPriceAr' => platform_billing_get_plan_regular_price_ar($plan_id, 'annual'),
                'finalAmountAr' => $annual_available ? (float) $annual_final_amount : null,
                'savingsAmountAr' => $annual_savings_amount,
                'savingsPercent' => $annual_savings_percent,
            ),
        );
    }
}

if (!function_exists('platform_billing_get_subscription_pricing_config')) {
    function platform_billing_is_staging_site() {
        $host = strtolower((string) wp_parse_url(home_url('/'), PHP_URL_HOST));

        return in_array($host, array(
            'back.2424.mg',
            '2424-backoffice.mijary.com',
            'staging.2424.mg',
            'pre-prod.2424.mg',
            '2424.winfordcap.com',
        ), true);
    }

    function platform_billing_staging_subscription_bypass_enabled() {
        return platform_billing_is_staging_site()
            && (string) get_option('platform_2424_staging_subscription_bypass_enabled', 'no') === 'yes';
    }

    function platform_billing_activate_subscription_access($wp_user_id, $plan_id, $billing_period, $source = 'papi') {
        $wp_user_id = absint($wp_user_id);
        $plan_id = sanitize_key((string) $plan_id);
        $billing_period = platform_billing_normalize_billing_period($billing_period);

        if (!$wp_user_id || !in_array($plan_id, array('essentiel', 'business'), true)) {
            return new WP_Error('platform_billing_invalid_subscription_access', 'Acces abonnement invalide.', array('status' => 400));
        }

        $current_expiry = strtotime((string) get_user_meta($wp_user_id, '_platform_papi_renews_at', true));
        $base_timestamp = max(time(), $current_expiry ? $current_expiry : 0);
        $expiry = (new DateTimeImmutable('@' . $base_timestamp))
            ->modify($billing_period === 'annual' ? '+1 year' : '+1 month')
            ->getTimestamp();
        $started_at = gmdate('c', time());
        $renews_at = gmdate('c', $expiry);

        update_user_meta($wp_user_id, '_platform_papi_plan_id', $plan_id);
        update_user_meta($wp_user_id, '_platform_papi_status', 'active');
        update_user_meta($wp_user_id, '_platform_papi_billing_period', $billing_period);
        update_user_meta($wp_user_id, '_platform_papi_started_at', $started_at);
        update_user_meta($wp_user_id, '_platform_papi_renews_at', $renews_at);
        update_user_meta($wp_user_id, '_platform_papi_activation_source', sanitize_key((string) $source));

        return array(
            'ok' => true,
            'planId' => $plan_id,
            'billingPeriod' => $billing_period,
            'startedAt' => $started_at,
            'renewsAt' => $renews_at,
        );
    }

    function platform_billing_activate_staging_subscription_bypass($payload) {
        if (!platform_billing_staging_subscription_bypass_enabled()) {
            return new WP_Error('platform_billing_staging_bypass_disabled', 'Le bypass des abonnements est indisponible.', array('status' => 403));
        }

        $wp_user_id = absint($payload['wpUserId'] ?? 0);
        $plan_id = sanitize_key((string) ($payload['planId'] ?? ''));
        $billing_period = platform_billing_normalize_billing_period($payload['billingPeriod'] ?? 'monthly');
        $user = $wp_user_id ? get_userdata($wp_user_id) : false;

        if (!$user || !in_array($plan_id, array('essentiel', 'business'), true)) {
            return new WP_Error('platform_billing_staging_bypass_invalid', 'Demande d acces de test invalide.', array('status' => 400));
        }

        if (!function_exists('platform_auth_is_email_verified') || !platform_auth_is_email_verified($wp_user_id)
            || !function_exists('platform_auth_has_completed_onboarding') || !platform_auth_has_completed_onboarding($wp_user_id)) {
            return new WP_Error('platform_billing_staging_bypass_forbidden', 'Finalisez votre profil et verifiez votre email avant d activer cet acces.', array('status' => 403));
        }

        $pricing = platform_billing_get_subscription_pricing_config();
        if ($billing_period === 'annual' && empty($pricing['plans'][$plan_id]['annual']['available'])) {
            return new WP_Error('platform_billing_staging_bypass_annual_unavailable', 'Le tarif annuel n est pas disponible.', array('status' => 400));
        }

        $result = platform_billing_activate_subscription_access($wp_user_id, $plan_id, $billing_period, 'staging_bypass');
        if (!is_wp_error($result)) {
            platform_billing_log('Activated staging subscription bypass.', array(
                'source' => 'staging_bypass',
                'wpUserId' => $wp_user_id,
                'planId' => $plan_id,
                'billingPeriod' => $billing_period,
                'renewsAt' => $result['renewsAt'],
            ));
        }

        return $result;
    }

    function platform_billing_get_subscription_pricing_config() {
        return array(
            'generatedAt' => gmdate('c'),
            'stagingBypassAvailable' => platform_billing_staging_subscription_bypass_enabled(),
            'plans' => array(
                'free' => array(
                    'planId' => 'free',
                    'monthlyPriceAr' => 0.0,
                    'annual' => array(
                        'available' => false,
                        'grossAmountAr' => 0.0,
                        'finalAmountAr' => null,
                        'savingsAmountAr' => 0.0,
                        'savingsPercent' => 0.0,
                    ),
                ),
                'essentiel' => platform_billing_get_plan_pricing_snapshot('essentiel'),
                'business' => platform_billing_get_plan_pricing_snapshot('business'),
            ),
        );
    }
}

if (!function_exists('platform_billing_get_saved_stripe_customer_id')) {
    function platform_billing_get_saved_stripe_customer_id($wp_user_id) {
        $wp_user_id = absint($wp_user_id);
        if (!$wp_user_id) {
            return '';
        }

        return sanitize_text_field((string) get_user_meta($wp_user_id, '_platform_stripe_customer_id', true));
    }
}

if (!function_exists('platform_billing_save_stripe_customer_id')) {
    function platform_billing_save_stripe_customer_id($wp_user_id, $stripe_customer_id) {
        $wp_user_id = absint($wp_user_id);
        $stripe_customer_id = sanitize_text_field((string) $stripe_customer_id);

        if (!$wp_user_id || $stripe_customer_id === '') {
            return;
        }

        update_user_meta($wp_user_id, '_platform_stripe_customer_id', $stripe_customer_id);
    }
}

if (!function_exists('platform_billing_get_manual_override')) {
    function platform_billing_get_manual_override($wp_user_id) {
        $wp_user_id = absint($wp_user_id);
        if (!$wp_user_id) {
            return null;
        }

        $plan_id = sanitize_key((string) get_user_meta($wp_user_id, '_platform_manual_plan_id', true));
        $status = sanitize_key((string) get_user_meta($wp_user_id, '_platform_manual_status', true));

        if (!in_array($plan_id, platform_billing_valid_plan_ids(), true)) {
            return null;
        }

        if (!in_array($status, platform_billing_valid_statuses(), true)) {
            $status = $plan_id === 'free' ? 'none' : 'active';
        }

        if ($plan_id === 'free') {
            $status = 'none';
        }

        return array(
            'planId' => $plan_id,
            'status' => $status,
            'billingProvider' => 'local',
            'billingPeriod' => 'monthly',
            'renewsAt' => null,
            'startedAt' => null,
            'wcSubscriptionId' => null,
            'wcCustomerId' => $wp_user_id,
            'stripeCustomerId' => platform_billing_get_saved_stripe_customer_id($wp_user_id) ?: null,
        );
    }
}

if (!function_exists('platform_billing_get_mvola_snapshot')) {
    function platform_billing_get_mvola_snapshot($wp_user_id) {
        $wp_user_id = absint($wp_user_id);
        if (!$wp_user_id) {
            return null;
        }

        $plan_id = sanitize_key((string) get_user_meta($wp_user_id, '_platform_mvola_plan_id', true));
        if (!in_array($plan_id, array('essentiel', 'business'), true)) {
            return null;
        }

        $status = sanitize_key((string) get_user_meta($wp_user_id, '_platform_mvola_status', true));
        if (!in_array($status, array('active', 'failed', 'canceled', 'cancelled'), true)) {
            $status = 'active';
        }

        $renews_at = sanitize_text_field((string) get_user_meta($wp_user_id, '_platform_mvola_renews_at', true));
        $renews_ts = $renews_at !== '' ? strtotime($renews_at) : false;
        if ($renews_ts && $renews_ts < time()) {
            $status = 'canceled';
        }

        return array(
            'planId' => $plan_id,
            'status' => $status === 'active' ? 'active' : 'canceled',
            'billingProvider' => 'local',
            'billingPeriod' => platform_billing_normalize_billing_period(get_user_meta($wp_user_id, '_platform_mvola_billing_period', true)),
            'renewsAt' => $renews_at !== '' ? $renews_at : null,
            'startedAt' => sanitize_text_field((string) get_user_meta($wp_user_id, '_platform_mvola_started_at', true)) ?: null,
            'wcSubscriptionId' => null,
            'wcCustomerId' => $wp_user_id,
            'stripeCustomerId' => platform_billing_get_saved_stripe_customer_id($wp_user_id) ?: null,
        );
    }
}

if (!function_exists('platform_billing_get_papi_snapshot')) {
    function platform_billing_get_papi_snapshot($wp_user_id) {
        $wp_user_id = absint($wp_user_id);
        $plan_id = sanitize_key((string) get_user_meta($wp_user_id, '_platform_papi_plan_id', true));
        if (!in_array($plan_id, array('essentiel', 'business'), true)) {
            return null;
        }

        $renews_at = sanitize_text_field((string) get_user_meta($wp_user_id, '_platform_papi_renews_at', true));
        $renews_ts = $renews_at !== '' ? strtotime($renews_at) : false;
        $active = $renews_ts && $renews_ts > time();

        return array(
            'planId' => $active ? $plan_id : 'free',
            'status' => $active ? 'active' : 'none',
            'billingProvider' => get_user_meta($wp_user_id, '_platform_papi_activation_source', true) === 'zero_price' ? 'local' : 'papi',
            'billingPeriod' => platform_billing_normalize_billing_period(get_user_meta($wp_user_id, '_platform_papi_billing_period', true)),
            'renewsAt' => $renews_at !== '' ? $renews_at : null,
            'startedAt' => sanitize_text_field((string) get_user_meta($wp_user_id, '_platform_papi_started_at', true)) ?: null,
            'wcSubscriptionId' => null,
            'wcCustomerId' => $wp_user_id,
        );
    }
}

if (!function_exists('platform_billing_map_subscription_status')) {
    function platform_billing_map_subscription_status($status) {
        switch ((string) $status) {
            case 'active':
            case 'pending-cancel':
                return 'active';
            case 'pending':
            case 'trialing':
                return 'trialing';
            case 'on-hold':
                return 'past_due';
            case 'cancelled':
            case 'expired':
                return 'canceled';
            default:
                return 'none';
        }
    }
}

if (!function_exists('platform_billing_pick_best_subscription')) {
    function platform_billing_pick_best_subscription($subscriptions) {
        if (empty($subscriptions) || !is_array($subscriptions)) {
            return null;
        }

        $priority = array('active', 'pending-cancel', 'pending', 'trialing', 'on-hold', 'cancelled', 'expired');
        foreach ($priority as $status) {
            foreach ($subscriptions as $subscription) {
                if (method_exists($subscription, 'get_status') && $subscription->get_status() === $status) {
                    return $subscription;
                }
            }
        }

        return reset($subscriptions);
    }
}

if (!function_exists('platform_billing_subscription_belongs_to_user')) {
    function platform_billing_subscription_belongs_to_user($subscription, $wp_user_id) {
        $wp_user_id = absint($wp_user_id);
        if (!$subscription || !$wp_user_id) {
            return false;
        }

        if (method_exists($subscription, 'get_user_id')) {
            return absint($subscription->get_user_id()) === $wp_user_id;
        }

        if (method_exists($subscription, 'get_customer_id')) {
            return absint($subscription->get_customer_id()) === $wp_user_id;
        }

        return false;
    }
}

if (!function_exists('platform_billing_subscription_has_paid_plan')) {
    function platform_billing_subscription_has_paid_plan($subscription) {
        $plan_id = platform_billing_extract_subscription_plan($subscription);
        return in_array($plan_id, array('essentiel', 'business'), true);
    }
}

if (!function_exists('platform_billing_subscription_is_snapshot_eligible')) {
    function platform_billing_subscription_is_snapshot_eligible($subscription, $wp_user_id) {
        if (!platform_billing_subscription_belongs_to_user($subscription, $wp_user_id)) {
            return false;
        }

        if (!method_exists($subscription, 'get_status')) {
            return false;
        }

        if (!platform_billing_subscription_has_paid_plan($subscription)) {
            return false;
        }

        return in_array($subscription->get_status(), array('active', 'pending-cancel', 'trialing'), true);
    }
}

if (!function_exists('platform_billing_extract_subscription_plan')) {
    function platform_billing_extract_subscription_plan($subscription) {
        if (!$subscription) {
            return 'free';
        }

        if (method_exists($subscription, 'get_meta')) {
            $plan_id = sanitize_key((string) $subscription->get_meta('_platform_plan_id', true));
            if (in_array($plan_id, platform_billing_valid_plan_ids(), true) && $plan_id !== 'free') {
                return $plan_id;
            }
        }

        if (!method_exists($subscription, 'get_items')) {
            return 'free';
        }

        foreach ($subscription->get_items() as $item) {
            if (is_object($item) && method_exists($item, 'get_product_id')) {
                $product_id = absint($item->get_product_id());
                if ($product_id) {
                    return platform_billing_get_plan_id_for_product($product_id);
                }
            }
        }

        return 'free';
    }
}

if (!function_exists('platform_billing_get_subscription_snapshot')) {
    function platform_billing_user_has_all_privileges($wp_user_id) {
        return absint($wp_user_id) > 0
            && (string) get_user_meta(absint($wp_user_id), '_platform_all_privileges_enabled', true) === '1';
    }

    function platform_billing_get_all_privileges_snapshot($wp_user_id) {
        if (!platform_billing_user_has_all_privileges($wp_user_id)) {
            return null;
        }

        return array(
            'planId' => 'business',
            'status' => 'active',
            'billingProvider' => 'admin_grant',
            'billingPeriod' => 'monthly',
            'renewsAt' => null,
            'startedAt' => null,
            'wcSubscriptionId' => null,
            'wcCustomerId' => absint($wp_user_id),
            'stripeCustomerId' => platform_billing_get_saved_stripe_customer_id($wp_user_id) ?: null,
            'accessGrant' => 'all_privileges',
        );
    }

    function platform_billing_get_subscription_snapshot($wp_user_id) {
        $snapshot = platform_billing_default_snapshot();
        $wp_user_id = absint($wp_user_id);
        if (!$wp_user_id) {
            return $snapshot;
        }

        $snapshot['stripeCustomerId'] = platform_billing_get_saved_stripe_customer_id($wp_user_id) ?: null;

        $all_privileges_snapshot = platform_billing_get_all_privileges_snapshot($wp_user_id);
        if ($all_privileges_snapshot) {
            return $all_privileges_snapshot;
        }

        $manual_override = platform_billing_get_manual_override($wp_user_id);
        if ($manual_override) {
            platform_billing_log('Returning manual billing override for user snapshot.', array(
                'wpUserId' => $wp_user_id,
                'snapshot' => $manual_override,
            ));
            return $manual_override;
        }

        $papi_snapshot = platform_billing_get_papi_snapshot($wp_user_id);
        if ($papi_snapshot && ($papi_snapshot['status'] ?? 'none') === 'active') {
            return $papi_snapshot;
        }

        if (!function_exists('wcs_get_users_subscriptions')) {
            platform_billing_log('wcs_get_users_subscriptions unavailable while reading snapshot.', array('wpUserId' => $wp_user_id));
            $mvola_snapshot = platform_billing_get_mvola_snapshot($wp_user_id);
            return $mvola_snapshot ?: $snapshot;
        }

        $subscriptions = wcs_get_users_subscriptions($wp_user_id);
        if (function_exists('platform_2424_log_enabled') && platform_2424_log_enabled('info')) {
            platform_billing_log('Loaded raw WooCommerce subscriptions for snapshot.', array(
                'wpUserId' => $wp_user_id,
                'subscriptionCount' => is_array($subscriptions) ? count($subscriptions) : 0,
                'subscriptions' => array_map(function ($subscription) use ($wp_user_id) {
                    return array(
                        'id' => method_exists($subscription, 'get_id') ? absint($subscription->get_id()) : null,
                        'status' => method_exists($subscription, 'get_status') ? $subscription->get_status() : null,
                        'userId' => method_exists($subscription, 'get_user_id') ? absint($subscription->get_user_id()) : null,
                        'customerId' => method_exists($subscription, 'get_customer_id') ? absint($subscription->get_customer_id()) : null,
                        'planId' => platform_billing_extract_subscription_plan($subscription),
                        'eligibleForSnapshot' => platform_billing_subscription_is_snapshot_eligible($subscription, $wp_user_id),
                    );
                }, is_array($subscriptions) ? $subscriptions : array()),
            ));
        }

        $eligible_subscriptions = array();
        foreach ((array) $subscriptions as $subscription) {
            if (platform_billing_subscription_is_snapshot_eligible($subscription, $wp_user_id)) {
                $eligible_subscriptions[] = $subscription;
            }
        }

        $subscription = platform_billing_pick_best_subscription($eligible_subscriptions);
        if (!$subscription) {
            platform_billing_log('No eligible paid subscription found for user snapshot.', array(
                'wpUserId' => $wp_user_id,
                'subscriptionCount' => is_array($subscriptions) ? count($subscriptions) : 0,
            ));
            $mvola_snapshot = platform_billing_get_mvola_snapshot($wp_user_id);
            return $mvola_snapshot ?: $snapshot;
        }

        $snapshot['planId'] = platform_billing_extract_subscription_plan($subscription);
        $snapshot['status'] = platform_billing_map_subscription_status($subscription->get_status());
        $snapshot['billingPeriod'] = 'monthly';
        $snapshot['wcSubscriptionId'] = method_exists($subscription, 'get_id') ? absint($subscription->get_id()) : null;
        $snapshot['wcCustomerId'] = $wp_user_id;
        $snapshot['startedAt'] = method_exists($subscription, 'get_date_created') && $subscription->get_date_created() ? $subscription->get_date_created()->date('c') : null;
        $snapshot['renewsAt'] = method_exists($subscription, 'get_date') ? $subscription->get_date('next_payment') : null;

        if (method_exists($subscription, 'get_meta')) {
            $snapshot['billingPeriod'] = platform_billing_normalize_billing_period($subscription->get_meta('_platform_billing_period', true));
            $snapshot['stripeCustomerId'] = sanitize_text_field((string) $subscription->get_meta('_platform_stripe_customer_id', true)) ?: $snapshot['stripeCustomerId'];
        }

        if (empty($snapshot['renewsAt']) && method_exists($subscription, 'get_meta')) {
            $fallback = $subscription->get_meta('_platform_next_payment_date', true);
            if (!empty($fallback)) {
                $snapshot['renewsAt'] = $fallback;
            }
        }

        if (function_exists('platform_2424_log_enabled') && platform_2424_log_enabled('info')) {
            platform_billing_log('Returning WooCommerce subscription snapshot.', array(
                'wpUserId' => $wp_user_id,
                'snapshot' => $snapshot,
                'selectedSubscription' => array(
                    'id' => method_exists($subscription, 'get_id') ? absint($subscription->get_id()) : null,
                    'status' => method_exists($subscription, 'get_status') ? $subscription->get_status() : null,
                    'userId' => method_exists($subscription, 'get_user_id') ? absint($subscription->get_user_id()) : null,
                    'customerId' => method_exists($subscription, 'get_customer_id') ? absint($subscription->get_customer_id()) : null,
                    'planId' => platform_billing_extract_subscription_plan($subscription),
                ),
            ));
        }

        return $snapshot;
    }
}

if (!function_exists('platform_billing_render_user_plan_admin')) {
    function platform_billing_render_user_plan_admin($user) {
        if (!current_user_can('edit_users')) {
            return;
        }

        $user_id = absint($user->ID);
        $snapshot = platform_billing_get_subscription_snapshot($user_id);
        $manual_plan_id = sanitize_key((string) get_user_meta($user_id, '_platform_manual_plan_id', true));
        $manual_status = sanitize_key((string) get_user_meta($user_id, '_platform_manual_status', true));
        $directory_featured = (string) get_user_meta($user_id, '_platform_directory_business_featured', true) === '1';
        $directory_hidden_by_admin = (string) get_user_meta($user_id, '_platform_directory_hidden_by_admin', true) === '1';
        $all_privileges = platform_billing_user_has_all_privileges($user_id);
        $all_privileges_directory_visible = (string) get_user_meta($user_id, '_platform_all_privileges_directory_visible', true) === '1';
        ?>
        <h2>Abonnement 2424</h2>
        <table class="form-table" role="presentation">
            <tbody>
                <tr>
                    <th><label for="platform_all_privileges_enabled">Privilèges 2424</label></th>
                    <td>
                        <label for="platform_all_privileges_enabled">
                            <input type="checkbox" name="platform_all_privileges_enabled" id="platform_all_privileges_enabled" value="1" <?php checked($all_privileges); ?> />
                            Attribuer All privileges
                        </label>
                        <p class="description">Accès gratuit et révocable : droits Business, contenus, boosts et articles réservés, sans commande WooCommerce ni paiement PAPI.</p>
                        <label for="platform_all_privileges_directory_visible" style="display:block;margin-top:8px;<?php echo $all_privileges ? '' : 'opacity:.55;'; ?>">
                            <input type="checkbox" name="platform_all_privileges_directory_visible" id="platform_all_privileges_directory_visible" value="1" <?php checked($all_privileges_directory_visible); ?> <?php disabled(!$all_privileges); ?> />
                            Afficher dans l&apos;annuaire
                        </label>
                        <p class="description">Ce réglage administratif prime sur le plan minimum et sur la préférence de visibilité du compte tant que le privilège est actif.</p>
                        <script>
                        (function () {
                            var grant = document.getElementById('platform_all_privileges_enabled');
                            var directory = document.getElementById('platform_all_privileges_directory_visible');
                            if (!grant || !directory) return;
                            grant.addEventListener('change', function () { directory.disabled = !grant.checked; });
                        })();
                        </script>
                    </td>
                </tr>
                <tr>
                    <th><label>Plan actuel</label></th>
                    <td>
                        <strong><?php echo esc_html($snapshot['planId']); ?></strong>
                        <p class="description">
                            Statut: <?php echo esc_html($snapshot['status']); ?><br />
                            Source: <?php echo esc_html($snapshot['billingProvider']); ?>
                            <?php if (!empty($snapshot['wcSubscriptionId'])) : ?>
                                <br />Subscription WooCommerce: #<?php echo esc_html((string) $snapshot['wcSubscriptionId']); ?>
                            <?php endif; ?>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th><label for="platform_manual_plan_id">Forcer le plan</label></th>
                    <td>
                        <?php wp_nonce_field('platform_billing_save_user_plan', 'platform_billing_user_plan_nonce'); ?>
                        <select name="platform_manual_plan_id" id="platform_manual_plan_id">
                            <option value="">Suivre WooCommerce automatiquement</option>
                            <?php foreach (platform_billing_valid_plan_ids() as $plan_id) : ?>
                                <option value="<?php echo esc_attr($plan_id); ?>" <?php selected($manual_plan_id, $plan_id); ?>>
                                    <?php echo esc_html(ucfirst($plan_id)); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <p class="description">Permet a un administrateur de surcharger manuellement le plan visible dans le frontend.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="platform_manual_status">Statut force</label></th>
                    <td>
                        <select name="platform_manual_status" id="platform_manual_status">
                            <?php foreach (platform_billing_valid_statuses() as $status) : ?>
                                <option value="<?php echo esc_attr($status); ?>" <?php selected($manual_status ?: 'none', $status); ?>>
                                    <?php echo esc_html($status); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <p class="description">Si aucun plan n'est force mais qu'un statut est choisi, le plugin reutilise automatiquement le plan actuel de l'utilisateur. Pour le plan free, le statut sera toujours none.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="platform_directory_business_featured">Annuaire Business</label></th>
                    <td>
                        <label for="platform_directory_business_featured">
                            <input type="checkbox" name="platform_directory_business_featured" id="platform_directory_business_featured" value="1" <?php checked($directory_featured); ?> />
                            Mettre ce compte Business en avant dans l'annuaire
                        </label>
                        <p class="description">Les comptes Business actifs apparaissent automatiquement dans l'annuaire. Cette option les remonte aussi dans la zone mise en avant du frontend.</p>
                        <label for="platform_directory_hidden_by_admin" style="display:block;margin-top:8px;">
                            <input type="checkbox" name="platform_directory_hidden_by_admin" id="platform_directory_hidden_by_admin" value="1" <?php checked($directory_hidden_by_admin); ?> />
                            Masquer ce profil de l&apos;annuaire
                        </label>
                        <p class="description">Priorité administrative : le profil reste masqué, y compris avec un abonnement Business ou All privileges, jusqu&apos;à ce que cette case soit décochée.</p>
                    </td>
                </tr>
            </tbody>
        </table>
        <?php
    }
}

if (!function_exists('platform_billing_save_user_plan_admin')) {
    function platform_billing_save_user_plan_admin($user_id) {
        $user_id = absint($user_id);

        if (!$user_id || !current_user_can('edit_user', $user_id) || !current_user_can('edit_users')) {
            return;
        }

        $nonce = isset($_POST['platform_billing_user_plan_nonce']) ? sanitize_text_field(wp_unslash($_POST['platform_billing_user_plan_nonce'])) : '';
        if (!$nonce || !wp_verify_nonce($nonce, 'platform_billing_save_user_plan')) {
            return;
        }

        $manual_plan_id = isset($_POST['platform_manual_plan_id']) ? sanitize_key(wp_unslash($_POST['platform_manual_plan_id'])) : '';
        $manual_status = isset($_POST['platform_manual_status']) ? sanitize_key(wp_unslash($_POST['platform_manual_status'])) : 'none';
        $directory_featured = !empty($_POST['platform_directory_business_featured']) ? '1' : '';
        $directory_hidden_by_admin = !empty($_POST['platform_directory_hidden_by_admin']) ? '1' : '';
        $all_privileges = !empty($_POST['platform_all_privileges_enabled']) ? '1' : '';
        $all_privileges_directory_visible = !empty($_POST['platform_all_privileges_directory_visible']) ? '1' : '';

        if ($all_privileges === '1') {
            update_user_meta($user_id, '_platform_all_privileges_enabled', '1');
            if ($all_privileges_directory_visible === '1') {
                update_user_meta($user_id, '_platform_all_privileges_directory_visible', '1');
            } else {
                delete_user_meta($user_id, '_platform_all_privileges_directory_visible');
            }
        } else {
            delete_user_meta($user_id, '_platform_all_privileges_enabled');
            delete_user_meta($user_id, '_platform_all_privileges_directory_visible');
        }

        if ($directory_featured === '') {
            delete_user_meta($user_id, '_platform_directory_business_featured');
        } else {
            update_user_meta($user_id, '_platform_directory_business_featured', '1');
        }

        if ($directory_hidden_by_admin === '') {
            delete_user_meta($user_id, '_platform_directory_hidden_by_admin');
        } else {
            update_user_meta($user_id, '_platform_directory_hidden_by_admin', '1');
        }

        if ($manual_plan_id === '' && $manual_status === 'none') {
            delete_user_meta($user_id, '_platform_manual_plan_id');
            delete_user_meta($user_id, '_platform_manual_status');
            platform_billing_log('Cleared manual billing override from admin.', array('wpUserId' => $user_id));
            return;
        }

        if ($manual_plan_id === '' && $manual_status !== 'none') {
            $snapshot = platform_billing_get_subscription_snapshot($user_id);
            $derived_plan_id = sanitize_key((string) ($snapshot['planId'] ?? ''));
            if (in_array($derived_plan_id, platform_billing_valid_plan_ids(), true)) {
                $manual_plan_id = $derived_plan_id;
            }
        }

        if (!in_array($manual_plan_id, platform_billing_valid_plan_ids(), true)) {
            return;
        }

        if (!in_array($manual_status, platform_billing_valid_statuses(), true)) {
            $manual_status = $manual_plan_id === 'free' ? 'none' : 'active';
        }

        if ($manual_plan_id === 'free') {
            $manual_status = 'none';
        }

        update_user_meta($user_id, '_platform_manual_plan_id', $manual_plan_id);
        update_user_meta($user_id, '_platform_manual_status', $manual_status);

        platform_billing_log('Saved manual billing override from admin.', array(
            'wpUserId' => $user_id,
            'planId' => $manual_plan_id,
            'status' => $manual_status,
            'accessGrant' => $all_privileges === '1' ? 'all_privileges' : null,
        ));
    }
}

if (!function_exists('platform_billing_find_subscription_by_stripe_id')) {
    function platform_billing_find_subscription_by_stripe_id($stripe_subscription_id) {
        $stripe_subscription_id = trim((string) $stripe_subscription_id);
        if ($stripe_subscription_id === '') {
            return null;
        }

        $posts = get_posts(array(
            'post_type' => 'shop_subscription',
            'post_status' => 'any',
            'posts_per_page' => 1,
            'fields' => 'ids',
            'meta_query' => array(
                array(
                    'key' => '_platform_stripe_subscription_id',
                    'value' => $stripe_subscription_id,
                ),
            ),
        ));

        if (empty($posts)) {
            return null;
        }

        return wcs_get_subscription((int) $posts[0]);
    }
}

if (!function_exists('platform_billing_find_order_by_checkout_session')) {
    function platform_billing_find_order_by_checkout_session($checkout_session_id) {
        $checkout_session_id = trim((string) $checkout_session_id);
        if ($checkout_session_id === '') {
            return null;
        }

        $orders = wc_get_orders(array(
            'limit' => 1,
            'meta_key' => '_platform_stripe_checkout_session_id',
            'meta_value' => $checkout_session_id,
            'orderby' => 'date',
            'order' => 'DESC',
        ));

        if (empty($orders)) {
            return null;
        }

        return $orders[0];
    }
}

if (!function_exists('platform_billing_find_order_by_subscription_id')) {
    function platform_billing_find_order_by_subscription_id($stripe_subscription_id) {
        $stripe_subscription_id = trim((string) $stripe_subscription_id);
        if ($stripe_subscription_id === '') {
            return null;
        }

        $orders = wc_get_orders(array(
            'limit' => 1,
            'meta_key' => '_platform_stripe_subscription_id',
            'meta_value' => $stripe_subscription_id,
            'orderby' => 'date',
            'order' => 'DESC',
        ));

        if (empty($orders)) {
            return null;
        }

        return $orders[0];
    }
}

if (!function_exists('platform_billing_get_directory_business_admin_accounts')) {
    function platform_billing_get_directory_business_admin_accounts() {
        $users = get_users(array(
            'orderby' => 'display_name',
            'order' => 'ASC',
            'fields' => 'all',
        ));

        $items = array();

        foreach ($users as $user) {
            if (!$user instanceof WP_User) {
                continue;
            }

            if (
                function_exists('platform_submissions_is_business_user_visible_in_directory') &&
                !platform_submissions_is_business_user_visible_in_directory($user->ID)
            ) {
                continue;
            }

            $snapshot = platform_billing_get_subscription_snapshot($user->ID);

            $items[] = array(
                'userId' => absint($user->ID),
                'displayName' => $user->display_name !== '' ? $user->display_name : $user->user_login,
                'email' => sanitize_email($user->user_email),
                'phone' => sanitize_text_field((string) get_user_meta($user->ID, 'phone', true)),
                'address' => sanitize_text_field((string) get_user_meta($user->ID, 'address', true)),
                'businessActivityCategory' => sanitize_text_field((string) get_user_meta($user->ID, 'business_activity_category', true)),
                'planId' => sanitize_key((string) ($snapshot['planId'] ?? 'free')),
                'featured' => (string) get_user_meta($user->ID, '_platform_directory_business_featured', true) === '1',
                'status' => sanitize_key((string) ($snapshot['status'] ?? 'none')),
            );
        }

        return $items;
    }
}

if (!function_exists('platform_billing_render_directory_business_status_badge')) {
    function platform_billing_render_directory_business_status_badge($label, $background, $text) {
        return sprintf(
            '<span style="display:inline-flex;align-items:center;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:600;background:%1$s;color:%2$s;">%3$s</span>',
            esc_attr($background),
            esc_attr($text),
            esc_html($label)
        );
    }
}

if (!function_exists('platform_billing_handle_directory_business_admin_actions')) {
    function platform_billing_handle_directory_business_admin_actions() {
        if (!is_admin() || !current_user_can('edit_users')) {
            return;
        }

        if (!isset($_POST['platform_directory_business_admin_action'])) {
            return;
        }

        $action = sanitize_key((string) wp_unslash($_POST['platform_directory_business_admin_action']));
        if ($action !== 'toggle_featured') {
            return;
        }

        check_admin_referer('platform_directory_business_admin_action');

        $user_id = isset($_POST['platform_directory_business_user_id']) ? absint($_POST['platform_directory_business_user_id']) : 0;
        if ($user_id <= 0) {
            return;
        }

        $snapshot = platform_billing_get_subscription_snapshot($user_id);
        if (($snapshot['planId'] ?? 'free') !== 'business' || !in_array((string) ($snapshot['status'] ?? 'none'), array('active', 'trialing'), true)) {
            return;
        }

        $should_feature = !empty($_POST['platform_directory_business_featured']);
        if ($should_feature) {
            update_user_meta($user_id, '_platform_directory_business_featured', '1');
        } else {
            delete_user_meta($user_id, '_platform_directory_business_featured');
        }

        $redirect_url = add_query_arg(array(
            'post_type' => 'annuaire',
            'page' => 'platform-directory-business-accounts',
            'updated' => '1',
        ), admin_url('edit.php'));
        wp_safe_redirect($redirect_url);
        exit;
    }
}

add_action('admin_init', 'platform_billing_handle_directory_business_admin_actions');

if (!function_exists('platform_billing_register_directory_business_admin_page')) {
    function platform_billing_register_directory_business_admin_page() {
        add_submenu_page(
            'edit.php?post_type=annuaire',
            'Comptes premium',
            'Comptes premium',
            'edit_users',
            'platform-directory-business-accounts',
            'platform_billing_render_directory_business_admin_page'
        );
    }
}

add_action('admin_menu', 'platform_billing_register_directory_business_admin_page');

if (!function_exists('platform_billing_render_directory_business_admin_page')) {
    function platform_billing_render_directory_business_admin_page() {
        if (!current_user_can('edit_users')) {
            wp_die(esc_html__('Vous n’avez pas les droits pour accéder à cette page.', '2424-platform'));
        }

        $accounts = platform_billing_get_directory_business_admin_accounts();
        $minimum_plan = function_exists('platform_submissions_get_directory_minimum_plan')
            ? platform_submissions_get_directory_minimum_plan()
            : 'essentiel';
        $minimum_plan_label = array(
            'free' => 'Free et supérieur',
            'essentiel' => 'Essentiel et Business',
            'business' => 'Business uniquement',
        )[$minimum_plan] ?? 'Essentiel et Business';
        ?>
        <div class="wrap">
            <h1>Comptes affiches dans l'annuaire</h1>
            <p>Seuil actuel : <strong><?php echo esc_html($minimum_plan_label); ?></strong>. Cette vue est en lecture seule pour les informations du compte. Seule l'option de mise en avant peut etre ajustee ici.</p>

            <?php if (isset($_GET['updated']) && (string) $_GET['updated'] === '1') : ?>
                <div class="notice notice-success is-dismissible"><p>Mise en avant annuaire mise a jour.</p></div>
            <?php endif; ?>

            <?php if (empty($accounts)) : ?>
                <div class="notice notice-info"><p>Aucun compte éligible visible dans l'annuaire pour le moment.</p></div>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th style="width:70px;">ID</th>
                            <th>Entreprise / compte</th>
                            <th>Coordonnees</th>
                            <th>Categorie d'activite</th>
                            <th>Formule</th>
                            <th>Statut</th>
                            <th style="width:220px;">Mise en avant</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($accounts as $account) : ?>
                            <tr>
                                <td><?php echo esc_html((string) $account['userId']); ?></td>
                                <td>
                                    <strong><?php echo esc_html((string) $account['displayName']); ?></strong><br />
                                    <a href="<?php echo esc_url(get_edit_user_link($account['userId'])); ?>">Ouvrir le profil utilisateur</a>
                                </td>
                                <td>
                                    <?php if (!empty($account['email'])) : ?>
                                        <div><strong>Email:</strong> <?php echo esc_html((string) $account['email']); ?></div>
                                    <?php endif; ?>
                                    <?php if (!empty($account['phone'])) : ?>
                                        <div><strong>Telephone:</strong> <?php echo esc_html((string) $account['phone']); ?></div>
                                    <?php endif; ?>
                                    <?php if (!empty($account['address'])) : ?>
                                        <div><strong>Adresse:</strong> <?php echo esc_html((string) $account['address']); ?></div>
                                    <?php endif; ?>
                                    <?php if (empty($account['email']) && empty($account['phone']) && empty($account['address'])) : ?>
                                        <span style="color:#9ca3af;">Aucune information de contact</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php echo $account['businessActivityCategory'] !== '' ? esc_html((string) $account['businessActivityCategory']) : '<span style="color:#9ca3af;">Non renseignee</span>'; ?>
                                </td>
                                <td><?php echo esc_html(($account['planId'] ?? '') === 'business' ? 'Business' : 'Essentiel'); ?></td>
                                <td>
                                    <?php
                                    echo $account['status'] === 'active'
                                        ? platform_billing_render_directory_business_status_badge('Actif', '#ecfdf3', '#027a48')
                                        : platform_billing_render_directory_business_status_badge('Essai', '#eff6ff', '#1d4ed8');
                                    ?>
                                </td>
                                <td>
                                    <form method="post" action="">
                                        <?php wp_nonce_field('platform_directory_business_admin_action'); ?>
                                        <input type="hidden" name="platform_directory_business_admin_action" value="toggle_featured" />
                                        <input type="hidden" name="platform_directory_business_user_id" value="<?php echo esc_attr((string) $account['userId']); ?>" />
                                        <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                                            <input type="checkbox" name="platform_directory_business_featured" value="1" <?php checked(!empty($account['featured'])); ?> />
                                            <span>Mettre en avant dans l'annuaire</span>
                                        </label>
                                        <button type="submit" class="button button-secondary">Enregistrer</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        <?php
    }
}

if (!function_exists('platform_billing_build_sync_lock_name')) {
    function platform_billing_build_sync_lock_name($checkout_session_id, $stripe_subscription_id) {
        $checkout_session_id = trim((string) $checkout_session_id);
        $stripe_subscription_id = trim((string) $stripe_subscription_id);

        if ($stripe_subscription_id !== '') {
            return '_platform_billing_sync_lock_subscription_' . md5($stripe_subscription_id);
        }

        return '_platform_billing_sync_lock_checkout_' . md5($checkout_session_id);
    }
}

if (!function_exists('platform_billing_acquire_sync_lock')) {
    function platform_billing_acquire_sync_lock($checkout_session_id, $stripe_subscription_id, $max_attempts = 40, $delay_us = 250000) {
        $lock_name = platform_billing_build_sync_lock_name($checkout_session_id, $stripe_subscription_id);
        $token = wp_generate_uuid4();

        for ($attempt = 1; $attempt <= (int) $max_attempts; $attempt++) {
            $payload = wp_json_encode(array(
                'token' => $token,
                'createdAt' => time(),
            ));

            if (add_option($lock_name, $payload, '', 'no')) {
                return array(
                    'name' => $lock_name,
                    'token' => $token,
                );
            }

            $raw = get_option($lock_name, '');
            $parsed = json_decode((string) $raw, true);
            $created_at = isset($parsed['createdAt']) ? absint($parsed['createdAt']) : 0;
            if ($created_at > 0 && (time() - $created_at) > 120) {
                delete_option($lock_name);
                continue;
            }

            usleep((int) $delay_us);
        }

        return null;
    }
}

if (!function_exists('platform_billing_get_existing_sync_result')) {
    function platform_billing_get_existing_sync_result($plan_id, $stripe_status, $checkout_session_id, $stripe_subscription_id) {
        $existing_order = $checkout_session_id ? platform_billing_find_order_by_checkout_session($checkout_session_id) : null;
        if (!$existing_order && $stripe_subscription_id) {
            $existing_order = platform_billing_find_order_by_subscription_id($stripe_subscription_id);
        }

        $existing_subscription = $stripe_subscription_id ? platform_billing_find_subscription_by_stripe_id($stripe_subscription_id) : null;

        if (!$existing_order && !$existing_subscription) {
            return null;
        }

        return array(
            'orderId' => $existing_order ? $existing_order->get_id() : null,
            'subscriptionId' => $existing_subscription && method_exists($existing_subscription, 'get_id') ? $existing_subscription->get_id() : null,
            'planId' => $plan_id,
            'status' => $existing_subscription && method_exists($existing_subscription, 'get_status')
                ? platform_billing_map_subscription_status($existing_subscription->get_status())
                : platform_billing_map_subscription_status($stripe_status),
        );
    }
}

if (!function_exists('platform_billing_release_sync_lock')) {
    function platform_billing_release_sync_lock($lock) {
        if (!is_array($lock) || empty($lock['name']) || empty($lock['token'])) {
            return;
        }

        $raw = get_option((string) $lock['name'], '');
        $parsed = json_decode((string) $raw, true);
        $current_token = isset($parsed['token']) ? (string) $parsed['token'] : '';
        if ($current_token === (string) $lock['token']) {
            delete_option((string) $lock['name']);
        }
    }
}

if (!function_exists('platform_billing_build_next_payment_date')) {
    function platform_billing_build_next_payment_date($billing_period = 'monthly') {
        $billing_period = platform_billing_normalize_billing_period($billing_period);
        try {
            $next = new DateTime('now', wp_timezone());
            $next->modify($billing_period === 'annual' ? '+1 year' : '+1 month');
            return $next->format('Y-m-d H:i:s');
        } catch (Exception $exception) {
            return gmdate('Y-m-d H:i:s', strtotime($billing_period === 'annual' ? '+1 year' : '+1 month'));
        }
    }
}

if (!function_exists('platform_billing_normalize_next_payment_date')) {
    function platform_billing_normalize_next_payment_date($value) {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        try {
            $date = new DateTime($value);
            return $date->setTimezone(wp_timezone())->format('Y-m-d H:i:s');
        } catch (Exception $exception) {
            return '';
        }
    }
}

if (!function_exists('platform_billing_apply_meta_to_order')) {
    function platform_billing_apply_meta_to_order(WC_Order $order, $payload, $plan_id) {
        $billing_period = platform_billing_normalize_billing_period($payload['billingPeriod'] ?? 'monthly');
        $order->update_meta_data('_platform_plan_id', sanitize_key($plan_id));
        $order->update_meta_data('_platform_billing_period', $billing_period);
        $order->update_meta_data('_platform_stripe_checkout_session_id', sanitize_text_field((string) ($payload['stripeCheckoutSessionId'] ?? '')));
        $order->update_meta_data('_platform_stripe_customer_id', sanitize_text_field((string) ($payload['stripeCustomerId'] ?? '')));
        $order->update_meta_data('_platform_stripe_subscription_id', sanitize_text_field((string) ($payload['stripeSubscriptionId'] ?? '')));
        $order->update_meta_data('_platform_stripe_payment_intent_id', sanitize_text_field((string) ($payload['stripePaymentIntentId'] ?? '')));
        $order->update_meta_data('_platform_stripe_price_id', sanitize_text_field((string) ($payload['stripePriceId'] ?? '')));
        $order->update_meta_data('_platform_stripe_product_id', sanitize_text_field((string) ($payload['stripeProductId'] ?? '')));
        $order->update_meta_data('_platform_stripe_status', sanitize_text_field((string) ($payload['stripeStatus'] ?? '')));
    }
}

if (!function_exists('platform_billing_apply_meta_to_subscription')) {
    function platform_billing_apply_meta_to_subscription($subscription, $payload, $plan_id) {
        if (!$subscription || !method_exists($subscription, 'update_meta_data')) {
            return;
        }

        $billing_period = platform_billing_normalize_billing_period($payload['billingPeriod'] ?? 'monthly');
        $subscription->update_meta_data('_platform_plan_id', sanitize_key($plan_id));
        $subscription->update_meta_data('_platform_billing_period', $billing_period);
        $subscription->update_meta_data('_platform_stripe_checkout_session_id', sanitize_text_field((string) ($payload['stripeCheckoutSessionId'] ?? '')));
        $subscription->update_meta_data('_platform_stripe_customer_id', sanitize_text_field((string) ($payload['stripeCustomerId'] ?? '')));
        $subscription->update_meta_data('_platform_stripe_subscription_id', sanitize_text_field((string) ($payload['stripeSubscriptionId'] ?? '')));
        $subscription->update_meta_data('_platform_stripe_price_id', sanitize_text_field((string) ($payload['stripePriceId'] ?? '')));
        $subscription->update_meta_data('_platform_stripe_product_id', sanitize_text_field((string) ($payload['stripeProductId'] ?? '')));
        $subscription->update_meta_data('_platform_stripe_status', sanitize_text_field((string) ($payload['stripeStatus'] ?? '')));

        $next_payment_date = platform_billing_normalize_next_payment_date($payload['stripeCurrentPeriodEnd'] ?? '');
        if ($next_payment_date) {
            $subscription->update_meta_data('_platform_next_payment_date', $next_payment_date);
        }
    }
}

if (!function_exists('platform_billing_format_history_item')) {
    function platform_billing_format_history_item(WC_Order $order) {
        $created_at = $order->get_date_created();
        $paid_at = $order->get_date_paid();
        $plan_id = sanitize_key((string) $order->get_meta('_platform_plan_id', true));
        $billing_period = platform_billing_normalize_billing_period($order->get_meta('_platform_billing_period', true));
        if (!$plan_id) {
            foreach ($order->get_items() as $item) {
                if (method_exists($item, 'get_product_id')) {
                    $plan_id = platform_billing_get_plan_id_for_product((int) $item->get_product_id());
                    break;
                }
            }
        }

        return array(
            'orderId' => (int) $order->get_id(),
            'orderNumber' => (string) $order->get_order_number(),
            'planId' => $plan_id ?: 'free',
            'billingPeriod' => $billing_period,
            'status' => (string) $order->get_status(),
            'total' => (float) $order->get_total(),
            'currency' => (string) $order->get_currency(),
            'paymentMethod' => (string) $order->get_payment_method(),
            'paymentMethodLabel' => (string) ($order->get_payment_method_title() ?: 'Paiement'),
            'createdAt' => $created_at ? $created_at->date('c') : null,
            'paidAt' => $paid_at ? $paid_at->date('c') : null,
            'transactionId' => (string) ($order->get_transaction_id() ?: ''),
            'invoiceUrl' => null,
        );
    }
}

if (!function_exists('platform_billing_get_history')) {
    function platform_billing_get_history($wp_user_id) {
        $wp_user_id = absint($wp_user_id);
        if (!$wp_user_id) {
            return array();
        }

        $orders = wc_get_orders(array(
            'customer_id' => $wp_user_id,
            'limit' => 20,
            'orderby' => 'date',
            'order' => 'DESC',
        ));

        $items = array();
        foreach ($orders as $order) {
            if (!$order || !is_a($order, 'WC_Order')) {
                continue;
            }
            $items[] = platform_billing_format_history_item($order);
        }

        return $items;
    }
}

if (!function_exists('platform_billing_sync_stripe_subscription')) {
    function platform_billing_sync_stripe_subscription($payload) {
        if (!class_exists('WooCommerce')) {
            platform_billing_log('WooCommerce missing during Stripe sync.');
            return new WP_Error('platform_billing_wc_missing', 'WooCommerce is not active.', array('status' => 500));
        }

        if (!function_exists('wcs_create_subscription')) {
            platform_billing_log('wcs_create_subscription unavailable during Stripe sync.');
            return new WP_Error('platform_billing_wcs_missing', 'WooCommerce Subscriptions is not active.', array('status' => 500));
        }

        $wp_user_id = absint($payload['wpUserId'] ?? 0);
        $plan_id = sanitize_key((string) ($payload['planId'] ?? ''));
        $billing_period = platform_billing_normalize_billing_period($payload['billingPeriod'] ?? 'monthly');
        $product_id = platform_billing_resolve_product_id($plan_id, $payload);
        $checkout_session_id = sanitize_text_field((string) ($payload['stripeCheckoutSessionId'] ?? ''));
        $stripe_subscription_id = sanitize_text_field((string) ($payload['stripeSubscriptionId'] ?? ''));
        $stripe_status = sanitize_text_field((string) ($payload['stripeStatus'] ?? 'active'));
        $next_payment_date = platform_billing_normalize_next_payment_date($payload['stripeCurrentPeriodEnd'] ?? '');

        if (!$wp_user_id || ($checkout_session_id === '' && $stripe_subscription_id === '')) {
            platform_billing_log('Invalid Stripe sync payload.', array(
                'wpUserId' => $wp_user_id,
                'planId' => $plan_id,
                'productId' => $product_id,
                'checkoutSessionId' => $checkout_session_id,
                'stripeSubscriptionId' => $stripe_subscription_id,
            ));
            return new WP_Error('platform_billing_invalid_payload', 'Missing Stripe billing payload.', array('status' => 400));
        }

        if (!$product_id) {
            platform_billing_log('Stripe sync product is not configured.', array(
                'planId' => $plan_id,
                'billingPeriod' => $billing_period,
                'productSku' => sanitize_text_field((string) ($payload['wpProductSku'] ?? '')),
            ));
            return new WP_Error('platform_billing_product_not_configured', 'Aucun produit WooCommerce ne correspond a cette formule.', array('status' => 422));
        }

        $user = get_user_by('id', $wp_user_id);
        if (!$user) {
            platform_billing_log('Unknown WordPress user during Stripe sync.', array('wpUserId' => $wp_user_id));
            return new WP_Error('platform_billing_unknown_user', 'Unknown WordPress user.', array('status' => 404));
        }

        if (!empty($payload['stripeCustomerId'])) {
            platform_billing_save_stripe_customer_id($wp_user_id, $payload['stripeCustomerId']);
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            platform_billing_log('Unknown WooCommerce product during Stripe sync.', array(
                'planId' => $plan_id,
                'productId' => $product_id,
                'productSku' => sanitize_text_field((string) ($payload['wpProductSku'] ?? '')),
                'payloadProductId' => absint($payload['wpProductId'] ?? 0),
            ));
            return new WP_Error('platform_billing_unknown_product', 'Unknown WooCommerce product.', array('status' => 404));
        }

        $annual_final_amount = $billing_period === 'annual' ? (float) ($payload['amountTotal'] ?? 0) : 0.0;

        $sync_lock = platform_billing_acquire_sync_lock($checkout_session_id, $stripe_subscription_id);
        if (!$sync_lock) {
            for ($attempt = 1; $attempt <= 12; $attempt++) {
                $existing_result = platform_billing_get_existing_sync_result(
                    $plan_id,
                    $stripe_status,
                    $checkout_session_id,
                    $stripe_subscription_id
                );

                if ($existing_result) {
                    return $existing_result;
                }

                usleep(250000);
            }

            platform_billing_log('Stripe sync lock timeout.', array(
                'planId' => $plan_id,
                'checkoutSessionId' => $checkout_session_id,
                'stripeSubscriptionId' => $stripe_subscription_id,
            ));
            return new WP_Error('platform_billing_sync_lock_timeout', 'Stripe sync already in progress.', array('status' => 409));
        }

        try {
            $subscription = $stripe_subscription_id ? platform_billing_find_subscription_by_stripe_id($stripe_subscription_id) : null;
            $order = $checkout_session_id ? platform_billing_find_order_by_checkout_session($checkout_session_id) : null;
            if (!$order && $checkout_session_id === '' && $stripe_subscription_id) {
                $order = platform_billing_find_order_by_subscription_id($stripe_subscription_id);
            }

            platform_billing_log('Preparing Stripe sync in WordPress.', array(
                'wpUserId' => $wp_user_id,
                'planId' => $plan_id,
                'stripeSubscriptionId' => $stripe_subscription_id,
                'stripeStatus' => $stripe_status,
                'checkoutSessionId' => $checkout_session_id,
                'existingOrderId' => $order ? $order->get_id() : null,
                'existingSubscriptionId' => $subscription && method_exists($subscription, 'get_id') ? $subscription->get_id() : null,
            ));

            if (!$order) {
                $order = wc_create_order(array(
                    'customer_id' => $wp_user_id,
                    'created_via' => '2424-nextjs-stripe',
                ));

                if (is_wp_error($order)) {
                    platform_billing_log('Order creation failed.', array('message' => $order->get_error_message()));
                    return $order;
                }

                $order->set_currency(strtoupper((string) ($payload['currency'] ?? 'MGA')));
                $order->add_product($product, 1);
            }

            platform_billing_apply_meta_to_order($order, $payload, $plan_id);
            $order->set_customer_id($wp_user_id);
            $order->set_billing_email($user->user_email);
            $order->set_billing_first_name($user->first_name);
            $order->set_billing_last_name($user->last_name);
            $order->set_payment_method('stripe_headless');
            $order->set_payment_method_title('Stripe');
            if (!empty($payload['stripePaymentIntentId'])) {
                $order->set_transaction_id((string) $payload['stripePaymentIntentId']);
            }
            $order->calculate_totals(false);
            if ($billing_period === 'annual' && $annual_final_amount > 0) {
                foreach ($order->get_items('line_item') as $item) {
                    if (method_exists($item, 'set_subtotal')) {
                        $item->set_subtotal($annual_final_amount);
                    }
                    if (method_exists($item, 'set_total')) {
                        $item->set_total($annual_final_amount);
                    }
                    $item->save();
                }
                $order->set_total($annual_final_amount);
            }

            if (in_array($stripe_status, array('active', 'trialing'), true)) {
                $order->payment_complete($payload['stripePaymentIntentId'] ?? '');
                if (!$order->has_status(array('completed'))) {
                    $order->set_status('completed');
                    $order->save();
                }
            } elseif (in_array($stripe_status, array('canceled', 'cancelled', 'unpaid', 'incomplete_expired'), true)) {
                $order->set_status('cancelled');
                $order->save();
            } else {
                $order->set_status('on-hold');
                $order->save();
            }

            if (!$subscription) {
                $subscription = wcs_create_subscription(array(
                    'order_id' => $order->get_id(),
                    'customer_id' => $wp_user_id,
                    'status' => 'active',
                    'billing_period' => $billing_period === 'annual' ? 'year' : 'month',
                    'billing_interval' => 1,
                    'start_date' => current_time('mysql', true),
                    'next_payment_date' => $next_payment_date ?: platform_billing_build_next_payment_date($billing_period),
                ));

                if (is_wp_error($subscription)) {
                    platform_billing_log('Subscription creation failed.', array(
                        'message' => $subscription->get_error_message(),
                        'orderId' => $order->get_id(),
                        'wpUserId' => $wp_user_id,
                        'planId' => $plan_id,
                    ));
                    return $subscription;
                }

                $subscription->add_product($product, 1);
            }

            platform_billing_apply_meta_to_subscription($subscription, $payload, $plan_id);
            $subscription->set_customer_id($wp_user_id);

            if ($next_payment_date && method_exists($subscription, 'update_dates')) {
                try {
                    $subscription->update_dates(array('next_payment' => $next_payment_date));
                } catch (Exception $exception) {
                    platform_billing_log('Subscription next payment date update failed.', array('message' => $exception->getMessage()));
                    $subscription->update_meta_data('_platform_next_payment_date', $next_payment_date);
                }
            }

            if (in_array($stripe_status, array('active', 'trialing'), true)) {
                $subscription->set_status('active');
            } elseif (in_array($stripe_status, array('canceled', 'cancelled', 'unpaid', 'incomplete_expired'), true)) {
                $subscription->set_status('cancelled');
            } else {
                $subscription->set_status('on-hold');
            }

            $subscription->calculate_totals(false);
            if ($billing_period === 'annual' && $annual_final_amount > 0) {
                foreach ($subscription->get_items() as $item) {
                    if (method_exists($item, 'set_subtotal')) {
                        $item->set_subtotal($annual_final_amount);
                    }
                    if (method_exists($item, 'set_total')) {
                        $item->set_total($annual_final_amount);
                    }
                    $item->save();
                }
                if (method_exists($subscription, 'set_total')) {
                    $subscription->set_total($annual_final_amount);
                }
            }
            $subscription->save();

            if (method_exists($subscription, 'add_order_note')) {
                $subscription->add_order_note(sprintf('Stripe sync received for plan %s.', $plan_id));
            }

            platform_billing_log('Stripe sync completed.', array(
                'orderId' => $order->get_id(),
                'subscriptionId' => $subscription->get_id(),
                'planId' => $plan_id,
                'status' => $subscription->get_status(),
            ));

            return array(
                'orderId' => $order->get_id(),
                'subscriptionId' => $subscription->get_id(),
                'planId' => $plan_id,
                'status' => platform_billing_map_subscription_status($subscription->get_status()),
            );
        } finally {
            platform_billing_release_sync_lock($sync_lock);
        }
    }
}

if (!function_exists('platform_billing_downgrade_to_free')) {
    function platform_billing_downgrade_to_free($payload) {
        $wp_user_id = absint($payload['wpUserId'] ?? 0);
        $reason = sanitize_text_field((string) ($payload['reason'] ?? ''));

        if (!$wp_user_id) {
            return new WP_Error('platform_billing_invalid_downgrade_payload', 'Missing downgrade payload.', array('status' => 400));
        }

        $user = get_user_by('id', $wp_user_id);
        if (!$user) {
            return new WP_Error('platform_billing_unknown_user', 'Unknown WordPress user.', array('status' => 404));
        }

        delete_user_meta($wp_user_id, '_platform_manual_plan_id');
        delete_user_meta($wp_user_id, '_platform_manual_status');
        // PAPI and staging bypasses share this access record. Removing it revokes
        // the current entitlement without altering the user's order history.
        delete_user_meta($wp_user_id, '_platform_papi_plan_id');
        delete_user_meta($wp_user_id, '_platform_papi_status');
        delete_user_meta($wp_user_id, '_platform_papi_billing_period');
        delete_user_meta($wp_user_id, '_platform_papi_started_at');
        delete_user_meta($wp_user_id, '_platform_papi_renews_at');
        delete_user_meta($wp_user_id, '_platform_papi_activation_source');

        $cancelled_subscription_ids = array();

        if (function_exists('wcs_get_users_subscriptions')) {
            $subscriptions = (array) wcs_get_users_subscriptions($wp_user_id);
            foreach ($subscriptions as $subscription) {
                if (!platform_billing_subscription_belongs_to_user($subscription, $wp_user_id)) {
                    continue;
                }

                $subscription_plan = platform_billing_extract_subscription_plan($subscription);
                if ($subscription_plan === 'free') {
                    continue;
                }

                $current_status = method_exists($subscription, 'get_status') ? (string) $subscription->get_status() : '';
                if (in_array($current_status, array('cancelled', 'expired'), true)) {
                    continue;
                }

                if (!method_exists($subscription, 'update_status')) {
                    continue;
                }

                if (method_exists($subscription, 'can_be_updated_to') && !$subscription->can_be_updated_to('cancelled')) {
                    continue;
                }

                try {
                    $note = $reason ? sprintf('Downgraded to free (%s).', $reason) : 'Downgraded to free.';
                    $subscription->update_status('cancelled', $note, true);
                    if (method_exists($subscription, 'get_id')) {
                        $cancelled_subscription_ids[] = absint($subscription->get_id());
                    }
                } catch (Exception $exception) {
                    platform_billing_log('Subscription downgrade failed.', array(
                        'wpUserId' => $wp_user_id,
                        'subscriptionId' => method_exists($subscription, 'get_id') ? absint($subscription->get_id()) : null,
                        'error' => $exception->getMessage(),
                    ));
                }
            }
        }

        platform_billing_log('Downgraded user to free plan.', array(
            'wpUserId' => $wp_user_id,
            'cancelledSubscriptionIds' => $cancelled_subscription_ids,
        ));

        return array(
            'ok' => true,
            'planId' => 'free',
            'status' => 'none',
            'cancelledSubscriptionIds' => $cancelled_subscription_ids,
        );
    }
}

add_action('rest_api_init', function () {
    register_rest_route('2424/v1', '/billing/subscription-pricing', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_billing_ensure_request_authorized($request);
        },
        'callback' => function () {
            return rest_ensure_response(platform_billing_get_subscription_pricing_config());
        },
    ));

    register_rest_route('2424/v1', '/billing/subscription-snapshot', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_billing_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $payload = $request->get_json_params() ?: array();
            $wp_user_id = absint($payload['wpUserId'] ?? 0);
            return rest_ensure_response(platform_billing_get_subscription_snapshot($wp_user_id));
        },
    ));

    register_rest_route('2424/v1', '/billing/subscription/staging-bypass', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_billing_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_billing_activate_staging_subscription_bypass($request->get_json_params() ?: array());
            return is_wp_error($result) ? $result : rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/billing/history', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_billing_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $payload = $request->get_json_params() ?: array();
            $wp_user_id = absint($payload['wpUserId'] ?? 0);
            return rest_ensure_response(platform_billing_get_history($wp_user_id));
        },
    ));

    register_rest_route('2424/v1', '/billing/stripe/sync', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_billing_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_billing_sync_stripe_subscription($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                platform_billing_log('Stripe sync returned WP_Error.', array(
                    'code' => $result->get_error_code(),
                    'message' => $result->get_error_message(),
                ));
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/billing/stripe/customer', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_billing_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $payload = $request->get_json_params() ?: array();
            $wp_user_id = absint($payload['wpUserId'] ?? 0);
            $stripe_customer_id = sanitize_text_field((string) ($payload['stripeCustomerId'] ?? ''));

            if (!$wp_user_id || $stripe_customer_id === '') {
                return new WP_Error('platform_billing_invalid_customer_payload', 'Missing Stripe customer payload.', array('status' => 400));
            }

            platform_billing_save_stripe_customer_id($wp_user_id, $stripe_customer_id);
            platform_billing_log('Saved Stripe customer id for user.', array(
                'wpUserId' => $wp_user_id,
                'stripeCustomerId' => $stripe_customer_id,
            ));

            return rest_ensure_response(array(
                'ok' => true,
                'stripeCustomerId' => $stripe_customer_id,
            ));
        },
    ));

    register_rest_route('2424/v1', '/billing/stripe/downgrade', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_billing_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_billing_downgrade_to_free($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                platform_billing_log('Stripe downgrade returned WP_Error.', array(
                    'code' => $result->get_error_code(),
                    'message' => $result->get_error_message(),
                ));
                return $result;
            }

            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/billing/subscription/downgrade', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_billing_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_billing_downgrade_to_free($request->get_json_params() ?: array());
            return is_wp_error($result) ? $result : rest_ensure_response($result);
        },
    ));
});

add_action('show_user_profile', 'platform_billing_render_user_plan_admin');
add_action('edit_user_profile', 'platform_billing_render_user_plan_admin');
add_action('personal_options_update', 'platform_billing_save_user_plan_admin');
add_action('edit_user_profile_update', 'platform_billing_save_user_plan_admin');
