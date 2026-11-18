<?php
/**
 * Plugin Name: Tanyora Platform
 * Description: Connecte WordPress a la plateforme Tanyora pour l'authentification, les abonnements, les publications et la synchronisation Next.js.
 * Version: 1.0.316
 * Author: RijaCloud
 * Author URI: https://github.com/RijaCloud
 * Requires at least: 6.0
 * Tested up to: 6.8
 * Requires PHP: 7.4
 * Text Domain: platform-2424
 * Update URI: https://updates.2424-platform.local/2424-platform
 */

if (!defined('ABSPATH')) {
    exit;
}

if (defined('PLATFORM_2424_PLUGIN_LOADED')) {
    return;
}

define('PLATFORM_2424_PLUGIN_LOADED', true);
define('PLATFORM_2424_PLUGIN_VERSION', '1.0.316');
define('PLATFORM_2424_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('PLATFORM_2424_LOG_OPTION', 'platform_2424_logs');
define('PLATFORM_2424_LOG_LIMIT', 200);
define('PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION', 'platform_2424_settings_configuration');
define('PLATFORM_2424_SETTINGS_GROUP_MVOLA', 'platform_2424_settings_mvola');
define('PLATFORM_2424_SETTINGS_GROUP_PRICING', 'platform_2424_settings_pricing');
define('PLATFORM_2424_SETTINGS_GROUP_PAPI', 'platform_2424_settings_papi');
define('PLATFORM_2424_SETTINGS_GROUP_LOGS', 'platform_2424_settings_logs');
define('PLATFORM_2424_SETTINGS_GROUP_ACCESS', 'platform_2424_settings_access');
define('PLATFORM_2424_SETTINGS_GROUP_TYPESENSE', 'platform_2424_settings_typesense');

if (!defined('PLATFORM_2424_PLAN_OPTIONS')) {
    define('PLATFORM_2424_PLAN_OPTIONS', 'free,essentiel,business');
}

if (!function_exists('platform_2424_plugin_update_metadata_url')) {
    function platform_2424_sanitize_metadata_update_input($value) {
        return trim((string) $value);
    }

    function platform_2424_sanitize_text_input($value) {
        return trim((string) $value);
    }

    function platform_2424_allow_admin_svg_uploads($mime_types) {
        if (current_user_can('manage_options')) {
            $mime_types['svg'] = 'image/svg+xml';
        }

        return $mime_types;
    }

    function platform_2424_set_admin_svg_filetype($filetype_and_ext, $file, $filename, $mimes) {
        if (!current_user_can('manage_options') || strtolower((string) pathinfo($filename, PATHINFO_EXTENSION)) !== 'svg') {
            return $filetype_and_ext;
        }

        $filetype_and_ext['ext'] = 'svg';
        $filetype_and_ext['type'] = 'image/svg+xml';
        $filetype_and_ext['proper_filename'] = false;

        return $filetype_and_ext;
    }

    function platform_2424_validate_admin_svg_upload($file) {
        if (strtolower((string) pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION)) !== 'svg') {
            return $file;
        }

        if (!current_user_can('manage_options')) {
            $file['error'] = 'Les fichiers SVG sont réservés aux administrateurs.';
            return $file;
        }

        $temporary_file = (string) ($file['tmp_name'] ?? '');
        $contents = $temporary_file !== '' && is_readable($temporary_file) ? file_get_contents($temporary_file) : false;
        if (!is_string($contents) || $contents === '' || strlen($contents) > 1024 * 1024) {
            $file['error'] = 'Le fichier SVG est invalide ou trop volumineux.';
            return $file;
        }

        $unsafe_markup = '/<(?:script|iframe|object|embed|foreignObject)\\b|\\son[a-z]+\\s*=|\\b(?:href|xlink:href)\\s*=\\s*["\\\']\\s*(?:https?:|data:|javascript:)|<!DOCTYPE|<!ENTITY/i';
        if (preg_match($unsafe_markup, $contents)) {
            $file['error'] = 'Le fichier SVG contient du contenu non autorisé.';
        }

        return $file;
    }

    function platform_2424_sanitize_annonces_display_mode($value) {
        $value = sanitize_key((string) $value);
        return $value === 'blended' ? 'blended' : 'separate';
    }

    function platform_2424_sanitize_adsense_mode($value) {
        $value = sanitize_key((string) $value);
        return in_array($value, array('disabled', 'placeholder', 'adsense'), true) ? $value : 'placeholder';
    }

    function platform_2424_sanitize_page_reference_id($value) {
        return absint($value);
    }

    function platform_2424_decode_public_seo_text($value) {
        $decoded = wp_strip_all_tags((string) $value);
        $charset = get_bloginfo('charset') ?: 'UTF-8';

        // The original editorial database stores some SEO values as HTML entities.
        for ($index = 0; $index < 2; $index++) {
            $next_value = html_entity_decode($decoded, ENT_QUOTES, $charset);
            if ($next_value === $decoded) {
                break;
            }
            $decoded = $next_value;
        }

        return trim($decoded);
    }

    function platform_2424_get_public_seo_reference_pages() {
        return array(
            'home' => array('option' => 'platform_2424_seo_home_page_id', 'label' => 'Accueil', 'path' => '/'),
            'news' => array('option' => 'platform_2424_seo_news_page_id', 'label' => 'Actualités', 'path' => '/actualites'),
            'classifieds' => array('option' => 'platform_2424_seo_classifieds_page_id', 'label' => 'Petites annonces', 'path' => '/petites-annonces'),
            'jobs' => array('option' => 'platform_2424_seo_jobs_page_id', 'label' => 'Offres d’emploi', 'path' => '/offres-emploi'),
            'tenders' => array('option' => 'platform_2424_seo_tenders_page_id', 'label' => 'Appels d’offres', 'path' => '/appels-offres'),
            'directory' => array('option' => 'platform_2424_seo_directory_page_id', 'label' => 'Annuaire', 'path' => '/annuaire'),
            'pricing' => array('option' => 'platform_2424_seo_pricing_page_id', 'label' => 'Tarifs', 'path' => '/tarifs'),
        );
    }

    function platform_2424_get_public_seo_reference_page_metadata($page_id) {
        $page = get_post(absint($page_id));
        if (!($page instanceof WP_Post)) {
            return null;
        }

        $fallback_title = platform_2424_decode_public_seo_text(get_the_title($page));
        $title = '';
        foreach (array('_yoast_wpseo_title', 'rank_math_title') as $meta_key) {
            $candidate = trim((string) get_post_meta($page->ID, $meta_key, true));
            if ($candidate !== '') {
                $title = str_replace(
                    array('%%title%%', '%title%', '%%sitename%%', '%sitename%', '%%sep%%', '%sep%'),
                    array($fallback_title, $fallback_title, get_bloginfo('name'), get_bloginfo('name'), '-', '-'),
                    $candidate
                );
                $title = platform_2424_decode_public_seo_text($title);
                break;
            }
        }
        if ($title === '') {
            $title = $fallback_title;
        }

        $description = '';
        foreach (array('_yoast_wpseo_metadesc', 'rank_math_description') as $meta_key) {
            $candidate = trim((string) get_post_meta($page->ID, $meta_key, true));
            if ($candidate !== '') {
                $description = platform_2424_decode_public_seo_text($candidate);
                break;
            }
        }
        if ($description === '') {
            $description = platform_2424_decode_public_seo_text($page->post_excerpt);
        }
        if ($description === '') {
            $description = wp_trim_words(platform_2424_decode_public_seo_text($page->post_content), 30, '…');
        }

        $image_url = '';
        foreach (array('_yoast_wpseo_opengraph-image', 'rank_math_facebook_image', 'rank_math_twitter_image') as $meta_key) {
            $candidate = esc_url_raw((string) get_post_meta($page->ID, $meta_key, true));
            if ($candidate !== '') {
                $image_url = $candidate;
                break;
            }
        }
        if ($image_url === '') {
            $image_url = (string) get_the_post_thumbnail_url($page, 'full');
        }

        $no_index = (string) get_post_meta($page->ID, '_yoast_wpseo_meta-robots-noindex', true) === '1';
        $rank_math_robots = get_post_meta($page->ID, 'rank_math_robots', true);
        if (is_array($rank_math_robots) && in_array('noindex', $rank_math_robots, true)) {
            $no_index = true;
        }

        return array(
            'title' => $title,
            'description' => $description,
            'imageUrl' => $image_url,
            'noIndex' => $no_index,
        );
    }

    function platform_2424_get_public_seo_config() {
        $pages = array();
        foreach (platform_2424_get_public_seo_reference_pages() as $key => $reference) {
            $metadata = platform_2424_get_public_seo_reference_page_metadata(get_option($reference['option'], 0));
            if ($metadata !== null) {
                $pages[$key] = $metadata;
            }
        }

        $home_title = platform_2424_decode_public_seo_text(get_option('platform_2424_home_title', ''));
        $home_description = platform_2424_decode_public_seo_text(get_option('platform_2424_home_description', ''));
        if ($home_title !== '' || $home_description !== '') {
            if (!isset($pages['home'])) {
                $pages['home'] = array();
            }
            if ($home_title !== '') {
                $pages['home']['title'] = $home_title;
            }
            if ($home_description !== '') {
                $pages['home']['description'] = $home_description;
            }
        }

        return array(
            'siteName' => platform_2424_decode_public_seo_text(get_bloginfo('name')),
            'siteTagline' => platform_2424_decode_public_seo_text(get_bloginfo('description')),
            'siteIconUrl' => (string) get_site_icon_url(512),
            'logoUrl' => esc_url_raw((string) get_option('platform_2424_public_logo_url', '')),
            'pages' => $pages,
        );
    }

    function platform_2424_get_public_footer_config() {
        return array(
            'description' => platform_2424_decode_public_seo_text(get_option(
                'platform_2424_footer_description',
                "2424.mg est un site web promu par UNITED MALAGASY MEDIA, visant à produire des contenus de qualité aussi bien dans l'actualité quotidienne que sous forme de reportages."
            )),
            'socialLinks' => array(
                'facebook' => esc_url_raw((string) get_option('platform_2424_footer_facebook_url', 'https://web.facebook.com/2424.mg/')),
                'tiktok' => esc_url_raw((string) get_option('platform_2424_footer_tiktok_url', 'https://www.tiktok.com/@2424.mg')),
                'instagram' => esc_url_raw((string) get_option('platform_2424_footer_instagram_url', 'https://www.instagram.com/2424.mg/')),
                'youtube' => esc_url_raw((string) get_option('platform_2424_footer_youtube_url', 'https://www.youtube.com/channel/UCcjS1Us2l3yB8lLsDu3Vr6w')),
                'linkedin' => esc_url_raw((string) get_option('platform_2424_footer_linkedin_url', 'https://www.linkedin.com/company/2424-mg')),
                'x' => esc_url_raw((string) get_option('platform_2424_footer_x_url', 'https://x.com/2424_mg')),
            ),
        );
    }

    function platform_2424_get_public_privacy_policy() {
        $page_id = absint(get_option('wp_page_for_privacy_policy', 0));
        $page = $page_id > 0 ? get_post($page_id) : null;

        if (!($page instanceof WP_Post) || $page->post_type !== 'page' || $page->post_status !== 'publish') {
            return array('configured' => false);
        }

        return array(
            'configured' => true,
            'title' => platform_2424_decode_public_seo_text(get_the_title($page)),
            // The WordPress policy stays editable, but only permitted public markup leaves WordPress.
            'contentHtml' => wp_kses_post(apply_filters('the_content', $page->post_content)),
            'modifiedAt' => get_post_modified_time('c', true, $page),
        );
    }

    function platform_2424_sanitize_log_level($value) {
        $value = sanitize_key((string) $value);
        return in_array($value, array('off', 'error', 'warning', 'info', 'debug'), true) ? $value : 'error';
    }

    function platform_2424_sanitize_plan_feature_limit($value) {
        return absint($value);
    }

    function platform_2424_sanitize_staging_subscription_bypass($value) {
        if ($value !== 'yes' || !function_exists('platform_billing_is_staging_site') || !platform_billing_is_staging_site()) {
            return 'no';
        }

        return 'yes';
    }

    function platform_2424_sanitize_article_minimum_plan($value) {
        $value = sanitize_key((string) $value);
        return in_array($value, array('all', 'essentiel', 'business'), true) ? $value : 'all';
    }

    function platform_2424_sanitize_tender_minimum_plan($value) {
        $value = sanitize_key((string) $value);
        return in_array($value, array('free', 'essentiel', 'business'), true) ? $value : 'business';
    }

    function platform_2424_sanitize_directory_minimum_plan($value) {
        $value = sanitize_key((string) $value);
        return in_array($value, array('free', 'essentiel', 'business'), true) ? $value : 'essentiel';
    }

    function platform_2424_sanitize_smtp_port($value) {
        $port = absint($value);
        if ($port < 1 || $port > 65535) {
            return '';
        }
        return (string) $port;
    }

    function platform_2424_sanitize_smtp_host($value) {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        // SMTP expects a hostname, not a web URL. Accept a pasted URL but only keep its host.
        $host = wp_parse_url(strpos($value, '://') === false ? 'smtp://' . $value : $value, PHP_URL_HOST);
        if (!is_string($host) || $host === '') {
            return '';
        }

        return strtolower(rtrim($host, '.'));
    }

    function platform_2424_sanitize_smtp_secure($value) {
        $value = strtolower(trim((string) $value));
        if (!in_array($value, array('', 'tls', 'ssl'), true)) {
            return '';
        }
        return $value;
    }

    function platform_2424_sanitize_email_input($value) {
        $email = sanitize_email((string) $value);
        return $email ? $email : '';
    }

    function platform_2424_sanitize_public_site_url($value) {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        if (!preg_match('#^https?://#i', $value)) {
            $value = 'https://' . ltrim($value, '/');
        }

        return untrailingslashit(esc_url_raw($value));
    }

    function platform_2424_sanitize_https_url_input($value) {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        return esc_url_raw($value);
    }

    function platform_2424_normalize_metadata_update_url($value) {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        // Accept plain host like: dxxxx.cloudfront.net
        if (!preg_match('#^https?://#i', $value)) {
            $value = 'https://' . ltrim($value, '/');
        }

        // If user provides a base CDN URL, auto-complete latest.json path
        if (stripos($value, '.json') === false) {
            $value = rtrim($value, '/') . '/2424-platform/latest.json';
        }

        return esc_url_raw($value);
    }

    function platform_2424_plugin_update_metadata_url() {
        $configured = '';

        if (defined('PLATFORM_2424_PLUGIN_UPDATE_URL') && PLATFORM_2424_PLUGIN_UPDATE_URL) {
            $configured = (string) PLATFORM_2424_PLUGIN_UPDATE_URL;
        } else {
            $saved = get_option('platform_2424_plugin_update_url', '');
            if (is_string($saved) && trim($saved) !== '') {
                $configured = $saved;
            } else {
                $env = getenv('PLATFORM_2424_PLUGIN_UPDATE_URL');
                if ($env) {
                    $configured = (string) $env;
                }
            }
        }

        $configured = platform_2424_normalize_metadata_update_url($configured);
        return apply_filters('platform_2424_plugin_update_metadata_url', $configured);
    }

    function platform_2424_get_annonces_display_mode() {
        $saved = get_option('platform_2424_annonces_display_mode', 'separate');
        return platform_2424_sanitize_annonces_display_mode($saved);
    }

    function platform_2424_get_adsense_config() {
        $saved_mode = trim((string) get_option('platform_2424_adsense_mode', ''));
        if ($saved_mode === '') {
            $legacy_enabled = (string) get_option('platform_2424_adsense_enabled', 'no') === 'yes';
            $saved_mode = $legacy_enabled ? 'adsense' : 'placeholder';
        }

        $mode = platform_2424_sanitize_adsense_mode($saved_mode);
        $client_id = trim((string) get_option('platform_2424_adsense_client_id', 'ca-pub-9214874716192005'));

        return array(
            'mode' => $mode,
            'enabled' => $mode === 'adsense' && $client_id !== '',
            'showPlaceholders' => (string) get_option('platform_2424_adsense_show_placeholders', 'no') === 'yes',
            'articleInlineStartAfterBlocks' => max(1, (int) get_option('platform_2424_adsense_article_inline_start_after_blocks', 3)),
            'articleInlineRepeatEveryBlocks' => max(1, (int) get_option('platform_2424_adsense_article_inline_repeat_every_blocks', 4)),
            'clientId' => $client_id,
            'slots' => array(
                'topBanner' => trim((string) get_option('platform_2424_adsense_top_banner_slot', '')),
                'homeTop' => trim((string) get_option('platform_2424_adsense_home_top_slot', '')),
                'homeAfterEditorial' => trim((string) get_option('platform_2424_adsense_home_after_editorial_slot', '')),
                'archiveInline' => trim((string) get_option('platform_2424_adsense_archive_inline_slot', '')),
                'articleInline' => trim((string) get_option('platform_2424_adsense_article_inline_slot', '')),
                'articleRail' => trim((string) get_option('platform_2424_adsense_article_rail_slot', '')),
            ),
        );
    }

    function platform_2424_get_access_matrix() {
        return array(
            'news' => array(
                'minimumPlanOptions' => array(
                    array('value' => 'all', 'label' => 'Visible pour tous'),
                    array('value' => 'essentiel', 'label' => 'Essentiel et Business'),
                    array('value' => 'business', 'label' => 'Business uniquement'),
                ),
            ),
            'classifieds' => array(
                'monthlyPosts' => array(
                    'free' => absint(get_option('platform_2424_classified_monthly_posts_free', 1)),
                    'essentiel' => absint(get_option('platform_2424_classified_monthly_posts_essentiel', 5)),
                    'business' => absint(get_option('platform_2424_classified_monthly_posts_business', 10)),
                ),
                'maxPhotos' => array(
                    'free' => max(1, absint(get_option('platform_2424_classified_max_photos_free', 2))),
                    'essentiel' => max(1, absint(get_option('platform_2424_classified_max_photos_essentiel', 10))),
                    'business' => max(1, absint(get_option('platform_2424_classified_max_photos_business', 20))),
                ),
            ),
            'jobs' => array(
                'monthlyPosts' => array(
                    'free' => absint(get_option('platform_2424_job_monthly_posts_free', 0)),
                    'essentiel' => absint(get_option('platform_2424_job_monthly_posts_essentiel', 5)),
                    'business' => absint(get_option('platform_2424_job_monthly_posts_business', 10)),
                ),
            ),
            'directory' => array(
                'minimumPlan' => platform_2424_sanitize_directory_minimum_plan(get_option('platform_2424_directory_minimum_plan', 'essentiel')),
            ),
            'tenders' => array(
                'monthlyPosts' => array(
                    'free' => absint(get_option('platform_2424_tender_monthly_posts_free', 0)),
                    'essentiel' => absint(get_option('platform_2424_tender_monthly_posts_essentiel', 0)),
                    'business' => absint(get_option('platform_2424_tender_monthly_posts_business', 10)),
                ),
                'minimumPlan' => platform_2424_sanitize_tender_minimum_plan(get_option('platform_2424_tender_minimum_plan', 'business')),
                'responseMinimumPlan' => platform_2424_sanitize_tender_minimum_plan(get_option('platform_2424_tender_response_minimum_plan', 'business')),
            ),
        );
    }
}

