<?php
/**
 * Bounded, resumable staging-only stress campaigns. Legacy campaigns remain in
 * 2424-platform-test-tools.php and are intentionally not migrated.
 */
if (!defined('ABSPATH')) { exit; }

if (!function_exists('platform_2424_stress_mass_table')) {
    function platform_2424_stress_mass_table() {
        global $wpdb;
        return $wpdb->prefix . 'platform_2424_stress_campaigns';
    }
}

if (!function_exists('platform_2424_stress_mass_install_schema')) {
    function platform_2424_stress_mass_install_schema() {
        if ((string) get_option('platform_2424_stress_mass_schema_version', '') === '1') { return; }
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = platform_2424_stress_mass_table();
        $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE {$table} (
            campaign_id varchar(64) NOT NULL,
            profile varchar(32) NOT NULL,
            status varchar(32) NOT NULL,
            phase varchar(32) NOT NULL,
            settings longtext NOT NULL,
            counters longtext NOT NULL,
            cursors longtext NOT NULL,
            media longtext NOT NULL,
            error text NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            last_progress_at datetime NOT NULL,
            PRIMARY KEY  (campaign_id),
            KEY status (status),
            KEY updated_at (updated_at)
        ) {$charset};");
        update_option('platform_2424_stress_mass_schema_version', '1', false);
    }
}
add_action('admin_init', 'platform_2424_stress_mass_install_schema');

if (!function_exists('platform_2424_stress_mass_json')) {
    function platform_2424_stress_mass_json($value) { return wp_json_encode(is_array($value) ? $value : array()); }
    function platform_2424_stress_mass_decode($value) {
        $decoded = json_decode((string) $value, true);
        return is_array($decoded) ? $decoded : array();
    }
}

if (!function_exists('platform_2424_stress_mass_get')) {
    function platform_2424_stress_mass_get($campaign_id) {
        global $wpdb;
        $row = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . platform_2424_stress_mass_table() . ' WHERE campaign_id = %s', $campaign_id), ARRAY_A);
        if (!$row) { return null; }
        foreach (array('settings', 'counters', 'cursors', 'media') as $field) { $row[$field] = platform_2424_stress_mass_decode($row[$field]); }
        return $row;
    }
}

if (!function_exists('platform_2424_stress_mass_save')) {
    function platform_2424_stress_mass_save($campaign) {
        global $wpdb;
        $now = current_time('mysql', true);
        $campaign['updated_at'] = $now;
        $campaign['last_progress_at'] = $now;
        $data = array(
            'profile' => sanitize_key($campaign['profile'] ?? 'mass'), 'status' => sanitize_key($campaign['status'] ?? 'generating'),
            'phase' => sanitize_key($campaign['phase'] ?? 'users'), 'settings' => platform_2424_stress_mass_json($campaign['settings'] ?? array()),
            'counters' => platform_2424_stress_mass_json($campaign['counters'] ?? array()), 'cursors' => platform_2424_stress_mass_json($campaign['cursors'] ?? array()),
            'media' => platform_2424_stress_mass_json($campaign['media'] ?? array()), 'error' => sanitize_text_field($campaign['error'] ?? ''),
            'updated_at' => $now, 'last_progress_at' => $now,
        );
        if (!empty($campaign['created_at'])) {
            return $wpdb->update(platform_2424_stress_mass_table(), $data, array('campaign_id' => $campaign['campaign_id']));
        }
        $data['campaign_id'] = $campaign['campaign_id']; $data['created_at'] = $now;
        return $wpdb->insert(platform_2424_stress_mass_table(), $data);
    }
}

if (!function_exists('platform_2424_stress_mass_active')) {
    function platform_2424_stress_mass_active() {
        global $wpdb;
        $legacy = function_exists('platform_2424_stress_test_get_campaign') ? platform_2424_stress_test_get_campaign() : array();
        if (in_array($legacy['status'] ?? '', array('generating'), true)) { return true; }
        return (bool) $wpdb->get_var("SELECT campaign_id FROM " . platform_2424_stress_mass_table() . " WHERE status IN ('generating','deleting','uploading') LIMIT 1");
    }
}

if (!function_exists('platform_2424_stress_mass_targets')) {
    function platform_2424_stress_mass_targets() {
        return array('users' => 50000, 'classifieds' => 50000, 'conversations' => 5000, 'messages' => 15000, 'favorites' => 10000, 'notifications' => 10000, 'realUploads' => 1000);
    }
    function platform_2424_stress_mass_plan_for($ordinal) {
        $slot = ($ordinal - 1) % 100;
        return $slot < 60 ? 'free' : ($slot < 85 ? 'essentiel' : 'business');
    }
    function platform_2424_stress_mass_user_email($campaign_id, $ordinal) { return sprintf('stress-mass-%s-%05d@2424.test', substr(str_replace('-', '', $campaign_id), 0, 10), $ordinal); }
}

