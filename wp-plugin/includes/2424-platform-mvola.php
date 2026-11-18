<?php
/**
 * 2424 Platform MVola module
 * Description: MVola Merchant Pay bridge for headless Next.js checkout flows.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('Platform_2424_Mvola_Api')) {
    class Platform_2424_Mvola_Api {
        private string $base_url;
        private string $consumer_key;
        private string $consumer_secret;
        private string $partner_name;
        private string $merchant_number;

        private const TOKEN_TRANSIENT = 'platform_2424_mvola_access_token';
        private const API_PATH = '/mvola/mm/transactions/type/merchantpay/1.0.0/';

        public function __construct(array $config) {
            $sandbox = !empty($config['sandbox']);
            $this->base_url = $sandbox ? 'https://devapi.mvola.mg' : 'https://api.mvola.mg';
            $this->consumer_key = (string) ($config['consumer_key'] ?? '');
            $this->consumer_secret = (string) ($config['consumer_secret'] ?? '');
            $this->partner_name = (string) ($config['partner_name'] ?? '');
            $this->merchant_number = (string) ($config['merchant_number'] ?? '');
        }

        public function get_access_token(): string {
            $cache_key = self::TOKEN_TRANSIENT . '_' . md5($this->base_url . '|' . $this->consumer_key . '|' . $this->merchant_number);
            $cached = get_transient($cache_key);
            if (is_string($cached) && $cached !== '') {
                return $cached;
            }

            $response = $this->send_request('POST', $this->base_url . '/token', array(
                'Authorization' => 'Basic ' . base64_encode($this->consumer_key . ':' . $this->consumer_secret),
                'Content-Type' => 'application/x-www-form-urlencoded',
                'Cache-Control' => 'no-cache',
            ), array(
                'grant_type' => 'client_credentials',
                'scope' => 'EXT_INT_MVOLA_SCOPE',
            ));

            if (is_wp_error($response)) {
                throw new Exception('MVola token error: ' . $response->get_error_message());
            }

            $body = json_decode(wp_remote_retrieve_body($response), true);
            if (!is_array($body) || empty($body['access_token'])) {
                throw new Exception('MVola token: réponse invalide.');
            }

            set_transient($cache_key, (string) $body['access_token'], 3500);
            return (string) $body['access_token'];
        }

        public function initiate_payment(array $params): array {
            $token = $this->get_access_token();
            $correlation_id = $this->generate_correlation_id();
            $request_date = $this->generate_request_date();

            $headers = array(
                'Authorization' => 'Bearer ' . $token,
                'Version' => '1.0',
                'X-CorrelationID' => $correlation_id,
                'UserLanguage' => platform_2424_get_mvola_user_language(),
                'UserAccountIdentifier' => 'msisdn;' . $this->merchant_number,
                'partnerName' => $this->partner_name,
                'Content-Type' => 'application/json',
                'Cache-Control' => 'no-cache',
            );

            if (!empty($params['callback_url'])) {
                $headers['X-Callback-URL'] = (string) $params['callback_url'];
            }

            $partner_transaction_id = $this->sanitize_reference((string) ($params['partner_trans_id'] ?? ''));

            $body = array(
                'amount' => (string) ($params['amount'] ?? ''),
                'currency' => 'Ar',
                'descriptionText' => $this->sanitize_description((string) ($params['description'] ?? '')),
                'requestingOrganisationTransactionReference' => $partner_transaction_id,
                'requestDate' => $request_date,
                'originalTransactionReference' => $partner_transaction_id,
                'debitParty' => array(array('key' => 'msisdn', 'value' => (string) ($params['customer_number'] ?? ''))),
                'creditParty' => array(array('key' => 'msisdn', 'value' => $this->merchant_number)),
                'metadata' => array(
                    array('key' => 'partnerName', 'value' => $this->partner_name),
                    array('key' => 'fc', 'value' => 'USD'),
                    array('key' => 'amountFc', 'value' => '1'),
                ),
            );

            $response = $this->send_request('POST', $this->base_url . self::API_PATH, $headers, wp_json_encode($body));

            return $this->parse_response($response, 'initiate_payment', array(
                'transport' => $this->get_transport_debug_info(),
                'headers' => array(
                    'Version' => $headers['Version'],
                    'X-CorrelationID' => $headers['X-CorrelationID'],
                    'UserLanguage' => $headers['UserLanguage'],
                    'UserAccountIdentifier' => $headers['UserAccountIdentifier'],
                    'partnerName' => $headers['partnerName'],
                    'hasCallbackUrl' => !empty($headers['X-Callback-URL']) ? 'yes' : 'no',
                    'notificationMethod' => !empty($headers['X-Callback-URL']) ? 'callback' : 'polling',
                ),
                'body' => $body,
            ));
        }

        public function get_transaction_status(string $server_correlation_id): array {
            $token = $this->get_access_token();
            $correlation_id = $this->generate_correlation_id();
            $url = $this->base_url . self::API_PATH . 'status/' . urlencode($server_correlation_id);

            $response = $this->send_request('GET', $url, array(
                'Authorization' => 'Bearer ' . $token,
                'Version' => '1.0',
                'X-CorrelationID' => $correlation_id,
                'UserLanguage' => platform_2424_get_mvola_user_language(),
                'UserAccountIdentifier' => 'msisdn;' . $this->merchant_number,
                'partnerName' => $this->partner_name,
                'Content-Type' => 'application/json',
                'Cache-Control' => 'no-cache',
            ));

            return $this->parse_response($response, 'get_transaction_status');
        }

        public function get_transaction_details(string $trans_id): array {
            $token = $this->get_access_token();
            $correlation_id = $this->generate_correlation_id();
            $url = $this->base_url . self::API_PATH . urlencode($trans_id);

            $response = $this->send_request('GET', $url, array(
                'Authorization' => 'Bearer ' . $token,
                'Version' => '1.0',
                'X-CorrelationID' => $correlation_id,
                'UserLanguage' => platform_2424_get_mvola_user_language(),
                'UserAccountIdentifier' => 'msisdn;' . $this->merchant_number,
                'partnerName' => $this->partner_name,
                'Content-Type' => 'application/json',
                'Cache-Control' => 'no-cache',
            ));

            return $this->parse_response($response, 'get_transaction_details');
        }

        private function generate_correlation_id(): string {
            return sprintf(
                '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
        }

        private function generate_request_date(): string {
            $microtime = microtime(true);
            $milliseconds = sprintf('%03d', (int) (($microtime - floor($microtime)) * 1000));
            return gmdate('Y-m-d\TH:i:s', (int) $microtime) . '.' . $milliseconds . 'Z';
        }

        private function sanitize_description(string $text): string {
            $text = preg_replace('/[^a-zA-Z0-9 \-\._,]/', '', $text);
            return substr((string) $text, 0, 50);
        }

        private function sanitize_reference(string $ref): string {
            $ref = preg_replace('/[^a-zA-Z0-9\-\._,]/', '', $ref);
            return substr((string) $ref, 0, 50);
        }

        private function get_transport_debug_info(): array {
            $info = array(
                'name' => function_exists('curl_init') ? 'curl' : 'wp_remote',
                'curlAvailable' => function_exists('curl_init') ? 'yes' : 'no',
            );

            if (function_exists('curl_version')) {
                $version = curl_version();
                if (is_array($version) && !empty($version['version'])) {
                    $info['curlVersion'] = (string) $version['version'];
                }
            }

            return $info;
        }

        private function send_request(string $method, string $url, array $headers, $body = null) {
            if (function_exists('curl_init')) {
                $ch = curl_init($url);
                if ($ch === false) {
                    return new WP_Error('platform_2424_mvola_curl_init_failed', 'Impossible d’initier cURL pour MVola.');
                }

                $header_lines = array();
                foreach ($headers as $key => $value) {
                    $header_lines[] = $key . ': ' . $value;
                }

                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                curl_setopt($ch, CURLOPT_HTTPHEADER, $header_lines);
                curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);

                if ($body !== null && strtoupper($method) !== 'GET') {
                    if (is_array($body)) {
                        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($body));
                    } else {
                        curl_setopt($ch, CURLOPT_POSTFIELDS, (string) $body);
                    }
                }

                $raw_body = curl_exec($ch);
                if ($raw_body === false) {
                    $error = curl_error($ch);
                    curl_close($ch);
                    return new WP_Error('platform_2424_mvola_curl_error', $error !== '' ? $error : 'Erreur cURL inconnue.');
                }

                $status_code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
                curl_close($ch);

                return array(
                    'headers' => array(),
                    'body' => (string) $raw_body,
                    'response' => array(
                        'code' => $status_code,
                        'message' => '',
                    ),
                    'cookies' => array(),
                    'filename' => null,
                );
            }

            $args = array(
                'timeout' => 30,
                'headers' => $headers,
            );

            if ($body !== null && strtoupper($method) !== 'GET') {
                $args['body'] = $body;
            }

            if (strtoupper($method) === 'GET') {
                return wp_remote_get($url, $args);
            }

            return wp_remote_post($url, $args);
        }

        private function parse_response($response, string $context, array $request_snapshot = array()): array {
            if (is_wp_error($response)) {
                throw new Exception('MVola [' . $context . '] WP_Error: ' . $response->get_error_message());
            }

            $http_code = wp_remote_retrieve_response_code($response);
            $body = json_decode(wp_remote_retrieve_body($response), true);

            if ($http_code >= 400) {
                $message = $body['fault']['message']
                    ?? $body['fault']['description']
                    ?? $body['ErrorDescription']
                    ?? $body['message']
                    ?? ('HTTP ' . $http_code);
                $details = is_array($body) ? wp_json_encode($body) : wp_remote_retrieve_body($response);
                if (is_string($details)) {
                    $details = substr($details, 0, 500);
                } else {
                    $details = '';
                }
                if ($details !== '') {
                    $message .= ' | details: ' . $details;
                }
                if (!empty($request_snapshot)) {
                    $message .= ' | request: ' . wp_json_encode($request_snapshot);
                }
                throw new Exception('MVola [' . $context . '] Error ' . $http_code . ': ' . $message);
            }

            return is_array($body) ? $body : array();
        }
    }
}

if (!function_exists('platform_2424_get_mvola_option')) {
    function platform_2424_get_mvola_option($name, $default = '') {
        $option_name = 'platform_2424_mvola_' . $name;
        $stored = get_option($option_name, null);
        if ($stored !== null && $stored !== '') {
            return $stored;
        }

        $env_key = 'PLATFORM_2424_MVOLA_' . strtoupper($name);
        $env_value = getenv($env_key);
        if (is_string($env_value) && trim($env_value) !== '') {
            return trim($env_value);
        }

        return $default;
    }
}

if (!function_exists('platform_2424_is_mvola_enabled')) {
    function platform_2424_is_mvola_enabled() {
        return (string) platform_2424_get_mvola_option('enabled', 'no') === 'yes';
    }
}

if (!function_exists('platform_2424_is_mvola_sandbox')) {
    function platform_2424_is_mvola_sandbox() {
        return (string) platform_2424_get_mvola_option('sandbox', 'yes') === 'yes';
    }
}

if (!function_exists('platform_2424_get_mvola_callback_secret')) {
    function platform_2424_get_mvola_callback_secret() {
        return sanitize_text_field((string) platform_2424_get_mvola_option('callback_secret', ''));
    }
}

if (!function_exists('platform_2424_get_mvola_polling_interval_seconds')) {
    function platform_2424_get_mvola_polling_interval_seconds() {
        $value = absint(platform_2424_get_mvola_option('polling_interval_seconds', 10));
        return $value > 0 ? $value : 10;
    }
}

if (!function_exists('platform_2424_get_mvola_user_language')) {
    function platform_2424_get_mvola_user_language() {
        return 'mg';
    }
}

if (!function_exists('platform_2424_should_use_mvola_callback')) {
    function platform_2424_should_use_mvola_callback() {
        return !platform_2424_is_mvola_sandbox();
    }
}

if (!function_exists('platform_2424_get_mvola_notification_method')) {
    function platform_2424_get_mvola_notification_method() {
        return platform_2424_should_use_mvola_callback() ? 'callback' : 'polling';
    }
}

if (!function_exists('platform_2424_mvola_validate_sandbox_phone')) {
    function platform_2424_mvola_validate_sandbox_phone($phone) {
        if (!platform_2424_is_mvola_sandbox()) {
            return true;
        }

        return in_array((string) $phone, array('0343500003', '0343500004'), true);
    }
}

if (!function_exists('platform_2424_build_mvola_callback_url')) {
    function platform_2424_build_mvola_callback_url() {
        $base = function_exists('platform_2424_get_public_site_url') ? platform_2424_get_public_site_url() : home_url();
        $secret = platform_2424_get_mvola_callback_secret();
        $url = untrailingslashit((string) $base) . '/api/billing/mvola/callback';
        if ($secret !== '') {
            $url = add_query_arg(array('token' => $secret), $url);
        }
        return $url;
    }
}

if (!function_exists('platform_2424_get_mvola_api')) {
    function platform_2424_get_mvola_api() {
        if (!platform_2424_is_mvola_enabled()) {
            throw new Exception('MVola n’est pas activée.');
        }

        $config = array(
            'sandbox' => platform_2424_is_mvola_sandbox(),
            'consumer_key' => sanitize_text_field((string) platform_2424_get_mvola_option('consumer_key', '')),
            'consumer_secret' => sanitize_text_field((string) platform_2424_get_mvola_option('consumer_secret', '')),
            'merchant_number' => sanitize_text_field((string) platform_2424_get_mvola_option('merchant_number', '')),
            'partner_name' => sanitize_text_field((string) platform_2424_get_mvola_option('partner_name', get_bloginfo('name'))),
        );

        foreach (array('consumer_key', 'consumer_secret', 'merchant_number', 'partner_name') as $required_key) {
            if ($config[$required_key] === '') {
                throw new Exception('Configuration MVola incomplète : ' . $required_key);
            }
        }

        return new Platform_2424_Mvola_Api($config);
    }
}

if (!function_exists('platform_2424_mvola_validate_phone')) {
    function platform_2424_mvola_validate_phone($value) {
        $phone = preg_replace('/\s+/', '', (string) $value);
        return preg_match('/^(032|033|034|038)\d{7}$/', $phone) ? $phone : '';
    }
}

if (!function_exists('platform_2424_mvola_find_orders_by_correlation_id')) {
    function platform_2424_mvola_find_orders_by_correlation_id($correlation_id) {
        if (!function_exists('wc_get_orders')) {
            return array();
        }

        $correlation_id = sanitize_text_field((string) $correlation_id);
        if ($correlation_id === '') {
            return array();
        }

        $orders = wc_get_orders(array(
            'limit' => 1,
            'type' => 'shop_order',
            'meta_key' => '_mvola_server_correlation_id',
            'meta_value' => $correlation_id,
        ));

        return is_array($orders) ? $orders : array();
    }
}

if (!function_exists('platform_2424_mvola_prepare_order')) {
    function platform_2424_mvola_prepare_order($order, $customer_phone, $correlation_id, $args = array()) {
        if (!$order || !is_a($order, 'WC_Order')) {
            return;
        }

        $customer_phone = sanitize_text_field((string) $customer_phone);
        $correlation_id = sanitize_text_field((string) $correlation_id);
        $flow = sanitize_key((string) ($args['flow'] ?? ''));
        $listing_id = absint($args['listing_id'] ?? 0);
        $pricing_code = sanitize_key((string) ($args['pricing_code'] ?? ''));
        $plan_id = sanitize_key((string) ($args['plan_id'] ?? ''));
        $scheduled_publish_at = sanitize_text_field((string) ($args['scheduled_publish_at'] ?? ''));

        $order->set_payment_method('mvola');
        $order->set_payment_method_title('MVola');
        $order->update_meta_data('_mvola_customer_phone', $customer_phone);
        $order->update_meta_data('_mvola_server_correlation_id', $correlation_id);
        $order->update_meta_data('_mvola_last_status', 'pending');
        $order->update_meta_data('_platform_mvola_flow', $flow);
        if ($listing_id > 0) {
            $order->update_meta_data('_2424_listing_id', (string) $listing_id);
        }
        if ($pricing_code !== '') {
            $order->update_meta_data('_2424_pricing_code', $pricing_code);
        }
        if ($plan_id !== '') {
            $order->update_meta_data('_platform_plan_id', $plan_id);
        }
        if ($scheduled_publish_at !== '') {
            $order->update_meta_data('_platform_scheduled_publish_at', $scheduled_publish_at);
        }
        if (!$order->has_status(array('pending', 'on-hold'))) {
            $order->set_status('pending');
        }
        $order->save();
    }
}

if (!function_exists('platform_2424_mvola_create_subscription_order')) {
    function platform_2424_mvola_create_subscription_order($wp_user_id, $plan_id, $payload = array()) {
        if (!function_exists('wc_create_order') || !function_exists('wc_get_product')) {
            return new WP_Error('platform_2424_mvola_wc_missing', 'WooCommerce non disponible.', array('status' => 500));
        }

        $wp_user_id = absint($wp_user_id);
        $billing_period = function_exists('platform_billing_normalize_billing_period')
            ? platform_billing_normalize_billing_period($payload['billingPeriod'] ?? 'monthly')
            : 'monthly';
        $product_id = 0;
        $explicit_product_sku = sanitize_text_field((string) ($payload['wpProductSku'] ?? ''));
        $explicit_product_id = absint($payload['wpProductId'] ?? 0);

        if ($explicit_product_sku !== '' && function_exists('platform_billing_get_product_id_by_sku')) {
            $product_id = absint(platform_billing_get_product_id_by_sku($explicit_product_sku));
        }

        if ($product_id <= 0 && $explicit_product_id > 0) {
            $product_id = $explicit_product_id;
        }

        if ($product_id <= 0 && function_exists('platform_billing_get_product_id_for_plan')) {
            $product_id = platform_billing_get_product_id_for_plan($plan_id, $billing_period);
        }

        if ($product_id <= 0) {
            return new WP_Error('platform_2424_mvola_plan_product_missing', 'Produit WooCommerce introuvable pour ce plan.', array('status' => 400));
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            return new WP_Error('platform_2424_mvola_plan_product_invalid', 'Produit WooCommerce invalide.', array('status' => 400));
        }

        $order = wc_create_order(array('customer_id' => $wp_user_id));
        if (is_wp_error($order)) {
            return $order;
        }

        $order->add_product($product, 1);
        $order->set_created_via('2424-mvola-subscription');
        $order->set_customer_id($wp_user_id);
        $user = get_user_by('id', $wp_user_id);
        if ($user) {
            $order->set_billing_email((string) $user->user_email);
            $order->set_billing_first_name((string) get_user_meta($wp_user_id, 'first_name', true));
            $order->set_billing_last_name((string) get_user_meta($wp_user_id, 'last_name', true));
        }
        $order->calculate_totals(false);
        if ($billing_period === 'annual' && function_exists('platform_billing_get_plan_pricing_snapshot')) {
            $pricing = platform_billing_get_plan_pricing_snapshot($plan_id);
            $annual = is_array($pricing['annual'] ?? null) ? $pricing['annual'] : null;
            $final_amount = isset($annual['finalAmountAr']) ? (float) $annual['finalAmountAr'] : 0.0;

            if (!($annual && !empty($annual['available']) && $final_amount > 0)) {
                return new WP_Error('platform_2424_mvola_annual_plan_unavailable', 'Le tarif annuel n’est pas disponible pour ce plan.', array('status' => 400));
            }

            foreach ($order->get_items('line_item') as $item) {
                if (method_exists($item, 'set_subtotal')) {
                    $item->set_subtotal($final_amount);
                }
                if (method_exists($item, 'set_total')) {
                    $item->set_total($final_amount);
                }
                $item->save();
            }

            $order->set_total($final_amount);
        }
        $order->update_meta_data('_platform_billing_period', $billing_period);
        $order->add_order_note('Paiement MVola initié pour abonnement.');
        return $order;
    }
}

if (!function_exists('platform_2424_mvola_create_listing_order')) {
    function platform_2424_mvola_create_listing_order($wp_user_id, $listing_id, $pricing_code) {
        if (!function_exists('wc_create_order') || !function_exists('wc_get_product')) {
            return new WP_Error('platform_2424_mvola_wc_missing', 'WooCommerce non disponible.', array('status' => 500));
        }

        $pricing_definition = function_exists('platform_submissions_get_pricing_definition') ? platform_submissions_get_pricing_definition($pricing_code) : null;
        $product_id = absint($pricing_definition['configuredProductId'] ?? 0);
        if ($product_id <= 0 && !empty($pricing_definition['sku']) && function_exists('wc_get_product_id_by_sku')) {
            $product_id = (int) wc_get_product_id_by_sku((string) $pricing_definition['sku']);
        }
        if ($product_id <= 0) {
            return new WP_Error('platform_2424_mvola_listing_product_missing', 'Produit WooCommerce introuvable pour ce tarif.', array('status' => 400));
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            return new WP_Error('platform_2424_mvola_listing_product_invalid', 'Produit WooCommerce invalide.', array('status' => 400));
        }

        $order = wc_create_order(array('customer_id' => absint($wp_user_id)));
        if (is_wp_error($order)) {
            return $order;
        }

        $order->add_product($product, 1);
        $order->set_created_via('2424-mvola-listing');
        $order->set_customer_id(absint($wp_user_id));
        $user = get_user_by('id', absint($wp_user_id));
        if ($user) {
            $order->set_billing_email((string) $user->user_email);
            $order->set_billing_first_name((string) get_user_meta($wp_user_id, 'first_name', true));
            $order->set_billing_last_name((string) get_user_meta($wp_user_id, 'last_name', true));
        }
        $order->calculate_totals(false);
        $order->update_meta_data('_2424_listing_id', (string) absint($listing_id));
        $order->update_meta_data('_2424_pricing_code', sanitize_key((string) $pricing_code));
        $order->add_order_note('Paiement MVola initié pour publication.');
        return $order;
    }
}

if (!function_exists('platform_2424_mvola_start_subscription_payment')) {
    function platform_2424_mvola_start_subscription_payment($payload) {
        $wp_user_id = absint($payload['wpUserId'] ?? 0);
        $plan_id = sanitize_key((string) ($payload['planId'] ?? ''));
        $billing_period = function_exists('platform_billing_normalize_billing_period')
            ? platform_billing_normalize_billing_period($payload['billingPeriod'] ?? 'monthly')
            : 'monthly';
        $customer_phone = platform_2424_mvola_validate_phone($payload['customerNumber'] ?? '');
        $wp_product_sku = sanitize_text_field((string) ($payload['wpProductSku'] ?? ''));
        $wp_product_id = absint($payload['wpProductId'] ?? 0);
        $return_to = sanitize_text_field((string) ($payload['returnTo'] ?? '/profil'));

        if ($wp_user_id <= 0 || !in_array($plan_id, array('essentiel', 'business'), true) || $customer_phone === '') {
            return new WP_Error('platform_2424_mvola_invalid_payload', 'wpUserId, planId et customerNumber sont requis.', array('status' => 400));
        }

        if (!platform_2424_mvola_validate_sandbox_phone($customer_phone)) {
            return new WP_Error('platform_2424_mvola_invalid_sandbox_phone', 'En environnement MVola sandbox, seuls les num?ros de test 0343500003 et 0343500004 sont accept?s.', array('status' => 400));
        }

        if (function_exists('platform_billing_get_subscription_snapshot')) {
            $snapshot = platform_billing_get_subscription_snapshot($wp_user_id);
            if (is_array($snapshot) && ($snapshot['status'] ?? 'none') === 'active' && ($snapshot['billingProvider'] ?? '') === 'woocommerce-subscriptions') {
                return new WP_Error('platform_2424_mvola_subscription_conflict', 'Un abonnement Stripe actif existe déjà pour ce compte.', array('status' => 409));
            }
        }

        $order = platform_2424_mvola_create_subscription_order($wp_user_id, $plan_id, array(
            'wpProductSku' => $wp_product_sku,
            'wpProductId' => $wp_product_id,
            'billingPeriod' => $billing_period,
        ));
        if (is_wp_error($order)) {
            return $order;
        }

        try {
            $api = platform_2424_get_mvola_api();
            $result = $api->initiate_payment(array(
                'amount' => (string) max(1, (int) round((float) $order->get_total())),
                'customer_number' => $customer_phone,
                'description' => sprintf('2424 abonnement %s', $order->get_order_number()),
                'partner_trans_id' => 'plan-' . $order->get_id(),
                'callback_url' => platform_2424_should_use_mvola_callback() ? platform_2424_build_mvola_callback_url() : '',
            ));
        } catch (Exception $exception) {
            return new WP_Error('platform_2424_mvola_start_failed', $exception->getMessage(), array('status' => 500));
        }

        $correlation_id = sanitize_text_field((string) ($result['serverCorrelationId'] ?? ''));
        if ($correlation_id === '') {
            return new WP_Error('platform_2424_mvola_missing_correlation', 'MVola n’a pas retourné de correlation id.', array('status' => 500));
        }

        platform_2424_mvola_prepare_order($order, $customer_phone, $correlation_id, array(
            'flow' => 'subscription',
            'plan_id' => $plan_id,
            'billing_period' => $billing_period,
        ));

        update_user_meta($wp_user_id, '_platform_mvola_pending_order_id', (string) $order->get_id());
        update_user_meta($wp_user_id, '_platform_mvola_pending_plan_id', $plan_id);
        update_user_meta($wp_user_id, '_platform_mvola_pending_billing_period', $billing_period);

        return array(
            'orderId' => absint($order->get_id()),
            'status' => 'pending',
            'checkoutUrl' => add_query_arg(array(
                'source' => 'mvola',
                'flow' => 'subscription',
                'status' => 'pending',
                'orderId' => absint($order->get_id()),
                'plan' => $plan_id,
                'period' => $billing_period,
                'returnTo' => $return_to,
            ), trailingslashit(platform_2424_get_public_site_url()) . 'checkout/retour'),
        );
    }
}

if (!function_exists('platform_2424_mvola_start_listing_payment')) {
    function platform_2424_mvola_start_listing_payment($payload) {
        $wp_user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);
        $action = sanitize_key((string) ($payload['action'] ?? 'post'));
        $customer_phone = platform_2424_mvola_validate_phone($payload['customerNumber'] ?? '');
        $return_to = sanitize_text_field((string) ($payload['returnTo'] ?? '/profil/petites-annonces'));
        $scheduled_publish_at = sanitize_text_field((string) ($payload['scheduledPublishAt'] ?? ''));

        if ($wp_user_id <= 0 || $listing_id <= 0 || $customer_phone === '') {
            return new WP_Error('platform_2424_mvola_invalid_payload', 'wpUserId, listingId et customerNumber sont requis.', array('status' => 400));
        }

        if (!platform_2424_mvola_validate_sandbox_phone($customer_phone)) {
            return new WP_Error('platform_2424_mvola_invalid_sandbox_phone', 'En environnement MVola sandbox, seuls les num?ros de test 0343500003 et 0343500004 sont accept?s.', array('status' => 400));
        }

        if (!function_exists('platform_submissions_get_listing_payable_quote')) {
            return new WP_Error('platform_2424_mvola_submissions_unavailable', 'Module de soumission indisponible.', array('status' => 500));
        }

        $quote = platform_submissions_get_listing_payable_quote(array(
            'wpUserId' => $wp_user_id,
            'listingId' => $listing_id,
            'action' => $action === 'boost' ? 'boost' : 'post',
        ));
        if (is_wp_error($quote)) {
            return $quote;
        }

        $order = platform_2424_mvola_create_listing_order($wp_user_id, $listing_id, (string) $quote['pricingCode']);
        if (is_wp_error($order)) {
            return $order;
        }

        try {
            $api = platform_2424_get_mvola_api();
            $result = $api->initiate_payment(array(
                'amount' => (string) max(1, (int) round((float) $order->get_total())),
                'customer_number' => $customer_phone,
                'description' => sprintf('2424 annonce %s', $order->get_order_number()),
                'partner_trans_id' => 'listing-' . $order->get_id(),
                'callback_url' => platform_2424_should_use_mvola_callback() ? platform_2424_build_mvola_callback_url() : '',
            ));
        } catch (Exception $exception) {
            return new WP_Error('platform_2424_mvola_start_failed', $exception->getMessage(), array('status' => 500));
        }

        $correlation_id = sanitize_text_field((string) ($result['serverCorrelationId'] ?? ''));
        if ($correlation_id === '') {
            return new WP_Error('platform_2424_mvola_missing_correlation', 'MVola n’a pas retourné de correlation id.', array('status' => 500));
        }

        $current_post_status = sanitize_key((string) $post->post_status);
        $current_payment_status = sanitize_key((string) get_post_meta($listing_id, 'payment_status', true));

        $order->update_meta_data('_2424_previous_post_status', $current_post_status);
        $order->update_meta_data('_2424_previous_payment_status', $current_payment_status);
        $order->save();

        update_post_meta($listing_id, 'payment_method', 'mvola');
        if (!($current_post_status === 'publish' && $current_payment_status === 'paid')) {
            update_post_meta($listing_id, 'payment_status', 'pending');
        }
        update_post_meta($listing_id, '_mvola_server_correlation_id', $correlation_id);
        update_post_meta($listing_id, '_mvola_customer_phone', $customer_phone);
        update_post_meta($listing_id, '_mvola_notification_method', sanitize_text_field((string) ($result['notificationMethod'] ?? platform_2424_get_mvola_notification_method())));
        update_post_meta($listing_id, '_mvola_last_status', 'pending');

        platform_2424_mvola_prepare_order($order, $customer_phone, $correlation_id, array(
            'flow' => 'listing',
            'listing_id' => $listing_id,
            'pricing_code' => (string) $quote['pricingCode'],
            'scheduled_publish_at' => $scheduled_publish_at,
        ));

        return array(
            'orderId' => absint($order->get_id()),
            'listingId' => $listing_id,
            'status' => 'pending',
            'checkoutUrl' => add_query_arg(array(
                'source' => 'mvola',
                'flow' => 'listing',
                'status' => 'pending',
                'orderId' => absint($order->get_id()),
                'listingId' => $listing_id,
                'returnTo' => $return_to,
            ), trailingslashit(platform_2424_get_public_site_url()) . 'checkout/retour'),
        );
    }
}

if (!function_exists('platform_2424_mvola_build_listing_snapshot')) {
    function platform_2424_mvola_build_listing_snapshot($order) {
        if (!$order || !is_a($order, 'WC_Order')) {
            return array();
        }

        $listing_id = absint($order->get_meta('_2424_listing_id', true));
        if ($listing_id <= 0) {
            return array();
        }

        $post = get_post($listing_id);
        $kind = '';
        if ($post && function_exists('platform_submissions_map_post_type_to_kind')) {
            $kind = (string) platform_submissions_map_post_type_to_kind($post->post_type);
        }

        return array(
            'listingId' => $listing_id,
            'kind' => $kind !== '' ? $kind : null,
            'postStatus' => $post ? sanitize_key((string) $post->post_status) : null,
            'paymentStatus' => sanitize_key((string) get_post_meta($listing_id, 'payment_status', true)) ?: null,
        );
    }
}

if (!function_exists('platform_2424_mvola_complete_subscription_order')) {
    function platform_2424_mvola_complete_subscription_order($order, $transaction_reference, $status_payload = array()) {
        if (!$order || !is_a($order, 'WC_Order')) {
            return new WP_Error('platform_2424_mvola_order_missing', 'Commande MVola introuvable.', array('status' => 404));
        }

        $wp_user_id = absint($order->get_customer_id());
        $plan_id = sanitize_key((string) $order->get_meta('_platform_plan_id', true));
        $billing_period = function_exists('platform_billing_normalize_billing_period')
            ? platform_billing_normalize_billing_period($order->get_meta('_platform_billing_period', true))
            : 'monthly';
        if ($wp_user_id <= 0 || !in_array($plan_id, array('essentiel', 'business'), true)) {
            return new WP_Error('platform_2424_mvola_invalid_subscription_order', 'Commande abonnement MVola invalide.', array('status' => 400));
        }

        $existing_plan_id = sanitize_key((string) get_user_meta($wp_user_id, '_platform_mvola_plan_id', true));
        $existing_renews_at = sanitize_text_field((string) get_user_meta($wp_user_id, '_platform_mvola_renews_at', true));
        $existing_renews_ts = $existing_renews_at !== '' ? strtotime($existing_renews_at) : false;
        $now_ts = time();
        $base_ts = ($existing_plan_id === $plan_id && $existing_renews_ts && $existing_renews_ts > $now_ts) ? $existing_renews_ts : $now_ts;
        $next_renews_ts = $base_ts + ($billing_period === 'annual' ? YEAR_IN_SECONDS : (30 * DAY_IN_SECONDS));
        $started_at = gmdate('c', $now_ts);
        $renews_at = gmdate('c', $next_renews_ts);

        update_user_meta($wp_user_id, '_platform_mvola_plan_id', $plan_id);
        update_user_meta($wp_user_id, '_platform_mvola_status', 'active');
        update_user_meta($wp_user_id, '_platform_mvola_billing_period', $billing_period);
        update_user_meta($wp_user_id, '_platform_mvola_started_at', $started_at);
        update_user_meta($wp_user_id, '_platform_mvola_renews_at', $renews_at);
        update_user_meta($wp_user_id, '_platform_mvola_last_order_id', (string) $order->get_id());
        update_user_meta($wp_user_id, '_platform_mvola_transaction_reference', sanitize_text_field((string) $transaction_reference));
        delete_user_meta($wp_user_id, '_platform_mvola_pending_order_id');
        delete_user_meta($wp_user_id, '_platform_mvola_pending_plan_id');
        delete_user_meta($wp_user_id, '_platform_mvola_pending_billing_period');

        if (!$order->get_date_paid()) {
            $order->payment_complete($transaction_reference);
        }
        $order->set_transaction_id($transaction_reference);
        $order->set_payment_method('mvola');
        $order->set_payment_method_title('MVola');
        $order->update_meta_data('_mvola_transaction_reference', sanitize_text_field((string) $transaction_reference));
        $order->update_meta_data('_mvola_last_status', 'completed');
        $order->update_meta_data('_mvola_status_payload', wp_json_encode($status_payload));
        if (!$order->has_status(array('completed'))) {
            $order->set_status('completed', 'Abonnement MVola confirmé.');
        }
        $order->save();

        return array(
            'ok' => true,
            'orderId' => absint($order->get_id()),
            'planId' => $plan_id,
            'billingPeriod' => $billing_period,
            'status' => 'completed',
            'renewsAt' => $renews_at,
            'billingProvider' => 'local',
        );
    }
}

if (!function_exists('platform_2424_mvola_complete_listing_order')) {
    function platform_2424_mvola_complete_listing_order($order, $transaction_reference, $status_payload = array()) {
        if (!$order || !is_a($order, 'WC_Order')) {
            return new WP_Error('platform_2424_mvola_order_missing', 'Commande MVola introuvable.', array('status' => 404));
        }

        $listing_id = absint($order->get_meta('_2424_listing_id', true));
        $pricing_code = sanitize_key((string) $order->get_meta('_2424_pricing_code', true));
        $scheduled_publish_at = sanitize_text_field((string) $order->get_meta('_platform_scheduled_publish_at', true));

        if ($listing_id <= 0 || $pricing_code === '') {
            return new WP_Error('platform_2424_mvola_invalid_listing_order', 'Commande annonce MVola invalide.', array('status' => 400));
        }

        $post = get_post($listing_id);
        if (!$post) {
            return new WP_Error('platform_2424_mvola_listing_missing', 'Annonce introuvable.', array('status' => 404));
        }

        $scheduled = function_exists('platform_submissions_normalize_scheduled_publish_at')
            ? platform_submissions_normalize_scheduled_publish_at($scheduled_publish_at)
            : array('iso' => '', 'timestamp' => 0);
        $scheduled_ts = (int) ($scheduled['timestamp'] ?? 0);
        $scheduled_iso = (string) ($scheduled['iso'] ?? '');

        $is_boost_pricing = strpos($pricing_code, 'boost_7d') !== false;
        $next_expires_ts = $is_boost_pricing
            ? (function_exists('platform_submissions_apply_boost_to_post') ? platform_submissions_apply_boost_to_post($listing_id, $pricing_code, array('preserveExisting' => true)) : 0)
            : (function_exists('platform_submissions_apply_expiration_to_post') ? platform_submissions_apply_expiration_to_post($listing_id, $pricing_code, array(
                'preserveExisting' => true,
                'nowTs' => $scheduled_ts > time() ? $scheduled_ts : time(),
            )) : 0);

        update_post_meta($listing_id, 'payment_method', 'mvola');
        update_post_meta($listing_id, 'payment_status', 'paid');
        update_post_meta($listing_id, 'payment_paid_at', gmdate('c'));
        update_post_meta($listing_id, 'woo_order_id', (string) $order->get_id());
        update_post_meta($listing_id, '_mvola_transaction_reference', sanitize_text_field((string) $transaction_reference));
        update_post_meta($listing_id, '_mvola_last_status', 'completed');

        if ($scheduled_ts > time()) {
            update_post_meta($listing_id, 'scheduled_publish_at', $scheduled_iso);
            update_post_meta($listing_id, 'scheduled_publish_at_ts', (string) $scheduled_ts);
        } else {
            delete_post_meta($listing_id, 'scheduled_publish_at');
            delete_post_meta($listing_id, 'scheduled_publish_at_ts');
        }

        if ((string) $post->post_status !== 'publish' && strpos($pricing_code, 'boost_7d') === false && strpos($pricing_code, 'extend_7d') === false) {
            wp_update_post(array(
                'ID' => $listing_id,
                'post_status' => 'publish',
            ));
        }

        if (!$order->get_date_paid()) {
            $order->payment_complete($transaction_reference);
        }
        $order->set_transaction_id($transaction_reference);
        $order->set_payment_method('mvola');
        $order->set_payment_method_title('MVola');
        $order->update_meta_data('_mvola_transaction_reference', sanitize_text_field((string) $transaction_reference));
        $order->update_meta_data('_mvola_last_status', 'completed');
        $order->update_meta_data('_mvola_status_payload', wp_json_encode($status_payload));
        if (!$order->has_status(array('completed'))) {
            $order->set_status('completed', 'Annonce payée via MVola.');
        }
        $order->save();

        return array(
            'ok' => true,
            'orderId' => absint($order->get_id()),
            'listingId' => $listing_id,
            'status' => 'completed',
            'paymentStatus' => 'paid',
            'isScheduled' => $scheduled_ts > time(),
            'scheduledPublishAt' => $scheduled_iso !== '' ? $scheduled_iso : null,
            'expiresAt' => $next_expires_ts > 0 ? gmdate('c', $next_expires_ts) : null,
            'kind' => function_exists('platform_submissions_map_post_type_to_kind') ? platform_submissions_map_post_type_to_kind($post->post_type) : null,
        );
    }
}

if (!function_exists('platform_2424_mvola_mark_order_failed')) {
    function platform_2424_mvola_mark_order_failed($order, $status_payload = array()) {
        if (!$order || !is_a($order, 'WC_Order')) {
            return;
        }

        $order->update_meta_data('_mvola_last_status', 'failed');
        $order->update_meta_data('_mvola_status_payload', wp_json_encode($status_payload));
        $order->set_payment_method('mvola');
        $order->set_payment_method_title('MVola');
        if (!$order->has_status(array('failed', 'cancelled'))) {
            $order->set_status('failed', 'Paiement MVola échoué.');
        }
        $order->save();

        $listing_id = absint($order->get_meta('_2424_listing_id', true));
        if ($listing_id > 0) {
            $previous_payment_status = sanitize_key((string) $order->get_meta('_2424_previous_payment_status', true));
            if ($previous_payment_status !== '') {
                update_post_meta($listing_id, 'payment_status', $previous_payment_status);
            } else {
                update_post_meta($listing_id, 'payment_status', 'failed');
            }
            update_post_meta($listing_id, 'payment_method', 'mvola');
            update_post_meta($listing_id, '_mvola_last_status', 'failed');
        }

        $wp_user_id = absint($order->get_customer_id());
        if ($wp_user_id > 0) {
            update_user_meta($wp_user_id, '_platform_mvola_status', 'failed');
        }
    }
}

if (!function_exists('platform_2424_mvola_normalize_status')) {
    function platform_2424_mvola_normalize_status($payload) {
        $raw_status = sanitize_key((string) ($payload['status'] ?? $payload['transactionStatus'] ?? 'pending'));
        if ($raw_status === '') {
            return 'pending';
        }
        if (in_array($raw_status, array('completed', 'success', 'successful'), true)) {
            return 'completed';
        }
        if (in_array($raw_status, array('failed', 'failure', 'cancelled', 'canceled', 'rejected'), true)) {
            return 'failed';
        }
        return 'pending';
    }
}

if (!function_exists('platform_2424_mvola_extract_detail_reference')) {
    function platform_2424_mvola_extract_detail_reference($payload) {
        $object_reference = sanitize_text_field((string) ($payload['objectReference'] ?? ''));
        if ($object_reference !== '') {
            return $object_reference;
        }

        $transaction_reference = sanitize_text_field((string) ($payload['transactionReference'] ?? ''));
        if ($transaction_reference !== '') {
            return $transaction_reference;
        }

        return '';
    }
}

if (!function_exists('platform_2424_mvola_enrich_completed_payload')) {
    function platform_2424_mvola_enrich_completed_payload($api, $status_payload = array()) {
        $detail_reference = platform_2424_mvola_extract_detail_reference($status_payload);
        if ($detail_reference === '') {
            return $status_payload;
        }

        $details_payload = $api->get_transaction_details($detail_reference);
        if (!is_array($details_payload) || empty($details_payload)) {
            return $status_payload;
        }

        return array_merge($details_payload, array(
            '_mvola_status_payload' => $status_payload,
        ));
    }
}

if (!function_exists('platform_2424_mvola_handle_order_status')) {
    function platform_2424_mvola_handle_order_status($order, $status_payload = array(), $api = null) {
        if (!$order || !is_a($order, 'WC_Order')) {
            return new WP_Error('platform_2424_mvola_order_missing', 'Commande MVola introuvable.', array('status' => 404));
        }

        $status = platform_2424_mvola_normalize_status($status_payload);
        $flow = sanitize_key((string) $order->get_meta('_platform_mvola_flow', true));

        if ($status === 'completed') {
            $resolved_payload = $status_payload;
            if ($api && is_object($api)) {
                try {
                    $resolved_payload = platform_2424_mvola_enrich_completed_payload($api, $status_payload);
                } catch (Exception $exception) {
                    $order->add_order_note('MVola details error: ' . $exception->getMessage());
                }
            }

            $transaction_reference = sanitize_text_field((string) (
                $resolved_payload['transactionReference']
                ?? $resolved_payload['objectReference']
                ?? $status_payload['transactionReference']
                ?? $status_payload['objectReference']
                ?? ''
            ));
            $object_reference = sanitize_text_field((string) (
                $resolved_payload['objectReference']
                ?? $status_payload['objectReference']
                ?? ''
            ));

            if ($transaction_reference === '' && $object_reference !== '') {
                $transaction_reference = $object_reference;
            }

            $order->update_meta_data('_mvola_transaction_reference', $transaction_reference);
            if ($object_reference !== '') {
                $order->update_meta_data('_mvola_object_reference', $object_reference);
            }
            $order->update_meta_data('_mvola_details_payload', wp_json_encode($resolved_payload));
            $order->save();

            if ($flow === 'subscription') {
                return platform_2424_mvola_complete_subscription_order($order, $transaction_reference, $resolved_payload);
            }
            return platform_2424_mvola_complete_listing_order($order, $transaction_reference, $resolved_payload);
        }

        if ($status === 'failed') {
            platform_2424_mvola_mark_order_failed($order, $status_payload);
            return array(
                'ok' => true,
                'orderId' => absint($order->get_id()),
                'status' => 'failed',
                'flow' => $flow,
            );
        }

        $order->update_meta_data('_mvola_last_status', $status !== '' ? $status : 'pending');
        $order->update_meta_data('_mvola_status_payload', wp_json_encode($status_payload));
        $order->save();

        return array(
            'ok' => true,
            'orderId' => absint($order->get_id()),
            'status' => $status !== '' ? $status : 'pending',
            'flow' => $flow,
        );
    }
}

if (!function_exists('platform_2424_mvola_check_status')) {
    function platform_2424_mvola_check_status($payload) {
        $wp_user_id = absint($payload['wpUserId'] ?? 0);
        $order_id = absint($payload['orderId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);

        if ($wp_user_id <= 0 || $order_id <= 0) {
            return new WP_Error('platform_2424_mvola_invalid_status_payload', 'wpUserId et orderId sont requis.', array('status' => 400));
        }

        if (!function_exists('wc_get_order')) {
            return new WP_Error('platform_2424_mvola_wc_missing', 'WooCommerce non disponible.', array('status' => 500));
        }

        $order = wc_get_order($order_id);
        if (!$order || !is_a($order, 'WC_Order')) {
            return new WP_Error('platform_2424_mvola_order_missing', 'Commande MVola introuvable.', array('status' => 404));
        }

        if (absint($order->get_customer_id()) !== $wp_user_id) {
            return new WP_Error('platform_2424_mvola_order_forbidden', 'Cette commande ne vous appartient pas.', array('status' => 403));
        }

        if ($listing_id > 0 && absint($order->get_meta('_2424_listing_id', true)) !== $listing_id) {
            return new WP_Error('platform_2424_mvola_listing_mismatch', 'Annonce invalide pour cette commande.', array('status' => 403));
        }

        if ($order->has_status(array('completed'))) {
            return array_merge(array(
                'orderId' => $order_id,
                'status' => 'completed',
                'isConfirmed' => true,
                'flow' => sanitize_key((string) $order->get_meta('_platform_mvola_flow', true)),
                'listingId' => absint($order->get_meta('_2424_listing_id', true)),
                'planId' => sanitize_key((string) $order->get_meta('_platform_plan_id', true)),
                'billingPeriod' => function_exists('platform_billing_normalize_billing_period')
                    ? platform_billing_normalize_billing_period($order->get_meta('_platform_billing_period', true))
                    : 'monthly',
            ), platform_2424_mvola_build_listing_snapshot($order));
        }

        if ($order->has_status(array('failed', 'cancelled'))) {
            return array_merge(array(
                'orderId' => $order_id,
                'status' => 'failed',
                'isConfirmed' => false,
                'flow' => sanitize_key((string) $order->get_meta('_platform_mvola_flow', true)),
            ), platform_2424_mvola_build_listing_snapshot($order));
        }

        $correlation_id = sanitize_text_field((string) $order->get_meta('_mvola_server_correlation_id', true));
        if ($correlation_id === '') {
            return new WP_Error('platform_2424_mvola_missing_correlation', 'Commande MVola sans correlation id.', array('status' => 500));
        }

        try {
            $api = platform_2424_get_mvola_api();
            $status_payload = $api->get_transaction_status($correlation_id);
            $result = platform_2424_mvola_handle_order_status($order, $status_payload, $api);
            if (is_wp_error($result)) {
                return $result;
            }
            return array_merge(array(
                'orderId' => $order_id,
                'isConfirmed' => ($result['status'] ?? 'pending') === 'completed',
            ), platform_2424_mvola_build_listing_snapshot($order), $result);
        } catch (Exception $exception) {
            return new WP_Error('platform_2424_mvola_status_failed', $exception->getMessage(), array('status' => 500));
        }
    }
}

if (!function_exists('platform_2424_mvola_handle_callback_payload')) {
    function platform_2424_mvola_handle_callback_payload($payload) {
        $correlation_id = sanitize_text_field((string) ($payload['serverCorrelationId'] ?? ''));
        if ($correlation_id === '') {
            return new WP_Error('platform_2424_mvola_missing_correlation', 'serverCorrelationId requis.', array('status' => 400));
        }

        $orders = platform_2424_mvola_find_orders_by_correlation_id($correlation_id);
        if (empty($orders)) {
            return new WP_Error('platform_2424_mvola_order_missing', 'Aucune commande correspondante.', array('status' => 404));
        }

        $order = $orders[0];
        try {
            $api = platform_2424_get_mvola_api();
        } catch (Exception $exception) {
            return new WP_Error('platform_2424_mvola_api_unavailable', $exception->getMessage(), array('status' => 500));
        }

        $result = platform_2424_mvola_handle_order_status($order, $payload, $api);
        if (is_wp_error($result)) {
            return $result;
        }

        return array_merge(array(
            'orderId' => absint($order->get_id()),
        ), $result);
    }
}

add_action('rest_api_init', function () {
    register_rest_route('2424/v1', '/billing/mvola/subscription/start', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return function_exists('platform_billing_ensure_request_authorized')
                ? platform_billing_ensure_request_authorized($request)
                : new WP_Error('platform_2424_mvola_billing_unavailable', 'Billing module indisponible.', array('status' => 500));
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_2424_mvola_start_subscription_payment($request->get_json_params() ?: array());
            return is_wp_error($result) ? $result : rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/billing/mvola/listing/start', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return function_exists('platform_billing_ensure_request_authorized')
                ? platform_billing_ensure_request_authorized($request)
                : new WP_Error('platform_2424_mvola_billing_unavailable', 'Billing module indisponible.', array('status' => 500));
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_2424_mvola_start_listing_payment($request->get_json_params() ?: array());
            return is_wp_error($result) ? $result : rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/billing/mvola/status', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return function_exists('platform_billing_ensure_request_authorized')
                ? platform_billing_ensure_request_authorized($request)
                : new WP_Error('platform_2424_mvola_billing_unavailable', 'Billing module indisponible.', array('status' => 500));
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_2424_mvola_check_status($request->get_json_params() ?: array());
            return is_wp_error($result) ? $result : rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/billing/mvola/callback', array(
        'methods' => WP_REST_Server::CREATABLE . ',' . WP_REST_Server::EDITABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return function_exists('platform_billing_ensure_request_authorized')
                ? platform_billing_ensure_request_authorized($request)
                : new WP_Error('platform_2424_mvola_billing_unavailable', 'Billing module indisponible.', array('status' => 500));
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_2424_mvola_handle_callback_payload($request->get_json_params() ?: array());
            return is_wp_error($result) ? $result : rest_ensure_response($result);
        },
    ));
});