if (!function_exists('platform_2424_get_admin_tab')) {
    function platform_2424_get_admin_tab() {
        $tab = isset($_GET['tab']) ? sanitize_key((string) $_GET['tab']) : 'configuration';
        $allowed_tabs = array('configuration', 'pricing', 'papi', 'typesense', 'listing-index', 'access', 'backup', 'logs');
        if (function_exists('platform_2424_stress_test_is_staging') && platform_2424_stress_test_is_staging()) {
            $allowed_tabs[] = 'stress-test';
        }
        return in_array($tab, $allowed_tabs, true) ? $tab : 'pricing';
    }

    function platform_2424_get_exportable_settings_option_keys() {
        global $wpdb;

        $option_names = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s",
                $wpdb->esc_like('platform_2424_') . '%'
            )
        );
        $registered_settings = array_keys((array) get_registered_settings());
        $registered_option_names = array_filter($registered_settings, function ($option_name) {
            return is_string($option_name) && strpos($option_name, 'platform_2424_') === 0;
        });
        $excluded_options = array(PLATFORM_2424_LOG_OPTION);

        return array_values(array_unique(array_filter(array_map('strval', array_merge((array) $option_names, $registered_option_names)), function ($option_name) use ($excluded_options) {
            return $option_name !== '' && !in_array($option_name, $excluded_options, true);
        })));
    }

    function platform_2424_get_sensitive_settings_option_keys() {
        return array(
            'platform_2424_email_dispatcher_shared_secret',
            'platform_2424_media_delete_secret',
            'platform_2424_submissions_secret',
            'platform_2424_vapid_private_key',
            'platform_2424_smtp_pass',
            'platform_2424_mvola_consumer_key',
            'platform_2424_mvola_consumer_secret',
            'platform_2424_mvola_callback_secret',
            'platform_2424_papi_api_key',
            'platform_2424_papi_webhook_secret',
            'platform_2424_typesense_api_key',
        );
    }

    function platform_2424_get_non_transferable_settings_option_keys() {
        // The VAPID private key must remain on the WordPress instance at all times.
        return array(
            'platform_2424_vapid_private_key',
        );
    }

    function platform_2424_is_valid_settings_transfer_value($value) {
        if (is_null($value) || is_scalar($value)) {
            return true;
        }

        if (!is_array($value)) {
            return false;
        }

        foreach ($value as $item) {
            if (!platform_2424_is_valid_settings_transfer_value($item)) {
                return false;
            }
        }

        return true;
    }

    function platform_2424_get_transferable_taxonomies() {
        $taxonomies = array(
            'directory_category',
            'directory_location',
            'classified_category',
            'classified_product_tag',
            'listing_location',
            'classified_location',
            'job_category',
            'job_location',
            'tender_category',
            'tender_location',
        );

        return array_values(array_filter($taxonomies, 'taxonomy_exists'));
    }

    function platform_2424_export_taxonomy_terms() {
        $terms_by_taxonomy = array();

        foreach (platform_2424_get_transferable_taxonomies() as $taxonomy) {
            $terms = get_terms(array(
                'taxonomy' => $taxonomy,
                'hide_empty' => false,
                'orderby' => 'term_id',
                'order' => 'ASC',
            ));
            if (is_wp_error($terms) || !is_array($terms)) {
                continue;
            }

            $entries = array();
            foreach ($terms as $term) {
                $parent_slug = '';
                if ($term->parent) {
                    $parent = get_term((int) $term->parent, $taxonomy);
                    $parent_slug = $parent instanceof WP_Term ? (string) $parent->slug : '';
                }

                $entry = array(
                    'name' => (string) $term->name,
                    'slug' => (string) $term->slug,
                    'description' => (string) $term->description,
                    'parentSlug' => $parent_slug,
                    'order' => absint(get_term_meta($term->term_id, 'platform_term_order', true)),
                );
                if ($taxonomy === 'classified_category' && function_exists('platform_submissions_get_allowed_classified_product_tag_ids_for_category')) {
                    $tag_ids = platform_submissions_get_allowed_classified_product_tag_ids_for_category($term->term_id);
                    $tag_slugs = array();
                    foreach ($tag_ids as $tag_id) {
                        $tag = get_term($tag_id, 'classified_product_tag');
                        if ($tag instanceof WP_Term) {
                            $tag_slugs[] = (string) $tag->slug;
                        }
                    }
                    $entry['allowedProductTagSlugs'] = array_values(array_unique($tag_slugs));
                }
                $entries[] = $entry;
            }
            $terms_by_taxonomy[$taxonomy] = $entries;
        }

        return $terms_by_taxonomy;
    }

    function platform_2424_normalize_taxonomy_import_term($entry) {
        if (!is_array($entry)) {
            return null;
        }
        $name = sanitize_text_field((string) ($entry['name'] ?? ''));
        $slug = sanitize_title((string) ($entry['slug'] ?? $name));
        if ($name === '' || $slug === '') {
            return null;
        }

        return array(
            'name' => $name,
            'slug' => $slug,
            'description' => sanitize_textarea_field((string) ($entry['description'] ?? '')),
            'parentSlug' => sanitize_title((string) ($entry['parentSlug'] ?? '')),
            'order' => absint($entry['order'] ?? 0),
            'allowedProductTagSlugs' => array_values(array_unique(array_filter(array_map('sanitize_title', (array) ($entry['allowedProductTagSlugs'] ?? array()))))),
        );
    }

    function platform_2424_render_settings_transfer_tab() {
        $transfer_status = isset($_GET['settings-transfer']) ? sanitize_key((string) $_GET['settings-transfer']) : '';
        $imported_count = isset($_GET['imported']) ? absint($_GET['imported']) : 0;
        $skipped_count = isset($_GET['skipped']) ? absint($_GET['skipped']) : 0;

        if ($transfer_status === 'imported') {
            printf(
                '<div class="notice notice-success is-dismissible"><p>%s</p></div>',
                esc_html(sprintf('%d paramètre(s) importé(s)%s.', $imported_count, $skipped_count > 0 ? sprintf(', %d ignoré(s)', $skipped_count) : ''))
            );
        } elseif ($transfer_status === 'invalid') {
            echo '<div class="notice notice-error"><p>Le fichier de sauvegarde est invalide ou ne correspond pas à Tanyora Platform.</p></div>';
        } elseif ($transfer_status === 'failed') {
            echo '<div class="notice notice-error"><p>Impossible d’importer ce fichier. Vérifiez son format puis réessayez.</p></div>';
        }
        $taxonomy_transfer_status = isset($_GET['taxonomy-transfer']) ? sanitize_key((string) $_GET['taxonomy-transfer']) : '';
        if ($taxonomy_transfer_status === 'imported') {
            $created = absint($_GET['created'] ?? 0);
            $updated = absint($_GET['updated'] ?? 0);
            $skipped = absint($_GET['skipped'] ?? 0);
            printf('<div class="notice notice-success is-dismissible"><p>%s</p></div>', esc_html(sprintf('Taxonomies importées : %d créées, %d mises à jour%s.', $created, $updated, $skipped > 0 ? sprintf(', %d ignorées', $skipped) : '')));
        } elseif ($taxonomy_transfer_status === 'invalid' || $taxonomy_transfer_status === 'failed') {
            echo '<div class="notice notice-error"><p>Le fichier de taxonomies est invalide ou n’a pas pu être importé.</p></div>';
        }
        ?>
        <h2>Sauvegarde des paramètres</h2>
        <p>Exportez la configuration de Tanyora Platform pour la restaurer sur une autre installation WordPress.</p>

        <hr />

        <h3>Exporter</h3>
        <p>Téléchargez un fichier JSON contenant les paramètres du plugin. Les contenus, utilisateurs, commandes et journaux ne sont pas inclus.</p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="platform_2424_export_settings" />
            <?php wp_nonce_field('platform_2424_export_settings'); ?>
            <p><label><input type="checkbox" name="include_sensitive_settings" value="1" /> Inclure les accès sensibles</label></p>
            <p class="description">Cette option inclut notamment les secrets internes, les accès SMTP et les identifiants MVola. Conservez ce fichier dans un emplacement sécurisé.</p>
            <?php submit_button('Télécharger la sauvegarde JSON', 'primary', 'submit', false); ?>
        </form>

        <hr />

        <h3>Importer</h3>
        <p>Importez une sauvegarde JSON créée par Tanyora Platform. Seuls les paramètres présents dans le fichier seront remplacés.</p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data">
            <input type="hidden" name="action" value="platform_2424_import_settings" />
            <?php wp_nonce_field('platform_2424_import_settings'); ?>
            <p><input type="file" name="settings_file" accept="application/json,.json" required /></p>
            <p><label><input type="checkbox" name="confirm_import" value="1" required /> Je confirme remplacer les paramètres actuels du plugin.</label></p>
            <?php submit_button('Importer la sauvegarde', 'secondary', 'submit', false); ?>
        </form>

        <hr />

        <h2>Taxonomies de contenus</h2>
        <p>Exportez ou importez uniquement les catégories, sous-types, tags produit, villes et zones des Petites annonces, Emplois, Appels d’offres et Annuaire. Aucun contenu, utilisateur, média, commande, réglage ou secret n’est inclus.</p>

        <h3>Exporter les taxonomies</h3>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="platform_2424_export_taxonomies" />
            <?php wp_nonce_field('platform_2424_export_taxonomies'); ?>
            <?php submit_button('Télécharger les taxonomies JSON', 'primary', 'submit', false); ?>
        </form>

        <h3>Importer les taxonomies</h3>
        <p class="description">Les termes sont créés ou mis à jour par taxonomie et slug. Les termes existants non présents dans le fichier ne sont jamais supprimés.</p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data">
            <input type="hidden" name="action" value="platform_2424_import_taxonomies" />
            <?php wp_nonce_field('platform_2424_import_taxonomies'); ?>
            <p><input type="file" name="taxonomies_file" accept="application/json,.json" required /></p>
            <p><label><input type="checkbox" name="confirm_taxonomy_import" value="1" required /> Je confirme importer et mettre à jour les taxonomies existantes.</label></p>
            <?php submit_button('Importer les taxonomies', 'secondary', 'submit', false); ?>
        </form>
        <?php
    }

    function platform_2424_get_pricing_setting_rows() {
        if (function_exists('platform_submissions_pricing_catalog_definitions')) {
            $definitions = platform_submissions_pricing_catalog_definitions();
            if (is_array($definitions)) {
                return $definitions;
            }
        }

        return array();
    }

    function platform_2424_get_pricing_rules() {
        $rules = get_option('platform_2424_pricing_rules', array());
        return is_array($rules) ? $rules : array();
    }

    function platform_2424_sanitize_pricing_rules($value) {
        $value = is_array($value) ? $value : array();
        $sanitized = array();

        foreach (platform_2424_get_pricing_setting_rows() as $definition) {
            $code = sanitize_key((string) ($definition['code'] ?? ''));
            if ($code === '') {
                continue;
            }

            $raw_rule = isset($value[$code]) && is_array($value[$code]) ? $value[$code] : array();
            $product_id = absint($raw_rule['product_id'] ?? 0);
            $duration_days = absint($raw_rule['duration_days'] ?? 0);

            $sanitized[$code] = array(
                'product_id' => $product_id > 0 ? $product_id : 0,
                'duration_days' => $duration_days > 0 ? $duration_days : 0,
            );
        }

        return $sanitized;
    }

    function platform_2424_get_pricing_products() {
        if (!post_type_exists('product')) {
            return array();
        }

        $products = get_posts(array(
            'post_type' => 'product',
            'post_status' => array('publish', 'private', 'draft'),
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
            'fields' => 'ids',
        ));

        $choices = array();
        foreach ($products as $product_id) {
            $product_id = absint($product_id);
            if ($product_id <= 0) {
                continue;
            }

            $sku = get_post_meta($product_id, '_sku', true);
            $choices[] = array(
                'id' => $product_id,
                'title' => get_the_title($product_id),
                'sku' => sanitize_text_field((string) $sku),
            );
        }

        return $choices;
    }

    function platform_2424_format_pricing_row_label($definition) {
        $kind = sanitize_key((string) ($definition['kind'] ?? ''));
        $action = sanitize_key((string) ($definition['action'] ?? ''));
        $variant = sanitize_key((string) ($definition['variant'] ?? ''));

        if ($kind === 'news') {
            return $action === 'boost' ? 'Boost article de presse (7 jours)' : 'Article de presse (Communique)';
        }
        if ($kind === 'job') {
            return $action === 'boost' ? "Boost annonce de recrutement (7 jours)" : 'Poster une annonce de recrutement';
        }
        if ($kind === 'tender') {
            return $action === 'boost' ? "Boost appel d'offres (7 jours)" : "Poster un appel d'offres";
        }
        if ($kind === 'classified' && $variant === '1_photo') {
            return 'Annonce de base avec 1 photo';
        }
        if ($kind === 'classified' && $variant === '4_photo') {
            return 'Annonce de base avec 4 photos';
        }
        if ($kind === 'classified' && $action === 'boost') {
            return 'Boost petite annonce (7 jours)';
        }

        return sanitize_text_field((string) ($definition['code'] ?? ''));
    }

    function platform_2424_render_pricing_tab() {
        $definitions = platform_2424_get_pricing_setting_rows();
        $rules = platform_2424_get_pricing_rules();
        $products = platform_2424_get_pricing_products();
        $annual_essentiel_product_id = absint(get_option('platform_2424_annual_product_id_essentiel', 0));
        $annual_business_product_id = absint(get_option('platform_2424_annual_product_id_business', 0));
        ?>
        <div style="margin-top: 16px;">
            <p>Associez chaque code tarifaire a un produit WooCommerce et a une duree en jours. Si aucun produit n'est choisi, le plugin retombera sur le SKU du code quand il existe.</p>
            <form method="post" action="options.php">
                <?php settings_fields(PLATFORM_2424_SETTINGS_GROUP_PRICING); ?>
                <table class="form-table" role="presentation" style="margin-bottom: 24px;">
                    <tr>
                        <th scope="row"><label for="platform_2424_annual_product_id_essentiel">Produit annuel Essentiel</label></th>
                        <td>
                            <select id="platform_2424_annual_product_id_essentiel" name="platform_2424_annual_product_id_essentiel" style="min-width: 360px;">
                                <option value="0">Detection auto par SKU</option>
                                <?php foreach ($products as $product) : ?>
                                    <option value="<?php echo esc_attr((string) $product['id']); ?>" <?php selected($annual_essentiel_product_id, (int) $product['id']); ?>>
                                        <?php echo esc_html('#' . (int) $product['id'] . ' - ' . (string) $product['title'] . ((string) $product['sku'] !== '' ? ' [' . (string) $product['sku'] . ']' : '')); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <p class="description">
                                Produit WooCommerce utilise pour l'abonnement annuel Essentiel.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_annual_product_id_business">Produit annuel Business</label></th>
                        <td>
                            <select id="platform_2424_annual_product_id_business" name="platform_2424_annual_product_id_business" style="min-width: 360px;">
                                <option value="0">Detection auto par SKU</option>
                                <?php foreach ($products as $product) : ?>
                                    <option value="<?php echo esc_attr((string) $product['id']); ?>" <?php selected($annual_business_product_id, (int) $product['id']); ?>>
                                        <?php echo esc_html('#' . (int) $product['id'] . ' - ' . (string) $product['title'] . ((string) $product['sku'] !== '' ? ' [' . (string) $product['sku'] . ']' : '')); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <p class="description">
                                Produit WooCommerce utilise pour l'abonnement annuel Business.
                            </p>
                        </td>
                    </tr>
                    <?php if (function_exists('platform_billing_is_staging_site') && platform_billing_is_staging_site()) : ?>
                        <tr>
                            <th scope="row">Acces de test</th>
                            <td>
                                <?php $staging_bypass_enabled = (string) get_option('platform_2424_staging_subscription_bypass_enabled', 'no'); ?>
                                <label>
                                    <input type="hidden" name="platform_2424_staging_subscription_bypass_enabled" value="no" />
                                    <input type="checkbox" id="platform_2424_staging_subscription_bypass_enabled" name="platform_2424_staging_subscription_bypass_enabled" value="yes" <?php checked($staging_bypass_enabled, 'yes'); ?> />
                                    Autoriser le bypass des abonnements sur cet environnement
                                </label>
                                <p class="description">
                                    Disponible uniquement sur staging. Cette action active un acces Essentiel ou Business sans creer de paiement, commande ou facture.
                                </p>
                            </td>
                        </tr>
                    <?php endif; ?>
                </table>
                <table class="widefat striped">
                    <thead>
                        <tr>
                            <th>Offre</th>
                            <th>Code</th>
                            <th>SKU attendu</th>
                            <th>Produit WooCommerce</th>
                            <th>Duree (jours)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($definitions as $definition) : ?>
                            <?php
                            $code = sanitize_key((string) ($definition['code'] ?? ''));
                            $sku = sanitize_text_field((string) ($definition['sku'] ?? ''));
                            $default_duration = absint($definition['durationDays'] ?? 0);
                            $rule = isset($rules[$code]) && is_array($rules[$code]) ? $rules[$code] : array();
                            $selected_product_id = absint($rule['product_id'] ?? 0);
                            $selected_duration = absint($rule['duration_days'] ?? 0);
                            ?>
                            <tr>
                                <td><strong><?php echo esc_html(platform_2424_format_pricing_row_label($definition)); ?></strong></td>
                                <td><code><?php echo esc_html($code); ?></code></td>
                                <td><code><?php echo esc_html($sku); ?></code></td>
                                <td>
                                    <select name="platform_2424_pricing_rules[<?php echo esc_attr($code); ?>][product_id]" style="min-width: 280px;">
                                        <option value="0">Detection auto par SKU</option>
                                        <?php foreach ($products as $product) : ?>
                                            <option value="<?php echo esc_attr((string) $product['id']); ?>" <?php selected($selected_product_id, (int) $product['id']); ?>>
                                                <?php
                                                echo esc_html(
                                                    '#' . (int) $product['id'] . ' - ' . (string) $product['title'] .
                                                    ((string) $product['sku'] !== '' ? ' [' . (string) $product['sku'] . ']' : '')
                                                );
                                                ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        class="small-text"
                                        name="platform_2424_pricing_rules[<?php echo esc_attr($code); ?>][duration_days]"
                                        value="<?php echo esc_attr((string) ($selected_duration > 0 ? $selected_duration : $default_duration)); ?>"
                                    />
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <p class="description" style="margin-top: 12px;">
                    Exemple: vous pouvez passer une offre de <code>30</code> jours a <code>20</code> jours sans changer le code ni le SKU.
                </p>
                <?php submit_button('Enregistrer les tarifs'); ?>
            </form>
        </div>
        <?php
    }

    function platform_2424_render_papi_tab() {
        $callback_url = function_exists('platform_2424_papi_notification_url') ? platform_2424_papi_notification_url() : '';
        $health = function_exists('platform_2424_papi_configuration_status')
            ? platform_2424_papi_configuration_status()
            : array('enabled' => false, 'hasApiKey' => false, 'hasWebhookSecret' => false, 'ready' => false);
        $legacy_gateway_settings = get_option('woocommerce_papi_gateway_settings', array());
        $legacy_api_key_available = is_array($legacy_gateway_settings) && trim((string) ($legacy_gateway_settings['api_key'] ?? '')) !== '';
        $import_status = sanitize_key((string) ($_GET['papi-key-import'] ?? ''));
        ?>
        <div style="margin-top: 16px;">
            <?php if ($import_status === 'imported') : ?>
                <div class="notice notice-success inline"><p>La clé existante a été importée dans 2424. Elle n’est pas affichée.</p></div>
            <?php elseif ($import_status === 'already-configured') : ?>
                <div class="notice notice-info inline"><p>Une clé API est déjà configurée dans 2424. Aucun remplacement n’a été effectué.</p></div>
            <?php elseif ($import_status === 'missing') : ?>
                <div class="notice notice-warning inline"><p>Aucune clé API n’a été trouvée dans le gateway existant.</p></div>
            <?php endif; ?>
            <table class="widefat striped" style="max-width: 720px; margin-bottom: 18px;">
                <tbody>
                    <tr><td>Pont de paiement activé</td><td><?php echo $health['enabled'] ? 'Oui' : 'Non'; ?></td></tr>
                    <tr><td>Clé API configurée</td><td><?php echo $health['hasApiKey'] ? 'Oui' : 'Non'; ?></td></tr>
                    <tr><td>Secret de signature configuré</td><td><?php echo $health['hasWebhookSecret'] ? 'Oui' : 'Non'; ?></td></tr>
                    <tr><td>État</td><td><strong><?php echo $health['ready'] ? 'Prêt à recevoir des paiements' : 'Configuration incomplète'; ?></strong></td></tr>
                    <tr><td>URL de notification</td><td><code><?php echo esc_html($callback_url); ?></code><p class="description">Transmise automatiquement lors de la création de chaque lien de paiement.</p></td></tr>
                </tbody>
            </table>
            <form method="post" action="options.php">
                <?php settings_fields(PLATFORM_2424_SETTINGS_GROUP_PAPI); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="platform_2424_papi_enabled">Activer le pont PAPI</label></th>
                        <td>
                            <?php $enabled = (string) get_option('platform_2424_papi_enabled', 'no'); ?>
                            <input type="hidden" name="platform_2424_papi_enabled" value="no" />
                            <label><input type="checkbox" id="platform_2424_papi_enabled" name="platform_2424_papi_enabled" value="yes" <?php checked($enabled, 'yes'); ?> /> Autoriser les nouveaux paiements PAPI depuis 2424</label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_papi_api_key">Clé API</label></th>
                        <td><input type="password" id="platform_2424_papi_api_key" name="platform_2424_papi_api_key" value="" class="regular-text code" autocomplete="new-password" placeholder="<?php echo $health['hasApiKey'] ? 'Clé déjà configurée' : ''; ?>" /><p class="description">Laissez vide pour conserver la clé actuelle.</p></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_papi_webhook_secret">Secret de signature</label></th>
                        <td>
                            <input type="password" id="platform_2424_papi_webhook_secret" name="platform_2424_papi_webhook_secret" value="" class="regular-text code" autocomplete="new-password" placeholder="<?php echo $health['hasWebhookSecret'] ? 'Secret déjà configuré' : ''; ?>" />
                            <p class="description">Secret <code>pwhsec_…</code> utilisé exclusivement pour vérifier <code>X-Papi-Signature</code>.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_papi_link_valid_duration_hours">Validité des liens</label></th>
                        <td><input type="number" min="1" max="72" id="platform_2424_papi_link_valid_duration_hours" name="platform_2424_papi_link_valid_duration_hours" value="<?php echo esc_attr((string) get_option('platform_2424_papi_link_valid_duration_hours', '1')); ?>" class="small-text" /> heures</td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_papi_test_mode">Mode test</label></th>
                        <td>
                            <?php $test_mode = (string) get_option('platform_2424_papi_test_mode', 'no'); ?>
                            <input type="hidden" name="platform_2424_papi_test_mode" value="no" />
                            <label><input type="checkbox" id="platform_2424_papi_test_mode" name="platform_2424_papi_test_mode" value="yes" <?php checked($test_mode, 'yes'); ?> /> Créer les liens en mode test PAPI</label>
                        </td>
                    </tr>
                </table>
                <?php submit_button('Enregistrer la configuration PAPI'); ?>
            </form>
            <?php if ($legacy_api_key_available && !$health['hasApiKey']) : ?>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-top: 12px;">
                    <input type="hidden" name="action" value="platform_2424_import_papi_gateway_key" />
                    <?php wp_nonce_field('platform_2424_import_papi_gateway_key'); ?>
                    <?php submit_button('Importer la clé existante du gateway', 'secondary', 'submit', false); ?>
                </form>
            <?php endif; ?>
        </div>
        <?php
    }

    function mvola_get_token() {
        if (!function_exists('platform_2424_get_mvola_api')) {
            return '';
        }

        try {
            $api = platform_2424_get_mvola_api();
            return $api->get_access_token();
        } catch (Exception $exception) {
            platform_2424_log('error', 'Mvola token request failed.', array(
                'module' => 'billing',
                'message' => $exception->getMessage(),
            ));
            return '';
        }
    }

    function platform_2424_mvola_token_transient_key() {
        return 'platform_2424_mvola_token_' . get_current_user_id();
    }

    function platform_2424_render_mvola_tab() {
        $token = (string) get_transient(platform_2424_mvola_token_transient_key());
        $status = isset($_GET['mvola_status']) ? sanitize_key((string) $_GET['mvola_status']) : '';
        ?>
        <div style="margin-top: 16px;">
            <form method="post" action="options.php" style="margin-bottom: 32px;">
                <?php settings_fields(PLATFORM_2424_SETTINGS_GROUP_MVOLA); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="platform_2424_mvola_enabled">Activer MVola</label></th>
                        <td>
                            <?php $enabled = (string) get_option('platform_2424_mvola_enabled', 'no'); ?>
                            <label>
                                <input type="checkbox" id="platform_2424_mvola_enabled" name="platform_2424_mvola_enabled" value="yes" <?php checked($enabled, 'yes'); ?> />
                                Activer les paiements MVola dans les checkouts headless
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_mvola_sandbox">Mode sandbox</label></th>
                        <td>
                            <?php $sandbox = (string) get_option('platform_2424_mvola_sandbox', 'yes'); ?>
                            <label>
                                <input type="checkbox" id="platform_2424_mvola_sandbox" name="platform_2424_mvola_sandbox" value="yes" <?php checked($sandbox, 'yes'); ?> />
                                Utiliser l'API de test MVola
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_mvola_consumer_key">Consumer Key</label></th>
                        <td><input type="text" id="platform_2424_mvola_consumer_key" name="platform_2424_mvola_consumer_key" value="<?php echo esc_attr((string) get_option('platform_2424_mvola_consumer_key', '')); ?>" class="regular-text code" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_mvola_consumer_secret">Consumer Secret</label></th>
                        <td><input type="password" id="platform_2424_mvola_consumer_secret" name="platform_2424_mvola_consumer_secret" value="<?php echo esc_attr((string) get_option('platform_2424_mvola_consumer_secret', '')); ?>" class="regular-text code" autocomplete="new-password" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_mvola_merchant_number">Numero marchand</label></th>
                        <td><input type="text" id="platform_2424_mvola_merchant_number" name="platform_2424_mvola_merchant_number" value="<?php echo esc_attr((string) get_option('platform_2424_mvola_merchant_number', '')); ?>" class="regular-text code" placeholder="0343500004" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_mvola_partner_name">Partner Name</label></th>
                        <td><input type="text" id="platform_2424_mvola_partner_name" name="platform_2424_mvola_partner_name" value="<?php echo esc_attr((string) get_option('platform_2424_mvola_partner_name', get_bloginfo('name'))); ?>" class="regular-text" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_mvola_callback_secret">Secret callback public</label></th>
                        <td>
                            <input type="password" id="platform_2424_mvola_callback_secret" name="platform_2424_mvola_callback_secret" value="<?php echo esc_attr((string) get_option('platform_2424_mvola_callback_secret', '')); ?>" class="regular-text code" autocomplete="new-password" />
                            <p class="description">Ajoute un token secret a l'URL callback publique Next pour filtrer les callbacks entrants.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="platform_2424_mvola_polling_interval_seconds">Intervalle polling (s)</label></th>
                        <td>
                            <input type="number" min="5" step="1" id="platform_2424_mvola_polling_interval_seconds" name="platform_2424_mvola_polling_interval_seconds" value="<?php echo esc_attr((string) get_option('platform_2424_mvola_polling_interval_seconds', '10')); ?>" class="small-text" />
                            <p class="description">Utilise cote frontend pour le rythme de verification pendant l'attente utilisateur.</p>
                        </td>
                    </tr>
                </table>
                <p class="description">Le callback public attendu sera : <code><?php echo esc_html(function_exists('platform_2424_build_mvola_callback_url') ? platform_2424_build_mvola_callback_url() : ''); ?></code></p>
                <?php submit_button('Enregistrer la configuration MVola'); ?>
            </form>

            <p>
                Generez ici un token Mvola de developpement. Le token est conserve temporairement cote admin pour faciliter la copie,
                puis expire automatiquement avant la fin de validite du token.
            </p>

            <?php if ($status === 'success') : ?>
                <div class="notice notice-success inline"><p>Token Mvola genere avec succes.</p></div>
            <?php elseif ($status === 'error') : ?>
                <div class="notice notice-error inline"><p>Impossible de generer le token Mvola pour le moment. Consultez les logs du plugin.</p></div>
            <?php endif; ?>

            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin: 16px 0;">
                <input type="hidden" name="action" value="platform_2424_generate_mvola_token" />
                <?php wp_nonce_field('platform_2424_generate_mvola_token'); ?>
                <?php submit_button('Generer un token Mvola', 'primary', 'submit', false); ?>
            </form>

            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="platform_2424_mvola_token">Token genere</label></th>
                    <td>
                        <input
                            type="text"
                            id="platform_2424_mvola_token"
                            class="large-text code"
                            value="<?php echo esc_attr($token); ?>"
                            readonly
                            placeholder="Cliquez sur Generer un token Mvola"
                        />
                        <p style="margin-top: 10px;">
                            <button type="button" class="button" id="platform_2424_copy_mvola_token" <?php disabled($token === ''); ?>>
                                Copier le token
                            </button>
                            <span id="platform_2424_copy_mvola_token_feedback" style="margin-left: 8px;"></span>
                        </p>
                        <p class="description">
                            Ne partagez pas ce token en dehors des tests techniques. Il donne acces aux appels API Mvola tant qu'il est valide.
                        </p>
                    </td>
                </tr>
            </table>
            <script>
                (function () {
                    var copyButton = document.getElementById('platform_2424_copy_mvola_token');
                    var tokenInput = document.getElementById('platform_2424_mvola_token');
                    var feedback = document.getElementById('platform_2424_copy_mvola_token_feedback');
                    if (!copyButton || !tokenInput) {
                        return;
                    }

                    copyButton.addEventListener('click', function () {
                        tokenInput.select();
                        tokenInput.setSelectionRange(0, tokenInput.value.length);

                        var copyPromise = navigator.clipboard && navigator.clipboard.writeText
                            ? navigator.clipboard.writeText(tokenInput.value)
                            : new Promise(function (resolve, reject) {
                                try {
                                    document.execCommand('copy');
                                    resolve();
                                } catch (error) {
                                    reject(error);
                                }
                            });

                        copyPromise.then(function () {
                            if (feedback) {
                                feedback.textContent = 'Token copie.';
                            }
                        }).catch(function () {
                            if (feedback) {
                                feedback.textContent = 'Copie impossible, selectionnez le champ manuellement.';
                            }
                        });
                    });
                })();
            </script>
        </div>
        <?php
    }

    function platform_2424_get_logs() {
        $logs = get_option(PLATFORM_2424_LOG_OPTION, array());
        return is_array($logs) ? $logs : array();
    }

    function platform_2424_get_log_modules() {
        return array(
            'general' => 'Général',
            'auth' => 'Authentification',
            'email' => 'Emails',
            'submissions' => 'Soumissions',
            'billing' => 'Facturation',
            'revalidate' => 'Revalidation',
            'notifications' => 'Notifications',
            'messaging' => 'Messagerie',
        );
    }

    function platform_2424_sanitize_log_module($module) {
        $module = sanitize_key((string) $module);
        $modules = platform_2424_get_log_modules();

        if (!isset($modules[$module])) {
            return 'general';
        }

        return $module;
    }

    function platform_2424_clear_logs() {
        delete_option(PLATFORM_2424_LOG_OPTION);
    }

    function platform_2424_get_log_level() {
        return platform_2424_sanitize_log_level(get_option('platform_2424_log_level', 'error'));
    }

    function platform_2424_logs_are_enabled() {
        return (string) get_option('platform_2424_logs_enabled', 'yes') === 'yes';
    }

    function platform_2424_log_enabled($level) {
        $levels = array(
            'off' => -1,
            'error' => 0,
            'warning' => 1,
            'info' => 2,
            'debug' => 3,
        );
        if (!platform_2424_logs_are_enabled()) {
            return false;
        }

        $level = sanitize_key((string) $level);
        $configured_level = platform_2424_get_log_level();

        return isset($levels[$level], $levels[$configured_level])
            && $levels[$configured_level] >= 0
            && $levels[$level] <= $levels[$configured_level];
    }

    function platform_2424_log_event($level, $module, $message, $context = array()) {
        $level = sanitize_key((string) $level);
        if (!in_array($level, array('debug', 'info', 'warning', 'error'), true)) {
            $level = 'info';
        }

        if (!platform_2424_log_enabled($level)) {
            return;
        }

        $module = platform_2424_sanitize_log_module($module);

        $message = trim((string) $message);
        if ($message === '') {
            return;
        }

        $sanitized_context = array();
        if (is_array($context)) {
            foreach ($context as $key => $value) {
                $context_key = sanitize_key((string) $key);
                if ($context_key === '') {
                    continue;
                }
                if ($context_key === 'module') {
                    continue;
                }

                if (is_scalar($value) || $value === null) {
                    $sanitized_context[$context_key] = substr((string) $value, 0, 512);
                    continue;
                }

                $json = wp_json_encode($value);
                $sanitized_context[$context_key] = is_string($json) ? substr($json, 0, 512) : '[unserializable]';
            }
        }

        $logs = platform_2424_get_logs();
        array_unshift($logs, array(
            'time' => gmdate('c'),
            'level' => $level,
            'module' => $module,
            'message' => $message,
            'context' => $sanitized_context,
        ));

        if (count($logs) > PLATFORM_2424_LOG_LIMIT) {
            $logs = array_slice($logs, 0, PLATFORM_2424_LOG_LIMIT);
        }

        update_option(PLATFORM_2424_LOG_OPTION, $logs, false);
    }

    function platform_2424_log($level, $message, $context = array()) {
        $module = 'general';
        if (is_array($context) && isset($context['module'])) {
            $module = platform_2424_sanitize_log_module($context['module']);
            unset($context['module']);
        }

        platform_2424_log_event($level, $module, $message, $context);
    }

    function platform_2424_render_logs_tab() {
        $logs = platform_2424_get_logs();
        $selected_level = isset($_GET['log_level']) ? sanitize_key((string) $_GET['log_level']) : '';
        $raw_selected_module = isset($_GET['log_module']) ? sanitize_key((string) $_GET['log_module']) : '';
        $current_page = isset($_GET['log_page']) ? max(1, absint($_GET['log_page'])) : 1;
        $page_size = 50;
        $modules = platform_2424_get_log_modules();
        $selected_module = ($raw_selected_module !== '' && isset($modules[$raw_selected_module])) ? $raw_selected_module : '';

        if ($selected_level !== '' && !in_array($selected_level, array('debug', 'info', 'warning', 'error'), true)) {
            $selected_level = '';
        }

        if ($selected_module !== '') {
            $logs = array_values(array_filter($logs, function ($entry) use ($selected_module) {
                return (string) ($entry['module'] ?? 'general') === $selected_module;
            }));
        }

        if ($selected_level !== '') {
            $logs = array_values(array_filter($logs, function ($entry) use ($selected_level) {
                return (string) ($entry['level'] ?? 'info') === $selected_level;
            }));
        }

        $total_logs = count($logs);
        $total_pages = max(1, (int) ceil($total_logs / $page_size));
        if ($current_page > $total_pages) {
            $current_page = $total_pages;
        }

        $offset = ($current_page - 1) * $page_size;
        $paged_logs = array_slice($logs, $offset, $page_size);
        $range_start = $total_logs > 0 ? $offset + 1 : 0;
        $range_end = $total_logs > 0 ? min($offset + $page_size, $total_logs) : 0;

        $base_query_args = array(
            'page' => 'platform-2424-settings',
            'tab' => 'logs',
        );
        if ($selected_module !== '') {
            $base_query_args['log_module'] = $selected_module;
        }
        if ($selected_level !== '') {
            $base_query_args['log_level'] = $selected_level;
        }

        $reset_logs_url = admin_url('options-general.php?page=platform-2424-settings&tab=logs');
        $pagination_links = paginate_links(array(
            'base' => add_query_arg(array_merge($base_query_args, array('log_page' => '%#%')), admin_url('options-general.php')),
            'format' => '',
            'current' => $current_page,
            'total' => $total_pages,
            'type' => 'array',
            'prev_text' => '&laquo;',
            'next_text' => '&raquo;',
        ));
        ?>
        <div class="platform-2424-tab-content">
            <section class="platform-2424-card platform-2424-log-settings">
                <div class="platform-2424-card-heading">
                    <div>
                        <p class="platform-2424-eyebrow">Observabilité</p>
                        <h2>Collecte des logs</h2>
                        <p>Activez la collecte uniquement lorsque vous en avez besoin. Les journaux déjà enregistrés sont conservés.</p>
                    </div>
                </div>
                <form method="post" action="options.php" class="platform-2424-inline-settings">
                    <?php settings_fields(PLATFORM_2424_SETTINGS_GROUP_LOGS); ?>
                    <?php $logs_enabled = platform_2424_logs_are_enabled(); ?>
                    <label class="platform-2424-switch-row" for="platform_2424_logs_enabled">
                        <span>
                            <strong>Activer les logs</strong>
                            <small>Enregistre les événements selon le niveau choisi.</small>
                        </span>
                        <span class="platform-2424-switch">
                            <input type="hidden" name="platform_2424_logs_enabled" value="no" />
                            <input type="checkbox" id="platform_2424_logs_enabled" name="platform_2424_logs_enabled" value="yes" <?php checked($logs_enabled); ?> />
                            <span aria-hidden="true"></span>
                        </span>
                    </label>
                    <label class="platform-2424-select-row" for="platform_2424_log_level">
                        <span><strong>Niveau de détail</strong></span>
                        <select id="platform_2424_log_level" name="platform_2424_log_level">
                            <option value="error" <?php selected(platform_2424_get_log_level(), 'error'); ?>>Erreur</option>
                            <option value="warning" <?php selected(platform_2424_get_log_level(), 'warning'); ?>>Avertissement</option>
                            <option value="info" <?php selected(platform_2424_get_log_level(), 'info'); ?>>Information</option>
                            <option value="debug" <?php selected(platform_2424_get_log_level(), 'debug'); ?>>Debug</option>
                        </select>
                    </label>
                    <?php submit_button('Enregistrer les logs', 'primary', 'submit', false); ?>
                </form>
            </section>
            <section class="platform-2424-card">
                <div class="platform-2424-card-heading">
                    <div>
                        <p class="platform-2424-eyebrow">Historique</p>
                        <h2>Journaux du plugin</h2>
                    </div>
                </div>
            <p>Consultez ici les derniers événements du plugin, avec un module et un niveau pour retrouver plus vite un incident.</p>
            <form method="get" action="<?php echo esc_url(admin_url('options-general.php')); ?>" style="display:flex; gap:12px; align-items:flex-end; margin:16px 0; flex-wrap:wrap;">
                <input type="hidden" name="page" value="platform-2424-settings" />
                <input type="hidden" name="tab" value="logs" />
                <div>
                    <label for="platform_2424_log_module"><strong>Module</strong></label><br />
                    <select id="platform_2424_log_module" name="log_module">
                        <option value="">Tous</option>
                        <?php foreach ($modules as $module_key => $module_label) : ?>
                            <option value="<?php echo esc_attr($module_key); ?>" <?php selected($selected_module, $module_key); ?>>
                                <?php echo esc_html($module_label); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label for="platform_2424_logs_filter_level"><strong>Niveau</strong></label><br />
                    <select id="platform_2424_logs_filter_level" name="log_level">
                        <option value="">Tous</option>
                        <option value="debug" <?php selected($selected_level, 'debug'); ?>>DEBUG</option>
                        <option value="info" <?php selected($selected_level, 'info'); ?>>INFO</option>
                        <option value="warning" <?php selected($selected_level, 'warning'); ?>>WARNING</option>
                        <option value="error" <?php selected($selected_level, 'error'); ?>>ERROR</option>
                    </select>
                </div>
                <?php submit_button('Filtrer', 'secondary', 'submit', false); ?>
                <a class="button" href="<?php echo esc_url($reset_logs_url); ?>">Réinitialiser</a>
            </form>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin: 16px 0;">
                <?php wp_nonce_field('platform_2424_clear_logs'); ?>
                <input type="hidden" name="action" value="platform_2424_clear_logs" />
                <?php submit_button('Vider les logs', 'delete', 'submit', false); ?>
            </form>
            <?php if (isset($_GET['logs-cleared']) && $_GET['logs-cleared'] === '1') : ?>
                <div class="notice notice-success inline"><p>Les logs ont été vidés.</p></div>
            <?php endif; ?>
            <?php if (empty($logs)) : ?>
                <p>Aucun log enregistré pour le moment.</p>
            <?php else : ?>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin:12px 0;">
                    <p style="margin:0;">
                        <?php
                        printf(
                            'Affichage de %1$d à %2$d sur %3$d log(s).',
                            (int) $range_start,
                            (int) $range_end,
                            (int) $total_logs
                        );
                        ?>
                    </p>
                    <p style="margin:0;"><?php echo esc_html('Page ' . $current_page . ' / ' . $total_pages); ?></p>
                </div>
                <table class="widefat striped">
                    <thead>
                        <tr>
                            <th style="width: 180px;">Date UTC</th>
                            <th style="width: 90px;">Niveau</th>
                            <th style="width: 140px;">Module</th>
                            <th>Message</th>
                            <th>Contexte</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($paged_logs as $entry) : ?>
                            <tr>
                                <td><code><?php echo esc_html((string) ($entry['time'] ?? '')); ?></code></td>
                                <td><strong><?php echo esc_html(strtoupper((string) ($entry['level'] ?? 'INFO'))); ?></strong></td>
                                <td><?php echo esc_html((string) ($modules[$entry['module'] ?? 'general'] ?? 'Général')); ?></td>
                                <td><?php echo esc_html((string) ($entry['message'] ?? '')); ?></td>
                                <td>
                                    <?php
                                    $context = isset($entry['context']) && is_array($entry['context']) ? $entry['context'] : array();
                                    if (empty($context)) {
                                        echo '&mdash;';
                                    } else {
                                        foreach ($context as $context_key => $context_value) {
                                            echo '<div><code>' . esc_html((string) $context_key) . '</code>: ' . esc_html((string) $context_value) . '</div>';
                                        }
                                    }
                                    ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <?php if (!empty($pagination_links)) : ?>
                    <div class="tablenav" style="margin-top:12px;">
                        <div class="tablenav-pages" style="float:none;">
                            <span class="pagination-links">
                                <?php foreach ($pagination_links as $link) : ?>
                                    <?php echo wp_kses_post($link); ?>
                                <?php endforeach; ?>
                            </span>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
            </section>
        </div>
        <?php
    }
    function platform_2424_get_setting($env_key, $option_key, $default = '') {
        $stored = get_option($option_key, '');
        if (is_string($stored) && trim($stored) !== '') {
            return trim((string) $stored);
        }

        $env_value = getenv((string) $env_key);
        if (is_string($env_value) && trim($env_value) !== '') {
            return trim((string) $env_value);
        }

        return $default;
    }

    function platform_2424_get_public_site_url() {
        $configured = platform_2424_get_setting('PLATFORM_PUBLIC_SITE_URL', 'platform_2424_public_site_url', '');
        if ($configured !== '') {
            return untrailingslashit((string) $configured);
        }

        if (defined('PLATFORM_PUBLIC_SITE_URL') && PLATFORM_PUBLIC_SITE_URL) {
            return untrailingslashit((string) PLATFORM_PUBLIC_SITE_URL);
        }

        $env_public_site_url = getenv('PLATFORM_PUBLIC_SITE_URL');
        if (is_string($env_public_site_url) && trim($env_public_site_url) !== '') {
            return untrailingslashit(trim((string) $env_public_site_url));
        }

        $next_public_site_url = getenv('NEXT_PUBLIC_SITE_URL');
        if (is_string($next_public_site_url) && trim($next_public_site_url) !== '') {
            return untrailingslashit(trim((string) $next_public_site_url));
        }

        if (defined('APP_BASE_URL') && APP_BASE_URL) {
            return untrailingslashit((string) APP_BASE_URL);
        }

        $app_base_url = getenv('APP_BASE_URL');
        if (is_string($app_base_url) && trim($app_base_url) !== '') {
            return untrailingslashit(trim((string) $app_base_url));
        }

        // Never fall back to WordPress's own URL: user-facing links must lead to Next.
        return 'https://tanyora.mijary.tech';
    }

    function platform_2424_get_editorial_source_graphql_url() {
        return platform_2424_get_setting(
            'PLATFORM_EDITORIAL_SOURCE_GRAPHQL_URL',
            'platform_2424_editorial_source_graphql_url',
            ''
        );
    }

    function platform_2424_get_support_email() {
        $configured = platform_2424_get_setting('PLATFORM_SUPPORT_EMAIL', 'platform_2424_support_email', '');
        if ($configured !== '') {
            return sanitize_email((string) $configured);
        }

        $site_host = wp_parse_url(platform_2424_get_public_site_url(), PHP_URL_HOST);
        $site_host = is_string($site_host) ? preg_replace('/^www\./i', '', trim($site_host)) : '';
        if ($site_host !== '') {
            return 'contact@' . $site_host;
        }

        return 'contact@2424.mg';
    }

    function platform_2424_get_email_logo_url() {
        $configured = platform_2424_get_setting('PLATFORM_EMAIL_LOGO_URL', 'platform_2424_email_logo_url', '');
        if ($configured !== '') {
            $configured_path = (string) wp_parse_url($configured, PHP_URL_PATH);
            $configured_host = (string) wp_parse_url($configured, PHP_URL_HOST);
            $site_host = (string) wp_parse_url(platform_2424_get_public_site_url(), PHP_URL_HOST);

            // Migrate only the legacy built-in logo, never a separately hosted custom logo.
            if (preg_match('#/logo\.png$#i', $configured_path) && ($configured_host === '' || strcasecmp($configured_host, $site_host) === 0)) {
                return trailingslashit(platform_2424_get_public_site_url()) . 'email-logo.png';
            }

            return esc_url_raw((string) $configured);
        }

        // PNG is deliberately used here because several mail clients do not
        // render SVG images consistently in transactional emails.
        return trailingslashit(platform_2424_get_public_site_url()) . 'email-logo.png';
    }

    function platform_2424_get_email_dispatcher_endpoint() {
        return platform_2424_get_setting('EMAIL_DISPATCHER_LAMBDA_URL', 'platform_2424_email_dispatcher_lambda_url', '');
    }

    function platform_2424_get_email_dispatcher_secret() {
        return platform_2424_get_setting('EMAIL_DISPATCHER_SHARED_SECRET', 'platform_2424_email_dispatcher_shared_secret', '');
    }

    function platform_2424_get_web_push_config() {
        $public_key = trim((string) get_option('platform_2424_vapid_public_key', ''));
        $private_key = trim((string) get_option('platform_2424_vapid_private_key', ''));
        $subject = trim((string) get_option('platform_2424_vapid_subject', 'mailto:contact@2424.mg'));

        return array(
            'configured' => $public_key !== '' && $private_key !== '' && $subject !== '',
            'publicKey' => $public_key,
            'privateKey' => $private_key,
            'subject' => $subject,
        );
    }

    function platform_2424_get_email_preferences_secret() {
        $secret = platform_2424_get_setting('EMAIL_PREFERENCES_SECRET', 'platform_2424_email_preferences_secret', '');
        if ($secret !== '') {
            return $secret;
        }

        if (function_exists('platform_auth_secret')) {
            $secret = (string) platform_auth_secret();
            if ($secret !== '') {
                return $secret;
            }
        }

        if (defined('PLATFORM_SUBMISSIONS_SECRET') && PLATFORM_SUBMISSIONS_SECRET) {
            return (string) PLATFORM_SUBMISSIONS_SECRET;
        }

        $env = getenv('PLATFORM_SUBMISSIONS_SECRET');
        return is_string($env) ? trim($env) : '';
    }

    function platform_2424_base64url_encode($value) {
        return rtrim(strtr(base64_encode((string) $value), '+/', '-_'), '=');
    }

    function platform_2424_build_notification_unsubscribe_url($email) {
        $email = sanitize_email((string) $email);
        if (!$email) {
            return platform_2424_get_public_site_url() . '/profil/modifier';
        }

        $secret = platform_2424_get_email_preferences_secret();
        if ($secret === '') {
            return platform_2424_get_public_site_url() . '/profil/modifier';
        }

        $expires = gmdate('c', time() + (30 * DAY_IN_SECONDS));
        $payload = 'notification-email-unsubscribe:' . strtolower($email) . ':' . $expires;
        $signature = platform_2424_base64url_encode(hash_hmac('sha256', $payload, $secret, true));
        return add_query_arg(array(
            'email' => strtolower($email),
            'expires' => $expires,
            'signature' => $signature,
        ), platform_2424_get_public_site_url() . '/desinscription');
    }

    function platform_2424_get_email_branding() {
        $site_url = platform_2424_get_public_site_url();
        $site_host = wp_parse_url($site_url, PHP_URL_HOST);
        $site_host = is_string($site_host) && trim($site_host) !== '' ? preg_replace('/^www\./i', '', trim($site_host)) : '2424.mg';

        return array(
            'site_url' => $site_url,
            'site_host_label' => $site_host,
            'logo_url' => platform_2424_get_email_logo_url(),
            'support_email' => platform_2424_get_support_email(),
            'location_label' => 'Antananarivo, Madagascar',
            'youtube_url' => 'https://www.youtube.com/channel/UCcjS1Us2l3yB8lLsDu3Vr6w',
            'x_url' => 'https://twitter.com/2424_mg',
            'instagram_url' => 'https://www.instagram.com/2424.mg/',
            'facebook_url' => 'https://web.facebook.com/2424.mg/',
        );
    }

    function platform_2424_render_transactional_email_shell($args) {
        $branding = platform_2424_get_email_branding();
        $title = isset($args['title']) ? (string) $args['title'] : '';
        $preheader = isset($args['preheader']) ? (string) $args['preheader'] : '';
        $body_html = isset($args['body_html']) ? (string) $args['body_html'] : '';
        $cta_label = isset($args['cta_label']) ? trim((string) $args['cta_label']) : '';
        $cta_url = isset($args['cta_url']) ? esc_url((string) $args['cta_url']) : '';

        ob_start();
        ?>
<!doctype html>
<html lang="fr">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo esc_html($title); ?></title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f5f5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      <?php echo esc_html($preheader !== '' ? $preheader : $title); ?>
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;margin:0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;margin:0 auto;">
            <tr>
              <td style="padding:32px 36px 28px 36px;font-family:'Roboto Flex',Arial,Helvetica,sans-serif;color:#111111;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom:40px;">
                      <img src="<?php echo esc_url($branding['logo_url']); ?>" alt="<?php echo esc_attr($branding['site_host_label']); ?>" width="134" style="display:block;width:134px;max-width:134px;height:auto;border:0;" />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:10px;">
                      <div style="margin:0;font-size:24px;line-height:24px;font-weight:700;color:#cc202a;">
                        <?php echo esc_html($title); ?>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:0 24px 24px 24px;">
                      <div style="margin:0;font-size:12px;line-height:18px;font-weight:400;color:#111111;text-align:left;">
                        <?php echo wp_kses_post($body_html); ?>
                      </div>
                    </td>
                  </tr>
                  <?php if ($cta_label !== '' && $cta_url !== '') : ?>
                  <tr>
                    <td align="center" style="padding-bottom:40px;">
                      <a href="<?php echo esc_url($cta_url); ?>" style="display:inline-block;min-width:246px;background-color:#cc202a;border-radius:6px;color:#ffffff;font-size:12px;line-height:40px;font-weight:400;text-align:center;text-decoration:none;padding:0 20px;">
                        <?php echo esc_html($cta_label); ?>
                      </a>
                    </td>
                  </tr>
                  <?php endif; ?>
                  <tr>
                    <td align="center" style="padding-bottom:8px;">
                      <div style="margin:0;font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        <strong>24/24 MG</strong> &mdash; Votre nouvelle plateforme d&apos;information qui ne dort jamais, qui ne s&apos;arr&ecirc;te jamais, et qui ne vous laisse jamais sans r&eacute;ponse
                      </div>
                      <div style="margin:0;font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        Actualit&eacute;s, analyses et faits marquants &agrave; Madagascar et dans le monde.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:10px;">
                      <div style="font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        <a href="<?php echo esc_url($branding['site_url']); ?>" style="color:#2563eb;text-decoration:underline;"><?php echo esc_html($branding['site_host_label']); ?></a>
                        <span style="color:#6b7280;">&nbsp;-&nbsp;<?php echo esc_html($branding['location_label']); ?>&nbsp;-&nbsp;</span>
                        <a href="mailto:<?php echo esc_attr($branding['support_email']); ?>" style="color:#2563eb;text-decoration:underline;"><?php echo esc_html($branding['support_email']); ?></a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:6px;">
                      <div style="font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        Suivez-nous :
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <div style="font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        <a href="<?php echo esc_url($branding['youtube_url']); ?>" style="color:#6b7280;text-decoration:none;">YouTube</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="<?php echo esc_url($branding['x_url']); ?>" style="color:#6b7280;text-decoration:none;">X</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="<?php echo esc_url($branding['instagram_url']); ?>" style="color:#6b7280;text-decoration:none;">Instagram</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="<?php echo esc_url($branding['facebook_url']); ?>" style="color:#6b7280;text-decoration:none;">Facebook</a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
        <?php
        return (string) ob_get_clean();
    }

    function platform_2424_plain_text_to_email_html($message) {
        $message = trim((string) $message);
        if ($message === '') {
            return '';
        }

        $blocks = preg_split("/\r\n\r\n|\n\n|\r\r/", $message);
        if (!is_array($blocks)) {
            $blocks = array($message);
        }

        $parts = array();
        foreach ($blocks as $block) {
            $block = trim((string) $block);
            if ($block === '') {
                continue;
            }

            $line_html = nl2br(esc_html($block), false);
            $line_html = preg_replace_callback(
                '#(https?://[^\s<]+)#i',
                static function ($matches) {
                    $url = rtrim((string) $matches[1], '.,;:');
                    return '<a href="' . esc_url($url) . '" style="color:#2563eb;text-decoration:underline;word-break:break-all;">' . esc_html($url) . '</a>';
                },
                $line_html
            );

            $parts[] = '<p style="margin:0 0 12px 0;">' . $line_html . '</p>';
        }

        return implode('', $parts);
    }

    function platform_2424_email_headers_contain_html($headers) {
        if (is_array($headers)) {
            $headers = implode("\n", $headers);
        }

        $headers = strtolower((string) $headers);
        return strpos($headers, 'content-type: text/html') !== false;
    }

    function platform_2424_force_html_email_headers($headers) {
        $header_lines = array();
        if (is_array($headers)) {
            $header_lines = $headers;
        } elseif (is_string($headers) && trim($headers) !== '') {
            $header_lines = preg_split('/\r\n|\r|\n/', $headers);
        }

        if (!is_array($header_lines)) {
            $header_lines = array();
        }

        $normalized = array();
        $has_content_type = false;
        foreach ($header_lines as $header_line) {
            $header_line = trim((string) $header_line);
            if ($header_line === '') {
                continue;
            }

            if (stripos($header_line, 'content-type:') === 0) {
                $has_content_type = true;
                $normalized[] = 'Content-Type: text/html; charset=UTF-8';
                continue;
            }

            $normalized[] = $header_line;
        }

        if (!$has_content_type) {
            $normalized[] = 'Content-Type: text/html; charset=UTF-8';
        }

        return $normalized;
    }

    function platform_2424_email_title_from_subject($subject) {
        $subject = trim(wp_strip_all_tags((string) $subject));
        $subject = preg_replace('/^\[[^\]]+\]\s*/', '', $subject);
        return $subject !== '' ? $subject : 'Notification 2424';
    }

    function platform_2424_extract_first_url_from_text($text) {
        if (preg_match('#https?://[^\s<]+#i', (string) $text, $matches)) {
            return rtrim((string) $matches[0], '.,;:');
        }

        return '';
    }

    function platform_2424_filter_plain_wp_mail_to_branded_html($args) {
        if (!is_array($args)) {
            return $args;
        }

        $message = isset($args['message']) ? (string) $args['message'] : '';
        if ($message === '') {
            return $args;
        }

        $support_email = platform_2424_get_support_email();
        $admin_email = sanitize_email((string) get_option('admin_email', ''));
        if ($support_email !== '' && $admin_email !== '' && strcasecmp($support_email, $admin_email) !== 0) {
            $message = str_ireplace($admin_email, $support_email, $message);
            $args['message'] = $message;
        }

        if (platform_2424_email_headers_contain_html($args['headers'] ?? '')) {
            return $args;
        }

        if (preg_match('/<(html|body|table|div|p|br)\b/i', $message)) {
            return $args;
        }

        $title = platform_2424_email_title_from_subject($args['subject'] ?? '');
        $cta_url = platform_2424_extract_first_url_from_text($message);
        $args['message'] = platform_2424_render_transactional_email_shell(array(
            'title' => $title,
            'preheader' => $title,
            'body_html' => platform_2424_plain_text_to_email_html($message),
            'cta_label' => $cta_url !== '' ? 'Ouvrir le lien' : 'Visiter 2424',
            'cta_url' => $cta_url !== '' ? $cta_url : platform_2424_get_public_site_url(),
        ));
        $args['headers'] = platform_2424_force_html_email_headers($args['headers'] ?? array());

        return $args;
    }
    add_filter('wp_mail', 'platform_2424_filter_plain_wp_mail_to_branded_html', 20, 1);

    function platform_2424_customize_woocommerce_mailer($mailer) {
        static $customized = false;

        if ($customized || !is_object($mailer)) {
            return;
        }

        remove_action('woocommerce_email_header', array($mailer, 'email_header'));
        remove_action('woocommerce_email_footer', array($mailer, 'email_footer'));
        add_action('woocommerce_email_header', 'platform_2424_render_woocommerce_email_header', 10, 2);
        add_action('woocommerce_email_footer', 'platform_2424_render_woocommerce_email_footer', 10, 1);

        $customized = true;
    }
    add_action('woocommerce_email', 'platform_2424_customize_woocommerce_mailer', 20, 1);

    function platform_2424_get_woocommerce_order_number($order) {
        if (!is_object($order)) {
            return '';
        }

        if (method_exists($order, 'get_order_number')) {
            return sanitize_text_field((string) $order->get_order_number());
        }

        if (method_exists($order, 'get_id')) {
            return (string) absint($order->get_id());
        }

        return '';
    }

    function platform_2424_get_customer_woocommerce_subject($email_id, $order) {
        $order_number = platform_2424_get_woocommerce_order_number($order);
        if ($order_number === '') {
            return '';
        }

        $email_id = sanitize_key((string) $email_id);
        $suffix = ' — Commande #' . $order_number;

        if (in_array($email_id, array('customer_processing_order', 'customer_completed_order', 'customer_processing_renewal_order', 'customer_completed_renewal_order'), true)) {
            return 'Votre paiement 2424.mg est confirmé' . $suffix;
        }

        if (in_array($email_id, array('customer_on_hold_order', 'customer_invoice', 'customer_renewal_invoice', 'customer_on_hold_renewal_order'), true)) {
            return 'Votre commande 2424.mg est en attente de paiement' . $suffix;
        }

        if (in_array($email_id, array('customer_failed_order', 'customer_failed_renewal_order', 'customer_payment_retry'), true)) {
            return 'Votre paiement 2424.mg n\'a pas abouti' . $suffix;
        }

        if (in_array($email_id, array('customer_cancelled_order', 'customer_cancelled_renewal_order'), true)) {
            return 'Votre commande 2424.mg a été annulée' . $suffix;
        }

        if (in_array($email_id, array('customer_refunded_order', 'customer_refunded_renewal_order'), true)) {
            return 'Votre remboursement 2424.mg est confirmé' . $suffix;
        }

        if ($email_id === 'customer_note') {
            return 'Nouvelle information concernant votre commande 2424.mg' . $suffix;
        }

        return '';
    }

    function platform_2424_filter_customer_woocommerce_subject($subject, $order, $email = null) {
        $email_id = is_object($email) && isset($email->id) ? (string) $email->id : '';
        $custom_subject = platform_2424_get_customer_woocommerce_subject($email_id, $order);

        return $custom_subject !== '' ? $custom_subject : $subject;
    }

    foreach (array(
        'customer_processing_order',
        'customer_completed_order',
        'customer_on_hold_order',
        'customer_invoice',
        'customer_failed_order',
        'customer_cancelled_order',
        'customer_refunded_order',
        'customer_note',
        'customer_processing_renewal_order',
        'customer_completed_renewal_order',
        'customer_on_hold_renewal_order',
        'customer_renewal_invoice',
        'customer_failed_renewal_order',
        'customer_cancelled_renewal_order',
        'customer_refunded_renewal_order',
        'customer_payment_retry',
    ) as $platform_2424_customer_email_id) {
        add_filter('woocommerce_email_subject_' . $platform_2424_customer_email_id, 'platform_2424_filter_customer_woocommerce_subject', 20, 3);
    }

    function platform_2424_get_listing_pricing_code_from_order_item($item) {
        if (!is_object($item) || !method_exists($item, 'get_product')) {
            return '';
        }

        $product = $item->get_product();
        if (!$product || !method_exists($product, 'get_sku')) {
            return '';
        }

        return sanitize_key((string) $product->get_sku());
    }

    function platform_2424_get_listing_order_item_display_label($item) {
        $pricing_code = platform_2424_get_listing_pricing_code_from_order_item($item);
        if ($pricing_code === '' && is_object($item) && method_exists($item, 'get_order')) {
            $order = $item->get_order();
            if ($order && method_exists($order, 'get_meta')) {
                foreach (array('_2424_pricing_code', '_platform_papi_pricingCode') as $meta_key) {
                    $pricing_code = sanitize_key((string) $order->get_meta($meta_key, true));
                    if ($pricing_code !== '') {
                        break;
                    }
                }
            }
        }

        if ($pricing_code === '' || !function_exists('platform_submissions_get_pricing_display_label')) {
            return '';
        }

        return platform_submissions_get_pricing_display_label($pricing_code);
    }

    function platform_2424_set_woocommerce_listing_order_item_name($item_id, $item, $order_id) {
        if (!is_object($item) || !method_exists($item, 'set_name') || !method_exists($item, 'save')) {
            return;
        }

        $label = platform_2424_get_listing_order_item_display_label($item);
        if ($label === '') {
            return;
        }

        $item->set_name($label);
        $item->save();
    }
    add_action('woocommerce_new_order_item', 'platform_2424_set_woocommerce_listing_order_item_name', 20, 3);

    function platform_2424_filter_woocommerce_listing_order_item_name($item_name, $item, $is_visible) {
        $label = platform_2424_get_listing_order_item_display_label($item);
        return $label !== '' ? esc_html($label) : $item_name;
    }
    add_filter('woocommerce_order_item_name', 'platform_2424_filter_woocommerce_listing_order_item_name', 20, 3);

    function platform_2424_render_woocommerce_email_header($email_heading, $email = null) {
        $branding = platform_2424_get_email_branding();
        $email_heading = trim((string) $email_heading);
        ?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=<?php bloginfo('charset'); ?>" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title><?php echo esc_html($branding['site_host_label']); ?></title>
  </head>
  <body <?php echo is_rtl() ? 'rightmargin' : 'leftmargin'; ?>="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="margin:0;padding:0;background-color:#f5f5f5;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" id="outer_wrapper" role="presentation" style="background-color:#f5f5f5;margin:0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_container" role="presentation" style="max-width:560px;background-color:#ffffff;border-radius:12px;margin:0 auto;">
            <tr>
              <td style="padding:32px 36px 28px 36px;font-family:'Roboto Flex',Arial,Helvetica,sans-serif;color:#111111;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                  <tr>
                    <td align="center" style="padding-bottom:40px;">
                      <img src="<?php echo esc_url($branding['logo_url']); ?>" alt="<?php echo esc_attr($branding['site_host_label']); ?>" width="134" style="display:block;width:134px;max-width:134px;height:auto;border:0;" />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" id="header_wrapper" style="padding:0 24px 24px 24px;">
                      <h1 style="margin:0;font-size:24px;line-height:24px;font-weight:700;color:#cc202a;"><?php echo esc_html($email_heading); ?></h1>
                    </td>
                  </tr>
                  <tr>
                    <td valign="top" id="body_content">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                        <tr>
                          <td valign="top" id="body_content_inner_cell">
                            <div id="body_content_inner" style="font-size:12px;line-height:18px;font-weight:400;color:#111111;">
        <?php
    }

    function platform_2424_render_woocommerce_email_footer($email = null) {
        $branding = platform_2424_get_email_branding();
        ?>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top:32px;padding-bottom:8px;">
                      <div style="margin:0;font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        <strong>24/24 MG</strong> &mdash; Votre nouvelle plateforme d&apos;information qui ne dort jamais, qui ne s&apos;arr&ecirc;te jamais, et qui ne vous laisse jamais sans r&eacute;ponse
                      </div>
                      <div style="margin:0;font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        Actualit&eacute;s, analyses et faits marquants &agrave; Madagascar et dans le monde.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" id="credit" style="padding-bottom:10px;">
                      <div style="font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        <a href="<?php echo esc_url($branding['site_url']); ?>" style="color:#2563eb;text-decoration:underline;"><?php echo esc_html($branding['site_host_label']); ?></a>
                        <span style="color:#6b7280;">&nbsp;-&nbsp;<?php echo esc_html($branding['location_label']); ?>&nbsp;-&nbsp;</span>
                        <a href="mailto:<?php echo esc_attr($branding['support_email']); ?>" style="color:#2563eb;text-decoration:underline;"><?php echo esc_html($branding['support_email']); ?></a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:6px;">
                      <div style="font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        Suivez-nous :
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <div style="font-size:8px;line-height:10px;font-weight:400;color:#6b7280;text-align:center;">
                        <a href="<?php echo esc_url($branding['youtube_url']); ?>" style="color:#6b7280;text-decoration:none;">YouTube</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="<?php echo esc_url($branding['x_url']); ?>" style="color:#6b7280;text-decoration:none;">X</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="<?php echo esc_url($branding['instagram_url']); ?>" style="color:#6b7280;text-decoration:none;">Instagram</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="<?php echo esc_url($branding['facebook_url']); ?>" style="color:#6b7280;text-decoration:none;">Facebook</a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
        <?php
    }

    function platform_2424_dispatch_email($payload) {
        $endpoint = platform_2424_get_email_dispatcher_endpoint();
        $shared_secret = platform_2424_get_email_dispatcher_secret();

        if ($endpoint === '' || $shared_secret === '') {
            return new WP_Error('platform_2424_email_dispatcher_missing_config', 'Lambda email dispatcher non configure.', array('status' => 500));
        }

        $response = wp_remote_post($endpoint, array(
            'timeout' => 15,
            'headers' => array(
                'Content-Type' => 'application/json',
                'x-2424-email-secret' => $shared_secret,
            ),
            'body' => wp_json_encode($payload),
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        if ($status < 200 || $status >= 300) {
            return new WP_Error(
                'platform_2424_email_dispatcher_failed',
                'Lambda email dispatcher a retourne une erreur.',
                array(
                    'status' => $status,
                    'body' => wp_remote_retrieve_body($response),
                )
            );
        }

        $decoded = json_decode((string) wp_remote_retrieve_body($response), true);
        return is_array($decoded) ? $decoded : array('ok' => true);
    }

    function platform_2424_normalize_newsletter_form_state($raw) {
        $state = is_array($raw) ? $raw : array();
        $public_site_url = platform_2424_get_public_site_url();

        return array(
            'test_email' => sanitize_email((string) ($state['test_email'] ?? get_option('admin_email', ''))),
            'subject' => sanitize_text_field((string) ($state['subject'] ?? 'Nouvelle actualite de 2424 MG')),
            'preheader' => sanitize_text_field((string) ($state['preheader'] ?? 'Retrouvez la derniere mise a jour partagee par 2424 MG.')),
            'title' => sanitize_text_field((string) ($state['title'] ?? 'A new update from 2424 MG')),
            'intro' => sanitize_textarea_field((string) ($state['intro'] ?? 'Retrouvez ci-dessous une nouvelle communication partagee depuis la plateforme.')),
            'content' => sanitize_textarea_field((string) ($state['content'] ?? "Bonjour,\n\nVoici une mise a jour importante partagee par l'equipe 2424 MG.")),
            'cta_label' => sanitize_text_field((string) ($state['cta_label'] ?? 'Read more')),
            'cta_url' => esc_url_raw((string) ($state['cta_url'] ?? ($public_site_url . '/'))),
        );
    }

    function platform_2424_render_newsletter_content_html($content) {
        $paragraphs = preg_split('/\r\n|\r|\n/', trim((string) $content));
        if (!is_array($paragraphs)) {
            return '';
        }

        $html_parts = array();
        foreach ($paragraphs as $paragraph) {
            $paragraph = trim((string) $paragraph);
            if ($paragraph === '') {
                continue;
            }
            $html_parts[] = '<p style="margin:0 0 12px 0;">' . esc_html($paragraph) . '</p>';
        }

        return implode('', $html_parts);
    }

    function platform_2424_render_emails_tab() {
        $state = platform_2424_normalize_newsletter_form_state($_POST);
        $notice = null;

        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['platform_2424_email_action']) && $_POST['platform_2424_email_action'] === 'send_test_newsletter') {
            check_admin_referer('platform_2424_send_test_newsletter');

            if ($state['test_email'] === '' || !is_email($state['test_email'])) {
                $notice = array(
                    'type' => 'error',
                    'message' => 'Merci de renseigner une adresse email de test valide.',
                );
            } elseif ($state['cta_url'] === '' || !wp_http_validate_url($state['cta_url'])) {
                $notice = array(
                    'type' => 'error',
                    'message' => 'Merci de renseigner une URL de bouton valide.',
                );
            } else {
                $dispatch_result = platform_2424_dispatch_email(array(
                    'eventName' => 'newsletter.broadcast.v1',
                    'recipient' => array(
                        'email' => $state['test_email'],
                    ),
                    'templateData' => array(
                        'subject' => $state['subject'],
                        'preheader' => $state['preheader'],
                        'title' => $state['title'],
                        'introLine' => $state['intro'],
                        'content' => $state['content'],
                        'ctaLabel' => $state['cta_label'],
                        'ctaUrl' => $state['cta_url'],
                        'siteUrl' => platform_2424_get_public_site_url(),
                        'preferencesUrl' => platform_2424_get_public_site_url() . '/profil/modifier',
                        'unsubscribeUrl' => platform_2424_build_notification_unsubscribe_url($state['test_email']),
                    ),
                    'metadata' => array(
                        'channel' => 'newsletter',
                        'flow' => 'admin_test',
                        'sent_by' => wp_get_current_user()->user_login,
                    ),
                ));

                if (is_wp_error($dispatch_result)) {
                    $notice = array(
                        'type' => 'error',
                        'message' => 'Impossible d\'envoyer le test pour le moment: ' . esc_html($dispatch_result->get_error_message()),
                    );
                    if (function_exists('platform_2424_log_event')) {
                        platform_2424_log_event('error', 'email', 'Echec envoi test newsletter via Lambda.', array(
                            'email' => $state['test_email'],
                            'error' => $dispatch_result->get_error_message(),
                        ));
                    }
                } else {
                    $notice = array(
                        'type' => 'success',
                        'message' => 'Email de test envoye a ' . esc_html($state['test_email']) . '.',
                    );
                    if (function_exists('platform_2424_log_event')) {
                        platform_2424_log_event('info', 'email', 'Email de test newsletter envoye via Lambda.', array(
                            'email' => $state['test_email'],
                            'subject' => $state['subject'],
                        ));
                    }
                }
            }
        }

        $lambda_endpoint = platform_2424_get_email_dispatcher_endpoint();
        $has_lambda_config = $lambda_endpoint !== '' && platform_2424_get_email_dispatcher_secret() !== '';
        ?>
        <div style="margin-top:16px;">
            <p>Composez ici un email systeme/newsletter en reutilisant le meme shell HTML que les emails 2424 deja envoyes par le Lambda.</p>

            <?php if ($notice) : ?>
                <div class="<?php echo $notice['type'] === 'success' ? 'notice notice-success' : 'notice notice-error'; ?>" style="margin:16px 0;">
                    <p><?php echo wp_kses_post($notice['message']); ?></p>
                </div>
            <?php endif; ?>

            <?php if (!$has_lambda_config) : ?>
                <div class="notice notice-warning" style="margin:16px 0;">
                    <p>Le Lambda email dispatcher n'est pas configure. Renseignez son URL et son secret dans l'onglet Configuration avant d'envoyer un test.</p>
                </div>
            <?php endif; ?>

            <form method="post" action="">
                <?php wp_nonce_field('platform_2424_send_test_newsletter'); ?>
                <input type="hidden" name="platform_2424_email_action" value="send_test_newsletter" />

                <div style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(320px,0.8fr);gap:24px;align-items:start;">
                    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;">
                        <h2 style="margin:0 0 12px 0;">Envoyer un test</h2>
                        <table class="form-table" role="presentation" style="margin:0;">
                            <tr>
                                <th scope="row"><label for="platform_2424_newsletter_test_email">Email de test</label></th>
                                <td><input type="email" class="regular-text" id="platform_2424_newsletter_test_email" name="test_email" value="<?php echo esc_attr($state['test_email']); ?>" /></td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="platform_2424_newsletter_subject">Sujet</label></th>
                                <td><input type="text" class="regular-text" id="platform_2424_newsletter_subject" name="subject" value="<?php echo esc_attr($state['subject']); ?>" /></td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="platform_2424_newsletter_preheader">Preheader</label></th>
                                <td><input type="text" class="regular-text" id="platform_2424_newsletter_preheader" name="preheader" value="<?php echo esc_attr($state['preheader']); ?>" /></td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="platform_2424_newsletter_title">Titre</label></th>
                                <td><input type="text" class="regular-text" id="platform_2424_newsletter_title" name="title" value="<?php echo esc_attr($state['title']); ?>" /></td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="platform_2424_newsletter_intro">Introduction</label></th>
                                <td><textarea id="platform_2424_newsletter_intro" name="intro" rows="3" class="large-text"><?php echo esc_textarea($state['intro']); ?></textarea></td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="platform_2424_newsletter_content">Contenu</label></th>
                                <td><textarea id="platform_2424_newsletter_content" name="content" rows="8" class="large-text"><?php echo esc_textarea($state['content']); ?></textarea></td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="platform_2424_newsletter_cta_label">Texte du bouton</label></th>
                                <td><input type="text" class="regular-text" id="platform_2424_newsletter_cta_label" name="cta_label" value="<?php echo esc_attr($state['cta_label']); ?>" /></td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="platform_2424_newsletter_cta_url">URL du bouton</label></th>
                                <td><input type="url" class="regular-text code" id="platform_2424_newsletter_cta_url" name="cta_url" value="<?php echo esc_attr($state['cta_url']); ?>" /></td>
                            </tr>
                        </table>
                        <?php submit_button('Envoyer un test', 'primary', 'submit', false, array('disabled' => !$has_lambda_config)); ?>
                    </div>

                    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;position:sticky;top:32px;">
                        <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#cc202a;">Apercu</p>
                        <h3 id="platform_2424_newsletter_preview_title" style="margin:0 0 8px 0;font-size:28px;line-height:1.1;"><?php echo esc_html($state['title']); ?></h3>
                        <p id="platform_2424_newsletter_preview_intro" style="margin:0 0 16px 0;color:#4b5563;"><?php echo esc_html($state['intro']); ?></p>
                        <div id="platform_2424_newsletter_preview_content" style="font-size:14px;line-height:1.7;color:#111111;">
                            <?php echo wp_kses_post(platform_2424_render_newsletter_content_html($state['content'])); ?>
                        </div>
                        <div style="margin-top:20px;">
                            <span id="platform_2424_newsletter_preview_cta" style="display:inline-block;background:#cc202a;color:#fff;border-radius:8px;padding:12px 18px;font-size:13px;font-weight:600;"><?php echo esc_html($state['cta_label']); ?></span>
                        </div>
                        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0f0f0;font-size:12px;line-height:1.6;color:#6b7280;">
                            <div>Vous recevez cet email car vous etes abonne(e) a la newsletter de 2424.</div>
                            <div style="margin-top:4px;">Si vous ne souhaitez plus recevoir nos communications : Se desinscrire | Gerer mes preferences</div>
                        </div>
                    </div>
                </div>
            </form>

            <script>
                (function () {
                    var titleInput = document.getElementById('platform_2424_newsletter_title');
                    var introInput = document.getElementById('platform_2424_newsletter_intro');
                    var contentInput = document.getElementById('platform_2424_newsletter_content');
                    var ctaInput = document.getElementById('platform_2424_newsletter_cta_label');
                    var previewTitle = document.getElementById('platform_2424_newsletter_preview_title');
                    var previewIntro = document.getElementById('platform_2424_newsletter_preview_intro');
                    var previewContent = document.getElementById('platform_2424_newsletter_preview_content');
                    var previewCta = document.getElementById('platform_2424_newsletter_preview_cta');

                    function escapeHtml(value) {
                        return String(value || '')
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#039;');
                    }

                    function updatePreview() {
                        if (previewTitle && titleInput) previewTitle.textContent = titleInput.value || 'A new update from 2424 MG';
                        if (previewIntro && introInput) previewIntro.textContent = introInput.value || 'Retrouvez ci-dessous une nouvelle communication partagee depuis la plateforme.';
                        if (previewContent && contentInput) {
                            var paragraphs = String(contentInput.value || '').split(/\r\n|\r|\n/).filter(function (item) { return item.trim() !== ''; });
                            previewContent.innerHTML = paragraphs.map(function (paragraph) {
                                return '<p style=\"margin:0 0 12px 0;\">' + escapeHtml(paragraph) + '</p>';
                            }).join('') || '<p style=\"margin:0;\">Bonjour,</p>';
                        }
                        if (previewCta && ctaInput) previewCta.textContent = ctaInput.value || 'Read more';
                    }

                    [titleInput, introInput, contentInput, ctaInput].forEach(function (element) {
                        if (!element) return;
                        element.addEventListener('input', updatePreview);
                    });

                    updatePreview();
                })();
            </script>
        </div>
        <?php
    }

    function platform_2424_render_access_tab() {
        $matrix = platform_2424_get_access_matrix();
        $plan_labels = array('free' => 'Free', 'essentiel' => 'Essentiel', 'business' => 'Business');
        ?>
        <form method="post" action="options.php">
            <?php settings_fields(PLATFORM_2424_SETTINGS_GROUP_ACCESS); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row">Articles actualités</th>
                    <td>
                        <p class="description" style="margin-top:0;">
                            Le niveau d'accès se règle article par article dans l'éditeur WordPress via le champ
                            <strong> Accès minimum requis</strong>.
                        </p>
                        <ul style="margin:8px 0 0 18px;list-style:disc;">
                            <?php foreach ($matrix['news']['minimumPlanOptions'] as $option) : ?>
                                <li><code><?php echo esc_html($option['value']); ?></code> : <?php echo esc_html($option['label']); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Petites annonces</th>
                    <td>
                        <table style="border-collapse:collapse;min-width:520px;">
                            <thead>
                                <tr>
                                    <th style="padding:0 18px 10px 0;text-align:left;">Plan</th>
                                    <th style="padding:0 18px 10px 0;text-align:left;">Publications / mois</th>
                                    <th style="padding:0 0 10px;text-align:left;">Photos max</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($plan_labels as $plan_id => $plan_label) : ?>
                                    <tr>
                                        <th scope="row" style="padding:0 18px 12px 0;text-align:left;"><?php echo esc_html($plan_label); ?></th>
                                        <td style="padding:0 18px 12px 0;">
                                            <input type="number" min="0" step="1" name="platform_2424_classified_monthly_posts_<?php echo esc_attr($plan_id); ?>" value="<?php echo esc_attr((string) $matrix['classifieds']['monthlyPosts'][$plan_id]); ?>" class="small-text" />
                                        </td>
                                        <td style="padding:0 0 12px;">
                                            <input type="number" min="1" step="1" name="platform_2424_classified_max_photos_<?php echo esc_attr($plan_id); ?>" value="<?php echo esc_attr((string) $matrix['classifieds']['maxPhotos'][$plan_id]); ?>" class="small-text" />
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                        <p class="description">Le quota est consommé dès qu'une annonce est publiée pendant le mois en cours. Repasser une annonce en brouillon ne recrédite pas le quota.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Offres d'emploi</th>
                    <td>
                        <table style="border-collapse:collapse;min-width:420px;">
                            <thead>
                                <tr>
                                    <th style="padding:0 18px 10px 0;text-align:left;">Plan</th>
                                    <th style="padding:0 0 10px;text-align:left;">Publications / mois</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($plan_labels as $plan_id => $plan_label) : ?>
                                    <tr>
                                        <th scope="row" style="padding:0 18px 12px 0;text-align:left;"><?php echo esc_html($plan_label); ?></th>
                                        <td style="padding:0 0 12px;">
                                            <input type="number" min="0" step="1" name="platform_2424_job_monthly_posts_<?php echo esc_attr($plan_id); ?>" value="<?php echo esc_attr((string) $matrix['jobs']['monthlyPosts'][$plan_id]); ?>" class="small-text" />
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Annuaire</th>
                    <td>
                        <label for="platform_2424_directory_minimum_plan">Plan minimum pour apparaître dans l'annuaire</label><br />
                        <select id="platform_2424_directory_minimum_plan" name="platform_2424_directory_minimum_plan">
                            <?php foreach (array('free' => 'Free et supérieur', 'essentiel' => 'Essentiel et Business', 'business' => 'Business uniquement') as $option_value => $option_label) : ?>
                                <option value="<?php echo esc_attr($option_value); ?>" <?php selected($matrix['directory']['minimumPlan'], $option_value); ?>>
                                    <?php echo esc_html($option_label); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <p class="description">Le compte doit aussi activer la visibilité annuaire dans son profil. Les comptes Essentiel et Business doivent conserver un abonnement actif ou en essai.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Appels d'offres</th>
                    <td>
                        <table style="border-collapse:collapse;min-width:520px;">
                            <thead>
                                <tr>
                                    <th style="padding:0 18px 10px 0;text-align:left;">Plan</th>
                                    <th style="padding:0 0 10px;text-align:left;">Publications / mois</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($plan_labels as $plan_id => $plan_label) : ?>
                                    <tr>
                                        <th scope="row" style="padding:0 18px 12px 0;text-align:left;"><?php echo esc_html($plan_label); ?></th>
                                        <td style="padding:0 0 12px;">
                                            <input type="number" min="0" step="1" name="platform_2424_tender_monthly_posts_<?php echo esc_attr($plan_id); ?>" value="<?php echo esc_attr((string) $matrix['tenders']['monthlyPosts'][$plan_id]); ?>" class="small-text" />
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                                <tr>
                                    <th scope="row" style="padding:0 18px 12px 0;text-align:left;">Plan minimum pour publier / gerer</th>
                                    <td style="padding:0 0 12px;">
                                        <select name="platform_2424_tender_minimum_plan">
                                            <?php foreach (array('free' => 'Free et supérieur', 'essentiel' => 'Essentiel et Business', 'business' => 'Business uniquement') as $option_value => $option_label) : ?>
                                                <option value="<?php echo esc_attr($option_value); ?>" <?php selected($matrix['tenders']['minimumPlan'], $option_value); ?>>
                                                    <?php echo esc_html($option_label); ?>
                                                </option>
                                            <?php endforeach; ?>
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row" style="padding:0 18px 12px 0;text-align:left;">Plan minimum pour repondre / contacter</th>
                                    <td style="padding:0 0 12px;">
                                        <select name="platform_2424_tender_response_minimum_plan">
                                            <?php foreach (array('free' => 'Free et supérieur', 'essentiel' => 'Essentiel et Business', 'business' => 'Business uniquement') as $option_value => $option_label) : ?>
                                                <option value="<?php echo esc_attr($option_value); ?>" <?php selected($matrix['tenders']['responseMinimumPlan'], $option_value); ?>>
                                                    <?php echo esc_html($option_label); ?>
                                                </option>
                                            <?php endforeach; ?>
                                        </select>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <p class="description">Le quota est consommé dès qu'un appel d'offres est publié pendant le mois en cours. Par défaut, les appels d'offres restent réservés au plan Business.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button('Enregistrer les accès'); ?>
        </form>
        <?php
    }
}

