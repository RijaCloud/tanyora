<?php
/**
 * Direct PAPI bridge. WooCommerce is the order ledger; 2424 owns link
 * creation, notification verification and activation of its entitlements.
 * Version: 1.0.1
 */

if (!defined('ABSPATH')) {
    exit;
}

function platform_2424_papi_notification_url() {
    return add_query_arg('rest_route', '/2424/v1/billing/papi/webhook', trailingslashit(site_url()));
}

function platform_2424_papi_configuration_status() {
    $enabled = (string) get_option('platform_2424_papi_enabled', 'no') === 'yes';
    $has_api_key = (string) get_option('platform_2424_papi_api_key', '') !== '';
    $has_webhook_secret = (string) get_option('platform_2424_papi_webhook_secret', '') !== '';

    return array(
        'enabled' => $enabled,
        'hasApiKey' => $has_api_key,
        'hasWebhookSecret' => $has_webhook_secret,
        'ready' => $enabled && $has_api_key && $has_webhook_secret,
        'missing' => array_values(array_filter(array(
            !$enabled ? 'activation' : '',
            !$has_api_key ? 'api_key' : '',
            !$has_webhook_secret ? 'webhook_secret' : '',
        ))),
    );
}

function platform_2424_papi_is_enabled() {
    $configuration = platform_2424_papi_configuration_status();
    return $configuration['ready'];
}

function platform_2424_papi_attempts($order) {
    $attempts = json_decode((string) $order->get_meta('_platform_papi_direct_attempts'), true);
    return is_array($attempts) ? $attempts : array();
}

function platform_2424_papi_save_attempts($order, $attempts) {
    $order->update_meta_data('_platform_papi_direct_attempts', wp_json_encode(array_values($attempts)));
}

function platform_2424_papi_intent_fingerprint($intent) {
    return hash('sha256', implode('|', array(
        absint($intent['userId'] ?? 0),
        sanitize_key((string) ($intent['flow'] ?? '')),
        sanitize_key((string) ($intent['planId'] ?? '')),
        sanitize_key((string) ($intent['billingPeriod'] ?? '')),
        absint($intent['listingId'] ?? 0),
        sanitize_key((string) ($intent['action'] ?? '')),
    )));
}

function platform_2424_papi_build_intent($payload) {
    $user_id = absint($payload['wpUserId'] ?? 0);
    $flow = sanitize_key((string) ($payload['flow'] ?? ''));
    if (!$user_id || !get_userdata($user_id) || !in_array($flow, array('subscription', 'listing'), true)) {
        return new WP_Error('platform_papi_intent_invalid', 'Intention de paiement invalide.', array('status' => 400));
    }

    $intent = array('userId' => $user_id, 'flow' => $flow);
    if ($flow === 'subscription') {
        $plan_id = sanitize_key((string) ($payload['planId'] ?? ''));
        $billing_period = platform_billing_normalize_billing_period($payload['billingPeriod'] ?? 'monthly');
        if (!in_array($plan_id, array('essentiel', 'business'), true)) {
            return new WP_Error('platform_papi_plan_invalid', 'Formule invalide.', array('status' => 400));
        }
        $sku_map = platform_billing_plan_product_sku_map();
        $product_id = $billing_period === 'annual' ? platform_billing_get_product_id_for_plan($plan_id, 'annual') : 0;
        if (!$product_id) {
            $product_id = platform_billing_get_product_id_by_sku($sku_map[$billing_period][$plan_id] ?? '');
        }
        if (!$product_id) {
            $product_id = platform_billing_get_product_id_for_plan($plan_id, $billing_period);
        }
        $intent = array_merge($intent, array('planId' => $plan_id, 'billingPeriod' => $billing_period, 'productId' => $product_id));
    } else {
        $listing_id = absint($payload['listingId'] ?? 0);
        $action = sanitize_key((string) ($payload['action'] ?? 'post')) === 'boost' ? 'boost' : 'post';
        $quote = platform_submissions_get_listing_payable_quote(array('wpUserId' => $user_id, 'listingId' => $listing_id, 'action' => $action));
        if (is_wp_error($quote)) {
            return $quote;
        }
        $definition = platform_submissions_get_pricing_definition($quote['pricingCode']);
        $product_id = absint($definition['configuredProductId'] ?? 0);
        if (!$product_id && !empty($definition['productSku'])) {
            $product_id = absint(wc_get_product_id_by_sku($definition['productSku']));
        }
        $intent = array_merge($intent, array(
            'listingId' => $listing_id,
            'pricingCode' => sanitize_key((string) $quote['pricingCode']),
            'action' => $action,
            'scheduledPublishAt' => sanitize_text_field((string) ($payload['scheduledPublishAt'] ?? '')),
            'returnTarget' => sanitize_key((string) ($payload['returnTarget'] ?? 'classifieds')),
            'productId' => $product_id,
        ));
    }

    if (empty($intent['productId']) || !wc_get_product($intent['productId'])) {
        return new WP_Error('platform_papi_product_missing', 'Produit WooCommerce introuvable.', array('status' => 400));
    }
    $intent['fingerprint'] = platform_2424_papi_intent_fingerprint($intent);
    return $intent;
}

