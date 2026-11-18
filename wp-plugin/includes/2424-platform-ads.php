<?php
/**
 * 2424 Platform Ads module
 * Description: Gestionnaire de publicites. Le frontend declare les emplacements,
 *              ce module decide de ce qui s'y affiche : banniere maison, AdSense,
 *              Google Ad Manager ou tag d'annonceur.
 * Version: 2.6.0
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('PLATFORM_2424_ADS_POST_TYPE')) {
    define('PLATFORM_2424_ADS_POST_TYPE', 'platform_ad');
}

if (!defined('PLATFORM_2424_ADS_MODULE_VERSION')) {
    define('PLATFORM_2424_ADS_MODULE_VERSION', '2.6.0');
}

/** Capacite requise pour saisir un tag tiers, distincte de `edit_posts`. */
if (!defined('PLATFORM_2424_ADS_SCRIPT_CAPABILITY')) {
    define('PLATFORM_2424_ADS_SCRIPT_CAPABILITY', 'manage_platform_ads');
}

/* -------------------------------------------------------------------------
 * Catalogue des emplacements
 * ---------------------------------------------------------------------- */

if (!function_exists('platform_2424_ads_get_formats')) {
    /**
     * Formats vendus, tels qu'ils figurent au kit media. Le format est un
     * choix a part entiere : il dit quelle taille la publicite occupe, la ou
     * l'emplacement dit seulement ou elle s'affiche.
     */
    function platform_2424_ads_get_formats() {
        return array(
            'header' => array('label' => 'Header', 'width' => 1940, 'height' => 180),
            'tribune' => array('label' => 'Tribune', 'width' => 760, 'height' => 136),
            'sous_tribune' => array('label' => 'Sous-Tribune', 'width' => 300, 'height' => 250),
            'article_inline' => array('label' => 'Article inline', 'width' => 726, 'height' => 90),
        );
    }
}

if (!function_exists('platform_2424_ads_format_label')) {
    function platform_2424_ads_format_label($format_key) {
        $formats = platform_2424_ads_get_formats();
        if (!isset($formats[$format_key])) {
            return 'Personnalisé';
        }

        $format = $formats[$format_key];

        return sprintf('%s — %d×%d', $format['label'], $format['width'], $format['height']);
    }
}

if (!function_exists('platform_2424_ads_resolve_format')) {
    /** Dimensions retenues pour une publicite : format vendu, ou taille libre. */
    function platform_2424_ads_resolve_format($post_id, $slot_key) {
        $formats = platform_2424_ads_get_formats();
        $format_key = (string) get_post_meta($post_id, '_platform_2424_ad_format_key', true);

        if ($format_key === '') {
            $slots = platform_2424_ads_get_slots();
            $format_key = $slots[$slot_key]['default_format'] ?? '';
        }

        if (isset($formats[$format_key])) {
            return array(
                'key' => $format_key,
                'width' => (int) $formats[$format_key]['width'],
                'height' => (int) $formats[$format_key]['height'],
            );
        }

        $width = (int) get_post_meta($post_id, '_platform_2424_ad_width', true);
        $height = (int) get_post_meta($post_id, '_platform_2424_ad_height', true);

        return array('key' => 'custom', 'width' => $width, 'height' => $height);
    }
}

if (!function_exists('platform_2424_ads_get_slots')) {
    /**
     * Source unique des emplacements publicitaires.
     *
     * Le frontend declare les memes cles dans `config/ad-slots.ts` pour que le
     * compilateur refuse une cle inexistante a l'endroit du rendu. Ce catalogue
     * reste cote plugin pour que l'ecran d'administration ne depende d'aucun
     * appel reseau : il ne doit jamais se vider parce que Next redemarre.
     */
    function platform_2424_ads_get_slots() {
        return array(
            'topBanner' => array(
                'group' => 'En-tête',
                'label' => 'Bandeau d’en-tête (toutes les pages)',
                'default_format' => 'header',
                'rotation' => false,
            ),
            'homeTop' => array(
                'group' => 'Accueil',
                'label' => 'Accueil — 1ᵉʳ pavé réservé',
                'default_format' => 'tribune',
                'rotation' => false,
            ),
            'homeSecond' => array(
                'group' => 'Accueil',
                'label' => 'Accueil — 2ᵉ pavé réservé',
                'default_format' => 'tribune',
                'rotation' => false,
            ),
            'homeAfterJobs' => array(
                'group' => 'Accueil',
                'label' => 'Accueil — sous Top emplois',
                'default_format' => 'tribune',
                'rotation' => false,
            ),
            'homeTopics' => array(
                'group' => 'Accueil',
                'label' => 'Accueil — colonne des sujets',
                'default_format' => 'sous_tribune',
                'rotation' => false,
            ),
            'newsInline' => array(
                'group' => 'Actualités',
                'label' => 'Actualités — dans le flux',
                'default_format' => 'tribune',
                'rotation' => true,
            ),
            'newsSectionBreak' => array(
                'group' => 'Actualités',
                'label' => 'Actualités — après deux rubriques',
                'default_format' => 'tribune',
                'rotation' => true,
            ),
            'newsRail' => array(
                'group' => 'Actualités',
                'label' => 'Actualités — colonne de droite',
                'default_format' => 'sous_tribune',
                'rotation' => true,
            ),
            'articleInline' => array(
                'group' => 'Article',
                'label' => 'Article — dans le corps du texte',
                'default_format' => 'article_inline',
                'rotation' => true,
            ),
            'listingBoost' => array(
                'group' => 'Listings',
                'is_listing' => true,
                'label' => 'Listings — sous les sponsorisés',
                'default_format' => 'tribune',
                'rotation' => true,
            ),
            'listingInline' => array(
                'group' => 'Listings',
                'is_listing' => true,
                'label' => 'Listings — dans les résultats',
                'default_format' => 'tribune',
                'rotation' => true,
            ),
        );
    }
}

if (!function_exists('platform_2424_ads_slot_exists')) {
    function platform_2424_ads_slot_exists($slot_key) {
        $slots = platform_2424_ads_get_slots();
        return isset($slots[$slot_key]);
    }
}

if (!function_exists('platform_2424_ads_default_slot_key')) {
    function platform_2424_ads_default_slot_key() {
        return 'listingBoost';
    }
}

if (!function_exists('platform_2424_ads_get_types')) {
    function platform_2424_ads_get_types() {
        return array(
            'image' => 'Image + lien',
            'adsense' => 'Google AdSense',
            'gam' => 'Google Ad Manager',
            'script' => 'Code script (annonceur)',
        );
    }
}

if (!function_exists('platform_2424_ads_get_features')) {
    /** Ciblage par domaine, utilise par les emplacements de listing. */
    function platform_2424_ads_get_features() {
        return array(
            'all' => 'Tous les listings',
            'classified' => 'Annonces',
            'job' => 'Offres d’emploi',
            'tender' => 'Appels d’offres',
            'directory' => 'Annuaire',
        );
    }
}

if (!function_exists('platform_2424_ads_get_legacy_placement_map')) {
    /** Correspondance des anciens emplacements vers les cles du catalogue. */
    function platform_2424_ads_get_legacy_placement_map() {
        return array(
            'boost_list' => 'listingBoost',
            'inline_list' => 'listingInline',
        );
    }
}

/* -------------------------------------------------------------------------
 * Type de contenu
 * ---------------------------------------------------------------------- */

if (!function_exists('platform_2424_ads_register_post_type')) {
    function platform_2424_ads_register_post_type() {
        register_post_type(PLATFORM_2424_ADS_POST_TYPE, array(
            'labels' => array(
                'name' => 'Publicités',
                'singular_name' => 'Publicité',
                'menu_name' => 'Publicités',
                'add_new_item' => 'Ajouter une publicité',
                'edit_item' => 'Modifier la publicité',
                'new_item' => 'Nouvelle publicité',
                'view_item' => 'Voir la publicité',
                'search_items' => 'Rechercher des publicités',
                'not_found' => 'Aucune publicité trouvée',
                'not_found_in_trash' => 'Aucune publicité dans la corbeille',
            ),
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'supports' => array('title', 'editor', 'custom-fields', 'page-attributes'),
            'has_archive' => false,
            'show_in_rest' => true,
            'menu_icon' => 'dashicons-megaphone',
            'capability_type' => 'post',
            'map_meta_cap' => true,
        ));
    }
}
add_action('init', 'platform_2424_ads_register_post_type');