if (!function_exists('platform_2424_normalize_download_url')) {
    function platform_2424_normalize_download_url($download_url, $metadata_url) {
        $download_url = trim((string) $download_url);
        if ($download_url === '') {
            return '';
        }

        if (preg_match('#^https?://#i', $download_url)) {
            return esc_url_raw($download_url);
        }

        $parsed_metadata = wp_parse_url($metadata_url);
        if (empty($parsed_metadata['scheme']) || empty($parsed_metadata['host'])) {
            return '';
        }

        $origin = $parsed_metadata['scheme'] . '://' . $parsed_metadata['host'];
        if (!empty($parsed_metadata['port'])) {
            $origin .= ':' . $parsed_metadata['port'];
        }

        if (strpos($download_url, '/') === 0) {
            return esc_url_raw($origin . $download_url);
        }

        $metadata_path = isset($parsed_metadata['path']) ? (string) $parsed_metadata['path'] : '/';
        $base_path = trailingslashit(dirname($metadata_path));

        return esc_url_raw($origin . $base_path . $download_url);
    }
}

if (!function_exists('platform_2424_get_update_metadata')) {
    function platform_2424_get_update_metadata($force = false) {
        $cache_key = 'platform_2424_plugin_update_metadata';

        if (!$force) {
            $cached = get_site_transient($cache_key);
            if (is_array($cached)) {
                return $cached;
            }
        }

        $url = platform_2424_plugin_update_metadata_url();
        if ($url === '') {
            return null;
        }

        $response = wp_remote_get($url, array(
            'timeout' => 15,
            'headers' => array(
                'Accept' => 'application/json',
            ),
        ));

        if (is_wp_error($response)) {
            return null;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code < 200 || $status_code >= 300) {
            return null;
        }

        $payload = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($payload)) {
            return null;
        }

        $metadata = array(
            'name' => sanitize_text_field((string) ($payload['name'] ?? 'Tanyora Platform')),
            'slug' => sanitize_key((string) ($payload['slug'] ?? '2424-platform')),
            'version' => sanitize_text_field((string) ($payload['version'] ?? '')),
            'download_url' => platform_2424_normalize_download_url((string) ($payload['download_url'] ?? ''), $url),
            'requires' => sanitize_text_field((string) ($payload['requires'] ?? '')),
            'tested' => sanitize_text_field((string) ($payload['tested'] ?? '')),
            'requires_php' => sanitize_text_field((string) ($payload['requires_php'] ?? '')),
            'last_updated' => sanitize_text_field((string) ($payload['last_updated'] ?? '')),
            'sections' => is_array($payload['sections'] ?? null) ? $payload['sections'] : array(),
        );

        if ($metadata['version'] === '' || $metadata['download_url'] === '') {
            return null;
        }

        set_site_transient($cache_key, $metadata, HOUR_IN_SECONDS);

        return $metadata;
    }
}

