<?php
/**
 * 2424 Platform Typesense module.
 * Typesense is private to the server: this module is its only client.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('PLATFORM_2424_TYPESENSE_STATE_OPTION')) {
    define('PLATFORM_2424_TYPESENSE_STATE_OPTION', 'platform_2424_typesense_state');
}

if (!defined('PLATFORM_2424_TYPESENSE_DIRECTORY_SCHEMA_VERSION')) {
    define('PLATFORM_2424_TYPESENSE_DIRECTORY_SCHEMA_VERSION', 3);
}

if (!function_exists('platform_2424_typesense_config')) {
    function platform_2424_typesense_config() {
        return array(
            'enabled' => (string) get_option('platform_2424_typesense_enabled', 'no') === 'yes',
            'host' => trim((string) get_option('platform_2424_typesense_host', '127.0.0.1')),
            'port' => absint(get_option('platform_2424_typesense_port', 8108)),
            'protocol' => (string) get_option('platform_2424_typesense_protocol', 'http') === 'https' ? 'https' : 'http',
            'apiKey' => trim((string) get_option('platform_2424_typesense_api_key', '')),
        );
    }
}

if (!function_exists('platform_2424_typesense_ready')) {
    function platform_2424_typesense_ready() {
        $config = platform_2424_typesense_config();
        return !empty($config['enabled']) && $config['host'] !== '' && !empty($config['port']) && $config['apiKey'] !== '';
    }
}

if (!function_exists('platform_2424_typesense_base_url')) {
    function platform_2424_typesense_base_url() {
        $config = platform_2424_typesense_config();
        return $config['protocol'] . '://' . $config['host'] . ':' . $config['port'];
    }
}

if (!function_exists('platform_2424_typesense_set_state')) {
    function platform_2424_typesense_set_state($updates) {
        $state = get_option(PLATFORM_2424_TYPESENSE_STATE_OPTION, array());
        if (!is_array($state)) {
            $state = array();
        }
        foreach ((array) $updates as $key => $value) {
            $state[$key] = $value;
        }
        update_option(PLATFORM_2424_TYPESENSE_STATE_OPTION, $state, false);
        return $state;
    }
}

if (!function_exists('platform_2424_typesense_request')) {
    function platform_2424_typesense_request($method, $path, $body = null, $timeout = 10) {
        if (!platform_2424_typesense_ready()) {
            return new WP_Error('platform_typesense_not_configured', 'La recherche instantanée n est pas configurée.');
        }

        $url = platform_2424_typesense_base_url() . '/' . ltrim((string) $path, '/');
        $args = array(
            'method' => strtoupper((string) $method),
            'timeout' => max(1, absint($timeout)),
            'headers' => array(
                'X-TYPESENSE-API-KEY' => platform_2424_typesense_config()['apiKey'],
                'Content-Type' => 'application/json',
            ),
        );
        if ($body !== null) {
            $args['body'] = wp_json_encode($body);
        }

        $response = wp_remote_request($url, $args);
        if (is_wp_error($response)) {
            // Keep the transport detail for administrators without exposing credentials.
            $detail = sanitize_text_field((string) $response->get_error_message());
            $message = 'Connexion Typesense impossible' . ($detail !== '' ? ' : ' . $detail : '.') ;
            platform_2424_typesense_set_state(array('lastError' => $message, 'lastErrorAt' => gmdate('c')));
            error_log('[2424 Typesense] ' . $message);
            return new WP_Error('platform_typesense_unavailable', 'La recherche instantanée est temporairement indisponible.', array('technical_message' => $message));
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $raw = (string) wp_remote_retrieve_body($response);
        $decoded = json_decode($raw, true);
        if ($status < 200 || $status >= 300) {
            $message = is_array($decoded) ? sanitize_text_field((string) ($decoded['message'] ?? 'Erreur Typesense.')) : 'Erreur Typesense.';
            platform_2424_typesense_set_state(array('lastError' => $message, 'lastErrorAt' => gmdate('c')));
            return new WP_Error('platform_typesense_request_failed', 'La recherche instantanée est temporairement indisponible.', array('status' => $status, 'technical_message' => $message));
        }

        return is_array($decoded) ? $decoded : array();
    }
}

if (!function_exists('platform_2424_typesense_collections')) {
    function platform_2424_typesense_collections() {
        return array(
            'article' => 'articles',
            'classified' => 'classifieds',
            'job' => 'jobs',
            'tender' => 'tenders',
        );
    }
}

if (!function_exists('platform_2424_typesense_collection_schema')) {
    function platform_2424_typesense_collection_schema($name) {
        return array(
            'name' => $name,
            'fields' => array(
                array('name' => 'title', 'type' => 'string'),
                array('name' => 'description', 'type' => 'string', 'optional' => true),
                array('name' => 'category', 'type' => 'string', 'optional' => true, 'facet' => true),
                array('name' => 'city', 'type' => 'string', 'optional' => true),
                array('name' => 'area', 'type' => 'string', 'optional' => true),
                // Directory filters are evaluated by Typesense, never in the browser.
                array('name' => 'regions', 'type' => 'string[]', 'optional' => true, 'facet' => true),
                array('name' => 'cities', 'type' => 'string[]', 'optional' => true, 'facet' => true),
                array('name' => 'featured', 'type' => 'bool', 'optional' => true, 'facet' => true),
                array('name' => 'companyName', 'type' => 'string', 'optional' => true),
                array('name' => 'publisherName', 'type' => 'string', 'optional' => true),
                // Typesense requires non-indexed fields to be optional.
                array('name' => 'payload', 'type' => 'string', 'optional' => true, 'index' => false),
                array('name' => 'updatedAt', 'type' => 'int64'),
                array('name' => 'visibleUntil', 'type' => 'int64'),
            ),
            'default_sorting_field' => 'updatedAt',
        );
    }
}

if (!function_exists('platform_2424_typesense_directory_schema_migration_fields')) {
    /**
     * Build only the schema operations that the current collection still needs.
     *
     * A failed migration can leave one or more directory fields in Typesense.
     * Re-adding those fields makes every subsequent profile sync fail, so inspect
     * the live schema before requesting a destructive drop + add operation.
     */
    function platform_2424_typesense_directory_schema_migration_fields($existing_fields) {
        $existing_by_name = array();
        foreach ((array) $existing_fields as $field) {
            if (is_array($field) && !empty($field['name'])) {
                $existing_by_name[(string) $field['name']] = $field;
            }
        }

        $required_fields = array(
            'category' => array('name' => 'category', 'type' => 'string', 'optional' => true, 'facet' => true),
            'regions' => array('name' => 'regions', 'type' => 'string[]', 'optional' => true, 'facet' => true),
            'cities' => array('name' => 'cities', 'type' => 'string[]', 'optional' => true, 'facet' => true),
            'featured' => array('name' => 'featured', 'type' => 'bool', 'optional' => true, 'facet' => true),
        );
        $operations = array();

        foreach ($required_fields as $name => $definition) {
            $current = $existing_by_name[$name] ?? null;
            if ($current === null) {
                $operations[] = $definition;
                continue;
            }

            $needs_replacement = (string) ($current['type'] ?? '') !== $definition['type']
                || !empty($current['optional']) !== !empty($definition['optional'])
                || !empty($current['facet']) !== !empty($definition['facet']);
            if (!$needs_replacement) {
                continue;
            }

            $operations[] = array('name' => $name, 'drop' => true);
            $operations[] = $definition;
        }

        return $operations;
    }
}