function platform_2424_papi_find_reusable_order($intent) {
    $orders = wc_get_orders(array(
        'limit' => 5,
        'orderby' => 'date',
        'order' => 'DESC',
        'status' => array('pending', 'failed', 'on-hold'),
        'meta_query' => array(array('key' => '_platform_papi_direct_fingerprint', 'value' => $intent['fingerprint'])),
    ));
    return !empty($orders) ? $orders[0] : null;
}

function platform_2424_papi_start_lock_name($fingerprint) {
    return 'platform_2424_papi_lock_' . substr(sanitize_key($fingerprint), 0, 40);
}

function platform_2424_papi_acquire_start_lock($fingerprint) {
    $lock_name = platform_2424_papi_start_lock_name($fingerprint);
    if (add_option($lock_name, time(), '', 'no')) {
        return $lock_name;
    }

    // A stale lock must not block a retry indefinitely after a PHP timeout.
    $locked_at = absint(get_option($lock_name, 0));
    if ($locked_at && $locked_at < time() - MINUTE_IN_SECONDS) {
        delete_option($lock_name);
        if (add_option($lock_name, time(), '', 'no')) {
            return $lock_name;
        }
    }
    return false;
}

function platform_2424_papi_release_start_lock($lock_name) {
    if ($lock_name) {
        delete_option($lock_name);
    }
}

function platform_2424_papi_create_order($intent) {
    $user = get_userdata($intent['userId']);
    $product = wc_get_product($intent['productId']);
    if (!$user || !$product) {
        return new WP_Error('platform_papi_order_product_missing', 'Produit WooCommerce introuvable.', array('status' => 400));
    }
    $order = wc_create_order(array('customer_id' => $intent['userId'], 'created_via' => '2424-papi-direct'));
    if (is_wp_error($order)) {
        return $order;
    }
    $order->set_currency('MGA');
    $order->set_payment_method('platform_papi');
    $order->set_payment_method_title('Paiement sécurisé');
    $order->set_billing_email((string) $user->user_email);
    $order->set_billing_first_name((string) ($user->first_name ?: $user->display_name));
    $order->set_billing_last_name((string) $user->last_name);
    $order->add_product($product, 1);
    foreach ($intent as $key => $value) {
        if (!in_array($key, array('productId', 'fingerprint'), true)) {
            $order->update_meta_data('_platform_papi_' . $key, is_scalar($value) ? sanitize_text_field((string) $value) : wp_json_encode($value));
        }
    }
    $order->update_meta_data('_platform_papi_direct_fingerprint', $intent['fingerprint']);
    $order->calculate_totals(false);
    // Keep the quoted amount and product on the order so later retries cannot
    // silently turn a pending listing payment into a different purchase.
    $order->update_meta_data('_platform_papi_product_id', (string) $intent['productId']);
    $order->update_meta_data('_platform_papi_expected_amount', wc_format_decimal($order->get_total(), 2));
    $order->set_status('pending', 'Commande créée par le pont PAPI 2424.');
    $order->save();
    $order->update_meta_data('_platform_papi_direct_reference', '2424-' . $order->get_id());
    $order->save();
    platform_billing_log('PAPI direct order created.', array(
        'orderId' => $order->get_id(),
        'reference' => $order->get_meta('_platform_papi_direct_reference'),
        'flow' => $intent['flow'],
        'userId' => $intent['userId'],
        'productId' => $intent['productId'],
    ));
    return $order;
}