if (!function_exists('platform_2424_register_settings')) {
    function platform_2424_register_settings() {
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_plugin_update_url', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) {
                return platform_2424_sanitize_metadata_update_input($value);
            },
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_public_site_url', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_public_site_url',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_email_logo_url', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_https_url_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_public_logo_url', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_https_url_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_home_title', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_home_description', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_footer_description', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        foreach (array('facebook', 'tiktok', 'instagram', 'youtube', 'linkedin', 'x') as $social_network) {
            register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_footer_' . $social_network . '_url', array(
                'type' => 'string',
                'sanitize_callback' => 'platform_2424_sanitize_https_url_input',
                'default' => '',
            ));
        }
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_editorial_source_graphql_url', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_https_url_input',
            'default' => '',
        ));
        foreach (platform_2424_get_public_seo_reference_pages() as $reference) {
            register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, $reference['option'], array(
                'type' => 'integer',
                'sanitize_callback' => 'platform_2424_sanitize_page_reference_id',
                'default' => 0,
            ));
        }
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_media_presign_url', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_https_url_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_media_public_base_url', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_https_url_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_media_delete_url', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_https_url_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_media_inventory_url', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_https_url_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_media_delete_secret', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_support_email', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_email_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_email_dispatcher_lambda_url', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_https_url_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_email_dispatcher_shared_secret', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_vapid_public_key', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_vapid_private_key', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_vapid_subject', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => 'mailto:contact@2424.mg',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_submissions_secret', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_annonces_display_mode', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_annonces_display_mode',
            'default' => 'separate',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_enabled', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) {
                return $value === 'yes' ? 'yes' : 'no';
            },
            'default' => 'no',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_mode', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_adsense_mode',
            'default' => 'placeholder',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_show_placeholders', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) {
                return $value === 'yes' ? 'yes' : 'no';
            },
            'default' => 'no',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_client_id', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => 'ca-pub-9214874716192005',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_top_banner_slot', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_home_top_slot', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_home_after_editorial_slot', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_archive_inline_slot', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_article_inline_slot', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_article_inline_start_after_blocks', array(
            'type' => 'integer',
            'sanitize_callback' => 'absint',
            'default' => 3,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_article_inline_repeat_every_blocks', array(
            'type' => 'integer',
            'sanitize_callback' => 'absint',
            'default' => 4,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_adsense_article_rail_slot', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_smtp_host', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_smtp_host',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_smtp_port', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_smtp_port',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_smtp_user', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_smtp_pass', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_smtp_secure', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_smtp_secure',
            'default' => 'tls',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_smtp_from_email', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_email_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION, 'platform_2424_smtp_from_name', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_MVOLA, 'platform_2424_mvola_enabled', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) {
                return $value === 'yes' ? 'yes' : 'no';
            },
            'default' => 'no',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_MVOLA, 'platform_2424_mvola_sandbox', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) {
                return $value === 'yes' ? 'yes' : 'no';
            },
            'default' => 'yes',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_MVOLA, 'platform_2424_mvola_consumer_key', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_MVOLA, 'platform_2424_mvola_consumer_secret', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_MVOLA, 'platform_2424_mvola_merchant_number', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_MVOLA, 'platform_2424_mvola_partner_name', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_MVOLA, 'platform_2424_mvola_callback_secret', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_MVOLA, 'platform_2424_mvola_polling_interval_seconds', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) {
                $number = absint($value);
                return (string) ($number > 0 ? $number : 10);
            },
            'default' => '10',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_PRICING, 'platform_2424_pricing_rules', array(
            'type' => 'array',
            'sanitize_callback' => 'platform_2424_sanitize_pricing_rules',
            'default' => array(),
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_PRICING, 'platform_2424_annual_sku_essentiel', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_PRICING, 'platform_2424_annual_sku_business', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_PRICING, 'platform_2424_annual_product_id_essentiel', array(
            'type' => 'integer',
            'sanitize_callback' => 'absint',
            'default' => 0,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_PRICING, 'platform_2424_annual_product_id_business', array(
            'type' => 'integer',
            'sanitize_callback' => 'absint',
            'default' => 0,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_PRICING, 'platform_2424_staging_subscription_bypass_enabled', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_staging_subscription_bypass',
            'default' => 'no',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_PAPI, 'platform_2424_papi_enabled', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) { return $value === 'yes' ? 'yes' : 'no'; },
            'default' => 'no',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_PAPI, 'platform_2424_papi_api_key', array(
            'type' => 'string', 'sanitize_callback' => function ($value) {
                $value = platform_2424_sanitize_text_input($value);
                return $value !== '' ? $value : (string) get_option('platform_2424_papi_api_key', '');
            }, 'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_PAPI, 'platform_2424_papi_webhook_secret', array(
            'type' => 'string', 'sanitize_callback' => function ($value) {
                $value = platform_2424_sanitize_text_input($value);
                return $value !== '' ? $value : (string) get_option('platform_2424_papi_webhook_secret', '');
            }, 'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_PAPI, 'platform_2424_papi_link_valid_duration_hours', array(
            'type' => 'integer',
            'sanitize_callback' => function ($value) { return min(72, max(1, absint($value))); },
            'default' => 1,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_PAPI, 'platform_2424_papi_test_mode', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) { return $value === 'yes' ? 'yes' : 'no'; },
            'default' => 'no',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_TYPESENSE, 'platform_2424_typesense_enabled', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) { return $value === 'yes' ? 'yes' : 'no'; },
            'default' => 'no',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_TYPESENSE, 'platform_2424_typesense_host', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_text_input',
            'default' => '127.0.0.1',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_TYPESENSE, 'platform_2424_typesense_port', array(
            'type' => 'integer',
            'sanitize_callback' => function ($value) { return min(65535, max(1, absint($value))); },
            'default' => 8108,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_TYPESENSE, 'platform_2424_typesense_protocol', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) { return $value === 'https' ? 'https' : 'http'; },
            'default' => 'http',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_TYPESENSE, 'platform_2424_typesense_api_key', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) {
                $value = platform_2424_sanitize_text_input($value);
                return $value !== '' ? $value : (string) get_option('platform_2424_typesense_api_key', '');
            },
            'default' => '',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_classified_monthly_posts_free', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 1,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_classified_monthly_posts_essentiel', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 5,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_classified_monthly_posts_business', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 10,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_classified_max_photos_free', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 2,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_classified_max_photos_essentiel', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 10,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_classified_max_photos_business', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 20,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_job_monthly_posts_free', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 0,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_job_monthly_posts_essentiel', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 5,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_job_monthly_posts_business', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 10,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_tender_monthly_posts_free', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 0,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_tender_monthly_posts_essentiel', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 0,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_tender_monthly_posts_business', array(
            'type' => 'integer',
            'sanitize_callback' => 'platform_2424_sanitize_plan_feature_limit',
            'default' => 10,
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_directory_minimum_plan', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_directory_minimum_plan',
            'default' => 'essentiel',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_tender_minimum_plan', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_tender_minimum_plan',
            'default' => 'business',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_ACCESS, 'platform_2424_tender_response_minimum_plan', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_tender_minimum_plan',
            'default' => 'business',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_LOGS, 'platform_2424_logs_enabled', array(
            'type' => 'string',
            'sanitize_callback' => function ($value) {
                return $value === 'yes' ? 'yes' : 'no';
            },
            'default' => 'yes',
        ));
        register_setting(PLATFORM_2424_SETTINGS_GROUP_LOGS, 'platform_2424_log_level', array(
            'type' => 'string',
            'sanitize_callback' => 'platform_2424_sanitize_log_level',
            'default' => 'error',
        ));
    }
}
add_action('admin_init', 'platform_2424_register_settings');
add_filter('upload_mimes', 'platform_2424_allow_admin_svg_uploads');
add_filter('wp_check_filetype_and_ext', 'platform_2424_set_admin_svg_filetype', 10, 4);
add_filter('wp_handle_upload_prefilter', 'platform_2424_validate_admin_svg_upload');