if (!function_exists('platform_2424_typesense_ensure_collection')) {
    function platform_2424_typesense_ensure_collection($collection) {
        $existing = platform_2424_typesense_request('GET', 'collections/' . rawurlencode($collection), null, 5);
        if (!is_wp_error($existing)) {
            // Existing installations predate the directory facets. Typesense can
            // update the collection schema in place; documents are refreshed by
            // the normal reindex job and by each profile update afterwards.
            if ($collection === 'directory' && absint(get_option('platform_2424_typesense_directory_schema_version', 0)) < PLATFORM_2424_TYPESENSE_DIRECTORY_SCHEMA_VERSION) {
                $fields = platform_2424_typesense_directory_schema_migration_fields($existing['fields'] ?? array());
                if (!empty($fields)) {
                    $migration = platform_2424_typesense_request('PATCH', 'collections/' . rawurlencode($collection), array(
                        'fields' => $fields,
                    ), 120);
                    if (is_wp_error($migration)) {
                        return $migration;
                    }
                }
                update_option('platform_2424_typesense_directory_schema_version', PLATFORM_2424_TYPESENSE_DIRECTORY_SCHEMA_VERSION, false);
            }
            return true;
        }
        $error_data = $existing->get_error_data();
        if (!is_array($error_data) || absint($error_data['status'] ?? 0) !== 404) {
            return $existing;
        }
        $created = platform_2424_typesense_request('POST', 'collections', platform_2424_typesense_collection_schema($collection), 10);
        if (!is_wp_error($created) && $collection === 'directory') {
            update_option('platform_2424_typesense_directory_schema_version', PLATFORM_2424_TYPESENSE_DIRECTORY_SCHEMA_VERSION, false);
        }
        return is_wp_error($created) ? $created : true;
    }
}

if (!function_exists('platform_2424_typesense_upsert')) {
    function platform_2424_typesense_upsert($kind, $document_id, $item) {
        $collections = platform_2424_typesense_collections();
        if (!isset($collections[$kind])) {
            return new WP_Error('platform_typesense_kind_invalid', 'Type de document invalide.');
        }
        $collection = $collections[$kind];
        $ready = platform_2424_typesense_ensure_collection($collection);
        if (is_wp_error($ready)) {
            return $ready;
        }
        $payload = is_array($item) ? $item : array();
        $visible_until = 4102444800;
        foreach (array($payload['expiresAt'] ?? '', $payload['deadline'] ?? '') as $candidate) {
            $timestamp = strtotime((string) $candidate);
            if ($timestamp !== false && $timestamp > 0) {
                $visible_until = min($visible_until, $timestamp);
            }
        }
        $document = array(
            'id' => (string) $document_id,
            'title' => wp_strip_all_tags((string) ($payload['title'] ?? '')),
            'description' => wp_strip_all_tags((string) ($payload['description'] ?? $payload['excerpt'] ?? '')),
            'category' => wp_strip_all_tags((string) ($payload['category'] ?? $payload['categoryLabel'] ?? '')),
            'city' => wp_strip_all_tags((string) ($payload['city'] ?? '')),
            'area' => wp_strip_all_tags((string) ($payload['area'] ?? '')),
            'companyName' => wp_strip_all_tags((string) ($payload['companyName'] ?? '')),
            'publisherName' => wp_strip_all_tags((string) ($payload['publisherName'] ?? '')),
            'regions' => array_values(array_filter(array_map('wp_strip_all_tags', (array) ($payload['regions'] ?? array())))),
            'cities' => array_values(array_filter(array_map('wp_strip_all_tags', (array) ($payload['cities'] ?? array())))),
            'featured' => !empty($payload['featured']),
            'payload' => wp_json_encode($payload),
            'updatedAt' => time(),
            'visibleUntil' => $visible_until,
        );
        return platform_2424_typesense_request('POST', 'collections/' . rawurlencode($collection) . '/documents?action=upsert', $document, 10);
    }
}