function platform_2424_papi_active_attempt($order) {
    foreach (array_reverse(platform_2424_papi_attempts($order)) as $attempt) {
        if (($attempt['status'] ?? '') === 'pending' && !empty($attempt['paymentLink']) && absint($attempt['expiresAt'] ?? 0) > time()) {
            return $attempt;
        }
    }
    return null;
}

function platform_2424_papi_return_url($order) {
    $base = function_exists('platform_2424_get_public_site_url') ? untrailingslashit(platform_2424_get_public_site_url()) : untrailingslashit(home_url('/'));
    $args = array('order_id' => $order->get_id(), 'key' => $order->get_order_key());
    if ($order->get_meta('_platform_papi_flow') === 'listing') {
        $args['flow'] = 'listing';
        $target = sanitize_key((string) $order->get_meta('_platform_papi_returnTarget'));
        $args['returnTarget'] = in_array($target, array('classifieds', 'jobs', 'tenders', 'articles'), true) ? $target : 'classifieds';
    } else {
        $args['plan'] = sanitize_key((string) $order->get_meta('_platform_papi_planId'));
    }
    return add_query_arg($args, $base . '/checkout/retour');
}

function platform_2424_papi_order_description($order) {
    $flow = sanitize_key((string) $order->get_meta('_platform_papi_flow'));
    if ($flow === 'subscription') {
        $plan = sanitize_key((string) $order->get_meta('_platform_papi_planId'));
        $plan_label = $plan === 'business' ? 'Business' : 'Essentiel';
        $period = platform_billing_normalize_billing_period($order->get_meta('_platform_papi_billingPeriod'));
        return sprintf('Abonnement %s %s', $plan_label, $period === 'annual' ? 'annuel' : 'mensuel');
    }

    $pricing_code = sanitize_key((string) $order->get_meta('_platform_papi_pricingCode'));
    $definition = function_exists('platform_submissions_get_pricing_definition')
        ? platform_submissions_get_pricing_definition($pricing_code)
        : array();
    $kind = sanitize_key((string) ($definition['kind'] ?? ''));
    $action = sanitize_key((string) ($definition['action'] ?? $order->get_meta('_platform_papi_action')));
    $duration = max(1, absint($definition['durationDays'] ?? 0));
    $kind_labels = array(
        'classified' => 'Petites annonces',
        'job' => 'Offres d’emploi',
        'tender' => 'Appels d’offres',
        'news' => 'News',
    );
    $kind_label = $kind_labels[$kind] ?? 'Publication';

    if ($action === 'boost') {
        return sprintf('Boost %d jours - %s', $duration, $kind_label);
    }
    if ($action === 'extend') {
        return sprintf('Prolongation %d jours - %s', $duration, $kind_label);
    }
    return sprintf('Publication %d jours - %s', $duration, $kind_label);
}

function platform_2424_papi_sanitize_description($description) {
    $description = wp_strip_all_tags((string) $description, true);
    $description = trim((string) preg_replace('/\s+/u', ' ', $description));
    if (function_exists('mb_substr')) {
        return mb_substr($description, 0, 255, 'UTF-8');
    }
    return substr($description, 0, 255);
}

function platform_2424_papi_validate_listing_order($order) {
    if (sanitize_key((string) $order->get_meta('_platform_papi_flow')) !== 'listing') {
        return true;
    }

    $product_id = absint($order->get_meta('_platform_papi_product_id'));
    if (!$product_id) {
        $items = $order->get_items('line_item');
        $first_item = !empty($items) ? reset($items) : null;
        $product_id = $first_item instanceof WC_Order_Item_Product ? $first_item->get_product_id() : 0;
    }
    $product = $product_id ? wc_get_product($product_id) : false;
    if (!$product || $product->get_status() !== 'publish' || !$product->is_purchasable()) {
        return new WP_Error('platform_papi_listing_product_invalid', 'Le tarif sélectionné n’est plus disponible.', array('status' => 422));
    }

    $amount = (float) $order->get_total();
    $expected_amount = (float) $order->get_meta('_platform_papi_expected_amount');
    if ($expected_amount <= 0) {
        $expected_amount = $amount;
    }
    if ($amount < 300 || abs($amount - $expected_amount) > 0.01) {
        return new WP_Error('platform_papi_listing_amount_invalid', 'Le montant du tarif sélectionné est invalide.', array('status' => 422));
    }

    return true;
}