if (!function_exists('platform_2424_add_settings_page')) {
    function platform_2424_add_settings_page() {
        add_options_page(
            'Tanyora Platform',
            'Tanyora Platform',
            'manage_options',
            'platform-2424-settings',
            'platform_2424_render_settings_page'
        );
    }
}
add_action('admin_menu', 'platform_2424_add_settings_page');

if (!function_exists('platform_2424_enqueue_admin_settings_assets')) {
    function platform_2424_enqueue_admin_settings_assets($hook_suffix) {
        if ($hook_suffix !== 'settings_page_platform-2424-settings') {
            return;
        }

        wp_enqueue_style(
            'platform-2424-admin-settings',
            plugin_dir_url(__FILE__) . 'assets/css/admin-settings.css',
            array(),
            PLATFORM_2424_PLUGIN_VERSION
        );
        wp_enqueue_media();
        wp_enqueue_script('jquery');
        wp_add_inline_script('jquery', "document.addEventListener('click', function (event) { var button = event.target.closest('.platform-2424-select-media'); if (!button || !window.wp || !wp.media) { return; } event.preventDefault(); var input = document.getElementById(button.dataset.target); if (!input) { return; } var frame = wp.media({ title: 'Choisir le logo public', button: { text: 'Utiliser ce logo' }, multiple: false, library: { type: 'image' } }); frame.on('select', function () { var attachment = frame.state().get('selection').first().toJSON(); input.value = attachment.url || ''; input.dispatchEvent(new Event('change', { bubbles: true })); var preview = document.getElementById(button.dataset.preview); if (preview) { preview.src = attachment.url || ''; preview.hidden = !attachment.url; } }); frame.open(); });");
    }
}
add_action('admin_enqueue_scripts', 'platform_2424_enqueue_admin_settings_assets');

