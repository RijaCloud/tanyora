<?php
/**
 * Read-optimised public listing index. WordPress postmeta remains the write
 * model; this table is the bounded read model used by public list pages.
 * Version: 1.0.1
 */
if (!defined('ABSPATH')) { exit; }

if (!function_exists('platform_2424_public_listing_index_table')) {
    function platform_2424_public_listing_index_table($role = 'active') {
        global $wpdb;
        return $wpdb->prefix . '2424_public_listing_index' . ($role === 'build' ? '_build' : '');
    }

    function platform_2424_public_listing_index_state() {
        $state = get_option('platform_2424_public_listing_index_state', array());
        return is_array($state) ? $state : array();
    }

    function platform_2424_public_listing_index_save_state($state) {
        update_option('platform_2424_public_listing_index_state', is_array($state) ? $state : array(), false);
    }

    function platform_2424_public_listing_index_is_ready() {
        $state = platform_2424_public_listing_index_state();
        return ($state['status'] ?? '') === 'ready';
    }

    function platform_2424_public_listing_index_is_building() {
        return (platform_2424_public_listing_index_state()['status'] ?? '') === 'building';
    }

    function platform_2424_public_listing_index_quote_table($table) {
        return '`' . str_replace('`', '``', (string) $table) . '`';
    }

    function platform_2424_public_listing_index_install_schema() {
        if ((string) get_option('platform_2424_public_listing_index_schema_version', '') === '2') { return; }
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $tables = array(platform_2424_public_listing_index_table(), platform_2424_public_listing_index_table('build'));
        $charset = $wpdb->get_charset_collate();
        foreach ($tables as $table) { dbDelta("CREATE TABLE {$table} (
            listing_id bigint(20) unsigned NOT NULL,
            kind varchar(20) NOT NULL,
            post_type varchar(32) NOT NULL,
            author_id bigint(20) unsigned NOT NULL DEFAULT 0,
            is_visible tinyint(1) NOT NULL DEFAULT 0,
            published_at bigint(20) unsigned NOT NULL DEFAULT 0,
            expires_at bigint(20) unsigned NOT NULL DEFAULT 2147483647,
            scheduled_at bigint(20) unsigned NOT NULL DEFAULT 0,
            deadline_at bigint(20) unsigned NOT NULL DEFAULT 2147483647,
            boost_expires_at bigint(20) unsigned NOT NULL DEFAULT 0,
            category_name varchar(191) NOT NULL DEFAULT '',
            type_name varchar(191) NOT NULL DEFAULT '',
            product_tag_name varchar(191) NOT NULL DEFAULT '',
            city_name varchar(191) NOT NULL DEFAULT '',
            area_name varchar(191) NOT NULL DEFAULT '',
            company_name varchar(191) NOT NULL DEFAULT '',
            currency varchar(16) NOT NULL DEFAULT '',
            price decimal(20,2) NOT NULL DEFAULT 0,
            search_text longtext NOT NULL,
            payload longtext NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (listing_id),
            KEY kind_visible_date (kind, is_visible, published_at),
            KEY kind_category_date (kind, is_visible, category_name(100), published_at),
            KEY kind_location_date (kind, is_visible, city_name(100), area_name(100), published_at),
            KEY kind_price_date (kind, is_visible, currency, price, published_at),
            KEY kind_schedule_expiry (kind, is_visible, scheduled_at, expires_at, deadline_at),
            KEY kind_company_date (kind, is_visible, company_name(100), published_at),
            KEY author_id (author_id),
            FULLTEXT KEY search_text (search_text)
        ) {$charset};"); }
        update_option('platform_2424_public_listing_index_schema_version', '2', false);
    }
}
add_action('init', 'platform_2424_public_listing_index_install_schema', 1);

if (!function_exists('platform_2424_public_listing_index_kind_for_post')) {
    function platform_2424_public_listing_index_kind_for_post($post) {
        if (!($post instanceof WP_Post)) { return ''; }
        $map = array('classified_ad' => 'classified', 'job_offer' => 'job', 'tender_notice' => 'tender');
        return $map[$post->post_type] ?? '';
    }

    function platform_2424_public_listing_index_build_item($post, $kind, $now_ts = null) {
        if (!($post instanceof WP_Post) || $kind === '') { return null; }
        $now_ts = $now_ts === null ? time() : (int) $now_ts;
        $taxonomy = platform_submissions_taxonomy_for_kind($kind);
        $location_taxonomy = platform_submissions_location_taxonomy_for_kind($kind);
        $thumbnail = platform_submissions_rewrite_media_url((string) get_the_post_thumbnail_url($post, 'large'));
        $featured_image_url = platform_submissions_rewrite_media_url((string) get_post_meta($post->ID, 'featured_image_url', true));
        $gallery_images = get_post_meta($post->ID, 'gallery_images', true);
        $gallery_images = is_array($gallery_images) ? $gallery_images : array();
        $images = array_values(array_filter(array_map('platform_submissions_rewrite_media_url', $gallery_images)));
        if ($thumbnail) { array_unshift($images, $thumbnail); } elseif ($featured_image_url) { array_unshift($images, $featured_image_url); }
        $images = array_values(array_unique($images));
        $taxonomy_pair = platform_submissions_resolve_taxonomy_pair($post->ID, $taxonomy);
        $locations = platform_submissions_resolve_location_terms($post->ID, $location_taxonomy);
        $city = sanitize_text_field((string) ($locations['regions'][0] ?? get_post_meta($post->ID, 'city', true)));
        $area = sanitize_text_field((string) ($locations['cities'][0] ?? get_post_meta($post->ID, 'area', true)));
        $author = get_userdata((int) $post->post_author);
        $publisher_name = $author instanceof WP_User ? trim((string) $author->display_name) : '';
        $profile_photo = $author instanceof WP_User ? trim((string) get_user_meta($author->ID, 'profile_photo', true)) : '';
        $company_logo = $author instanceof WP_User ? trim((string) get_user_meta($author->ID, 'company_logo', true)) : '';
        if ($profile_photo === '' && $author instanceof WP_User) { $profile_photo = (string) get_avatar_url($author->ID); }
        if ($publisher_name === '') { $publisher_name = trim((string) get_the_author_meta('display_name', (int) $post->post_author)); }
        $category = (string) ($taxonomy_pair['category'] ?? '');
        $type = (string) ($taxonomy_pair['type'] ?? '');
        $product_tag = $kind === 'classified' ? platform_submissions_get_assigned_classified_product_tag($post->ID) : '';
        return array(
            'id' => (int) $post->ID,
            'title' => platform_submissions_decode_html_entities(get_the_title($post)),
            'description' => wp_trim_words(wp_strip_all_tags((string) $post->post_content), 40),
            'content' => wp_kses_post((string) $post->post_content),
            'location' => platform_submissions_build_location_display_value($city, $area) ?: sanitize_text_field((string) get_post_meta($post->ID, 'location', true)),
            'city' => $city,
            'area' => $area,
            'date' => platform_submissions_get_public_listing_reference_date($post),
            'category' => $category,
            'type' => $type,
            'productTag' => $product_tag,
            'condition' => sanitize_text_field((string) get_post_meta($post->ID, 'condition', true)),
            'viewCount' => platform_submissions_get_view_count($post->ID),
            'regions' => $locations['regions'], 'cities' => $locations['cities'],
            'featured' => platform_submissions_is_boost_active($post->ID, $now_ts),
            'image' => $thumbnail ? $thumbnail : $featured_image_url,
            'images' => array_slice($images, 0, $kind === 'classified' ? platform_submissions_get_classified_gallery_limit_max() : 10),
            'contactPhone' => sanitize_text_field((string) get_post_meta($post->ID, 'contact_phone', true)),
            'contactPhoneCountry' => sanitize_key((string) get_post_meta($post->ID, 'contact_phone_country', true)),
            'contactEmail' => platform_submissions_resolve_contact_email($post->ID, (int) $post->post_author),
            'ownerWpUserId' => (int) $post->post_author,
            'ownerEmail' => $author instanceof WP_User ? sanitize_email((string) $author->user_email) : '',
            'companyName' => sanitize_text_field((string) get_post_meta($post->ID, 'company_name', true)),
            'website' => esc_url_raw((string) get_post_meta($post->ID, 'website', true)),
            'publisherName' => sanitize_text_field($publisher_name),
            'profilePhoto' => esc_url_raw($profile_photo), 'companyLogo' => esc_url_raw($company_logo),
            'price' => sanitize_text_field((string) get_post_meta($post->ID, 'price', true)),
            'currency' => sanitize_text_field((string) get_post_meta($post->ID, 'currency', true)),
            'budget' => sanitize_text_field((string) get_post_meta($post->ID, 'budget', true)),
            'detailsPdfUrl' => esc_url_raw((string) get_post_meta($post->ID, 'details_pdf_url', true)),
            'detailsPdfName' => sanitize_text_field((string) get_post_meta($post->ID, 'details_pdf_name', true)),
            'skills' => platform_submissions_get_job_skills($post->ID),
            'experienceYears' => sanitize_text_field((string) get_post_meta($post->ID, 'experience_years', true)),
            'needBy' => sanitize_text_field((string) get_post_meta($post->ID, 'need_by', true)),
            'deadline' => sanitize_text_field((string) get_post_meta($post->ID, 'deadline', true)),
            'isAdminCreated' => sanitize_key((string) get_post_meta($post->ID, 'submission_source', true)) !== 'next-frontend',
        );
    }

    function platform_2424_public_listing_index_sync_listing($post_id, $role = 'active') {
        global $wpdb;
        $post = get_post(absint($post_id));
        $kind = platform_2424_public_listing_index_kind_for_post($post);
        if (!$kind) { return false; }
        $table = platform_2424_public_listing_index_table($role);
        if (!$post || in_array($post->post_status, array('trash', 'auto-draft'), true)) {
            $wpdb->delete($table, array('listing_id' => absint($post_id)), array('%d'));
            if ($role === 'active' && platform_2424_public_listing_index_is_building()) { platform_2424_public_listing_index_sync_listing($post_id, 'build'); }
            return true;
        }
        $now_ts = time();
        $expires_at = absint(platform_submissions_resolve_listing_expires_ts($post, array('backfill' => false, 'nowTs' => $now_ts)));
        $scheduled_at = absint(get_post_meta($post->ID, 'scheduled_publish_at_ts', true));
        $deadline = sanitize_text_field((string) get_post_meta($post->ID, 'deadline', true));
        $deadline_ts = $deadline !== '' ? strtotime(preg_match('/\d{1,2}:\d{2}/', $deadline) ? $deadline : $deadline . ' 23:59:59') : 0;
        // Time constraints are applied in SQL at read time. Keeping published
        // rows indexed avoids a second write when a scheduled date is reached.
        $visible = $post->post_status === 'publish';
        $item = platform_2424_public_listing_index_build_item($post, $kind, $now_ts);
        if (!is_array($item)) { return false; }
        $data = array(
            'listing_id' => (int) $post->ID, 'kind' => $kind, 'post_type' => (string) $post->post_type, 'author_id' => (int) $post->post_author,
            'is_visible' => $visible ? 1 : 0, 'published_at' => max(0, (int) get_post_time('U', true, $post)),
            'expires_at' => $expires_at > 0 ? $expires_at : 2147483647, 'scheduled_at' => $scheduled_at,
            'deadline_at' => $deadline_ts > 0 ? $deadline_ts : 2147483647,
            'boost_expires_at' => absint(get_post_meta($post->ID, 'boost_expires_at_ts', true)),
            'category_name' => (string) $item['category'], 'type_name' => (string) $item['type'], 'product_tag_name' => (string) $item['productTag'],
            'city_name' => (string) $item['city'], 'area_name' => (string) $item['area'], 'company_name' => (string) $item['companyName'], 'currency' => strtoupper((string) $item['currency']),
            'price' => is_numeric($item['price']) ? (float) $item['price'] : 0,
            'search_text' => trim(implode(' ', array($item['title'], $item['description'], $item['category'], $item['type'], $item['productTag'], $item['city'], $item['area'], $item['companyName'], $item['publisherName']))),
            'payload' => wp_json_encode($item), 'updated_at' => current_time('mysql', true),
        );
        $columns = array_keys($data);
        $updates = array(); foreach ($columns as $column) { if ($column !== 'listing_id') { $updates[] = "{$column}=VALUES({$column})"; } }
        $sql = "INSERT INTO {$table} (" . implode(',', $columns) . ') VALUES (' . implode(',', array_fill(0, count($columns), '%s')) . ') ON DUPLICATE KEY UPDATE ' . implode(',', $updates);
        // db::prepare does not support dynamic typed placeholders safely here; values are escaped by prepare's %s and numeric fields are cast above.
        $written = $wpdb->query($wpdb->prepare($sql, array_values($data))) !== false;
        if ($written && $role === 'active' && platform_2424_public_listing_index_is_building()) { platform_2424_public_listing_index_sync_listing($post_id, 'build'); }
        return $written;
    }
}

if (!function_exists('platform_2424_public_listing_index_query')) {
    function platform_2424_public_listing_index_query($kind, $payload) {
        global $wpdb;
        $table = platform_2424_public_listing_index_table();
        $page = max(1, absint($payload['page'] ?? 1));
        $per_page = min(50, max(1, absint($payload['perPage'] ?? 24)));
        $now = time(); $where = array('kind = %s', 'is_visible = 1', 'scheduled_at <= %d', 'expires_at >= %d', 'deadline_at >= %d'); $args = array($kind, $now, $now, $now);
        $id = absint($payload['id'] ?? 0);
        if ($id) { $where[] = 'listing_id = %d'; $args[] = $id; $page = 1; $per_page = 1; }
        $category = sanitize_text_field((string) ($payload['category'] ?? ''));
        if ($kind === 'classified' && $category !== '' && taxonomy_exists('classified_category')) {
            $category_variants = array_values(array_unique(array($category, esc_html($category))));
            $term_ids = array();
            foreach ($category_variants as $variant) {
                $terms = get_terms(array('taxonomy' => 'classified_category', 'name' => $variant, 'hide_empty' => false));
                if (!is_wp_error($terms)) {
                    foreach ($terms as $term) {
                        $term_ids[] = (int) $term->term_id;
                        $children = get_term_children($term->term_id, 'classified_category');
                        if (!is_wp_error($children)) { $term_ids = array_merge($term_ids, array_map('intval', $children)); }
                    }
                }
            }
            $term_ids = array_values(array_unique(array_filter($term_ids)));
            $category_placeholders = implode(',', array_fill(0, count($category_variants), '%s'));
            $category_match = "category_name IN ({$category_placeholders})";
            $args = array_merge($args, $category_variants);
            if ($term_ids) {
                $placeholders = implode(',', array_fill(0, count($term_ids), '%d'));
                $where[] = "({$category_match} OR EXISTS (SELECT 1 FROM {$wpdb->term_relationships} AS category_rel INNER JOIN {$wpdb->term_taxonomy} AS category_tax ON category_tax.term_taxonomy_id = category_rel.term_taxonomy_id WHERE category_rel.object_id = {$table}.listing_id AND category_tax.taxonomy = %s AND category_tax.term_id IN ({$placeholders})))";
                $args[] = 'classified_category';
                $args = array_merge($args, $term_ids);
            } else {
                $where[] = $category_match;
            }
        } elseif ($category !== '') {
            $where[] = 'category_name = %s'; $args[] = $category;
        }
        $map = array('type' => 'type_name', 'productTag' => 'product_tag_name', 'city' => 'city_name', 'area' => 'area_name', 'company' => 'company_name');
        foreach ($map as $input => $column) {
            $value = sanitize_text_field((string) ($payload[$input] ?? ''));
            if ($value !== '') { $where[] = "{$column} = %s"; $args[] = $value; }
        }
        $location = sanitize_text_field((string) ($payload['location'] ?? ''));
        if ($location !== '') { $where[] = '(city_name = %s OR area_name = %s)'; $args[] = $location; $args[] = $location; }
        $owner = absint($payload['ownerWpUserId'] ?? 0); if ($owner) { $where[] = 'author_id = %d'; $args[] = $owner; }
        $currency = strtoupper(sanitize_key((string) ($payload['currency'] ?? ''))); if ($currency !== '') { $where[] = 'currency = %s'; $args[] = $currency; }
        $price_min = preg_replace('/[^0-9.]/', '', (string) ($payload['priceMin'] ?? '')); if ($price_min !== '') { $where[] = 'price >= %f'; $args[] = (float) $price_min; }
        $price_max = preg_replace('/[^0-9.]/', '', (string) ($payload['priceMax'] ?? '')); if ($price_max !== '') { $where[] = 'price <= %f'; $args[] = (float) $price_max; }
        if (!empty($payload['featured'])) { $where[] = 'boost_expires_at >= %d'; $args[] = $now; }
        $search = sanitize_text_field((string) ($payload['search'] ?? ''));
        if ($search !== '') {
            $words = preg_split('/\s+/', $search); $terms = array(); $short_word = false;
            foreach ((array) $words as $word) {
                $word = preg_replace('/[^\p{L}\p{N}]/u', '', $word);
                if ($word === '') { continue; }
                if (function_exists('mb_strlen') ? mb_strlen($word) < 3 : strlen($word) < 3) { $short_word = true; }
                $terms[] = $word . '*';
            }
            if ($terms && !$short_word) { $where[] = 'MATCH(search_text) AGAINST (%s IN BOOLEAN MODE)'; $args[] = implode(' ', $terms); }
            elseif ($search !== '') { $where[] = 'search_text LIKE %s'; $args[] = '%' . $wpdb->esc_like($search) . '%'; }
        }
        $where_sql = implode(' AND ', $where);
        $count_sql = $wpdb->prepare("SELECT COUNT(*) FROM {$table} WHERE {$where_sql}", $args);
        $total = (int) $wpdb->get_var($count_sql);
        $offset = ($page - 1) * $per_page;
        $query_args = array_merge($args, array($per_page, $offset));
        $rows = $wpdb->get_col($wpdb->prepare("SELECT payload FROM {$table} WHERE {$where_sql} ORDER BY published_at DESC, listing_id DESC LIMIT %d OFFSET %d", $query_args));
        $items = array(); foreach ((array) $rows as $row) { $item = json_decode((string) $row, true); if (is_array($item)) { $items[] = $item; } }
        return array('items' => $items, 'pagination' => array('page' => $page, 'perPage' => $per_page, 'total' => $total, 'totalPages' => max(1, (int) ceil($total / $per_page))));
    }
}

if (!function_exists('platform_2424_public_listing_index_schedule_sync')) {
    function platform_2424_public_listing_index_schedule_sync($post_id, $post = null) {
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) { return; }
        $post = $post instanceof WP_Post ? $post : get_post($post_id);
        if (!platform_2424_public_listing_index_kind_for_post($post)) { return; }
        global $platform_2424_public_listing_index_pending;
        if (!is_array($platform_2424_public_listing_index_pending ?? null)) { $platform_2424_public_listing_index_pending = array(); }
        $platform_2424_public_listing_index_pending[absint($post_id)] = true;
        add_action('shutdown', 'platform_2424_public_listing_index_flush_pending', 95);
    }
    function platform_2424_public_listing_index_flush_pending() {
        global $platform_2424_public_listing_index_pending;
        $ids = array_keys(is_array($platform_2424_public_listing_index_pending ?? null) ? $platform_2424_public_listing_index_pending : array());
        $platform_2424_public_listing_index_pending = array();
        foreach ($ids as $id) { platform_2424_public_listing_index_sync_listing($id); }
        if ($ids && function_exists('next_revalidate_send_scope_payload')) { next_revalidate_send_scope_payload(array('classified', 'job', 'tender'), 'listing.index_updated'); }
    }
    function platform_2424_public_listing_index_schedule_meta_sync($meta_id, $post_id, $meta_key) {
        static $keys = array('featured_image_url','gallery_images','price','currency','company_name','website','condition','contact_phone','contact_phone_country','deadline','need_by','experience_years','details_pdf_url','details_pdf_name','boost_expires_at_ts','listing_expires_at_ts','scheduled_publish_at_ts','submission_source');
        if (in_array((string) $meta_key, $keys, true)) { platform_2424_public_listing_index_schedule_sync($post_id); }
    }
    function platform_2424_public_listing_index_delete($post_id, $role = 'active') {
        global $wpdb;
        $wpdb->delete(platform_2424_public_listing_index_table($role), array('listing_id' => absint($post_id)), array('%d'));
        if ($role === 'active' && platform_2424_public_listing_index_is_building()) { platform_2424_public_listing_index_delete($post_id, 'build'); }
    }
}
add_action('save_post', 'platform_2424_public_listing_index_schedule_sync', 110, 2);
add_action('transition_post_status', function ($new, $old, $post) { platform_2424_public_listing_index_schedule_sync($post->ID, $post); }, 110, 3);
add_action('set_object_terms', function ($post_id, $terms, $tt_ids, $taxonomy) { if (in_array($taxonomy, array('classified_category','classified_product_tag','listing_location','job_category','tender_category'), true)) { platform_2424_public_listing_index_schedule_sync($post_id); } }, 110, 4);
add_action('added_post_meta', 'platform_2424_public_listing_index_schedule_meta_sync', 110, 3);
add_action('updated_post_meta', 'platform_2424_public_listing_index_schedule_meta_sync', 110, 3);
add_action('deleted_post_meta', 'platform_2424_public_listing_index_schedule_meta_sync', 110, 3);
add_action('before_delete_post', 'platform_2424_public_listing_index_delete', 110);