function platform_2424_papi_link_error_status($http_status) {
    $http_status = absint($http_status);
    return in_array($http_status, array(400, 409, 422), true) ? $http_status : 502;
}

function platform_2424_papi_build_link_payload($order) {
    if (!$order instanceof WC_Order) {
        return new WP_Error('platform_papi_order_invalid', 'Commande invalide.', array('status' => 400));
    }

    $listing_validation = platform_2424_papi_validate_listing_order($order);
    if (is_wp_error($listing_validation)) {
        return $listing_validation;
    }

    $amount = (float) $order->get_total();
    $reference = sanitize_text_field((string) $order->get_meta('_platform_papi_direct_reference'));
    if ($amount < 300 || strtoupper((string) $order->get_currency()) !== 'MGA' || $reference === '') {
        return new WP_Error('platform_papi_order_amount_invalid', 'Le montant de la commande est invalide.', array('status' => 422));
    }

    $name = trim((string) $order->get_billing_first_name() . ' ' . (string) $order->get_billing_last_name());
    $valid_hours = absint(get_option('platform_2424_papi_link_valid_duration_hours', 1));
    $payload = array(
        'amount' => $amount,
        'clientName' => $name !== '' ? $name : 'Client 2424',
        'reference' => $reference,
        'description' => platform_2424_papi_sanitize_description(platform_2424_papi_order_description($order)),
        'successUrl' => platform_2424_papi_return_url($order),
        'failureUrl' => platform_2424_papi_return_url($order),
        'notificationUrl' => platform_2424_papi_notification_url(),
        'validDuration' => max(1, $valid_hours),
        'payerEmail' => (string) $order->get_billing_email(),
    );
    if ($payload['description'] === '') {
        return new WP_Error('platform_papi_order_description_invalid', 'La description du paiement est invalide.', array('status' => 422));
    }
    if ((string) get_option('platform_2424_papi_test_mode', 'no') === 'yes') {
        $payload['isTestMode'] = true;
        $payload['testReason'] = 'Tests internes 2424';
    }
    return $payload;
}

function platform_2424_papi_create_link($order) {
    if (!platform_2424_papi_is_enabled()) {
        platform_billing_log('PAPI direct payment link blocked by incomplete configuration.', array(
            'orderId' => $order->get_id(),
            'missing' => platform_2424_papi_configuration_status()['missing'],
        ));
        return new WP_Error('platform_papi_not_configured', 'Le paiement est temporairement indisponible.', array('status' => 503));
    }
    $payload = platform_2424_papi_build_link_payload($order);
    if (is_wp_error($payload)) {
        platform_2424_log_event('error', 'billing', 'PAPI direct payment link blocked by invalid order.', array(
            'orderId' => $order->get_id(),
            'flow' => sanitize_key((string) $order->get_meta('_platform_papi_flow')),
            'pricingCode' => sanitize_key((string) $order->get_meta('_platform_papi_pricingCode')),
            'amount' => (string) $order->get_total(),
            'errorCode' => $payload->get_error_code(),
        ));
        $order->add_order_note('Création du lien de paiement refusée (validation commande : ' . sanitize_key($payload->get_error_code()) . ').');
        return $payload;
    }
    $response = wp_remote_post('https://app.papi.mg/engine/api/payment-links', array(
        'timeout' => 30,
        'headers' => array('Content-Type' => 'application/json', 'Token' => (string) get_option('platform_2424_papi_api_key', '')),
        'body' => wp_json_encode($payload),
    ));
    if (is_wp_error($response)) {
        $order->add_order_note('Création du lien de paiement impossible. Voir les journaux 2424.');
        platform_2424_log_event('error', 'billing', 'PAPI direct payment link request failed.', array(
            'orderId' => $order->get_id(),
            'flow' => sanitize_key((string) $order->get_meta('_platform_papi_flow')),
            'pricingCode' => sanitize_key((string) $order->get_meta('_platform_papi_pricingCode')),
            'amount' => (string) $order->get_total(),
            'error' => sanitize_text_field($response->get_error_message()),
        ));
        return new WP_Error('platform_papi_link_request_failed', 'Impossible de joindre le service de paiement.', array('status' => 502));
    }
    $body = json_decode((string) wp_remote_retrieve_body($response), true);
    $data = is_array($body) ? ($body['data'] ?? null) : null;
    $http_status = wp_remote_retrieve_response_code($response);
    if ($http_status < 200 || $http_status >= 300 || !is_array($data) || empty($data['paymentLink']) || empty($data['notificationToken'])) {
        $error_code = sanitize_key((string) ($body['error']['code'] ?? 'invalid_response'));
        $error_message = sanitize_text_field((string) ($body['error']['message'] ?? ''));
        $order->add_order_note('Création du lien de paiement refusée (diagnostic : ' . $error_code . ').');
        platform_2424_log_event('error', 'billing', 'PAPI direct payment link creation failed.', array(
            'orderId' => $order->get_id(),
            'flow' => sanitize_key((string) $order->get_meta('_platform_papi_flow')),
            'pricingCode' => sanitize_key((string) $order->get_meta('_platform_papi_pricingCode')),
            'amount' => (string) $order->get_total(),
            'httpStatus' => $http_status,
            'errorCode' => $error_code,
            'errorMessage' => $error_message,
        ));
        return new WP_Error('platform_papi_link_invalid', 'Le lien de paiement n a pas pu être créé.', array('status' => platform_2424_papi_link_error_status($http_status)));
    }
    $expires_at = !empty($data['linkExpirationDateTime']) ? (int) floor(((int) $data['linkExpirationDateTime']) / 1000) : time() + (max(1, absint($payload['validDuration'])) * HOUR_IN_SECONDS);
    $attempts = platform_2424_papi_attempts($order);
    $attempts[] = array('notificationToken' => sanitize_text_field((string) $data['notificationToken']), 'paymentLink' => esc_url_raw((string) $data['paymentLink']), 'expiresAt' => $expires_at, 'status' => 'pending', 'createdAt' => time());
    platform_2424_papi_save_attempts($order, $attempts);
    $order->update_meta_data('_platform_papi_direct_status', 'pending');
    $order->save();
    return end($attempts);
}