if (!function_exists('platform_2424_stress_mass_fixture')) {
    // Keep the legacy single-fixture option readable for campaigns created before catalogs.
    function platform_2424_stress_mass_fixture($key) { return esc_url_raw((string) get_option('platform_2424_stress_mass_fixture_' . $key, '')); }
    function platform_2424_stress_mass_normalize_catalog($value) {
        $lines = is_array($value) ? $value : preg_split('/\r\n|\r|\n/', (string) $value);
        $catalog = array();
        foreach ((array) $lines as $line) {
            $url = esc_url_raw(trim((string) $line));
            if (strpos($url, 'https://') === 0) { $catalog[$url] = $url; }
        }
        return array_values($catalog);
    }
    function platform_2424_stress_mass_catalog_input_is_valid($value) {
        foreach (preg_split('/\r\n|\r|\n/', (string) $value) as $line) {
            $line = trim((string) $line);
            if ($line !== '' && strpos(esc_url_raw($line), 'https://') !== 0) { return false; }
        }
        return true;
    }
    function platform_2424_stress_mass_catalog($key) {
        $catalog = platform_2424_stress_mass_normalize_catalog(get_option('platform_2424_stress_mass_catalog_' . $key, array()));
        if (!$catalog) {
            $legacy = platform_2424_stress_mass_fixture($key);
            if ($legacy !== '') { $catalog = array($legacy); }
        }
        return $catalog;
    }
    function platform_2424_stress_mass_campaign_catalog($campaign, $key) {
        $fixtures = (array) ($campaign['settings']['fixtures'] ?? array());
        $catalog = platform_2424_stress_mass_normalize_catalog($fixtures[$key] ?? array());
        // Older campaigns froze one URL in settings. Preserve that exact media on resume.
        return $catalog ?: platform_2424_stress_mass_catalog($key);
    }
    function platform_2424_stress_mass_fixture_for($campaign_id, $ordinal, $key) {
        static $campaigns = array();
        if (!isset($campaigns[$campaign_id])) { $campaigns[$campaign_id] = platform_2424_stress_mass_get($campaign_id); }
        $catalog = platform_2424_stress_mass_campaign_catalog((array) $campaigns[$campaign_id], $key);
        if (!$catalog) { return ''; }
        $index = hexdec(substr(hash('sha256', $campaign_id . ':' . $key . ':' . absint($ordinal)), 0, 8)) % count($catalog);
        return $catalog[$index];
    }
    function platform_2424_stress_mass_fixture_ready() {
        foreach (array('avatar', 'listing') as $key) { if (!platform_2424_stress_mass_catalog($key)) { return false; } }
        return true;
    }
}

if (!function_exists('platform_2424_stress_mass_preflight')) {
    function platform_2424_stress_mass_preflight() {
        if (!platform_2424_stress_test_is_enabled()) { return new WP_Error('stress_mass_disabled', 'Stress test indisponible hors staging ou desactive.'); }
        if (!function_exists('as_schedule_single_action')) { return new WP_Error('stress_mass_scheduler', 'Action Scheduler est requis pour une campagne massive.'); }
        if (!platform_2424_stress_mass_fixture_ready()) { return new WP_Error('stress_mass_fixtures', 'Configurez les deux fixtures S3 HTTPS avant de lancer la campagne massive.'); }
        $bridge = function_exists('platform_2424_stress_test_bridge_status') ? platform_2424_stress_test_bridge_status() : array();
        if (empty($bridge['urlConfigured']) || empty($bridge['secretConfigured'])) { return new WP_Error('stress_mass_bridge', 'Le pont Next interne n est pas configure.'); }
        if (empty($bridge['hostAllowed'])) { return new WP_Error('stress_mass_bridge_host', 'Le pont Next doit cibler un hote de recette autorise.'); }
        if (platform_2424_stress_mass_active()) { return new WP_Error('stress_mass_active', 'Une campagne de generation, upload ou suppression est deja active.'); }
        return true;
    }
}

if (!function_exists('platform_2424_stress_mass_schedule')) {
    function platform_2424_stress_mass_schedule($hook, $campaign_id, $force = false, $immediate = false) {
        $group = '2424-stress-test-mass'; $args = array($campaign_id);
        if ($immediate && function_exists('as_enqueue_async_action')) {
            if (!$force && function_exists('as_has_scheduled_action') && as_has_scheduled_action($hook, $args, $group)) { return false; }
            $action_id = as_enqueue_async_action($hook, $args, $group, false);
            return $action_id ? $action_id : new WP_Error('stress_mass_schedule_failed', 'Action Scheduler n a pas pu demarrer la campagne.');
        }
        if (function_exists('as_schedule_single_action')) {
            if (!$force && function_exists('as_has_scheduled_action') && as_has_scheduled_action($hook, $args, $group)) { return false; }
            $action_id = as_schedule_single_action(time() + 1, $hook, $args, $group, false);
            return $action_id ? $action_id : new WP_Error('stress_mass_schedule_failed', 'Action Scheduler n a pas pu planifier la campagne.');
        }
        if (!$force && wp_next_scheduled($hook, $args)) { return false; }
        return wp_schedule_single_event(time() + 1, $hook, $args) ? true : new WP_Error('stress_mass_schedule_failed', 'WP-Cron n a pas pu planifier la campagne.');
    }
}

if (!function_exists('platform_2424_stress_mass_schedule_campaign')) {
    function platform_2424_stress_mass_schedule_campaign(&$campaign, $hook, $force = false, $immediate = false) {
        $scheduled = platform_2424_stress_mass_schedule($hook, $campaign['campaign_id'], $force, $immediate);
        if (is_wp_error($scheduled)) {
            platform_2424_stress_mass_fail($campaign, $scheduled->get_error_message());
            return false;
        }
        return true;
    }
}

if (!function_exists('platform_2424_stress_mass_fail')) {
    function platform_2424_stress_mass_fail(&$campaign, $message) {
        $campaign['status'] = 'failed'; $campaign['error'] = sanitize_text_field($message); platform_2424_stress_mass_save($campaign);
        if (function_exists('platform_2424_log_event')) { platform_2424_log_event('error', 'stress-test', 'Campagne massive interrompue.', array('campaignId' => $campaign['campaign_id'], 'phase' => $campaign['phase'], 'error' => $campaign['error'])); }
    }
}

if (!function_exists('platform_2424_stress_mass_user')) {
    function platform_2424_stress_mass_user($campaign_id, $ordinal) {
        $email = platform_2424_stress_mass_user_email($campaign_id, $ordinal);
        $existing = get_user_by('email', $email);
        $user_id = $existing ? (int) $existing->ID : wp_insert_user(array(
            'user_login' => 'stress_mass_' . substr(str_replace('-', '', $campaign_id), 0, 10) . '_' . sprintf('%05d', $ordinal),
            'user_email' => $email, 'user_pass' => wp_generate_password(32, true, true), 'role' => 'subscriber',
            'display_name' => sprintf('Utilisateur charge %05d', $ordinal),
        ));
        if (is_wp_error($user_id) || !$user_id) { return 0; }
        foreach (array('platform_2424_test_data' => '1', 'platform_2424_stress_campaign' => $campaign_id, 'platform_2424_stress_mass' => '1', 'platform_2424_stress_ordinal' => (string) $ordinal, 'platform_plan_id' => platform_2424_stress_mass_plan_for($ordinal), 'platform_email_verified' => '1', 'platform_onboarding_completed' => '1', 'profile_photo' => platform_2424_stress_mass_fixture_for($campaign_id, $ordinal, 'avatar'), 'platform_2424_stress_shared_fixture' => '1') as $key => $value) { update_user_meta($user_id, $key, $value); }
        return (int) $user_id;
    }
}