if (!function_exists('platform_2424_typesense_delete')) {
    function platform_2424_typesense_delete($kind, $document_id) {
        $collections = platform_2424_typesense_collections();
        if (!isset($collections[$kind]) || !platform_2424_typesense_ready()) {
            return true;
        }
        $result = platform_2424_typesense_request('DELETE', 'collections/' . rawurlencode($collections[$kind]) . '/documents/' . rawurlencode((string) $document_id), null, 10);
        if (is_wp_error($result) && absint(($result->get_error_data()['status'] ?? 0)) !== 404) {
            return $result;
        }
        // A document can be removed before its first indexation. Typesense returns 404 in that normal case.
        if (is_wp_error($result)) {
            platform_2424_typesense_set_state(array('lastError' => ''));
        }
        return true;
    }
}

if (!function_exists('platform_2424_typesense_listing_document_id')) {
    function platform_2424_typesense_listing_document_id($kind, $post_id) {
        return $kind . '-post-' . absint($post_id);
    }
}

if (!function_exists('platform_2424_typesense_listing_item')) {
    function platform_2424_typesense_listing_item($kind, $post_id) {
        $post_id = absint($post_id);
        $post = get_post($post_id);
        if (!$post instanceof WP_Post || $post->post_status !== 'publish' || get_post_meta($post_id, 'platform_2424_test_data', true) === '1') {
            return null;
        }
        $result = platform_submissions_get_public_items($kind, array('id' => $post_id, 'page' => 1, 'perPage' => 1));
        if (is_wp_error($result) || empty($result['items'][0])) {
            return null;
        }
        return $result['items'][0];
    }
}

if (!function_exists('platform_2424_typesense_sync_listing')) {
    function platform_2424_typesense_sync_listing($post_id) {
        $post = get_post(absint($post_id));
        if (!$post instanceof WP_Post) {
            return true;
        }
        $kind_map = array('classified_ad' => 'classified', 'job_offer' => 'job', 'tender_notice' => 'tender');
        if (!isset($kind_map[$post->post_type])) {
            return true;
        }
        $kind = $kind_map[$post->post_type];
        $document_id = platform_2424_typesense_listing_document_id($kind, $post->ID);
        $item = platform_2424_typesense_listing_item($kind, $post->ID);
        if ($item === null) {
            return platform_2424_typesense_delete($kind, $document_id);
        }
        return platform_2424_typesense_upsert($kind, $document_id, $item);
    }
}

if (!function_exists('platform_2424_typesense_schedule')) {
    function platform_2424_typesense_schedule($hook, $args = array(), $delay = 1, $force = false) {
        if (!platform_2424_typesense_ready()) {
            return false;
        }
        $group = '2424-typesense';
        if (function_exists('as_schedule_single_action')) {
            if (!$force && function_exists('as_has_scheduled_action') && as_has_scheduled_action($hook, $args, $group)) {
                return false;
            }
            return as_schedule_single_action(time() + max(1, absint($delay)), $hook, $args, $group, false);
        }
        if (!$force && wp_next_scheduled($hook, $args)) {
            return false;
        }
        return wp_schedule_single_event(time() + max(1, absint($delay)), $hook, $args);
    }
}

if (!function_exists('platform_2424_typesense_schedule_listing')) {
    function platform_2424_typesense_schedule_listing($post_id, $post = null) {
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
            return;
        }
        $post = $post instanceof WP_Post ? $post : get_post($post_id);
        if (!$post instanceof WP_Post || !in_array($post->post_type, array('classified_ad', 'job_offer', 'tender_notice'), true)) {
            return;
        }
        /*
         * wp_insert_post() fires save_post before meta_input and subsequent
         * update_post_meta() calls complete. Queue at shutdown so stress
         * fixtures are already marked and cannot create one scheduler action
         * per generated record.
         */
        global $platform_2424_typesense_pending_listing_syncs;
        if (!is_array($platform_2424_typesense_pending_listing_syncs ?? null)) {
            $platform_2424_typesense_pending_listing_syncs = array();
        }
        $platform_2424_typesense_pending_listing_syncs[absint($post_id)] = true;
        add_action('shutdown', 'platform_2424_typesense_flush_listing_schedule', 90);
    }
}

add_action('save_post', 'platform_2424_typesense_schedule_listing', 90, 2);