if (!function_exists('platform_2424_ads_meta_keys')) {
    /** Champs texte simples : cle de meta => callback d'assainissement. */
    function platform_2424_ads_meta_keys() {
        return array(
            '_platform_2424_ad_image_url' => 'esc_url_raw',
            '_platform_2424_ad_image_url_tablet' => 'esc_url_raw',
            '_platform_2424_ad_image_url_mobile' => 'esc_url_raw',
            '_platform_2424_ad_link_url' => 'esc_url_raw',
            '_platform_2424_ad_alt_text' => 'sanitize_text_field',
            '_platform_2424_ad_cta_label' => 'sanitize_text_field',
            '_platform_2424_ad_advertiser' => 'sanitize_text_field',
            '_platform_2424_ad_slot_key' => 'sanitize_text_field',
            '_platform_2424_ad_type' => 'sanitize_key',
            '_platform_2424_ad_fallback_type' => 'sanitize_key',
            '_platform_2424_ad_feature' => 'sanitize_key',
            '_platform_2424_ad_adsense_slot_id' => 'sanitize_text_field',
            '_platform_2424_ad_gam_ad_unit_path' => 'sanitize_text_field',
            '_platform_2424_ad_starts_at' => 'sanitize_text_field',
            '_platform_2424_ad_ends_at' => 'sanitize_text_field',
        );
    }
}

if (!function_exists('platform_2424_ads_register_meta')) {
    function platform_2424_ads_register_meta() {
        $auth = function () {
            return current_user_can('edit_posts');
        };

        foreach (platform_2424_ads_meta_keys() as $meta_key => $sanitize_callback) {
            register_post_meta(PLATFORM_2424_ADS_POST_TYPE, $meta_key, array(
                'single' => true,
                'type' => 'string',
                'show_in_rest' => true,
                'auth_callback' => $auth,
                'sanitize_callback' => $sanitize_callback,
            ));
        }

        foreach (array('_platform_2424_ad_position', '_platform_2424_ad_priority', '_platform_2424_ad_weight', '_platform_2424_ad_starts_at_ts', '_platform_2424_ad_ends_at_ts', '_platform_2424_ad_width', '_platform_2424_ad_height') as $meta_key) {
            register_post_meta(PLATFORM_2424_ADS_POST_TYPE, $meta_key, array(
                'single' => true,
                'type' => 'integer',
                'show_in_rest' => true,
                'auth_callback' => $auth,
                'sanitize_callback' => 'absint',
            ));
        }

        // Le tag tiers n'est jamais expose en REST : il ne sort que par
        // l'endpoint public, deja protege par le secret interne.
        register_post_meta(PLATFORM_2424_ADS_POST_TYPE, '_platform_2424_ad_script_code', array(
            'single' => true,
            'type' => 'string',
            'show_in_rest' => false,
            'auth_callback' => function () {
                return current_user_can(PLATFORM_2424_ADS_SCRIPT_CAPABILITY);
            },
        ));
    }
}
add_action('init', 'platform_2424_ads_register_meta');

if (!function_exists('platform_2424_ads_grant_script_capability')) {
    /** L'administrateur peut saisir un tag tiers, pas un simple editeur. */
    function platform_2424_ads_grant_script_capability() {
        $role = get_role('administrator');
        if ($role && !$role->has_cap(PLATFORM_2424_ADS_SCRIPT_CAPABILITY)) {
            $role->add_cap(PLATFORM_2424_ADS_SCRIPT_CAPABILITY);
        }
    }
}
add_action('admin_init', 'platform_2424_ads_grant_script_capability');

/* -------------------------------------------------------------------------
 * Upload S3 par presign (inchange)
 * ---------------------------------------------------------------------- */

if (!function_exists('platform_2424_ads_get_setting_or_env')) {
    function platform_2424_ads_get_setting_or_env($constant_name, $env_name, $option_name = '') {
        if ($constant_name && defined($constant_name) && constant($constant_name)) {
            return trim((string) constant($constant_name));
        }

        if ($env_name) {
            $env_value = getenv($env_name);
            if (is_string($env_value) && trim($env_value) !== '') {
                return trim($env_value);
            }
        }

        if ($option_name !== '') {
            $option_value = get_option($option_name, '');
            if (is_string($option_value) && trim($option_value) !== '') {
                return trim($option_value);
            }
        }

        return '';
    }
}

if (!function_exists('platform_2424_ads_get_media_presign_url')) {
    function platform_2424_ads_get_media_presign_url() {
        $direct_url = platform_2424_ads_get_setting_or_env('PLATFORM_2424_MEDIA_PRESIGN_URL', 'PLATFORM_2424_MEDIA_PRESIGN_URL', 'platform_2424_media_presign_url');
        if ($direct_url !== '') {
            return esc_url_raw($direct_url);
        }

        $base_url = platform_2424_ads_get_setting_or_env('API_GATEWAY_BASE_URL', 'API_GATEWAY_BASE_URL');
        if ($base_url === '') {
            return '';
        }

        $path = platform_2424_ads_get_setting_or_env('API_GATEWAY_MEDIA_PRESIGN_PATH', 'API_GATEWAY_MEDIA_PRESIGN_PATH');
        if ($path === '') {
            $path = '/media/presign';
        }

        if (strpos($path, '/') !== 0) {
            $path = '/' . $path;
        }

        return esc_url_raw(rtrim($base_url, '/') . $path);
    }
}

if (!function_exists('platform_2424_ads_get_allowed_image_mimes')) {
    function platform_2424_ads_get_allowed_image_mimes() {
        return array('image/jpeg', 'image/png', 'image/webp', 'image/gif');
    }
}

if (!function_exists('platform_2424_ads_ajax_media_presign')) {
    function platform_2424_ads_ajax_media_presign() {
        check_ajax_referer('platform_2424_ads_upload', 'nonce');

        if (!current_user_can('upload_files')) {
            wp_send_json_error(array('message' => 'Vous n’avez pas le droit de téléverser une image.'), 403);
        }

        $mime_type = isset($_POST['mimeType']) ? sanitize_text_field((string) $_POST['mimeType']) : '';
        $size_bytes = isset($_POST['sizeBytes']) ? absint($_POST['sizeBytes']) : 0;
        $allowed_mimes = platform_2424_ads_get_allowed_image_mimes();

        if (!in_array($mime_type, $allowed_mimes, true)) {
            wp_send_json_error(array('message' => 'Format image non autorisé. Utilisez JPG, PNG, WEBP ou GIF.'), 400);
        }

        if ($size_bytes <= 0 || $size_bytes > 8 * 1024 * 1024) {
            wp_send_json_error(array('message' => 'Image trop lourde. Taille maximale : 8 Mo.'), 400);
        }

        $presign_url = platform_2424_ads_get_media_presign_url();
        if ($presign_url === '') {
            wp_send_json_error(array('message' => 'URL de presign média non configurée côté plugin.'), 500);
        }

        $response = wp_remote_post($presign_url, array(
            'timeout' => 20,
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => wp_json_encode(array(
                'mimeType' => $mime_type,
                'sizeBytes' => $size_bytes,
            )),
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()), 502);
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $body = (string) wp_remote_retrieve_body($response);
        $payload = json_decode($body, true);

        if ($status < 200 || $status >= 300 || !is_array($payload)) {
            wp_send_json_error(array(
                'message' => 'Impossible de préparer l’upload S3.',
                'status' => $status,
                'body' => $body,
            ), $status > 0 ? $status : 502);
        }

        if (empty($payload['uploadUrl']) || empty($payload['publicUrl'])) {
            wp_send_json_error(array('message' => 'Réponse presign invalide.'), 502);
        }

        wp_send_json_success(array(
            'uploadUrl' => esc_url_raw((string) $payload['uploadUrl']),
            'publicUrl' => esc_url_raw((string) $payload['publicUrl']),
            'key' => sanitize_text_field((string) ($payload['key'] ?? '')),
            'expiresInSeconds' => absint($payload['expiresInSeconds'] ?? 0),
        ));
    }
}
add_action('wp_ajax_platform_2424_ads_media_presign', 'platform_2424_ads_ajax_media_presign');