if (!function_exists('platform_2424_stress_mass_listing')) {
    function platform_2424_stress_mass_listing($campaign_id, $ordinal) {
        global $wpdb;
        $existing = $wpdb->get_var($wpdb->prepare("SELECT ordinal.post_id FROM {$wpdb->postmeta} ordinal INNER JOIN {$wpdb->postmeta} campaign ON campaign.post_id = ordinal.post_id AND campaign.meta_key = 'platform_2424_stress_campaign' AND campaign.meta_value = %s WHERE ordinal.meta_key = 'platform_2424_stress_mass_ordinal' AND ordinal.meta_value = %s LIMIT 1", $campaign_id, (string) $ordinal));
        if ($existing) { return (int) $existing; }
        $user = get_user_by('email', platform_2424_stress_mass_user_email($campaign_id, $ordinal));
        if (!$user) { return 0; }
        $post_id = wp_insert_post(array('post_type' => 'classified_ad', 'post_status' => 'publish', 'post_author' => $user->ID, 'post_title' => sprintf('Annonce de charge %05d', $ordinal), 'post_content' => 'Annonce de recette staging generee pour valider les listes, filtres, profils et recherches a grande echelle.', 'post_excerpt' => 'Annonce de recette staging.'), true);
        if (is_wp_error($post_id) || !$post_id) { return 0; }
        $listing_fixture = platform_2424_stress_mass_fixture_for($campaign_id, $ordinal, 'listing');
        foreach (array('platform_2424_test_data' => '1', 'platform_2424_stress_campaign' => $campaign_id, 'platform_2424_stress_mass' => '1', 'platform_2424_stress_mass_ordinal' => (string) $ordinal, 'platform_submission_source' => 'stress_test', 'price' => (string) (50000 + (($ordinal % 40) * 25000)), 'currency' => 'MGA', 'featured_image_url' => $listing_fixture, 'gallery_images' => array($listing_fixture), 'platform_2424_stress_shared_fixture' => '1') as $key => $value) { update_post_meta($post_id, $key, $value); }
        static $categories = null; static $locations = null;
        if ($categories === null) { $categories = platform_2424_stress_test_terms('classified_category'); $locations = platform_2424_stress_test_terms('listing_location'); }
        if ($categories) { wp_set_object_terms($post_id, array((int) $categories[($ordinal - 1) % count($categories)]->term_id), 'classified_category', false); }
        if ($locations) { wp_set_object_terms($post_id, array((int) $locations[($ordinal - 1) % count($locations)]->term_id), 'listing_location', false); }
        platform_2424_stress_mass_unschedule_listing_sync($post_id);
        return (int) $post_id;
    }
}

if (!function_exists('platform_2424_stress_mass_unschedule_listing_sync')) {
    function platform_2424_stress_mass_unschedule_listing_sync($post_id) {
        $args = array(absint($post_id));
        if (function_exists('as_unschedule_all_actions')) {
            as_unschedule_all_actions('platform_2424_typesense_sync_listing', $args, '2424-typesense');
            return;
        }
        wp_clear_scheduled_hook('platform_2424_typesense_sync_listing', $args);
    }
}

if (!function_exists('platform_2424_stress_mass_cleanup_queued_listing_syncs')) {
    function platform_2424_stress_mass_cleanup_queued_listing_syncs(&$campaign) {
        global $wpdb;
        if (($campaign['cursors']['typesenseCleanupComplete'] ?? '') === '1') {
            return true;
        }

        if (empty($campaign['cursors']['typesenseCleanupResumePhase'])) {
            $campaign['cursors']['typesenseCleanupResumePhase'] = (string) ($campaign['phase'] ?? 'classifieds');
        }
        $campaign['phase'] = 'cleanup-typesense';

        $cursor = absint($campaign['cursors']['typesenseCleanupPostId'] ?? 0);
        $ids = $wpdb->get_col($wpdb->prepare(
            "SELECT pm.post_id FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id WHERE pm.meta_key = 'platform_2424_stress_campaign' AND pm.meta_value = %s AND p.ID > %d ORDER BY p.ID ASC LIMIT 100",
            $campaign['campaign_id'],
            $cursor
        ));
        if (empty($ids)) {
            $campaign['cursors']['typesenseCleanupComplete'] = '1';
            $campaign['phase'] = (string) ($campaign['cursors']['typesenseCleanupResumePhase'] ?? 'classifieds');
            unset($campaign['cursors']['typesenseCleanupResumePhase']);
            return true;
        }

        foreach ($ids as $post_id) {
            platform_2424_stress_mass_unschedule_listing_sync($post_id);
            $cursor = max($cursor, absint($post_id));
        }
        $campaign['cursors']['typesenseCleanupPostId'] = $cursor;
        return false;
    }
}

if (!function_exists('platform_2424_stress_mass_batch_users')) {
    function platform_2424_stress_mass_batch_users(&$campaign) {
        $cursor = absint($campaign['cursors']['users'] ?? 0); $target = absint($campaign['settings']['targets']['users'] ?? 0); $processed = 0;
        for ($ordinal = $cursor + 1; $ordinal <= min($target, $cursor + 100); $ordinal++) { if (!platform_2424_stress_mass_user($campaign['campaign_id'], $ordinal)) { platform_2424_stress_mass_fail($campaign, 'Impossible de creer un utilisateur de recette.'); return; } $processed++; }
        $campaign['cursors']['users'] = $cursor + $processed; $campaign['counters']['users'] = max(absint($campaign['counters']['users'] ?? 0), $cursor + $processed);
        if ($campaign['cursors']['users'] >= $target) { $campaign['phase'] = 'classifieds'; }
    }
}