if (!function_exists('platform_2424_typesense_flush_listing_schedule')) {
    function platform_2424_typesense_flush_listing_schedule() {
        global $platform_2424_typesense_pending_listing_syncs;
        $post_ids = array_keys(is_array($platform_2424_typesense_pending_listing_syncs ?? null) ? $platform_2424_typesense_pending_listing_syncs : array());
        $platform_2424_typesense_pending_listing_syncs = array();

        foreach ($post_ids as $post_id) {
            if (get_post_meta($post_id, 'platform_2424_stress_mass', true) === '1') {
                continue;
            }
            platform_2424_typesense_schedule('platform_2424_typesense_sync_listing', array(absint($post_id)));
        }
    }
}

add_action('platform_2424_typesense_sync_listing', 'platform_2424_typesense_sync_listing');
add_action('before_delete_post', function ($post_id) {
    $post = get_post($post_id);
    if (!$post instanceof WP_Post) {
        return;
    }
    if (get_post_meta($post_id, 'platform_2424_stress_mass', true) === '1') {
        return;
    }
    $kind_map = array('classified_ad' => 'classified', 'job_offer' => 'job', 'tender_notice' => 'tender');
    if (isset($kind_map[$post->post_type])) {
        platform_2424_typesense_delete($kind_map[$post->post_type], platform_2424_typesense_listing_document_id($kind_map[$post->post_type], $post_id));
    }
}, 90);

if (!function_exists('platform_2424_typesense_editorial_source_url')) {
    function platform_2424_typesense_editorial_source_url() {
        if (function_exists('platform_2424_get_editorial_source_graphql_url')) {
            return trim((string) platform_2424_get_editorial_source_graphql_url());
        }

        return trim((string) get_option('platform_2424_editorial_source_graphql_url', ''));
    }
}

if (!function_exists('platform_2424_typesense_editorial_source_is_local')) {
    function platform_2424_typesense_editorial_source_is_local() {
        $source = wp_parse_url(platform_2424_typesense_editorial_source_url());
        $local = wp_parse_url(home_url('/graphql'));
        if (!is_array($source) || !is_array($local)) {
            return false;
        }

        $source_host = strtolower((string) ($source['host'] ?? ''));
        $local_host = strtolower((string) ($local['host'] ?? ''));
        $source_path = untrailingslashit((string) ($source['path'] ?? ''));
        $local_path = untrailingslashit((string) ($local['path'] ?? ''));
        $source_port = absint($source['port'] ?? 0);
        $local_port = absint($local['port'] ?? 0);

        return $source_host !== '' && $source_host === $local_host && $source_path === $local_path && $source_port === $local_port;
    }
}

if (!function_exists('platform_2424_typesense_article_item')) {
    function platform_2424_typesense_article_item($post_id) {
        $post = get_post(absint($post_id));
        if (!$post instanceof WP_Post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
            return null;
        }

        $terms = get_the_terms($post->ID, 'category');
        $category = !is_wp_error($terms) && !empty($terms[0]->name) ? sanitize_text_field((string) $terms[0]->name) : '';

        return array(
            'id' => $post->ID,
            'title' => wp_strip_all_tags((string) get_the_title($post)),
            'excerpt' => wp_strip_all_tags((string) get_the_excerpt($post)),
            'description' => wp_strip_all_tags((string) get_the_excerpt($post)),
            'category' => $category,
            'categoryLabel' => $category,
            'slug' => sanitize_title((string) $post->post_name),
            'source' => 'post',
            'publishedAt' => get_post_time('c', true, $post),
            'imageUrl' => esc_url_raw((string) get_the_post_thumbnail_url($post, 'full')),
        );
    }
}

if (!function_exists('platform_2424_typesense_sync_article')) {
    function platform_2424_typesense_sync_article($post_id) {
        if (!platform_2424_typesense_ready() || !platform_2424_typesense_editorial_source_is_local()) {
            return false;
        }

        $collection = platform_2424_typesense_collections()['article'];
        $ready = platform_2424_typesense_ensure_collection($collection);
        if (is_wp_error($ready)) {
            return $ready;
        }

        $post_id = absint($post_id);
        $item = platform_2424_typesense_article_item($post_id);
        if ($item === null) {
            return platform_2424_typesense_delete('article', 'article-' . $post_id);
        }

        return platform_2424_typesense_upsert('article', 'article-' . $post_id, $item);
    }
}

if (!function_exists('platform_2424_typesense_sync_local_articles')) {
    function platform_2424_typesense_sync_local_articles() {
        global $wpdb;

        $last_id = 0;
        do {
            // Use an ID cursor rather than OFFSET so a manual rebuild remains
            // bounded even when the editorial catalogue is large.
            $post_ids = $wpdb->get_col($wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status = 'publish' AND ID > %d ORDER BY ID ASC LIMIT 100",
                $last_id
            ));

            foreach ((array) $post_ids as $post_id) {
                $post_id = absint($post_id);
                $last_id = $post_id;
                $item = platform_2424_typesense_article_item($post_id);
                if ($item === null) {
                    continue;
                }

                $indexed = platform_2424_typesense_upsert('article', 'article-' . $post_id, $item);
                if (is_wp_error($indexed)) {
                    return $indexed;
                }
            }
        } while (!empty($post_ids));

        return true;
    }
}