/* -------------------------------------------------------------------------
 * Lecture des valeurs d'une publicite
 * ---------------------------------------------------------------------- */

if (!function_exists('platform_2424_ads_resolve_slot_key')) {
    /** Cle du catalogue, avec repli sur l'ancien champ tant que la migration n'a pas tourne. */
    function platform_2424_ads_resolve_slot_key($post_id) {
        $slot_key = (string) get_post_meta($post_id, '_platform_2424_ad_slot_key', true);
        if (platform_2424_ads_slot_exists($slot_key)) {
            return $slot_key;
        }

        $legacy = (string) get_post_meta($post_id, '_platform_2424_ad_placement', true);
        $map = platform_2424_ads_get_legacy_placement_map();
        if ($legacy !== '' && isset($map[$legacy])) {
            return $map[$legacy];
        }

        return platform_2424_ads_default_slot_key();
    }
}

if (!function_exists('platform_2424_ads_resolve_type')) {
    function platform_2424_ads_resolve_type($post_id) {
        $type = (string) get_post_meta($post_id, '_platform_2424_ad_type', true);
        $types = platform_2424_ads_get_types();

        return isset($types[$type]) ? $type : 'image';
    }
}

if (!function_exists('platform_2424_ads_build_payload')) {
    /**
     * Charge utile d'une publicite pour le frontend. Seuls les champs du type
     * concerne sont renseignes : le composant n'a pas a deviner.
     */
    function platform_2424_ads_build_payload(WP_Post $post) {
        $post_id = (int) $post->ID;
        $type = platform_2424_ads_resolve_type($post_id);
        $features = platform_2424_ads_get_features();
        $feature = (string) get_post_meta($post_id, '_platform_2424_ad_feature', true);
        if (!isset($features[$feature])) {
            $feature = 'all';
        }

        $position = (int) get_post_meta($post_id, '_platform_2424_ad_position', true);
        $fallback_type = (string) get_post_meta($post_id, '_platform_2424_ad_fallback_type', true);
        $types = platform_2424_ads_get_types();

        // Le format choisi determine la place reservee sur le site.
        $resolved_format = platform_2424_ads_resolve_format($post_id, platform_2424_ads_resolve_slot_key($post_id));

        $payload = array(
            'id' => $post_id,
            'format' => $resolved_format['width'] > 0 && $resolved_format['height'] > 0
                ? array('width' => $resolved_format['width'], 'height' => $resolved_format['height'])
                : null,
            'type' => $type,
            'fallbackType' => isset($types[$fallback_type]) ? $fallback_type : '',
            'title' => html_entity_decode(get_the_title($post), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'advertiser' => sanitize_text_field((string) get_post_meta($post_id, '_platform_2424_ad_advertiser', true)),
            'feature' => $feature,
            'position' => $position > 0 ? $position : 1,
        );

        if ($type === 'image' || $fallback_type === 'image') {
            $desktop = (string) get_post_meta($post_id, '_platform_2424_ad_image_url', true);
            $payload['image'] = array(
                'desktop' => esc_url_raw($desktop),
                'tablet' => esc_url_raw((string) get_post_meta($post_id, '_platform_2424_ad_image_url_tablet', true)),
                'mobile' => esc_url_raw((string) get_post_meta($post_id, '_platform_2424_ad_image_url_mobile', true)),
            );
            $payload['linkUrl'] = esc_url_raw((string) get_post_meta($post_id, '_platform_2424_ad_link_url', true));
            $payload['altText'] = sanitize_text_field((string) get_post_meta($post_id, '_platform_2424_ad_alt_text', true));
            $payload['ctaLabel'] = sanitize_text_field((string) get_post_meta($post_id, '_platform_2424_ad_cta_label', true));

        }

        if ($type === 'adsense' || $fallback_type === 'adsense') {
            $payload['adsenseSlotId'] = sanitize_text_field((string) get_post_meta($post_id, '_platform_2424_ad_adsense_slot_id', true));
        }

        if ($type === 'gam' || $fallback_type === 'gam') {
            $payload['gamAdUnitPath'] = sanitize_text_field((string) get_post_meta($post_id, '_platform_2424_ad_gam_ad_unit_path', true));
        }

        if ($type === 'script' || $fallback_type === 'script') {
            // Rendu par le frontend dans une iframe isolee, jamais injecte dans
            // le DOM de la page : d'ou la sortie brute ici.
            $payload['scriptCode'] = (string) get_post_meta($post_id, '_platform_2424_ad_script_code', true);
        }

        return $payload;
    }
}

if (!function_exists('platform_2424_ads_is_payload_renderable')) {
    /** Une publicite sans contenu exploitable ne doit pas occuper l'emplacement. */
    function platform_2424_ads_is_payload_renderable($payload) {
        switch ($payload['type']) {
            case 'image':
                return !empty($payload['image']['desktop']);
            case 'adsense':
                return !empty($payload['adsenseSlotId']);
            case 'gam':
                return !empty($payload['gamAdUnitPath']);
            case 'script':
                return !empty($payload['scriptCode']);
        }

        return false;
    }
}

/* -------------------------------------------------------------------------
 * Resolution d'un emplacement
 * ---------------------------------------------------------------------- */

if (!function_exists('platform_2424_ads_resolve_slot')) {
    function platform_2424_ads_resolve_slot($slot_key, $feature = 'all') {
        $slots = platform_2424_ads_get_slots();
        if (!isset($slots[$slot_key])) {
            return null;
        }

        $definition = $slots[$slot_key];
        $now_ts = time();
        $legacy_map = array_flip(platform_2424_ads_get_legacy_placement_map());
        $legacy_placement = $legacy_map[$slot_key] ?? '';

        // Une publicite ne s'affiche que sur l'emplacement choisi dans le
        // gestionnaire. Aucune deduction a partir de l'ancien champ : c'est ce
        // qui faisait remonter une banniere d'en-tete dans les listings.
        $slot_clause = array(
            array(
                'key' => '_platform_2424_ad_slot_key',
                'value' => $slot_key,
                'compare' => '=',
            ),
        );

        // Les clauses NOT EXISTS sont acceptables ici : ce type de contenu
        // compte quelques dizaines de lignes, pas des dizaines de milliers.
        $meta_query = array(
            'relation' => 'AND',
            $slot_clause,
            array(
                'relation' => 'OR',
                array('key' => '_platform_2424_ad_starts_at_ts', 'compare' => 'NOT EXISTS'),
                array('key' => '_platform_2424_ad_starts_at_ts', 'value' => 0, 'compare' => '=', 'type' => 'NUMERIC'),
                array('key' => '_platform_2424_ad_starts_at_ts', 'value' => $now_ts, 'compare' => '<=', 'type' => 'NUMERIC'),
            ),
            array(
                'relation' => 'OR',
                array('key' => '_platform_2424_ad_ends_at_ts', 'compare' => 'NOT EXISTS'),
                array('key' => '_platform_2424_ad_ends_at_ts', 'value' => 0, 'compare' => '=', 'type' => 'NUMERIC'),
                array('key' => '_platform_2424_ad_ends_at_ts', 'value' => $now_ts, 'compare' => '>=', 'type' => 'NUMERIC'),
            ),
        );

        if ($feature !== 'all') {
            $meta_query[] = array(
                'relation' => 'OR',
                array('key' => '_platform_2424_ad_feature', 'value' => $feature, 'compare' => '='),
                array('key' => '_platform_2424_ad_feature', 'value' => 'all', 'compare' => '='),
                array('key' => '_platform_2424_ad_feature', 'compare' => 'NOT EXISTS'),
                array('key' => '_platform_2424_ad_feature', 'value' => '', 'compare' => '='),
            );
        }

        $query = new WP_Query(array(
            'post_type' => PLATFORM_2424_ADS_POST_TYPE,
            'post_status' => 'publish',
            // On ramene toujours une fenetre, meme pour un emplacement qui
            // n'affiche qu'une publicite : la priorite se calcule en PHP, et
            // limiter a une ligne ici reviendrait a laisser la base trancher.
            'posts_per_page' => 12,
            'no_found_rows' => true,
            // Pas de tri par meta ici : renseigner 'meta_key' impose a WP_Query
            // que la meta existe, ce qui excluait silencieusement toute
            // publicite creee avant l'ajout du champ. Le classement se fait en
            // PHP plus bas, sur un jeu de douze lignes au maximum.
            'orderby' => array(
                'menu_order' => 'ASC',
                'date' => 'DESC',
            ),
            'meta_query' => $meta_query,
        ));

        $items = array();
        foreach ($query->posts as $post) {
            $payload = platform_2424_ads_build_payload($post);
            if (platform_2424_ads_is_payload_renderable($payload)) {
                $payload['priority'] = (int) get_post_meta($post->ID, '_platform_2424_ad_priority', true);
                $items[] = $payload;
            }
        }

        usort($items, function ($left, $right) {
            return $right['priority'] <=> $left['priority'];
        });

        if (empty($definition['rotation'])) {
            $items = array_slice($items, 0, 1);
        }

        return array(
            'key' => $slot_key,
            'label' => $definition['label'],
            'format' => platform_2424_ads_format_label($definition['default_format'] ?? ''),
            'rotation' => (bool) $definition['rotation'],
            'items' => $items,
        );
    }
}

if (!function_exists('platform_2424_ads_cache_group')) {
    function platform_2424_ads_cache_group() {
        return '2424_ads';
    }
}

if (!function_exists('platform_2424_ads_resolve_slot_cached')) {
    function platform_2424_ads_resolve_slot_cached($slot_key, $feature = 'all') {
        $cache_key = $slot_key . ':' . $feature;
        $cached = wp_cache_get($cache_key, platform_2424_ads_cache_group());
        if (is_array($cached)) {
            return $cached;
        }

        $resolved = platform_2424_ads_resolve_slot($slot_key, $feature);
        if ($resolved !== null) {
            wp_cache_set($cache_key, $resolved, platform_2424_ads_cache_group(), 300);
        }

        return $resolved;
    }
}

if (!function_exists('platform_2424_ads_flush_cache')) {
    function platform_2424_ads_flush_cache() {
        if (function_exists('wp_cache_flush_group')) {
            wp_cache_flush_group(platform_2424_ads_cache_group());
            return;
        }

        // Sans invalidation par groupe, on purge cle par cle.
        $features = array_keys(platform_2424_ads_get_features());
        foreach (array_keys(platform_2424_ads_get_slots()) as $slot_key) {
            foreach ($features as $feature) {
                wp_cache_delete($slot_key . ':' . $feature, platform_2424_ads_cache_group());
            }
        }
    }
}
add_action('save_post_' . PLATFORM_2424_ADS_POST_TYPE, 'platform_2424_ads_flush_cache', 20);
add_action('deleted_post', 'platform_2424_ads_flush_cache');

/* -------------------------------------------------------------------------
 * Metabox
 * ---------------------------------------------------------------------- */

if (!function_exists('platform_2424_ads_add_meta_boxes')) {
    function platform_2424_ads_add_meta_boxes() {
        add_meta_box(
            'platform-2424-ad-asset',
            'Emplacement et contenu',
            'platform_2424_ads_render_asset_meta_box',
            PLATFORM_2424_ADS_POST_TYPE,
            'normal',
            'high'
        );
    }
}
add_action('add_meta_boxes', 'platform_2424_ads_add_meta_boxes');

if (!function_exists('platform_2424_ads_render_image_field')) {
    function platform_2424_ads_render_image_field($field, $label, $value) {
        ?>
        <p>
            <strong><?php echo esc_html($label); ?></strong><br />
            <input type="hidden" id="platform_2424_ad_<?php echo esc_attr($field); ?>" name="platform_2424_ad_<?php echo esc_attr($field); ?>" value="<?php echo esc_attr($value); ?>" />
            <input type="file" class="platform-2424-ad-file" data-target="<?php echo esc_attr($field); ?>" accept="image/jpeg,image/png,image/webp,image/gif" />
            <button type="button" class="button platform-2424-ad-clear" data-target="<?php echo esc_attr($field); ?>">Retirer</button>
            <span class="platform-2424-ad-status" data-target="<?php echo esc_attr($field); ?>" style="margin-left:8px;"></span>
        </p>
        <div class="platform-2424-ad-preview" data-target="<?php echo esc_attr($field); ?>" style="<?php echo $value ? '' : 'display:none;'; ?>margin:0 0 14px;">
            <img src="<?php echo esc_url($value); ?>" alt="" style="max-width:360px;width:100%;height:auto;border:1px solid #dcdcde;border-radius:8px;background:#fff;" />
        </div>
        <?php
    }
}

if (!function_exists('platform_2424_ads_render_asset_meta_box')) {
    function platform_2424_ads_render_asset_meta_box($post) {
        wp_nonce_field('platform_2424_ads_save_meta', 'platform_2424_ads_meta_nonce');

        $slots = platform_2424_ads_get_slots();
        $types = platform_2424_ads_get_types();
        $features = platform_2424_ads_get_features();

        $slot_key = platform_2424_ads_resolve_slot_key($post->ID);
        $type = platform_2424_ads_resolve_type($post->ID);
        $fallback_type = (string) get_post_meta($post->ID, '_platform_2424_ad_fallback_type', true);
        $feature = (string) get_post_meta($post->ID, '_platform_2424_ad_feature', true);
        if (!isset($features[$feature])) {
            $feature = 'all';
        }

        $get = function ($key) use ($post) {
            return (string) get_post_meta($post->ID, '_platform_2424_ad_' . $key, true);
        };

        $position = (int) get_post_meta($post->ID, '_platform_2424_ad_position', true);
        $format = platform_2424_ads_resolve_format($post->ID, $slot_key);
        $width = (int) get_post_meta($post->ID, '_platform_2424_ad_width', true);
        $height = (int) get_post_meta($post->ID, '_platform_2424_ad_height', true);
        $priority = (int) get_post_meta($post->ID, '_platform_2424_ad_priority', true);
        $weight = (int) get_post_meta($post->ID, '_platform_2424_ad_weight', true);
        $can_edit_script = current_user_can(PLATFORM_2424_ADS_SCRIPT_CAPABILITY);
        ?>
        <div class="platform-2424-ad-fields">
            <p>
                <label for="platform_2424_ad_slot_key"><strong>Emplacement</strong></label><br />
                <select id="platform_2424_ad_slot_key" name="platform_2424_ad_slot_key">
                    <?php
                    $grouped = array();
                    foreach ($slots as $key => $definition) {
                        $grouped[$definition['group'] ?? 'Autres'][$key] = $definition;
                    }
                    foreach ($grouped as $group_label => $group_slots) :
                    ?>
                        <optgroup label="<?php echo esc_attr($group_label); ?>">
                            <?php foreach ($group_slots as $key => $definition) : ?>
                                <option value="<?php echo esc_attr($key); ?>" <?php selected($slot_key, $key); ?>>
                                    <?php echo esc_html($definition['label']); ?>
                                </option>
                            <?php endforeach; ?>
                        </optgroup>
                    <?php endforeach; ?>
                </select>
                <span class="description" style="display:block;margin-top:6px;">La publicité ne s’affiche que sur cet emplacement, nulle part ailleurs.</span>
            </p>

            <p>
                <label for="platform_2424_ad_format_key"><strong>Format</strong></label><br />
                <select id="platform_2424_ad_format_key" name="platform_2424_ad_format_key">
                    <?php foreach (platform_2424_ads_get_formats() as $format_option_key => $format_option) : ?>
                        <option value="<?php echo esc_attr($format_option_key); ?>" <?php selected($format['key'], $format_option_key); ?>>
                            <?php echo esc_html(sprintf('%s — %d×%d', $format_option['label'], $format_option['width'], $format_option['height'])); ?>
                        </option>
                    <?php endforeach; ?>
                    <option value="custom" <?php selected($format['key'], 'custom'); ?>>Personnalisé</option>
                </select>
                <span class="description" style="display:block;margin-top:6px;">Taille occupée par la publicité. Indépendante de l’emplacement.</span>
            </p>

            <p class="platform-2424-ad-custom-format">
                <label for="platform_2424_ad_width"><strong>Taille personnalisée</strong></label><br />
                <input type="number" id="platform_2424_ad_width" name="platform_2424_ad_width" min="0" step="1" value="<?php echo esc_attr($width > 0 ? (string) $width : ''); ?>" class="small-text" placeholder="Largeur" />
                <span aria-hidden="true">×</span>
                <input type="number" id="platform_2424_ad_height" name="platform_2424_ad_height" min="0" step="1" value="<?php echo esc_attr($height > 0 ? (string) $height : ''); ?>" class="small-text" placeholder="Hauteur" />
                <span class="description" style="display:block;margin-top:6px;">En pixels.</span>
            </p>

            <p>
                <label for="platform_2424_ad_type"><strong>Type de publicité</strong></label><br />
                <select id="platform_2424_ad_type" name="platform_2424_ad_type">
                    <?php foreach ($types as $key => $label) : ?>
                        <?php if ($key === 'script' && !$can_edit_script) { continue; } ?>
                        <option value="<?php echo esc_attr($key); ?>" <?php selected($type, $key); ?>>
                            <?php echo esc_html($label); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </p>

            <div class="platform-2424-ad-type-panel" data-type="image">
                <?php platform_2424_ads_render_image_field('image_url', 'Visuel desktop', $get('image_url')); ?>
                <?php platform_2424_ads_render_image_field('image_url_tablet', 'Visuel tablette (optionnel)', $get('image_url_tablet')); ?>
                <?php platform_2424_ads_render_image_field('image_url_mobile', 'Visuel mobile (optionnel)', $get('image_url_mobile')); ?>
                <p>
                    <label for="platform_2424_ad_link_url"><strong>URL de destination</strong></label><br />
                    <input type="url" id="platform_2424_ad_link_url" name="platform_2424_ad_link_url" value="<?php echo esc_attr($get('link_url')); ?>" class="large-text code" placeholder="https://..." />
                </p>
                <p>
                    <label for="platform_2424_ad_alt_text"><strong>Texte alternatif</strong></label><br />
                    <input type="text" id="platform_2424_ad_alt_text" name="platform_2424_ad_alt_text" value="<?php echo esc_attr($get('alt_text')); ?>" class="large-text" placeholder="Décrivez brièvement le visuel" />
                </p>
                <p>
                    <label for="platform_2424_ad_cta_label"><strong>Libellé du bouton</strong> <em>(optionnel)</em></label><br />
                    <input type="text" id="platform_2424_ad_cta_label" name="platform_2424_ad_cta_label" value="<?php echo esc_attr($get('cta_label')); ?>" class="regular-text" />
                </p>
            </div>

            <div class="platform-2424-ad-type-panel" data-type="adsense">
                <p>
                    <label for="platform_2424_ad_adsense_slot_id"><strong>Identifiant de bloc AdSense</strong></label><br />
                    <input type="text" id="platform_2424_ad_adsense_slot_id" name="platform_2424_ad_adsense_slot_id" value="<?php echo esc_attr($get('adsense_slot_id')); ?>" class="regular-text code" placeholder="1234567890" />
                    <span class="description" style="display:block;margin-top:6px;">Créé dans la console AdSense, rubrique Annonces &gt; Par unité d’annonce.</span>
                </p>
            </div>

            <div class="platform-2424-ad-type-panel" data-type="gam">
                <p>
                    <label for="platform_2424_ad_gam_ad_unit_path"><strong>Chemin d’ad unit Google Ad Manager</strong></label><br />
                    <input type="text" id="platform_2424_ad_gam_ad_unit_path" name="platform_2424_ad_gam_ad_unit_path" value="<?php echo esc_attr($get('gam_ad_unit_path')); ?>" class="large-text code" placeholder="/123456789/2424/home-top" />
                </p>
            </div>

            <?php if ($can_edit_script) : ?>
            <div class="platform-2424-ad-type-panel" data-type="script">
                <p>
                    <label for="platform_2424_ad_script_code"><strong>Code fourni par l’annonceur</strong></label><br />
                    <textarea id="platform_2424_ad_script_code" name="platform_2424_ad_script_code" rows="6" class="large-text code"><?php echo esc_textarea($get('script_code')); ?></textarea>
                    <span class="description" style="display:block;margin-top:6px;">Exécuté dans une iframe isolée. Ne collez que du code provenant d’un annonceur identifié.</span>
                </p>
            </div>
            <?php endif; ?>

            <hr />

            <h4 style="margin:18px 0 8px;">Campagne</h4>

            <p>
                <label for="platform_2424_ad_advertiser"><strong>Annonceur</strong></label><br />
                <input type="text" id="platform_2424_ad_advertiser" name="platform_2424_ad_advertiser" value="<?php echo esc_attr($get('advertiser')); ?>" class="regular-text" placeholder="Ex. BNI Madagascar" />
            </p>

            <p>
                <label for="platform_2424_ad_starts_at"><strong>Début de diffusion</strong></label>
                <input type="date" id="platform_2424_ad_starts_at" name="platform_2424_ad_starts_at" value="<?php echo esc_attr($get('starts_at')); ?>" />
                &nbsp;
                <label for="platform_2424_ad_ends_at"><strong>Fin</strong></label>
                <input type="date" id="platform_2424_ad_ends_at" name="platform_2424_ad_ends_at" value="<?php echo esc_attr($get('ends_at')); ?>" />
                <span class="description" style="display:block;margin-top:6px;">Laisser vide pour une diffusion sans limite de date.</span>
            </p>

            <p>
                <label for="platform_2424_ad_priority"><strong>Priorité</strong></label>
                <input type="number" id="platform_2424_ad_priority" name="platform_2424_ad_priority" min="0" step="1" value="<?php echo esc_attr((string) $priority); ?>" class="small-text" />
                <span class="description" style="display:block;margin-top:6px;">
                    La priorité la plus élevée passe en premier parmi les publicités du même emplacement.
                    Sur un emplacement qui n’en affiche qu’une, c’est celle-là qui est retenue.
                </span>
            </p>

            <p>
                <label for="platform_2424_ad_fallback_type"><strong>Repli si l’emplacement n’est pas rempli</strong></label><br />
                <select id="platform_2424_ad_fallback_type" name="platform_2424_ad_fallback_type">
                    <option value="">Aucun</option>
                    <?php foreach ($types as $key => $label) : ?>
                        <?php if ($key === 'script' && !$can_edit_script) { continue; } ?>
                        <option value="<?php echo esc_attr($key); ?>" <?php selected($fallback_type, $key); ?>><?php echo esc_html($label); ?></option>
                    <?php endforeach; ?>
                </select>
                <span class="description" style="display:block;margin-top:6px;">Utile pour un emplacement Google : la bannière maison prend le relais si Google ne remplit pas ou si un bloqueur est actif.</span>
            </p>

            <div class="platform-2424-ad-listing-panel">
                <hr />
                <h4 style="margin:18px 0 8px;">Réglages propres aux listings</h4>
                <p class="description" style="margin:0 0 10px;">
                    Ces réglages ne servent que sur un emplacement de listing. Ils n’ont aucun effet ailleurs.
                </p>

                <p>
                    <label for="platform_2424_ad_feature"><strong>Afficher dans</strong></label><br />
                    <select id="platform_2424_ad_feature" name="platform_2424_ad_feature">
                        <?php foreach ($features as $key => $label) : ?>
                            <option value="<?php echo esc_attr($key); ?>" <?php selected($feature, $key); ?>><?php echo esc_html($label); ?></option>
                        <?php endforeach; ?>
                    </select>
                </p>

                <p>
                    <label for="platform_2424_ad_position"><strong>Position dans la liste</strong></label><br />
                    <input type="number" id="platform_2424_ad_position" name="platform_2424_ad_position" min="1" step="1" value="<?php echo esc_attr((string) ($position > 0 ? $position : 1)); ?>" class="small-text" />
                    <span class="description" style="display:block;margin-top:6px;">Rang d’insertion parmi les résultats. Minimum : 1.</span>
                </p>
            </div>
        </div>
        <?php
    }
}

/* -------------------------------------------------------------------------
 * Enregistrement
 * ---------------------------------------------------------------------- */

if (!function_exists('platform_2424_ads_save_meta')) {
    function platform_2424_ads_save_meta($post_id) {
        if (!isset($_POST['platform_2424_ads_meta_nonce']) || !wp_verify_nonce((string) $_POST['platform_2424_ads_meta_nonce'], 'platform_2424_ads_save_meta')) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        $slot_key = isset($_POST['platform_2424_ad_slot_key']) ? sanitize_text_field((string) $_POST['platform_2424_ad_slot_key']) : '';
        if (!platform_2424_ads_slot_exists($slot_key)) {
            $slot_key = platform_2424_ads_default_slot_key();
        }
        update_post_meta($post_id, '_platform_2424_ad_slot_key', $slot_key);
        // L'ancien champ n'a plus de role une fois la cle posee, et le laisser
        // en place ferait remonter la publicite dans son emplacement d'origine.
        delete_post_meta($post_id, '_platform_2424_ad_placement');

        $types = platform_2424_ads_get_types();
        $type = isset($_POST['platform_2424_ad_type']) ? sanitize_key((string) $_POST['platform_2424_ad_type']) : 'image';
        if (!isset($types[$type])) {
            $type = 'image';
        }
        update_post_meta($post_id, '_platform_2424_ad_type', $type);

        $fallback_type = isset($_POST['platform_2424_ad_fallback_type']) ? sanitize_key((string) $_POST['platform_2424_ad_fallback_type']) : '';
        update_post_meta($post_id, '_platform_2424_ad_fallback_type', isset($types[$fallback_type]) ? $fallback_type : '');

        foreach (array('image_url', 'image_url_tablet', 'image_url_mobile', 'link_url') as $url_field) {
            $field = 'platform_2424_ad_' . $url_field;
            $value = isset($_POST[$field]) ? esc_url_raw((string) $_POST[$field]) : '';
            update_post_meta($post_id, '_' . $field, $value);
        }

        foreach (array('alt_text', 'cta_label', 'advertiser', 'adsense_slot_id') as $text_field) {
            $field = 'platform_2424_ad_' . $text_field;
            $value = isset($_POST[$field]) ? sanitize_text_field((string) $_POST[$field]) : '';
            update_post_meta($post_id, '_' . $field, $value);
        }

        $gam_path = isset($_POST['platform_2424_ad_gam_ad_unit_path']) ? sanitize_text_field((string) $_POST['platform_2424_ad_gam_ad_unit_path']) : '';
        if ($gam_path !== '' && !preg_match('#^/[0-9]+(/[A-Za-z0-9_\-\.]+)+$#', $gam_path)) {
            $gam_path = '';
        }
        update_post_meta($post_id, '_platform_2424_ad_gam_ad_unit_path', $gam_path);

        // Le tag tiers n'est modifiable que par un compte habilite. Sans la
        // capacite, on ignore le champ au lieu de rejeter tout l'enregistrement :
        // un editeur doit pouvoir corriger un texte alternatif sur une
        // publicite de type script.
        if (isset($_POST['platform_2424_ad_script_code']) && current_user_can(PLATFORM_2424_ADS_SCRIPT_CAPABILITY)) {
            // Stocke brut : l'isolement est assure par l'iframe au rendu.
            // Passer ce contenu dans wp_kses le casserait sans rien securiser.
            update_post_meta($post_id, '_platform_2424_ad_script_code', (string) wp_unslash($_POST['platform_2424_ad_script_code']));
        }

        foreach (array('starts_at', 'ends_at') as $date_field) {
            $raw = isset($_POST['platform_2424_ad_' . $date_field]) ? sanitize_text_field((string) $_POST['platform_2424_ad_' . $date_field]) : '';
            $timestamp = $raw !== '' ? strtotime($raw . ($date_field === 'ends_at' ? ' 23:59:59' : ' 00:00:00')) : 0;
            update_post_meta($post_id, '_platform_2424_ad_' . $date_field, $raw);
            // Toujours ecrit, meme a zero : la meta doit exister sur toutes les
            // lignes pour que la requete de selection reste indexable.
            update_post_meta($post_id, '_platform_2424_ad_' . $date_field . '_ts', $timestamp > 0 ? (int) $timestamp : 0);
        }

        $formats = platform_2424_ads_get_formats();
        $format_key = isset($_POST['platform_2424_ad_format_key']) ? sanitize_key((string) $_POST['platform_2424_ad_format_key']) : '';
        if ($format_key !== 'custom' && !isset($formats[$format_key])) {
            $slot_definitions = platform_2424_ads_get_slots();
            $format_key = $slot_definitions[$slot_key]['default_format'] ?? 'tribune';
        }
        update_post_meta($post_id, '_platform_2424_ad_format_key', $format_key);

        update_post_meta($post_id, '_platform_2424_ad_width', isset($_POST['platform_2424_ad_width']) ? absint($_POST['platform_2424_ad_width']) : 0);
        update_post_meta($post_id, '_platform_2424_ad_height', isset($_POST['platform_2424_ad_height']) ? absint($_POST['platform_2424_ad_height']) : 0);

        $position = isset($_POST['platform_2424_ad_position']) ? absint($_POST['platform_2424_ad_position']) : 1;
        update_post_meta($post_id, '_platform_2424_ad_position', $position > 0 ? $position : 1);
        update_post_meta($post_id, '_platform_2424_ad_priority', isset($_POST['platform_2424_ad_priority']) ? absint($_POST['platform_2424_ad_priority']) : 0);
        update_post_meta($post_id, '_platform_2424_ad_weight', isset($_POST['platform_2424_ad_weight']) ? absint($_POST['platform_2424_ad_weight']) : 0);

        $features = platform_2424_ads_get_features();
        $feature = isset($_POST['platform_2424_ad_feature']) ? sanitize_key((string) $_POST['platform_2424_ad_feature']) : 'all';
        update_post_meta($post_id, '_platform_2424_ad_feature', isset($features[$feature]) ? $feature : 'all');
    }
}
add_action('save_post_' . PLATFORM_2424_ADS_POST_TYPE, 'platform_2424_ads_save_meta');

/* -------------------------------------------------------------------------
 * Assets d'administration
 * ---------------------------------------------------------------------- */

if (!function_exists('platform_2424_ads_enqueue_admin_assets')) {
    function platform_2424_ads_enqueue_admin_assets($hook) {
        if (!in_array($hook, array('post.php', 'post-new.php'), true)) {
            return;
        }

        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        if (!$screen || $screen->post_type !== PLATFORM_2424_ADS_POST_TYPE) {
            return;
        }

        wp_register_script('platform-2424-ads-admin', false, array(), PLATFORM_2424_PLUGIN_VERSION, true);
        wp_enqueue_script('platform-2424-ads-admin');
        wp_localize_script('platform-2424-ads-admin', 'platform2424Ads', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('platform_2424_ads_upload'),
            'action' => 'platform_2424_ads_media_presign',
            'maxSizeBytes' => 8 * 1024 * 1024,
            'listingSlots' => array_values(array_keys(array_filter(platform_2424_ads_get_slots(), function ($definition) {
                return !empty($definition['is_listing']);
            }))),
            'messages' => array(
                'invalidFile' => 'Sélectionnez une image JPG, PNG, WEBP ou GIF.',
                'tooLarge' => 'Image trop lourde. Taille maximale : 8 Mo.',
                'preparing' => 'Préparation de l’upload...',
                'uploading' => 'Upload S3 en cours...',
                'done' => 'Image téléversée.',
                'failed' => 'Upload impossible.',
                'cleared' => 'Image retirée. Enregistrez pour confirmer.',
            ),
        ));

        wp_add_inline_script('platform-2424-ads-admin', <<<'JS'
(function () {
  const config = window.platform2424Ads;
  if (!config) return;

  const typeSelect = document.getElementById("platform_2424_ad_type");
  const panels = Array.from(document.querySelectorAll(".platform-2424-ad-type-panel"));

  function syncPanels() {
    const current = typeSelect ? typeSelect.value : "image";
    panels.forEach(function (panel) {
      panel.style.display = panel.dataset.type === current ? "" : "none";
    });
  }

  if (typeSelect) {
    typeSelect.addEventListener("change", syncPanels);
    syncPanels();
  }

  // Les reglages de listing n'apparaissent que sur un emplacement de listing.
  const slotSelect = document.getElementById("platform_2424_ad_slot_key");
  const listingPanel = document.querySelector(".platform-2424-ad-listing-panel");
  const listingSlots = config.listingSlots || [];

  function syncListingPanel() {
    if (!listingPanel) return;
    const current = slotSelect ? slotSelect.value : "";
    listingPanel.style.display = listingSlots.indexOf(current) === -1 ? "none" : "";
  }

  if (slotSelect) {
    slotSelect.addEventListener("change", syncListingPanel);
  }
  syncListingPanel();

  // La taille libre ne concerne que le format personnalise.
  const formatSelect = document.getElementById("platform_2424_ad_format_key");
  const customFormat = document.querySelector(".platform-2424-ad-custom-format");

  function syncCustomFormat() {
    if (!customFormat) return;
    customFormat.style.display = formatSelect && formatSelect.value === "custom" ? "" : "none";
  }

  if (formatSelect) {
    formatSelect.addEventListener("change", syncCustomFormat);
  }
  syncCustomFormat();

  function nodeFor(selector, target) {
    return document.querySelector(selector + '[data-target="' + target + '"]');
  }

  function setStatus(target, message, isError) {
    const status = nodeFor(".platform-2424-ad-status", target);
    if (!status) return;
    status.textContent = message || "";
    status.style.color = isError ? "#b32d2e" : "#2271b1";
  }

  async function requestPresign(file) {
    const formData = new FormData();
    formData.append("action", config.action);
    formData.append("nonce", config.nonce);
    formData.append("mimeType", file.type);
    formData.append("sizeBytes", String(file.size));

    const response = await fetch(config.ajaxUrl, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || !payload.success || !payload.data || !payload.data.uploadUrl || !payload.data.publicUrl) {
      throw new Error((payload && payload.data && payload.data.message) || config.messages.failed);
    }
    return payload.data;
  }

  async function uploadFile(target, file) {
    if (!file || !/^image\/(jpeg|png|webp|gif)$/.test(file.type || "")) {
      throw new Error(config.messages.invalidFile);
    }
    if (file.size > Number(config.maxSizeBytes || 0)) {
      throw new Error(config.messages.tooLarge);
    }

    setStatus(target, config.messages.preparing, false);
    const presign = await requestPresign(file);

    setStatus(target, config.messages.uploading, false);
    const uploadResponse = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error(config.messages.failed);
    }

    const input = document.getElementById("platform_2424_ad_" + target);
    if (input) input.value = presign.publicUrl;


    const preview = nodeFor(".platform-2424-ad-preview", target);
    const image = preview ? preview.querySelector("img") : null;
    if (preview && image) {
      image.src = presign.publicUrl;
      preview.style.display = "";
    }
    setStatus(target, config.messages.done, false);
  }

  document.querySelectorAll(".platform-2424-ad-file").forEach(function (fileInput) {
    fileInput.addEventListener("change", async function () {
      const target = fileInput.dataset.target;
      const file = fileInput.files && fileInput.files[0];
      if (!target || !file) return;
      fileInput.disabled = true;
      try {
        await uploadFile(target, file);
      } catch (error) {
        setStatus(target, error && error.message ? error.message : config.messages.failed, true);
      } finally {
        fileInput.disabled = false;
        fileInput.value = "";
      }
    });
  });

  document.querySelectorAll(".platform-2424-ad-clear").forEach(function (button) {
    button.addEventListener("click", function () {
      const target = button.dataset.target;
      if (!target) return;
      const input = document.getElementById("platform_2424_ad_" + target);
      if (input) input.value = "";
      const preview = nodeFor(".platform-2424-ad-preview", target);
      const image = preview ? preview.querySelector("img") : null;
      if (preview && image) {
        image.removeAttribute("src");
        preview.style.display = "none";
      }
      setStatus(target, config.messages.cleared, false);
    });
  });
})();
JS
        );
    }
}
add_action('admin_enqueue_scripts', 'platform_2424_ads_enqueue_admin_assets');