if (!function_exists('platform_2424_stress_mass_batch_listings')) {
    function platform_2424_stress_mass_batch_listings(&$campaign) {
        $cursor = absint($campaign['cursors']['classifieds'] ?? 0); $target = absint($campaign['settings']['targets']['classifieds'] ?? 0); $processed = 0;
        for ($ordinal = $cursor + 1; $ordinal <= min($target, $cursor + 100); $ordinal++) { if (!platform_2424_stress_mass_listing($campaign['campaign_id'], $ordinal)) { platform_2424_stress_mass_fail($campaign, 'Impossible de creer une annonce de recette.'); return; } $processed++; }
        $campaign['cursors']['classifieds'] = $cursor + $processed; $campaign['counters']['classifieds'] = max(absint($campaign['counters']['classifieds'] ?? 0), $cursor + $processed);
        if ($campaign['cursors']['classifieds'] >= $target) { $campaign['phase'] = 'interactions'; }
    }
}

if (!function_exists('platform_2424_stress_mass_interaction_batch')) {
    function platform_2424_stress_mass_interaction_batch(&$campaign) {
        $cursor = absint($campaign['cursors']['interactions'] ?? 0); $target = 5000;
        $users = array(); $listings = array();
        for ($ordinal = $cursor + 1; $ordinal <= min($target, $cursor + 100); $ordinal++) {
            $user = get_user_by('email', platform_2424_stress_mass_user_email($campaign['campaign_id'], $ordinal));
            $post_id = platform_2424_stress_mass_listing($campaign['campaign_id'], $ordinal);
            if ($user && $post_id) { $users[] = array('id' => (int) $user->ID, 'email' => $user->user_email, 'name' => $user->display_name); $listings[] = array('id' => $post_id, 'kind' => 'classified', 'title' => get_the_title($post_id)); }
        }
        if (!$users || !$listings) { platform_2424_stress_mass_fail($campaign, 'Le lot d interactions ne dispose pas des contenus attendus.'); return; }
        $result = platform_2424_stress_test_call_next('/api/internal/stress-test/campaign', array('action' => 'seed-batch', 'campaignId' => $campaign['campaign_id'], 'users' => $users, 'listings' => $listings, 'offset' => $cursor, 'favorites' => 200, 'notifications' => 200));
        if (is_wp_error($result)) { platform_2424_stress_mass_fail($campaign, $result->get_error_message()); return; }
        $next = $cursor + count($listings); $campaign['cursors']['interactions'] = $next;
        foreach (array('conversations', 'messages', 'favorites', 'notifications') as $key) { $campaign['counters'][$key] = absint($campaign['counters'][$key] ?? 0) + absint($result[$key] ?? 0); }
        if ($next >= $target) { $campaign['phase'] = 'indexing'; }
    }
}

if (!function_exists('platform_2424_stress_mass_index_batch')) {
    function platform_2424_stress_mass_index_batch(&$campaign) {
        $cursor = absint($campaign['cursors']['indexing'] ?? 0); $target = absint($campaign['settings']['targets']['classifieds'] ?? 0); $count = 0;
        for ($ordinal = $cursor + 1; $ordinal <= min($target, $cursor + 100); $ordinal++) { $id = platform_2424_stress_mass_listing($campaign['campaign_id'], $ordinal); if ($id && function_exists('platform_2424_typesense_sync_listing')) { $result = platform_2424_typesense_sync_listing($id); if (is_wp_error($result)) { platform_2424_stress_mass_fail($campaign, 'Indexation Typesense interrompue.'); return; } } $count++; }
        $campaign['cursors']['indexing'] = $cursor + $count; $campaign['counters']['indexed'] = $campaign['cursors']['indexing'];
        if ($campaign['cursors']['indexing'] >= $target) { $campaign['status'] = 'ready'; $campaign['phase'] = 'ready'; }
    }
}

if (!function_exists('platform_2424_stress_mass_run')) {
    function platform_2424_stress_mass_run($campaign_id) {
        if (!platform_2424_stress_test_is_enabled()) { return; }
        $campaign = platform_2424_stress_mass_get($campaign_id);
        if (!$campaign || $campaign['status'] !== 'generating') { return; }
        $lock = 'platform_2424_stress_mass_lock_' . $campaign_id;
        if (get_transient($lock)) { return; }
        set_transient($lock, '1', 5 * MINUTE_IN_SECONDS);
        try {
            // Older campaigns may have queued a Typesense action before their
            // stress marker was persisted. Drain those no-op actions first so
            // they cannot starve normal public-list requests.
            if (!platform_2424_stress_mass_cleanup_queued_listing_syncs($campaign)) {
                platform_2424_stress_mass_save($campaign);
                platform_2424_stress_mass_schedule_campaign($campaign, 'platform_2424_stress_mass_run', true);
                return;
            }
            if ($campaign['phase'] === 'users') { platform_2424_stress_mass_batch_users($campaign); }
            elseif ($campaign['phase'] === 'classifieds') { platform_2424_stress_mass_batch_listings($campaign); }
            elseif ($campaign['phase'] === 'interactions') { platform_2424_stress_mass_interaction_batch($campaign); }
            elseif ($campaign['phase'] === 'indexing') { platform_2424_stress_mass_index_batch($campaign); }
            platform_2424_stress_mass_save($campaign);
            if ($campaign['status'] === 'generating') { platform_2424_stress_mass_schedule_campaign($campaign, 'platform_2424_stress_mass_run', true); }
        } finally { delete_transient($lock); }
    }
}
add_action('platform_2424_stress_mass_run', 'platform_2424_stress_mass_run');