if (!function_exists('platform_2424_typesense_schedule_article')) {
    function platform_2424_typesense_schedule_article($post_id) {
        $post = get_post(absint($post_id));
        if (!$post instanceof WP_Post || $post->post_type !== 'post' || wp_is_post_revision($post_id) || wp_is_post_autosave($post_id) || !platform_2424_typesense_editorial_source_is_local()) {
            return;
        }

        platform_2424_typesense_schedule('platform_2424_typesense_sync_article', array(absint($post_id)));
    }
}

add_action('save_post_post', 'platform_2424_typesense_schedule_article', 90, 1);
add_action('platform_2424_typesense_sync_article', 'platform_2424_typesense_sync_article');
add_action('before_delete_post', function ($post_id) {
    $post = get_post($post_id);
    if ($post instanceof WP_Post && $post->post_type === 'post' && platform_2424_typesense_editorial_source_is_local()) {
        platform_2424_typesense_delete('article', 'article-' . absint($post_id));
    }
}, 90);
add_action('updated_post_meta', function ($meta_id, $post_id, $meta_key) {
    if ($meta_key === '_thumbnail_id') {
        platform_2424_typesense_schedule_article($post_id);
    }
}, 90, 3);

if (!function_exists('platform_2424_typesense_sync_articles')) {
    function platform_2424_typesense_sync_articles() {
        if (!platform_2424_typesense_ready()) {
            return;
        }
        $collection = platform_2424_typesense_collections()['article'];
        $ready = platform_2424_typesense_ensure_collection($collection);
        if (is_wp_error($ready)) {
            return $ready;
        }
        $cleared = platform_2424_typesense_request('DELETE', 'collections/' . rawurlencode($collection) . '/documents?filter_by=id:%3D%2A', null, 30);
        if (is_wp_error($cleared)) {
            return $cleared;
        }
        if (platform_2424_typesense_editorial_source_is_local()) {
            $result = platform_2424_typesense_sync_local_articles();
            if (is_wp_error($result)) {
                platform_2424_typesense_set_state(array('lastError' => 'Synchronisation locale des actualités impossible.', 'lastErrorAt' => gmdate('c')));
                return $result;
            }
            platform_2424_typesense_set_state(array('lastArticleSyncAt' => gmdate('c'), 'lastError' => ''));
            return true;
        }

        $endpoint = platform_2424_typesense_editorial_source_url();
        if ($endpoint === '') {
            return new WP_Error('platform_typesense_editorial_source_missing', 'La source des actualités est absente.');
        }
        $after = null;
        do {
            $query = 'query TypesenseArticles($first: Int!, $after: String) { posts(first: $first, after: $after) { nodes { id databaseId slug title excerpt date categories { nodes { name } } featuredImage { node { sourceUrl } } } pageInfo { hasNextPage endCursor } } }';
            $response = wp_remote_post($endpoint, array('timeout' => 30, 'headers' => array('Content-Type' => 'application/json'), 'body' => wp_json_encode(array('query' => $query, 'variables' => array('first' => 100, 'after' => $after)))));
            if (is_wp_error($response) || (int) wp_remote_retrieve_response_code($response) >= 300) {
                platform_2424_typesense_set_state(array('lastError' => 'Synchronisation des actualités impossible.', 'lastErrorAt' => gmdate('c')));
                return new WP_Error('platform_typesense_editorial_sync_failed', 'Synchronisation des actualités impossible.');
            }
            $data = json_decode((string) wp_remote_retrieve_body($response), true);
            $connection = is_array($data) ? ($data['data']['posts'] ?? array()) : array();
            $nodes = is_array($connection['nodes'] ?? null) ? $connection['nodes'] : array();
            foreach ($nodes as $node) {
                $article_id = absint($node['databaseId'] ?? 0);
                $slug = sanitize_title((string) ($node['slug'] ?? ''));
                if ($article_id <= 0 && $slug === '') {
                    continue;
                }
                $categories = is_array($node['categories']['nodes'] ?? null) ? $node['categories']['nodes'] : array();
                $category = !empty($categories[0]['name']) ? sanitize_text_field((string) $categories[0]['name']) : '';
                $item = array(
                    'id' => $article_id > 0 ? $article_id : $slug,
                    'title' => wp_strip_all_tags((string) ($node['title'] ?? '')),
                    'excerpt' => wp_strip_all_tags((string) ($node['excerpt'] ?? '')),
                    'description' => wp_strip_all_tags((string) ($node['excerpt'] ?? '')),
                    'category' => $category,
                    'categoryLabel' => $category,
                    'slug' => $slug,
                    'source' => 'post',
                    'publishedAt' => sanitize_text_field((string) ($node['date'] ?? '')),
                    'imageUrl' => esc_url_raw((string) ($node['featuredImage']['node']['sourceUrl'] ?? '')),
                );
                $indexed = platform_2424_typesense_upsert('article', 'article-' . ($article_id > 0 ? $article_id : $slug), $item);
                if (is_wp_error($indexed)) {
                    return $indexed;
                }
            }
            $page_info = is_array($connection['pageInfo'] ?? null) ? $connection['pageInfo'] : array();
            $after = !empty($page_info['hasNextPage']) ? (string) ($page_info['endCursor'] ?? '') : '';
        } while ($after !== '');
        platform_2424_typesense_set_state(array('lastArticleSyncAt' => gmdate('c'), 'lastError' => ''));
        return true;
    }
}

