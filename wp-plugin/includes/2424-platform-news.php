<?php
/**
 * 2424 Platform News module
 * Description: Restores the legacy news custom post type for the WordPress dashboard and the Next.js news ticker.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('PLATFORM_2424_NEWS_MODULE_VERSION')) {
    define('PLATFORM_2424_NEWS_MODULE_VERSION', '1.0.1');
}

if (!function_exists('platform_2424_register_news_post_type')) {
    function platform_2424_register_news_post_type() {
        register_post_type('news', array(
            'labels' => array(
                'name' => 'Infos',
                'singular_name' => 'Info',
                'menu_name' => 'Infos',
                'name_admin_bar' => 'Info',
                'add_new' => 'Ajouter',
                'add_new_item' => 'Ajouter une info',
                'edit_item' => 'Modifier l info',
                'new_item' => 'Nouvelle info',
                'view_item' => 'Voir l info',
                'search_items' => 'Rechercher des infos',
                'not_found' => 'Aucune info trouvée.',
                'not_found_in_trash' => 'Aucune info dans la corbeille.',
                'all_items' => 'Toutes les infos',
            ),
            // The content is only displayed by the Next ticker. Keeping the
            // WordPress permalink disabled avoids creating a second public page.
            'public' => true,
            'publicly_queryable' => false,
            'exclude_from_search' => true,
            'show_ui' => true,
            'show_in_menu' => true,
            'show_in_nav_menus' => false,
            'show_in_rest' => true,
            'show_in_graphql' => true,
            'graphql_single_name' => 'NewsItem',
            'graphql_plural_name' => 'NewsItems',
            'supports' => array('title', 'editor', 'excerpt', 'thumbnail', 'author', 'custom-fields'),
            'has_archive' => false,
            'rewrite' => false,
            'query_var' => false,
            'menu_icon' => 'dashicons-rss',
            'menu_position' => 5,
            'capability_type' => 'post',
            'map_meta_cap' => true,
        ));
    }
}

if (!function_exists('platform_2424_enforce_news_graphql_registration')) {
    function platform_2424_enforce_news_graphql_registration($args, $post_type) {
        if ($post_type !== 'news') {
            return $args;
        }

        // The legacy theme also registers this CPT. Keep its existing settings
        // but make the historical flash source available to WPGraphQL.
        $args['show_in_graphql'] = true;
        $args['graphql_single_name'] = 'NewsItem';
        $args['graphql_plural_name'] = 'NewsItems';

        return $args;
    }
}

add_filter('register_post_type_args', 'platform_2424_enforce_news_graphql_registration', 20, 2);
add_action('init', 'platform_2424_register_news_post_type');

if (!defined('PLATFORM_2424_FLASH_SOURCE_POST_META')) {
    define('PLATFORM_2424_FLASH_SOURCE_POST_META', 'platform_flash_source_post_id');
}

if (!function_exists('platform_2424_get_article_flash_news_id')) {
    function platform_2424_get_article_flash_news_id($article_id) {
        $article_id = absint($article_id);
        if ($article_id <= 0) {
            return 0;
        }

        $flash_ids = get_posts(array(
            'post_type' => 'news',
            'post_status' => array('publish', 'draft', 'pending', 'future', 'private'),
            'posts_per_page' => 1,
            'fields' => 'ids',
            'meta_key' => PLATFORM_2424_FLASH_SOURCE_POST_META,
            'meta_value' => (string) $article_id,
            'orderby' => 'ID',
            'order' => 'DESC',
        ));

        return !empty($flash_ids) ? absint($flash_ids[0]) : 0;
    }
}

if (!function_exists('platform_2424_is_flash_source_visible')) {
    function platform_2424_is_flash_source_visible($article) {
        if (!$article instanceof WP_Post || $article->post_type !== 'post' || $article->post_status !== 'publish') {
            return false;
        }

        return !function_exists('platform_submissions_is_content_expired') || !platform_submissions_is_content_expired($article->ID);
    }
}

if (!function_exists('platform_2424_sync_article_flash_info')) {
    function platform_2424_sync_article_flash_info($article_id) {
        $article = get_post(absint($article_id));
        $flash_id = platform_2424_get_article_flash_news_id($article_id);
        if (!$article instanceof WP_Post || $flash_id <= 0) {
            return 0;
        }

        $flash = get_post($flash_id);
        if (!$flash instanceof WP_Post || $flash->post_type !== 'news') {
            return 0;
        }

        $next_status = platform_2424_is_flash_source_visible($article) ? 'publish' : 'draft';
        $next_title = wp_strip_all_tags(get_the_title($article));
        if ($flash->post_status === $next_status && $flash->post_title === $next_title) {
            return $flash_id;
        }

        wp_update_post(array(
            'ID' => $flash_id,
            'post_title' => $next_title,
            'post_status' => $next_status,
        ));

        return $flash_id;
    }
}

if (!function_exists('platform_2424_create_article_flash_info')) {
    function platform_2424_create_article_flash_info($article_id) {
        $article = get_post(absint($article_id));
        if (!platform_2424_is_flash_source_visible($article)) {
            return new WP_Error('platform_2424_flash_source_not_public', 'Publiez l article avant de l ajouter au fil flash info.');
        }

        $flash_id = platform_2424_get_article_flash_news_id($article->ID);
        if ($flash_id <= 0) {
            $flash_id = wp_insert_post(array(
                'post_type' => 'news',
                'post_status' => 'publish',
                'post_title' => wp_strip_all_tags(get_the_title($article)),
                'post_content' => '',
                'post_excerpt' => '',
                'post_author' => get_current_user_id() ?: $article->post_author,
            ), true);

            if (is_wp_error($flash_id)) {
                return $flash_id;
            }

            update_post_meta($flash_id, PLATFORM_2424_FLASH_SOURCE_POST_META, (string) $article->ID);
        }

        return platform_2424_sync_article_flash_info($article->ID);
    }
}

if (!function_exists('platform_2424_remove_article_flash_info')) {
    function platform_2424_remove_article_flash_info($article_id) {
        $flash_id = platform_2424_get_article_flash_news_id($article_id);
        if ($flash_id > 0) {
            wp_delete_post($flash_id, true);
        }

        return $flash_id;
    }
}

if (!function_exists('platform_2424_sync_article_flash_info_on_save')) {
    function platform_2424_sync_article_flash_info_on_save($post_id, $post, $update) {
        if (!$post instanceof WP_Post || $post->post_type !== 'post' || wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
            return;
        }

        platform_2424_sync_article_flash_info($post_id);
    }
}

add_action('save_post_post', 'platform_2424_sync_article_flash_info_on_save', 20, 3);

if (!function_exists('platform_2424_sync_article_flash_info_on_transition')) {
    function platform_2424_sync_article_flash_info_on_transition($new_status, $old_status, $post) {
        if (!$post instanceof WP_Post || $post->post_type !== 'post' || $new_status === $old_status) {
            return;
        }

        platform_2424_sync_article_flash_info($post->ID);
    }
}

add_action('transition_post_status', 'platform_2424_sync_article_flash_info_on_transition', 20, 3);

if (!function_exists('platform_2424_delete_article_flash_info_with_source')) {
    function platform_2424_delete_article_flash_info_with_source($post_id) {
        $post = get_post($post_id);
        if (!$post instanceof WP_Post || $post->post_type !== 'post') {
            return;
        }

        platform_2424_remove_article_flash_info($post_id);
    }
}

add_action('before_delete_post', 'platform_2424_delete_article_flash_info_with_source');

if (!function_exists('platform_2424_handle_article_flash_info_action')) {
    function platform_2424_handle_article_flash_info_action() {
        $article_id = absint($_REQUEST['article_id'] ?? 0);
        $mode = sanitize_key((string) ($_REQUEST['mode'] ?? ''));
        if ($article_id <= 0 || !in_array($mode, array('add', 'remove'), true)) {
            wp_die('Action flash info invalide.');
        }

        check_admin_referer('platform_2424_toggle_article_flash_info_' . $article_id);
        if (!current_user_can('edit_post', $article_id)) {
            wp_die('Vous n avez pas le droit de modifier cet article.');
        }

        $result = $mode === 'add'
            ? platform_2424_create_article_flash_info($article_id)
            : platform_2424_remove_article_flash_info($article_id);
        $notice = is_wp_error($result) ? 'error' : ($mode === 'add' ? 'added' : 'removed');
        $message = is_wp_error($result) ? $result->get_error_message() : '';
        // Returning to the editor makes the changed flash state explicit after
        // a row action, instead of silently returning to the article list.
        $redirect = get_edit_post_link($article_id, 'url');
        $redirect = add_query_arg(array(
            'platform_flash_info_notice' => $notice,
            'platform_flash_info_message' => $message,
        ), $redirect);

        wp_safe_redirect($redirect);
        exit;
    }
}

add_action('admin_post_platform_2424_toggle_article_flash_info', 'platform_2424_handle_article_flash_info_action');

if (!function_exists('platform_2424_render_article_flash_info_notice')) {
    function platform_2424_render_article_flash_info_notice() {
        $notice = sanitize_key((string) ($_GET['platform_flash_info_notice'] ?? ''));
        if (!in_array($notice, array('added', 'removed', 'error'), true)) {
            return;
        }

        $message = $notice === 'added'
            ? 'L article a ete ajoute au fil flash info.'
            : ($notice === 'removed' ? 'L article a ete retire du fil flash info.' : sanitize_text_field((string) ($_GET['platform_flash_info_message'] ?? 'Impossible de modifier le flash info.')));
        printf('<div class="notice notice-%1$s is-dismissible"><p>%2$s</p></div>', $notice === 'error' ? 'error' : 'success', esc_html($message));
    }
}

add_action('admin_notices', 'platform_2424_render_article_flash_info_notice');

if (!function_exists('platform_2424_register_flash_news_graphql_fields')) {
    function platform_2424_register_flash_news_graphql_fields() {
        if (!function_exists('register_graphql_field')) {
            return;
        }

        register_graphql_field('NewsItem', 'flashSourceArticle', array(
            'type' => 'Post',
            'description' => 'The editorial article opened by a linked flash news item.',
            'resolve' => function ($news) {
                if ($news instanceof WP_Post) {
                    $news_id = $news->ID;
                } elseif (is_object($news) && isset($news->databaseId)) {
                    $news_id = absint($news->databaseId);
                } elseif (is_array($news) && isset($news['databaseId'])) {
                    $news_id = absint($news['databaseId']);
                } else {
                    $news_id = 0;
                }
                $article_id = absint(get_post_meta($news_id, PLATFORM_2424_FLASH_SOURCE_POST_META, true));
                $article = get_post($article_id);

                return platform_2424_is_flash_source_visible($article) ? $article : null;
            },
        ));

        register_graphql_field('NewsItem', 'flashSourcePostId', array(
            'type' => 'Int',
            'description' => 'Database ID of the editorial article linked to this flash news item.',
            'resolve' => function ($news) {
                if ($news instanceof WP_Post) {
                    $news_id = $news->ID;
                } elseif (is_object($news) && isset($news->databaseId)) {
                    $news_id = absint($news->databaseId);
                } elseif (is_array($news) && isset($news['databaseId'])) {
                    $news_id = absint($news['databaseId']);
                } else {
                    $news_id = 0;
                }

                return absint(get_post_meta($news_id, PLATFORM_2424_FLASH_SOURCE_POST_META, true)) ?: null;
            },
        ));
    }
}

add_action('graphql_register_types', 'platform_2424_register_flash_news_graphql_fields');