if (!function_exists('platform_2424_render_password_visibility_controls')) {
    function platform_2424_render_password_visibility_controls() {
        ?>
        <script>
            (function () {
                var inputs = document.querySelectorAll('#wpbody-content input[type="password"][name^="platform_2424_"]');

                inputs.forEach(function (input) {
                    if (input.dataset.platformPasswordToggle === 'ready') {
                        return;
                    }

                    input.dataset.platformPasswordToggle = 'ready';

                    var button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'button button-secondary';
                    button.style.marginLeft = '8px';
                    button.textContent = 'Afficher';
                    button.setAttribute('aria-controls', input.id);
                    button.setAttribute('aria-pressed', 'false');

                    button.addEventListener('click', function () {
                        var isVisible = input.type === 'text';
                        input.type = isVisible ? 'password' : 'text';
                        button.textContent = isVisible ? 'Afficher' : 'Masquer';
                        button.setAttribute('aria-pressed', isVisible ? 'false' : 'true');
                    });

                    input.insertAdjacentElement('afterend', button);
                });
            }());
        </script>
        <?php
    }
}

if (!function_exists('platform_2424_render_settings_page')) {
    function platform_2424_render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $current_tab = platform_2424_get_admin_tab();
        $tabs = array(
            'pricing' => array('label' => 'Tarifs', 'description' => 'Produits WooCommerce et règles de facturation.'),
            'papi' => array('label' => 'Paiements', 'description' => 'Configuration sécurisée des paiements PAPI.'),
            'typesense' => array('label' => 'Recherche Typesense', 'description' => 'Indexation serveur et recherche instantanée.'),
            'listing-index' => array('label' => 'Index des listes', 'description' => 'Lecture SQL optimisée des annonces, emplois et appels d’offres.'),
            'access' => array('label' => 'Accès', 'description' => 'Quotas, publications et niveaux d’accès.'),
            'configuration' => array('label' => 'Configuration', 'description' => 'Site, SEO, intégrations et services.'),
            'backup' => array('label' => 'Sauvegarde', 'description' => 'Exporter ou restaurer les paramètres.'),
            'logs' => array('label' => 'Logs', 'description' => 'Collecte et consultation des événements.'),
        );
        if (function_exists('platform_2424_stress_test_is_staging') && platform_2424_stress_test_is_staging()) {
            $tabs['stress-test'] = array('label' => 'Stress test', 'description' => 'Jeu de charge staging, sécurisé et nettoyable.');
        }
        $current_tab_data = $tabs[$current_tab];

        ?>
        <div class="wrap platform-2424-admin">
            <header class="platform-2424-admin-hero">
                <div class="platform-2424-admin-mark" aria-hidden="true">24</div>
                <div>
                    <p>2424.MG</p>
                    <h1>Platform</h1>
                </div>
                <span>Administration</span>
            </header>
            <div class="platform-2424-admin-shell">
                <nav class="platform-2424-admin-sidebar" aria-label="Navigation des réglages">
                    <?php foreach ($tabs as $tab_key => $tab) : ?>
                        <a
                            href="<?php echo esc_url(admin_url('options-general.php?page=platform-2424-settings&tab=' . $tab_key)); ?>"
                            class="<?php echo $current_tab === $tab_key ? 'is-active' : ''; ?>"
                            <?php echo $current_tab === $tab_key ? 'aria-current="page"' : ''; ?>
                        >
                            <?php echo esc_html($tab['label']); ?>
                        </a>
                    <?php endforeach; ?>
                </nav>
                <main class="platform-2424-admin-main">
                    <header class="platform-2424-section-header">
                        <p class="platform-2424-eyebrow">Tanyora Platform</p>
                        <h2><?php echo esc_html($current_tab_data['label']); ?></h2>
                        <p><?php echo esc_html($current_tab_data['description']); ?></p>
                    </header>
            <?php if ($current_tab === 'logs') : ?>
                <?php platform_2424_render_logs_tab(); ?>
            <?php elseif ($current_tab === 'access') : ?>
                <?php platform_2424_render_access_tab(); ?>
            <?php elseif ($current_tab === 'backup') : ?>
                <?php platform_2424_render_settings_transfer_tab(); ?>
            <?php elseif ($current_tab === 'pricing') : ?>
                <?php platform_2424_render_pricing_tab(); ?>
            <?php elseif ($current_tab === 'papi') : ?>
                <?php platform_2424_render_papi_tab(); ?>
            <?php elseif ($current_tab === 'typesense') : ?>
                <?php platform_2424_typesense_render_tab(); ?>
            <?php elseif ($current_tab === 'listing-index') : ?>
                <?php platform_2424_public_listing_index_render_tab(); ?>
            <?php elseif ($current_tab === 'stress-test') : ?>
                <?php platform_2424_stress_test_render_tab(); ?>
            <?php else : ?>
                <div class="platform-2424-tab-content">
                <form id="platform-2424-test-media-delete" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:none;">
                    <?php wp_nonce_field('platform_2424_test_media_delete'); ?>
                    <input type="hidden" name="action" value="platform_2424_test_media_delete" />
                </form>
                <form id="platform-2424-retry-media-cleanup" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:none;">
                    <?php wp_nonce_field('platform_2424_retry_media_cleanup'); ?>
                    <input type="hidden" name="action" value="platform_2424_retry_media_cleanup" />
                </form>
                <form id="platform-2424-backfill-media-cleanup" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:none;">
                    <?php wp_nonce_field('platform_2424_backfill_media_cleanup'); ?>
                    <input type="hidden" name="action" value="platform_2424_backfill_media_cleanup" />
                </form>
                <form id="platform-2424-start-media-orphan-audit" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:none;">
                    <?php wp_nonce_field('platform_2424_start_media_orphan_audit'); ?>
                    <input type="hidden" name="action" value="platform_2424_start_media_orphan_audit" />
                </form>
                <form id="platform-2424-test-media-inventory" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:none;">
                    <?php wp_nonce_field('platform_2424_test_media_inventory'); ?>
                    <input type="hidden" name="action" value="platform_2424_test_media_inventory" />
                </form>
                <form method="post" action="options.php" class="platform-2424-card">
                    <?php settings_fields(PLATFORM_2424_SETTINGS_GROUP_CONFIGURATION); ?>
                    <table class="form-table" role="presentation">
                        <tr class="platform-2424-form-section"><th colspan="2">Site et source éditoriale</th></tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_public_site_url">URL publique du site</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_public_site_url"
                                    name="platform_2424_public_site_url"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_public_site_url', '')); ?>"
                                    class="regular-text code"
                                    placeholder="https://2424.winfordcap.com"
                                />
                                <p class="description">
                                    Domaine public servi par Next.js, utilisé pour les liens envoyés aux utilisateurs.
                                    Ne renseignez pas le domaine WordPress d&apos;administration ou l&apos;URL de l&apos;API. Exemple :
                                    <code>https://2424.mg</code>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_editorial_source_graphql_url">URL source GraphQL actualites</label></th>
                            <td>
                                <input
                                    type="url"
                                    id="platform_2424_editorial_source_graphql_url"
                                    name="platform_2424_editorial_source_graphql_url"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_editorial_source_graphql_url', '')); ?>"
                                    class="regular-text code"
                                    placeholder="https://2424-backup.winfordcap.com/graphql"
                                />
                                <p class="description">
                                    Source WPGraphQL utilisee par la page <code>/actualites</code>. Changez cette URL pour pointer vers un autre WordPress editorial si besoin.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_email_logo_url">Logo des e-mails</label></th>
                            <td>
                                <input
                                    type="url"
                                    id="platform_2424_email_logo_url"
                                    name="platform_2424_email_logo_url"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_email_logo_url', '')); ?>"
                                    class="regular-text code"
                                    placeholder="https://2424.mg/email-logo.png"
                                />
                                <p class="description">
                                    Image PNG publique affichee dans les e-mails WooCommerce. Si vide, le plugin utilise <code>/email-logo.png</code> sur l&apos;URL publique du site.
                                </p>
                            </td>
                        </tr>
                        <tr class="platform-2424-form-section"><th colspan="2">Références SEO</th></tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_public_logo_url">Logo public Next.js</label></th>
                            <td>
                                <input
                                    type="url"
                                    id="platform_2424_public_logo_url"
                                    name="platform_2424_public_logo_url"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_public_logo_url', '')); ?>"
                                    class="regular-text code"
                                    placeholder="https://.../logo.png"
                                />
                                <button type="button" class="button button-secondary platform-2424-select-media" data-target="platform_2424_public_logo_url" data-preview="platform-2424-public-logo-preview">Choisir dans la médiathèque</button>
                                <p><img id="platform-2424-public-logo-preview" src="<?php echo esc_url((string) get_option('platform_2424_public_logo_url', '')); ?>" alt="" style="max-height:64px;width:auto;<?php echo get_option('platform_2424_public_logo_url', '') === '' ? 'display:none;' : ''; ?>" /></p>
                                <p class="description">Utilisé dans l’en-tête et le pied de page Next.js. PNG, WebP, JPG et SVG sécurisé sont acceptés. Laissez vide pour conserver le logo intégré.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_home_title">Titre de la page d’accueil</label></th>
                            <td>
                                <input type="text" id="platform_2424_home_title" name="platform_2424_home_title" value="<?php echo esc_attr((string) get_option('platform_2424_home_title', '')); ?>" class="large-text" maxlength="512" />
                                <p class="description">Titre SEO et de partage de la page d’accueil. S’il est vide, la référence SEO « Accueil » reste utilisée.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_home_description">Description de la page d’accueil</label></th>
                            <td>
                                <textarea id="platform_2424_home_description" name="platform_2424_home_description" class="large-text" rows="3" maxlength="1024"><?php echo esc_textarea((string) get_option('platform_2424_home_description', '')); ?></textarea>
                                <p class="description">Description SEO, Open Graph et Twitter de la page d’accueil. S’il est vide, la référence SEO « Accueil » reste utilisée.</p>
                            </td>
                        </tr>
                        <tr class="platform-2424-form-section"><th colspan="2">Pied de page</th></tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_footer_description">Texte de présentation</label></th>
                            <td>
                                <textarea id="platform_2424_footer_description" name="platform_2424_footer_description" class="large-text" rows="3" maxlength="1024" placeholder="Présentation affichée dans le pied de page."><?php echo esc_textarea((string) get_option('platform_2424_footer_description', "2424.mg est un site web promu par UNITED MALAGASY MEDIA, visant à produire des contenus de qualité aussi bien dans l'actualité quotidienne que sous forme de reportages.")); ?></textarea>
                                <p class="description">Texte affiché sous le logo dans le pied de page.</p>
                            </td>
                        </tr>
                        <?php
                        $footer_social_defaults = array(
                            'facebook' => array('label' => 'Facebook', 'url' => 'https://web.facebook.com/2424.mg/'),
                            'tiktok' => array('label' => 'TikTok', 'url' => 'https://www.tiktok.com/@2424.mg'),
                            'instagram' => array('label' => 'Instagram', 'url' => 'https://www.instagram.com/2424.mg/'),
                            'youtube' => array('label' => 'YouTube', 'url' => 'https://www.youtube.com/channel/UCcjS1Us2l3yB8lLsDu3Vr6w'),
                            'linkedin' => array('label' => 'LinkedIn', 'url' => 'https://www.linkedin.com/company/2424-mg'),
                            'x' => array('label' => 'X', 'url' => 'https://x.com/2424_mg'),
                        );
                        foreach ($footer_social_defaults as $social_key => $social) :
                            $social_option = 'platform_2424_footer_' . $social_key . '_url';
                            ?>
                            <tr>
                                <th scope="row"><label for="<?php echo esc_attr($social_option); ?>"><?php echo esc_html($social['label']); ?></label></th>
                                <td>
                                    <input type="url" id="<?php echo esc_attr($social_option); ?>" name="<?php echo esc_attr($social_option); ?>" value="<?php echo esc_attr((string) get_option($social_option, $social['url'])); ?>" class="regular-text code" placeholder="https://..." />
                                    <p class="description">Laissez vide pour ne pas afficher ce réseau social.</p>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                        <tr>
                            <th scope="row">Références SEO des pages publiques</th>
                            <td>
                                <p class="description">Choisissez les pages WordPress dont Next doit reprendre le titre, la description, l’image sociale et l’indexation. Les champs Yoast et Rank Math sont lus lorsqu’ils existent ; sinon le titre, l’extrait et l’image mise en avant de WordPress sont utilisés.</p>
                                <?php foreach (platform_2424_get_public_seo_reference_pages() as $reference) : ?>
                                    <p>
                                        <label for="<?php echo esc_attr($reference['option']); ?>"><strong><?php echo esc_html($reference['label']); ?></strong> <code><?php echo esc_html($reference['path']); ?></code></label><br />
                                        <?php
                                        wp_dropdown_pages(array(
                                            'name' => $reference['option'],
                                            'id' => $reference['option'],
                                            'selected' => absint(get_option($reference['option'], 0)),
                                            'show_option_none' => 'Aucune référence (valeurs de secours)',
                                            'option_none_value' => 0,
                                            'class' => 'regular-text',
                                        ));
                                        ?>
                                    </p>
                                <?php endforeach; ?>
                            </td>
                        </tr>
                        <tr class="platform-2424-form-section"><th colspan="2">Intégrations et services</th></tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_media_presign_url">URL presign m?dia</label></th>
                            <td>
                                <input
                                    type="url"
                                    id="platform_2424_media_presign_url"
                                    name="platform_2424_media_presign_url"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_media_presign_url', '')); ?>"
                                    class="regular-text code"
                                    placeholder="https://api.example.com/media/presign"
                                />
                                <p class="description">
                                    Utilis?e par les publicit?s WordPress pour pr?parer l'upload S3. Si vide, le plugin essaie <code>PLATFORM_2424_MEDIA_PRESIGN_URL</code>, puis <code>API_GATEWAY_BASE_URL</code> + <code>API_GATEWAY_MEDIA_PRESIGN_PATH</code>.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_support_email">Email support affiché</label></th>
                            <td>
                                <input
                                    type="email"
                                    id="platform_2424_support_email"
                                    name="platform_2424_support_email"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_support_email', '')); ?>"
                                    class="regular-text code"
                                    placeholder="contact@2424.winfordcap.com"
                                />
                                <p class="description">
                                    Utilisé dans le footer des emails 2424 et à la place de l'email d'administration lorsqu'il est affiché dans les emails core WordPress.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_plugin_update_url">CloudFront helper</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_plugin_update_url"
                                    name="platform_2424_plugin_update_url"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_plugin_update_url', '')); ?>"
                                    class="regular-text code"
                                    placeholder="dxxxx.cloudfront.net"
                                />
                                <p class="description">
                                    Le plugin complete automatiquement vers <code>/2424-platform/latest.json</code> si vous ne mettez qu'un domaine.
                                    Vous pouvez aussi coller directement l'URL complete du JSON.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_annonces_display_mode">Mode affichage Annonces</label></th>
                            <td>
                                <select
                                    id="platform_2424_annonces_display_mode"
                                    name="platform_2424_annonces_display_mode"
                                    class="regular-text"
                                >
                                    <option value="separate" <?php selected(platform_2424_get_annonces_display_mode(), 'separate'); ?>>
                                        Séparé
                                    </option>
                                    <option value="blended" <?php selected(platform_2424_get_annonces_display_mode(), 'blended'); ?>>
                                        Fusionné
                                    </option>
                                </select>
                                <p class="description">
                                    Séparé : petites annonces et offres d'emploi restent visibles séparément. Fusionné : le menu public expose un seul point d'entrée "Annonces" qui mélange les deux.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_email_dispatcher_lambda_url">Lambda email dispatcher URL</label></th>
                            <td>
                                <input
                                    type="url"
                                    id="platform_2424_email_dispatcher_lambda_url"
                                    name="platform_2424_email_dispatcher_lambda_url"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_email_dispatcher_lambda_url', '')); ?>"
                                    class="regular-text code"
                                    placeholder="https://xxxx.lambda-url.eu-west-1.on.aws/"
                                />
                                <p class="description">
                                    Utilisee par l'onglet Emails pour envoyer les campagnes de test via le meme renderer HTML que les emails transactionnels.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_submissions_secret">Secret des échanges internes</label></th>
                            <td>
                                <input
                                    type="password"
                                    id="platform_2424_submissions_secret"
                                    name="platform_2424_submissions_secret"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_submissions_secret', '')); ?>"
                                    class="regular-text code"
                                    autocomplete="new-password"
                                />
                                <p class="description">Doit correspondre exactement à <code>PLATFORM_SUBMISSIONS_SECRET</code> sur Next.js. Il protège les échanges internes, y compris les créations et l’actualisation du cache public.</p>
                            </td>
                        </tr>
                        <tr class="platform-2424-form-section"><th colspan="2">Suppression des médias</th></tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_media_public_base_url">URL publique du CDN média</label></th>
                            <td>
                                <input
                                    type="url"
                                    id="platform_2424_media_public_base_url"
                                    name="platform_2424_media_public_base_url"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_media_public_base_url', '')); ?>"
                                    class="regular-text code"
                                    placeholder="https://d3s0sywpv84719.cloudfront.net"
                                />
                                <p class="description">Origine HTTPS qui sert les fichiers <code>uploads/</code>. Elle permet d’identifier les objets S3 autorisés à être purgés.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_media_delete_url">URL de la Lambda média</label></th>
                            <td>
                                <input
                                    type="url"
                                    id="platform_2424_media_delete_url"
                                    name="platform_2424_media_delete_url"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_media_delete_url', '')); ?>"
                                    class="regular-text code"
                                    placeholder="https://api.example.com/media/delete"
                                />
                                <p class="description">Endpoint privé <code>POST /media/delete</code> utilisé pour purger les images S3 devenues inutilisées.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_media_delete_secret">Secret de suppression média</label></th>
                            <td>
                                <input
                                    type="password"
                                    id="platform_2424_media_delete_secret"
                                    name="platform_2424_media_delete_secret"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_media_delete_secret', '')); ?>"
                                    class="regular-text code"
                                    autocomplete="new-password"
                                />
                                <p class="description">Doit correspondre exactement à <code>MEDIA_DELETE_SHARED_SECRET</code> dans la configuration de la Lambda AWS.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_media_inventory_url">URL Lambda inventaire média</label></th>
                            <td><input type="url" id="platform_2424_media_inventory_url" name="platform_2424_media_inventory_url" value="<?php echo esc_attr((string) get_option('platform_2424_media_inventory_url', '')); ?>" class="regular-text code" placeholder="https://api.example.com/media/inventory" />
                            <p class="description">Endpoint privé <code>POST /media/inventory</code> en lecture seule. <button type="submit" class="button button-secondary" form="platform-2424-test-media-inventory">Tester</button></p></td>
                        </tr>
                        <tr>
                            <th scope="row">État de la purge S3</th>
                            <td>
                                <?php $media_cleanup = function_exists('platform_submissions_media_cleanup_diagnostics') ? platform_submissions_media_cleanup_diagnostics() : array('available' => false); ?>
                                <?php $media_cdn_url = function_exists('platform_submissions_get_media_public_base_url') ? platform_submissions_get_media_public_base_url() : ''; ?>
                                <?php $media_recovery = function_exists('platform_submissions_get_media_recovery_state') ? platform_submissions_get_media_recovery_state() : array(); ?>
                                <?php if (empty($media_cleanup['available'])) : ?>
                                    <p><strong>Indisponible</strong> : Action Scheduler n'est pas chargé.</p>
                                <?php else : ?>
                                    <p>
                                        <strong><?php echo ($media_cdn_url !== '' && get_option('platform_2424_media_delete_url', '') !== '' && get_option('platform_2424_media_delete_secret', '') !== '') ? 'Configurée' : 'À configurer'; ?></strong>
                                        &mdash; <?php echo esc_html(sprintf('%d en attente, %d en cours, %d en échec.', absint($media_cleanup['pending'] ?? 0), absint($media_cleanup['running'] ?? 0), absint($media_cleanup['failed'] ?? 0))); ?>
                                    </p>
                                    <p class="description">CDN reconnu : <code><?php echo esc_html($media_cdn_url !== '' ? $media_cdn_url : 'manquant'); ?></code>.</p>
                                    <p>
                                        <button type="submit" class="button button-secondary" form="platform-2424-test-media-delete">Tester la liaison Lambda</button>
                                        <button type="submit" class="button button-secondary" form="platform-2424-retry-media-cleanup">Relancer les suppressions échouées</button>
                                        <button type="submit" class="button button-secondary" form="platform-2424-backfill-media-cleanup">Rechercher les suppressions manquées</button>
                                    </p>
                                    <?php
                                    $media_test_notice = get_transient('platform_2424_media_delete_test_notice_' . get_current_user_id());
                                    if (is_array($media_test_notice)) {
                                        delete_transient('platform_2424_media_delete_test_notice_' . get_current_user_id());
                                        echo '<p class="description"><strong>' . esc_html($media_test_notice['success'] ? 'Test réussi.' : 'Test échoué.') . '</strong> ' . esc_html($media_test_notice['message']) . '</p>';
                                    }
                                    $media_recovery_notice = get_transient('platform_2424_media_recovery_notice_' . get_current_user_id());
                                    if (is_array($media_recovery_notice)) {
                                        delete_transient('platform_2424_media_recovery_notice_' . get_current_user_id());
                                        echo '<p class="description"><strong>' . esc_html($media_recovery_notice['success'] ? 'Reprise planifiée.' : 'Reprise échouée.') . '</strong> ' . esc_html($media_recovery_notice['message']) . '</p>';
                                    }
                                    ?>
                                    <?php foreach (array('retry' => 'Relance', 'backfill' => 'Recherche') as $mode => $label) : ?>
                                        <?php $state = is_array($media_recovery[$mode] ?? null) ? $media_recovery[$mode] : array(); ?>
                                        <?php if (!empty($state)) : ?>
                                            <p class="description"><strong><?php echo esc_html($label); ?> :</strong> <?php echo esc_html((string) ($state['status'] ?? 'pending')); ?> — <?php echo esc_html((string) absint($state['checked'] ?? 0)); ?> annonces vérifiées, <?php echo esc_html((string) absint($state['queued'] ?? 0)); ?> médias planifiés, <?php echo esc_html((string) absint($state['blocked'] ?? 0)); ?> bloqués.<?php echo !empty($state['error']) ? ' Erreur : ' . esc_html((string) $state['error']) : ''; ?></p>
                                        <?php endif; ?>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                                <p class="description">Les objets ne sont effacés que lorsqu'ils ne sont référencés par aucune autre annonce.</p>
                            </td>
                        </tr>
                        <tr class="platform-2424-form-section"><th colspan="2">Publicité</th></tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_adsense_mode">Mode publicitaire Google</label></th>
                            <td>
                                <?php
                                $adsense_mode = trim((string) get_option('platform_2424_adsense_mode', ''));
                                if ($adsense_mode === '') {
                                    $adsense_mode = ((string) get_option('platform_2424_adsense_enabled', 'no') === 'yes') ? 'adsense' : 'placeholder';
                                }
                                $adsense_mode = platform_2424_sanitize_adsense_mode($adsense_mode);
                                ?>
                                <select id="platform_2424_adsense_mode" name="platform_2424_adsense_mode">
                                    <option value="disabled" <?php selected($adsense_mode, 'disabled'); ?>>Désactivé</option>
                                    <option value="placeholder" <?php selected($adsense_mode, 'placeholder'); ?>>Placeholder</option>
                                    <option value="adsense" <?php selected($adsense_mode, 'adsense'); ?>>Google AdSense</option>
                                </select>
                                <p class="description">
                                    Choisissez si les zones pub affichent un placeholder de test ou de vrais blocs Google AdSense.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Placeholders de test</th>
                            <td>
                                <label for="platform_2424_adsense_show_placeholders">
                                    <input type="hidden" name="platform_2424_adsense_show_placeholders" value="no" />
                                    <input
                                        type="checkbox"
                                        id="platform_2424_adsense_show_placeholders"
                                        name="platform_2424_adsense_show_placeholders"
                                        value="yes"
                                        <?php checked((string) get_option('platform_2424_adsense_show_placeholders', 'no'), 'yes'); ?>
                                    />
                                    Afficher les placeholders de test
                                </label>
                                <p class="description">
                                    Désactivé par défaut : les publicités configurées restent visibles, mais les zones vides n’occupent plus d’espace.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_adsense_client_id">ID compte AdSense</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_adsense_client_id"
                                    name="platform_2424_adsense_client_id"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_adsense_client_id', 'ca-pub-9214874716192005')); ?>"
                                    class="regular-text code"
                                    placeholder="ca-pub-9214874716192005"
                                />
                                <p class="description">
                                    Identifiant global du compte Google AdSense. Exemple : <code>ca-pub-9214874716192005</code>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_adsense_top_banner_slot">Slot bannière haut de page</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_adsense_top_banner_slot"
                                    name="platform_2424_adsense_top_banner_slot"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_adsense_top_banner_slot', '')); ?>"
                                    class="regular-text code"
                                    placeholder="1234567890"
                                />
                                <p class="description">
                                    ID de l’unité pub utilisée au-dessus du menu principal.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_adsense_home_top_slot">Slot accueil avant actualités</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_adsense_home_top_slot"
                                    name="platform_2424_adsense_home_top_slot"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_adsense_home_top_slot', '')); ?>"
                                    class="regular-text code"
                                    placeholder="1234567890"
                                />
                                <p class="description">
                                    ID de l’unité pub affichée avant le premier bloc d’actualités de la page d’accueil.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_adsense_home_after_editorial_slot">Slot accueil après actualités</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_adsense_home_after_editorial_slot"
                                    name="platform_2424_adsense_home_after_editorial_slot"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_adsense_home_after_editorial_slot', '')); ?>"
                                    class="regular-text code"
                                    placeholder="1234567890"
                                />
                                <p class="description">
                                    ID de l’unité pub affichée juste après le bloc principal d’actualités de la page d’accueil.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_adsense_archive_inline_slot">Slot listes et archives</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_adsense_archive_inline_slot"
                                    name="platform_2424_adsense_archive_inline_slot"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_adsense_archive_inline_slot', '')); ?>"
                                    class="regular-text code"
                                    placeholder="1234567890"
                                />
                                <p class="description">
                                    ID de l’unité pub utilisée dans les pages de listes et d’archives.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_adsense_article_inline_slot">Slot contenu article</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_adsense_article_inline_slot"
                                    name="platform_2424_adsense_article_inline_slot"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_adsense_article_inline_slot', '')); ?>"
                                    class="regular-text code"
                                    placeholder="1234567890"
                                />
                                <p class="description">
                                    ID de l’unité pub injectée dans le contenu d’un article.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_adsense_article_inline_start_after_blocks">Début pub dans l’article</label></th>
                            <td>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    id="platform_2424_adsense_article_inline_start_after_blocks"
                                    name="platform_2424_adsense_article_inline_start_after_blocks"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_adsense_article_inline_start_after_blocks', 3)); ?>"
                                    class="small-text"
                                />
                                <p class="description">
                                    Affiche la première pub après ce nombre de blocs de contenu. Exemple : <code>3</code> = après le 3e bloc.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_adsense_article_inline_repeat_every_blocks">Répétition pub article</label></th>
                            <td>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    id="platform_2424_adsense_article_inline_repeat_every_blocks"
                                    name="platform_2424_adsense_article_inline_repeat_every_blocks"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_adsense_article_inline_repeat_every_blocks', 4)); ?>"
                                    class="small-text"
                                />
                                <p class="description">
                                    Réinsère une pub tous les X blocs après la première. Exemple : <code>4</code> = une nouvelle pub tous les 4 blocs.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_adsense_article_rail_slot">Slot colonne article</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_adsense_article_rail_slot"
                                    name="platform_2424_adsense_article_rail_slot"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_adsense_article_rail_slot', '')); ?>"
                                    class="regular-text code"
                                    placeholder="1234567890"
                                />
                                <p class="description">
                                    ID de l’unité pub utilisée dans la colonne ou le bloc pub d’un article.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_email_dispatcher_shared_secret">Lambda shared secret</label></th>
                            <td>
                                <input
                                    type="password"
                                    id="platform_2424_email_dispatcher_shared_secret"
                                    name="platform_2424_email_dispatcher_shared_secret"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_email_dispatcher_shared_secret', '')); ?>"
                                    class="regular-text code"
                                    autocomplete="new-password"
                                />
                                <p class="description">
                                    Doit correspondre a <code>EMAIL_DISPATCHER_SHARED_SECRET</code> cote Lambda.
                                </p>
                            </td>
                        </tr>
                        <tr class="platform-2424-form-section"><th colspan="2">Notifications push Web</th></tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_vapid_public_key">Clé publique VAPID</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_vapid_public_key"
                                    name="platform_2424_vapid_public_key"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_vapid_public_key', '')); ?>"
                                    class="regular-text code"
                                    autocomplete="off"
                                />
                                <p class="description">Clé publique utilisée par le navigateur lors de l&apos;activation des notifications push.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_vapid_private_key">Clé privée VAPID</label></th>
                            <td>
                                <input
                                    type="password"
                                    id="platform_2424_vapid_private_key"
                                    name="platform_2424_vapid_private_key"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_vapid_private_key', '')); ?>"
                                    class="regular-text code"
                                    autocomplete="new-password"
                                />
                                <p class="description">Secret serveur uniquement. Il n&apos;est jamais envoyé au navigateur ni inclus dans les exports de réglages.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_vapid_subject">Sujet VAPID</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_vapid_subject"
                                    name="platform_2424_vapid_subject"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_vapid_subject', 'mailto:contact@2424.mg')); ?>"
                                    class="regular-text code"
                                    placeholder="mailto:contact@2424.mg"
                                />
                                <p class="description">Contact technique associé aux envois Push, par exemple <code>mailto:contact@2424.mg</code>.</p>
                            </td>
                        </tr>
                        <tr class="platform-2424-form-section"><th colspan="2">Email technique et SMTP</th></tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_smtp_host">SMTP Host</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_smtp_host"
                                    name="platform_2424_smtp_host"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_smtp_host', '')); ?>"
                                    class="regular-text code"
                                    placeholder="email-smtp.eu-west-1.amazonaws.com"
                                />
                                <p class="description">Saisissez uniquement le nom d&apos;hôte, par exemple <code>mail.2424.mg</code>, sans <code>https://</code>.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_smtp_port">SMTP Port</label></th>
                            <td>
                                <input
                                    type="number"
                                    id="platform_2424_smtp_port"
                                    name="platform_2424_smtp_port"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_smtp_port', '587')); ?>"
                                    class="small-text"
                                    min="1"
                                    max="65535"
                                    placeholder="587"
                                />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_smtp_user">SMTP User</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_smtp_user"
                                    name="platform_2424_smtp_user"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_smtp_user', '')); ?>"
                                    class="regular-text code"
                                />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_smtp_pass">SMTP Password</label></th>
                            <td>
                                <input
                                    type="password"
                                    id="platform_2424_smtp_pass"
                                    name="platform_2424_smtp_pass"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_smtp_pass', '')); ?>"
                                    class="regular-text code"
                                    autocomplete="new-password"
                                />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_smtp_secure">SMTP Secure</label></th>
                            <td>
                                <?php $smtp_secure = (string) get_option('platform_2424_smtp_secure', 'tls'); ?>
                                <select id="platform_2424_smtp_secure" name="platform_2424_smtp_secure">
                                    <option value="" <?php selected($smtp_secure, ''); ?>>Aucun</option>
                                    <option value="tls" <?php selected($smtp_secure, 'tls'); ?>>TLS</option>
                                    <option value="ssl" <?php selected($smtp_secure, 'ssl'); ?>>SSL</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_smtp_from_email">From Email</label></th>
                            <td>
                                <input
                                    type="email"
                                    id="platform_2424_smtp_from_email"
                                    name="platform_2424_smtp_from_email"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_smtp_from_email', '')); ?>"
                                    class="regular-text code"
                                    placeholder="no-reply@2424.mg"
                                />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="platform_2424_smtp_from_name">From Name</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="platform_2424_smtp_from_name"
                                    name="platform_2424_smtp_from_name"
                                    value="<?php echo esc_attr((string) get_option('platform_2424_smtp_from_name', '2424.mg')); ?>"
                                    class="regular-text"
                                    placeholder="2424.mg"
                                />
                            </td>
                        </tr>
                    </table>
                    <p class="description">
                        SMTP : renseignez ces champs ici ou gardez les variables d'environnement (<code>PLATFORM_SMTP_*</code>).
                        Lorsqu'un SMTP complet est configuré, il est prioritaire sur l'ancien dispatcher Lambda.
                    </p>
                    <?php submit_button('Enregistrer'); ?>
                </form>
                <?php if (function_exists('platform_submissions_get_latest_media_orphan_audit')) : ?>
                    <?php $orphan_audit = platform_submissions_get_latest_media_orphan_audit(); ?>
                    <section class="platform-2424-card" style="margin-top:20px;">
                        <h3>Audit des images S3 orphelines</h3>
                        <p>Les images de <code>uploads/</code> sans référence WordPress et âgées de plus de 7 jours sont proposées. Les documents sont exclus.</p>
                        <?php $orphan_notice = get_transient('platform_2424_media_orphan_notice_' . get_current_user_id()); if (is_array($orphan_notice)) : delete_transient('platform_2424_media_orphan_notice_' . get_current_user_id()); ?>
                            <p class="description"><strong><?php echo esc_html($orphan_notice['success'] ? 'Succès.' : 'Échec.'); ?></strong> <?php echo esc_html($orphan_notice['message']); ?></p>
                        <?php endif; ?>
                        <p><button type="submit" class="button button-secondary" form="platform-2424-start-media-orphan-audit">Lancer un audit maintenant</button></p>
                        <?php if ($orphan_audit) : ?>
                            <p><strong><?php echo esc_html($orphan_audit['status']); ?></strong> &mdash; <?php echo esc_html(sprintf('%d analysés, %d référencés, %d récents, %d candidats.', absint($orphan_audit['scanned']), absint($orphan_audit['referenced']), absint($orphan_audit['recent']), absint($orphan_audit['candidates']))); ?></p>
                            <?php global $wpdb; $orphan_tables = platform_submissions_media_orphan_audit_tables(); $orphan_items = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$orphan_tables['items']} WHERE audit_id = %d AND status = 'candidate' ORDER BY id DESC LIMIT 100", absint($orphan_audit['id'])), ARRAY_A); ?>
                            <?php if (!empty($orphan_items)) : ?>
                                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                                    <?php wp_nonce_field('platform_2424_queue_media_orphans'); ?><input type="hidden" name="action" value="platform_2424_queue_media_orphans" /><input type="hidden" name="audit_id" value="<?php echo esc_attr((string) $orphan_audit['id']); ?>" />
                                    <table class="widefat striped"><thead><tr><th></th><th>Clé</th><th>Taille</th><th>Modification</th></tr></thead><tbody>
                                    <?php foreach ($orphan_items as $orphan_item) : ?><tr><td><input type="checkbox" name="item_ids[]" value="<?php echo esc_attr((string) $orphan_item['id']); ?>" /></td><td><code><?php echo esc_html($orphan_item['media_key']); ?></code></td><td><?php echo esc_html(size_format(absint($orphan_item['size_bytes']))); ?></td><td><?php echo esc_html($orphan_item['last_modified']); ?></td></tr><?php endforeach; ?>
                                    </tbody></table><p><button type="submit" class="button button-secondary">Purger la sélection</button></p>
                                </form>
                            <?php endif; ?>
                        <?php endif; ?>
                    </section>
                <?php endif; ?>
                </div>
            <?php endif; ?>
                </main>
            </div>
            <?php platform_2424_render_password_visibility_controls(); ?>
        </div>
        <?php
    }
}