if (!function_exists('platform_2424_public_listing_index_schedule_author_sync')) {
    function platform_2424_public_listing_index_schedule_author_sync($user_id, $cursor = 0) {
        $user_id = absint($user_id);
        if ($user_id <= 0 || get_user_meta($user_id, 'platform_2424_test_data', true) === '1') { return; }
        $args = array($user_id, max(0, absint($cursor)));
        if (function_exists('as_has_scheduled_action') && as_has_scheduled_action('platform_2424_public_listing_index_sync_author', $args, '2424-public-listing-index')) { return; }
        if (function_exists('as_schedule_single_action')) { as_schedule_single_action(time() + 1, 'platform_2424_public_listing_index_sync_author', $args, '2424-public-listing-index', false); return; }
        wp_schedule_single_event(time() + 1, 'platform_2424_public_listing_index_sync_author', $args);
    }
    function platform_2424_public_listing_index_sync_author($user_id, $cursor = 0) {
        global $wpdb;
        $ids = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_author = %d AND ID > %d AND post_type IN ('classified_ad','job_offer','tender_notice') ORDER BY ID ASC LIMIT 100", absint($user_id), absint($cursor)));
        foreach ((array) $ids as $post_id) { platform_2424_public_listing_index_sync_listing((int) $post_id); $cursor = (int) $post_id; }
        if ($ids) { platform_2424_public_listing_index_schedule_author_sync($user_id, $cursor); }
    }
    function platform_2424_public_listing_index_sync_author_meta($meta_id, $user_id, $meta_key) {
        if (in_array((string) $meta_key, array('profile_photo', 'company_logo'), true)) { platform_2424_public_listing_index_schedule_author_sync($user_id); }
    }
}
add_action('profile_update', function ($user_id) { platform_2424_public_listing_index_schedule_author_sync($user_id); }, 110);
add_action('added_user_meta', 'platform_2424_public_listing_index_sync_author_meta', 110, 3);
add_action('updated_user_meta', 'platform_2424_public_listing_index_sync_author_meta', 110, 3);
add_action('platform_2424_public_listing_index_sync_author', 'platform_2424_public_listing_index_sync_author', 10, 2);