function platform_2424_papi_start_payment($payload) {
    $intent = platform_2424_papi_build_intent($payload);
    if (is_wp_error($intent)) {
        return $intent;
    }

    $lock_key = $intent['flow'] === 'subscription' ? hash('sha256', 'subscription|' . $intent['userId']) : $intent['fingerprint'];
    $lock_name = platform_2424_papi_acquire_start_lock($lock_key);
    if (!$lock_name) {
        if ($intent['flow'] === 'subscription') {
            return new WP_Error('platform_papi_request_in_progress', 'Cette demande est déjà en cours de traitement.', array('status' => 409));
        }
        // A simultaneous request may have just created the pending order. Return
        // that checkout rather than minting a second order for the same intent.
        usleep(250000);
        $order = platform_2424_papi_find_reusable_order($intent);
        $attempt = $order ? platform_2424_papi_active_attempt($order) : null;
        if ($order && $attempt) {
            return array('orderId' => $order->get_id(), 'orderKey' => $order->get_order_key(), 'checkoutUrl' => $attempt['paymentLink']);
        }
        return new WP_Error('platform_papi_request_in_progress', 'Cette demande est déjà en cours de traitement.', array('status' => 409));
    }

    try {
        if ($intent['flow'] === 'subscription') {
            $product = wc_get_product($intent['productId']);
            $price = $product ? $product->get_price() : '';
            if ($price === '' || !is_numeric($price) || !is_finite((float) $price) || (float) $price < 0) {
                return new WP_Error('platform_papi_price_invalid', 'Le tarif est temporairement indisponible.', array('status' => 400));
            }
            if ((float) $price === 0.0) {
                $current = platform_billing_get_subscription_snapshot($intent['userId']);
                if (in_array($current['status'] ?? '', array('active', 'trialing'), true)) {
                    if (($current['planId'] ?? '') === $intent['planId']) {
                        return array('activated' => true, 'planId' => $intent['planId']);
                    }
                    if (($current['planId'] ?? '') === 'business') {
                        return new WP_Error('platform_papi_downgrade_blocked', 'Votre formule actuelle est supérieure.', array('status' => 403));
                    }
                }
                $result = platform_billing_activate_subscription_access($intent['userId'], $intent['planId'], $intent['billingPeriod'], 'zero_price');
                if (is_wp_error($result)) return $result;
                platform_billing_log('Zero-price subscription activated.', array('planId' => $intent['planId'], 'billingPeriod' => $intent['billingPeriod']));
                return array('activated' => true, 'planId' => $intent['planId']);
            }
            if (!empty($payload['expectedZeroPrice'])) {
                return new WP_Error('platform_papi_price_changed', 'Le tarif a changé. Veuillez consulter les tarifs.', array('status' => 409));
            }
        }
        $configuration = platform_2424_papi_configuration_status();
        if (!$configuration['ready']) {
            platform_billing_log('PAPI direct checkout blocked by incomplete configuration.', array(
                'userId' => absint($payload['wpUserId'] ?? 0),
                'flow' => sanitize_key((string) ($payload['flow'] ?? '')),
                'missing' => $configuration['missing'],
            ));
            return new WP_Error('platform_papi_not_configured', 'Le paiement est temporairement indisponible.', array('status' => 503));
        }
        $order = platform_2424_papi_find_reusable_order($intent);
        if (!$order) {
            $order = platform_2424_papi_create_order($intent);
            if (is_wp_error($order)) {
                return $order;
            }
        }
        $attempt = platform_2424_papi_active_attempt($order);
        if (!$attempt) {
            if ($order->has_status('failed')) {
                $order->update_status('pending', 'Nouvelle tentative de paiement PAPI.');
            }
            $attempt = platform_2424_papi_create_link($order);
            if (is_wp_error($attempt)) {
                return $attempt;
            }
        }
        return array('orderId' => $order->get_id(), 'orderKey' => $order->get_order_key(), 'checkoutUrl' => $attempt['paymentLink']);
    } finally {
        platform_2424_papi_release_start_lock($lock_name);
    }
}