add_action('admin_post_platform_2424_clear_logs', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    check_admin_referer('platform_2424_clear_logs');
    platform_2424_clear_logs();

    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=logs&logs-cleared=1'));
    exit;
});

add_action('admin_post_platform_2424_retry_media_cleanup', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    check_admin_referer('platform_2424_retry_media_cleanup');
    $result = function_exists('platform_submissions_requeue_failed_media_cleanup')
        ? platform_submissions_requeue_failed_media_cleanup()
        : new WP_Error('platform_submissions_unavailable', 'Module de suppression media indisponible.');
    $notice = is_wp_error($result)
        ? array('success' => false, 'message' => $result->get_error_message())
        : array('success' => true, 'message' => !empty($result['alreadyScheduled']) ? 'Une relance est déjà en cours.' : 'Relance planifiée en arrière-plan.');
    set_transient('platform_2424_media_recovery_notice_' . get_current_user_id(), $notice, MINUTE_IN_SECONDS);
    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=configuration'));
    exit;
});

add_action('admin_post_platform_2424_test_media_delete', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    check_admin_referer('platform_2424_test_media_delete');

    $result = function_exists('platform_submissions_test_media_delete_connection')
        ? platform_submissions_test_media_delete_connection()
        : new WP_Error('platform_submissions_unavailable', 'Module de suppression media indisponible.');
    $notice = is_wp_error($result)
        ? array('success' => false, 'message' => $result->get_error_message())
        : array('success' => true, 'message' => 'La Lambda a accepte le test sans supprimer de fichier.');
    set_transient('platform_2424_media_delete_test_notice_' . get_current_user_id(), $notice, MINUTE_IN_SECONDS);

    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=configuration'));
    exit;
});

add_action('admin_post_platform_2424_backfill_media_cleanup', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    check_admin_referer('platform_2424_backfill_media_cleanup');

    $result = function_exists('platform_submissions_backfill_trashed_media_cleanup')
        ? platform_submissions_backfill_trashed_media_cleanup()
        : new WP_Error('platform_submissions_unavailable', 'Module de suppression media indisponible.');
    $notice = is_wp_error($result)
        ? array('success' => false, 'message' => $result->get_error_message())
        : array('success' => true, 'message' => !empty($result['alreadyScheduled']) ? 'Une recherche est déjà en cours.' : 'Recherche planifiée en arrière-plan.');
    set_transient('platform_2424_media_recovery_notice_' . get_current_user_id(), $notice, MINUTE_IN_SECONDS);
    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=configuration'));
    exit;
});

add_action('admin_post_platform_2424_start_media_orphan_audit', function () {
    if (!current_user_can('manage_options')) wp_die('Unauthorized');
    check_admin_referer('platform_2424_start_media_orphan_audit');
    $result = function_exists('platform_submissions_start_media_orphan_audit') ? platform_submissions_start_media_orphan_audit() : new WP_Error('platform_submissions_unavailable', 'Module d audit media indisponible.');
    set_transient('platform_2424_media_orphan_notice_' . get_current_user_id(), is_wp_error($result) ? array('success' => false, 'message' => $result->get_error_message()) : array('success' => true, 'message' => 'Audit planifie en arriere-plan.'), MINUTE_IN_SECONDS);
    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=configuration'));
    exit;
});

add_action('admin_post_platform_2424_test_media_inventory', function () {
    if (!current_user_can('manage_options')) wp_die('Unauthorized');
    check_admin_referer('platform_2424_test_media_inventory');
    $result = function_exists('platform_submissions_test_media_inventory_connection') ? platform_submissions_test_media_inventory_connection() : new WP_Error('platform_submissions_unavailable', 'Module d inventaire media indisponible.');
    set_transient('platform_2424_media_orphan_notice_' . get_current_user_id(), is_wp_error($result) ? array('success' => false, 'message' => $result->get_error_message()) : array('success' => true, 'message' => 'La Lambda d inventaire a repondu sans modifier S3.'), MINUTE_IN_SECONDS);
    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=configuration'));
    exit;
});