if (!function_exists('platform_2424_public_listing_index_schedule_rebuild')) {
    function platform_2424_public_listing_index_schedule_rebuild($delay = 1) {
        if (function_exists('as_schedule_single_action')) { return as_schedule_single_action(time() + max(1, absint($delay)), 'platform_2424_public_listing_index_rebuild', array(), '2424-public-listing-index', false); }
        return wp_schedule_single_event(time() + max(1, absint($delay)), 'platform_2424_public_listing_index_rebuild');
    }
    function platform_2424_public_listing_index_start_rebuild() {
        global $wpdb;
        $wpdb->query('TRUNCATE TABLE ' . platform_2424_public_listing_index_quote_table(platform_2424_public_listing_index_table('build')));
        platform_2424_public_listing_index_save_state(array('status' => 'building', 'cursor' => 0, 'indexed' => 0, 'startedAt' => gmdate('c'), 'lastProgressAt' => gmdate('c'), 'error' => ''));
        platform_2424_public_listing_index_schedule_rebuild();
    }
    function platform_2424_public_listing_index_swap_tables() {
        global $wpdb;
        $active = platform_2424_public_listing_index_quote_table(platform_2424_public_listing_index_table());
        $build = platform_2424_public_listing_index_quote_table(platform_2424_public_listing_index_table('build'));
        $old = platform_2424_public_listing_index_quote_table(platform_2424_public_listing_index_table() . '_old');
        $wpdb->query("DROP TABLE IF EXISTS {$old}");
        return $wpdb->query("RENAME TABLE {$active} TO {$old}, {$build} TO {$active}, {$old} TO {$build}") !== false;
    }
    function platform_2424_public_listing_index_verify_build() {
        global $wpdb;
        $expected = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type IN ('classified_ad','job_offer','tender_notice') AND post_status NOT IN ('trash','auto-draft')");
        $actual = (int) $wpdb->get_var('SELECT COUNT(*) FROM ' . platform_2424_public_listing_index_quote_table(platform_2424_public_listing_index_table('build')));
        return $expected === $actual;
    }
    function platform_2424_public_listing_index_rebuild() {
        global $wpdb;
        $lock = 'platform_2424_public_listing_index_rebuild_lock';
        if (get_transient($lock)) { return; }
        set_transient($lock, '1', 5 * MINUTE_IN_SECONDS);
        try {
            $state = platform_2424_public_listing_index_state(); if (($state['status'] ?? '') !== 'building') { return; }
            $cursor = absint($state['cursor'] ?? 0); $posts = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE ID > %d AND post_type IN ('classified_ad','job_offer','tender_notice') ORDER BY ID ASC LIMIT 100", $cursor));
            if (!$posts) {
                if (!platform_2424_public_listing_index_verify_build() || !platform_2424_public_listing_index_swap_tables()) { throw new RuntimeException('La vérification ou la permutation de l’index a échoué.'); }
                $state['status'] = 'ready'; $state['completedAt'] = gmdate('c'); $state['lastProgressAt'] = gmdate('c'); platform_2424_public_listing_index_save_state($state);
                if (function_exists('next_revalidate_send_scope_payload')) { next_revalidate_send_scope_payload(array('classified','job','tender'), 'listing.index_rebuilt'); }
                return;
            }
            foreach ($posts as $post_id) { platform_2424_public_listing_index_sync_listing((int) $post_id, 'build'); $cursor = (int) $post_id; }
            $state['cursor'] = $cursor; $state['indexed'] = absint($state['indexed'] ?? 0) + count($posts); $state['lastProgressAt'] = gmdate('c'); platform_2424_public_listing_index_save_state($state);
            platform_2424_public_listing_index_schedule_rebuild();
        } catch (Throwable $error) {
            $state = platform_2424_public_listing_index_state();
            $state['status'] = 'failed'; $state['error'] = 'La reconstruction a échoué. Utilisez Reprendre après vérification des logs.'; $state['lastProgressAt'] = gmdate('c');
            platform_2424_public_listing_index_save_state($state);
            if (function_exists('platform_2424_log_event')) { platform_2424_log_event('error', 'listing-index', 'Reconstruction de l’index des listes échouée.', array('exception' => get_class($error))); }
        } finally {
            delete_transient($lock);
        }
    }
}
add_action('platform_2424_public_listing_index_rebuild', 'platform_2424_public_listing_index_rebuild');