if (!function_exists('platform_2424_stress_mass_upload_run')) {
    function platform_2424_stress_mass_upload_run($campaign_id) {
        $campaign = platform_2424_stress_mass_get($campaign_id);
        if (!$campaign || $campaign['status'] !== 'uploading' || !platform_2424_stress_test_is_enabled()) { return; }
        $cursor = absint($campaign['cursors']['uploads'] ?? 0); $target = 1000;
        // One persisted upload per action keeps ownership tracking exact even
        // when a presign or S3 request fails halfway through a network retry.
        $result = platform_2424_stress_test_call_next('/api/internal/stress-test/media', array('campaignId' => $campaign_id, 'offset' => $cursor, 'count' => 1));
        if (is_wp_error($result) || empty($result['uploads']) || !is_array($result['uploads'])) { platform_2424_stress_mass_fail($campaign, is_wp_error($result) ? $result->get_error_message() : 'Upload de validation incomplet.'); return; }
        foreach ($result['uploads'] as $item) {
            $kind = sanitize_key($item['kind'] ?? 'listing'); $url = esc_url_raw($item['publicUrl'] ?? ''); $key = sanitize_text_field($item['key'] ?? '');
            if ($url === '' || strpos($key, 'uploads/') !== 0) { platform_2424_stress_mass_fail($campaign, 'Reponse media de validation invalide.'); return; }
            $target_ordinal = $cursor + 1;
            if ($kind === 'avatar') { $user = get_user_by('email', platform_2424_stress_mass_user_email($campaign_id, $target_ordinal)); if ($user) { update_user_meta($user->ID, 'profile_photo', $url); } }
            else { $post_id = platform_2424_stress_mass_listing($campaign_id, max(1, $target_ordinal - 500)); if ($post_id) { update_post_meta($post_id, 'featured_image_url', $url); update_post_meta($post_id, 'gallery_images', array($url)); } }
            $campaign['media'][] = array('key' => $key, 'url' => $url, 'kind' => $kind, 'status' => 'created');
            $cursor++;
        }
        $campaign['cursors']['uploads'] = $cursor; $campaign['counters']['realUploads'] = $cursor;
        if ($cursor >= $target) { $campaign['status'] = 'ready'; $campaign['phase'] = 'ready'; }
        platform_2424_stress_mass_save($campaign);
        if ($campaign['status'] === 'uploading') { platform_2424_stress_mass_schedule_campaign($campaign, 'platform_2424_stress_mass_upload_run', true); }
    }
}
add_action('platform_2424_stress_mass_upload_run', 'platform_2424_stress_mass_upload_run');

if (!function_exists('platform_2424_stress_mass_has_remote_interactions')) {
    function platform_2424_stress_mass_has_remote_interactions($campaign) {
        $counters = (array) ($campaign['counters'] ?? array());
        foreach (array('conversations', 'messages', 'favorites', 'notifications') as $key) {
            if (absint($counters[$key] ?? 0) > 0) {
                return true;
            }
        }

        return absint($campaign['cursors']['interactions'] ?? 0) > 0;
    }
}

if (!function_exists('platform_2424_stress_mass_delete_run')) {
    function platform_2424_stress_mass_delete_run($campaign_id) {
        $campaign = platform_2424_stress_mass_get($campaign_id); if (!$campaign || $campaign['status'] !== 'deleting') { return; }
        $has_remote_interactions = platform_2424_stress_mass_has_remote_interactions($campaign);
        $post_ids = get_posts(array('post_type' => 'classified_ad', 'post_status' => 'any', 'posts_per_page' => 100, 'fields' => 'ids', 'meta_key' => 'platform_2424_stress_campaign', 'meta_value' => $campaign_id));
        if ($post_ids) {
            foreach ($post_ids as $post_id) {
                // Normal hooks intentionally skip mass records. Remove their
                // documents here in the same bounded cleanup cadence instead.
                if (function_exists('platform_2424_typesense_delete') && function_exists('platform_2424_typesense_listing_document_id')) { platform_2424_typesense_delete('classified', platform_2424_typesense_listing_document_id('classified', $post_id)); }
                wp_delete_post((int) $post_id, true);
            }
            $campaign['counters']['deletedPosts'] = absint($campaign['counters']['deletedPosts'] ?? 0) + count($post_ids); platform_2424_stress_mass_save($campaign); platform_2424_stress_mass_schedule_campaign($campaign, 'platform_2424_stress_mass_delete_run', true); return;
        }
        $users = new WP_User_Query(array('fields' => 'all_with_meta', 'number' => 100, 'meta_key' => 'platform_2424_stress_campaign', 'meta_value' => $campaign_id));
        if ($users->get_results()) {
            $bridge_users = array(); foreach ($users->get_results() as $user) { $bridge_users[] = array('id' => (int) $user->ID, 'email' => $user->user_email, 'name' => $user->display_name); }
            if ($has_remote_interactions) {
                $next = platform_2424_stress_test_call_next('/api/internal/stress-test/campaign', array('action' => 'cleanup-batch', 'campaignId' => $campaign_id, 'users' => $bridge_users));
                if (is_wp_error($next)) { $campaign['error'] = 'Nettoyage Redis/Mongo a reprendre: ' . $next->get_error_message(); platform_2424_stress_mass_save($campaign); return; }
            }
            if (!function_exists('wp_delete_user')) { require_once ABSPATH . 'wp-admin/includes/user.php'; }
            foreach ($users->get_results() as $user) { wp_delete_user((int) $user->ID); }
            $campaign['counters']['deletedUsers'] = absint($campaign['counters']['deletedUsers'] ?? 0) + count($users->get_results()); platform_2424_stress_mass_save($campaign); platform_2424_stress_mass_schedule_campaign($campaign, 'platform_2424_stress_mass_delete_run', true); return;
        }
        $keys = array(); foreach ((array) $campaign['media'] as $index => $media) { if (($media['status'] ?? '') === 'created' && !empty($media['key'])) { $keys[] = $media['key']; $campaign['media'][$index]['status'] = 'deleting'; if (count($keys) === 100) { break; } } }
        if ($keys) { $result = function_exists('platform_submissions_delete_s3_media_batch') ? platform_submissions_delete_s3_media_batch($keys) : new WP_Error('stress_media_cleanup_missing', 'Suppression S3 indisponible.'); if (is_wp_error($result)) { $campaign['error'] = 'Suppression des uploads reels a reprendre: ' . $result->get_error_message(); platform_2424_stress_mass_save($campaign); return; } foreach ($campaign['media'] as &$media) { if (in_array($media['key'] ?? '', $keys, true)) { $media['status'] = 'deleted'; } } unset($media); $campaign['counters']['deletedUploads'] = absint($campaign['counters']['deletedUploads'] ?? 0) + count($keys); platform_2424_stress_mass_save($campaign); platform_2424_stress_mass_schedule_campaign($campaign, 'platform_2424_stress_mass_delete_run', true); return; }
        $users_for_cleanup = array();
        if ($has_remote_interactions) {
            $next = platform_2424_stress_test_call_next('/api/internal/stress-test/campaign', array('action' => 'cleanup-finalize', 'campaignId' => $campaign_id, 'users' => $users_for_cleanup));
            if (is_wp_error($next)) { $campaign['error'] = 'Nettoyage Redis/Mongo a reprendre: ' . $next->get_error_message(); platform_2424_stress_mass_save($campaign); return; }
        }
        $campaign['status'] = 'deleted'; $campaign['phase'] = 'deleted'; platform_2424_stress_mass_save($campaign);
    }
}
add_action('platform_2424_stress_mass_delete_run', 'platform_2424_stress_mass_delete_run');