if (!function_exists('platform_2424_typesense_schedule_article_sync')) {
    function platform_2424_typesense_schedule_article_sync() {
        // A local source is updated per post. A full HTTP GraphQL rebuild every
        // five minutes would call this WordPress instance through Nginx.
        if (platform_2424_typesense_editorial_source_is_local()) {
            return;
        }

        platform_2424_typesense_schedule('platform_2424_typesense_sync_articles', array(), 300);
    }
}

add_action('init', 'platform_2424_typesense_schedule_article_sync', 90);
add_action('platform_2424_typesense_sync_articles', function () {
    // Existing scheduled actions from before the local-source guard are safe
    // to execute once: do not let them recreate another recurring chain.
    if (platform_2424_typesense_editorial_source_is_local()) {
        return;
    }

    platform_2424_typesense_sync_articles();
    platform_2424_typesense_schedule('platform_2424_typesense_sync_articles', array(), 300, true);
});

if (!function_exists('platform_2424_typesense_start_reindex')) {
    function platform_2424_typesense_start_reindex($clear = false) {
        if (!platform_2424_typesense_ready()) {
            return new WP_Error('platform_typesense_not_configured', 'Configurez Typesense avant de lancer une indexation.');
        }
        if ($clear) {
            foreach (platform_2424_typesense_collections() as $collection) {
                platform_2424_typesense_request('DELETE', 'collections/' . rawurlencode($collection), null, 30);
            }
        }
        platform_2424_typesense_set_state(array('status' => 'indexing', 'stage' => 'classified', 'offset' => 0, 'indexed' => 0, 'startedAt' => gmdate('c'), 'lastError' => ''));
        platform_2424_typesense_schedule('platform_2424_typesense_reindex_batch', array(), 1);
        return true;
    }
}

if (!function_exists('platform_2424_typesense_reindex_batch')) {
    function platform_2424_typesense_reindex_batch() {
        $state = get_option(PLATFORM_2424_TYPESENSE_STATE_OPTION, array());
        if (!is_array($state) || ($state['status'] ?? '') !== 'indexing') {
            return;
        }
        $stages = array('classified' => 'classified_ad', 'job' => 'job_offer', 'tender' => 'tender_notice');
        $stage = (string) ($state['stage'] ?? 'classified');
        $offset = absint($state['offset'] ?? 0);
        $processed = 0;
        $error = null;
        if (isset($stages[$stage])) {
            $posts = get_posts(array('post_type' => $stages[$stage], 'post_status' => 'publish', 'posts_per_page' => 25, 'offset' => $offset, 'orderby' => 'ID', 'order' => 'ASC'));
            foreach ($posts as $post) {
                $result = platform_2424_typesense_sync_listing($post->ID);
                if (is_wp_error($result)) {
                    $error = $result;
                    break;
                }
                $processed++;
            }
            $state['indexed'] = absint($state['indexed'] ?? 0) + $processed;
            if ($error instanceof WP_Error) {
                // Keep the same offset so a restart resumes at the failed document.
                $state['status'] = 'error';
                $state['lastError'] = sanitize_text_field((string) ($error->get_error_data()['technical_message'] ?? $error->get_error_message()));
                $state['lastErrorAt'] = gmdate('c');
            } elseif (count($posts) === 25) {
                $state['offset'] = $offset + 25;
            } else {
                $keys = array_keys($stages);
                $next = array_search($stage, $keys, true) + 1;
                $state['stage'] = isset($keys[$next]) ? $keys[$next] : 'articles';
                $state['offset'] = 0;
            }
        } else {
            $result = platform_2424_typesense_sync_articles();
            if (is_wp_error($result)) {
                $state['status'] = 'error';
                $state['lastError'] = sanitize_text_field((string) ($result->get_error_data()['technical_message'] ?? $result->get_error_message()));
                $state['lastErrorAt'] = gmdate('c');
            } else {
                $state['status'] = 'ready';
                $state['stage'] = 'completed';
                $state['completedAt'] = gmdate('c');
                $state['lastError'] = '';
            }
        }
        platform_2424_typesense_set_state($state);
        if (($state['status'] ?? '') === 'indexing') {
            platform_2424_typesense_schedule('platform_2424_typesense_reindex_batch', array(), 1, true);
        }
    }
}

add_action('platform_2424_typesense_reindex_batch', 'platform_2424_typesense_reindex_batch');

if (!function_exists('platform_2424_typesense_search')) {
    function platform_2424_typesense_search($query) {
        $query = sanitize_text_field((string) $query);
        $query_length = function_exists('mb_strlen') ? mb_strlen($query) : strlen($query);
        if ($query_length < 2) {
            return array('groups' => array('article' => array(), 'classified' => array(), 'job' => array(), 'tender' => array(), 'directory' => array()));
        }
        $searches = array();
        foreach (platform_2424_typesense_collections() as $kind => $collection) {
            $searches[] = array('collection' => $collection, 'q' => $query, 'query_by' => 'title,description,category,city,area,companyName,publisherName', 'per_page' => 100, 'sort_by' => 'updatedAt:desc', 'filter_by' => 'visibleUntil:>' . time());
        }
        $result = platform_2424_typesense_request('POST', 'multi_search', array('searches' => $searches), 10);
        if (is_wp_error($result)) {
            return $result;
        }
        $groups = array('article' => array(), 'classified' => array(), 'job' => array(), 'tender' => array(), 'directory' => array());
        $kinds = array_keys(platform_2424_typesense_collections());
        foreach ((array) ($result['results'] ?? array()) as $index => $search_result) {
            $kind = $kinds[$index] ?? '';
            if (!isset($groups[$kind])) {
                continue;
            }
            foreach ((array) ($search_result['hits'] ?? array()) as $hit) {
                $payload = json_decode((string) ($hit['document']['payload'] ?? ''), true);
                if (is_array($payload)) {
                    $groups[$kind][] = $payload;
                }
            }
        }
        if (function_exists('platform_2424_directory_index_search') && platform_2424_directory_index_is_ready()) {
            $directory = platform_2424_directory_index_search($query, 50);
            $groups['directory'] = is_array($directory['items'] ?? null) ? $directory['items'] : array();
        }
        return array('groups' => $groups);
    }
}