function platform_2424_papi_verify_signature($raw_body, $header) {
    $secret = (string) get_option('platform_2424_papi_webhook_secret', '');
    $parts = array();
    foreach (explode(',', (string) $header) as $item) {
        $pair = explode('=', trim($item), 2);
        if (count($pair) === 2) {
            $parts[$pair[0]] = $pair[1];
        }
    }
    $timestamp = $parts['t'] ?? '';
    $signature = $parts['v1'] ?? '';
    if ($secret === '' || !ctype_digit($timestamp) || !preg_match('/\A[0-9a-f]{64}\z/', $signature) || abs(time() - (int) $timestamp) > 300) {
        return false;
    }
    return hash_equals(hash_hmac('sha256', $timestamp . '.' . $raw_body, $secret), $signature);
}

function platform_2424_papi_find_order_by_reference($reference) {
    $orders = wc_get_orders(array('limit' => 1, 'meta_key' => '_platform_papi_direct_reference', 'meta_value' => $reference));
    return !empty($orders) ? $orders[0] : null;
}

function platform_2424_papi_payment_reference_is_unique($payment_reference, $order_id) {
    if ($payment_reference === '') {
        return true;
    }
    $orders = wc_get_orders(array(
        'limit' => 1,
        'meta_key' => '_platform_papi_direct_payment_reference',
        'meta_value' => $payment_reference,
    ));
    return empty($orders) || absint($orders[0]->get_id()) === absint($order_id);
}

function platform_2424_papi_update_attempt_status($order, $token, $status, $payment_reference = '') {
    $attempts = platform_2424_papi_attempts($order);
    foreach ($attempts as &$attempt) {
        if (hash_equals((string) ($attempt['notificationToken'] ?? ''), (string) $token)) {
            $attempt['status'] = $status;
            if ($payment_reference !== '') {
                $attempt['paymentReference'] = $payment_reference;
            }
            break;
        }
    }
    unset($attempt);
    platform_2424_papi_save_attempts($order, $attempts);
}

