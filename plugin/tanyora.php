<?php
/**
 * Plugin Name: Tanyora Marketplace
 * Description: Catalog and controlled publication for the Tanyora mineral marketplace.
 * Version: 0.1.0
 * Author: RijaCloud
 * Requires PHP: 8.2
 */

defined('ABSPATH') || exit;

add_action('init', static function (): void {
    register_post_type('tanyora_mineral', [
        'label' => 'Lots de minéraux', 'public' => true, 'show_in_rest' => false,
        'supports' => ['title', 'editor', 'thumbnail', 'author'],
        'capability_type' => 'post', 'map_meta_cap' => true,
    ]);
    register_post_type('tanyora_book', [
        'label' => 'Livres', 'public' => true, 'show_in_rest' => false,
        'supports' => ['title', 'editor', 'thumbnail', 'author'],
        'capability_type' => 'post', 'map_meta_cap' => true,
    ]);
    register_post_type('tanyora_expert', [
        'label' => 'Cabinets et consultants', 'public' => true, 'show_in_rest' => false,
        'supports' => ['title', 'editor', 'thumbnail'],
        'capability_type' => 'post', 'map_meta_cap' => true,
    ]);
    register_taxonomy('tanyora_mineral_family', 'tanyora_mineral', [
        'label' => 'Familles de minéraux', 'public' => true, 'show_in_rest' => true,
    ]);
});

function tanyora_admin_fields(string $type): array {
    if ($type === 'tanyora_mineral') {
        return [
            '_tanyora_origin' => 'Origine déclarée',
            '_tanyora_quantity' => 'Quantité',
            '_tanyora_unit' => 'Unité',
        ];
    }
    if ($type === 'tanyora_book') {
        return [
            '_tanyora_author' => 'Auteur',
            '_tanyora_price' => 'Prix en ariary',
        ];
    }
    if ($type === 'tanyora_expert') {
        return [
            '_tanyora_specialty' => 'Spécialité publique',
            '_tanyora_location' => 'Localisation publique',
        ];
    }
    return [];
}

add_action('add_meta_boxes', static function (): void {
    foreach (['tanyora_mineral', 'tanyora_book', 'tanyora_expert'] as $type) {
        add_meta_box('tanyora_details', 'Informations Tanyora', static function (WP_Post $post): void {
            wp_nonce_field('tanyora_save_details', 'tanyora_details_nonce');
            foreach (tanyora_admin_fields($post->post_type) as $key => $label) {
                $value = (string) get_post_meta($post->ID, $key, true);
                $input_type = $key === '_tanyora_price' ? 'number' : 'text';
                echo '<p><label for="' . esc_attr($key) . '">' . esc_html($label) . '</label><br>';
                echo '<input class="widefat" id="' . esc_attr($key) . '" name="tanyora_details[' . esc_attr($key) . ']" type="' . esc_attr($input_type) . '" min="0" value="' . esc_attr($value) . '"></p>';
            }
        }, $type);
    }
});

add_action('save_post', static function (int $post_id, WP_Post $post): void {
    if (!tanyora_admin_fields($post->post_type)) return;
    if (wp_is_post_revision($post_id) || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)) return;
    $nonce = isset($_POST['tanyora_details_nonce']) ? sanitize_text_field(wp_unslash($_POST['tanyora_details_nonce'])) : '';
    if (!wp_verify_nonce($nonce, 'tanyora_save_details') || !current_user_can('edit_post', $post_id)) return;
    $submitted = isset($_POST['tanyora_details']) && is_array($_POST['tanyora_details']) ? wp_unslash($_POST['tanyora_details']) : [];
    foreach (tanyora_admin_fields($post->post_type) as $key => $_label) {
        if (!array_key_exists($key, $submitted) || !is_scalar($submitted[$key])) continue;
        $value = $key === '_tanyora_price' ? (string) max(0, (int) $submitted[$key]) : sanitize_text_field((string) $submitted[$key]);
        update_post_meta($post_id, $key, $value);
    }
}, 10, 2);

function tanyora_public_item(WP_Post $post): array {
    $kind = $post->post_type;
    $base = [
        'id' => $post->ID,
        'slug' => $post->post_name,
        'title' => get_the_title($post),
        'summary' => wp_strip_all_tags(get_the_excerpt($post)),
        'imageUrl' => get_the_post_thumbnail_url($post, 'large') ?: null,
    ];
    if ($kind === 'tanyora_mineral') {
        return $base + [
            'family' => wp_get_post_terms($post->ID, 'tanyora_mineral_family', ['fields' => 'names']),
            'origin' => sanitize_text_field((string) get_post_meta($post->ID, '_tanyora_origin', true)),
            'quantity' => sanitize_text_field((string) get_post_meta($post->ID, '_tanyora_quantity', true)),
            'unit' => sanitize_text_field((string) get_post_meta($post->ID, '_tanyora_unit', true)),
        ];
    }
    if ($kind === 'tanyora_book') {
        return $base + [
            'author' => sanitize_text_field((string) get_post_meta($post->ID, '_tanyora_author', true)),
            'price' => (int) get_post_meta($post->ID, '_tanyora_price', true),
            'format' => 'PDF',
        ];
    }
    // Public expert responses deliberately omit contact, owner and internal fields.
    return $base + [
        'specialty' => sanitize_text_field((string) get_post_meta($post->ID, '_tanyora_specialty', true)),
        'location' => sanitize_text_field((string) get_post_meta($post->ID, '_tanyora_location', true)),
    ];
}

add_action('rest_api_init', static function (): void {
    foreach (['minerals' => 'tanyora_mineral', 'books' => 'tanyora_book', 'experts' => 'tanyora_expert'] as $route => $type) {
        register_rest_route('tanyora/v1', '/' . $route, [
            'methods' => WP_REST_Server::READABLE,
            'permission_callback' => '__return_true',
            'callback' => static function (WP_REST_Request $request) use ($type) {
                $query = new WP_Query([
                    'post_type' => $type,
                    'post_status' => 'publish',
                    'posts_per_page' => min(24, max(1, (int) ($request->get_param('per_page') ?: 12))),
                    'paged' => max(1, (int) ($request->get_param('page') ?: 1)),
                    's' => sanitize_text_field((string) $request->get_param('q')),
                    'no_found_rows' => false,
                ]);
                return rest_ensure_response([
                    'items' => array_map('tanyora_public_item', $query->posts),
                    'total' => (int) $query->found_posts,
                ]);
            },
        ]);
        register_rest_route('tanyora/v1', '/' . $route . '/(?P<slug>[a-z0-9-]+)', [
            'methods' => WP_REST_Server::READABLE,
            'permission_callback' => '__return_true',
            'callback' => static function (WP_REST_Request $request) use ($type) {
                $post = get_page_by_path((string) $request['slug'], OBJECT, $type);
                if (!$post || $post->post_status !== 'publish') {
                    return new WP_Error('tanyora_not_found', 'Contenu introuvable.', ['status' => 404]);
                }
                return rest_ensure_response(tanyora_public_item($post));
            },
        ]);
    }
});