if (!function_exists('platform_2424_typesense_directory_filter_values')) {
    function platform_2424_typesense_directory_filter_values($value) {
        $values = is_array($value) ? $value : array($value);
        $clean = array();
        foreach ($values as $item) {
            $item = sanitize_text_field((string) $item);
            if ($item !== '') {
                // Backticks delimit exact Typesense filter values. Escape them
                // instead of concatenating untrusted filter syntax.
                $clean[] = '`' . str_replace('`', '\\`', $item) . '`';
            }
        }
        return array_values(array_unique($clean));
    }
}

if (!function_exists('platform_2424_typesense_directory_query')) {
    function platform_2424_typesense_directory_query($payload) {
        if (!platform_2424_typesense_ready()) {
            return new WP_Error('platform_typesense_not_configured', 'La recherche instantanée n est pas configurée.');
        }

        $payload = is_array($payload) ? $payload : array();
        $ready = platform_2424_typesense_ensure_collection('directory');
        if (is_wp_error($ready)) {
            return $ready;
        }
        $page = max(1, absint($payload['page'] ?? 1));
        $per_page = min(24, max(1, absint($payload['perPage'] ?? 12)));
        $query = sanitize_text_field((string) ($payload['search'] ?? ''));
        $filters = array('visibleUntil:>' . time());

        $category = platform_2424_typesense_directory_filter_values($payload['category'] ?? '');
        if (!empty($category)) {
            $filters[] = 'category:=[' . implode(',', $category) . ']';
        }
        $regions = platform_2424_typesense_directory_filter_values($payload['regions'] ?? array());
        if (!empty($regions)) {
            $filters[] = 'regions:=[' . implode(',', $regions) . ']';
        }
        $cities = platform_2424_typesense_directory_filter_values($payload['cities'] ?? array());
        if (!empty($cities)) {
            $filters[] = 'cities:=[' . implode(',', $cities) . ']';
        }

        $params = array(
            'q' => $query !== '' ? $query : '*',
            'query_by' => 'title,description,category,city,area,companyName,publisherName',
            'filter_by' => implode(' && ', $filters),
            'page' => $page,
            'per_page' => $per_page,
            'sort_by' => 'updatedAt:desc',
            'facet_by' => 'category,regions,cities',
            'max_facet_values' => 250,
        );
        $path = 'collections/directory/documents/search?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        $result = platform_2424_typesense_request('GET', $path, null, 10);
        if (is_wp_error($result)) {
            return $result;
        }

        $items = array();
        foreach ((array) ($result['hits'] ?? array()) as $hit) {
            $item = json_decode((string) ($hit['document']['payload'] ?? ''), true);
            if (is_array($item)) {
                $items[] = $item;
            }
        }
        $facets = array('categories' => array(), 'regions' => array(), 'cities' => array());
        foreach ((array) ($result['facet_counts'] ?? array()) as $facet) {
            $field = (string) ($facet['field_name'] ?? '');
            $key = $field === 'category' ? 'categories' : ($field === 'regions' ? 'regions' : ($field === 'cities' ? 'cities' : ''));
            if ($key === '') {
                continue;
            }
            foreach ((array) ($facet['counts'] ?? array()) as $count) {
                $value = sanitize_text_field((string) ($count['value'] ?? ''));
                if ($value !== '') {
                    $facets[$key][] = array('value' => $value, 'count' => absint($count['count'] ?? 0));
                }
            }
        }

        $total = absint($result['found'] ?? 0);
        return array(
            'items' => $items,
            'pagination' => array(
                'page' => $page,
                'perPage' => $per_page,
                'total' => $total,
                'totalPages' => max(1, (int) ceil($total / $per_page)),
            ),
            'facets' => $facets,
        );
    }
}

add_action('rest_api_init', function () {
    register_rest_route('2424/v1', '/search/typesense', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => 'platform_submissions_ensure_request_authorized',
        'callback' => function (WP_REST_Request $request) {
            $result = platform_2424_typesense_search(($request->get_json_params() ?: array())['q'] ?? '');
            return is_wp_error($result) ? $result : rest_ensure_response($result);
        },
    ));
});

