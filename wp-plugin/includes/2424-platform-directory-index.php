<?php
/**
 * Read-optimised directory projection. It combines published Annuaire posts
 * with eligible Business profiles without making public requests scan users.
 */
if (!defined('ABSPATH')) { exit; }

if (!function_exists('platform_2424_directory_index_table')) {
    function platform_2424_directory_index_table($role = 'active') { global $wpdb; return $wpdb->prefix . '2424_directory_index' . ($role === 'build' ? '_build' : ''); }
    function platform_2424_directory_index_terms_table($role = 'active') { global $wpdb; return $wpdb->prefix . '2424_directory_index_terms' . ($role === 'build' ? '_build' : ''); }
    function platform_2424_directory_index_state() { $state = get_option('platform_2424_directory_index_state', array()); return is_array($state) ? $state : array(); }
    function platform_2424_directory_index_save_state($state) { update_option('platform_2424_directory_index_state', is_array($state) ? $state : array(), false); }
    function platform_2424_directory_index_is_ready() { return (platform_2424_directory_index_state()['status'] ?? '') === 'ready'; }
    function platform_2424_directory_index_is_building() { return (platform_2424_directory_index_state()['status'] ?? '') === 'building'; }
    function platform_2424_directory_index_quote_table($table) { return '`' . str_replace('`', '``', (string) $table) . '`'; }

    function platform_2424_directory_index_install_schema() {
        if ((string) get_option('platform_2424_directory_index_schema_version', '') === '2') { return; }
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $charset = $wpdb->get_charset_collate();
        foreach (array('active', 'build') as $role) {
        $table = platform_2424_directory_index_table($role);
        $terms = platform_2424_directory_index_terms_table($role);
        dbDelta("CREATE TABLE {$table} (
            entry_key varchar(32) NOT NULL,
            source_type varchar(12) NOT NULL,
            source_id bigint(20) unsigned NOT NULL,
            is_visible tinyint(1) NOT NULL DEFAULT 0,
            is_featured tinyint(1) NOT NULL DEFAULT 0,
            published_at bigint(20) unsigned NOT NULL DEFAULT 0,
            modified_at bigint(20) unsigned NOT NULL DEFAULT 0,
            category_name varchar(191) NOT NULL DEFAULT '',
            sort_title varchar(191) NOT NULL DEFAULT '',
            search_text longtext NOT NULL,
            payload longtext NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY (entry_key),
            KEY visible_featured_title (is_visible, is_featured, sort_title(100)),
            KEY source (source_type, source_id),
            KEY visible_category (is_visible, category_name(100)),
            FULLTEXT KEY search_text (search_text)
        ) {$charset};");
        dbDelta("CREATE TABLE {$terms} (
            entry_key varchar(32) NOT NULL,
            term_type varchar(16) NOT NULL,
            term_name varchar(191) NOT NULL,
            PRIMARY KEY (entry_key, term_type, term_name),
            KEY term_lookup (term_type, term_name(100), entry_key)
        ) {$charset};");
        }
        update_option('platform_2424_directory_index_schema_version', '2', false);
    }
}
add_action('init', 'platform_2424_directory_index_install_schema', 2);