/* -------------------------------------------------------------------------
 * Colonnes de liste
 * ---------------------------------------------------------------------- */

if (!function_exists('platform_2424_ads_admin_columns')) {
    function platform_2424_ads_admin_columns($columns) {
        $next = array();
        foreach ($columns as $key => $label) {
            $next[$key] = $label;
            if ($key === 'title') {
                $next['platform_2424_ad_advertiser'] = 'Annonceur';
                $next['platform_2424_ad_slot'] = 'Emplacement';
                $next['platform_2424_ad_type'] = 'Type';
                $next['platform_2424_ad_window'] = 'Diffusion';
            }
        }
        return $next;
    }
}
add_filter('manage_' . PLATFORM_2424_ADS_POST_TYPE . '_posts_columns', 'platform_2424_ads_admin_columns');

if (!function_exists('platform_2424_ads_render_admin_column')) {
    function platform_2424_ads_render_admin_column($column, $post_id) {
        if ($column === 'platform_2424_ad_advertiser') {
            $advertiser = (string) get_post_meta($post_id, '_platform_2424_ad_advertiser', true);
            echo $advertiser !== '' ? esc_html($advertiser) : '<span aria-hidden="true">—</span>';
            return;
        }

        if ($column === 'platform_2424_ad_slot') {
            $slots = platform_2424_ads_get_slots();
            $slot_key = platform_2424_ads_resolve_slot_key($post_id);
            echo esc_html($slots[$slot_key]['label'] ?? $slot_key);
            return;
        }

        if ($column === 'platform_2424_ad_type') {
            $types = platform_2424_ads_get_types();
            $type = platform_2424_ads_resolve_type($post_id);
            echo esc_html($types[$type] ?? $type);
            return;
        }

        if ($column === 'platform_2424_ad_window') {
            $now_ts = time();
            $starts_ts = (int) get_post_meta($post_id, '_platform_2424_ad_starts_at_ts', true);
            $ends_ts = (int) get_post_meta($post_id, '_platform_2424_ad_ends_at_ts', true);

            if ($starts_ts > 0 && $starts_ts > $now_ts) {
                echo '<span style="color:#8a5a08;">Programmée</span>';
            } elseif ($ends_ts > 0 && $ends_ts < $now_ts) {
                echo '<span style="color:#b32d2e;">Terminée</span>';
            } else {
                echo '<span style="color:#1a5f47;">En cours</span>';
            }

            $starts = (string) get_post_meta($post_id, '_platform_2424_ad_starts_at', true);
            $ends = (string) get_post_meta($post_id, '_platform_2424_ad_ends_at', true);
            if ($starts !== '' || $ends !== '') {
                echo '<br /><small>' . esc_html(($starts ?: '…') . ' → ' . ($ends ?: '…')) . '</small>';
            }
        }
    }
}
add_action('manage_' . PLATFORM_2424_ADS_POST_TYPE . '_posts_custom_column', 'platform_2424_ads_render_admin_column', 10, 2);