if (!function_exists('platform_2424_public_listing_index_render_tab')) {
    function platform_2424_public_listing_index_status_payload() {
        global $wpdb;
        $state = platform_2424_public_listing_index_state();
        $counts = $wpdb->get_results('SELECT kind, COUNT(*) AS total FROM ' . platform_2424_public_listing_index_table() . ' GROUP BY kind', ARRAY_A);
        $labels = array(); foreach ((array) $counts as $count) { $labels[] = sanitize_key($count['kind']) . ': ' . number_format_i18n(absint($count['total'])); }
        $build_counts = $wpdb->get_results('SELECT kind, COUNT(*) AS total FROM ' . platform_2424_public_listing_index_table('build') . ' GROUP BY kind', ARRAY_A);
        $build_labels = array(); foreach ((array) $build_counts as $count) { $build_labels[] = sanitize_key($count['kind']) . ': ' . number_format_i18n(absint($count['total'])); }
        return array('status' => (string) ($state['status'] ?? 'non construit'), 'rebuild' => ($state['status'] ?? '') === 'building' ? 'En arrière-plan' : 'Inactive', 'indexed' => number_format_i18n(absint($state['indexed'] ?? 0)), 'counts' => $labels ? implode(' | ', $labels) : 'Aucun document', 'buildCounts' => $build_labels ? implode(' | ', $build_labels) : 'Aucun document', 'progress' => (string) ($state['lastProgressAt'] ?? 'Jamais'), 'verified' => (string) ($state['verifiedAt'] ?? 'Jamais'), 'error' => (string) ($state['error'] ?? 'Aucune'));
    }
    function platform_2424_public_listing_index_render_tab() {
        $state = platform_2424_public_listing_index_state(); $ready = platform_2424_public_listing_index_is_ready();
        $status = platform_2424_public_listing_index_status_payload();
        ?>
        <div class="platform-2424-card" id="platform-2424-listing-index" data-live="<?php echo ($state['status'] ?? '') === 'building' ? 'yes' : 'no'; ?>"><h3>Index SQL des listes publiques</h3>
        <p>Les annonces, offres et appels d’offres sont lus depuis une projection SQL indexée. Les reconstructions se préparent en arrière-plan sans interrompre les listes publiques.</p>
        <table class="widefat striped" style="max-width:760px"><tbody>
        <tr><th>État</th><td data-listing-index-status><?php echo esc_html($status['status']); ?></td></tr>
        <tr><th>Reconstruction</th><td data-listing-index-rebuild><?php echo esc_html($status['rebuild']); ?></td></tr>
        <tr><th>Documents indexés</th><td data-listing-index-indexed><?php echo esc_html($status['indexed']); ?></td></tr>
        <tr><th>Répartition</th><td data-listing-index-counts><?php echo esc_html($status['counts']); ?></td></tr>
        <tr><th>Préparation</th><td data-listing-index-build-counts><?php echo esc_html($status['buildCounts']); ?></td></tr>
        <tr><th>Dernière activité</th><td data-listing-index-progress><?php echo esc_html($status['progress']); ?></td></tr>
        <tr><th>Dernière vérification</th><td data-listing-index-verified><?php echo esc_html($status['verified']); ?></td></tr>
        <tr><th>Erreur</th><td data-listing-index-error><?php echo esc_html($status['error']); ?></td></tr></tbody></table>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-top:16px;display:inline-block"><input type="hidden" name="action" value="platform_2424_public_listing_index_rebuild" /><?php wp_nonce_field('platform_2424_public_listing_index'); ?><button class="button button-primary" <?php disabled(($state['status'] ?? '') === 'building'); ?>><?php echo $ready ? 'Reconstruire l’index' : 'Construire l’index'; ?></button></form>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin:16px 0 0 8px;display:inline-block"><input type="hidden" name="action" value="platform_2424_public_listing_index_resume" /><?php wp_nonce_field('platform_2424_public_listing_index'); ?><button class="button" <?php disabled(!in_array(($state['status'] ?? ''), array('building','failed'), true)); ?>>Reprendre</button></form>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin:16px 0 0 8px;display:inline-block"><input type="hidden" name="action" value="platform_2424_public_listing_index_verify" /><?php wp_nonce_field('platform_2424_public_listing_index'); ?><button class="button" <?php disabled(!$ready); ?>>Vérifier</button></form></div>
        <script>(function(){var card=document.getElementById('platform-2424-listing-index');if(!card||card.dataset.live!=='yes'){return;}var endpoint='<?php echo esc_url(admin_url('admin-ajax.php')); ?>',nonce='<?php echo esc_js(wp_create_nonce('platform_2424_public_listing_index_status')); ?>';function refresh(){fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},body:new URLSearchParams({action:'platform_2424_public_listing_index_status',nonce:nonce})}).then(function(r){return r.json();}).then(function(r){if(!r.success||!r.data){return;}Object.keys(r.data).forEach(function(key){var node=card.querySelector('[data-listing-index-'+key.replace(/[A-Z]/g,function(letter){return '-'+letter.toLowerCase();})+']');if(node){node.textContent=r.data[key];}});if(r.data.status==='building'){window.setTimeout(refresh,3000);}}).catch(function(){window.setTimeout(refresh,5000);});}refresh();}());</script>
        <?php do_action('platform_2424_after_public_listing_index_tab'); ?>
        <?php
    }
}
add_action('admin_post_platform_2424_public_listing_index_rebuild', function () { if (!current_user_can('manage_options')) { wp_die('Forbidden'); } check_admin_referer('platform_2424_public_listing_index'); platform_2424_public_listing_index_start_rebuild(); wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=listing-index')); exit; });
add_action('admin_post_platform_2424_public_listing_index_resume', function () { if (!current_user_can('manage_options')) { wp_die('Forbidden'); } check_admin_referer('platform_2424_public_listing_index'); $state = platform_2424_public_listing_index_state(); if (in_array(($state['status'] ?? ''), array('building','failed'), true)) { $state['status'] = 'building'; unset($state['maintenance']); $state['error'] = ''; $state['lastProgressAt'] = gmdate('c'); platform_2424_public_listing_index_save_state($state); platform_2424_public_listing_index_schedule_rebuild(); } wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=listing-index')); exit; });
add_action('admin_post_platform_2424_public_listing_index_verify', function () { if (!current_user_can('manage_options')) { wp_die('Forbidden'); } check_admin_referer('platform_2424_public_listing_index'); global $wpdb; $state = platform_2424_public_listing_index_state(); $state['verifiedAt'] = gmdate('c'); $state['verificationCounts'] = $wpdb->get_results('SELECT kind, COUNT(*) AS total FROM ' . platform_2424_public_listing_index_table() . ' GROUP BY kind', ARRAY_A); platform_2424_public_listing_index_save_state($state); wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=listing-index')); exit; });
add_action('wp_ajax_platform_2424_public_listing_index_status', function () { if (!current_user_can('manage_options') || !check_ajax_referer('platform_2424_public_listing_index_status', 'nonce', false)) { wp_send_json_error(array('error' => 'forbidden'), 403); } wp_send_json_success(platform_2424_public_listing_index_status_payload()); });