if (!function_exists('platform_2424_stress_mass_render_tab')) {
    function platform_2424_stress_mass_render_tab() {
        global $wpdb; $campaigns = $wpdb->get_results('SELECT * FROM ' . platform_2424_stress_mass_table() . ' ORDER BY created_at DESC LIMIT 20', ARRAY_A);
        $notice = get_transient('platform_2424_stress_mass_notice');
        if ($notice) { delete_transient('platform_2424_stress_mass_notice'); }
        ?>
        <div class="platform-2424-card" id="platform-2424-stress-mass" data-live="<?php echo platform_2424_stress_mass_active() ? 'yes' : 'no'; ?>" style="margin-top:20px"><h3>Campagnes massives</h3><p>50 000 utilisateurs, 50 000 annonces, 5 000 conversations, 15 000 messages, 10 000 favoris et 10 000 notifications. Une seule generation massive peut etre active a la fois.</p>
        <?php if ($notice) : ?><div class="notice notice-error inline"><p><?php echo esc_html($notice); ?></p></div><?php endif; ?>
        <?php $bridge = function_exists('platform_2424_stress_test_bridge_status') ? platform_2424_stress_test_bridge_status() : array(); ?>
        <p class="description">Pont Next : hôte <code><?php echo esc_html($bridge['host'] ?? 'non configuré'); ?></code> · URL <?php echo !empty($bridge['urlConfigured']) ? 'présente' : 'absente'; ?> · secret <?php echo !empty($bridge['secretConfigured']) ? 'présent' : 'absent'; ?> · hôte <?php echo !empty($bridge['hostAllowed']) ? 'autorisé' : 'non autorisé'; ?>.</p>
        <?php $avatar_catalog = platform_2424_stress_mass_catalog('avatar'); $listing_catalog = platform_2424_stress_mass_catalog('listing'); ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>"><input type="hidden" name="action" value="platform_2424_stress_mass_settings" /><?php wp_nonce_field('platform_2424_stress_test'); ?><p><label for="platform-2424-stress-avatar-catalog">Catalogue avatars S3 <span class="description">(une URL HTTPS par ligne)</span></label><br /><textarea id="platform-2424-stress-avatar-catalog" class="large-text code" rows="5" name="catalog_avatar" placeholder="https://..."><?php echo esc_textarea(implode("\n", $avatar_catalog)); ?></textarea><br /><span class="description"><?php echo absint(count($avatar_catalog)); ?> media(s) disponible(s)<?php if ($avatar_catalog) : ?> · Aperçu : <code><?php echo esc_html(implode(' · ', array_slice($avatar_catalog, 0, 2))); ?></code><?php endif; ?></span></p><p><label for="platform-2424-stress-listing-catalog">Catalogue photos d annonces S3 <span class="description">(une URL HTTPS par ligne)</span></label><br /><textarea id="platform-2424-stress-listing-catalog" class="large-text code" rows="5" name="catalog_listing" placeholder="https://..."><?php echo esc_textarea(implode("\n", $listing_catalog)); ?></textarea><br /><span class="description"><?php echo absint(count($listing_catalog)); ?> media(s) disponible(s)<?php if ($listing_catalog) : ?> · Aperçu : <code><?php echo esc_html(implode(' · ', array_slice($listing_catalog, 0, 2))); ?></code><?php endif; ?></span></p><p><button class="button">Enregistrer les catalogues</button></p></form>
        <p class="description">Les medias existants sont partages, marques comme fixtures et ne sont jamais supprimes. Chaque campagne fige ses catalogues au lancement. La validation d upload reel cree 500 avatars et 500 images d annonce, suivis individuellement.</p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin:14px 0"><input type="hidden" name="action" value="platform_2424_stress_mass_start" /><?php wp_nonce_field('platform_2424_stress_test'); ?><button class="button button-primary" <?php disabled(platform_2424_stress_mass_active() || !platform_2424_stress_mass_fixture_ready()); ?>>Generer Massif 50 000</button></form>
        <?php foreach ($campaigns as $row) : $campaign = platform_2424_stress_mass_get($row['campaign_id']); $c = $campaign['counters']; $targets = $campaign['settings']['targets']; ?>
            <div data-stress-mass-campaign="<?php echo esc_attr($campaign['campaign_id']); ?>" style="border-top:1px solid #ddd;padding:12px 0"><strong><?php echo esc_html($campaign['campaign_id']); ?></strong> · <span data-stress-mass-status><?php echo esc_html($campaign['status']); ?></span> · <span data-stress-mass-phase><?php echo esc_html($campaign['phase']); ?></span><br><span class="description" data-stress-mass-counts>Utilisateurs <?php echo absint($c['users'] ?? 0); ?>/<?php echo absint($targets['users'] ?? 0); ?> · Annonces <?php echo absint($c['classifieds'] ?? 0); ?>/<?php echo absint($targets['classifieds'] ?? 0); ?> · Interactions <?php echo absint($c['conversations'] ?? 0); ?>/5000 · Uploads reels <?php echo absint($c['realUploads'] ?? 0); ?>/1000 · Activite <?php echo esc_html($campaign['last_progress_at']); ?></span><p class="notice notice-error inline" data-stress-mass-error <?php echo empty($campaign['error']) ? 'hidden' : ''; ?>><span><?php echo esc_html($campaign['error'] ?? ''); ?></span></p>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline-block"><input type="hidden" name="campaign_id" value="<?php echo esc_attr($campaign['campaign_id']); ?>" /><input type="hidden" name="action" value="platform_2424_stress_mass_resume" /><?php wp_nonce_field('platform_2424_stress_test'); ?><button class="button" <?php disabled(!in_array($campaign['status'], array('generating','failed','deleting','uploading'), true)); ?>>Reprendre</button></form>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline-block"><input type="hidden" name="campaign_id" value="<?php echo esc_attr($campaign['campaign_id']); ?>" /><input type="hidden" name="action" value="platform_2424_stress_mass_uploads" /><?php wp_nonce_field('platform_2424_stress_test'); ?><button class="button" <?php disabled($campaign['status'] !== 'ready'); ?>>Validation upload reel (1 000)</button></form>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline-block"><input type="hidden" name="campaign_id" value="<?php echo esc_attr($campaign['campaign_id']); ?>" /><input type="hidden" name="action" value="platform_2424_stress_mass_simulate_delete" /><?php wp_nonce_field('platform_2424_stress_test'); ?><button class="button">Simulation de suppression</button></form>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline-block"><input type="hidden" name="campaign_id" value="<?php echo esc_attr($campaign['campaign_id']); ?>" /><input type="hidden" name="action" value="platform_2424_stress_mass_delete" /><?php wp_nonce_field('platform_2424_stress_test'); ?><label><input type="checkbox" name="confirm_cleanup" value="yes" /> Confirmer la suppression</label><button class="button button-link-delete">Supprimer</button></form></div>
        <?php endforeach; ?></div><script>(function(){var card=document.getElementById('platform-2424-stress-mass');if(!card||card.dataset.live!=='yes'){return;}var busy=false;var endpoint='<?php echo esc_url(admin_url('admin-ajax.php')); ?>';var nonce='<?php echo esc_js(wp_create_nonce('platform_2424_stress_mass_status')); ?>';function post(data){return fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},body:new URLSearchParams(data)}).then(function(response){return response.json();});}function refresh(){post({action:'platform_2424_stress_mass_status',nonce:nonce}).then(function(response){if(!response.success||!response.data){return;}(response.data.campaigns||[]).forEach(function(campaign){var row=card.querySelector('[data-stress-mass-campaign="'+campaign.id+'"]');if(!row){return;}row.querySelector('[data-stress-mass-status]').textContent=campaign.status;row.querySelector('[data-stress-mass-phase]').textContent=campaign.phase;row.querySelector('[data-stress-mass-counts]').textContent=campaign.counts;var error=row.querySelector('[data-stress-mass-error]');error.hidden=!campaign.error;error.querySelector('span').textContent=campaign.error||'';});if(!response.data.active){card.dataset.live='no';return;}if(response.data.staleCampaignId&&!busy){busy=true;post({action:'platform_2424_stress_mass_kick',nonce:nonce,campaign_id:response.data.staleCampaignId}).finally(function(){busy=false;window.setTimeout(refresh,250);});return;}window.setTimeout(refresh,5000);}).catch(function(){window.setTimeout(refresh,5000);});}refresh();}());</script><?php
    }
}