add_action('admin_post_platform_2424_queue_media_orphans', function () {
    if (!current_user_can('manage_options')) wp_die('Unauthorized');
    check_admin_referer('platform_2424_queue_media_orphans');
    $result = function_exists('platform_submissions_queue_selected_media_orphans') ? platform_submissions_queue_selected_media_orphans(absint($_POST['audit_id'] ?? 0), $_POST['item_ids'] ?? array()) : new WP_Error('platform_submissions_unavailable', 'Module d audit media indisponible.');
    set_transient('platform_2424_media_orphan_notice_' . get_current_user_id(), is_wp_error($result) ? array('success' => false, 'message' => $result->get_error_message()) : array('success' => true, 'message' => sprintf('%d media(s) mis en file, %d protege(s).', absint($result['queued'] ?? 0), absint($result['protected'] ?? 0))), MINUTE_IN_SECONDS);
    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=configuration'));
    exit;
});

add_action('admin_post_platform_2424_import_papi_gateway_key', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    check_admin_referer('platform_2424_import_papi_gateway_key');
    $redirect_url = admin_url('options-general.php?page=platform-2424-settings&tab=papi');
    if ((string) get_option('platform_2424_papi_api_key', '') !== '') {
        wp_safe_redirect(add_query_arg('papi-key-import', 'already-configured', $redirect_url));
        exit;
    }

    $gateway_settings = get_option('woocommerce_papi_gateway_settings', array());
    $api_key = is_array($gateway_settings) ? trim((string) ($gateway_settings['api_key'] ?? '')) : '';
    if ($api_key === '') {
        wp_safe_redirect(add_query_arg('papi-key-import', 'missing', $redirect_url));
        exit;
    }

    update_option('platform_2424_papi_api_key', $api_key, false);
    platform_billing_log('Imported existing PAPI gateway key into direct bridge settings.', array('source' => 'woocommerce_papi_gateway_settings'));
    wp_safe_redirect(add_query_arg('papi-key-import', 'imported', $redirect_url));
    exit;
});

add_action('admin_post_platform_2424_export_settings', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    check_admin_referer('platform_2424_export_settings');

    $include_sensitive_settings = isset($_POST['include_sensitive_settings']) && (string) $_POST['include_sensitive_settings'] === '1';
    $sensitive_option_names = platform_2424_get_sensitive_settings_option_keys();
    $non_transferable_option_names = platform_2424_get_non_transferable_settings_option_keys();
    $settings = array();
    $excluded_sensitive_settings = array();

    foreach (platform_2424_get_exportable_settings_option_keys() as $option_name) {
        if (in_array($option_name, $non_transferable_option_names, true)) {
            $excluded_sensitive_settings[] = $option_name;
            continue;
        }

        if (!$include_sensitive_settings && in_array($option_name, $sensitive_option_names, true)) {
            $excluded_sensitive_settings[] = $option_name;
            continue;
        }

        $settings[$option_name] = get_option($option_name, null);
    }

    $payload = array(
        'format' => '2424-platform-settings',
        'version' => 1,
        'pluginVersion' => PLATFORM_2424_PLUGIN_VERSION,
        'exportedAt' => gmdate('c'),
        'includesSensitiveSettings' => $include_sensitive_settings,
        'excludedSensitiveSettings' => $excluded_sensitive_settings,
        'settings' => $settings,
    );
    $filename = sprintf('2424-platform-settings-%s.json', gmdate('Ymd-His'));

    nocache_headers();
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo wp_json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
});

add_action('admin_post_platform_2424_export_taxonomies', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    check_admin_referer('platform_2424_export_taxonomies');

    $taxonomies = platform_2424_export_taxonomy_terms();
    $payload = array(
        'format' => '2424-platform-taxonomies',
        'version' => 1,
        'pluginVersion' => PLATFORM_2424_PLUGIN_VERSION,
        'exportedAt' => gmdate('c'),
        'taxonomies' => $taxonomies,
    );
    $filename = sprintf('2424-platform-taxonomies-%s.json', gmdate('Ymd-His'));

    nocache_headers();
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo wp_json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
});

add_action('admin_post_platform_2424_import_settings', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    check_admin_referer('platform_2424_import_settings');

    $redirect_url = admin_url('options-general.php?page=platform-2424-settings&tab=backup');
    $file = isset($_FILES['settings_file']) && is_array($_FILES['settings_file']) ? $_FILES['settings_file'] : null;
    $is_confirmed = isset($_POST['confirm_import']) && (string) $_POST['confirm_import'] === '1';

    if (!$is_confirmed || !$file || (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || (int) ($file['size'] ?? 0) > 2 * MB_IN_BYTES) {
        wp_safe_redirect(add_query_arg('settings-transfer', 'failed', $redirect_url));
        exit;
    }

    $contents = file_get_contents((string) $file['tmp_name']);
    $payload = is_string($contents) ? json_decode($contents, true) : null;
    $settings = is_array($payload) ? ($payload['settings'] ?? null) : null;

    if (
        !is_array($payload)
        || (string) ($payload['format'] ?? '') !== '2424-platform-settings'
        || (int) ($payload['version'] ?? 0) !== 1
        || !is_array($settings)
    ) {
        wp_safe_redirect(add_query_arg('settings-transfer', 'invalid', $redirect_url));
        exit;
    }

    $allowed_option_names = array_flip(platform_2424_get_exportable_settings_option_keys());
    $non_transferable_option_names = array_flip(platform_2424_get_non_transferable_settings_option_keys());
    $registered_settings = get_registered_settings();
    $imported_count = 0;
    $skipped_count = 0;

    foreach ($settings as $option_name => $value) {
        $option_name = is_string($option_name) ? $option_name : '';
        if ($option_name === '' || isset($non_transferable_option_names[$option_name]) || !isset($allowed_option_names[$option_name]) || !platform_2424_is_valid_settings_transfer_value($value)) {
            $skipped_count++;
            continue;
        }

        $sanitize_callback = $registered_settings[$option_name]['sanitize_callback'] ?? null;
        if (is_callable($sanitize_callback)) {
            $value = call_user_func($sanitize_callback, $value);
        }

        update_option($option_name, $value);
        $imported_count++;
    }

    wp_safe_redirect(add_query_arg(array(
        'settings-transfer' => 'imported',
        'imported' => $imported_count,
        'skipped' => $skipped_count,
    ), $redirect_url));
    exit;
});

add_action('admin_post_platform_2424_import_taxonomies', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    check_admin_referer('platform_2424_import_taxonomies');

    $redirect_url = admin_url('options-general.php?page=platform-2424-settings&tab=backup');
    $file = isset($_FILES['taxonomies_file']) && is_array($_FILES['taxonomies_file']) ? $_FILES['taxonomies_file'] : null;
    $confirmed = isset($_POST['confirm_taxonomy_import']) && (string) $_POST['confirm_taxonomy_import'] === '1';
    if (!$confirmed || !$file || (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || (int) ($file['size'] ?? 0) > 5 * MB_IN_BYTES) {
        wp_safe_redirect(add_query_arg('taxonomy-transfer', 'failed', $redirect_url));
        exit;
    }

    $contents = file_get_contents((string) $file['tmp_name']);
    $payload = is_string($contents) ? json_decode($contents, true) : null;
    $taxonomies = is_array($payload) ? ($payload['taxonomies'] ?? null) : null;
    if (!is_array($payload) || (string) ($payload['format'] ?? '') !== '2424-platform-taxonomies' || (int) ($payload['version'] ?? 0) !== 1 || !is_array($taxonomies)) {
        wp_safe_redirect(add_query_arg('taxonomy-transfer', 'invalid', $redirect_url));
        exit;
    }

    $allowed_taxonomies = array_flip(platform_2424_get_transferable_taxonomies());
    $created = 0;
    $updated = 0;
    $skipped = 0;
    $normalized = array();
    $term_ids = array();
    $skip_revalidation = function () { return true; };
    add_filter('next_revalidate_skip_taxonomy_payload', $skip_revalidation, 10, 0);

    try {
        foreach ($taxonomies as $taxonomy => $entries) {
            $taxonomy = sanitize_key((string) $taxonomy);
            if (!isset($allowed_taxonomies[$taxonomy]) || !is_array($entries)) {
                $skipped += is_array($entries) ? count($entries) : 1;
                continue;
            }

            $normalized[$taxonomy] = array();
            $term_ids[$taxonomy] = array();
            foreach ($entries as $entry) {
                $term = platform_2424_normalize_taxonomy_import_term($entry);
                if (!$term) {
                    $skipped++;
                    continue;
                }

                $existing = get_term_by('slug', $term['slug'], $taxonomy);
                if ($existing instanceof WP_Term) {
                    $result = wp_update_term($existing->term_id, $taxonomy, array(
                        'name' => $term['name'],
                        'slug' => $term['slug'],
                        'description' => $term['description'],
                    ));
                    if (is_wp_error($result)) {
                        $skipped++;
                        continue;
                    }
                    $term_id = (int) $existing->term_id;
                    $updated++;
                } else {
                    $result = wp_insert_term($term['name'], $taxonomy, array(
                        'slug' => $term['slug'],
                        'description' => $term['description'],
                    ));
                    if (is_wp_error($result) || empty($result['term_id'])) {
                        $skipped++;
                        continue;
                    }
                    $term_id = (int) $result['term_id'];
                    $created++;
                }

                $normalized[$taxonomy][] = $term;
                $term_ids[$taxonomy][$term['slug']] = $term_id;
            }
        }

        foreach ($normalized as $taxonomy => $entries) {
            foreach ($entries as $term) {
                $term_id = absint($term_ids[$taxonomy][$term['slug']] ?? 0);
                if (!$term_id) {
                    continue;
                }
                $parent_id = absint($term_ids[$taxonomy][$term['parentSlug']] ?? 0);
                if (!$parent_id && $term['parentSlug'] !== '') {
                    $parent = get_term_by('slug', $term['parentSlug'], $taxonomy);
                    $parent_id = $parent instanceof WP_Term ? (int) $parent->term_id : 0;
                }
                if (is_wp_error(wp_update_term($term_id, $taxonomy, array('parent' => $parent_id)))) {
                    $skipped++;
                    continue;
                }
                update_term_meta($term_id, 'platform_term_order', $term['order']);

                if ($taxonomy === 'classified_category' && function_exists('platform_submissions_classified_product_tag_meta_key')) {
                    $tag_ids = array();
                    foreach ($term['allowedProductTagSlugs'] as $tag_slug) {
                        $tag_id = absint($term_ids['classified_product_tag'][$tag_slug] ?? 0);
                        if (!$tag_id) {
                            $tag = get_term_by('slug', $tag_slug, 'classified_product_tag');
                            $tag_id = $tag instanceof WP_Term ? (int) $tag->term_id : 0;
                        }
                        if ($tag_id) {
                            $tag_ids[] = $tag_id;
                        }
                    }
                    $meta_key = platform_submissions_classified_product_tag_meta_key();
                    if ($tag_ids) {
                        update_term_meta($term_id, $meta_key, array_values(array_unique($tag_ids)));
                    } else {
                        delete_term_meta($term_id, $meta_key);
                    }
                }
            }
        }
    } finally {
        remove_filter('next_revalidate_skip_taxonomy_payload', $skip_revalidation, 10);
    }

    if (function_exists('next_revalidate_send_scope_payload')) {
        next_revalidate_send_scope_payload(array('classified', 'job', 'tender', 'directory'), 'taxonomy.imported');
    }

    wp_safe_redirect(add_query_arg(array(
        'taxonomy-transfer' => 'imported',
        'created' => $created,
        'updated' => $updated,
        'skipped' => $skipped,
    ), $redirect_url));
    exit;
});

add_action('admin_post_platform_2424_generate_mvola_token', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    check_admin_referer('platform_2424_generate_mvola_token');

    $token = function_exists('mvola_get_token') ? mvola_get_token() : '';
    if ($token !== '') {
        set_transient(platform_2424_mvola_token_transient_key(), $token, 55 * MINUTE_IN_SECONDS);
        wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=mvola&mvola_status=success'));
        exit;
    }

    delete_transient(platform_2424_mvola_token_transient_key());
    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=mvola&mvola_status=error'));
    exit;
});

add_action('update_option_platform_2424_plugin_update_url', function () {
    delete_site_transient('platform_2424_plugin_update_metadata');
}, 10, 0);

add_action('update_option_platform_2424_pricing_rules', function () {
    if (function_exists('platform_submissions_invalidate_pricing_catalog')) {
        platform_submissions_invalidate_pricing_catalog();
    }
}, 10, 0);

// Product prices and SKUs may change independently from the Platform settings.
// Invalidate the checkout catalogue immediately for both simple products and variations.
foreach (array(
    'woocommerce_new_product',
    'woocommerce_update_product',
    'woocommerce_delete_product',
    'woocommerce_new_product_variation',
    'woocommerce_update_product_variation',
    'woocommerce_delete_product_variation',
) as $platform_2424_pricing_product_hook) {
    add_action($platform_2424_pricing_product_hook, function () {
        if (function_exists('platform_submissions_invalidate_pricing_catalog')) {
            platform_submissions_invalidate_pricing_catalog();
        }
    }, 20, 0);
}

function platform_2424_revalidate_public_seo_settings() {
    if (function_exists('next_revalidate_send_payload')) {
        next_revalidate_send_payload(array(
            'event' => 'settings.updated',
            'postType' => 'platform_settings',
        ));
    }
}

foreach (platform_2424_get_public_seo_reference_pages() as $platform_2424_seo_reference) {
    add_action('update_option_' . $platform_2424_seo_reference['option'], 'platform_2424_revalidate_public_seo_settings', 10, 0);
    add_action('add_option_' . $platform_2424_seo_reference['option'], 'platform_2424_revalidate_public_seo_settings', 10, 0);
}

foreach (array(
    'blogname',
    'blogdescription',
    'site_icon',
    'wp_page_for_privacy_policy',
    'platform_2424_public_logo_url',
    'platform_2424_home_title',
    'platform_2424_home_description',
    'platform_2424_footer_description',
    'platform_2424_footer_facebook_url',
    'platform_2424_footer_tiktok_url',
    'platform_2424_footer_instagram_url',
    'platform_2424_footer_youtube_url',
    'platform_2424_footer_linkedin_url',
    'platform_2424_footer_x_url',
) as $platform_2424_seo_site_option) {
    add_action('update_option_' . $platform_2424_seo_site_option, 'platform_2424_revalidate_public_seo_settings', 10, 0);
    add_action('add_option_' . $platform_2424_seo_site_option, 'platform_2424_revalidate_public_seo_settings', 10, 0);
}

// Les reglages de regie sont lus par Next via la configuration publique. Sans
// ce signal, un changement de placeholder reste masque par son cache partage.
foreach (array(
    'platform_2424_adsense_mode',
    'platform_2424_adsense_show_placeholders',
    'platform_2424_adsense_client_id',
) as $platform_2424_adsense_option) {
    add_action('update_option_' . $platform_2424_adsense_option, 'platform_2424_revalidate_public_seo_settings', 10, 0);
    add_action('add_option_' . $platform_2424_adsense_option, 'platform_2424_revalidate_public_seo_settings', 10, 0);
}

add_action('save_post_page', function ($post_id, $post, $update) {
    if (!$post instanceof WP_Post || wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }

    foreach (platform_2424_get_public_seo_reference_pages() as $reference) {
        if (absint(get_option($reference['option'], 0)) === absint($post_id)) {
            platform_2424_revalidate_public_seo_settings();
            return;
        }
    }

    if (absint(get_option('wp_page_for_privacy_policy', 0)) === absint($post_id)) {
        platform_2424_revalidate_public_seo_settings();
    }
}, 20, 3);

if (!function_exists('platform_2424_build_plugin_update_payload')) {
    function platform_2424_build_plugin_update_payload($metadata) {
        return (object) array(
            'slug' => $metadata['slug'],
            'plugin' => PLATFORM_2424_PLUGIN_BASENAME,
            'new_version' => $metadata['version'],
            'package' => $metadata['download_url'],
            'url' => $metadata['download_url'],
            'tested' => $metadata['tested'],
            'requires' => $metadata['requires'],
            'requires_php' => $metadata['requires_php'],
        );
    }
}

add_filter('pre_set_site_transient_update_plugins', function ($transient) {
    if (!is_object($transient)) {
        $transient = new stdClass();
    }

    $metadata = platform_2424_get_update_metadata();
    if (!is_array($metadata)) {
        return $transient;
    }

    if (version_compare($metadata['version'], PLATFORM_2424_PLUGIN_VERSION, '>')) {
        $transient->response[PLATFORM_2424_PLUGIN_BASENAME] = platform_2424_build_plugin_update_payload($metadata);
    } else {
        $transient->no_update[PLATFORM_2424_PLUGIN_BASENAME] = platform_2424_build_plugin_update_payload($metadata);
    }

    return $transient;
});

add_filter('plugins_api', function ($result, $action, $args) {
    if ($action !== 'plugin_information' || empty($args->slug) || $args->slug !== '2424-platform') {
        return $result;
    }

    $metadata = platform_2424_get_update_metadata();
    if (!is_array($metadata)) {
        return $result;
    }

    return (object) array(
        'name' => $metadata['name'],
        'slug' => $metadata['slug'],
        'version' => $metadata['version'],
        'author' => 'RijaCloud',
        'author_profile' => 'https://github.com/RijaCloud',
        'homepage' => $metadata['download_url'],
        'download_link' => $metadata['download_url'],
        'requires' => $metadata['requires'],
        'tested' => $metadata['tested'],
        'requires_php' => $metadata['requires_php'],
        'last_updated' => $metadata['last_updated'],
        'sections' => array(
            'description' => wp_kses_post((string) ($metadata['sections']['description'] ?? 'Plugin interne Tanyora.')),
        ),
    );
}, 10, 3);

add_action('upgrader_process_complete', function ($upgrader, $hook_extra) {
    if (empty($hook_extra['plugins']) || !is_array($hook_extra['plugins'])) {
        return;
    }

    if (in_array(PLATFORM_2424_PLUGIN_BASENAME, $hook_extra['plugins'], true)) {
        delete_site_transient('platform_2424_plugin_update_metadata');
    }
}, 10, 2);

if (!function_exists('platform_2424_configure_smtp_mailer')) {
    function platform_2424_get_smtp_setting($env_key, $option_key, $default = '') {
        $stored = get_option($option_key, '');
        if (is_string($stored) && trim($stored) !== '') {
            $value = trim((string) $stored);
            return $option_key === 'platform_2424_smtp_host' ? platform_2424_sanitize_smtp_host($value) : $value;
        }

        $env_value = getenv((string) $env_key);
        if (is_string($env_value) && trim($env_value) !== '') {
            $value = trim((string) $env_value);
            return $option_key === 'platform_2424_smtp_host' ? platform_2424_sanitize_smtp_host($value) : $value;
        }

        return $default;
    }

    function platform_2424_is_smtp_configured() {
        $host = platform_2424_get_smtp_setting('PLATFORM_SMTP_HOST', 'platform_2424_smtp_host', '');
        $username = platform_2424_get_smtp_setting('PLATFORM_SMTP_USER', 'platform_2424_smtp_user', '');
        $password = platform_2424_get_smtp_setting('PLATFORM_SMTP_PASS', 'platform_2424_smtp_pass', '');

        return $host !== '' && $username !== '' && $password !== '';
    }

    function platform_2424_configure_smtp_mailer($phpmailer) {
        $host = platform_2424_get_smtp_setting('PLATFORM_SMTP_HOST', 'platform_2424_smtp_host', '');
        $port = (int) platform_2424_get_smtp_setting('PLATFORM_SMTP_PORT', 'platform_2424_smtp_port', '587');
        $username = platform_2424_get_smtp_setting('PLATFORM_SMTP_USER', 'platform_2424_smtp_user', '');
        $password = platform_2424_get_smtp_setting('PLATFORM_SMTP_PASS', 'platform_2424_smtp_pass', '');
        $secure = platform_2424_get_smtp_setting('PLATFORM_SMTP_SECURE', 'platform_2424_smtp_secure', 'tls');
        $from_email = platform_2424_get_smtp_setting('PLATFORM_SMTP_FROM_EMAIL', 'platform_2424_smtp_from_email', '');
        $from_name = platform_2424_get_smtp_setting('PLATFORM_SMTP_FROM_NAME', 'platform_2424_smtp_from_name', '2424.mg');

        if (!platform_2424_is_smtp_configured() || !$port) {
            return;
        }

        $phpmailer->isSMTP();
        $phpmailer->Host = (string) $host;
        $phpmailer->Port = $port > 0 ? $port : 587;
        $phpmailer->SMTPAuth = true;
        $phpmailer->Username = (string) $username;
        $phpmailer->Password = (string) $password;
        $phpmailer->SMTPSecure = in_array($secure, array('tls', 'ssl'), true) ? (string) $secure : 'tls';
        $phpmailer->CharSet = 'UTF-8';

        if ($from_email && is_email($from_email)) {
            $phpmailer->setFrom((string) $from_email, $from_name ? (string) $from_name : '2424.mg', false);
        }
    }
}
add_action('phpmailer_init', 'platform_2424_configure_smtp_mailer');

$platform_module_files = array(
    __DIR__ . '/includes/2424-platform-submissions.php',
    __DIR__ . '/includes/tanyora-shop.php',
    __DIR__ . '/includes/tanyora-commerce.php',
    __DIR__ . '/includes/2424-platform-public-listing-index.php',
    __DIR__ . '/includes/2424-platform-directory-index.php',
    __DIR__ . '/includes/2424-platform-auth.php',
    __DIR__ . '/includes/2424-platform-billing.php',
    __DIR__ . '/includes/2424-platform-papi.php',
    __DIR__ . '/includes/2424-platform-typesense.php',
    __DIR__ . '/includes/2424-platform-ads.php',
    __DIR__ . '/includes/2424-platform-news.php',
    __DIR__ . '/includes/2424-platform-health.php',
    __DIR__ . '/includes/2424-platform-test-tools.php',
    __DIR__ . '/includes/2424-platform-stress-test-mass.php',
    __DIR__ . '/includes/next-revalidate-webhook.php',
);

foreach ($platform_module_files as $platform_module_file) {
    if (file_exists($platform_module_file)) {
        require_once $platform_module_file;
    }
}