function platform_2424_papi_activate_paid_order($order_id) {
    $order = wc_get_order($order_id);
    if (!$order || !in_array($order->get_payment_method(), array('platform_papi', 'papi_gateway'), true) || $order->get_meta('_platform_papi_activated') === 'yes') {
        return;
    }
    $flow = $order->get_meta('_platform_papi_flow');
    $user_id = absint($order->get_meta('_platform_papi_userId'));
    if ($flow === 'subscription') {
        $access = platform_billing_activate_subscription_access($user_id, sanitize_key($order->get_meta('_platform_papi_planId')), platform_billing_normalize_billing_period($order->get_meta('_platform_papi_billingPeriod')), 'papi');
        if (is_wp_error($access)) {
            return;
        }
    } elseif ($flow === 'listing') {
        $listing_id = absint($order->get_meta('_platform_papi_listingId'));
        $pricing_code = sanitize_key($order->get_meta('_platform_papi_pricingCode'));
        if (!$listing_id || !$pricing_code) {
            return;
        }
        if (strpos($pricing_code, 'boost_7d') !== false) {
            platform_submissions_apply_boost_to_post($listing_id, $pricing_code, array('preserveExisting' => true));
        } else {
            platform_submissions_apply_expiration_to_post($listing_id, $pricing_code, array('preserveExisting' => true));
            wp_update_post(array('ID' => $listing_id, 'post_status' => 'publish'));
        }
        update_post_meta($listing_id, 'payment_method', 'papi');
        update_post_meta($listing_id, 'payment_status', 'paid');
        update_post_meta($listing_id, 'woo_order_id', $order->get_id());
    } else {
        return;
    }
    $order->update_meta_data('_platform_papi_activated', 'yes');
    $order->save();
}
add_action('woocommerce_payment_complete', 'platform_2424_papi_activate_paid_order', 20);
add_action('woocommerce_order_status_completed', 'platform_2424_papi_activate_paid_order', 20);

function platform_2424_papi_completed_order_status($status, $order_id, $order = null) {
    $order = $order instanceof WC_Order ? $order : wc_get_order($order_id);
    return $order instanceof WC_Order && in_array($order->get_payment_method(), array('platform_papi', 'papi_gateway'), true) ? 'completed' : $status;
}
add_filter('woocommerce_payment_complete_order_status', 'platform_2424_papi_completed_order_status', 20, 3);

function platform_2424_papi_handle_webhook($request) {
    $raw_body = $request->get_body();
    if (!platform_2424_papi_verify_signature($raw_body, $request->get_header('x-papi-signature'))) {
        return new WP_Error('platform_papi_signature_invalid', 'Notification non autorisée.', array('status' => 401));
    }
    $notification = json_decode($raw_body, true);
    $reference = sanitize_text_field((string) ($notification['merchantPaymentReference'] ?? ''));
    $token = sanitize_text_field((string) ($notification['notificationToken'] ?? ''));
    $status = strtoupper(sanitize_key((string) ($notification['paymentStatus'] ?? '')));
    $order = $reference !== '' ? platform_2424_papi_find_order_by_reference($reference) : null;
    if (!$order || !in_array($status, array('SUCCESS', 'PENDING', 'FAILED'), true)) {
        return new WP_Error('platform_papi_notification_invalid', 'Notification invalide.', array('status' => 400));
    }
    $matching_attempt = false;
    foreach (platform_2424_papi_attempts($order) as $attempt) {
        if (hash_equals((string) ($attempt['notificationToken'] ?? ''), $token)) {
            $matching_attempt = true;
            break;
        }
    }
    if (!$matching_attempt || strtoupper((string) ($notification['currency'] ?? '')) !== strtoupper((string) $order->get_currency()) || round((float) ($notification['amount'] ?? -1)) !== round((float) $order->get_total())) {
        return new WP_Error('platform_papi_notification_mismatch', 'Notification non concordante.', array('status' => 403));
    }
    $payment_reference = sanitize_text_field((string) ($notification['paymentReference'] ?? ''));
    if (!platform_2424_papi_payment_reference_is_unique($payment_reference, $order->get_id())) {
        return new WP_Error('platform_papi_payment_reference_reused', 'Notification non concordante.', array('status' => 403));
    }
    platform_2424_papi_update_attempt_status($order, $token, strtolower($status), $payment_reference);
    $order->update_meta_data('_platform_papi_direct_status', strtolower($status));
    if ($payment_reference !== '') {
        $order->update_meta_data('_platform_papi_direct_payment_reference', $payment_reference);
    }
    $order->update_meta_data('_platform_papi_direct_merchant_reference', $reference);
    $order->update_meta_data('_platform_papi_direct_payment_method', sanitize_key((string) ($notification['paymentMethod'] ?? '')));
    $order->save();
    if ($status === 'SUCCESS' && !$order->is_paid()) {
        $order->payment_complete($payment_reference);
        if (!$order->has_status(array('completed'))) {
            $order->update_status('completed', 'Paiement PAPI confirmé.');
        }
    } elseif ($status === 'FAILED' && !$order->is_paid()) {
        $order->update_status('failed', 'Paiement PAPI échoué.');
    }
    return rest_ensure_response(array('ok' => true));
}

