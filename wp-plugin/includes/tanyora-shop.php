<?php

if (!defined('ABSPATH')) {
    exit;
}

// Book products remain admin-managed WooCommerce products; no checkout is exposed here.
add_action('init', function () {
    if (get_option('tanyora_shop_books_category_ready') === '1' || !taxonomy_exists('product_cat')) {
        return;
    }

    $term = term_exists('livres', 'product_cat');
    if (!$term) {
        $term = wp_insert_term('Livres', 'product_cat', array('slug' => 'livres'));
    }

    if (!is_wp_error($term)) {
        update_option('tanyora_shop_books_category_ready', '1', false);
    }
}, 30);

add_action('woocommerce_product_options_general_product_data', function () {
    if (!function_exists('woocommerce_wp_text_input')) {
        return;
    }

    echo '<div class="options_group">';
    woocommerce_wp_text_input(array(
        'id' => '_tanyora_book_author',
        'label' => 'Auteur du livre',
        'description' => 'Renseigner pour les produits de la categorie Livres.',
        'desc_tip' => true,
    ));
    woocommerce_wp_text_input(array(
        'id' => '_tanyora_book_isbn',
        'label' => 'ISBN du livre',
        'description' => 'Facultatif. Uniquement pour les produits de la categorie Livres.',
        'desc_tip' => true,
    ));
    echo '</div>';
});

add_action('woocommerce_admin_process_product_object', function ($product) {
    if (!($product instanceof WC_Product) || !current_user_can('edit_products')) {
        return;
    }

    foreach (array('_tanyora_book_author', '_tanyora_book_isbn') as $key) {
        if (isset($_POST[$key]) && is_scalar($_POST[$key])) {
            $product->update_meta_data($key, sanitize_text_field(wp_unslash((string) $_POST[$key])));
        }
    }
});

add_filter('woocommerce_is_purchasable', function ($purchasable, $product) {
    if ($product instanceof WC_Product && has_term('livres', 'product_cat', $product->get_id())) {
        return false;
    }

    return $purchasable;
}, 10, 2);

add_filter('woocommerce_add_to_cart_validation', function ($valid, $product_id) {
    return has_term('livres', 'product_cat', absint($product_id)) ? false : $valid;
}, 10, 2);

function tanyora_shop_public_book($product) {
    $image_id = $product->get_image_id();
    $image_url = $image_id ? wp_get_attachment_image_url($image_id, 'large') : false;

    return array(
        'id' => $product->get_id(),
        'slug' => $product->get_slug(),
        'title' => wp_strip_all_tags($product->get_name()),
        'author' => sanitize_text_field((string) $product->get_meta('_tanyora_book_author', true)),
        'isbn' => sanitize_text_field((string) $product->get_meta('_tanyora_book_isbn', true)),
        'summary' => wp_strip_all_tags($product->get_short_description()),
        'description' => wp_strip_all_tags($product->get_description()),
        'coverUrl' => $image_url ? esc_url_raw($image_url) : '',
        'format' => $product->is_virtual() && $product->is_downloadable() ? 'digital' : 'physical',
        'price' => (string) $product->get_price(),
        'currency' => get_woocommerce_currency(),
    );
}

add_action('rest_api_init', function () {
    register_rest_route('2424/v1', '/shop/books', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => 'platform_submissions_ensure_request_authorized',
        'callback' => function (WP_REST_Request $request) {
            if (!function_exists('wc_get_products')) {
                return new WP_Error('tanyora_shop_unavailable', 'Book catalog unavailable.', array('status' => 503));
            }

            $slug = sanitize_title((string) $request->get_param('slug'));
            if ($slug !== '') {
                $post = get_page_by_path($slug, OBJECT, 'product');
                $product = $post instanceof WP_Post ? wc_get_product($post->ID) : false;
                $visible = $product && $product->is_type('simple') && $product->get_status() === 'publish'
                    && $product->is_visible() && has_term('livres', 'product_cat', $product->get_id());

                return rest_ensure_response(array('item' => $visible ? tanyora_shop_public_book($product) : null));
            }

            $page = max(1, min(1000, absint($request->get_param('page') ?: 1)));
            $per_page = max(1, min(24, absint($request->get_param('perPage') ?: 12)));
            $result = wc_get_products(array(
                'status' => 'publish',
                'type' => 'simple',
                'visibility' => 'visible',
                'category' => array('livres'),
                'limit' => $per_page,
                'page' => $page,
                'paginate' => true,
                'orderby' => 'date',
                'order' => 'DESC',
            ));

            return rest_ensure_response(array(
                'items' => array_map('tanyora_shop_public_book', array_values(array_filter($result->products, function ($product) {
                    return $product instanceof WC_Product && $product->is_visible();
                }))),
                'pagination' => array(
                    'page' => $page,
                    'perPage' => $per_page,
                    'total' => (int) $result->total,
                    'totalPages' => (int) $result->max_num_pages,
                ),
            ));
        },
    ));
});