/* -------------------------------------------------------------------------
 * REST
 * ---------------------------------------------------------------------- */

if (!function_exists('platform_2424_ads_rest_slots')) {
    function platform_2424_ads_rest_slots() {
        $slots = array();
        foreach (platform_2424_ads_get_slots() as $key => $definition) {
            $slots[] = array(
                'key' => $key,
                'label' => $definition['label'],
                'format' => platform_2424_ads_format_label($definition['default_format'] ?? ''),
                'rotation' => (bool) $definition['rotation'],
            );
        }

        return rest_ensure_response(array(
            'moduleVersion' => PLATFORM_2424_ADS_MODULE_VERSION,
            'slots' => $slots,
        ));
    }
}

if (!function_exists('platform_2424_ads_rest_public')) {
    function platform_2424_ads_rest_public(WP_REST_Request $request) {
        $requested = $request->get_param('slots');
        $feature = sanitize_key((string) $request->get_param('feature'));
        $features = platform_2424_ads_get_features();
        if (!isset($features[$feature])) {
            $feature = 'all';
        }

        // Forme historique : un seul emplacement, sous son ancien nom. Conservee
        // le temps que le frontend bascule sur la nouvelle forme.
        if (!is_array($requested)) {
            $legacy_placement = sanitize_key((string) $request->get_param('placement'));
            $map = platform_2424_ads_get_legacy_placement_map();
            if ($legacy_placement === '' || !isset($map[$legacy_placement])) {
                return new WP_Error('platform_2424_ads_invalid_placement', 'Emplacement publicitaire invalide.', array('status' => 400));
            }

            $resolved = platform_2424_ads_resolve_slot_cached($map[$legacy_placement], $feature);
            $items = array();
            foreach ($resolved['items'] as $item) {
                if ($item['type'] !== 'image') {
                    continue;
                }
                $items[] = array(
                    'id' => $item['id'],
                    'title' => $item['title'],
                    'description' => '',
                    'imageUrl' => $item['image']['desktop'],
                    'linkUrl' => $item['linkUrl'] ?? '',
                    'ctaLabel' => $item['ctaLabel'] ?? '',
                    'altText' => $item['altText'] ?? '',
                    'placement' => $legacy_placement,
                    'feature' => $item['feature'],
                    'position' => $item['position'],
                );
            }

            return rest_ensure_response(array(
                'placement' => $legacy_placement,
                'feature' => $feature,
                'items' => $items,
            ));
        }

        $slots = array();
        foreach ($requested as $raw_key) {
            $slot_key = sanitize_text_field((string) $raw_key);
            if (!platform_2424_ads_slot_exists($slot_key)) {
                continue;
            }

            $resolved = platform_2424_ads_resolve_slot_cached($slot_key, $feature);
            if ($resolved !== null) {
                $slots[$slot_key] = $resolved;
            }
        }

        return rest_ensure_response(array(
            'feature' => $feature,
            'slots' => $slots,
        ));
    }
}