if (!function_exists('platform_2424_stress_mass_redirect')) { function platform_2424_stress_mass_redirect() { wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=stress-test')); exit; } }
add_action('admin_post_platform_2424_stress_mass_settings', function () { platform_2424_stress_test_admin_guard(); $avatar_input = (string) wp_unslash($_POST['catalog_avatar'] ?? ''); $listing_input = (string) wp_unslash($_POST['catalog_listing'] ?? ''); $avatar_catalog = platform_2424_stress_mass_normalize_catalog($avatar_input); $listing_catalog = platform_2424_stress_mass_normalize_catalog($listing_input); if (!platform_2424_stress_mass_catalog_input_is_valid($avatar_input) || !platform_2424_stress_mass_catalog_input_is_valid($listing_input) || !$avatar_catalog || !$listing_catalog) { set_transient('platform_2424_stress_mass_notice', 'Chaque catalogue doit contenir au moins une URL HTTPS valide, une URL par ligne.', MINUTE_IN_SECONDS); platform_2424_stress_mass_redirect(); } update_option('platform_2424_stress_mass_catalog_avatar', $avatar_catalog, false); update_option('platform_2424_stress_mass_catalog_listing', $listing_catalog, false); platform_2424_stress_mass_redirect(); });
add_action('admin_post_platform_2424_stress_mass_start', function () { platform_2424_stress_test_admin_guard(); $preflight = platform_2424_stress_mass_preflight(); if (is_wp_error($preflight)) { set_transient('platform_2424_stress_mass_notice', $preflight->get_error_message(), MINUTE_IN_SECONDS); platform_2424_stress_mass_redirect(); } $id = wp_generate_uuid4(); $targets = platform_2424_stress_mass_targets(); $campaign = array('campaign_id' => $id, 'profile' => 'mass', 'status' => 'generating', 'phase' => 'users', 'settings' => array('targets' => $targets, 'fixtures' => array('avatar' => platform_2424_stress_mass_catalog('avatar'), 'listing' => platform_2424_stress_mass_catalog('listing'))), 'counters' => array(), 'cursors' => array(), 'media' => array()); platform_2424_stress_mass_save($campaign); platform_2424_stress_mass_schedule_campaign($campaign, 'platform_2424_stress_mass_run', false, true); platform_2424_stress_mass_redirect(); });
add_action('admin_post_platform_2424_stress_mass_resume', function () { platform_2424_stress_test_admin_guard(); $campaign = platform_2424_stress_mass_get(sanitize_text_field($_POST['campaign_id'] ?? '')); if ($campaign && in_array($campaign['status'], array('failed','generating','deleting','uploading'), true)) { if ($campaign['status'] === 'failed') { $campaign['status'] = $campaign['phase'] === 'deleting' ? 'deleting' : 'generating'; $campaign['error'] = ''; platform_2424_stress_mass_save($campaign); } $hook = $campaign['status'] === 'deleting' ? 'platform_2424_stress_mass_delete_run' : ($campaign['status'] === 'uploading' ? 'platform_2424_stress_mass_upload_run' : 'platform_2424_stress_mass_run'); platform_2424_stress_mass_schedule_campaign($campaign, $hook, true, true); } platform_2424_stress_mass_redirect(); });
add_action('admin_post_platform_2424_stress_mass_uploads', function () { platform_2424_stress_test_admin_guard(); $campaign = platform_2424_stress_mass_get(sanitize_text_field($_POST['campaign_id'] ?? '')); if ($campaign && $campaign['status'] === 'ready') { $campaign['status'] = 'uploading'; $campaign['phase'] = 'uploads'; $campaign['error'] = ''; platform_2424_stress_mass_save($campaign); platform_2424_stress_mass_schedule_campaign($campaign, 'platform_2424_stress_mass_upload_run'); } platform_2424_stress_mass_redirect(); });
add_action('admin_post_platform_2424_stress_mass_simulate_delete', function () { platform_2424_stress_test_admin_guard(); $campaign_id = sanitize_text_field($_POST['campaign_id'] ?? ''); global $wpdb; $posts = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(DISTINCT post_id) FROM {$wpdb->postmeta} WHERE meta_key = 'platform_2424_stress_campaign' AND meta_value = %s", $campaign_id)); $users = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(DISTINCT user_id) FROM {$wpdb->usermeta} WHERE meta_key = 'platform_2424_stress_campaign' AND meta_value = %s", $campaign_id)); $campaign = platform_2424_stress_mass_get($campaign_id); $uploads = 0; foreach ((array) ($campaign['media'] ?? array()) as $media) { if (($media['status'] ?? '') === 'created') { $uploads++; } } set_transient('platform_2424_stress_mass_notice', sprintf('Simulation: %d annonces, %d utilisateurs et %d uploads reels marques par cette campagne seraient supprimes. Les fixtures partagees sont exclues.', $posts, $users, $uploads), MINUTE_IN_SECONDS); platform_2424_stress_mass_redirect(); });
add_action('admin_post_platform_2424_stress_mass_delete', function () { platform_2424_stress_test_admin_guard(); if (empty($_POST['confirm_cleanup'])) { wp_die('Confirmation explicite requise pour supprimer une campagne massive.'); } $campaign = platform_2424_stress_mass_get(sanitize_text_field($_POST['campaign_id'] ?? '')); if ($campaign && $campaign['status'] !== 'deleted') { $campaign['status'] = 'deleting'; $campaign['phase'] = 'deleting'; platform_2424_stress_mass_save($campaign); platform_2424_stress_mass_schedule_campaign($campaign, 'platform_2424_stress_mass_delete_run'); } platform_2424_stress_mass_redirect(); });
add_action('wp_ajax_platform_2424_stress_mass_status', function () { if (!current_user_can('manage_options') || !check_ajax_referer('platform_2424_stress_mass_status', 'nonce', false) || !platform_2424_stress_test_is_enabled()) { wp_send_json_error(array('error' => 'forbidden'), 403); } global $wpdb; $rows = $wpdb->get_results('SELECT campaign_id FROM ' . platform_2424_stress_mass_table() . ' ORDER BY created_at DESC LIMIT 20', ARRAY_A); $campaigns = array(); $active = false; $stale_campaign_id = ''; foreach ($rows as $row) { $campaign = platform_2424_stress_mass_get($row['campaign_id']); if (!$campaign) { continue; } $targets = (array) ($campaign['settings']['targets'] ?? array()); $counters = (array) ($campaign['counters'] ?? array()); $status = (string) ($campaign['status'] ?? ''); $last_progress = strtotime((string) ($campaign['last_progress_at'] ?? '') . ' UTC'); $is_active = in_array($status, array('generating', 'uploading', 'deleting'), true); if ($is_active) { $active = true; if ($stale_campaign_id === '' && (!$last_progress || time() - $last_progress >= 8)) { $stale_campaign_id = (string) $campaign['campaign_id']; } } $campaigns[] = array('id' => (string) $campaign['campaign_id'], 'status' => $status, 'phase' => (string) ($campaign['phase'] ?? ''), 'error' => (string) ($campaign['error'] ?? ''), 'counts' => sprintf('Utilisateurs %d/%d · Annonces %d/%d · Interactions %d/5000 · Uploads reels %d/1000 · Activite %s', absint($counters['users'] ?? 0), absint($targets['users'] ?? 0), absint($counters['classifieds'] ?? 0), absint($targets['classifieds'] ?? 0), absint($counters['conversations'] ?? 0), absint($counters['realUploads'] ?? 0), (string) ($campaign['last_progress_at'] ?? ''))); } wp_send_json_success(array('active' => $active, 'staleCampaignId' => $stale_campaign_id, 'campaigns' => $campaigns)); });
add_action('wp_ajax_platform_2424_stress_mass_kick', function () { if (!current_user_can('manage_options') || !check_ajax_referer('platform_2424_stress_mass_status', 'nonce', false) || !platform_2424_stress_test_is_enabled()) { wp_send_json_error(array('error' => 'forbidden'), 403); } $campaign_id = sanitize_text_field(wp_unslash($_POST['campaign_id'] ?? '')); $campaign = platform_2424_stress_mass_get($campaign_id); if (!$campaign || !in_array($campaign['status'] ?? '', array('generating', 'uploading', 'deleting'), true)) { wp_send_json_error(array('error' => 'campaign_unavailable'), 404); } if ($campaign['status'] === 'generating') { platform_2424_stress_mass_run($campaign_id); } elseif ($campaign['status'] === 'uploading') { platform_2424_stress_mass_upload_run($campaign_id); } else { platform_2424_stress_mass_delete_run($campaign_id); } wp_send_json_success(array('ok' => true)); });