if (!function_exists('platform_2424_directory_index_string_list')) {
    function platform_2424_directory_index_string_list($values) {
        $result = array();
        foreach ((array) $values as $value) {
            $value = sanitize_text_field((string) $value);
            if ($value !== '') { $result[$value] = $value; }
        }
        return array_values($result);
    }

    function platform_2424_directory_index_post_item($post) {
        if (!($post instanceof WP_Post)) { return null; }
        $taxonomy = platform_submissions_taxonomy_for_kind('directory');
        $location_taxonomy = platform_submissions_location_taxonomy_for_kind('directory');
        $thumbnail = platform_submissions_rewrite_media_url((string) get_the_post_thumbnail_url($post, 'large'));
        $featured_image_url = platform_submissions_rewrite_media_url((string) get_post_meta($post->ID, 'featured_image_url', true));
        $gallery = get_post_meta($post->ID, 'gallery_images', true);
        $images = array_values(array_filter(array_map('platform_submissions_rewrite_media_url', is_array($gallery) ? $gallery : array())));
        if ($thumbnail) { array_unshift($images, $thumbnail); } elseif ($featured_image_url) { array_unshift($images, $featured_image_url); }
        $images = array_values(array_unique($images));
        $pair = platform_submissions_resolve_taxonomy_pair($post->ID, $taxonomy);
        $locations = platform_submissions_resolve_location_terms($post->ID, $location_taxonomy);
        $author = get_userdata((int) $post->post_author);
        $publisher = $author instanceof WP_User ? trim((string) $author->display_name) : '';
        $profile_photo = $author instanceof WP_User ? trim((string) get_user_meta($author->ID, 'profile_photo', true)) : '';
        $company_logo = $author instanceof WP_User ? trim((string) get_user_meta($author->ID, 'company_logo', true)) : '';
        if ($profile_photo === '' && $author instanceof WP_User) { $profile_photo = (string) get_avatar_url($author->ID); }
        $rating = platform_submissions_get_user_rating_summary((int) $post->post_author);
        return array(
            'id' => (int) $post->ID,
            'title' => platform_submissions_decode_html_entities(get_the_title($post)),
            'description' => wp_trim_words(wp_strip_all_tags((string) $post->post_content), 40),
            'content' => wp_kses_post((string) $post->post_content),
            'location' => sanitize_text_field((string) get_post_meta($post->ID, 'location', true)) ?: 'Madagascar',
            'date' => platform_submissions_get_public_listing_reference_date($post),
            'lastModified' => get_post_modified_time('c', true, $post),
            'category' => sanitize_text_field((string) ($pair['category'] ?? '')),
            'regions' => platform_2424_directory_index_string_list($locations['regions'] ?? array()),
            'cities' => platform_2424_directory_index_string_list($locations['cities'] ?? array()),
            'type' => '',
            'featured' => (bool) get_post_meta($post->ID, 'directory_featured', true),
            'image' => $thumbnail ?: $featured_image_url,
            'images' => array_slice($images, 0, 10),
            'contactPhone' => sanitize_text_field((string) get_post_meta($post->ID, 'contact_phone', true)),
            'contactPhoneCountry' => '',
            'contactEmail' => sanitize_email((string) get_post_meta($post->ID, 'contact_email', true)),
            'ownerWpUserId' => (int) $post->post_author,
            'ownerEmail' => $author instanceof WP_User ? sanitize_email((string) $author->user_email) : '',
            'ownerRatingAverage' => (float) ($rating['average'] ?? 0),
            'ownerRatingCount' => absint($rating['count'] ?? 0),
            'companyName' => sanitize_text_field((string) get_post_meta($post->ID, 'company_name', true)),
            'website' => esc_url_raw((string) get_post_meta($post->ID, 'website', true)),
            'publisherName' => sanitize_text_field($publisher),
            'profilePhoto' => esc_url_raw($profile_photo),
            'companyLogo' => esc_url_raw($company_logo),
            'price' => '', 'currency' => '', 'budget' => '', 'detailsPdfUrl' => '', 'detailsPdfName' => '', 'deadline' => '',
            'isAdminCreated' => true,
        );
    }

    function platform_2424_directory_index_entry_key($source_type, $source_id) { return sanitize_key($source_type) . ':' . absint($source_id); }

    function platform_2424_directory_index_delete($entry_key, $notify = true, $role = 'active') {
        global $wpdb;
        $wpdb->delete(platform_2424_directory_index_terms_table($role), array('entry_key' => $entry_key), array('%s'));
        $deleted = $wpdb->delete(platform_2424_directory_index_table($role), array('entry_key' => $entry_key), array('%s'));
        if ($role === 'active' && platform_2424_directory_index_is_building()) { platform_2424_directory_index_delete($entry_key, false, 'build'); }
        if ($notify && $deleted && function_exists('next_revalidate_send_scope_payload')) { next_revalidate_send_scope_payload(array('directory'), 'directory.index_updated'); }
    }

    function platform_2424_directory_index_store($source_type, $source_id, $item, $published_at, $modified_at, $notify = true, $role = 'active') {
        global $wpdb;
        $entry_key = platform_2424_directory_index_entry_key($source_type, $source_id);
        $title = sanitize_text_field((string) ($item['title'] ?? ''));
        $company = sanitize_text_field((string) ($item['companyName'] ?? ''));
        $category = sanitize_text_field((string) ($item['category'] ?? ''));
        $data = array(
            'entry_key' => $entry_key, 'source_type' => $source_type, 'source_id' => absint($source_id), 'is_visible' => 1,
            'is_featured' => !empty($item['featured']) ? 1 : 0, 'published_at' => max(0, (int) $published_at), 'modified_at' => max(0, (int) $modified_at),
            'category_name' => $category, 'sort_title' => $company !== '' ? $company : $title,
            'search_text' => trim(implode(' ', array($title, $item['description'] ?? '', $category, $item['location'] ?? '', $company, $item['publisherName'] ?? '', implode(' ', (array) ($item['regions'] ?? array())), implode(' ', (array) ($item['cities'] ?? array()))))),
            'payload' => wp_json_encode($item), 'updated_at' => current_time('mysql', true),
        );
        $wpdb->replace(platform_2424_directory_index_table($role), $data, array('%s','%s','%d','%d','%d','%d','%d','%s','%s','%s','%s','%s'));
        $terms_table = platform_2424_directory_index_terms_table($role);
        $wpdb->delete($terms_table, array('entry_key' => $entry_key), array('%s'));
        $term_groups = array('region' => $item['regions'] ?? array(), 'city' => $item['cities'] ?? array());
        foreach ($term_groups as $term_type => $values) {
            foreach (platform_2424_directory_index_string_list($values) as $term_name) {
                $wpdb->insert($terms_table, array('entry_key' => $entry_key, 'term_type' => $term_type, 'term_name' => $term_name), array('%s','%s','%s'));
            }
        }
        if ($role === 'active' && platform_2424_directory_index_is_building()) { platform_2424_directory_index_store($source_type, $source_id, $item, $published_at, $modified_at, false, 'build'); }
        if ($notify && function_exists('next_revalidate_send_scope_payload')) { next_revalidate_send_scope_payload(array('directory'), 'directory.index_updated'); }
        return true;
    }

    function platform_2424_directory_index_sync_post($post_id, $notify = true, $role = 'active') {
        $post = get_post(absint($post_id));
        $entry_key = platform_2424_directory_index_entry_key('post', $post_id);
        if (!($post instanceof WP_Post) || $post->post_type !== 'annuaire' || $post->post_status !== 'publish') { platform_2424_directory_index_delete($entry_key, $notify, $role); return; }
        $item = platform_2424_directory_index_post_item($post);
        if (!is_array($item)) { platform_2424_directory_index_delete($entry_key, $notify, $role); return; }
        platform_2424_directory_index_store('post', $post->ID, $item, (int) get_post_time('U', true, $post), (int) get_post_modified_time('U', true, $post), $notify, $role);
    }

    function platform_2424_directory_index_sync_user($user_id, $notify = true, $role = 'active') {
        $user_id = absint($user_id);
        $entry_key = platform_2424_directory_index_entry_key('user', $user_id);
        $user = get_userdata($user_id);
        if (!($user instanceof WP_User) || get_user_meta($user_id, 'platform_2424_test_data', true) === '1' || !function_exists('platform_submissions_build_directory_business_item')) { platform_2424_directory_index_delete($entry_key, $notify, $role); return; }
        $item = platform_submissions_build_directory_business_item($user);
        if (!is_array($item)) { platform_2424_directory_index_delete($entry_key, $notify, $role); return; }
        $registered_at = $user->user_registered && $user->user_registered !== '0000-00-00 00:00:00' ? strtotime($user->user_registered . ' UTC') : time();
        platform_2424_directory_index_store('user', $user_id, $item, $registered_at ?: time(), time(), $notify, $role);
    }

    function platform_2424_directory_index_expand_region_filters($regions) {
        $expanded = array(
            'regions' => platform_2424_directory_index_string_list($regions),
            'cities' => array(),
        );

        if (!$expanded['regions'] || !taxonomy_exists('directory_location')) {
            return $expanded;
        }

        foreach ($expanded['regions'] as $region_name) {
            $parent_terms = get_terms(array(
                'taxonomy' => 'directory_location',
                'hide_empty' => false,
                'name' => $region_name,
                'parent' => 0,
            ));

            if (is_wp_error($parent_terms) || !is_array($parent_terms)) {
                continue;
            }

            foreach ($parent_terms as $parent_term) {
                if (!($parent_term instanceof WP_Term)) {
                    continue;
                }

                $child_ids = get_term_children((int) $parent_term->term_id, 'directory_location');
                if (is_wp_error($child_ids) || !$child_ids) {
                    continue;
                }

                $child_terms = get_terms(array(
                    'taxonomy' => 'directory_location',
                    'hide_empty' => false,
                    'include' => array_map('absint', $child_ids),
                ));

                if (is_wp_error($child_terms) || !is_array($child_terms)) {
                    continue;
                }

                foreach ($child_terms as $child_term) {
                    if ($child_term instanceof WP_Term) {
                        $expanded['cities'][] = (string) $child_term->name;
                    }
                }
            }
        }

        $expanded['cities'] = platform_2424_directory_index_string_list($expanded['cities']);
        return $expanded;
    }

    function platform_2424_directory_index_query($payload) {
        global $wpdb;
        $payload = is_array($payload) ? $payload : array();
        $table = platform_2424_directory_index_table(); $terms_table = platform_2424_directory_index_terms_table();
        $page = max(1, absint($payload['page'] ?? 1)); $per_page = min(50, max(1, absint($payload['perPage'] ?? 24)));
        $where = array('d.is_visible = 1'); $args = array();
        $id = isset($payload['id']) ? (int) $payload['id'] : 0;
        if ($id !== 0) { $where[] = "JSON_EXTRACT(d.payload, '$.id') = %d"; $args[] = $id; $page = 1; $per_page = 1; }
        $category = sanitize_text_field((string) ($payload['category'] ?? ''));
        if ($category !== '' && strcasecmp($category, 'Tous') !== 0) { $where[] = 'd.category_name = %s'; $args[] = $category; }
        if (!empty($payload['featured'])) { $where[] = 'd.is_featured = 1'; }
        $search = sanitize_text_field((string) ($payload['search'] ?? ''));
        if ($search !== '') {
            $words = preg_split('/\s+/', $search); $terms = array(); $short = false;
            foreach ((array) $words as $word) { $word = preg_replace('/[^\p{L}\p{N}]/u', '', $word); if ($word === '') { continue; } if ((function_exists('mb_strlen') ? mb_strlen($word) : strlen($word)) < 3) { $short = true; } $terms[] = $word . '*'; }
            if ($terms && !$short) { $where[] = 'MATCH(d.search_text) AGAINST (%s IN BOOLEAN MODE)'; $args[] = implode(' ', $terms); }
            else { $where[] = 'd.search_text LIKE %s'; $args[] = '%' . $wpdb->esc_like($search) . '%'; }
        }
        $region_filters = platform_2424_directory_index_expand_region_filters($payload['regions'] ?? array());
        if ($region_filters['regions']) {
            $region_placeholders = implode(',', array_fill(0, count($region_filters['regions']), '%s'));
            $conditions = array("EXISTS (SELECT 1 FROM {$terms_table} dt WHERE dt.entry_key = d.entry_key AND dt.term_type = %s AND dt.term_name IN ({$region_placeholders}))");
            $args[] = 'region'; foreach ($region_filters['regions'] as $region) { $args[] = $region; }

            if ($region_filters['cities']) {
                $city_placeholders = implode(',', array_fill(0, count($region_filters['cities']), '%s'));
                $conditions[] = "EXISTS (SELECT 1 FROM {$terms_table} dt WHERE dt.entry_key = d.entry_key AND dt.term_type = %s AND dt.term_name IN ({$city_placeholders}))";
                $args[] = 'city'; foreach ($region_filters['cities'] as $city) { $args[] = $city; }
            }

            $where[] = '(' . implode(' OR ', $conditions) . ')';
        }

        $cities = platform_2424_directory_index_string_list($payload['cities'] ?? array());
        if ($cities) {
            $placeholders = implode(',', array_fill(0, count($cities), '%s'));
            $where[] = "EXISTS (SELECT 1 FROM {$terms_table} dt WHERE dt.entry_key = d.entry_key AND dt.term_type = %s AND dt.term_name IN ({$placeholders}))";
            $args[] = 'city'; foreach ($cities as $city) { $args[] = $city; }
        }
        $where_sql = implode(' AND ', $where);
        $total = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$table} d WHERE {$where_sql}", $args));
        $offset = ($page - 1) * $per_page;
        $query_args = array_merge($args, array($per_page, $offset));
        $rows = $wpdb->get_col($wpdb->prepare("SELECT d.payload FROM {$table} d WHERE {$where_sql} ORDER BY d.is_featured DESC, d.sort_title ASC, d.entry_key ASC LIMIT %d OFFSET %d", $query_args));
        $items = array(); foreach ((array) $rows as $row) { $item = json_decode((string) $row, true); if (is_array($item)) { $items[] = $item; } }
        return array('items' => $items, 'pagination' => array('page' => $page, 'perPage' => $per_page, 'total' => $total, 'totalPages' => max(1, (int) ceil($total / $per_page))));
    }

    function platform_2424_directory_index_search($query, $limit = 100) { return platform_2424_directory_index_query(array('search' => $query, 'page' => 1, 'perPage' => min(50, max(1, absint($limit))))); }
}