if (!function_exists('platform_2424_typesense_render_tab')) {
    function platform_2424_typesense_render_tab() {
        $config = platform_2424_typesense_config();
        $state = get_option(PLATFORM_2424_TYPESENSE_STATE_OPTION, array());
        // /health is public. Use the protected collections endpoint so this status also validates the saved API key.
        $collections = platform_2424_typesense_ready() ? platform_2424_typesense_request('GET', 'collections', null, 5) : new WP_Error('not_ready');
        $health = $collections;
        $collection_counts = array();
        if (is_array($collections)) {
            foreach ($collections as $collection) {
                if (is_array($collection) && !empty($collection['name'])) {
                    $collection_counts[(string) $collection['name']] = absint($collection['num_documents'] ?? 0);
                }
            }
        }
        ?>
        <div class="platform-2424-tab-content">
            <table class="widefat striped" style="max-width:720px;margin-bottom:18px;"><tbody>
                <tr><td>Configuration</td><td><?php echo platform_2424_typesense_ready() ? 'Prête' : 'Incomplète'; ?></td></tr>
                <tr><td>Connexion serveur</td><td><?php echo !is_wp_error($health) ? 'Disponible' : 'Indisponible'; ?></td></tr>
                <tr><td>Dernière indexation</td><td><?php echo esc_html((string) ($state['completedAt'] ?? $state['lastArticleSyncAt'] ?? 'Jamais')); ?></td></tr>
                <tr><td>État</td><td><?php echo esc_html((string) ($state['status'] ?? 'En attente')); ?> <?php echo !empty($state['stage']) ? '(' . esc_html((string) $state['stage']) . ')' : ''; ?></td></tr>
                <tr><td>Documents traités</td><td><?php echo esc_html((string) absint($state['indexed'] ?? 0)); ?></td></tr>
                <tr><td>Collections</td><td><?php echo esc_html(implode(' | ', array_map(function ($name, $count) { return $name . ': ' . $count; }, array_keys($collection_counts), array_values($collection_counts))) ?: 'Aucune'); ?></td></tr>
                <?php if (!empty($state['lastError'])) : ?><tr><td>Dernière erreur</td><td><?php echo esc_html((string) $state['lastError']); ?></td></tr><?php endif; ?>
            </tbody></table>
            <form method="post" action="options.php" class="platform-2424-card">
                <?php settings_fields(PLATFORM_2424_SETTINGS_GROUP_TYPESENSE); ?>
                <table class="form-table" role="presentation">
                    <tr><th scope="row">Activer Typesense</th><td><input type="hidden" name="platform_2424_typesense_enabled" value="no" /><label><input type="checkbox" name="platform_2424_typesense_enabled" value="yes" <?php checked($config['enabled']); ?> /> Autoriser la recherche instantanée sur ce serveur</label></td></tr>
                    <tr><th scope="row"><label for="platform_2424_typesense_host">Hôte</label></th><td><input class="regular-text code" id="platform_2424_typesense_host" name="platform_2424_typesense_host" value="<?php echo esc_attr($config['host']); ?>" /><p class="description">Conservez <code>127.0.0.1</code> pour un serveur Typesense privé sur ce VPS.</p></td></tr>
                    <tr><th scope="row"><label for="platform_2424_typesense_port">Port</label></th><td><input class="small-text" type="number" min="1" max="65535" id="platform_2424_typesense_port" name="platform_2424_typesense_port" value="<?php echo esc_attr((string) $config['port']); ?>" /></td></tr>
                    <tr><th scope="row"><label for="platform_2424_typesense_protocol">Protocole</label></th><td><select id="platform_2424_typesense_protocol" name="platform_2424_typesense_protocol"><option value="http" <?php selected($config['protocol'], 'http'); ?>>http</option><option value="https" <?php selected($config['protocol'], 'https'); ?>>https</option></select></td></tr>
                    <tr><th scope="row"><label for="platform_2424_typesense_api_key">Clé API</label></th><td><input type="password" class="regular-text code" id="platform_2424_typesense_api_key" name="platform_2424_typesense_api_key" value="" autocomplete="new-password" placeholder="<?php echo $config['apiKey'] !== '' ? 'Clé déjà configurée' : ''; ?>" /><p class="description">Laissez vide pour conserver la clé. Elle n’est jamais transmise à Next.js ou au navigateur.</p></td></tr>
                </table>
                <?php submit_button('Enregistrer la configuration Typesense'); ?>
            </form>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-top:16px;display:flex;gap:8px;">
                <input type="hidden" name="action" value="platform_2424_typesense_reindex" /><?php wp_nonce_field('platform_2424_typesense_reindex'); ?>
                <?php submit_button('Indexer maintenant', 'secondary', 'mode', false, array('value' => 'index')); ?>
                <?php submit_button('Réindexer tout', 'primary', 'mode', false, array('value' => 'reindex')); ?>
                <?php submit_button('Vider l’index', 'delete', 'mode', false, array('value' => 'clear')); ?>
            </form>
        </div>
        <?php
    }
}

add_action('admin_post_platform_2424_typesense_reindex', function () {
    if (!current_user_can('manage_options')) { wp_die('Accès refusé.'); }
    check_admin_referer('platform_2424_typesense_reindex');
    $mode = sanitize_key((string) ($_POST['mode'] ?? ''));
    if ($mode === 'clear') {
        foreach (platform_2424_typesense_collections() as $collection) { platform_2424_typesense_request('DELETE', 'collections/' . rawurlencode($collection), null, 30); }
        platform_2424_typesense_set_state(array('status' => 'cleared', 'indexed' => 0, 'completedAt' => gmdate('c')));
    } else {
        platform_2424_typesense_start_reindex($mode === 'reindex');
    }
    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=typesense'));
    exit;
});