function platform_2424_papi_order_status($payload) {
    $user_id = absint($payload['wpUserId'] ?? 0);
    $order_id = absint($payload['orderId'] ?? 0);
    $order_key = sanitize_text_field((string) ($payload['key'] ?? ''));
    $order = $order_id ? wc_get_order($order_id) : false;
    $bound_user_id = absint($order ? $order->get_meta('_platform_papi_userId') : 0);
    $user = $user_id ? get_userdata($user_id) : false;
    $is_legacy_order = $order && $order->get_payment_method() === 'papi_gateway' && !$bound_user_id
        && $user && strtolower((string) $order->get_billing_email()) === strtolower((string) $user->user_email);
    if (!$user_id || !$user || !$order || !in_array($order->get_payment_method(), array('platform_papi', 'papi_gateway'), true) || !hash_equals($order->get_order_key(), $order_key) || ($bound_user_id !== $user_id && !$is_legacy_order)) {
        return new WP_Error('platform_papi_order_not_found', 'Commande introuvable.', array('status' => 404));
    }
    $status = $order->is_paid() ? 'paid' : (in_array($order->get_status(), array('failed', 'cancelled'), true) ? 'failed' : 'pending');
    return array('orderId' => $order->get_id(), 'paymentStatus' => $status, 'planId' => sanitize_key((string) $order->get_meta('_platform_papi_planId')), 'listingId' => absint($order->get_meta('_platform_papi_listingId')));
}

function platform_2424_papi_retry_payment($payload) {
    $status = platform_2424_papi_order_status($payload);
    if (is_wp_error($status)) {
        return $status;
    }
    $order = wc_get_order(absint($status['orderId']));
    if (!$order || $order->is_paid()) {
        return new WP_Error('platform_papi_retry_unavailable', 'Cette commande ne peut pas être relancée.', array('status' => 409));
    }
    if ($order->get_payment_method() !== 'platform_papi') {
        return new WP_Error('platform_papi_retry_legacy', 'Cette commande doit être finalisée avec son parcours de paiement initial.', array('status' => 409));
    }
    $attempt = platform_2424_papi_active_attempt($order);
    if (!$attempt) {
        if ($order->has_status(array('failed', 'cancelled'))) {
            $order->update_status('pending', 'Nouvelle tentative de paiement demandée par le client.');
        }
        $attempt = platform_2424_papi_create_link($order);
        if (is_wp_error($attempt)) {
            return $attempt;
        }
    }
    return array('orderId' => $order->get_id(), 'orderKey' => $order->get_order_key(), 'checkoutUrl' => $attempt['paymentLink']);
}

add_action('rest_api_init', function () {
    register_rest_route('2424/v1', '/billing/papi/start', array('methods' => WP_REST_Server::CREATABLE, 'permission_callback' => 'platform_billing_ensure_request_authorized', 'callback' => function ($request) {
        $result = platform_2424_papi_start_payment($request->get_json_params() ?: array());
        return is_wp_error($result) ? $result : rest_ensure_response($result);
    }));
    register_rest_route('2424/v1', '/billing/papi/status', array('methods' => WP_REST_Server::CREATABLE, 'permission_callback' => 'platform_billing_ensure_request_authorized', 'callback' => function ($request) {
        $result = platform_2424_papi_order_status($request->get_json_params() ?: array());
        return is_wp_error($result) ? $result : rest_ensure_response($result);
    }));
    register_rest_route('2424/v1', '/billing/papi/retry', array('methods' => WP_REST_Server::CREATABLE, 'permission_callback' => 'platform_billing_ensure_request_authorized', 'callback' => function ($request) {
        $result = platform_2424_papi_retry_payment($request->get_json_params() ?: array());
        return is_wp_error($result) ? $result : rest_ensure_response($result);
    }));
    register_rest_route('2424/v1', '/billing/papi/webhook', array('methods' => WP_REST_Server::CREATABLE, 'permission_callback' => '__return_true', 'callback' => 'platform_2424_papi_handle_webhook'));
});