if (!function_exists('platform_2424_directory_index_schedule_rebuild')) {
    function platform_2424_directory_index_schedule_rebuild($delay = 1) {
        if (function_exists('as_schedule_single_action')) { return as_schedule_single_action(time() + max(1, absint($delay)), 'platform_2424_directory_index_rebuild', array(), '2424-directory-index', false); }
        return wp_schedule_single_event(time() + max(1, absint($delay)), 'platform_2424_directory_index_rebuild');
    }
    function platform_2424_directory_index_start_rebuild() {
        global $wpdb;
        $wpdb->query('TRUNCATE TABLE ' . platform_2424_directory_index_quote_table(platform_2424_directory_index_terms_table('build')));
        $wpdb->query('TRUNCATE TABLE ' . platform_2424_directory_index_quote_table(platform_2424_directory_index_table('build')));
        platform_2424_directory_index_save_state(array('status' => 'building', 'stage' => 'posts', 'cursor' => 0, 'indexed' => 0, 'startedAt' => gmdate('c'), 'lastProgressAt' => gmdate('c'), 'error' => ''));
        platform_2424_directory_index_schedule_rebuild();
    }
    function platform_2424_directory_index_verify_build() {
        global $wpdb;
        $expected_posts = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'annuaire' AND post_status = 'publish'");
        $actual_posts = (int) $wpdb->get_var("SELECT COUNT(*) FROM " . platform_2424_directory_index_quote_table(platform_2424_directory_index_table('build')) . " WHERE source_type = 'post'");
        return $expected_posts === $actual_posts;
    }
    function platform_2424_directory_index_swap_tables() {
        global $wpdb;
        $active = platform_2424_directory_index_quote_table(platform_2424_directory_index_table());
        $build = platform_2424_directory_index_quote_table(platform_2424_directory_index_table('build'));
        $old = platform_2424_directory_index_quote_table(platform_2424_directory_index_table() . '_old');
        $terms_active = platform_2424_directory_index_quote_table(platform_2424_directory_index_terms_table());
        $terms_build = platform_2424_directory_index_quote_table(platform_2424_directory_index_terms_table('build'));
        $terms_old = platform_2424_directory_index_quote_table(platform_2424_directory_index_terms_table() . '_old');
        $wpdb->query("DROP TABLE IF EXISTS {$old}, {$terms_old}");
        return $wpdb->query("RENAME TABLE {$active} TO {$old}, {$build} TO {$active}, {$old} TO {$build}, {$terms_active} TO {$terms_old}, {$terms_build} TO {$terms_active}, {$terms_old} TO {$terms_build}") !== false;
    }
    function platform_2424_directory_index_maybe_start_initial_rebuild() {
        if (get_option('platform_2424_directory_index_initialized', '') === '1') { return; }
        update_option('platform_2424_directory_index_initialized', '1', false);
        platform_2424_directory_index_start_rebuild();
    }
    function platform_2424_directory_index_rebuild() {
        global $wpdb;
        $lock = 'platform_2424_directory_index_rebuild_lock'; if (get_transient($lock)) { return; }
        set_transient($lock, '1', 5 * MINUTE_IN_SECONDS);
        try {
            $state = platform_2424_directory_index_state(); if (($state['status'] ?? '') !== 'building') { return; }
            $cursor = absint($state['cursor'] ?? 0); $stage = $state['stage'] ?? 'posts';
            if ($stage === 'posts') { $ids = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE ID > %d AND post_type = 'annuaire' ORDER BY ID ASC LIMIT 100", $cursor)); foreach ((array) $ids as $id) { platform_2424_directory_index_sync_post((int) $id, false, 'build'); $cursor = (int) $id; } }
            else { $ids = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->users} WHERE ID > %d ORDER BY ID ASC LIMIT 100", $cursor)); foreach ((array) $ids as $id) { platform_2424_directory_index_sync_user((int) $id, false, 'build'); $cursor = (int) $id; } }
            if (!$ids && $stage === 'posts') { $state['stage'] = 'users'; $state['cursor'] = 0; $state['lastProgressAt'] = gmdate('c'); platform_2424_directory_index_save_state($state); platform_2424_directory_index_schedule_rebuild(); return; }
            if (!$ids) { if (!platform_2424_directory_index_verify_build() || !platform_2424_directory_index_swap_tables()) { throw new RuntimeException('La vérification ou la permutation de l’index Annuaire a échoué.'); } $state['status'] = 'ready'; $state['completedAt'] = gmdate('c'); $state['lastProgressAt'] = gmdate('c'); platform_2424_directory_index_save_state($state); if (function_exists('next_revalidate_send_scope_payload')) { next_revalidate_send_scope_payload(array('directory'), 'directory.index_rebuilt'); } return; }
            $state['cursor'] = $cursor; $state['indexed'] = absint($state['indexed'] ?? 0) + count($ids); $state['lastProgressAt'] = gmdate('c'); platform_2424_directory_index_save_state($state); platform_2424_directory_index_schedule_rebuild();
        } catch (Throwable $error) {
            $state = platform_2424_directory_index_state(); $state['status'] = 'failed'; $state['error'] = 'La reconstruction a échoué. Utilisez Reprendre après vérification des logs.'; $state['lastProgressAt'] = gmdate('c'); platform_2424_directory_index_save_state($state);
            if (function_exists('platform_2424_log_event')) { platform_2424_log_event('error', 'directory-index', 'Reconstruction de l’index Annuaire échouée.', array('exception' => get_class($error))); }
        } finally { delete_transient($lock); }
    }
}
add_action('init', 'platform_2424_directory_index_maybe_start_initial_rebuild', 30);
add_action('platform_2424_directory_index_rebuild', 'platform_2424_directory_index_rebuild');

add_action('save_post', function ($post_id, $post) { if (!wp_is_post_revision($post_id) && !wp_is_post_autosave($post_id) && $post instanceof WP_Post && $post->post_type === 'annuaire') { platform_2424_directory_index_sync_post($post_id); } }, 120, 2);
add_action('transition_post_status', function ($new, $old, $post) { if ($post instanceof WP_Post && $post->post_type === 'annuaire') { platform_2424_directory_index_sync_post($post->ID); } }, 120, 3);
add_action('before_delete_post', function ($post_id) { $post = get_post($post_id); if ($post instanceof WP_Post && $post->post_type === 'annuaire') { platform_2424_directory_index_delete(platform_2424_directory_index_entry_key('post', $post_id)); } }, 120);
add_action('set_object_terms', function ($post_id, $terms, $tt_ids, $taxonomy) { if (in_array($taxonomy, array('directory_category', 'directory_location'), true)) { platform_2424_directory_index_sync_post($post_id); } }, 120, 4);
add_action('edited_directory_location', function ($term_id) {
    $term_ids = array_merge(array(absint($term_id)), (array) get_term_children(absint($term_id), 'directory_location'));
    $post_ids = get_objects_in_term(array_filter($term_ids), 'directory_location');

    if (is_wp_error($post_ids) || !$post_ids) {
        return;
    }

    foreach (array_unique(array_map('absint', $post_ids)) as $post_id) {
        platform_2424_directory_index_sync_post($post_id, false);
    }

    if (function_exists('next_revalidate_send_scope_payload')) {
        next_revalidate_send_scope_payload(array('directory'), 'directory.location_hierarchy_updated');
    }
}, 120);
foreach (array('added_post_meta', 'updated_post_meta', 'deleted_post_meta') as $hook) { add_action($hook, function ($meta_id, $post_id, $meta_key) { if (get_post_type($post_id) === 'annuaire' && in_array((string) $meta_key, array('_thumbnail_id','featured_image_url','gallery_images','contact_phone','contact_email','website','company_name','location','directory_featured'), true)) { platform_2424_directory_index_sync_post($post_id); } }, 120, 3); }
add_action('profile_update', function ($user_id) { platform_2424_directory_index_sync_user($user_id); }, 120);
add_action('deleted_user', function ($user_id) { platform_2424_directory_index_delete(platform_2424_directory_index_entry_key('user', $user_id)); }, 120);
foreach (array('added_user_meta', 'updated_user_meta', 'deleted_user_meta') as $hook) { add_action($hook, function ($meta_id, $user_id, $meta_key) { $keys = array('business_activity_category','business_regions','business_cities','platform_directory_visibility_enabled','profile_photo','company_logo','address','phone','platform_plan_id','_platform_manual_plan_id','_platform_manual_status','_platform_all_privileges_enabled','_platform_all_privileges_directory_visible','_platform_directory_hidden_by_admin','_platform_directory_business_featured','_platform_mvola_renews_at'); if (in_array((string) $meta_key, $keys, true)) { platform_2424_directory_index_sync_user($user_id); } }, 120, 3); }
add_action('updated_option', function ($option, $old_value, $value) {
    if ($option === 'platform_2424_directory_minimum_plan' && (string) $old_value !== (string) $value) {
        // A global eligibility threshold can affect many profiles at once.
        platform_2424_directory_index_start_rebuild();
    }
}, 120, 3);
add_action('woocommerce_subscription_status_updated', function ($subscription) {
    if (is_object($subscription) && method_exists($subscription, 'get_user_id')) {
        platform_2424_directory_index_sync_user((int) $subscription->get_user_id());
    }
}, 120, 1);

if (!function_exists('platform_2424_directory_index_render_card')) {
    function platform_2424_directory_index_status_payload() {
        global $wpdb; $state = platform_2424_directory_index_state(); $table = platform_2424_directory_index_table();
        $counts = $wpdb->get_results("SELECT source_type, COUNT(*) AS total FROM {$table} GROUP BY source_type", ARRAY_A); $labels = array(); foreach ((array) $counts as $count) { $labels[] = sanitize_key($count['source_type']) . ': ' . number_format_i18n(absint($count['total'])); }
        $build_table = platform_2424_directory_index_table('build'); $build_counts = $wpdb->get_results("SELECT source_type, COUNT(*) AS total FROM {$build_table} GROUP BY source_type", ARRAY_A); $build_labels = array(); foreach ((array) $build_counts as $count) { $build_labels[] = sanitize_key($count['source_type']) . ': ' . number_format_i18n(absint($count['total'])); }
        return array('status' => (string) ($state['status'] ?? 'non construit'), 'rebuild' => ($state['status'] ?? '') === 'building' ? 'En arrière-plan' : 'Inactive', 'indexed' => number_format_i18n(absint($state['indexed'] ?? 0)), 'counts' => $labels ? implode(' | ', $labels) : 'Aucun document', 'buildCounts' => $build_labels ? implode(' | ', $build_labels) : 'Aucun document', 'progress' => (string) ($state['lastProgressAt'] ?? 'Jamais'), 'verified' => (string) ($state['verifiedAt'] ?? 'Jamais'), 'error' => (string) ($state['error'] ?? 'Aucune'));
    }
    function platform_2424_directory_index_render_card() {
        $state = platform_2424_directory_index_state(); $status = platform_2424_directory_index_status_payload(); ?>
        <hr style="margin:28px 0" /><div class="platform-2424-card" id="platform-2424-directory-index" data-live="<?php echo ($state['status'] ?? '') === 'building' ? 'yes' : 'no'; ?>"><h3>Index SQL de l’Annuaire</h3><p>Les entrées créées dans le backoffice et les profils Business sont lus depuis cet index. Les reconstructions se préparent en arrière-plan sans interrompre l’Annuaire.</p><table class="widefat striped" style="max-width:760px"><tbody><tr><th>État</th><td data-directory-index-status><?php echo esc_html($status['status']); ?></td></tr><tr><th>Reconstruction</th><td data-directory-index-rebuild><?php echo esc_html($status['rebuild']); ?></td></tr><tr><th>Documents indexés</th><td data-directory-index-indexed><?php echo esc_html($status['indexed']); ?></td></tr><tr><th>Répartition</th><td data-directory-index-counts><?php echo esc_html($status['counts']); ?></td></tr><tr><th>Préparation</th><td data-directory-index-build-counts><?php echo esc_html($status['buildCounts']); ?></td></tr><tr><th>Dernière activité</th><td data-directory-index-progress><?php echo esc_html($status['progress']); ?></td></tr><tr><th>Dernière vérification</th><td data-directory-index-verified><?php echo esc_html($status['verified']); ?></td></tr><tr><th>Erreur</th><td data-directory-index-error><?php echo esc_html($status['error']); ?></td></tr></tbody></table><form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-top:16px;display:inline-block"><input type="hidden" name="action" value="platform_2424_directory_index_rebuild" /><?php wp_nonce_field('platform_2424_directory_index'); ?><button class="button button-primary" <?php disabled(($state['status'] ?? '') === 'building'); ?>>Reconstruire l’index Annuaire</button></form><form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin:16px 0 0 8px;display:inline-block"><input type="hidden" name="action" value="platform_2424_directory_index_resume" /><?php wp_nonce_field('platform_2424_directory_index'); ?><button class="button" <?php disabled(!in_array(($state['status'] ?? ''), array('building','failed'), true)); ?>>Reprendre</button></form><form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin:16px 0 0 8px;display:inline-block"><input type="hidden" name="action" value="platform_2424_directory_index_verify" /><?php wp_nonce_field('platform_2424_directory_index'); ?><button class="button" <?php disabled(($state['status'] ?? '') !== 'ready'); ?>>Vérifier</button></form><script>(function(){var card=document.getElementById('platform-2424-directory-index');if(!card||card.dataset.live!=='yes'){return;}var endpoint='<?php echo esc_url(admin_url('admin-ajax.php')); ?>',nonce='<?php echo esc_js(wp_create_nonce('platform_2424_directory_index_status')); ?>';function refresh(){fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},body:new URLSearchParams({action:'platform_2424_directory_index_status',nonce:nonce})}).then(function(r){return r.json();}).then(function(r){if(!r.success||!r.data){return;}Object.keys(r.data).forEach(function(key){var node=card.querySelector('[data-directory-index-'+key.replace(/[A-Z]/g,function(letter){return '-'+letter.toLowerCase();})+']');if(node){node.textContent=r.data[key];}});if(r.data.status==='building'){window.setTimeout(refresh,3000);}}).catch(function(){window.setTimeout(refresh,5000);});}refresh();}());</script></div><?php
    }
}
add_action('platform_2424_after_public_listing_index_tab', 'platform_2424_directory_index_render_card');
add_action('admin_post_platform_2424_directory_index_rebuild', function () { if (!current_user_can('manage_options')) { wp_die('Forbidden'); } check_admin_referer('platform_2424_directory_index'); platform_2424_directory_index_start_rebuild(); wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=listing-index')); exit; });
add_action('admin_post_platform_2424_directory_index_resume', function () { if (!current_user_can('manage_options')) { wp_die('Forbidden'); } check_admin_referer('platform_2424_directory_index'); $state = platform_2424_directory_index_state(); if (in_array(($state['status'] ?? ''), array('building','failed'), true)) { $state['status'] = 'building'; unset($state['maintenance']); $state['error'] = ''; $state['lastProgressAt'] = gmdate('c'); platform_2424_directory_index_save_state($state); platform_2424_directory_index_schedule_rebuild(); } wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=listing-index')); exit; });
add_action('admin_post_platform_2424_directory_index_verify', function () { if (!current_user_can('manage_options')) { wp_die('Forbidden'); } check_admin_referer('platform_2424_directory_index'); global $wpdb; $state = platform_2424_directory_index_state(); $state['verifiedAt'] = gmdate('c'); $state['verificationCounts'] = $wpdb->get_results('SELECT source_type, COUNT(*) AS total FROM ' . platform_2424_directory_index_table() . ' GROUP BY source_type', ARRAY_A); platform_2424_directory_index_save_state($state); wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=listing-index')); exit; });
add_action('wp_ajax_platform_2424_directory_index_status', function () { if (!current_user_can('manage_options') || !check_admin_referer('platform_2424_directory_index_status', 'nonce', false)) { wp_send_json_error(array('error' => 'forbidden'), 403); } wp_send_json_success(platform_2424_directory_index_status_payload()); });
