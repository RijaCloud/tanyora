<?php
/**
 * 2424 Next Revalidate Webhook module
 * Description: Envoie un webhook a Next.js pour declencher revalidatePath/revalidateTag.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!function_exists('next_revalidate_webhook_url')) {
    function next_revalidate_webhook_url() {
        $base_url = function_exists('platform_2424_get_public_site_url')
            ? (string) platform_2424_get_public_site_url()
            : (string) get_option('platform_2424_public_site_url', '');

        return $base_url !== '' ? untrailingslashit($base_url) . '/api/revalidate' : '';
    }
}

if (!function_exists('next_revalidate_webhook_secret')) {
    function next_revalidate_webhook_secret() {
        // Cache invalidation is an internal plugin-to-Next request. Reuse the
        // existing shared secret instead of requiring a second secret to drift.
        return function_exists('platform_submissions_secret')
            ? (string) platform_submissions_secret()
            : (string) get_option('platform_2424_submissions_secret', '');
    }
}

if (!function_exists('next_revalidate_collect_taxonomies')) {
    function next_revalidate_collect_taxonomies($post_id, $post_type) {
        $result = array();
        $taxonomies = get_object_taxonomies($post_type, 'names');

        foreach ($taxonomies as $taxonomy) {
            $terms = wp_get_post_terms($post_id, $taxonomy, array('fields' => 'slugs'));
            if (is_wp_error($terms) || empty($terms)) {
                continue;
            }
            $result[$taxonomy] = array_values($terms);
        }

        return $result;
    }
}

if (!function_exists('next_revalidate_post_payload')) {
    function next_revalidate_post_payload($event, $post) {
        $taxonomies = next_revalidate_collect_taxonomies($post->ID, $post->post_type);
        $categories = array();

        if (isset($taxonomies['category']) && is_array($taxonomies['category'])) {
            $categories = $taxonomies['category'];
        }

        return array(
            'event' => $event,
            'postId' => (int) $post->ID,
            'postType' => (string) $post->post_type,
            'slug' => (string) $post->post_name,
            'status' => (string) $post->post_status,
            'dateGmt' => (string) $post->post_date_gmt,
            'modifiedGmt' => (string) $post->post_modified_gmt,
            'categories' => $categories,
            'taxonomies' => $taxonomies,
        );
    }
}

if (!function_exists('next_revalidate_send_payload')) {
    function next_revalidate_log($level, $message, $context = array()) {
        if (function_exists('platform_2424_log_event')) {
            platform_2424_log_event($level, 'revalidate', $message, $context);
            return;
        }

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $suffix = empty($context) ? '' : ' ' . wp_json_encode($context);
            error_log('[next-revalidate] ' . $message . $suffix);
        }
    }

    function next_revalidate_send_payload($payload) {
        $url = next_revalidate_webhook_url();
        $secret = next_revalidate_webhook_secret();

        if (!$url || !$secret) {
            next_revalidate_log('warning', 'Webhook de revalidation ignoré car la configuration est incomplète.', array(
                'has_url' => $url ? '1' : '0',
                'has_secret' => $secret ? '1' : '0',
            ));
            return false;
        }

        $response = wp_remote_post($url, array(
            'method' => 'POST',
            'timeout' => 8,
            'headers' => array(
                'Content-Type' => 'application/json',
                'x-2424-internal-secret' => $secret,
            ),
            'body' => wp_json_encode($payload),
        ));

        if (is_wp_error($response)) {
            next_revalidate_log('error', 'Échec du webhook de revalidation.', array(
                'message' => $response->get_error_message(),
                'url' => $url,
            ));
            return false;
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code >= 400) {
            next_revalidate_log('error', 'Webhook de revalidation en erreur HTTP.', array(
                'status' => $code,
                'body' => wp_remote_retrieve_body($response),
                'url' => $url,
            ));
            return false;
        }

        next_revalidate_log('info', 'Webhook de revalidation envoyé.', array(
            'status' => $code,
            'url' => $url,
            'event' => isset($payload['event']) ? (string) $payload['event'] : '',
        ));

        return true;
    }
}

if (!function_exists('next_revalidate_deferred_group')) {
    function next_revalidate_deferred_group() {
        return '2424-revalidate';
    }
}

if (!function_exists('next_revalidate_deferred_hook')) {
    function next_revalidate_deferred_hook() {
        return 'next_revalidate_process_deferred_payload';
    }
}

if (!function_exists('next_revalidate_deferred_retry_delays')) {
    function next_revalidate_deferred_retry_delays() {
        return array(MINUTE_IN_SECONDS, 5 * MINUTE_IN_SECONDS, 30 * MINUTE_IN_SECONDS, 2 * HOUR_IN_SECONDS, 12 * HOUR_IN_SECONDS);
    }
}

if (!function_exists('next_revalidate_schedule_deferred_payload')) {
    function next_revalidate_schedule_deferred_payload($payload, $attempt = 0, $scheduled_at = null) {
        if (!function_exists('as_schedule_single_action')) {
            next_revalidate_log('error', 'Action Scheduler indisponible pour la revalidation différée.', array(
                'event' => isset($payload['event']) ? (string) $payload['event'] : '',
            ));
            return 0;
        }

        $job = array(
            'payload' => is_array($payload) ? $payload : array(),
            'attempt' => max(0, absint($attempt)),
        );

        return absint(as_schedule_single_action(
            max(time() + 1, $scheduled_at === null ? time() + 1 : absint($scheduled_at)),
            next_revalidate_deferred_hook(),
            array($job),
            next_revalidate_deferred_group(),
            false
        ));
    }
}

if (!function_exists('next_revalidate_defer_payload')) {
    function next_revalidate_defer_payload($payload) {
        $action_id = next_revalidate_schedule_deferred_payload($payload);
        if ($action_id > 0) {
            next_revalidate_log('info', 'Webhook de revalidation différé.', array(
                'actionId' => $action_id,
                'event' => isset($payload['event']) ? (string) $payload['event'] : '',
            ));
        }
        return $action_id;
    }
}

add_action(next_revalidate_deferred_hook(), function ($job) {
    $payload = is_array($job) && isset($job['payload']) && is_array($job['payload']) ? $job['payload'] : array();
    $attempt = is_array($job) ? max(0, absint($job['attempt'] ?? 0)) : 0;

    if (next_revalidate_send_payload($payload)) {
        return;
    }

    $delays = next_revalidate_deferred_retry_delays();
    if ($attempt >= count($delays)) {
        next_revalidate_log('error', 'Webhook de revalidation abandonné après les tentatives prévues.', array(
            'attempt' => $attempt,
            'event' => isset($payload['event']) ? (string) $payload['event'] : '',
        ));
        return;
    }

    next_revalidate_schedule_deferred_payload($payload, $attempt + 1, time() + $delays[$attempt]);
}, 10, 1);

if (!function_exists('next_revalidate_send_scope_payload')) {
    function next_revalidate_send_scope_payload($scopes, $event = 'cache.updated') {
        $scopes = is_array($scopes) ? array_values(array_filter(array_map('sanitize_key', $scopes))) : array();
        if (empty($scopes)) {
            return;
        }

        next_revalidate_send_payload(array(
            'event' => $event,
            'invalidateScopes' => $scopes,
        ));
    }
}

if (!function_exists('next_revalidate_public_scopes_for_taxonomy')) {
    function next_revalidate_public_scopes_for_taxonomy($taxonomy) {
        switch ((string) $taxonomy) {
            case 'classified_category':
            case 'classified_product_tag':
            case 'classified_location':
                return array('classified');
            case 'job_category':
            case 'job_location':
                return array('job');
            case 'listing_location':
                return array('classified', 'job');
            case 'tender_category':
            case 'tender_location':
                return array('tender');
            case 'directory_category':
            case 'directory_location':
                return array('directory');
            default:
                return array();
        }
    }
}

if (!function_exists('next_revalidate_handle_term_change')) {
    function next_revalidate_handle_term_change($taxonomy, $event) {
        $scopes = next_revalidate_public_scopes_for_taxonomy($taxonomy);
        if (empty($scopes)) {
            return;
        }

        if (apply_filters('next_revalidate_skip_taxonomy_payload', false, $taxonomy, $event, $scopes)) {
            return;
        }

        if (apply_filters('next_revalidate_defer_taxonomy_payload', false, $taxonomy, $event, $scopes)) {
            next_revalidate_defer_payload(array(
                'event' => $event,
                'invalidateScopes' => $scopes,
            ));
            return;
        }

        next_revalidate_send_scope_payload($scopes, $event);
    }
}

if (!function_exists('next_revalidate_directory_meta_keys')) {
    function next_revalidate_directory_meta_keys() {
        return array(
            'business_activity_category',
            'platform_directory_visibility_enabled',
            'profile_photo',
            'address',
            'phone',
            '_platform_directory_business_featured',
            '_platform_manual_plan_id',
            '_platform_manual_status',
            '_platform_mvola_plan_id',
            '_platform_mvola_status',
            '_platform_mvola_billing_period',
            '_platform_mvola_renews_at',
            '_platform_all_privileges_enabled',
            '_platform_all_privileges_directory_visible',
            '_platform_directory_hidden_by_admin',
        );
    }
}

if (!function_exists('next_revalidate_handle_directory_user_meta_change')) {
    function next_revalidate_handle_directory_user_meta_change($meta_key, $event) {
        if (!in_array((string) $meta_key, next_revalidate_directory_meta_keys(), true)) {
            return;
        }

        next_revalidate_send_scope_payload(array('directory'), $event);
    }
}

if (!function_exists('next_revalidate_should_skip_post')) {
    function next_revalidate_should_skip_post($post_id, $post) {
        if (!$post || !($post instanceof WP_Post)) {
            return true;
        }

        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
            return true;
        }

        // Stress fixtures are intentionally excluded from public cache and
        // must not enqueue one revalidation request per generated record.
        if ((string) get_post_meta($post_id, 'platform_2424_test_data', true) === '1') {
            return true;
        }

        if (!in_array($post->post_status, array('publish', 'trash'), true)) {
            return true;
        }

        return false;
    }
}

add_action('save_post', function ($post_id, $post, $update) {
    if (next_revalidate_should_skip_post($post_id, $post)) {
        return;
    }

    $event = $update ? 'post.updated' : 'post.created';
    $payload = next_revalidate_post_payload($event, $post);
    if (apply_filters('next_revalidate_defer_post_payload', false, $post_id, $post, $update)) {
        next_revalidate_defer_payload($payload);
        return;
    }
    next_revalidate_send_payload($payload);
}, 10, 3);

add_action('before_delete_post', function ($post_id) {
    $post = get_post($post_id);
    if (next_revalidate_should_skip_post($post_id, $post)) {
        return;
    }

    $payload = next_revalidate_post_payload('post.deleted', $post);
    next_revalidate_send_payload($payload);
}, 10, 1);

add_action('profile_update', function ($user_id, $old_user_data) {
    $user = get_userdata((int) $user_id);
    if (!($user instanceof WP_User) || !($old_user_data instanceof WP_User)) {
        return;
    }

    $new_display_name = trim((string) $user->display_name);
    $old_display_name = trim((string) $old_user_data->display_name);
    if ($new_display_name === $old_display_name) {
        return;
    }

    if (apply_filters('next_revalidate_defer_profile_payload', false, $user_id, $old_user_data, $user)) {
        next_revalidate_defer_payload(array(
            'event' => 'profile.updated',
            'invalidateScopes' => array('classified', 'job', 'tender', 'directory'),
        ));
        return;
    }

    next_revalidate_send_scope_payload(array('classified', 'job', 'tender', 'directory'), 'profile.updated');
}, 10, 2);

add_action('created_term', function ($term_id, $tt_id, $taxonomy) {
    next_revalidate_handle_term_change($taxonomy, 'term.created');
}, 10, 3);

add_action('edited_term', function ($term_id, $tt_id, $taxonomy) {
    next_revalidate_handle_term_change($taxonomy, 'term.updated');
}, 10, 3);

add_action('delete_term', function ($term, $tt_id, $taxonomy) {
    next_revalidate_handle_term_change($taxonomy, 'term.deleted');
}, 10, 3);

add_action('updated_user_meta', function ($meta_id, $user_id, $meta_key, $meta_value) {
    next_revalidate_handle_directory_user_meta_change($meta_key, 'user_meta.updated');
}, 10, 4);

add_action('added_user_meta', function ($meta_id, $user_id, $meta_key, $meta_value) {
    next_revalidate_handle_directory_user_meta_change($meta_key, 'user_meta.created');
}, 10, 4);

add_action('deleted_user_meta', function ($meta_ids, $user_id, $meta_key, $meta_value) {
    next_revalidate_handle_directory_user_meta_change($meta_key, 'user_meta.deleted');
}, 10, 4);

add_action('woocommerce_subscription_status_updated', function ($subscription, $new_status, $old_status) {
    next_revalidate_send_scope_payload(array('directory'), 'subscription.updated');
}, 10, 3);