if (!function_exists('platform_2424_ads_register_rest_routes')) {
    function platform_2424_ads_register_rest_routes() {
        $permission = function (WP_REST_Request $request) {
            return function_exists('platform_submissions_ensure_request_authorized')
                ? platform_submissions_ensure_request_authorized($request)
                : new WP_Error('platform_2424_ads_missing_auth', 'Internal authorization is not available.', array('status' => 500));
        };

        register_rest_route('2424/v1', '/ads/slots', array(
            'methods' => WP_REST_Server::READABLE,
            'permission_callback' => $permission,
            'callback' => 'platform_2424_ads_rest_slots',
        ));

        register_rest_route('2424/v1', '/ads/public', array(
            'methods' => WP_REST_Server::CREATABLE,
            'permission_callback' => $permission,
            'callback' => 'platform_2424_ads_rest_public',
        ));
    }
}
add_action('rest_api_init', 'platform_2424_ads_register_rest_routes');

/* -------------------------------------------------------------------------
 * Migration
 * ---------------------------------------------------------------------- */

if (!function_exists('platform_2424_ads_migrate')) {
    /**
     * Idempotente. Convertit les publicites existantes vers le nouveau schema,
     * et transforme chaque identifiant AdSense saisi dans les reglages en une
     * publicite de type `adsense` sur l'emplacement correspondant.
     */
    function platform_2424_ads_migrate($dry_run = false) {
        $report = array('ads' => 0, 'adsense_created' => 0, 'adsense_skipped' => 0);
        $map = platform_2424_ads_get_legacy_placement_map();

        $posts = get_posts(array(
            'post_type' => PLATFORM_2424_ADS_POST_TYPE,
            'post_status' => 'any',
            'posts_per_page' => -1,
            'fields' => 'ids',
        ));

        foreach ($posts as $post_id) {
            $post_id = (int) $post_id;
            $slot_key = (string) get_post_meta($post_id, '_platform_2424_ad_slot_key', true);

            if (!platform_2424_ads_slot_exists($slot_key)) {
                $legacy = (string) get_post_meta($post_id, '_platform_2424_ad_placement', true);
                $slot_key = $map[$legacy] ?? platform_2424_ads_default_slot_key();
                if (!$dry_run) {
                    update_post_meta($post_id, '_platform_2424_ad_slot_key', $slot_key);
                }
            }

            // L'ancien champ disparait partout : le laisser sur une publicite
            // deja reaffectee entretient une correspondance qui n'a plus cours.
            if (!$dry_run) {
                delete_post_meta($post_id, '_platform_2424_ad_placement');
            }

            if ((string) get_post_meta($post_id, '_platform_2424_ad_type', true) === '' && !$dry_run) {
                update_post_meta($post_id, '_platform_2424_ad_type', 'image');
            }

            foreach (array('_platform_2424_ad_starts_at_ts', '_platform_2424_ad_ends_at_ts', '_platform_2424_ad_priority', '_platform_2424_ad_weight') as $meta_key) {
                if (get_post_meta($post_id, $meta_key, true) === '' && !$dry_run) {
                    update_post_meta($post_id, $meta_key, 0);
                }
            }

            $report['ads']++;
        }

        // Les emplacements AdSense configures dans les reglages deviennent des
        // publicites, pour que rien de l'existant ne soit perdu.
        $legacy_adsense = array(
            'topBanner' => 'platform_2424_adsense_top_banner_slot',
            'homeTop' => 'platform_2424_adsense_home_top_slot',
            'homeSecond' => 'platform_2424_adsense_home_after_editorial_slot',
            'newsInline' => 'platform_2424_adsense_archive_inline_slot',
            'articleInline' => 'platform_2424_adsense_article_inline_slot',
        );

        foreach ($legacy_adsense as $slot_key => $option_name) {
            $adsense_slot_id = trim((string) get_option($option_name, ''));
            if ($adsense_slot_id === '') {
                continue;
            }

            $existing = get_posts(array(
                'post_type' => PLATFORM_2424_ADS_POST_TYPE,
                'post_status' => 'any',
                'posts_per_page' => 1,
                'fields' => 'ids',
                'meta_query' => array(
                    'relation' => 'AND',
                    array('key' => '_platform_2424_ad_slot_key', 'value' => $slot_key, 'compare' => '='),
                    array('key' => '_platform_2424_ad_type', 'value' => 'adsense', 'compare' => '='),
                ),
            ));

            if (!empty($existing)) {
                $report['adsense_skipped']++;
                continue;
            }

            if ($dry_run) {
                $report['adsense_created']++;
                continue;
            }

            $new_id = wp_insert_post(array(
                'post_type' => PLATFORM_2424_ADS_POST_TYPE,
                'post_status' => 'publish',
                'post_title' => sprintf('AdSense — %s', platform_2424_ads_get_slots()[$slot_key]['label']),
            ), true);

            if (is_wp_error($new_id)) {
                continue;
            }

            update_post_meta($new_id, '_platform_2424_ad_slot_key', $slot_key);
            update_post_meta($new_id, '_platform_2424_ad_type', 'adsense');
            update_post_meta($new_id, '_platform_2424_ad_adsense_slot_id', $adsense_slot_id);
            update_post_meta($new_id, '_platform_2424_ad_advertiser', 'Google AdSense');
            update_post_meta($new_id, '_platform_2424_ad_starts_at_ts', 0);
            update_post_meta($new_id, '_platform_2424_ad_ends_at_ts', 0);
            update_post_meta($new_id, '_platform_2424_ad_priority', 0);
            update_post_meta($new_id, '_platform_2424_ad_weight', 0);
            $report['adsense_created']++;
        }

        if (!$dry_run) {
            platform_2424_ads_flush_cache();
        }

        return $report;
    }
}

if (!function_exists('platform_2424_ads_maybe_migrate_once')) {
    function platform_2424_ads_maybe_migrate_once() {
        $option_key = 'platform_2424_ads_migrated_slot_keys';
        if (get_option($option_key)) {
            return;
        }

        // Garde posee en premier : en cas d'echec on ne rejoue pas, la commande
        // WP-CLI reste disponible pour reprendre a la main.
        update_option($option_key, 1, false);
        platform_2424_ads_migrate(false);
    }
}
// Uniquement dans l'administration : jamais sur le chemin d'une requete publique.
add_action('admin_init', 'platform_2424_ads_maybe_migrate_once');

if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('2424 ads-migrate', function ($args, $assoc_args) {
        $dry_run = isset($assoc_args['dry-run']);
        $report = platform_2424_ads_migrate($dry_run);
        WP_CLI::success(sprintf(
            '%s%d publicité(s) traitée(s), %d bloc(s) AdSense repris depuis les réglages, %d déjà présent(s).',
            $dry_run ? 'Simulation : ' : '',
            $report['ads'],
            $report['adsense_created'],
            $report['adsense_skipped']
        ));
    });
}
