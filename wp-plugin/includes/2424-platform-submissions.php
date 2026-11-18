<?php
/**
 * 2424 Platform Submissions module
 * Description: Sync platform users to WordPress and receive pending platform submissions from Next.js.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('PLATFORM_2424_SUBMISSIONS_MODULE_VERSION')) {
    define('PLATFORM_2424_SUBMISSIONS_MODULE_VERSION', '1.0.9');
}

if (!function_exists('platform_submissions_secret')) {
    function platform_submissions_secret() {
        if (defined('PLATFORM_SUBMISSIONS_SECRET') && PLATFORM_SUBMISSIONS_SECRET) {
            return PLATFORM_SUBMISSIONS_SECRET;
        }

        $env = getenv('PLATFORM_SUBMISSIONS_SECRET');
        if ($env) {
            return $env;
        }

        return (string) get_option('platform_2424_submissions_secret', '');
    }
}

if (!function_exists('platform_submissions_ensure_request_authorized')) {
    function platform_submissions_ensure_request_authorized(WP_REST_Request $request) {
        $expected = platform_submissions_secret();
        if (!$expected) {
            return new WP_Error('platform_submissions_missing_secret', 'Platform submissions secret is not configured.', array('status' => 500));
        }

        $received = (string) $request->get_header('x-2424-internal-secret');
        if (!$received || !hash_equals($expected, $received)) {
            return new WP_Error('platform_submissions_forbidden', 'Invalid platform submissions secret.', array('status' => 403));
        }

        return true;
    }
}

if (!function_exists('platform_submissions_decode_html_entities')) {
    function platform_submissions_decode_html_entities($value) {
        $value = (string) $value;
        if ($value === '') {
            return '';
        }

        return html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}

if (!function_exists('platform_submissions_decode_escaped_unicode_sequences')) {
    function platform_submissions_decode_escaped_unicode_sequences($value) {
        $value = (string) $value;
        if ($value === '') {
            return '';
        }

        $value = preg_replace_callback('/\\\\u([0-9a-fA-F]{4})/', function ($matches) {
            $codepoint = hexdec((string) $matches[1]);
            if (function_exists('mb_convert_encoding')) {
                return mb_convert_encoding('&#' . $codepoint . ';', 'UTF-8', 'HTML-ENTITIES');
            }

            return html_entity_decode('&#' . $codepoint . ';', ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }, $value);

        $value = preg_replace_callback('/\\\\x([0-9a-fA-F]{2})/', function ($matches) {
            return chr(hexdec((string) $matches[1]));
        }, $value);

        $value = preg_replace_callback('/([A-Za-z])u([0-9a-fA-F]{4})/', function ($matches) {
            $codepoint = hexdec((string) $matches[2]);
            $decoded = function_exists('mb_convert_encoding')
                ? mb_convert_encoding('&#' . $codepoint . ';', 'UTF-8', 'HTML-ENTITIES')
                : html_entity_decode('&#' . $codepoint . ';', ENT_QUOTES | ENT_HTML5, 'UTF-8');

            return (string) $matches[1] . $decoded;
        }, $value);

        return $value;
    }
}

if (!function_exists('platform_submissions_get_public_listing_reference_date')) {
    function platform_submissions_get_public_listing_reference_date($post_or_id) {
        $post = $post_or_id instanceof WP_Post ? $post_or_id : get_post(absint($post_or_id));
        if (!$post instanceof WP_Post) {
            return '';
        }

        $paid_at = trim((string) get_post_meta($post->ID, 'payment_paid_at', true));
        if ($paid_at !== '') {
            $paid_ts = strtotime($paid_at);
            if ($paid_ts !== false && $paid_ts > 0) {
                return gmdate('c', $paid_ts);
            }
        }

        $published_ts = (int) get_post_time('U', true, $post);
        if ($published_ts > 0) {
            return gmdate('c', $published_ts);
        }

        $post_date_gmt = trim((string) $post->post_date_gmt);
        if ($post_date_gmt !== '' && $post_date_gmt !== '0000-00-00 00:00:00') {
            $post_date_gmt_ts = strtotime($post_date_gmt);
            if ($post_date_gmt_ts !== false && $post_date_gmt_ts > 0) {
                return gmdate('c', $post_date_gmt_ts);
            }
        }

        $post_date = trim((string) $post->post_date);
        if ($post_date !== '' && $post_date !== '0000-00-00 00:00:00') {
            $post_date_ts = strtotime($post_date);
            if ($post_date_ts !== false && $post_date_ts > 0) {
                return gmdate('c', $post_date_ts);
            }
        }

        return '';
    }
}

if (!function_exists('platform_submissions_register_post_types')) {
    function platform_submissions_register_post_types() {
        register_post_type('annuaire', array(
            'labels' => array(
                'name' => 'Annuaire',
                'singular_name' => 'Entree annuaire',
                'menu_name' => 'Annuaire',
                'add_new_item' => 'Ajouter une entree annuaire',
                'edit_item' => "Modifier l'entree annuaire",
            ),
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'supports' => array('title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'),
            'has_archive' => false,
            'show_in_rest' => true,
            'menu_icon' => 'dashicons-building',
            'capability_type' => 'post',
            'map_meta_cap' => true,
        ));

        register_post_type('classified_ad', array(
            'labels' => array(
                'name' => 'Petites annonces',
                'singular_name' => 'Petite annonce',
                'menu_name' => 'Petites annonces',
                'add_new_item' => 'Ajouter une petite annonce',
                'edit_item' => 'Modifier la petite annonce',
            ),
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'supports' => array('title', 'editor', 'author', 'thumbnail', 'excerpt', 'custom-fields'),
            'has_archive' => false,
            'show_in_rest' => true,
            'menu_icon' => 'dashicons-megaphone',
            'capability_type' => 'post',
            'map_meta_cap' => true,
        ));

        register_post_type('tender_notice', array(
            'labels' => array(
                'name' => "Appels d'offre",
                'singular_name' => "Appel d'offre",
                'menu_name' => "Appels d'offre",
                'add_new_item' => "Ajouter un appel d'offre",
                'edit_item' => "Modifier l'appel d'offre",
            ),
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'supports' => array('title', 'editor', 'author', 'thumbnail', 'excerpt', 'custom-fields'),
            'has_archive' => false,
            'show_in_rest' => true,
            'menu_icon' => 'dashicons-portfolio',
            'capability_type' => 'post',
            'map_meta_cap' => true,
        ));

        register_post_type('job_offer', array(
            'labels' => array(
                'name' => "Offres d'emploi",
                'singular_name' => "Offre d'emploi",
                'menu_name' => "Offres d'emploi",
                'add_new_item' => "Ajouter une offre d'emploi",
                'edit_item' => "Modifier l'offre d'emploi",
            ),
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'supports' => array('title', 'editor', 'author', 'thumbnail', 'excerpt', 'custom-fields'),
            'has_archive' => false,
            'show_in_rest' => true,
            'menu_icon' => 'dashicons-id-alt',
            'capability_type' => 'post',
            'map_meta_cap' => true,
        ));
    }
}

add_action('init', 'platform_submissions_register_post_types');

if (!function_exists('platform_submissions_register_taxonomies')) {
    function platform_submissions_register_taxonomies() {
        register_taxonomy('directory_category', array('annuaire'), array(
            'labels' => array(
                'name' => 'Categories annuaire',
                'singular_name' => 'Categorie annuaire',
                'menu_name' => 'Categories annuaire',
            ),
            'public' => false,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_rest' => true,
            'hierarchical' => true,
            'rewrite' => false,
        ));

        register_taxonomy('directory_location', array('annuaire'), array(
            'labels' => array(
                'name' => 'Localisations annuaire',
                'singular_name' => 'Localisation annuaire',
                'menu_name' => 'Localisations annuaire',
            ),
            'public' => false,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_rest' => true,
            'hierarchical' => true,
            'rewrite' => false,
        ));

        register_taxonomy('classified_category', array('classified_ad'), array(
            'labels' => array(
                'name' => 'Categories annonces',
                'singular_name' => 'Categorie annonce',
                'menu_name' => 'Categories annonces',
            ),
            'public' => false,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_rest' => true,
            'hierarchical' => true,
            'rewrite' => false,
        ));

        register_taxonomy('classified_product_tag', array('classified_ad'), array(
            'labels' => array(
                'name' => 'Tags produit',
                'singular_name' => 'Tag produit',
                'menu_name' => 'Tags produit',
                'search_items' => 'Rechercher des tags produit',
                'popular_items' => 'Tags produit populaires',
                'all_items' => 'Tous les tags produit',
                'edit_item' => 'Modifier le tag produit',
                'update_item' => 'Mettre a jour le tag produit',
                'add_new_item' => 'Ajouter un tag produit',
                'new_item_name' => 'Nouveau tag produit',
                'separate_items_with_commas' => 'Separez les tags produit par des virgules',
                'add_or_remove_items' => 'Ajouter ou supprimer des tags produit',
                'choose_from_most_used' => 'Choisir parmi les tags produit les plus utilises',
            ),
            'public' => false,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_rest' => true,
            'hierarchical' => false,
            'rewrite' => false,
        ));

        register_taxonomy('listing_location', array('classified_ad', 'job_offer', 'tender_notice'), array(
            'labels' => array(
                'name' => 'Villes et zones',
                'singular_name' => 'Ville ou zone',
                'menu_name' => 'Villes et zones',
            ),
            'public' => false,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_rest' => true,
            'hierarchical' => true,
            'rewrite' => false,
        ));

        register_taxonomy('classified_location', array('classified_ad'), array(
            'labels' => array(
                'name' => 'Localisations annonces (legacy)',
                'singular_name' => 'Localisation annonce (legacy)',
                'menu_name' => 'Localisations annonces (legacy)',
            ),
            'public' => false,
            'show_ui' => false,
            'show_admin_column' => false,
            'show_in_rest' => false,
            'hierarchical' => true,
            'rewrite' => false,
        ));

        register_taxonomy('tender_category', array('tender_notice'), array(
            'labels' => array(
                'name' => "Categories appels d'offre",
                'singular_name' => "Categorie appel d'offre",
                'menu_name' => "Categories appels d'offre",
            ),
            'public' => false,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_rest' => true,
            'hierarchical' => true,
            'rewrite' => false,
        ));

        register_taxonomy('job_category', array('job_offer'), array(
            'labels' => array(
                'name' => "Categories emploi",
                'singular_name' => "Categorie emploi",
                'menu_name' => "Categories emploi",
            ),
            'public' => false,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_rest' => true,
            'hierarchical' => true,
            'rewrite' => false,
        ));

        register_taxonomy('job_location', array('job_offer'), array(
            'labels' => array(
                'name' => 'Localisations emploi (legacy)',
                'singular_name' => 'Localisation emploi (legacy)',
                'menu_name' => 'Localisations emploi (legacy)',
            ),
            'public' => false,
            'show_ui' => false,
            'show_admin_column' => false,
            'show_in_rest' => false,
            'hierarchical' => true,
            'rewrite' => false,
        ));

        register_taxonomy('tender_location', array('tender_notice'), array(
            'labels' => array(
                'name' => "Localisations appels d'offre",
                'singular_name' => "Localisation appel d'offre",
                'menu_name' => 'Localisations AO',
            ),
            'public' => false,
            'show_ui' => false,
            'show_admin_column' => false,
            'show_in_rest' => false,
            'hierarchical' => true,
            'rewrite' => false,
        ));

        register_post_type('platform_user_rating', array(
            'labels' => array(
                'name' => 'Notes utilisateurs',
                'singular_name' => 'Note utilisateur',
                'menu_name' => 'Notes utilisateurs',
            ),
            'public' => false,
            'show_ui' => false,
            'show_in_menu' => false,
            'supports' => array('title', 'custom-fields'),
            'has_archive' => false,
            'show_in_rest' => false,
            'capability_type' => 'post',
            'map_meta_cap' => true,
        ));
    }
}

add_action('init', 'platform_submissions_register_taxonomies');

add_action('admin_menu', function () {
    add_menu_page(
        'Référentiel',
        'Référentiel',
        'manage_categories',
        'platform-location-reference',
        function () {
            $terms_url = admin_url('edit-tags.php?taxonomy=listing_location&post_type=classified_ad');
            echo '<div class="wrap"><h1>Référentiel géographique</h1>';
            echo '<p>Les villes et zones sont partagées par les petites annonces, les offres d’emploi et les appels d’offres.</p>';
            echo '<p><a class="button button-primary" href="' . esc_url($terms_url) . '">Gérer les villes et zones</a></p>';
            echo '<hr /><h2>Migration des contenus existants</h2>';
            echo '<p>La migration ne s’exécute jamais automatiquement. Lancez d’abord <code>wp 2424 migrate-locations --dry-run</code>, puis traitez par lots avec <code>wp 2424 migrate-locations --batch=200 --offset=0</code>.</p>';
            echo '</div>';
        },
        'dashicons-location-alt',
        26
    );
});

if (!function_exists('platform_submissions_sortable_taxonomies')) {
    function platform_submissions_sortable_taxonomies() {
        return array('directory_category', 'directory_location', 'classified_category', 'classified_product_tag', 'listing_location', 'job_category', 'tender_category', 'tender_location');
    }
}

if (!function_exists('platform_submissions_classified_product_tag_meta_key')) {
    function platform_submissions_classified_product_tag_meta_key() {
        return 'platform_classified_product_tag_ids';
    }
}

if (!function_exists('platform_submissions_get_classified_product_tag_terms')) {
    function platform_submissions_get_classified_product_tag_terms() {
        if (!taxonomy_exists('classified_product_tag')) {
            return array();
        }

        $terms = get_terms(array(
            'taxonomy' => 'classified_product_tag',
            'hide_empty' => false,
        ));

        if (is_wp_error($terms) || !is_array($terms)) {
            return array();
        }

        usort($terms, function ($left, $right) {
            $left_order = absint(get_term_meta($left->term_id, 'platform_term_order', true));
            $right_order = absint(get_term_meta($right->term_id, 'platform_term_order', true));

            if ($left_order === $right_order) {
                return strcasecmp((string) $left->name, (string) $right->name);
            }

            return $left_order <=> $right_order;
        });

        return $terms;
    }
}

if (!function_exists('platform_submissions_get_allowed_classified_product_tag_ids_for_category')) {
    function platform_submissions_get_allowed_classified_product_tag_ids_for_category($term_id) {
        $term_id = absint($term_id);
        if ($term_id <= 0) {
            return array();
        }

        $raw_value = get_term_meta($term_id, platform_submissions_classified_product_tag_meta_key(), true);
        $ids = is_array($raw_value) ? $raw_value : array();

        return array_values(array_unique(array_filter(array_map('absint', $ids))));
    }
}

if (!function_exists('platform_submissions_sanitize_classified_product_tag_ids')) {
    function platform_submissions_sanitize_classified_product_tag_ids($raw_ids) {
        $candidate_ids = is_array($raw_ids) ? $raw_ids : array();
        $candidate_ids = array_values(array_unique(array_filter(array_map('absint', $candidate_ids))));
        if (empty($candidate_ids) || !taxonomy_exists('classified_product_tag')) {
            return array();
        }

        $valid_terms = get_terms(array(
            'taxonomy' => 'classified_product_tag',
            'hide_empty' => false,
            'include' => $candidate_ids,
        ));

        if (is_wp_error($valid_terms) || !is_array($valid_terms)) {
            return array();
        }

        return array_values(array_map('absint', wp_list_pluck($valid_terms, 'term_id')));
    }
}

if (!function_exists('platform_submissions_render_classified_product_tag_search_field')) {
    function platform_submissions_render_classified_product_tag_search_field() {
        static $script_rendered = false;
        ?>
        <input
            type="search"
            class="regular-text platform-classified-product-tag-search"
            placeholder="Rechercher un tag produit"
            style="width: 100%; margin-bottom: 8px;"
        />
        <?php if ($script_rendered) : ?>
            <?php return; ?>
        <?php endif; ?>
        <script>
            document.addEventListener('input', function (event) {
                if (!event.target || !event.target.classList.contains('platform-classified-product-tag-search')) {
                    return;
                }

                var wrapper = event.target.closest('.platform-classified-product-tag-picker');
                if (!wrapper) {
                    return;
                }

                var select = wrapper.querySelector('.platform-classified-product-tag-select');
                if (!select) {
                    return;
                }

                var query = String(event.target.value || '').trim().toLowerCase();
                Array.prototype.forEach.call(select.options, function (option) {
                    var matches = query === '' || String(option.text || '').toLowerCase().indexOf(query) !== -1;
                    option.hidden = !matches;
                });
            });
        </script>
        <?php
        $script_rendered = true;
    }
}

if (!function_exists('platform_submissions_render_classified_category_product_tags_add_field')) {
    function platform_submissions_render_classified_category_product_tags_add_field() {
        $terms = platform_submissions_get_classified_product_tag_terms();
        ?>
        <div class="form-field term-group platform-classified-product-tag-picker">
            <label for="platform-classified-product-tag-ids">Tags produit autorises</label>
            <?php platform_submissions_render_classified_product_tag_search_field(); ?>
            <select id="platform-classified-product-tag-ids" class="platform-classified-product-tag-select" name="platform_classified_product_tag_ids[]" multiple="multiple" size="8" style="width: 100%;">
                <?php foreach ($terms as $term) : ?>
                    <option value="<?php echo esc_attr((string) $term->term_id); ?>"><?php echo esc_html((string) $term->name); ?></option>
                <?php endforeach; ?>
            </select>
            <p>Choisissez les tags produit qui pourront etre proposes quand cette categorie sera selectionnee dans le front. Si aucun tag n est selectionne, aucun tag produit ne sera propose.</p>
        </div>
        <?php
    }
}

if (!function_exists('platform_submissions_render_classified_category_product_tags_edit_field')) {
    function platform_submissions_render_classified_category_product_tags_edit_field($term) {
        $allowed_ids = platform_submissions_get_allowed_classified_product_tag_ids_for_category($term->term_id);
        $terms = platform_submissions_get_classified_product_tag_terms();
        ?>
        <tr class="form-field term-group-wrap platform-classified-product-tag-picker">
            <th scope="row"><label for="platform-classified-product-tag-ids">Tags produit autorises</label></th>
            <td>
                <?php platform_submissions_render_classified_product_tag_search_field(); ?>
                <select id="platform-classified-product-tag-ids" class="platform-classified-product-tag-select" name="platform_classified_product_tag_ids[]" multiple="multiple" size="10" style="width: min(100%, 420px);">
                    <?php foreach ($terms as $product_tag_term) : ?>
                        <option value="<?php echo esc_attr((string) $product_tag_term->term_id); ?>" <?php selected(in_array((int) $product_tag_term->term_id, $allowed_ids, true)); ?>>
                            <?php echo esc_html((string) $product_tag_term->name); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <p class="description">Association geree uniquement dans l'administration pour limiter les tags proposes a cette categorie. Si aucun tag n est selectionne, aucun tag produit ne sera propose.</p>
            </td>
        </tr>
        <?php
    }
}

if (!function_exists('platform_submissions_save_classified_category_product_tags')) {
    function platform_submissions_save_classified_category_product_tags($term_id) {
        $term_id = absint($term_id);
        if ($term_id <= 0) {
            return;
        }

        $raw_ids = isset($_POST['platform_classified_product_tag_ids']) ? wp_unslash($_POST['platform_classified_product_tag_ids']) : array();
        $sanitized_ids = platform_submissions_sanitize_classified_product_tag_ids($raw_ids);

        if (empty($sanitized_ids)) {
            delete_term_meta($term_id, platform_submissions_classified_product_tag_meta_key());
            return;
        }

        update_term_meta($term_id, platform_submissions_classified_product_tag_meta_key(), $sanitized_ids);
    }
}

if (!function_exists('platform_submissions_taxonomy_seed_data')) {
    function platform_submissions_taxonomy_seed_data() {
        return array(
            'directory_category' => array(
                array('name' => 'Géologues et exploration', 'slug' => 'geologues-exploration'),
                array('name' => 'Conseil et études minières', 'slug' => 'conseil-etudes-minieres'),
                array('name' => 'Analyses et essais de minerais', 'slug' => 'analyses-essais-minerais'),
                array('name' => 'Expertise gemmologique', 'slug' => 'expertise-gemmologique'),
                array('name' => 'Lapidairerie et transformation', 'slug' => 'lapidairerie-transformation'),
            ),
            'directory_location' => array(
                array('name' => 'Antananarive', 'slug' => 'antananarive'),
                array('name' => 'Antsirabe', 'slug' => 'antsirabe'),
                array('name' => 'Tamatave', 'slug' => 'tamatave'),
                array('name' => 'Fianarantsoa', 'slug' => 'fianarantsoa'),
                array('name' => 'Diego', 'slug' => 'diego'),
                array('name' => 'Majunga', 'slug' => 'majunga'),
                array('name' => 'Tulear', 'slug' => 'tulear'),
                array('name' => 'Fort Dauphin', 'slug' => 'fort-dauphin'),
            ),
            'classified_category' => array(
                array('name' => 'Minéraux bruts', 'slug' => 'mineraux-bruts'),
                array('name' => 'Cristaux et spécimens', 'slug' => 'cristaux-specimens'),
                array('name' => 'Gemmes et pierres taillées', 'slug' => 'gemmes-pierres-taillees'),
                array('name' => 'Fossiles et météorites', 'slug' => 'fossiles-meteorites'),
                array('name' => 'Lots et collections', 'slug' => 'lots-collections'),
                array('name' => 'Matériel de collection', 'slug' => 'materiel-collection'),
            ),
            'job_category' => array(
                array('name' => 'Informatique', 'slug' => 'informatique'),
                array('name' => 'Commercial', 'slug' => 'commercial'),
                array('name' => 'Marketing', 'slug' => 'marketing'),
                array('name' => 'RH', 'slug' => 'rh'),
                array('name' => 'Finance', 'slug' => 'finance'),
                array('name' => 'Support client', 'slug' => 'support-client'),
            ),
            'listing_location' => array(
                array('name' => 'Antananarive', 'slug' => 'antananarive'),
                array('name' => 'Antsirabe', 'slug' => 'antsirabe'),
                array('name' => 'Tamatave', 'slug' => 'tamatave'),
                array('name' => 'Fianarantsoa', 'slug' => 'fianarantsoa'),
                array('name' => 'Diego', 'slug' => 'diego'),
                array('name' => 'Majunga', 'slug' => 'majunga'),
                array('name' => 'TulÃƒÆ’Ã‚Â©ar', 'slug' => 'tulear'),
                array('name' => 'Fort Dauphin', 'slug' => 'fort-dauphin'),
            ),
            'tender_location' => array(
                array('name' => 'Antananarive', 'slug' => 'antananarive'),
                array('name' => 'Antsirabe', 'slug' => 'antsirabe'),
                array('name' => 'Tamatave', 'slug' => 'tamatave'),
                array('name' => 'Fianarantsoa', 'slug' => 'fianarantsoa'),
                array('name' => 'Diego', 'slug' => 'diego'),
                array('name' => 'Majunga', 'slug' => 'majunga'),
                array('name' => 'TulÃƒÆ’Ã‚Â©ar', 'slug' => 'tulear'),
                array('name' => 'Fort Dauphin', 'slug' => 'fort-dauphin'),
            ),
            'tender_category' => array(
                array('name' => 'Construction', 'slug' => 'construction'),
                array('name' => 'Informatique', 'slug' => 'informatique'),
                array('name' => 'Transport', 'slug' => 'transport'),
                array('name' => 'Services', 'slug' => 'services'),
                array('name' => 'Energie', 'slug' => 'energie'),
                array('name' => 'Sante', 'slug' => 'sante'),
            ),
        );
    }
}

if (!function_exists('platform_submissions_seed_taxonomies')) {
    function platform_submissions_seed_taxonomies($force = false) {
        $seed_version = 'v4';
        $option_key = 'platform_submissions_taxonomy_seed_version';
        $already_seeded = (string) get_option($option_key, '');
        if (!$force && $already_seeded === $seed_version) {
            return;
        }

        foreach (platform_submissions_taxonomy_seed_data() as $taxonomy => $entries) {
            if (!taxonomy_exists($taxonomy)) {
                continue;
            }

            foreach ($entries as $index => $entry) {
                $name = sanitize_text_field((string) ($entry['name'] ?? ''));
                $slug = sanitize_title((string) ($entry['slug'] ?? ''));
                if ($name === '' || $slug === '') {
                    continue;
                }

                $exists = term_exists($slug, $taxonomy);
                if ($exists) {
                    $term_id = is_array($exists) ? absint($exists['term_id'] ?? 0) : absint($exists);
                    if ($term_id > 0 && !metadata_exists('term', $term_id, 'platform_term_order')) {
                        update_term_meta($term_id, 'platform_term_order', $index);
                    }
                    continue;
                }

                $inserted = wp_insert_term($name, $taxonomy, array('slug' => $slug));
                if (!is_wp_error($inserted)) {
                    $term_id = absint($inserted['term_id'] ?? 0);
                    if ($term_id > 0) {
                        update_term_meta($term_id, 'platform_term_order', $index);
                    }
                }
            }
        }

        update_option($option_key, $seed_version, false);
    }
}

if (!function_exists('platform_submissions_default_admin_user_id')) {
    function platform_submissions_default_admin_user_id() {
        $admins = get_users(array(
            'role' => 'administrator',
            'orderby' => 'ID',
            'order' => 'ASC',
            'number' => 1,
            'fields' => 'ID',
        ));

        if (is_array($admins) && !empty($admins)) {
            return (int) $admins[0];
        }

        return 1;
    }
}

if (!function_exists('platform_submissions_should_seed_samples')) {
    function platform_submissions_should_seed_samples() {
        $force_env = getenv('PLATFORM_ENABLE_SAMPLE_SEED');
        if (is_string($force_env) && strtolower(trim($force_env)) === 'true') {
            return true;
        }

        if (function_exists('wp_get_environment_type') && wp_get_environment_type() === 'production') {
            return false;
        }

        return true;
    }
}

if (!function_exists('platform_submissions_seed_sample_posts')) {
    function platform_submissions_seed_sample_posts($force = false) {
        if (!platform_submissions_should_seed_samples()) {
            return;
        }

        $seed_version = 'v1';
        $option_key = 'platform_submissions_sample_posts_seed_version';
        $already_seeded = (string) get_option($option_key, '');
        if (!$force && $already_seeded === $seed_version) {
            return;
        }

        $author_id = platform_submissions_default_admin_user_id();
        $samples = array(
            array(
                'post_type' => 'classified_ad',
                'title' => 'Toyota Yaris 2018',
                'content' => 'Vehicule en bon etat, carnet a jour, faible kilometrage.',
                'taxonomy' => 'classified_category',
                'term' => 'Voitures',
            ),
            array(
                'post_type' => 'job_offer',
                'title' => 'Developpeur Full Stack',
                'content' => 'Nous recrutons un profil full stack pour renforcer notre equipe produit.',
                'taxonomy' => 'job_category',
                'term' => 'Informatique',
            ),
            array(
                'post_type' => 'tender_notice',
                'title' => 'Acquisition materiel reseau',
                'content' => 'Consultation pour la fourniture et l installation de materiel reseau sur 3 sites.',
                'taxonomy' => 'tender_category',
                'term' => 'Informatique',
            ),
        );

        foreach ($samples as $sample) {
            $existing = get_posts(array(
                'post_type' => $sample['post_type'],
                'post_status' => array('publish', 'pending', 'draft', 'private'),
                's' => $sample['title'],
                'posts_per_page' => 1,
                'fields' => 'all',
            ));
            $already_exists = false;
            foreach ($existing as $existing_post) {
                if ((string) $existing_post->post_title === (string) $sample['title']) {
                    $already_exists = true;
                    break;
                }
            }
            if ($already_exists) {
                continue;
            }

            $post_id = wp_insert_post(array(
                'post_type' => $sample['post_type'],
                'post_status' => 'publish',
                'post_title' => $sample['title'],
                'post_content' => $sample['content'],
                'post_author' => $author_id,
            ), true);

            if (is_wp_error($post_id)) {
                continue;
            }

            if (taxonomy_exists($sample['taxonomy'])) {
                wp_set_object_terms($post_id, array($sample['term']), $sample['taxonomy'], false);
            }
        }

        update_option($option_key, $seed_version, false);
    }
}

add_action('init', function () {
    platform_submissions_seed_taxonomies(false);
    platform_submissions_seed_sample_posts(false);
}, 30);

if (!function_exists('platform_submissions_register_meta')) {
    function platform_submissions_register_meta() {
        $post_types = array('post', 'annuaire', 'classified_ad', 'tender_notice', 'job_offer');
        $meta_keys = array(
            'auth_user_id' => 'string',
            'contact_email' => 'string',
            'contact_phone' => 'string',
            'contact_phone_country' => 'string',
            'company_name' => 'string',
            'website' => 'string',
            'submission_source' => 'string',
            'featured_image_url' => 'string',
            'location' => 'string',
            'price' => 'string',
            'currency' => 'string',
            'budget' => 'string',
            'deadline' => 'string',
            'need_by' => 'string',
            'experience_years' => 'string',
            'skills' => 'string',
            'details_pdf_url' => 'string',
            'details_pdf_name' => 'string',
            'payment_status' => 'string',
            'stripe_checkout_session_id' => 'string',
            'payment_paid_at' => 'string',
            'listing_expires_at' => 'string',
            'listing_expires_at_ts' => 'string',
            'scheduled_publish_at' => 'string',
            'scheduled_publish_at_ts' => 'string',
            'boost_expires_at' => 'string',
            'boost_expires_at_ts' => 'string',
            'pricing_code' => 'string',
            'woo_order_id' => 'string',
            'platform_news_is_paid' => 'boolean',
            'platform_article_minimum_plan' => 'string',
            'platform_article_preview_paragraphs' => 'integer',
            'platform_article_preview_spaces' => 'integer',
        );

        foreach ($post_types as $post_type) {
            foreach ($meta_keys as $meta_key => $type) {
                register_post_meta($post_type, $meta_key, array(
                    'type' => $type,
                    'single' => true,
                    'show_in_rest' => true,
                    'auth_callback' => '__return_true',
                ));
            }
        }

        register_post_meta('classified_ad', 'gallery_images', array(
            'type' => 'array',
            'single' => true,
            'show_in_rest' => true,
            'auth_callback' => '__return_true',
        ));

        register_post_meta('classified_ad', 'classified_media_descriptors', array(
            'type' => 'array',
            'single' => true,
            'show_in_rest' => false,
            'auth_callback' => '__return_true',
        ));

        register_post_meta('annuaire', 'directory_featured', array(
            'type' => 'boolean',
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => 'rest_sanitize_boolean',
            'auth_callback' => '__return_true',
        ));

        register_meta('user', 'platform_identity', array(
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'auth_callback' => '__return_true',
        ));

        foreach (platform_submissions_sortable_taxonomies() as $taxonomy) {
            register_term_meta($taxonomy, 'platform_term_order', array(
                'type' => 'integer',
                'single' => true,
                'show_in_rest' => true,
                'sanitize_callback' => 'absint',
                'auth_callback' => '__return_true',
            ));
        }
    }
}

add_action('init', 'platform_submissions_register_meta');

if (!function_exists('platform_submissions_render_term_order_add_field')) {
    function platform_submissions_render_term_order_add_field($taxonomy) {
        if (!in_array($taxonomy, platform_submissions_sortable_taxonomies(), true)) {
            return;
        }
        ?>
        <div class="form-field term-order-wrap">
            <label for="platform-term-order">Ordre d'affichage</label>
            <input type="number" min="0" step="1" name="platform_term_order" id="platform-term-order" value="0" />
            <p>Les plus petits nombres apparaissent en premier.</p>
        </div>
        <?php
    }
}

if (!function_exists('platform_submissions_render_term_order_edit_field')) {
    function platform_submissions_render_term_order_edit_field($term) {
        if (!$term instanceof WP_Term || !in_array($term->taxonomy, platform_submissions_sortable_taxonomies(), true)) {
            return;
        }

        $term_order = absint(get_term_meta($term->term_id, 'platform_term_order', true));
        ?>
        <tr class="form-field term-order-wrap">
            <th scope="row"><label for="platform-term-order">Ordre d'affichage</label></th>
            <td>
                <input type="number" min="0" step="1" name="platform_term_order" id="platform-term-order" value="<?php echo esc_attr((string) $term_order); ?>" />
                <p class="description">Les plus petits nombres apparaissent en premier.</p>
            </td>
        </tr>
        <?php
    }
}

if (!function_exists('platform_submissions_save_term_order')) {
    function platform_submissions_save_term_order($term_id) {
        $term_id = absint($term_id);
        if ($term_id <= 0) {
            return;
        }

        if (!isset($_POST['platform_term_order'])) {
            return;
        }

        update_term_meta($term_id, 'platform_term_order', absint($_POST['platform_term_order']));
    }
}

if (!function_exists('platform_submissions_register_taxonomy_order_admin')) {
    function platform_submissions_register_taxonomy_order_admin() {
        foreach (platform_submissions_sortable_taxonomies() as $taxonomy) {
            add_action("{$taxonomy}_add_form_fields", function () use ($taxonomy) {
                platform_submissions_render_term_order_add_field($taxonomy);
            });
            add_action("{$taxonomy}_edit_form_fields", 'platform_submissions_render_term_order_edit_field');
            add_action("created_{$taxonomy}", 'platform_submissions_save_term_order');
            add_action("edited_{$taxonomy}", 'platform_submissions_save_term_order');

            add_filter("manage_edit-{$taxonomy}_columns", function ($columns) {
                $columns['platform_term_order'] = 'Ordre';
                return $columns;
            });

            add_filter("manage_{$taxonomy}_custom_column", function ($content, $column_name, $term_id) {
                if ($column_name !== 'platform_term_order') {
                    return $content;
                }

                return (string) absint(get_term_meta($term_id, 'platform_term_order', true));
            }, 10, 3);
        }

        add_action('classified_category_add_form_fields', 'platform_submissions_render_classified_category_product_tags_add_field');
        add_action('classified_category_edit_form_fields', 'platform_submissions_render_classified_category_product_tags_edit_field');
        add_action('created_classified_category', 'platform_submissions_save_classified_category_product_tags');
        add_action('edited_classified_category', 'platform_submissions_save_classified_category_product_tags');

        add_filter('manage_edit-classified_category_columns', function ($columns) {
            $columns['platform_classified_product_tags'] = 'Tags produit';
            return $columns;
        });

        add_filter('manage_classified_category_custom_column', function ($content, $column_name, $term_id) {
            if ($column_name !== 'platform_classified_product_tags') {
                return $content;
            }

            $tag_ids = platform_submissions_get_allowed_classified_product_tag_ids_for_category($term_id);
            if (empty($tag_ids)) {
                return 'Aucun';
            }

            $terms = get_terms(array(
                'taxonomy' => 'classified_product_tag',
                'hide_empty' => false,
                'include' => $tag_ids,
            ));

            if (is_wp_error($terms) || !is_array($terms) || empty($terms)) {
                return 'Aucun';
            }

            return implode(', ', array_map(function ($term) {
                return (string) $term->name;
            }, $terms));
        }, 10, 3);
    }
}

add_action('admin_init', 'platform_submissions_register_taxonomy_order_admin');

if (!function_exists('platform_submissions_admin_meta_fields')) {
    function platform_submissions_admin_meta_fields($post_type) {
        $shared_fields = array(
            'location' => array(
                'label' => 'Lieu',
                'type' => 'text',
                'section' => 'publication',
            ),
            'contact_phone' => array(
                'label' => 'Telephone',
                'type' => 'text',
                'section' => 'contact',
            ),
            'contact_phone_country' => array(
                'label' => 'Code pays telephone',
                'type' => 'text',
                'section' => 'contact',
            ),
            'contact_email' => array(
                'label' => 'Email de contact',
                'type' => 'email',
                'section' => 'contact',
            ),
            'company_name' => array(
                'label' => 'Entreprise / organisation',
                'type' => 'text',
                'section' => 'contact',
            ),
            'website' => array(
                'label' => 'Site web',
                'type' => 'url',
                'section' => 'contact',
            ),
            'submission_source' => array(
                'label' => 'Source de soumission',
                'type' => 'text',
                'readonly' => true,
                'section' => 'publication',
            ),
            'payment_status' => array(
                'label' => 'Statut de paiement',
                'type' => 'text',
                'readonly' => true,
                'section' => 'billing',
            ),
            'listing_expires_at' => array(
                'label' => 'Expire le',
                'type' => 'text',
                'readonly' => true,
                'section' => 'visibility',
            ),
            'boost_expires_at' => array(
                'label' => 'Boost actif jusqu au',
                'type' => 'text',
                'readonly' => true,
                'section' => 'visibility',
            ),
        );

        if ($post_type === 'classified_ad') {
            return array_merge($shared_fields, array(
                'price' => array(
                    'label' => 'Prix',
                    'type' => 'text',
                    'section' => 'billing',
                ),
                'currency' => array(
                    'label' => 'Devise',
                    'type' => 'text',
                    'section' => 'billing',
                ),
            ));
        }

        if ($post_type === 'job_offer') {
            return array_merge($shared_fields, array(
                'experience_years' => array(
                    'label' => 'Experience requise',
                    'type' => 'text',
                    'section' => 'publication',
                ),
                'need_by' => array(
                    'label' => 'Besoin avant le',
                    'type' => 'text',
                    'section' => 'publication',
                ),
                'skills' => array(
                    'label' => 'Competences',
                    'type' => 'text',
                    'section' => 'publication',
                ),
                'deadline' => array(
                    'label' => 'Date limite',
                    'type' => 'text',
                    'section' => 'publication',
                ),
            ));
        }

        if ($post_type === 'tender_notice') {
            return array_merge($shared_fields, array(
                'budget' => array(
                    'label' => 'Budget',
                    'type' => 'text',
                    'section' => 'billing',
                ),
                'currency' => array(
                    'label' => 'Devise',
                    'type' => 'text',
                    'section' => 'billing',
                ),
                'deadline' => array(
                    'label' => 'Date limite',
                    'type' => 'text',
                    'section' => 'publication',
                ),
                'details_pdf_url' => array(
                    'label' => 'PDF de details',
                    'type' => 'url',
                    'section' => 'publication',
                ),
                'details_pdf_name' => array(
                    'label' => 'Nom du PDF',
                    'type' => 'text',
                    'section' => 'publication',
                ),
            ));
        }

        if ($post_type === 'post') {
            return array(
                'submission_source' => array(
                    'label' => 'Source de soumission',
                    'type' => 'text',
                    'readonly' => true,
                    'section' => 'publication',
                ),
                'payment_status' => array(
                    'label' => 'Statut de paiement',
                    'type' => 'text',
                    'readonly' => true,
                    'section' => 'billing',
                ),
                'listing_expires_at' => array(
                    'label' => 'Expire le',
                    'type' => 'text',
                    'readonly' => true,
                    'section' => 'visibility',
                ),
            );
        }

        if ($post_type === 'annuaire') {
            $address_field = $shared_fields['location'];
            $address_field['label'] = 'Adresse ou quartier (facultatif)';
            $address_field['description'] = 'La ville et la région se choisissent dans le bloc « Villes et régions » ci-dessous.';

            return array(
                'location' => $address_field,
                'contact_phone' => $shared_fields['contact_phone'],
                'contact_email' => $shared_fields['contact_email'],
                'website' => $shared_fields['website'],
                'directory_featured' => array(
                    'label' => 'Mettre en avant',
                    'type' => 'checkbox',
                    'section' => 'visibility',
                    'description' => 'Affiche cette fiche dans la zone mise en avant de l’annuaire.',
                ),
            );
        }

        return array();
    }
}

if (!function_exists('platform_submissions_admin_meta_sections')) {
    function platform_submissions_admin_meta_sections() {
        return array(
            'publication' => 'Publication',
            'contact' => 'Contact',
            'billing' => 'Tarification',
            'visibility' => 'Visibilite',
        );
    }
}

if (!function_exists('platform_submissions_view_count_meta_key')) {
    function platform_submissions_view_count_meta_key() {
        return 'platform_view_count';
    }
}

if (!function_exists('platform_submissions_get_view_count')) {
    function platform_submissions_get_view_count($post_id) {
        return absint(get_post_meta($post_id, platform_submissions_view_count_meta_key(), true));
    }
}

if (!function_exists('platform_submissions_increment_view_count')) {
    function platform_submissions_increment_view_count($post_id) {
        global $wpdb;

        $post_id = absint($post_id);
        if ($post_id <= 0) {
            return false;
        }

        $updated = $wpdb->query($wpdb->prepare(
            "UPDATE {$wpdb->postmeta} SET meta_value = meta_value + 1 WHERE post_id = %d AND meta_key = %s",
            $post_id,
            platform_submissions_view_count_meta_key()
        ));

        if (!$updated) {
            $added = add_post_meta($post_id, platform_submissions_view_count_meta_key(), 1, true);
            if ($added) {
                $updated = 1;
            } else {
                $updated = $wpdb->query($wpdb->prepare(
                    "UPDATE {$wpdb->postmeta} SET meta_value = meta_value + 1 WHERE post_id = %d AND meta_key = %s",
                    $post_id,
                    platform_submissions_view_count_meta_key()
                ));
            }
        }

        wp_cache_delete($post_id, 'post_meta');
        return $updated !== false;
    }
}

if (!function_exists('platform_submissions_get_admin_list_columns')) {
    function platform_submissions_get_admin_list_columns($post_type) {
        $base = array(
            'platform_status' => 'Statut 2424',
            'platform_contact' => 'Contact / lieu',
            'platform_visibility' => 'Visibilite',
            'platform_views' => 'Vues',
        );

        if ($post_type === 'classified_ad') {
            return array_merge(
                array('cb' => '<input type="checkbox" />', 'title' => 'Annonce', 'taxonomy-classified_category' => 'Categorie'),
                array('platform_price' => 'Prix'),
                $base,
                array('date' => 'Date')
            );
        }

        if ($post_type === 'job_offer') {
            return array_merge(
                array('cb' => '<input type="checkbox" />', 'title' => "Offre d'emploi", 'taxonomy-job_category' => 'Categorie'),
                array('platform_deadline' => 'Deadline'),
                $base,
                array('date' => 'Date')
            );
        }

        if ($post_type === 'tender_notice') {
            return array_merge(
                array('cb' => '<input type="checkbox" />', 'title' => "Appel d'offre", 'taxonomy-tender_category' => 'Categorie'),
                array('platform_budget' => 'Budget', 'platform_deadline' => 'Deadline'),
                $base,
                array('date' => 'Date')
            );
        }

        if ($post_type === 'post') {
            return array_merge(
                array('cb' => '<input type="checkbox" />', 'title' => 'Article'),
                array(
                    'platform_status' => $base['platform_status'],
                    'platform_visibility' => $base['platform_visibility'],
                    'platform_views' => $base['platform_views'],
                ),
                array('date' => 'Date')
            );
        }

        if ($post_type === 'annuaire') {
            return array_merge(
                array('cb' => '<input type="checkbox" />', 'title' => 'Entree annuaire', 'taxonomy-directory_category' => 'Categorie', 'taxonomy-directory_location' => 'Localisation'),
                array('platform_directory_featured' => 'Mise en avant'),
                $base,
                array('date' => 'Date')
            );
        }

        return array();
    }
}

if (!function_exists('platform_submissions_render_admin_status_badge')) {
    function platform_submissions_render_admin_status_badge($label, $background, $text) {
        return sprintf(
            '<span style="display:inline-flex;align-items:center;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:600;background:%1$s;color:%2$s;">%3$s</span>',
            esc_attr($background),
            esc_attr($text),
            esc_html($label)
        );
    }
}

if (!function_exists('platform_submissions_register_admin_list_table_columns')) {
    function platform_submissions_register_admin_list_table_columns() {
        $post_types = array('classified_ad', 'job_offer', 'tender_notice', 'post', 'annuaire');
        foreach ($post_types as $post_type) {
            add_filter("manage_edit-{$post_type}_columns", function () use ($post_type) {
                return platform_submissions_get_admin_list_columns($post_type);
            });

            add_action("manage_{$post_type}_posts_custom_column", function ($column, $post_id) use ($post_type) {
                $location = sanitize_text_field((string) get_post_meta($post_id, 'location', true));
                $phone = sanitize_text_field((string) get_post_meta($post_id, 'contact_phone', true));
                $email = sanitize_email((string) get_post_meta($post_id, 'contact_email', true));
                $payment_status = sanitize_key((string) get_post_meta($post_id, 'payment_status', true));
                $submission_source = sanitize_key((string) get_post_meta($post_id, 'submission_source', true));
                $expires_at = sanitize_text_field((string) get_post_meta($post_id, 'listing_expires_at', true));
                $boost_expires_at = sanitize_text_field((string) get_post_meta($post_id, 'boost_expires_at', true));
                $moderation_status = sanitize_key((string) get_post_meta($post_id, 'platform_moderation_status', true));
                $is_expired = platform_submissions_is_content_expired($post_id);
                $is_boost_active = platform_submissions_is_boost_active($post_id);

                if ($column === 'platform_price') {
                    $price = sanitize_text_field((string) get_post_meta($post_id, 'price', true));
                    echo $price !== '' ? esc_html($price) : '<span style="color:#9ca3af;">-</span>';
                    return;
                }

                if ($column === 'platform_budget') {
                    $budget = sanitize_text_field((string) get_post_meta($post_id, 'budget', true));
                    echo $budget !== '' ? esc_html($budget) : '<span style="color:#9ca3af;">-</span>';
                    return;
                }

                if ($column === 'platform_deadline') {
                    $deadline = sanitize_text_field((string) get_post_meta($post_id, 'deadline', true));
                    echo $deadline !== '' ? esc_html($deadline) : '<span style="color:#9ca3af;">-</span>';
                    return;
                }

                if ($column === 'platform_directory_featured') {
                    $is_featured = (bool) get_post_meta($post_id, 'directory_featured', true);
                    echo $is_featured
                        ? platform_submissions_render_admin_status_badge('Mis en avant', '#fff1f2', '#be123c')
                        : '<span style="color:#9ca3af;">-</span>';
                    return;
                }

                if ($column === 'platform_views') {
                    echo esc_html((string) platform_submissions_get_view_count($post_id));
                    return;
                }

                if ($column === 'platform_contact') {
                    $parts = array();
                    if ($location !== '') {
                        $parts[] = '<strong>Lieu:</strong> ' . esc_html($location);
                    }
                    if ($phone !== '') {
                        $parts[] = '<strong>Tel:</strong> ' . esc_html($phone);
                    }
                    if ($email !== '') {
                        $parts[] = '<strong>Email:</strong> ' . esc_html($email);
                    }
                    echo !empty($parts) ? implode('<br />', $parts) : '<span style="color:#9ca3af;">-</span>';
                    return;
                }

                if ($column === 'platform_status') {
                    $badges = array();
                    $post_status = get_post_status($post_id);
                    $is_admin_created = $submission_source !== 'next-frontend';

                    // Les contenus créés depuis WordPress ne passent pas par le tunnel de paiement.
                    if ($post_type !== 'annuaire' && !$is_admin_created) {
                        if ($payment_status === 'paid') {
                            $badges[] = platform_submissions_render_admin_status_badge('Payé', '#ecfdf3', '#027a48');
                        } else {
                            $badges[] = platform_submissions_render_admin_status_badge('Non payé', '#fef3f2', '#b42318');
                        }
                    }

                    if ($is_expired) {
                        $badges[] = platform_submissions_render_admin_status_badge('Expiré', '#fff7ed', '#c2410c');
                    } elseif ($post_status === 'publish') {
                        $badges[] = platform_submissions_render_admin_status_badge('Publié', '#eff6ff', '#1d4ed8');
                    } elseif ($post_status === 'pending') {
                        $badges[] = platform_submissions_render_admin_status_badge('En attente', '#f5f3ff', '#6d28d9');
                    } elseif ($post_status === 'draft') {
                        $badges[] = platform_submissions_render_admin_status_badge('Brouillon', '#f3f4f6', '#374151');
                    }

                    if ($is_admin_created) {
                        $badges[] = platform_submissions_render_admin_status_badge('Admin WP', '#111827', '#ffffff');
                    }

                    if ($moderation_status === 'flagged') {
                        $badges[] = platform_submissions_render_admin_status_badge('Signale', '#fff7ed', '#9a3412');
                    }

                    echo implode(' ', $badges);
                    return;
                }

                if ($column === 'platform_visibility') {
                    if ($post_type === 'annuaire') {
                        echo '<span style="color:#9ca3af;">-</span>';
                        return;
                    }

                    $rows = array();
                    if ($expires_at !== '') {
                        $rows[] = '<strong>Expire:</strong> ' . esc_html($expires_at);
                    }
                    if ($boost_expires_at !== '') {
                        $rows[] = '<strong>Boost:</strong> ' . esc_html($boost_expires_at);
                    }
                    if ($is_boost_active) {
                        $rows[] = platform_submissions_render_admin_status_badge('Boost actif', '#fff1f2', '#be123c');
                    }

                    echo !empty($rows) ? implode('<br />', $rows) : '<span style="color:#9ca3af;">-</span>';
                    return;
                }
            }, 10, 2);
        }
    }
}

add_action('admin_init', 'platform_submissions_register_admin_list_table_columns');

if (!function_exists('platform_submissions_register_article_statistics_metabox')) {
    function platform_submissions_register_article_statistics_metabox() {
        add_meta_box(
            'platform-submissions-article-statistics',
            'Statistiques article',
            'platform_submissions_render_article_statistics_metabox',
            'post',
            'side',
            'default'
        );
    }
}

add_action('add_meta_boxes_post', 'platform_submissions_register_article_statistics_metabox');

if (!function_exists('platform_submissions_register_article_access_metabox')) {
    function platform_submissions_register_article_access_metabox() {
        add_meta_box(
            'platform-submissions-article-access',
            'Accès article',
            'platform_submissions_render_article_access_metabox',
            'post',
            'side',
            'high'
        );
    }
}

add_action('add_meta_boxes_post', 'platform_submissions_register_article_access_metabox');

if (!function_exists('platform_submissions_render_article_access_metabox')) {
    function platform_submissions_render_article_access_metabox($post) {
        $is_paid = platform_submissions_is_paid_news_post($post->ID);
        $minimum_plan = platform_submissions_get_news_article_minimum_plan($post->ID);
        $preview_spaces = absint(get_post_meta($post->ID, 'platform_article_preview_spaces', true));
        $preview_spaces = max(1, min(10000, $preview_spaces ?: 115));

        wp_nonce_field('platform_submissions_article_access', 'platform_submissions_article_access_nonce');
        ?>
        <p style="margin-top:0;">Choisissez si cet article est réservé aux abonnés et configurez son aperçu gratuit.</p>
        <p>
            <label style="display:flex;align-items:center;gap:8px;font-weight:700;">
                <input type="checkbox" id="platform-article-is-paid" name="platform_article_access[is_paid]" value="1" <?php checked($is_paid); ?> />
                Article payant
            </label>
        </p>
        <div id="platform-article-paid-options" style="<?php echo $is_paid ? '' : 'display:none;'; ?>border-top:1px solid #dcdcde;padding-top:12px;">
            <p>
                <label for="platform-article-minimum-plan"><strong>Type de compte autorisé</strong></label><br />
                <select id="platform-article-minimum-plan" name="platform_article_access[minimum_plan]" style="width:100%;margin-top:6px;">
                    <option value="essentiel" <?php selected($minimum_plan, 'essentiel'); ?>>Essentiel et Business</option>
                    <option value="business" <?php selected($minimum_plan, 'business'); ?>>Business uniquement</option>
                </select>
            </p>
            <p style="margin-bottom:0;">
                <label for="platform-article-preview-spaces"><strong>Nombre d'espaces visibles</strong></label><br />
                <input type="number" id="platform-article-preview-spaces" name="platform_article_access[preview_spaces]" value="<?php echo esc_attr((string) $preview_spaces); ?>" min="1" max="10000" step="1" style="width:100%;margin-top:6px;" />
                <span class="description">Le contenu reste visible jusqu'à cet espace entre deux mots avant l’incitation à s’abonner.</span>
            </p>
        </div>
        <script>
        (function () {
            var checkbox = document.getElementById('platform-article-is-paid');
            var options = document.getElementById('platform-article-paid-options');
            if (!checkbox || !options) return;
            checkbox.addEventListener('change', function () {
                options.style.display = checkbox.checked ? '' : 'none';
            });
        }());
        </script>
        <?php
    }
}

if (!function_exists('platform_submissions_save_article_access_metabox')) {
    function platform_submissions_save_article_access_metabox($post_id) {
        if (get_post_type($post_id) !== 'post' || !isset($_POST['platform_submissions_article_access_nonce'])) {
            return;
        }

        if (!wp_verify_nonce((string) $_POST['platform_submissions_article_access_nonce'], 'platform_submissions_article_access')
            || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
            || !current_user_can('edit_post', $post_id)) {
            return;
        }

        $access = isset($_POST['platform_article_access']) && is_array($_POST['platform_article_access'])
            ? wp_unslash($_POST['platform_article_access'])
            : array();
        $is_paid = isset($access['is_paid']) && (string) $access['is_paid'] === '1';

        if (!$is_paid) {
            delete_post_meta($post_id, 'platform_news_is_paid');
            delete_post_meta($post_id, 'platform_article_minimum_plan');
            delete_post_meta($post_id, 'platform_article_preview_paragraphs');
            delete_post_meta($post_id, 'platform_article_preview_spaces');
            platform_submissions_invalidate_news_graphql_snapshot($post_id);
            return;
        }

        $minimum_plan = function_exists('platform_2424_sanitize_article_minimum_plan')
            ? platform_2424_sanitize_article_minimum_plan($access['minimum_plan'] ?? 'essentiel')
            : sanitize_key((string) ($access['minimum_plan'] ?? 'essentiel'));
        $minimum_plan = in_array($minimum_plan, array('essentiel', 'business'), true) ? $minimum_plan : 'essentiel';
        $preview_spaces = max(1, min(10000, absint($access['preview_spaces'] ?? 115)));

        update_post_meta($post_id, 'platform_news_is_paid', '1');
        update_post_meta($post_id, 'platform_article_minimum_plan', $minimum_plan);
        update_post_meta($post_id, 'platform_article_preview_spaces', $preview_spaces);
        // clean_post_cache runs before these access metas are written, so clear
        // the editorial snapshot again after the saved values are final.
        platform_submissions_invalidate_news_graphql_snapshot($post_id);
    }
}

add_action('save_post', 'platform_submissions_save_article_access_metabox', 20);

if (!function_exists('platform_submissions_render_article_statistics_metabox')) {
    function platform_submissions_render_article_statistics_metabox($post) {
        $view_count = platform_submissions_get_view_count($post->ID);
        ?>
        <p style="margin:0;font-size:24px;font-weight:700;line-height:1.2;">
            <?php echo esc_html(number_format_i18n($view_count)); ?>
        </p>
        <p style="margin:6px 0 0;color:#646970;">vue<?php echo $view_count > 1 ? 's' : ''; ?></p>
        <?php
    }
}

if (!function_exists('platform_submissions_get_admin_media_urls')) {
    function platform_submissions_get_admin_media_urls($post_id, $post_type) {
        $thumbnail = platform_submissions_rewrite_media_url((string) get_the_post_thumbnail_url($post_id, 'medium'));
        $featured_image_url = platform_submissions_rewrite_media_url((string) get_post_meta($post_id, 'featured_image_url', true));
        $gallery_images = get_post_meta($post_id, 'gallery_images', true);
        if (!is_array($gallery_images)) {
            $gallery_images = array();
        }

        $images = array_values(array_filter(array_map('platform_submissions_rewrite_media_url', $gallery_images)));
        if ($thumbnail) {
            array_unshift($images, $thumbnail);
        } elseif ($featured_image_url) {
            array_unshift($images, $featured_image_url);
        }

        $images = array_values(array_unique($images));
        return array_slice($images, 0, $post_type === 'classified_ad' ? platform_submissions_get_classified_gallery_limit_max() : 10);
    }
}

if (!function_exists('platform_submissions_render_admin_meta_box')) {
    function platform_submissions_render_admin_meta_box($post) {
        wp_nonce_field('platform_submissions_admin_meta_box', 'platform_submissions_admin_meta_box_nonce');
        $fields = platform_submissions_admin_meta_fields($post->post_type);
        if (empty($fields)) {
            echo '<p>Aucune donnee complementaire pour ce type de contenu.</p>';
            return;
        }

        if ($post->post_type === 'annuaire') {
            echo '<div style="margin:0 0 18px;padding:14px 16px;border:1px solid #dcdcde;border-left:4px solid #cc202a;background:#fff;">';
            echo '<strong style="display:block;margin-bottom:6px;">Créer une fiche annuaire</strong>';
            echo '<span style="color:#50575e;">Renseignez le nom et la présentation dans les champs principaux, puis choisissez une catégorie, une ville ou région, vos coordonnées et une image. Publiez uniquement lorsque la fiche est complète.</span>';
            echo '</div>';
        }

        $sections = platform_submissions_admin_meta_sections();
        $grouped_fields = array();
        foreach ($fields as $meta_key => $field) {
            $section = (string) ($field['section'] ?? 'publication');
            if (!isset($grouped_fields[$section])) {
                $grouped_fields[$section] = array();
            }
            $grouped_fields[$section][$meta_key] = $field;
        }

        foreach ($sections as $section_key => $section_label) {
            if (empty($grouped_fields[$section_key])) {
                continue;
            }

            echo '<div style="margin-bottom:18px;">';
            echo '<h3 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#cc202a;">' . esc_html($section_label) . '</h3>';
            echo '<div class="platform-2424-meta-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px 16px;">';

            foreach ($grouped_fields[$section_key] as $meta_key => $field) {
                $label = esc_html((string) ($field['label'] ?? $meta_key));
                $type = (string) ($field['type'] ?? 'text');
                $readonly = !empty($field['readonly']);
                $value = get_post_meta($post->ID, $meta_key, true);
                if (is_array($value)) {
                    $value = implode(', ', array_map('strval', $value));
                }
                $value = (string) $value;

                echo '<label style="display:flex;flex-direction:column;gap:6px;">';
                echo '<span style="font-weight:600;">' . $label . '</span>';
                if ($type === 'checkbox') {
                    printf(
                        '<input type="checkbox" name="platform_2424_meta[%1$s]" value="1" %2$s %3$s />',
                        esc_attr($meta_key),
                        checked($value === '1' || $value === 'true', true, false),
                        $readonly ? 'disabled="disabled"' : ''
                    );
                } elseif ($type === 'select') {
                    $options = isset($field['options']) && is_array($field['options']) ? $field['options'] : array();
                    printf(
                        '<select name="platform_2424_meta[%1$s]" %2$s style="width:100%%;">',
                        esc_attr($meta_key),
                        $readonly ? 'disabled="disabled"' : ''
                    );
                    foreach ($options as $option_value => $option_label) {
                        printf(
                            '<option value="%1$s" %2$s>%3$s</option>',
                            esc_attr((string) $option_value),
                            selected($value, (string) $option_value, false),
                            esc_html((string) $option_label)
                        );
                    }
                    echo '</select>';
                } else {
                    printf(
                        '<input type="%1$s" name="platform_2424_meta[%2$s]" value="%3$s" %4$s style="width:100%%;" />',
                        esc_attr($type),
                        esc_attr($meta_key),
                        esc_attr($value),
                        $readonly ? 'readonly="readonly"' : ''
                    );
                }
                if (!empty($field['description'])) {
                    echo '<span class="description">' . esc_html((string) $field['description']) . '</span>';
                }
                echo '</label>';
            }

            echo '</div>';
            echo '</div>';
        }

        $media_urls = platform_submissions_get_admin_media_urls($post->ID, $post->post_type);
        if (!empty($media_urls)) {
            echo '<div style="margin-top:8px;">';
            echo '<h3 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#cc202a;">Medias</h3>';
            echo '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;">';
            foreach ($media_urls as $index => $url) {
                $safe_url = esc_url($url);
                echo '<a href="' . $safe_url . '" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;color:inherit;">';
                echo '<div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#fafafa;">';
                echo '<img src="' . $safe_url . '" alt="" style="display:block;width:100%;height:120px;object-fit:cover;" />';
                echo '<div style="padding:8px 10px;font-size:12px;color:#555;">Image ' . esc_html((string) ($index + 1)) . '</div>';
                echo '</div>';
                echo '</a>';
            }
            echo '</div>';
            echo '</div>';
        }
    }
}

if (!function_exists('platform_submissions_register_admin_meta_boxes')) {
    function platform_submissions_register_admin_meta_boxes() {
        // User listings are managed from the frontend. Their platform metadata must
        // remain read-only to WordPress administrators during moderation.
        $post_types = array('post', 'annuaire');
        foreach ($post_types as $post_type) {
            add_meta_box(
                'platform-2424-admin-meta',
                $post_type === 'annuaire' ? 'Coordonnées et visibilité' : 'Donnees 2424',
                'platform_submissions_render_admin_meta_box',
                $post_type,
                'normal',
                'high'
            );
        }
    }
}

add_action('add_meta_boxes', 'platform_submissions_register_admin_meta_boxes');

if (!function_exists('platform_submissions_organize_directory_editor_meta_boxes')) {
    /**
     * Keep the complete directory workflow in the main editing column instead
     * of splitting essential taxonomy and image controls across the sidebar.
     */
    function platform_submissions_organize_directory_editor_meta_boxes() {
        remove_meta_box('directory_categorydiv', 'annuaire', 'side');
        remove_meta_box('directory_locationdiv', 'annuaire', 'side');
        remove_meta_box('postimagediv', 'annuaire', 'side');

        add_meta_box(
            'directory_categorydiv',
            'Catégories',
            'post_categories_meta_box',
            'annuaire',
            'normal',
            'high',
            array('taxonomy' => 'directory_category')
        );
        add_meta_box(
            'directory_locationdiv',
            'Villes et régions',
            'post_categories_meta_box',
            'annuaire',
            'normal',
            'high',
            array('taxonomy' => 'directory_location')
        );
        add_meta_box(
            'postimagediv',
            'Logo ou photo principale',
            'post_thumbnail_meta_box',
            'annuaire',
            'normal',
            'high'
        );
    }
}

add_action('add_meta_boxes_annuaire', 'platform_submissions_organize_directory_editor_meta_boxes', 99);

if (!function_exists('platform_submissions_organize_directory_editor_meta_boxes_after_core')) {
    function platform_submissions_organize_directory_editor_meta_boxes_after_core($post_type) {
        if ($post_type === 'annuaire') {
            platform_submissions_organize_directory_editor_meta_boxes();
        }
    }
}

// Core registers taxonomy boxes on the generic hook, after the post-type hook.
add_action('add_meta_boxes', 'platform_submissions_organize_directory_editor_meta_boxes_after_core', 99, 1);

if (!function_exists('platform_submissions_moderation_post_types')) {
    function platform_submissions_moderation_post_types() {
        return array('classified_ad', 'job_offer', 'tender_notice');
    }
}

if (!function_exists('platform_submissions_get_moderation_workspace_path')) {
    function platform_submissions_get_moderation_workspace_path($post) {
        if (!$post instanceof WP_Post) {
            return '/profil';
        }

        $base_paths = array(
            'classified_ad' => '/profil/petites-annonces/',
            'job_offer' => '/profil/offres-emploi/',
            'tender_notice' => '/profil/appels-offres/',
        );
        $base_path = isset($base_paths[$post->post_type]) ? $base_paths[$post->post_type] : '/profil';

        return $base_path === '/profil' ? $base_path : $base_path . (int) $post->ID;
    }
}

if (!function_exists('platform_submissions_get_moderation_content_label')) {
    function platform_submissions_get_moderation_content_label($post_type) {
        $labels = array(
            'classified_ad' => 'votre petite annonce',
            'job_offer' => "votre offre d'emploi",
            'tender_notice' => "votre appel d'offres",
        );

        return isset($labels[$post_type]) ? $labels[$post_type] : 'votre publication';
    }
}

if (!function_exists('platform_submissions_register_moderation_meta_boxes')) {
    function platform_submissions_register_moderation_meta_boxes() {
        foreach (platform_submissions_moderation_post_types() as $post_type) {
            add_meta_box(
                'platform-2424-moderation',
                'Moderation 2424',
                'platform_submissions_render_moderation_meta_box',
                $post_type,
                'side',
                'high'
            );
        }
    }
}

add_action('add_meta_boxes', 'platform_submissions_register_moderation_meta_boxes');

if (!function_exists('platform_submissions_render_moderation_meta_box')) {
    function platform_submissions_render_moderation_meta_box($post) {
        if (!current_user_can('manage_options')) {
            echo '<p>Reserve aux administrateurs.</p>';
            return;
        }

        $status = sanitize_key((string) get_post_meta($post->ID, 'platform_moderation_status', true));
        $last_message = sanitize_textarea_field((string) get_post_meta($post->ID, 'platform_moderation_message', true));
        $flagged_at = sanitize_text_field((string) get_post_meta($post->ID, 'platform_moderation_flagged_at', true));
        wp_nonce_field('platform_submissions_moderation', 'platform_submissions_moderation_nonce');
        ?>
        <p style="margin-top:0;">Signalez un contenu necessitant une correction. Le proprietaire recevra le motif dans ses notifications et par email.</p>
        <?php if ($status === 'flagged') : ?>
            <p><strong style="color:#b42318;">Contenu signale</strong><?php echo $flagged_at !== '' ? ' le ' . esc_html($flagged_at) : ''; ?></p>
            <?php if ($last_message !== '') : ?>
                <p style="padding:10px;background:#fff7ed;border-left:3px solid #f97316;white-space:pre-wrap;"><?php echo esc_html($last_message); ?></p>
            <?php endif; ?>
        <?php endif; ?>
        <p>
            <label for="platform-moderation-action"><strong>Action</strong></label><br />
            <select id="platform-moderation-action" name="platform_moderation[action]" style="width:100%;margin-top:6px;">
                <option value="">Aucune action</option>
                <option value="flag">Signaler et notifier le proprietaire</option>
                <?php if ($status === 'flagged') : ?>
                    <option value="clear">Lever le signalement</option>
                <?php endif; ?>
            </select>
        </p>
        <p>
            <label for="platform-moderation-message"><strong>Commentaire pour le proprietaire</strong></label><br />
            <textarea id="platform-moderation-message" name="platform_moderation[message]" rows="6" maxlength="3000" style="width:100%;margin-top:6px;" placeholder="Expliquez clairement la correction attendue."></textarea>
        </p>
        <p class="description">Le signalement ne retire pas automatiquement le contenu de la publication. Utilisez les actions WordPress de statut si un retrait immediat est necessaire.</p>
        <?php
    }
}

if (!function_exists('platform_submissions_dispatch_moderation_notification')) {
    function platform_submissions_dispatch_moderation_notification($post, $message, $moderator) {
        if (!$post instanceof WP_Post) {
            return new WP_Error('platform_moderation_invalid_post', 'Publication introuvable.');
        }

        $owner = get_userdata((int) $post->post_author);
        if (!$owner instanceof WP_User || !is_email($owner->user_email)) {
            return new WP_Error('platform_moderation_missing_owner', 'Le proprietaire de cette publication est introuvable.');
        }

        $secret = platform_submissions_secret();
        if ($secret === '') {
            return new WP_Error('platform_moderation_missing_secret', 'Le secret des echanges internes est manquant.');
        }

        $public_site_url = function_exists('platform_2424_get_public_site_url')
            ? untrailingslashit((string) platform_2424_get_public_site_url())
            : '';
        if ($public_site_url === '') {
            return new WP_Error('platform_moderation_missing_site_url', 'L URL publique du site est manquante.');
        }

        $response = wp_remote_post($public_site_url . '/api/internal/moderation-notification', array(
            'timeout' => 10,
            'headers' => array(
                'Content-Type' => 'application/json',
                'x-2424-internal-secret' => $secret,
            ),
            'body' => wp_json_encode(array(
                'recipientEmail' => sanitize_email((string) $owner->user_email),
                'recipientName' => sanitize_text_field((string) $owner->display_name),
                'listingId' => (int) $post->ID,
                'listingTitle' => platform_submissions_decode_html_entities(get_the_title($post)),
                'listingType' => sanitize_key((string) $post->post_type),
                'listingLabel' => platform_submissions_get_moderation_content_label($post->post_type),
                'message' => $message,
                'moderatorName' => sanitize_text_field((string) $moderator),
                'href' => platform_submissions_get_moderation_workspace_path($post),
            )),
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        if ($status < 200 || $status >= 300) {
            return new WP_Error('platform_moderation_notification_failed', 'La notification n a pas pu etre envoyee.', array(
                'status' => $status,
                'body' => wp_remote_retrieve_body($response),
            ));
        }

        return true;
    }
}

if (!function_exists('platform_submissions_save_moderation_meta_box')) {
    function platform_submissions_save_moderation_meta_box($post_id) {
        if (!isset($_POST['platform_submissions_moderation_nonce']) || !in_array(get_post_type($post_id), platform_submissions_moderation_post_types(), true)) {
            return;
        }

        if (!wp_verify_nonce((string) $_POST['platform_submissions_moderation_nonce'], 'platform_submissions_moderation')
            || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
            || wp_is_post_revision($post_id)
            || !current_user_can('manage_options')) {
            return;
        }

        $moderation = isset($_POST['platform_moderation']) && is_array($_POST['platform_moderation'])
            ? wp_unslash($_POST['platform_moderation'])
            : array();
        $action = sanitize_key((string) ($moderation['action'] ?? ''));
        if ($action === '') {
            return;
        }

        $post = get_post($post_id);
        if (!$post instanceof WP_Post) {
            return;
        }

        if ($action === 'clear') {
            update_post_meta($post_id, 'platform_moderation_status', 'clear');
            update_post_meta($post_id, 'platform_moderation_cleared_at', current_time('mysql'));
            update_post_meta($post_id, 'platform_moderation_cleared_by', get_current_user_id());
            return;
        }

        if ($action !== 'flag') {
            return;
        }

        $message = sanitize_textarea_field((string) ($moderation['message'] ?? ''));
        if ($message === '') {
            set_transient('platform_moderation_notice_' . get_current_user_id(), array('type' => 'error', 'message' => 'Ajoutez un commentaire avant de signaler ce contenu.'), MINUTE_IN_SECONDS);
            return;
        }

        $moderator = wp_get_current_user();
        $moderator_name = $moderator instanceof WP_User ? (string) $moderator->display_name : 'L equipe 2424';
        $flagged_at = current_time('mysql');
        update_post_meta($post_id, 'platform_moderation_status', 'flagged');
        update_post_meta($post_id, 'platform_moderation_message', $message);
        update_post_meta($post_id, 'platform_moderation_flagged_at', $flagged_at);
        update_post_meta($post_id, 'platform_moderation_flagged_by', get_current_user_id());

        $history = get_post_meta($post_id, 'platform_moderation_history', true);
        $history = is_array($history) ? $history : array();
        $history[] = array(
            'action' => 'flagged',
            'message' => $message,
            'moderatorId' => get_current_user_id(),
            'moderatorName' => sanitize_text_field($moderator_name),
            'createdAt' => $flagged_at,
        );
        update_post_meta($post_id, 'platform_moderation_history', array_slice($history, -20));

        $result = platform_submissions_dispatch_moderation_notification($post, $message, $moderator_name);
        if (is_wp_error($result)) {
            update_post_meta($post_id, 'platform_moderation_notification_error', sanitize_text_field($result->get_error_message()));
            set_transient('platform_moderation_notice_' . get_current_user_id(), array('type' => 'warning', 'message' => 'Le contenu est signale, mais la notification n a pas pu etre envoyee.'), MINUTE_IN_SECONDS);
            return;
        }

        delete_post_meta($post_id, 'platform_moderation_notification_error');
        update_post_meta($post_id, 'platform_moderation_notified_at', $flagged_at);
        set_transient('platform_moderation_notice_' . get_current_user_id(), array('type' => 'success', 'message' => 'Le proprietaire a ete notifie par email et dans son espace.'), MINUTE_IN_SECONDS);
    }
}

add_action('save_post', 'platform_submissions_save_moderation_meta_box', 30);

if (!function_exists('platform_submissions_render_moderation_admin_notice')) {
    function platform_submissions_render_moderation_admin_notice() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $notice = get_transient('platform_moderation_notice_' . get_current_user_id());
        if (!is_array($notice)) {
            return;
        }
        delete_transient('platform_moderation_notice_' . get_current_user_id());
        $class = ($notice['type'] ?? '') === 'success' ? 'notice-success' : (($notice['type'] ?? '') === 'warning' ? 'notice-warning' : 'notice-error');
        echo '<div class="notice ' . esc_attr($class) . ' is-dismissible"><p>' . esc_html((string) ($notice['message'] ?? '')) . '</p></div>';
    }
}

add_action('admin_notices', 'platform_submissions_render_moderation_admin_notice');

if (!function_exists('platform_submissions_save_admin_meta_box')) {
    function platform_submissions_save_admin_meta_box($post_id) {
        if (!isset($_POST['platform_submissions_admin_meta_box_nonce'])) {
            return;
        }

        $nonce = (string) $_POST['platform_submissions_admin_meta_box_nonce'];
        if (!wp_verify_nonce($nonce, 'platform_submissions_admin_meta_box')) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        $post = get_post($post_id);
        if (!$post) {
            return;
        }

        $fields = platform_submissions_admin_meta_fields($post->post_type);
        if (empty($fields) || !isset($_POST['platform_2424_meta']) || !is_array($_POST['platform_2424_meta'])) {
            return;
        }

        $submitted = wp_unslash($_POST['platform_2424_meta']);
        foreach ($fields as $meta_key => $field) {
            if (!empty($field['readonly'])) {
                continue;
            }

            if (($field['type'] ?? '') === 'checkbox') {
                $value = array_key_exists($meta_key, $submitted) ? '1' : '';
            } else {
                if (!array_key_exists($meta_key, $submitted)) {
                    continue;
                }

                $raw_value = $submitted[$meta_key];
                $value = is_string($raw_value) ? trim($raw_value) : '';
            }

            if ($meta_key === 'contact_email') {
                $value = sanitize_email($value);
            } elseif ($meta_key === 'platform_article_minimum_plan') {
                $value = function_exists('platform_2424_sanitize_article_minimum_plan')
                    ? platform_2424_sanitize_article_minimum_plan($value)
                    : sanitize_key($value);
            } else {
                $value = sanitize_text_field($value);
            }

            if ($value === '') {
                delete_post_meta($post_id, $meta_key);
            } else {
                update_post_meta($post_id, $meta_key, $value);
            }
        }
    }
}

add_action('save_post', 'platform_submissions_save_admin_meta_box');

if (!function_exists('platform_submissions_is_paid_news_post')) {
    function platform_submissions_is_paid_news_post($post_id) {
        return in_array((string) get_post_meta($post_id, 'platform_news_is_paid', true), array('1', 'yes', 'true', 'on'), true);
    }
}

if (!function_exists('platform_submissions_get_news_article_minimum_plan')) {
    function platform_submissions_get_news_article_minimum_plan($post_id) {
        if (!platform_submissions_is_paid_news_post($post_id)) {
            return 'all';
        }

        $value = sanitize_key((string) get_post_meta($post_id, 'platform_article_minimum_plan', true));
        return in_array($value, array('essentiel', 'business'), true) ? $value : 'essentiel';
    }
}

if (!function_exists('platform_submissions_get_public_comment_count')) {
    function platform_submissions_get_public_comment_count($post_id) {
        $counts = get_comment_count(absint($post_id));
        return absint(isset($counts['approved']) ? $counts['approved'] : 0);
    }
}

if (!function_exists('platform_submissions_get_graphql_post_id')) {
    function platform_submissions_get_graphql_post_id($post) {
        if (is_object($post) && isset($post->databaseId)) {
            return absint($post->databaseId);
        }
        if (is_object($post) && isset($post->ID)) {
            return absint($post->ID);
        }
        if (is_array($post) && isset($post['databaseId'])) {
            return absint($post['databaseId']);
        }
        if (is_array($post) && isset($post['ID'])) {
            return absint($post['ID']);
        }

        return 0;
    }
}

if (!function_exists('platform_submissions_get_news_graphql_snapshot')) {
    function platform_submissions_get_news_graphql_snapshot($post_id) {
        static $request_cache = array();

        $post_id = absint($post_id);
        if ($post_id <= 0) {
            return array('minimumPlanRequired' => 'all', 'isPaid' => false, 'previewParagraphs' => 0, 'previewSpaces' => 0, 'commentCount' => 0, 'viewCount' => 0, 'commentsOpen' => false);
        }

        if (isset($request_cache[$post_id])) {
            return $request_cache[$post_id];
        }

        // Versioned to ignore snapshots generated before access metadata was
        // included in the article-preview contract.
        $cache_key = platform_submissions_news_graphql_snapshot_cache_key($post_id);
        $found = false;
        $cached = wp_cache_get($cache_key, 'platform_2424_editorial', false, $found);
        if ($found && is_array($cached)) {
            $request_cache[$post_id] = $cached;
            return $cached;
        }

        $is_paid = in_array((string) get_post_meta($post_id, 'platform_news_is_paid', true), array('1', 'yes', 'true', 'on'), true);
        $minimum_plan = sanitize_key((string) get_post_meta($post_id, 'platform_article_minimum_plan', true));
        $minimum_plan = $is_paid && in_array($minimum_plan, array('essentiel', 'business'), true) ? $minimum_plan : ($is_paid ? 'essentiel' : 'all');
        $preview_spaces = $is_paid ? max(1, min(10000, absint(get_post_meta($post_id, 'platform_article_preview_spaces', true)))) : 0;
        $preview_spaces = $is_paid && $preview_spaces === 0 ? 115 : $preview_spaces;
        $comment_counts = get_comment_count($post_id);

        $snapshot = array(
            'minimumPlanRequired' => $minimum_plan,
            'isPaid' => $is_paid,
            'previewParagraphs' => 0,
            'previewSpaces' => $preview_spaces,
            'commentCount' => absint(isset($comment_counts['approved']) ? $comment_counts['approved'] : 0),
            'viewCount' => absint(get_post_meta($post_id, platform_submissions_view_count_meta_key(), true)),
            'commentsOpen' => comments_open($post_id),
        );

        $request_cache[$post_id] = $snapshot;
        // Redis Object Cache rend ce cache partage entre requetes; sans Redis,
        // WordPress le garde au moins pour la duree de la requete courante.
        wp_cache_set($cache_key, $snapshot, 'platform_2424_editorial', 300);
        return $snapshot;
    }
}

if (!function_exists('platform_submissions_news_graphql_snapshot_cache_key')) {
    function platform_submissions_news_graphql_snapshot_cache_key($post_id) {
        return 'news-graphql-snapshot:v2:' . absint($post_id);
    }
}

if (!function_exists('platform_submissions_invalidate_news_graphql_snapshot')) {
    function platform_submissions_invalidate_news_graphql_snapshot($post_id) {
        $post_id = absint($post_id);
        if ($post_id <= 0 || get_post_type($post_id) !== 'post') {
            return;
        }

        wp_cache_delete(platform_submissions_news_graphql_snapshot_cache_key($post_id), 'platform_2424_editorial');
    }
}

add_action('clean_post_cache', 'platform_submissions_invalidate_news_graphql_snapshot');

function platform_submissions_invalidate_news_snapshot_on_access_meta_change($meta_id, $post_id, $meta_key) {
    static $access_meta_keys = array(
        'platform_news_is_paid',
        'platform_article_minimum_plan',
        'platform_article_preview_spaces',
    );

    if (in_array($meta_key, $access_meta_keys, true)) {
        platform_submissions_invalidate_news_graphql_snapshot($post_id);
    }
}

add_action('added_post_meta', 'platform_submissions_invalidate_news_snapshot_on_access_meta_change', 10, 3);
add_action('updated_post_meta', 'platform_submissions_invalidate_news_snapshot_on_access_meta_change', 10, 3);
add_action('deleted_post_meta', 'platform_submissions_invalidate_news_snapshot_on_access_meta_change', 10, 3);

if (!function_exists('platform_submissions_repair_legacy_article_preview_spaces')) {
    /**
     * Repairs the four editorial posts saved with the former "one paragraph"
     * value after the preview contract changed to word separators.
     */
    function platform_submissions_repair_legacy_article_preview_spaces($dry_run = false) {
        $legacy_post_ids = array(123341, 123273, 123229, 122996);
        $report = array(
            'checked' => 0,
            'updated' => 0,
            'skipped' => 0,
            'updatedIds' => array(),
        );

        foreach ($legacy_post_ids as $post_id) {
            $post = get_post($post_id);
            $report['checked']++;

            if (!$post || $post->post_type !== 'post'
                || !platform_submissions_is_paid_news_post($post_id)
                || absint(get_post_meta($post_id, 'platform_article_preview_spaces', true)) !== 1) {
                $report['skipped']++;
                continue;
            }

            if (!$dry_run) {
                update_post_meta($post_id, 'platform_article_preview_spaces', 115);
                platform_submissions_invalidate_news_graphql_snapshot($post_id);
            }

            $report['updated']++;
            $report['updatedIds'][] = $post_id;
        }

        return $report;
    }
}

add_action('comment_post', function ($comment_id) {
    $comment = get_comment($comment_id);
    if ($comment) {
        platform_submissions_invalidate_news_graphql_snapshot($comment->comment_post_ID);
    }
});
add_action('delete_comment', function ($comment_id) {
    $comment = get_comment($comment_id);
    if ($comment) {
        platform_submissions_invalidate_news_graphql_snapshot($comment->comment_post_ID);
    }
});
add_action('edit_comment', function ($comment_id) {
    $comment = get_comment($comment_id);
    if ($comment) {
        platform_submissions_invalidate_news_graphql_snapshot($comment->comment_post_ID);
    }
});
add_action('deleted_comment', function ($comment_id) {
    $comment = get_comment($comment_id);
    if ($comment) {
        platform_submissions_invalidate_news_graphql_snapshot($comment->comment_post_ID);
    }
});
add_action('transition_comment_status', function ($new_status, $old_status, $comment) {
    if ($new_status !== $old_status && $comment instanceof WP_Comment) {
        platform_submissions_invalidate_news_graphql_snapshot($comment->comment_post_ID);
    }
}, 10, 3);

if (!function_exists('platform_submissions_register_news_graphql_fields')) {
    function platform_submissions_register_news_graphql_fields() {
        if (!function_exists('register_graphql_field')) {
            return;
        }

        register_graphql_field('Post', 'minimumPlanRequired', array(
            'type' => 'String',
            'description' => 'Minimum subscription plan required to view the full article.',
            'resolve' => function ($post) {
                $snapshot = platform_submissions_get_news_graphql_snapshot(platform_submissions_get_graphql_post_id($post));
                return $snapshot['minimumPlanRequired'];
            },
        ));

        register_graphql_field('Post', 'platformIsPaid', array(
            'type' => 'Boolean',
            'description' => 'Whether the article is restricted behind a paid plan.',
            'resolve' => function ($post) {
                $snapshot = platform_submissions_get_news_graphql_snapshot(platform_submissions_get_graphql_post_id($post));
                return (bool) $snapshot['isPaid'];
            },
        ));

        register_graphql_field('Post', 'platformPreviewParagraphs', array(
            'type' => 'Int',
            'description' => 'Number of article paragraphs visible before the subscription gate.',
            'resolve' => function ($post) {
                $snapshot = platform_submissions_get_news_graphql_snapshot(platform_submissions_get_graphql_post_id($post));
                return (int) $snapshot['previewParagraphs'];
            },
        ));

        register_graphql_field('Post', 'platformPreviewSpaces', array(
            'type' => 'Int',
            'description' => 'Number of word separators visible before the subscription gate.',
            'resolve' => function ($post) {
                $snapshot = platform_submissions_get_news_graphql_snapshot(platform_submissions_get_graphql_post_id($post));
                return (int) $snapshot['previewSpaces'];
            },
        ));

        register_graphql_field('Post', 'platformCommentCount', array(
            'type' => 'Int',
            'description' => 'Approved public comment count for the article.',
            'resolve' => function ($post) {
                $snapshot = platform_submissions_get_news_graphql_snapshot(platform_submissions_get_graphql_post_id($post));
                return (int) $snapshot['commentCount'];
            },
        ));

        register_graphql_field('Post', 'platformViewCount', array(
            'type' => 'Int',
            'description' => 'Article view count tracked by the platform plugin.',
            'resolve' => function ($post) {
                $snapshot = platform_submissions_get_news_graphql_snapshot(platform_submissions_get_graphql_post_id($post));
                return (int) $snapshot['viewCount'];
            },
        ));

        register_graphql_field('Post', 'platformCommentsOpen', array(
            'type' => 'Boolean',
            'description' => 'Whether comments are open on the article.',
            'resolve' => function ($post) {
                $snapshot = platform_submissions_get_news_graphql_snapshot(platform_submissions_get_graphql_post_id($post));
                return (bool) $snapshot['commentsOpen'];
            },
        ));
    }
}

add_action('graphql_register_types', 'platform_submissions_register_news_graphql_fields');

if (!function_exists('platform_submissions_media_driver')) {
    function platform_submissions_get_classified_gallery_limit_max() {
        if (function_exists('platform_2424_get_access_matrix')) {
            $matrix = platform_2424_get_access_matrix();
            $photo_limits = isset($matrix['classifieds']['maxPhotos']) && is_array($matrix['classifieds']['maxPhotos'])
                ? $matrix['classifieds']['maxPhotos']
                : array();
            $limits = array_map('absint', $photo_limits);
            $max_limit = !empty($limits) ? max($limits) : 0;
            if ($max_limit > 0) {
                return $max_limit;
            }
        }

        return 20;
    }

    function platform_submissions_get_classified_user_photo_limit($user_id, $trusted_plan_id = '') {
        $fallback_limit = platform_submissions_get_classified_gallery_limit_max();
        $user_id = absint($user_id);

        // Internal requests originate from Next.js with a signed session. Reading
        // the matrix directly avoids loading WooCommerce subscriptions twice while
        // a classified ad is being created.
        $trusted_plan_id = sanitize_key((string) $trusted_plan_id);
        if (in_array($trusted_plan_id, array('free', 'essentiel', 'business'), true) && function_exists('platform_2424_get_access_matrix')) {
            $matrix = platform_2424_get_access_matrix();
            $photo_limit = absint($matrix['classifieds']['maxPhotos'][$trusted_plan_id] ?? 0);
            if ($photo_limit > 0) {
                return $photo_limit;
            }
        }

        if ($user_id <= 0 || !function_exists('platform_auth_get_publishing_access_status')) {
            return $fallback_limit;
        }

        $access_status = platform_auth_get_publishing_access_status(array('wpUserId' => $user_id));
        if (is_wp_error($access_status)) {
            return $fallback_limit;
        }

        $photo_limit = absint($access_status['classifieds']['maxPhotos'] ?? 0);
        return $photo_limit > 0 ? $photo_limit : $fallback_limit;
    }

    function platform_submissions_get_classified_payload_image_count($payload) {
        $image_urls = array();
        $featured_image_url = trim((string) ($payload['featuredImageUrl'] ?? ''));
        if ($featured_image_url !== '') {
            $image_urls[] = $featured_image_url;
        }

        $gallery_image_urls = isset($payload['galleryImageUrls']) && is_array($payload['galleryImageUrls'])
            ? $payload['galleryImageUrls']
            : array();
        foreach ($gallery_image_urls as $gallery_image_url) {
            $gallery_image_url = trim((string) $gallery_image_url);
            if ($gallery_image_url !== '') {
                $image_urls[] = $gallery_image_url;
            }
        }

        return count(array_unique($image_urls));
    }

    function platform_submissions_validate_classified_photo_limit($payload, $user_id) {
        $photo_limit = platform_submissions_get_classified_user_photo_limit(
            $user_id,
            sanitize_key((string) ($payload['trustedPlanId'] ?? ''))
        );
        $image_count = platform_submissions_get_classified_payload_image_count($payload);
        if ($image_count <= $photo_limit) {
            return true;
        }

        return new WP_Error(
            'platform_submissions_classified_photo_limit_exceeded',
            sprintf('Votre plan permet jusqu\'a %d photo%s par annonce.', $photo_limit, $photo_limit > 1 ? 's' : ''),
            array('status' => 422, 'maxPhotos' => $photo_limit)
        );
    }

    function platform_submissions_media_driver() {
        $driver = getenv('PLATFORM_MEDIA_DRIVER');
        $driver = is_string($driver) ? strtolower(trim($driver)) : '';
        return $driver === 'imagekit' ? 'imagekit' : 'wp';
    }
}

if (!function_exists('platform_submissions_rewrite_media_url')) {
    function platform_submissions_rewrite_media_url($url) {
        $url = esc_url_raw((string) $url);
        if ($url === '') {
            return '';
        }

        $cdn_base = getenv('CLOUDFRONT_MEDIA_BASE_URL');
        $cdn_base = is_string($cdn_base) ? trim($cdn_base) : '';
        if ($cdn_base === '') {
            return $url;
        }

        if (!preg_match('#^https?://#i', $cdn_base)) {
            $cdn_base = 'https://' . ltrim($cdn_base, '/');
        }

        $uploads = wp_upload_dir();
        $upload_base = isset($uploads['baseurl']) ? (string) $uploads['baseurl'] : '';
        if ($upload_base === '' || strpos($url, $upload_base) !== 0) {
            return $url;
        }

        return rtrim($cdn_base, '/') . substr($url, strlen($upload_base));
    }
}

if (!function_exists('platform_submissions_get_media_public_base_url')) {
    function platform_submissions_get_media_public_base_url() {
        $base_url = get_option('platform_2424_media_public_base_url', '');
        if (!is_string($base_url) || trim($base_url) === '') {
            $base_url = getenv('MEDIA_PUBLIC_BASE_URL');
        }
        if (!is_string($base_url) || trim($base_url) === '') {
            $base_url = getenv('CLOUDFRONT_MEDIA_BASE_URL');
        }

        if (!is_string($base_url)) {
            return '';
        }

        $parts = wp_parse_url(trim($base_url));
        if (!is_array($parts) || strtolower((string) ($parts['scheme'] ?? '')) !== 'https' || empty($parts['host'])) {
            return '';
        }

        $origin = 'https://' . strtolower((string) $parts['host']);
        if (!empty($parts['port'])) {
            $origin .= ':' . absint($parts['port']);
        }
        $path = trim((string) ($parts['path'] ?? ''), '/');

        return $path === '' ? $origin : $origin . '/' . $path;
    }
}

if (!function_exists('platform_submissions_is_managed_s3_key')) {
    function platform_submissions_is_managed_s3_key($key) {
        return is_string($key)
            && preg_match("#^uploads/[A-Za-z0-9!_.*'()/-]+$#", $key)
            && strpos($key, '..') === false;
    }
}

if (!function_exists('platform_submissions_get_s3_key_from_media_url')) {
    function platform_submissions_get_s3_key_from_media_url($url) {
        $url = esc_url_raw((string) $url);
        $base_url = platform_submissions_get_media_public_base_url();
        if ($url === '' || $base_url === '') {
            return '';
        }

        $base_parts = wp_parse_url($base_url);
        $url_parts = wp_parse_url($url);
        if (!is_array($base_parts) || !is_array($url_parts)
            || strtolower((string) ($base_parts['scheme'] ?? '')) !== strtolower((string) ($url_parts['scheme'] ?? ''))
            || strtolower((string) ($base_parts['host'] ?? '')) !== strtolower((string) ($url_parts['host'] ?? ''))
            || absint($base_parts['port'] ?? 443) !== absint($url_parts['port'] ?? 443)) {
            return '';
        }

        $base_path = trim((string) ($base_parts['path'] ?? ''), '/');
        $url_path = ltrim((string) ($url_parts['path'] ?? ''), '/');
        if ($base_path !== '') {
            $prefix = $base_path . '/';
            if (strpos($url_path, $prefix) !== 0) {
                return '';
            }
            $url_path = substr($url_path, strlen($prefix));
        }

        $key = rawurldecode($url_path);
        return platform_submissions_is_managed_s3_key($key) ? $key : '';
    }
}

if (!function_exists('platform_submissions_get_attachment_id_from_media_url')) {
    function platform_submissions_get_attachment_id_from_media_url($url) {
        $url = esc_url_raw((string) $url);
        if ($url === '' || !function_exists('attachment_url_to_postid')) {
            return 0;
        }
        $attachment_id = absint(attachment_url_to_postid($url));
        if ($attachment_id > 0) {
            return $attachment_id;
        }

        $cdn_base = platform_submissions_get_media_public_base_url();
        $uploads = wp_upload_dir();
        $upload_base = rtrim((string) ($uploads['baseurl'] ?? ''), '/');
        if ($cdn_base === '' || $upload_base === '' || strpos($url, rtrim($cdn_base, '/') . '/') !== 0) {
            return 0;
        }

        $local_url = $upload_base . substr($url, strlen(rtrim($cdn_base, '/')));
        return absint(attachment_url_to_postid($local_url));
    }
}

if (!function_exists('platform_submissions_get_media_descriptor')) {
    function platform_submissions_get_media_descriptor($url, $attachment_id = 0, $imagekit_file_id = '') {
        $url = esc_url_raw((string) $url);
        if ($url === '') {
            return array();
        }

        $attachment_id = absint($attachment_id);
        if ($attachment_id > 0) {
            return array('provider' => 'wordpress', 'attachmentId' => $attachment_id, 'url' => $url);
        }

        // CloudFront upload URLs are not WordPress attachments. Resolving them
        // through attachment_url_to_postid() first triggers an expensive, futile
        // database lookup for every photo in a gallery.
        $key = platform_submissions_get_s3_key_from_media_url($url);
        if ($key !== '') {
            return array('provider' => 's3', 'key' => $key, 'url' => $url);
        }

        $attachment_id = platform_submissions_get_attachment_id_from_media_url($url);
        if ($attachment_id > 0) {
            return array('provider' => 'wordpress', 'attachmentId' => $attachment_id, 'url' => $url);
        }

        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        if (strpos($host, 'imagekit.io') === false) {
            return array('provider' => 'external', 'url' => $url);
        }

        $descriptor = array('provider' => 'imagekit', 'url' => $url);
        $imagekit_file_id = sanitize_text_field((string) $imagekit_file_id);
        if ($imagekit_file_id !== '') {
            $descriptor['fileId'] = $imagekit_file_id;
        }
        return $descriptor;
    }
}

if (!function_exists('platform_submissions_normalize_media_descriptors')) {
    function platform_submissions_normalize_media_descriptors($descriptors) {
        if (!is_array($descriptors)) {
            return array();
        }

        $normalized = array();
        foreach ($descriptors as $descriptor) {
            if (!is_array($descriptor)) {
                continue;
            }
            $resolved = platform_submissions_get_media_descriptor(
                $descriptor['url'] ?? '',
                $descriptor['attachmentId'] ?? 0,
                $descriptor['fileId'] ?? ''
            );
            if (!empty($resolved['url'])) {
                $normalized[$resolved['url']] = $resolved;
            }
        }

        return array_values($normalized);
    }
}

if (!function_exists('platform_submissions_get_listing_media_descriptors')) {
    function platform_submissions_get_listing_media_descriptors($post_id) {
        $urls = platform_submissions_get_listing_image_urls($post_id, 'classified_ad');
        $stored = platform_submissions_normalize_media_descriptors(get_post_meta($post_id, 'classified_media_descriptors', true));
        $stored_by_url = array();
        foreach ($stored as $descriptor) {
            $stored_by_url[$descriptor['url']] = $descriptor;
        }

        $descriptors = array();
        foreach ($urls as $url) {
            $url = esc_url_raw((string) $url);
            if ($url === '') {
                continue;
            }
            $descriptors[] = $stored_by_url[$url] ?? platform_submissions_get_media_descriptor($url);
        }

        return platform_submissions_normalize_media_descriptors($descriptors);
    }
}

if (!function_exists('platform_submissions_media_descriptor_is_referenced')) {
    function platform_submissions_media_descriptor_is_referenced($descriptor, $excluded_post_id = 0) {
        $url = esc_url_raw((string) ($descriptor['url'] ?? ''));
        if ($url === '') {
            return false;
        }

        $post_ids = get_posts(array(
            'post_type' => 'classified_ad',
            'post_status' => 'any',
            'posts_per_page' => -1,
            'fields' => 'ids',
            'no_found_rows' => true,
        ));
        foreach ($post_ids as $post_id) {
            if ((int) $post_id === (int) $excluded_post_id) {
                continue;
            }
            foreach (platform_submissions_get_listing_image_urls($post_id, 'classified_ad') as $candidate_url) {
                if (esc_url_raw((string) $candidate_url) === $url) {
                    return true;
                }
            }
        }

        return false;
    }
}

if (!function_exists('platform_submissions_get_media_delete_url')) {
    function platform_submissions_get_media_delete_url() {
        return esc_url_raw((string) get_option('platform_2424_media_delete_url', ''));
    }
}

if (!function_exists('platform_submissions_media_cleanup_connection_context')) {
    function platform_submissions_media_cleanup_connection_context() {
        $endpoint = platform_submissions_get_media_delete_url();
        $cdn_url = platform_submissions_get_media_public_base_url();
        $endpoint_parts = $endpoint !== '' ? wp_parse_url($endpoint) : array();
        $cdn_parts = $cdn_url !== '' ? wp_parse_url($cdn_url) : array();

        return array(
            'lambdaConfigured' => $endpoint !== '',
            'lambdaHost' => sanitize_text_field((string) ($endpoint_parts['host'] ?? '')),
            'lambdaPath' => sanitize_text_field((string) ($endpoint_parts['path'] ?? '')),
            'secretConfigured' => trim((string) get_option('platform_2424_media_delete_secret', '')) !== '',
            'cdnConfigured' => $cdn_url !== '',
            'cdnHost' => sanitize_text_field((string) ($cdn_parts['host'] ?? '')),
        );
    }
}

if (!function_exists('platform_submissions_media_cleanup_key_context')) {
    function platform_submissions_media_cleanup_key_context($keys) {
        $keys = array_values(array_filter(array_map('sanitize_text_field', (array) $keys)));
        return array(
            'keyCount' => count($keys),
            // Keep enough information to correlate an operation without dumping an entire gallery.
            'keySamples' => array_slice($keys, 0, 3),
            'omittedKeyCount' => max(0, count($keys) - 3),
        );
    }
}

if (!function_exists('platform_submissions_log_media_cleanup')) {
    function platform_submissions_log_media_cleanup($level, $message, $context = array()) {
        if (function_exists('platform_2424_log_event')) {
            platform_2424_log_event($level, 'media-cleanup', $message, $context);
        }
    }
}

if (!function_exists('platform_submissions_delete_s3_media_batch')) {
    function platform_submissions_delete_s3_media_batch($keys) {
        $keys = is_array($keys) ? $keys : array($keys);
        $valid_keys = array();
        foreach ($keys as $key) {
            $key = ltrim(sanitize_text_field((string) $key), '/');
            if (strpos($key, 'uploads/') !== 0) {
                platform_submissions_log_media_cleanup('error', 'Lot S3 refuse : cle hors du prefixe uploads/.', platform_submissions_media_cleanup_key_context(array($key)));
                return new WP_Error('platform_submissions_invalid_media_key', 'Cle media invalide.');
            }
            $valid_keys[$key] = $key;
        }
        $valid_keys = array_values($valid_keys);
        if (empty($valid_keys) || count($valid_keys) > 100) {
            platform_submissions_log_media_cleanup('error', 'Lot S3 refuse : taille invalide.', platform_submissions_media_cleanup_key_context($valid_keys));
            return new WP_Error('platform_submissions_invalid_media_batch', 'Lot media invalide.');
        }

        $endpoint = platform_submissions_get_media_delete_url();
        $secret = (string) get_option('platform_2424_media_delete_secret', '');
        if ($endpoint === '' || !is_string($secret) || trim($secret) === '') {
            platform_submissions_log_media_cleanup('error', 'Suppression S3 bloquee : configuration Lambda incomplete.', array_merge(
                platform_submissions_media_cleanup_connection_context(),
                platform_submissions_media_cleanup_key_context($valid_keys)
            ));
            return new WP_Error('platform_submissions_media_delete_unconfigured', 'Suppression S3 non configuree.');
        }

        $started_at = microtime(true);
        platform_submissions_log_media_cleanup('info', 'Appel Lambda de suppression S3 demarre.', array_merge(
            platform_submissions_media_cleanup_connection_context(),
            platform_submissions_media_cleanup_key_context($valid_keys)
        ));
        $response = wp_remote_post($endpoint, array(
            'timeout' => 15,
            'headers' => array(
                'Content-Type' => 'application/json',
                'x-2424-media-secret' => trim($secret),
            ),
            'body' => wp_json_encode(array('keys' => $valid_keys)),
        ));
        if (is_wp_error($response)) {
            platform_submissions_log_media_cleanup('error', 'Lambda de suppression media indisponible.', array(
                'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
                'error' => $response->get_error_message(),
            ) + platform_submissions_media_cleanup_connection_context() + platform_submissions_media_cleanup_key_context($valid_keys));
            return $response;
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $payload = json_decode((string) wp_remote_retrieve_body($response), true);
        if ($status < 200 || $status >= 300 || !is_array($payload)) {
            platform_submissions_log_media_cleanup('error', 'Lambda de suppression media en erreur.', array(
                'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
                'statusCode' => $status,
                'responseError' => sanitize_text_field((string) ($payload['error'] ?? 'Reponse invalide.')),
            ) + platform_submissions_media_cleanup_connection_context() + platform_submissions_media_cleanup_key_context($valid_keys));
            return new WP_Error('platform_submissions_media_delete_failed', 'Suppression S3 indisponible.');
        }

        platform_submissions_log_media_cleanup('info', 'Lambda de suppression media appelee.', array(
            'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
            'statusCode' => $status,
            'deletedCount' => count((array) ($payload['deletedKeys'] ?? array())),
            'failedCount' => count((array) ($payload['failedKeys'] ?? array())),
        ) + platform_submissions_media_cleanup_connection_context() + platform_submissions_media_cleanup_key_context($valid_keys));

        return array(
            'deletedKeys' => array_values(array_filter(array_map('sanitize_text_field', (array) ($payload['deletedKeys'] ?? array())))),
            'failedKeys' => array_values(array_filter(array_map('sanitize_text_field', (array) ($payload['failedKeys'] ?? array())))),
        );
    }
}

if (!function_exists('platform_submissions_test_media_delete_connection')) {
    function platform_submissions_test_media_delete_connection() {
        $endpoint = platform_submissions_get_media_delete_url();
        $secret = trim((string) get_option('platform_2424_media_delete_secret', ''));
        if ($endpoint === '' || $secret === '') {
            platform_submissions_log_media_cleanup('error', 'Test Lambda impossible : configuration incomplete.', platform_submissions_media_cleanup_connection_context());
            return new WP_Error('platform_submissions_media_delete_unconfigured', 'URL Lambda ou secret de suppression media manquant.');
        }

        $started_at = microtime(true);
        platform_submissions_log_media_cleanup('info', 'Test Lambda media demarre.', platform_submissions_media_cleanup_connection_context());
        $response = wp_remote_post($endpoint, array(
            'timeout' => 5,
            'headers' => array(
                'Content-Type' => 'application/json',
                'x-2424-media-secret' => $secret,
            ),
            'body' => wp_json_encode(array('keys' => array(), 'dryRun' => true)),
        ));
        if (is_wp_error($response)) {
            platform_submissions_log_media_cleanup('error', 'Test Lambda media echoue.', array_merge(platform_submissions_media_cleanup_connection_context(), array(
                'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
                'error' => $response->get_error_message(),
            )));
            return new WP_Error('platform_submissions_media_delete_test_failed', $response->get_error_message());
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $payload = json_decode((string) wp_remote_retrieve_body($response), true);
        if ($status < 200 || $status >= 300 || !is_array($payload) || empty($payload['ok'])) {
            platform_submissions_log_media_cleanup('error', 'Test Lambda media refuse.', array_merge(platform_submissions_media_cleanup_connection_context(), array(
                'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
                'statusCode' => $status,
                'responseError' => sanitize_text_field((string) ($payload['error'] ?? 'Reponse invalide.')),
            )));
            return new WP_Error('platform_submissions_media_delete_test_failed', 'La Lambda a refuse le test de connexion.');
        }

        platform_submissions_log_media_cleanup('info', 'Test Lambda media reussi.', array_merge(platform_submissions_media_cleanup_connection_context(), array(
            'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
            'statusCode' => $status,
        )));
        return true;
    }
}

if (!function_exists('platform_submissions_delete_s3_media')) {
    function platform_submissions_delete_s3_media($key) {
        $result = platform_submissions_delete_s3_media_batch(array($key));
        if (is_wp_error($result)) {
            return $result;
        }

        return empty($result['failedKeys'])
            ? true
            : new WP_Error('platform_submissions_media_delete_failed', 'Suppression S3 indisponible.');
    }
}

if (!function_exists('platform_submissions_find_imagekit_file_id')) {
    function platform_submissions_find_imagekit_file_id($url) {
        $private_key = getenv('IMAGEKIT_PRIVATE_KEY');
        if (!is_string($private_key) || trim($private_key) === '') {
            return '';
        }
        $path = (string) parse_url((string) $url, PHP_URL_PATH);
        if ($path === '') {
            return '';
        }

        $response = wp_remote_get('https://api.imagekit.io/v1/files?path=' . rawurlencode(dirname($path)), array(
            'timeout' => 15,
            'headers' => array('Authorization' => 'Basic ' . base64_encode(trim($private_key) . ':')),
        ));
        $files = !is_wp_error($response) ? json_decode((string) wp_remote_retrieve_body($response), true) : array();
        if (!is_array($files)) {
            return '';
        }
        foreach ($files as $file) {
            if (is_array($file) && isset($file['url'], $file['fileId']) && (string) $file['url'] === (string) $url) {
                return sanitize_text_field((string) $file['fileId']);
            }
        }
        return '';
    }
}

if (!function_exists('platform_submissions_delete_imagekit_media')) {
    function platform_submissions_delete_imagekit_media($descriptor) {
        $private_key = getenv('IMAGEKIT_PRIVATE_KEY');
        if (!is_string($private_key) || trim($private_key) === '') {
            return new WP_Error('platform_submissions_imagekit_missing_key', 'Suppression ImageKit non configuree.');
        }
        $file_id = sanitize_text_field((string) ($descriptor['fileId'] ?? ''));
        if ($file_id === '') {
            $file_id = platform_submissions_find_imagekit_file_id($descriptor['url'] ?? '');
        }
        if ($file_id === '') {
            return new WP_Error('platform_submissions_imagekit_file_not_found', 'Media ImageKit introuvable.');
        }

        $response = wp_remote_request('https://api.imagekit.io/v1/files/' . rawurlencode($file_id), array(
            'method' => 'DELETE',
            'timeout' => 15,
            'headers' => array('Authorization' => 'Basic ' . base64_encode(trim($private_key) . ':')),
        ));
        if (is_wp_error($response) || (int) wp_remote_retrieve_response_code($response) >= 300) {
            return new WP_Error('platform_submissions_imagekit_delete_failed', 'Suppression ImageKit indisponible.');
        }
        return true;
    }
}

if (!function_exists('platform_submissions_attempt_media_cleanup')) {
    function platform_submissions_attempt_media_cleanup($descriptor) {
        $provider = sanitize_key((string) ($descriptor['provider'] ?? ''));
        if ($provider === 'wordpress') {
            $attachment_id = absint($descriptor['attachmentId'] ?? 0);
            return $attachment_id > 0 && wp_delete_attachment($attachment_id, true) ? true : new WP_Error('platform_submissions_attachment_delete_failed', 'Suppression de la piece jointe impossible.');
        }
        if ($provider === 's3') {
            return platform_submissions_delete_s3_media($descriptor['key'] ?? '');
        }
        if ($provider === 'imagekit') {
            return platform_submissions_delete_imagekit_media($descriptor);
        }
        return new WP_Error('platform_submissions_unsupported_media_provider', 'Fournisseur media non gere.');
    }
}

if (!function_exists('platform_submissions_media_cleanup_group')) {
    function platform_submissions_media_cleanup_group() {
        return '2424-media-cleanup';
    }
}

if (!function_exists('platform_submissions_update_media_cleanup_records')) {
    function platform_submissions_update_media_cleanup_records($source_post_id, $descriptors, $status, $attempt = 0) {
        $source_post_id = absint($source_post_id);
        if ($source_post_id <= 0) {
            return;
        }

        $records = get_post_meta($source_post_id, '_platform_media_cleanup_records', true);
        $records = is_array($records) ? $records : array();
        foreach (platform_submissions_normalize_media_descriptors($descriptors) as $descriptor) {
            $url = esc_url_raw((string) ($descriptor['url'] ?? ''));
            if ($url === '') {
                continue;
            }
            $records[$url] = array(
                'provider' => sanitize_key((string) ($descriptor['provider'] ?? '')),
                'key' => sanitize_text_field((string) ($descriptor['key'] ?? '')),
                'status' => sanitize_key($status),
                'attempts' => max(0, absint($attempt)),
                'updatedAt' => gmdate('c'),
            );
        }
        update_post_meta($source_post_id, '_platform_media_cleanup_records', $records);
    }
}

if (!function_exists('platform_submissions_media_delete_is_configured')) {
    function platform_submissions_media_delete_is_configured() {
        return platform_submissions_get_media_delete_url() !== ''
            && trim((string) get_option('platform_2424_media_delete_secret', '')) !== '';
    }
}

if (!function_exists('platform_submissions_media_cleanup_hook')) {
    function platform_submissions_media_cleanup_hook() {
        return 'platform_submissions_process_media_cleanup_action';
    }
}

if (!function_exists('platform_submissions_media_cleanup_retry_delays')) {
    function platform_submissions_media_cleanup_retry_delays() {
        return array(MINUTE_IN_SECONDS, 5 * MINUTE_IN_SECONDS, 30 * MINUTE_IN_SECONDS, 2 * HOUR_IN_SECONDS, 12 * HOUR_IN_SECONDS);
    }
}

if (!function_exists('platform_submissions_schedule_media_cleanup_action')) {
    function platform_submissions_schedule_media_cleanup_action($provider, $descriptors, $source_post_id = 0, $attempt = 0, $scheduled_at = null) {
        if (!function_exists('as_schedule_single_action')) {
            return new WP_Error('platform_submissions_action_scheduler_unavailable', 'Action Scheduler indisponible.');
        }

        $descriptors = platform_submissions_normalize_media_descriptors($descriptors);
        if (empty($descriptors)) {
            return 0;
        }

        $job = array(
            'provider' => sanitize_key($provider),
            'descriptors' => $descriptors,
            'sourcePostId' => absint($source_post_id),
            'attempt' => max(0, absint($attempt)),
        );
        $scheduled_at = $scheduled_at === null ? time() + 1 : absint($scheduled_at);

        return as_schedule_single_action(
            max(time() + 1, $scheduled_at),
            platform_submissions_media_cleanup_hook(),
            array($job),
            platform_submissions_media_cleanup_group(),
            false
        );
    }
}

if (!function_exists('platform_submissions_enqueue_media_cleanup')) {
    function platform_submissions_enqueue_media_cleanup($descriptors, $excluded_post_id = 0) {
        $buckets = array('s3' => array(), 'wordpress' => array(), 'imagekit' => array());
        $queued = array();
        $failed = array();
        foreach (platform_submissions_normalize_media_descriptors($descriptors) as $descriptor) {
            $provider = sanitize_key((string) ($descriptor['provider'] ?? ''));
            // The reference check belongs to the worker so saving or deleting a
            // listing never scans the full classifieds catalogue synchronously.
            if ($provider === 'external' || !isset($buckets[$provider])) {
                platform_submissions_update_media_cleanup_records($excluded_post_id, array($descriptor), 'blocked');
                platform_submissions_log_media_cleanup('warning', 'Media ignore : fournisseur non gere.', array(
                    'sourcePostId' => absint($excluded_post_id),
                    'provider' => $provider ?: 'unknown',
                    'urlHost' => sanitize_text_field((string) (wp_parse_url((string) ($descriptor['url'] ?? ''), PHP_URL_HOST) ?: '')),
                    'urlPath' => sanitize_text_field((string) (wp_parse_url((string) ($descriptor['url'] ?? ''), PHP_URL_PATH) ?: '')),
                ) + platform_submissions_media_cleanup_connection_context());
                continue;
            }
            if ($provider === 's3' && !platform_submissions_media_delete_is_configured()) {
                platform_submissions_update_media_cleanup_records($excluded_post_id, array($descriptor), 'blocked');
                platform_submissions_log_media_cleanup('warning', 'Media S3 bloque : Lambda non configuree.', array(
                    'sourcePostId' => absint($excluded_post_id),
                    'key' => sanitize_text_field((string) ($descriptor['key'] ?? '')),
                ) + platform_submissions_media_cleanup_connection_context());
                $failed[] = $descriptor['url'];
                continue;
            }
            $buckets[$provider][] = $descriptor;
            $queued[] = $descriptor['url'];
        }

        $action_ids = array();
        $schedule_errors = array();
        foreach (array_chunk($buckets['s3'], 100) as $batch) {
            if (!empty($batch)) {
                $action_id = platform_submissions_schedule_media_cleanup_action('s3', $batch, $excluded_post_id);
                is_wp_error($action_id) ? $schedule_errors[] = $action_id->get_error_message() : $action_ids[] = $action_id;
            }
        }
        foreach (array_chunk($buckets['wordpress'], 25) as $batch) {
            if (!empty($batch)) {
                $action_id = platform_submissions_schedule_media_cleanup_action('wordpress', $batch, $excluded_post_id);
                is_wp_error($action_id) ? $schedule_errors[] = $action_id->get_error_message() : $action_ids[] = $action_id;
            }
        }
        foreach ($buckets['imagekit'] as $descriptor) {
            $action_id = platform_submissions_schedule_media_cleanup_action('imagekit', array($descriptor), $excluded_post_id);
            is_wp_error($action_id) ? $schedule_errors[] = $action_id->get_error_message() : $action_ids[] = $action_id;
        }

        $action_ids = array_values(array_filter($action_ids, function ($action_id) {
            return !is_wp_error($action_id) && absint($action_id) > 0;
        }));

        platform_submissions_update_media_cleanup_records($excluded_post_id, array_merge($buckets['s3'], $buckets['wordpress'], $buckets['imagekit']), 'queued');
        if (!empty($action_ids)) {
            platform_submissions_log_media_cleanup('info', 'Suppressions media mises en file.', array(
                'sourcePostId' => absint($excluded_post_id),
                'actionCount' => count($action_ids),
                'mediaCount' => count($queued),
                's3Count' => count($buckets['s3']),
                'wordpressCount' => count($buckets['wordpress']),
                'imagekitCount' => count($buckets['imagekit']),
                'actionIds' => array_map('absint', $action_ids),
            ));
        }
        if (!empty($schedule_errors)) {
            platform_submissions_log_media_cleanup('error', 'Certaines suppressions media n ont pas pu etre planifiees.', array(
                'sourcePostId' => absint($excluded_post_id),
                'errorCount' => count($schedule_errors),
                'errors' => array_slice(array_map('sanitize_text_field', $schedule_errors), 0, 3),
            ));
        }

        return array(
            'queued' => array_values(array_unique($queued)),
            'actionIds' => array_map('absint', $action_ids),
            'failed' => array_values(array_unique(array_filter($failed))),
        );
    }
}

if (!function_exists('platform_submissions_cleanup_media_descriptors')) {
    function platform_submissions_cleanup_media_descriptors($descriptors, $excluded_post_id = 0) {
        $queued = platform_submissions_enqueue_media_cleanup($descriptors, $excluded_post_id);
        return array('cleaned' => array(), 'queued' => $queued['queued'], 'actionIds' => $queued['actionIds'], 'blocked' => $queued['failed']);
    }
}

if (!function_exists('platform_submissions_media_cleanup_failed_descriptors')) {
    function platform_submissions_media_cleanup_failed_descriptors($provider, $descriptors) {
        $failed = array();
        if ($provider === 's3') {
            $keys = array();
            foreach ($descriptors as $descriptor) {
                $keys[$descriptor['key'] ?? ''] = $descriptor;
            }
            $result = platform_submissions_delete_s3_media_batch(array_keys($keys));
            if (is_wp_error($result)) {
                return $descriptors;
            }
            foreach ((array) $result['failedKeys'] as $key) {
                if (isset($keys[$key])) {
                    $failed[] = $keys[$key];
                }
            }
            return $failed;
        }

        foreach ($descriptors as $descriptor) {
            $result = platform_submissions_attempt_media_cleanup($descriptor);
            if (is_wp_error($result)) {
                $failed[] = $descriptor;
            }
        }
        return $failed;
    }
}

if (!function_exists('platform_submissions_process_media_cleanup_action')) {
    function platform_submissions_process_media_cleanup_action($job) {
        $provider = sanitize_key((string) ($job['provider'] ?? ''));
        $source_post_id = absint($job['sourcePostId'] ?? 0);
        $attempt = max(0, absint($job['attempt'] ?? 0));
        $started_at = microtime(true);
        $all_descriptors = platform_submissions_normalize_media_descriptors($job['descriptors'] ?? array());
        $global_references = $source_post_id === 0 ? platform_submissions_media_orphan_referenced_keys() : array();
        $descriptors = array_values(array_filter($all_descriptors, function ($descriptor) use ($source_post_id, $provider, $global_references) {
            if (($descriptor['provider'] ?? '') !== $provider) return false;
            if ($source_post_id === 0 && $provider === 's3') return !isset($global_references[(string) ($descriptor['key'] ?? '')]);
            return !platform_submissions_media_descriptor_is_referenced($descriptor, $source_post_id);
        }));
        if (empty($descriptors)) {
            platform_submissions_log_media_cleanup('info', 'Tache de suppression media ignoree : media encore reference ou lot vide.', array(
                'sourcePostId' => $source_post_id,
                'provider' => $provider,
                'attempt' => $attempt,
                'receivedCount' => count($all_descriptors),
                'skippedReferencedCount' => count($all_descriptors),
            ));
            return;
        }

        platform_submissions_log_media_cleanup('info', 'Tache de suppression media demarree.', array(
            'sourcePostId' => $source_post_id,
            'provider' => $provider,
            'attempt' => $attempt,
            'receivedCount' => count($all_descriptors),
            'processingCount' => count($descriptors),
            'skippedReferencedCount' => max(0, count($all_descriptors) - count($descriptors)),
        ));
        platform_submissions_update_media_cleanup_records($source_post_id, $descriptors, 'retrying', $attempt);
        $failed = platform_submissions_media_cleanup_failed_descriptors($provider, $descriptors);
        $failed_urls = array();
        foreach ($failed as $descriptor) {
            $failed_urls[(string) ($descriptor['url'] ?? '')] = true;
        }
        $deleted = array_values(array_filter($descriptors, function ($descriptor) use ($failed_urls) {
            return !isset($failed_urls[(string) ($descriptor['url'] ?? '')]);
        }));
        platform_submissions_update_media_cleanup_records($source_post_id, $deleted, 'deleted', $attempt);
        if (empty($failed)) {
            platform_submissions_log_media_cleanup('info', 'Tache de suppression media terminee.', array(
                'sourcePostId' => $source_post_id,
                'provider' => $provider,
                'attempt' => $attempt,
                'deletedCount' => count($deleted),
                'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
            ));
            return;
        }

        $delays = platform_submissions_media_cleanup_retry_delays();
        if ($attempt < count($delays)) {
            $next_action = platform_submissions_schedule_media_cleanup_action(
                $provider,
                $failed,
                $source_post_id,
                $attempt + 1,
                time() + $delays[$attempt]
            );
            if (!is_wp_error($next_action)) {
                platform_submissions_update_media_cleanup_records($source_post_id, $failed, 'retrying', $attempt + 1);
                platform_submissions_log_media_cleanup('warning', 'Tache de suppression media a relancer.', array(
                    'sourcePostId' => $source_post_id,
                    'provider' => $provider,
                    'attempt' => $attempt,
                    'failedCount' => count($failed),
                    'nextActionId' => absint($next_action),
                    'retryDelaySeconds' => $delays[$attempt],
                    'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
                ));
                return;
            }
        }

        platform_submissions_update_media_cleanup_records($source_post_id, $failed, 'failed', $attempt);
        platform_submissions_log_media_cleanup('error', 'Tache de suppression media abandonnee apres reprises.', array(
            'sourcePostId' => $source_post_id,
            'provider' => $provider,
            'attempt' => $attempt,
            'failedCount' => count($failed),
            'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
        ));

        throw new RuntimeException('Suppression media echouee apres ' . $attempt . ' reprise(s).');
    }
}
add_action('platform_submissions_process_media_cleanup_action', 'platform_submissions_process_media_cleanup_action', 10, 1);

if (!function_exists('platform_submissions_migrate_legacy_media_cleanup_queue')) {
    function platform_submissions_migrate_legacy_media_cleanup_queue() {
        $legacy_queue = get_option('platform_submissions_media_cleanup_queue', null);
        if (!is_array($legacy_queue)) {
            return;
        }

        platform_submissions_enqueue_media_cleanup($legacy_queue);
        delete_option('platform_submissions_media_cleanup_queue');
    }
}
add_action('init', 'platform_submissions_migrate_legacy_media_cleanup_queue', 42);

if (!function_exists('platform_submissions_media_cleanup_diagnostics')) {
    function platform_submissions_media_cleanup_diagnostics() {
        if (!class_exists('ActionScheduler') || !method_exists('ActionScheduler', 'store')) {
            return array('available' => false);
        }

        $store = ActionScheduler::store();
        $counts = array();
        foreach (array('pending', 'running', 'failed') as $status) {
            $counts[$status] = (int) $store->query_actions(array(
                'group' => platform_submissions_media_cleanup_group(),
                'status' => $status,
            ), 'count');
        }

        return array_merge(array('available' => true), $counts);
    }
}

if (!function_exists('platform_submissions_media_recovery_group')) {
    function platform_submissions_media_recovery_group() {
        return '2424-media-recovery';
    }
}

if (!function_exists('platform_submissions_media_recovery_hook')) {
    function platform_submissions_media_recovery_hook() {
        return 'platform_submissions_process_media_recovery_action';
    }
}

if (!function_exists('platform_submissions_get_media_recovery_state')) {
    function platform_submissions_get_media_recovery_state($mode = '') {
        $state = get_option('platform_submissions_media_recovery_state', array());
        $state = is_array($state) ? $state : array();
        return $mode === '' ? $state : (is_array($state[$mode] ?? null) ? $state[$mode] : array());
    }
}

if (!function_exists('platform_submissions_update_media_recovery_state')) {
    function platform_submissions_update_media_recovery_state($mode, $state) {
        $all_state = platform_submissions_get_media_recovery_state();
        $state['updatedAt'] = gmdate('c');
        $all_state[$mode] = $state;
        update_option('platform_submissions_media_recovery_state', $all_state, false);
    }
}

if (!function_exists('platform_submissions_schedule_media_recovery_action')) {
    function platform_submissions_schedule_media_recovery_action($mode) {
        if (!function_exists('as_schedule_single_action')) {
            return new WP_Error('platform_submissions_action_scheduler_unavailable', 'Action Scheduler indisponible.');
        }

        return as_schedule_single_action(
            time() + 1,
            platform_submissions_media_recovery_hook(),
            array(array('mode' => $mode)),
            platform_submissions_media_recovery_group(),
            true
        );
    }
}

if (!function_exists('platform_submissions_schedule_media_recovery')) {
    function platform_submissions_schedule_media_recovery($mode) {
        $mode = sanitize_key($mode);
        if (!in_array($mode, array('retry', 'backfill'), true)) {
            return new WP_Error('platform_submissions_media_recovery_invalid_mode', 'Mode de reprise invalide.');
        }

        $existing = platform_submissions_get_media_recovery_state($mode);
        if (in_array($existing['status'] ?? '', array('pending', 'running'), true)) {
            platform_submissions_log_media_cleanup('info', 'Reprise media deja planifiee.', array(
                'mode' => $mode,
                'status' => sanitize_key((string) ($existing['status'] ?? '')),
                'cursor' => absint($existing['cursor'] ?? 0),
                'checked' => absint($existing['checked'] ?? 0),
            ));
            return array('scheduled' => false, 'alreadyScheduled' => true, 'state' => $existing);
        }

        $state = array(
            'status' => 'pending',
            'cursor' => 0,
            'checked' => 0,
            'queued' => 0,
            'blocked' => 0,
            'startedAt' => gmdate('c'),
            'error' => '',
        );
        platform_submissions_update_media_recovery_state($mode, $state);
        $action_id = platform_submissions_schedule_media_recovery_action($mode);
        if (is_wp_error($action_id) || absint($action_id) <= 0) {
            $message = is_wp_error($action_id) ? $action_id->get_error_message() : 'Impossible de planifier la reprise media.';
            $state['status'] = 'failed';
            $state['error'] = $message;
            platform_submissions_update_media_recovery_state($mode, $state);
            platform_submissions_log_media_cleanup('error', 'Planification de reprise media echouee.', array('mode' => $mode, 'error' => sanitize_text_field($message)));
            return new WP_Error('platform_submissions_media_recovery_schedule_failed', $message);
        }

        platform_submissions_log_media_cleanup('info', 'Reprise media planifiee.', array('mode' => $mode, 'actionId' => absint($action_id)));
        return array('scheduled' => true, 'alreadyScheduled' => false, 'actionId' => absint($action_id), 'state' => $state);
    }
}

if (!function_exists('platform_submissions_get_media_recovery_post_ids')) {
    function platform_submissions_get_media_recovery_post_ids($mode, $cursor, $limit = 100) {
        global $wpdb;
        $cursor = max(0, absint($cursor));
        $limit = min(100, max(1, absint($limit)));
        if ($mode === 'retry') {
            return array_map('absint', $wpdb->get_col($wpdb->prepare(
                "SELECT DISTINCT posts.ID FROM {$wpdb->posts} posts INNER JOIN {$wpdb->postmeta} meta ON meta.post_id = posts.ID AND meta.meta_key = '_platform_media_cleanup_records' WHERE posts.post_type = 'classified_ad' AND posts.post_status IN ('publish', 'pending', 'draft', 'private', 'future', 'trash') AND posts.ID > %d ORDER BY posts.ID ASC LIMIT %d",
                $cursor,
                $limit
            )));
        }

        return array_map('absint', $wpdb->get_col($wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'classified_ad' AND post_status = 'trash' AND ID > %d ORDER BY ID ASC LIMIT %d",
            $cursor,
            $limit
        )));
    }
}

if (!function_exists('platform_submissions_requeue_media_cleanup_for_post')) {
    function platform_submissions_requeue_media_cleanup_for_post($post_id) {
        $records = get_post_meta($post_id, '_platform_media_cleanup_records', true);
        if (!is_array($records)) {
            return array('queued' => 0, 'blocked' => 0);
        }
        $descriptors = array();
        foreach ($records as $url => $record) {
            if (!is_array($record) || !in_array(sanitize_key((string) ($record['status'] ?? '')), array('failed', 'blocked'), true)) {
                continue;
            }
            $descriptors[] = array(
                'url' => esc_url_raw((string) $url),
                'provider' => sanitize_key((string) ($record['provider'] ?? '')),
                'key' => sanitize_text_field((string) ($record['key'] ?? '')),
            );
        }
        if (empty($descriptors)) {
            return array('queued' => 0, 'blocked' => 0);
        }
        $result = platform_submissions_enqueue_media_cleanup($descriptors, $post_id);
        return array('queued' => count((array) ($result['queued'] ?? array())), 'blocked' => count((array) ($result['failed'] ?? array())));
    }
}

if (!function_exists('platform_submissions_process_media_recovery_action')) {
    function platform_submissions_process_media_recovery_action($job) {
        $mode = sanitize_key((string) ($job['mode'] ?? ''));
        if (!in_array($mode, array('retry', 'backfill'), true)) {
            return;
        }

        $state = platform_submissions_get_media_recovery_state($mode);
        if (empty($state) || ($state['status'] ?? '') === 'completed') {
            return;
        }
        $state['status'] = 'running';
        platform_submissions_update_media_recovery_state($mode, $state);
        $started_at = microtime(true);
        platform_submissions_log_media_cleanup('info', 'Lot de reprise media demarre.', array(
            'mode' => $mode,
            'cursor' => absint($state['cursor'] ?? 0),
            'checked' => absint($state['checked'] ?? 0),
        ));

        try {
            $post_ids = platform_submissions_get_media_recovery_post_ids($mode, $state['cursor'] ?? 0);
            foreach ($post_ids as $post_id) {
                $state['checked'] = absint($state['checked'] ?? 0) + 1;
                $result = $mode === 'retry'
                    ? platform_submissions_requeue_media_cleanup_for_post($post_id)
                    : platform_submissions_enqueue_media_cleanup(platform_submissions_get_listing_media_descriptors($post_id), $post_id);
                $state['queued'] = absint($state['queued'] ?? 0) + count((array) ($result['queued'] ?? array()));
                $state['blocked'] = absint($state['blocked'] ?? 0) + count((array) ($result['failed'] ?? array()));
                $state['cursor'] = $post_id;
            }

            platform_submissions_log_media_cleanup('info', 'Lot de reprise media traite.', array(
                'mode' => $mode,
                'postCount' => count($post_ids),
                'firstPostId' => !empty($post_ids) ? min($post_ids) : 0,
                'lastPostId' => !empty($post_ids) ? max($post_ids) : 0,
                'cursor' => absint($state['cursor'] ?? 0),
                'checked' => absint($state['checked'] ?? 0),
                'queued' => absint($state['queued'] ?? 0),
                'blocked' => absint($state['blocked'] ?? 0),
                'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
            ));

            if (count($post_ids) === 100) {
                $state['status'] = 'pending';
                platform_submissions_update_media_recovery_state($mode, $state);
                $action_id = platform_submissions_schedule_media_recovery_action($mode);
                if (is_wp_error($action_id) || absint($action_id) <= 0) {
                    throw new RuntimeException(is_wp_error($action_id) ? $action_id->get_error_message() : 'Impossible de planifier le lot suivant.');
                }
                platform_submissions_log_media_cleanup('info', 'Lot suivant de reprise media planifie.', array(
                    'mode' => $mode,
                    'actionId' => absint($action_id),
                    'cursor' => absint($state['cursor'] ?? 0),
                ));
                return;
            }

            $state['status'] = 'completed';
            platform_submissions_update_media_recovery_state($mode, $state);
            platform_submissions_log_media_cleanup('info', 'Reprise media terminee.', array(
                'mode' => $mode,
                'checked' => absint($state['checked'] ?? 0),
                'queued' => absint($state['queued'] ?? 0),
                'blocked' => absint($state['blocked'] ?? 0),
            ));
        } catch (Throwable $error) {
            $state['status'] = 'failed';
            $state['error'] = sanitize_text_field($error->getMessage());
            platform_submissions_update_media_recovery_state($mode, $state);
            platform_submissions_log_media_cleanup('error', 'Reprise media echouee.', array(
                'mode' => $mode,
                'cursor' => absint($state['cursor'] ?? 0),
                'checked' => absint($state['checked'] ?? 0),
                'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
                'error' => $state['error'],
            ));
            throw $error;
        }
    }
}
add_action('platform_submissions_process_media_recovery_action', 'platform_submissions_process_media_recovery_action', 10, 1);

if (!function_exists('platform_submissions_media_orphan_audit_group')) {
    function platform_submissions_media_orphan_audit_group() {
        return '2424-media-orphan-audit';
    }
}

if (!function_exists('platform_submissions_media_orphan_audit_tables')) {
    function platform_submissions_media_orphan_audit_tables() {
        global $wpdb;
        return array(
            'audits' => $wpdb->prefix . '2424_media_orphan_audits',
            'items' => $wpdb->prefix . '2424_media_orphan_audit_items',
        );
    }
}

if (!function_exists('platform_submissions_media_orphan_audit_install_tables')) {
    function platform_submissions_media_orphan_audit_install_tables() {
        global $wpdb;
        if ((string) get_option('platform_submissions_media_orphan_schema_version', '') === '1') return;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $tables = platform_submissions_media_orphan_audit_tables();
        $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE {$tables['audits']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            status varchar(20) NOT NULL DEFAULT 'pending', cursor longtext NULL, scanned bigint(20) unsigned NOT NULL DEFAULT 0,
            referenced bigint(20) unsigned NOT NULL DEFAULT 0, recent bigint(20) unsigned NOT NULL DEFAULT 0,
            candidates bigint(20) unsigned NOT NULL DEFAULT 0, error text NULL, started_at datetime NOT NULL, completed_at datetime NULL,
            PRIMARY KEY (id), KEY status (status)
        ) $charset;");
        dbDelta("CREATE TABLE {$tables['items']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT, audit_id bigint(20) unsigned NOT NULL,
            media_key varchar(512) NOT NULL, size_bytes bigint(20) unsigned NOT NULL DEFAULT 0, last_modified datetime NULL,
            status varchar(20) NOT NULL DEFAULT 'candidate', created_at datetime NOT NULL, updated_at datetime NOT NULL,
            PRIMARY KEY (id), UNIQUE KEY audit_key (audit_id, media_key(191)), KEY audit_status (audit_id, status)
        ) $charset;");
        update_option('platform_submissions_media_orphan_schema_version', '1', false);
    }
}
add_action('init', 'platform_submissions_media_orphan_audit_install_tables', 1);

if (!function_exists('platform_submissions_get_media_inventory_url')) {
    function platform_submissions_get_media_inventory_url() {
        return esc_url_raw((string) get_option('platform_2424_media_inventory_url', ''));
    }
}

if (!function_exists('platform_submissions_media_inventory_connection_context')) {
    function platform_submissions_media_inventory_connection_context() {
        $endpoint = platform_submissions_get_media_inventory_url();
        $parts = $endpoint !== '' ? wp_parse_url($endpoint) : array();
        return array(
            'inventoryConfigured' => $endpoint !== '',
            'inventoryHost' => sanitize_text_field((string) ($parts['host'] ?? '')),
            'inventoryPath' => sanitize_text_field((string) ($parts['path'] ?? '')),
            'secretConfigured' => trim((string) get_option('platform_2424_media_delete_secret', '')) !== '',
        );
    }
}

if (!function_exists('platform_submissions_media_inventory_request')) {
    function platform_submissions_media_inventory_request($cursor = '') {
        $endpoint = platform_submissions_get_media_inventory_url();
        $secret = trim((string) get_option('platform_2424_media_delete_secret', ''));
        if ($endpoint === '' || $secret === '') {
            platform_submissions_log_media_cleanup('error', 'Inventaire media bloque : configuration incomplete.', platform_submissions_media_inventory_connection_context());
            return new WP_Error('platform_submissions_media_inventory_unconfigured', 'URL Lambda inventaire ou secret manquant.');
        }
        $started_at = microtime(true);
        platform_submissions_log_media_cleanup('info', 'Appel Lambda inventaire media demarre.', platform_submissions_media_inventory_connection_context());
        $response = wp_remote_post($endpoint, array(
            'timeout' => 20,
            'headers' => array('Content-Type' => 'application/json', 'x-2424-media-secret' => $secret),
            'body' => wp_json_encode(array('cursor' => (string) $cursor, 'maxKeys' => 500)),
        ));
        if (is_wp_error($response)) {
            platform_submissions_log_media_cleanup('error', 'Lambda inventaire media indisponible.', array_merge(platform_submissions_media_inventory_connection_context(), array(
                'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
                'error' => $response->get_error_message(),
            )));
            return $response;
        }
        $status = (int) wp_remote_retrieve_response_code($response);
        $payload = json_decode((string) wp_remote_retrieve_body($response), true);
        if ($status < 200 || $status >= 300 || !is_array($payload) || !isset($payload['objects']) || !is_array($payload['objects'])) {
            $message = sanitize_text_field((string) ($payload['error'] ?? 'Inventaire S3 indisponible.'));
            platform_submissions_log_media_cleanup('error', 'Lambda inventaire media en erreur.', array_merge(platform_submissions_media_inventory_connection_context(), array(
                'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
                'statusCode' => $status,
                'responseError' => $message,
            )));
            return new WP_Error('platform_submissions_media_inventory_failed', $message);
        }
        platform_submissions_log_media_cleanup('info', 'Lambda inventaire media appelee.', array_merge(platform_submissions_media_inventory_connection_context(), array(
            'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
            'objectCount' => count($payload['objects']),
            'hasNextCursor' => !empty($payload['nextCursor']),
        )));
        return $payload;
    }
}

if (!function_exists('platform_submissions_test_media_inventory_connection')) {
    function platform_submissions_test_media_inventory_connection() {
        $result = platform_submissions_media_inventory_request('');
        if (is_wp_error($result)) return $result;
        platform_submissions_log_media_cleanup('info', 'Test Lambda inventaire media reussi.', array('objectCount' => count((array) ($result['objects'] ?? array()))));
        return true;
    }
}

if (!function_exists('platform_submissions_media_orphan_is_image_key')) {
    function platform_submissions_media_orphan_is_image_key($key) {
        return is_string($key) && (bool) preg_match('/\.(?:jpe?g|png|gif|webp|avif)$/i', $key);
    }
}

if (!function_exists('platform_submissions_media_orphan_family_keys')) {
    function platform_submissions_media_orphan_family_keys($key) {
        $key = sanitize_text_field((string) $key);
        $base = preg_replace('/\.(?:webp|avif)$/i', '', $key);
        return array_unique(array($key, $base . '.webp', $base . '.avif'));
    }
}

if (!function_exists('platform_submissions_media_orphan_extract_keys')) {
    function platform_submissions_media_orphan_extract_keys($value) {
        $keys = array();
        if (is_array($value)) {
            foreach ($value as $item) $keys = array_merge($keys, platform_submissions_media_orphan_extract_keys($item));
            return array_values(array_unique($keys));
        }
        if (!is_string($value) || $value === '') return array();
        $decoded = maybe_unserialize($value);
        if ($decoded !== $value) return platform_submissions_media_orphan_extract_keys($decoded);
        if (preg_match_all('#https?://[^\s"\'<>]+#i', $value, $matches)) {
            foreach ($matches[0] as $url) {
                $key = platform_submissions_get_s3_key_from_media_url(html_entity_decode($url));
                if ($key !== '') $keys[] = $key;
            }
        }
        return array_values(array_unique($keys));
    }
}

if (!function_exists('platform_submissions_media_orphan_referenced_keys')) {
    function platform_submissions_media_orphan_referenced_keys() {
        global $wpdb;
        $referenced = array();
        // Media attached to trashed posts must become eligible for the delayed
        // orphan cleanup while all active posts continue protecting their files.
        foreach ((array) $wpdb->get_col("SELECT pm.meta_value FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id WHERE p.post_status <> 'trash'") as $value) {
            foreach (platform_submissions_media_orphan_extract_keys($value) as $key) $referenced[$key] = true;
        }
        foreach ((array) $wpdb->get_col("SELECT meta_value FROM {$wpdb->usermeta}") as $value) {
            foreach (platform_submissions_media_orphan_extract_keys($value) as $key) $referenced[$key] = true;
        }
        foreach ((array) $wpdb->get_col("SELECT post_content FROM {$wpdb->posts} WHERE post_status <> 'trash'") as $content) {
            foreach (platform_submissions_media_orphan_extract_keys($content) as $key) $referenced[$key] = true;
        }
        foreach (array_keys($referenced) as $key) {
            foreach (platform_submissions_media_orphan_family_keys($key) as $family_key) $referenced[$family_key] = true;
        }
        return $referenced;
    }
}

if (!function_exists('platform_submissions_start_media_orphan_audit')) {
    function platform_submissions_start_media_orphan_audit() {
        if (!function_exists('as_schedule_single_action')) return new WP_Error('platform_submissions_action_scheduler_unavailable', 'Action Scheduler indisponible.');
        global $wpdb;
        $tables = platform_submissions_media_orphan_audit_tables();
        $wpdb->insert($tables['audits'], array('status' => 'pending', 'started_at' => current_time('mysql', true)), array('%s', '%s'));
        $audit_id = absint($wpdb->insert_id);
        if (!$audit_id) return new WP_Error('platform_submissions_media_orphan_audit_create_failed', 'Impossible de creer l audit media.');
        $action_id = as_schedule_single_action(time() + 1, 'platform_submissions_process_media_orphan_audit', array(array('auditId' => $audit_id)), platform_submissions_media_orphan_audit_group(), false);
        platform_submissions_log_media_cleanup('info', 'Audit des medias orphelins planifie.', array('auditId' => $audit_id, 'actionId' => absint($action_id)));
        return array('auditId' => $audit_id, 'actionId' => absint($action_id));
    }
}

if (!function_exists('platform_submissions_process_media_orphan_audit')) {
    function platform_submissions_process_media_orphan_audit($job) {
        global $wpdb;
        $audit_id = absint($job['auditId'] ?? 0); $tables = platform_submissions_media_orphan_audit_tables();
        $audit = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$tables['audits']} WHERE id = %d", $audit_id), ARRAY_A);
        if (!$audit || $audit['status'] === 'completed') return;
        $wpdb->update($tables['audits'], array('status' => 'running'), array('id' => $audit_id));
        $page = platform_submissions_media_inventory_request((string) ($audit['cursor'] ?? ''));
        if (is_wp_error($page)) {
            $wpdb->update($tables['audits'], array('status' => 'failed', 'error' => $page->get_error_message()), array('id' => $audit_id));
            platform_submissions_log_media_cleanup('error', 'Audit media orphelin echoue.', array('auditId' => $audit_id, 'error' => $page->get_error_message()));
            throw new RuntimeException($page->get_error_message());
        }
        $references = platform_submissions_media_orphan_referenced_keys(); $now = time(); $grace = 7 * DAY_IN_SECONDS;
        $counts = array('scanned' => 0, 'referenced' => 0, 'recent' => 0, 'candidates' => 0);
        foreach ($page['objects'] as $object) {
            $key = sanitize_text_field((string) ($object['key'] ?? ''));
            if (!platform_submissions_is_managed_s3_key($key) || !platform_submissions_media_orphan_is_image_key($key)) continue;
            $counts['scanned']++;
            if (isset($references[$key])) { $counts['referenced']++; continue; }
            $modified = strtotime((string) ($object['lastModified'] ?? ''));
            if (!$modified || $modified > $now - $grace) { $counts['recent']++; continue; }
            $wpdb->query($wpdb->prepare("INSERT IGNORE INTO {$tables['items']} (audit_id, media_key, size_bytes, last_modified, status, created_at, updated_at) VALUES (%d, %s, %d, %s, 'candidate', %s, %s)", $audit_id, $key, absint($object['size'] ?? 0), gmdate('Y-m-d H:i:s', $modified), current_time('mysql', true), current_time('mysql', true)));
            $counts['candidates']++;
        }
        $next = sanitize_text_field((string) ($page['nextCursor'] ?? ''));
        $update = array('cursor' => $next ?: null, 'scanned' => absint($audit['scanned']) + $counts['scanned'], 'referenced' => absint($audit['referenced']) + $counts['referenced'], 'recent' => absint($audit['recent']) + $counts['recent'], 'candidates' => absint($audit['candidates']) + $counts['candidates']);
        if ($next === '') { $update['status'] = 'completed'; $update['completed_at'] = current_time('mysql', true); }
        $wpdb->update($tables['audits'], $update, array('id' => $audit_id));
        platform_submissions_log_media_cleanup('info', 'Lot audit media traite.', array('auditId' => $audit_id, 'objectCount' => count($page['objects']), 'hasNextCursor' => $next !== '', 'candidates' => $counts['candidates']));
        if ($next !== '') {
            as_schedule_single_action(time() + 1, 'platform_submissions_process_media_orphan_audit', array(array('auditId' => $audit_id)), platform_submissions_media_orphan_audit_group(), false);
            return;
        }

        $queue_result = platform_submissions_queue_all_media_orphans($audit_id);
        if (is_wp_error($queue_result)) {
            platform_submissions_log_media_cleanup('error', 'Mise en file automatique des medias orphelins echouee.', array('auditId' => $audit_id, 'error' => $queue_result->get_error_message()));
            return;
        }
        platform_submissions_log_media_cleanup('info', 'Medias orphelins mis automatiquement en file.', array('auditId' => $audit_id, 'queued' => absint($queue_result['queued'] ?? 0), 'protected' => absint($queue_result['protected'] ?? 0)));
    }
}
add_action('platform_submissions_process_media_orphan_audit', 'platform_submissions_process_media_orphan_audit', 10, 1);

if (!function_exists('platform_submissions_schedule_daily_media_orphan_audit')) {
    function platform_submissions_schedule_daily_media_orphan_audit() {
        if (!function_exists('as_schedule_recurring_action') || !function_exists('as_next_scheduled_action')) return;
        $group = platform_submissions_media_orphan_audit_group();
        if (function_exists('as_unschedule_all_actions')) {
            as_unschedule_all_actions('platform_submissions_start_weekly_media_orphan_audit', array(), $group);
        }
        if (!as_next_scheduled_action('platform_submissions_start_daily_media_orphan_audit', array(), $group)) {
            as_schedule_recurring_action(time() + HOUR_IN_SECONDS, DAY_IN_SECONDS, 'platform_submissions_start_daily_media_orphan_audit', array(), $group, true);
        }
    }
}
add_action('init', 'platform_submissions_schedule_daily_media_orphan_audit', 45);
add_action('platform_submissions_start_daily_media_orphan_audit', 'platform_submissions_start_media_orphan_audit');

if (!function_exists('platform_submissions_get_latest_media_orphan_audit')) {
    function platform_submissions_get_latest_media_orphan_audit() {
        global $wpdb; $tables = platform_submissions_media_orphan_audit_tables();
        return $wpdb->get_row("SELECT * FROM {$tables['audits']} ORDER BY id DESC LIMIT 1", ARRAY_A);
    }
}

if (!function_exists('platform_submissions_queue_selected_media_orphans')) {
    function platform_submissions_queue_selected_media_orphans($audit_id, $item_ids) {
        global $wpdb; $tables = platform_submissions_media_orphan_audit_tables();
        $audit_id = absint($audit_id); $item_ids = array_values(array_filter(array_map('absint', (array) $item_ids)));
        if (!$audit_id || empty($item_ids)) return new WP_Error('platform_submissions_media_orphan_selection_empty', 'Selection vide.');
        $placeholders = implode(',', array_fill(0, count($item_ids), '%d'));
        $sql = $wpdb->prepare("SELECT * FROM {$tables['items']} WHERE audit_id = %d AND status = 'candidate' AND id IN ($placeholders)", array_merge(array($audit_id), $item_ids));
        $items = $wpdb->get_results($sql, ARRAY_A);
        $descriptors = array(); $selected_ids = array(); $base = rtrim(platform_submissions_get_media_public_base_url(), '/'); $references = platform_submissions_media_orphan_referenced_keys();
        foreach ($items as $item) {
            $key = (string) $item['media_key'];
            if (isset($references[$key])) {
                $wpdb->update($tables['items'], array('status' => 'protected', 'updated_at' => current_time('mysql', true)), array('id' => absint($item['id'])));
                continue;
            }
            $descriptors[] = array('provider' => 's3', 'key' => $key, 'url' => $base . '/' . $key);
            $selected_ids[] = absint($item['id']);
        }
        if (empty($descriptors)) return array('queued' => 0, 'protected' => count($items));
        $result = platform_submissions_enqueue_media_cleanup($descriptors, 0);
        if (!empty($selected_ids)) {
            $wpdb->query($wpdb->prepare("UPDATE {$tables['items']} SET status = 'queued', updated_at = %s WHERE id IN (" . implode(',', array_fill(0, count($selected_ids), '%d')) . ')', array_merge(array(current_time('mysql', true)), $selected_ids)));
        }
        platform_submissions_log_media_cleanup('info', 'Medias orphelins selectionnes mis en file.', array('auditId' => $audit_id, 'selectedCount' => count($selected_ids), 'actionIds' => $result['actionIds'] ?? array()));
        return array('queued' => count($selected_ids), 'protected' => count($items) - count($selected_ids));
    }
}

if (!function_exists('platform_submissions_queue_all_media_orphans')) {
    function platform_submissions_queue_all_media_orphans($audit_id) {
        global $wpdb;
        $audit_id = absint($audit_id);
        if (!$audit_id) return new WP_Error('platform_submissions_media_orphan_audit_missing', 'Audit media introuvable.');
        $tables = platform_submissions_media_orphan_audit_tables();
        $item_ids = array_map('absint', (array) $wpdb->get_col($wpdb->prepare("SELECT id FROM {$tables['items']} WHERE audit_id = %d AND status = 'candidate'", $audit_id)));
        if (empty($item_ids)) return array('queued' => 0, 'protected' => 0);
        return platform_submissions_queue_selected_media_orphans($audit_id, $item_ids);
    }
}

if (!function_exists('platform_submissions_requeue_failed_media_cleanup')) {
    function platform_submissions_requeue_failed_media_cleanup() {
        return platform_submissions_schedule_media_recovery('retry');
    }
}

if (!function_exists('platform_submissions_backfill_trashed_media_cleanup')) {
    function platform_submissions_backfill_trashed_media_cleanup() {
        return platform_submissions_schedule_media_recovery('backfill');
    }
}

if (!function_exists('platform_submissions_upload_to_imagekit')) {
    function platform_submissions_upload_to_imagekit($binary, $extension, $filename_prefix) {
        $private_key = getenv('IMAGEKIT_PRIVATE_KEY');
        $private_key = is_string($private_key) ? trim($private_key) : '';
        if ($private_key === '') {
            return new WP_Error('platform_submissions_imagekit_missing_key', 'IMAGEKIT_PRIVATE_KEY manquante.', array('status' => 500));
        }

        $folder = getenv('IMAGEKIT_UPLOAD_FOLDER');
        $folder = is_string($folder) ? trim($folder) : '';
        if ($folder === '') {
            $folder = '/2424/classifieds';
        } elseif ($folder[0] !== '/') {
            $folder = '/' . $folder;
        }

        $filename = sanitize_file_name($filename_prefix . '-' . wp_generate_password(12, false) . '.' . $extension);
        $response = wp_remote_post('https://upload.imagekit.io/api/v1/files/upload', array(
            'timeout' => 30,
            'headers' => array(
                'Authorization' => 'Basic ' . base64_encode($private_key . ':'),
            ),
            'body' => array(
                'file' => base64_encode($binary),
                'fileName' => $filename,
                'folder' => $folder,
                'useUniqueFileName' => 'true',
            ),
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $status = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode((string) $body, true);

        if ($status < 200 || $status >= 300 || !is_array($data) || empty($data['url'])) {
            return new WP_Error('platform_submissions_imagekit_upload_failed', 'Echec upload ImageKit.', array('status' => 500));
        }

        return array(
            'id' => 0,
            'fileId' => sanitize_text_field((string) ($data['fileId'] ?? '')),
            'url' => platform_submissions_rewrite_media_url((string) $data['url']),
        );
    }
}

if (!function_exists('platform_submissions_upload_base64_image')) {
    function platform_submissions_upload_base64_image($data_url, $post_id, $author_id, $filename_prefix = 'classified') {
        $data_url = trim((string) $data_url);
        if ($data_url === '') {
            return new WP_Error('platform_submissions_empty_image', 'Image vide.', array('status' => 400));
        }

        if (!preg_match('/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/', $data_url, $matches)) {
            return new WP_Error('platform_submissions_invalid_image', 'Image invalide.', array('status' => 400));
        }

        $extension = strtolower((string) $matches[1]);
        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        if (!in_array($extension, array('jpg', 'png', 'webp', 'gif'), true)) {
            return new WP_Error('platform_submissions_invalid_image_type', 'Format image non supporte.', array('status' => 400));
        }

        $binary = base64_decode((string) $matches[2], true);
        if ($binary === false) {
            return new WP_Error('platform_submissions_invalid_image_payload', 'Impossible de decoder cette image.', array('status' => 400));
        }

        if (strlen($binary) > 5 * 1024 * 1024) {
            return new WP_Error('platform_submissions_image_too_large', 'Image trop lourde (5 Mo maximum).', array('status' => 400));
        }

        if (platform_submissions_media_driver() === 'imagekit') {
            return platform_submissions_upload_to_imagekit($binary, $extension, $filename_prefix);
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';

        $filename = sanitize_file_name($filename_prefix . '-' . wp_generate_password(12, false) . '.' . $extension);
        $uploaded = wp_upload_bits($filename, null, $binary);

        if (!empty($uploaded['error'])) {
            return new WP_Error('platform_submissions_upload_failed', (string) $uploaded['error'], array('status' => 500));
        }

        $mime_type = wp_check_filetype($uploaded['file'], null);
        $attachment_id = wp_insert_attachment(array(
            'guid' => $uploaded['url'],
            'post_mime_type' => $mime_type['type'] ?: ('image/' . $extension),
            'post_title' => sanitize_text_field($filename_prefix . ' image'),
            'post_content' => '',
            'post_status' => 'inherit',
            'post_parent' => $post_id,
            'post_author' => $author_id,
        ), $uploaded['file'], $post_id);

        if (is_wp_error($attachment_id)) {
            return $attachment_id;
        }

        $attachment_meta = wp_generate_attachment_metadata($attachment_id, $uploaded['file']);
        if (!is_wp_error($attachment_meta) && !empty($attachment_meta)) {
            wp_update_attachment_metadata($attachment_id, $attachment_meta);
        }

        return array(
            'id' => (int) $attachment_id,
            'url' => platform_submissions_rewrite_media_url((string) wp_get_attachment_url($attachment_id)),
        );
    }
}

if (!function_exists('platform_submissions_attach_images_to_post')) {
    function platform_submissions_attach_images_to_post($post_id, $post_type, $author_id, $payload) {
        $has_image_fields = array_key_exists('featuredImageUrl', $payload) || array_key_exists('galleryImageUrls', $payload);
        if (!$has_image_fields) {
            return array('descriptors' => platform_submissions_get_listing_media_descriptors($post_id));
        }

        $featured_image_url = trim((string) ($payload['featuredImageUrl'] ?? ''));
        $gallery_image_urls = isset($payload['galleryImageUrls']) && is_array($payload['galleryImageUrls']) ? $payload['galleryImageUrls'] : array();
        $gallery_image_urls = array_values(array_filter(array_map('strval', $gallery_image_urls)));

        $uploaded_gallery_descriptors = array();

        if ($featured_image_url !== '') {
            if (preg_match('/^data:image\/[a-zA-Z0-9.+-]+;base64,/', $featured_image_url)) {
                $featured_upload = platform_submissions_upload_base64_image($featured_image_url, $post_id, $author_id, 'featured');
                if (is_wp_error($featured_upload)) {
                    return $featured_upload;
                }
                if (!empty($featured_upload['id'])) {
                    set_post_thumbnail($post_id, (int) $featured_upload['id']);
                }
                $uploaded_gallery_descriptors[] = platform_submissions_get_media_descriptor(
                    (string) $featured_upload['url'],
                    $featured_upload['id'] ?? 0,
                    $featured_upload['fileId'] ?? ''
                );
            } else {
                $safe_url = esc_url_raw($featured_image_url);
                if ($safe_url !== '') {
                    $uploaded_gallery_descriptors[] = platform_submissions_get_media_descriptor($safe_url);
                }
            }
        }

        $gallery_limit = $post_type === 'classified_ad'
            ? platform_submissions_get_classified_user_photo_limit(
                $author_id,
                sanitize_key((string) ($payload['trustedPlanId'] ?? ''))
            )
            : 10;
        $limited_gallery = array_slice($gallery_image_urls, 0, $gallery_limit);
        foreach ($limited_gallery as $index => $gallery_image_url) {
            if (!preg_match('/^data:image\/[a-zA-Z0-9.+-]+;base64,/', $gallery_image_url)) {
                $safe_url = esc_url_raw($gallery_image_url);
                if ($safe_url !== '') {
                    $uploaded_gallery_descriptors[] = platform_submissions_get_media_descriptor($safe_url);
                }
                continue;
            }

            $gallery_upload = platform_submissions_upload_base64_image($gallery_image_url, $post_id, $author_id, 'gallery-' . ($index + 1));
            if (is_wp_error($gallery_upload)) {
                return $gallery_upload;
            }
            $uploaded_gallery_descriptors[] = platform_submissions_get_media_descriptor(
                (string) $gallery_upload['url'],
                $gallery_upload['id'] ?? 0,
                $gallery_upload['fileId'] ?? ''
            );
        }

        if ($post_type === 'classified_ad') {
            $descriptors = platform_submissions_normalize_media_descriptors($uploaded_gallery_descriptors);
            $descriptors = array_slice($descriptors, 0, $gallery_limit);
            $gallery_urls = array_values(array_map(function ($descriptor) {
                return $descriptor['url'];
            }, $descriptors));

            if (empty($gallery_urls)) {
                delete_post_meta($post_id, 'featured_image_url');
                delete_post_meta($post_id, 'gallery_images');
                delete_post_meta($post_id, 'classified_media_descriptors');
                delete_post_thumbnail($post_id);
            } else {
                update_post_meta($post_id, 'featured_image_url', $gallery_urls[0]);
                update_post_meta($post_id, 'gallery_images', $gallery_urls);
                update_post_meta($post_id, 'classified_media_descriptors', $descriptors);
                if (!preg_match('/^data:image\/[a-zA-Z0-9.+-]+;base64,/', $featured_image_url)) {
                    delete_post_thumbnail($post_id);
                }
            }

            return array('descriptors' => $descriptors);
        }

        return array('descriptors' => platform_submissions_normalize_media_descriptors($uploaded_gallery_descriptors));
    }
}

if (!function_exists('platform_submissions_generate_username')) {
    function platform_submissions_generate_username($email, $identity) {
        $base = sanitize_user(current(explode('@', (string) $email)), true);
        if (!$base) {
            $base = 'user2424';
        }

        $suffix = substr(md5((string) $identity), 0, 8);
        $username = sanitize_user($base . '_' . $suffix, true);

        if (!$username) {
            $username = 'user2424_' . $suffix;
        }

        return $username;
    }
}

if (!function_exists('platform_submissions_find_user')) {
    function platform_submissions_find_user($identity, $email) {
        $identity = trim((string) $identity);
        if ($identity !== '') {
            $user_query = new WP_User_Query(array(
                'meta_key' => 'platform_identity',
                'meta_value' => $identity,
                'number' => 1,
                'count_total' => false,
            ));

            $users = $user_query->get_results();
            if (!empty($users)) {
                return $users[0];
            }
        }

        if ($email) {
            $user = get_user_by('email', $email);
            if ($user) {
                return $user;
            }
        }

        return null;
    }
}

if (!function_exists('platform_submissions_sync_user')) {
    function platform_submissions_sync_user($payload) {
        $identity = isset($payload['auth0Sub']) ? sanitize_text_field((string) $payload['auth0Sub']) : '';
        if ($identity === '' && !empty($payload['email'])) {
            $identity = sanitize_email((string) $payload['email']);
        }

        $email = isset($payload['email']) ? sanitize_email((string) $payload['email']) : '';
        $name = isset($payload['name']) ? sanitize_text_field((string) $payload['name']) : '';
        $first_name = isset($payload['firstName']) ? sanitize_text_field((string) $payload['firstName']) : '';
        $last_name = isset($payload['lastName']) ? sanitize_text_field((string) $payload['lastName']) : '';

        if (!$identity || !$email) {
            return new WP_Error('platform_submissions_invalid_user', 'Missing platform identity or email.', array('status' => 400));
        }

        $user = platform_submissions_find_user($identity, $email);

        if (!$user) {
            $created = wp_insert_user(array(
                'user_login' => platform_submissions_generate_username($email, $identity),
                'user_email' => $email,
                'display_name' => $name ?: $email,
                'first_name' => $first_name ?: $name,
                'last_name' => $last_name,
                'user_pass' => wp_generate_password(32, true, true),
                'role' => 'subscriber',
            ));

            if (is_wp_error($created)) {
                return $created;
            }

            $user = get_user_by('id', $created);
            if (function_exists('platform_auth_set_onboarding_completed')) {
                platform_auth_set_onboarding_completed($user->ID, false);
            }
        } else {
            wp_update_user(array(
                'ID' => $user->ID,
                'user_email' => $email,
                'display_name' => $name ?: $user->display_name,
                'first_name' => $first_name ?: $user->first_name,
                'last_name' => $last_name ?: $user->last_name,
            ));
            $user = get_user_by('id', $user->ID);
            if (function_exists('platform_auth_get_onboarding_completed_meta') && function_exists('platform_auth_set_onboarding_completed')) {
                $persisted_onboarding = platform_auth_get_onboarding_completed_meta($user->ID);
                if ($persisted_onboarding === null) {
                    platform_auth_set_onboarding_completed($user->ID, true);
                }
            }
        }

        update_user_meta($user->ID, 'platform_identity', $identity);
        if (strpos($identity, 'google-oauth2|') === 0) {
            update_user_meta($user->ID, 'platform_email_verified_at', gmdate('Y-m-d H:i:s'));
        }
        $platform_username = (string) get_user_meta($user->ID, 'platform_username', true);
        $email_verified_at = (string) get_user_meta($user->ID, 'platform_email_verified_at', true);
        $onboarding_completed = function_exists('platform_auth_has_completed_onboarding')
            ? platform_auth_has_completed_onboarding($user->ID)
            : ($platform_username !== '');

        return array(
            'wpUserId' => (int) $user->ID,
            'email' => $user->user_email,
            'displayName' => $user->display_name,
            'username' => (string) $user->user_login,
            'platformUsername' => $platform_username,
            'onboardingCompleted' => $onboarding_completed,
            'emailVerified' => $email_verified_at !== '',
            'role' => implode(',', $user->roles),
        );
    }
}

if (!function_exists('platform_submissions_taxonomy_for_kind')) {
    function platform_submissions_taxonomy_for_kind($kind) {
        if ($kind === 'directory') {
            return 'directory_category';
        }

        if ($kind === 'classified') {
            return 'classified_category';
        }

        if ($kind === 'tender') {
            return 'tender_category';
        }

        if ($kind === 'job') {
            return 'job_category';
        }

        return '';
    }
}

if (!function_exists('platform_submissions_map_term_payload')) {
    function platform_submissions_map_term_payload($term, $taxonomy) {
        $parent_id = isset($term->parent) ? absint($term->parent) : 0;
        $parent_name = '';
        $parent_slug = '';
        if ($parent_id > 0) {
            $parent_term = get_term($parent_id, $taxonomy);
            if ($parent_term instanceof WP_Term && !is_wp_error($parent_term)) {
                $parent_name = platform_submissions_decode_html_entities((string) $parent_term->name);
                $parent_slug = (string) $parent_term->slug;
            }
        }

        $payload = array(
            'id' => (int) $term->term_id,
            'name' => platform_submissions_decode_html_entities((string) $term->name),
            'slug' => (string) $term->slug,
            'count' => (int) $term->count,
            'order' => absint(get_term_meta($term->term_id, 'platform_term_order', true)),
            'parentId' => $parent_id,
            'parentName' => $parent_name,
            'parentSlug' => $parent_slug,
        );

        if ($taxonomy === 'classified_category') {
            $allowed_tag_ids = platform_submissions_get_allowed_classified_product_tag_ids_for_category($term->term_id);
            $allowed_tag_names = array();
            $allowed_tag_slugs = array();

            if (!empty($allowed_tag_ids) && taxonomy_exists('classified_product_tag')) {
                $allowed_terms = get_terms(array(
                    'taxonomy' => 'classified_product_tag',
                    'hide_empty' => false,
                    'include' => $allowed_tag_ids,
                ));

                if (!is_wp_error($allowed_terms) && is_array($allowed_terms)) {
                    foreach ($allowed_terms as $allowed_term) {
                        $allowed_tag_names[] = platform_submissions_decode_html_entities((string) $allowed_term->name);
                        $allowed_tag_slugs[] = (string) $allowed_term->slug;
                    }
                }
            }

            $payload['productTagIds'] = $allowed_tag_ids;
            $payload['productTagNames'] = $allowed_tag_names;
            $payload['productTagSlugs'] = $allowed_tag_slugs;
            $payload['productTagsConfigured'] = !empty($allowed_tag_ids);
        }

        return $payload;
    }
}

if (!function_exists('platform_submissions_assign_classified_product_tag')) {
    function platform_submissions_assign_classified_product_tag($post_id, $product_tag_name = '') {
        if (!taxonomy_exists('classified_product_tag')) {
            return;
        }

        $product_tag_name = sanitize_text_field((string) $product_tag_name);
        if ($product_tag_name === '') {
            wp_set_object_terms($post_id, array(), 'classified_product_tag', false);
            return;
        }

        $term = term_exists($product_tag_name, 'classified_product_tag');
        if (!$term) {
            $term = wp_insert_term($product_tag_name, 'classified_product_tag');
        }

        if (!is_wp_error($term)) {
            wp_set_object_terms($post_id, array($product_tag_name), 'classified_product_tag', false);
        }
    }
}

if (!function_exists('platform_submissions_get_assigned_classified_product_tag')) {
    function platform_submissions_get_assigned_classified_product_tag($post_id) {
        if (!taxonomy_exists('classified_product_tag')) {
            return '';
        }

        $terms = get_the_terms($post_id, 'classified_product_tag');
        if (is_wp_error($terms) || !is_array($terms) || empty($terms)) {
            return '';
        }

        usort($terms, function ($left, $right) {
            $left_order = absint(get_term_meta($left->term_id, 'platform_term_order', true));
            $right_order = absint(get_term_meta($right->term_id, 'platform_term_order', true));

            if ($left_order === $right_order) {
                return strcasecmp((string) $left->name, (string) $right->name);
            }

            return $left_order <=> $right_order;
        });

        return sanitize_text_field((string) $terms[0]->name);
    }
}

if (!function_exists('platform_submissions_location_taxonomy_for_kind')) {
    function platform_submissions_location_taxonomy_for_kind($kind) {
        if ($kind === 'directory') {
            return 'directory_location';
        }

        if ($kind === 'classified') {
            return 'listing_location';
        }

        if ($kind === 'job') {
            return 'listing_location';
        }

        if ($kind === 'tender') {
            return 'listing_location';
        }

        return '';
    }
}

if (!function_exists('platform_submissions_sanitize_string_list')) {
    function platform_submissions_sanitize_string_list($raw_values, $limit = 0) {
        $values = array();

        if (is_array($raw_values)) {
            $values = $raw_values;
        } elseif (is_string($raw_values)) {
            $decoded = json_decode($raw_values, true);
            if (is_array($decoded)) {
                $values = $decoded;
            } else {
                $values = preg_split('/[\r\n,]+/', $raw_values);
            }
        }

        $sanitized = array();
        foreach ((array) $values as $value) {
            $clean = platform_submissions_decode_html_entities((string) $value);
            $clean = wp_unslash($clean);
            $clean = platform_submissions_decode_escaped_unicode_sequences($clean);
            $clean = sanitize_text_field($clean);
            if ($clean !== '') {
                $sanitized[] = $clean;
            }
        }

        $sanitized = array_values(array_unique($sanitized));
        if ($limit > 0) {
            $sanitized = array_slice($sanitized, 0, $limit);
        }

        return $sanitized;
    }
}

if (!function_exists('platform_submissions_get_job_skills')) {
    function platform_submissions_get_job_skills($post_id) {
        return platform_submissions_sanitize_string_list((string) get_post_meta($post_id, 'skills', true), 5);
    }
}

if (!function_exists('platform_submissions_find_location_term_by_name')) {
    function platform_submissions_find_location_term_by_name($taxonomy, $term_name, $parent_id = 0) {
        $term_name = sanitize_text_field((string) $term_name);
        $parent_id = absint($parent_id);
        if ($taxonomy === '' || $term_name === '' || !taxonomy_exists($taxonomy)) {
            return null;
        }

        $terms = get_terms(array(
            'taxonomy' => $taxonomy,
            'hide_empty' => false,
            'name' => $term_name,
        ));

        if (is_wp_error($terms) || !is_array($terms)) {
            return null;
        }

        foreach ($terms as $term) {
            if ($term instanceof WP_Term && absint($term->parent) === $parent_id) {
                return $term;
            }
        }

        return null;
    }
}

if (!function_exists('platform_submissions_ensure_location_term')) {
    function platform_submissions_ensure_location_term($taxonomy, $term_name, $parent_id = 0) {
        $term_name = sanitize_text_field((string) $term_name);
        $parent_id = absint($parent_id);
        if ($taxonomy === '' || $term_name === '' || !taxonomy_exists($taxonomy)) {
            return null;
        }

        $existing_term = platform_submissions_find_location_term_by_name($taxonomy, $term_name, $parent_id);
        if ($existing_term instanceof WP_Term) {
            return $existing_term;
        }

        $insert_args = array();
        if ($parent_id > 0) {
            $insert_args['parent'] = $parent_id;
        }

        $inserted = wp_insert_term($term_name, $taxonomy, $insert_args);
        if (is_wp_error($inserted) || empty($inserted['term_id'])) {
            return null;
        }

        $inserted_term = get_term((int) $inserted['term_id'], $taxonomy);
        return ($inserted_term instanceof WP_Term && !is_wp_error($inserted_term)) ? $inserted_term : null;
    }
}

if (!function_exists('platform_submissions_copy_location_term_to_taxonomy')) {
    function platform_submissions_copy_location_term_to_taxonomy($source_taxonomy, WP_Term $source_term, $target_taxonomy, &$copied_term_ids = array()) {
        $cache_key = sprintf('%s:%d', sanitize_key($source_taxonomy), absint($source_term->term_id));
        if (isset($copied_term_ids[$cache_key]) && absint($copied_term_ids[$cache_key]) > 0) {
            return get_term(absint($copied_term_ids[$cache_key]), $target_taxonomy);
        }

        $target_parent_id = 0;
        if (absint($source_term->parent) > 0) {
            $source_parent = get_term((int) $source_term->parent, $source_taxonomy);
            if ($source_parent instanceof WP_Term && !is_wp_error($source_parent)) {
                $target_parent = platform_submissions_copy_location_term_to_taxonomy($source_taxonomy, $source_parent, $target_taxonomy, $copied_term_ids);
                if ($target_parent instanceof WP_Term && !is_wp_error($target_parent)) {
                    $target_parent_id = absint($target_parent->term_id);
                }
            }
        }

        $target_term = platform_submissions_ensure_location_term($target_taxonomy, (string) $source_term->name, $target_parent_id);
        if ($target_term instanceof WP_Term && !is_wp_error($target_term)) {
            $copied_term_ids[$cache_key] = absint($target_term->term_id);
            $order = get_term_meta($source_term->term_id, 'platform_term_order', true);
            if ($order !== '' && !metadata_exists('term', $target_term->term_id, 'platform_term_order')) {
                update_term_meta($target_term->term_id, 'platform_term_order', absint($order));
            }
        }

        return $target_term;
    }
}

if (!function_exists('platform_submissions_migrate_shared_locations')) {
    function platform_submissions_migrate_shared_locations($force = false) {
        $migration_version = 'v1';
        $option_key = 'platform_submissions_shared_location_migration_version';
        $already_migrated = (string) get_option($option_key, '');
        if (!$force && $already_migrated === $migration_version) {
            return;
        }

        $shared_taxonomy = 'listing_location';
        if (!taxonomy_exists($shared_taxonomy)) {
            return;
        }

        $legacy_mappings = array(
            'classified' => array(
                'taxonomy' => 'classified_location',
                'post_type' => 'classified_ad',
            ),
            'job' => array(
                'taxonomy' => 'job_location',
                'post_type' => 'job_offer',
            ),
        );

        foreach ($legacy_mappings as $mapping) {
            $legacy_taxonomy = (string) $mapping['taxonomy'];
            if (!taxonomy_exists($legacy_taxonomy)) {
                continue;
            }

            $legacy_terms = get_terms(array(
                'taxonomy' => $legacy_taxonomy,
                'hide_empty' => false,
            ));

            if (!is_wp_error($legacy_terms) && is_array($legacy_terms)) {
                $copied_term_ids = array();
                foreach ($legacy_terms as $legacy_term) {
                    if ($legacy_term instanceof WP_Term) {
                        platform_submissions_copy_location_term_to_taxonomy($legacy_taxonomy, $legacy_term, $shared_taxonomy, $copied_term_ids);
                    }
                }
            }
        }

        foreach ($legacy_mappings as $kind => $mapping) {
            $post_ids = get_posts(array(
                'post_type' => (string) $mapping['post_type'],
                'post_status' => array('publish', 'pending', 'draft', 'private', 'future'),
                'posts_per_page' => -1,
                'fields' => 'ids',
                'suppress_filters' => false,
            ));

            foreach ($post_ids as $post_id) {
                $post_id = absint($post_id);
                if ($post_id <= 0) {
                    continue;
                }

                $city_name = sanitize_text_field((string) get_post_meta($post_id, 'city', true));
                $area_name = sanitize_text_field((string) get_post_meta($post_id, 'area', true));

                if ($city_name === '' && taxonomy_exists((string) $mapping['taxonomy'])) {
                    $resolved_location = platform_submissions_resolve_location_terms($post_id, (string) $mapping['taxonomy']);
                    $city_name = sanitize_text_field((string) ($resolved_location['regions'][0] ?? ''));
                    $area_name = sanitize_text_field((string) ($resolved_location['cities'][0] ?? ''));
                }

                if ($city_name === '' && $area_name === '') {
                    continue;
                }

                platform_submissions_assign_structured_location($post_id, (string) $kind, array(
                    'city' => $city_name,
                    'area' => $area_name,
                    'location' => sanitize_text_field((string) get_post_meta($post_id, 'location', true)),
                ));
            }
        }

        update_option($option_key, $migration_version, false);
    }
}

if (!function_exists('platform_submissions_migrate_shared_locations_batch')) {
    function platform_submissions_migrate_shared_locations_batch($batch = 200, $offset = 0, $dry_run = false) {
        $batch = max(1, min(500, absint($batch)));
        $offset = max(0, absint($offset));
        $mappings = array(
            'classified_ad' => array('kind' => 'classified', 'taxonomy' => 'classified_location'),
            'job_offer' => array('kind' => 'job', 'taxonomy' => 'job_location'),
            'tender_notice' => array('kind' => 'tender', 'taxonomy' => 'tender_location'),
        );
        $report = array('checked' => 0, 'migrated' => 0, 'nextOffset' => $offset, 'hasMore' => false);

        if ($offset === 0 && !$dry_run) {
            foreach ($mappings as $mapping) {
                if (!taxonomy_exists($mapping['taxonomy'])) continue;
                $terms = get_terms(array('taxonomy' => $mapping['taxonomy'], 'hide_empty' => false));
                if (is_wp_error($terms)) continue;
                $copied = array();
                foreach ($terms as $term) {
                    if ($term instanceof WP_Term) {
                        platform_submissions_copy_location_term_to_taxonomy($mapping['taxonomy'], $term, 'listing_location', $copied);
                    }
                }
            }
        }

        $posts = get_posts(array(
            'post_type' => array_keys($mappings),
            'post_status' => array('publish', 'pending', 'draft', 'private', 'future'),
            'posts_per_page' => $batch,
            'offset' => $offset,
            'orderby' => 'ID',
            'order' => 'ASC',
        ));
        foreach ($posts as $post) {
            $report['checked']++;
            $mapping = $mappings[$post->post_type];
            $city = sanitize_text_field((string) get_post_meta($post->ID, 'city', true));
            $area = sanitize_text_field((string) get_post_meta($post->ID, 'area', true));
            if (($city === '' && $area === '') && taxonomy_exists($mapping['taxonomy'])) {
                $legacy = platform_submissions_resolve_location_terms($post->ID, $mapping['taxonomy']);
                $city = sanitize_text_field((string) ($legacy['regions'][0] ?? ''));
                $area = sanitize_text_field((string) ($legacy['cities'][0] ?? ''));
            }
            if ($city === '' && $area === '') continue;
            $report['migrated']++;
            if (!$dry_run) {
                platform_submissions_assign_structured_location($post->ID, $mapping['kind'], array('city' => $city, 'area' => $area));
            }
        }
        $report['nextOffset'] = $offset + $report['checked'];
        $report['hasMore'] = $report['checked'] === $batch;
        return $report;
    }
}

if (!function_exists('platform_submissions_build_location_display_value')) {
    function platform_submissions_build_location_display_value($city_name, $area_name = '') {
        $city_name = sanitize_text_field((string) $city_name);
        $area_name = sanitize_text_field((string) $area_name);

        if ($area_name !== '' && $city_name !== '') {
            return sprintf('%s, %s', $area_name, $city_name);
        }

        return $city_name;
    }
}

if (!function_exists('platform_submissions_assign_structured_location')) {
    function platform_submissions_assign_structured_location($post_id, $kind, $payload) {
        $post_id = absint($post_id);
        $taxonomy = platform_submissions_location_taxonomy_for_kind($kind);
        $city_name = sanitize_text_field((string) ($payload['city'] ?? ''));
        $area_name = sanitize_text_field((string) ($payload['area'] ?? ''));
        $fallback_location = sanitize_text_field((string) ($payload['location'] ?? ''));

        if ($post_id <= 0) {
            return array(
                'location' => $fallback_location,
                'city' => $city_name,
                'area' => $area_name,
            );
        }

        if ($taxonomy === '' || !taxonomy_exists($taxonomy) || ($city_name === '' && $area_name === '')) {
            if ($fallback_location === '') {
                delete_post_meta($post_id, 'city');
                delete_post_meta($post_id, 'area');
            } else {
                update_post_meta($post_id, 'city', $city_name);
                update_post_meta($post_id, 'area', $area_name);
            }

            return array(
                'location' => $fallback_location,
                'city' => $city_name,
                'area' => $area_name,
            );
        }

        $city_term = platform_submissions_ensure_location_term($taxonomy, $city_name, 0);
        $assigned_terms = array();
        if ($city_term instanceof WP_Term) {
            $assigned_terms[] = absint($city_term->term_id);
        }

        $resolved_city_name = $city_term instanceof WP_Term ? (string) $city_term->name : $city_name;
        $resolved_area_name = '';
        if ($area_name !== '' && $city_term instanceof WP_Term) {
            $area_term = platform_submissions_ensure_location_term($taxonomy, $area_name, (int) $city_term->term_id);
            if ($area_term instanceof WP_Term) {
                $assigned_terms = array(absint($area_term->term_id));
                $resolved_area_name = (string) $area_term->name;
            }
        }

        if (!empty($assigned_terms)) {
            wp_set_object_terms($post_id, $assigned_terms, $taxonomy, false);
        }

        $display_value = platform_submissions_build_location_display_value($resolved_city_name, $resolved_area_name);
        if ($display_value !== '') {
            update_post_meta($post_id, 'location', $display_value);
        } elseif ($fallback_location !== '') {
            update_post_meta($post_id, 'location', $fallback_location);
            $display_value = $fallback_location;
        } else {
            delete_post_meta($post_id, 'location');
        }

        if ($resolved_city_name !== '') {
            update_post_meta($post_id, 'city', $resolved_city_name);
        } else {
            delete_post_meta($post_id, 'city');
        }

        if ($resolved_area_name !== '') {
            update_post_meta($post_id, 'area', $resolved_area_name);
        } else {
            delete_post_meta($post_id, 'area');
        }

        return array(
            'location' => $display_value,
            'city' => $resolved_city_name,
            'area' => $resolved_area_name,
        );
    }
}

if (!function_exists('platform_submissions_insert_content')) {
    /**
     * User submissions must not wait for the public cache webhook. The webhook
     * module persists its own Action Scheduler job before this callback returns.
     */
    function platform_submissions_with_deferred_revalidation($callback, $post_ids = array(), $defer_profile = false) {
        $post_ids = array_values(array_filter(array_map('absint', is_array($post_ids) ? $post_ids : array())));
        $defer_all_posts = empty($post_ids);
        $defer_post_payload = function ($defer, $post_id) use ($post_ids, $defer_all_posts) {
            return $defer || $defer_all_posts || in_array(absint($post_id), $post_ids, true);
        };
        $defer_taxonomy_payload = function ($defer) {
            return true;
        };
        $defer_profile_payload = function ($defer) use ($defer_profile) {
            return $defer || $defer_profile;
        };

        add_filter('next_revalidate_defer_post_payload', $defer_post_payload, 10, 2);
        add_filter('next_revalidate_defer_taxonomy_payload', $defer_taxonomy_payload, 10, 4);
        if ($defer_profile) {
            add_filter('next_revalidate_defer_profile_payload', $defer_profile_payload, 10, 3);
        }

        try {
            return call_user_func($callback);
        } finally {
            remove_filter('next_revalidate_defer_post_payload', $defer_post_payload, 10);
            remove_filter('next_revalidate_defer_taxonomy_payload', $defer_taxonomy_payload, 10);
            if ($defer_profile) {
                remove_filter('next_revalidate_defer_profile_payload', $defer_profile_payload, 10);
            }
        }
    }

    function platform_submissions_log_slow_content_insert($kind, $post_id, $timings) {
        $total_ms = absint($timings['totalMs'] ?? 0);
        if ($total_ms < 500 || !function_exists('platform_2424_log_event')) {
            return;
        }

        platform_2424_log_event('warning', 'submissions', 'Finalisation de soumission lente.', array(
            'kind' => sanitize_key($kind),
            'postId' => absint($post_id),
            'userSyncMs' => absint($timings['userSyncMs'] ?? 0),
            'postInsertMs' => absint($timings['postInsertMs'] ?? 0),
            'metadataMs' => absint($timings['metadataMs'] ?? 0),
            'taxonomyMs' => absint($timings['taxonomyMs'] ?? 0),
            'locationMs' => absint($timings['locationMs'] ?? 0),
            'mediaMs' => absint($timings['mediaMs'] ?? 0),
            'totalMs' => $total_ms,
            'revalidation' => 'deferred',
        ));
    }

    function platform_submissions_get_idempotency_option_key($kind, $payload) {
        $request_id = sanitize_text_field((string) ($payload['requestId'] ?? ''));
        $author_payload = isset($payload['author']) && is_array($payload['author']) ? $payload['author'] : array();
        $author_identity = sanitize_email((string) ($author_payload['email'] ?? ''));
        if ($request_id === '' || $author_identity === '') {
            return '';
        }

        return 'platform_submission_request_' . md5(sanitize_key((string) $kind) . '|' . strtolower($author_identity) . '|' . $request_id);
    }

    function platform_submissions_build_insert_result($post_id) {
        $post = get_post($post_id);
        if (!$post) {
            return null;
        }

        $finalization_status = sanitize_key((string) get_post_meta($post_id, '_platform_submission_finalization_status', true));

        $result = array(
            'id' => (int) $post->ID,
            'postType' => (string) $post->post_type,
            'status' => (string) $post->post_status,
            'editLink' => get_edit_post_link($post->ID, 'raw'),
        );
        if ($finalization_status !== '') {
            $result['finalizationStatus'] = $finalization_status;
        }

        return $result;
    }

    function platform_submissions_get_idempotency_recovery($existing, $kind) {
        if (!is_array($existing)) {
            return null;
        }

        $post_id = absint($existing['postId'] ?? 0);
        $created_at = absint($existing['createdAt'] ?? 0);
        $expected_post_type = platform_submissions_map_kind_to_post_type($kind);
        $post = $post_id > 0 ? get_post($post_id) : null;

        if ($post && (string) $post->post_type === $expected_post_type) {
            // The original request may still be attaching media. Let it finish
            // briefly, then return the durable draft instead of holding the
            // customer behind a stale idempotency lock.
            if ($kind !== 'classified' && $created_at > 0 && (time() - $created_at) < 15) {
                return new WP_Error(
                    'platform_submissions_request_in_progress',
                    'Cette demande est en cours de finalisation.',
                    array('status' => 409, 'retryAfterMs' => 1500)
                );
            }

            $result = platform_submissions_build_insert_result($post_id);
            if (is_array($result)) {
                $result['recovered'] = true;
                return $result;
            }
        }

        if (!empty($existing['result']) && is_array($existing['result'])) {
            return $existing['result'];
        }

        return null;
    }

    function platform_submissions_classified_finalization_hook() {
        return 'platform_submissions_finalize_classified_action';
    }

    function platform_submissions_classified_finalization_group() {
        return '2424-classified-finalization';
    }

    function platform_submissions_classified_finalization_retry_delays() {
        return array(MINUTE_IN_SECONDS, 5 * MINUTE_IN_SECONDS, 30 * MINUTE_IN_SECONDS, 2 * HOUR_IN_SECONDS);
    }

    function platform_submissions_schedule_classified_finalization($post_id, $attempt = 0, $scheduled_at = null) {
        if (!function_exists('as_schedule_single_action')) {
            return new WP_Error('platform_submissions_action_scheduler_unavailable', 'Action Scheduler indisponible.');
        }

        $post_id = absint($post_id);
        if ($post_id <= 0) {
            return new WP_Error('platform_submissions_invalid_finalization', 'Annonce invalide.');
        }

        return as_schedule_single_action(
            max(time() + 1, $scheduled_at === null ? time() + 1 : absint($scheduled_at)),
            platform_submissions_classified_finalization_hook(),
            array(array('postId' => $post_id, 'attempt' => max(0, absint($attempt)))),
            platform_submissions_classified_finalization_group(),
            true
        );
    }

    function platform_submissions_update_classified_finalization_status($post_id, $status, $error = '') {
        update_post_meta($post_id, '_platform_submission_finalization_status', sanitize_key($status));
        update_post_meta($post_id, '_platform_submission_finalization_updated_at', gmdate('c'));
        if ($error === '') {
            delete_post_meta($post_id, '_platform_submission_finalization_error');
        } else {
            update_post_meta($post_id, '_platform_submission_finalization_error', sanitize_text_field($error));
        }
    }

    function platform_submissions_get_finalization_media_descriptors($payload) {
        if (!is_array($payload)) {
            return array();
        }
        $urls = array_filter(array_merge(
            array((string) ($payload['featuredImageUrl'] ?? '')),
            isset($payload['galleryImageUrls']) && is_array($payload['galleryImageUrls']) ? $payload['galleryImageUrls'] : array()
        ));
        return platform_submissions_normalize_media_descriptors(array_map(function ($url) {
            return platform_submissions_get_media_descriptor($url);
        }, $urls));
    }

    function platform_submissions_cancel_classified_finalization($post_id) {
        $payload = get_post_meta($post_id, '_platform_submission_finalization_payload', true);
        if (!is_array($payload)) {
            return false;
        }

        delete_post_meta($post_id, '_platform_submission_finalization_payload');
        platform_submissions_update_classified_finalization_status($post_id, 'cancelled');
        platform_submissions_log_media_cleanup('info', 'Finalisation annulee pour une annonce supprimee.', array(
            'sourcePostId' => absint($post_id),
        ));
        return true;
    }

    function platform_submissions_finalize_classified_submission($post_id) {
        $payload = get_post_meta($post_id, '_platform_submission_finalization_payload', true);
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'classified_ad' || !is_array($payload)) {
            return new WP_Error('platform_submissions_finalization_payload_missing', 'Preparation de l annonce introuvable.');
        }
        if ($post->post_status === 'trash' || sanitize_key((string) get_post_meta($post_id, '_platform_submission_finalization_status', true)) === 'cancelled') {
            return array('cancelled' => true);
        }

        $author_id = absint($post->post_author);
        $meta = array(
            'submission_source' => 'next-frontend',
            'auth_user_id' => sanitize_text_field((string) ($payload['author']['auth0Sub'] ?? '')),
            'contact_email' => sanitize_email((string) ($payload['contactEmail'] ?? ($payload['author']['email'] ?? ''))),
            'location' => sanitize_text_field((string) ($payload['location'] ?? '')),
            'city' => sanitize_text_field((string) ($payload['city'] ?? '')),
            'area' => sanitize_text_field((string) ($payload['area'] ?? '')),
            'price' => sanitize_text_field((string) ($payload['price'] ?? '')),
            'currency' => sanitize_text_field((string) ($payload['currency'] ?? 'MGA')),
            'payment_status' => 'unpaid',
            'contact_phone' => sanitize_text_field((string) ($payload['contactPhone'] ?? '')),
            'contact_phone_country' => sanitize_key((string) ($payload['contactPhoneCountry'] ?? '')),
            'company_name' => sanitize_text_field((string) ($payload['companyName'] ?? '')),
            'condition' => sanitize_text_field((string) ($payload['condition'] ?? '')),
        );
        foreach ($meta as $meta_key => $meta_value) {
            if ($meta_value !== '') {
                update_post_meta($post_id, $meta_key, $meta_value);
            }
        }
        $category_name = sanitize_text_field((string) ($payload['category'] ?? ''));
        if ($category_name !== '') {
            platform_submissions_assign_taxonomy_selection(
                $post_id,
                platform_submissions_taxonomy_for_kind('classified'),
                $category_name,
                sanitize_text_field((string) ($payload['type'] ?? ''))
            );
        }
        platform_submissions_assign_classified_product_tag($post_id, sanitize_text_field((string) ($payload['productTag'] ?? '')));
        platform_submissions_assign_structured_location($post_id, 'classified', $payload);

        $post = get_post($post_id);
        if (!$post || $post->post_status === 'trash' || sanitize_key((string) get_post_meta($post_id, '_platform_submission_finalization_status', true)) === 'cancelled') {
            return array('cancelled' => true);
        }
        $image_result = platform_submissions_attach_images_to_post($post_id, 'classified_ad', $author_id, $payload);
        if (is_wp_error($image_result)) {
            return $image_result;
        }

        delete_post_meta($post_id, '_platform_submission_finalization_payload');
        return true;
    }

    function platform_submissions_process_classified_finalization_action($job) {
        $post_id = absint($job['postId'] ?? 0);
        $attempt = max(0, absint($job['attempt'] ?? 0));
        if ($post_id <= 0) {
            return;
        }
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'classified_ad' || $post->post_status === 'trash'
            || sanitize_key((string) get_post_meta($post_id, '_platform_submission_finalization_status', true)) === 'cancelled') {
            return;
        }

        $lock_key = '_platform_submission_finalization_lock';
        $lock_acquired = add_post_meta($post_id, $lock_key, time(), true);
        if (!$lock_acquired) {
            $locked_at = absint(get_post_meta($post_id, $lock_key, true));
            if ($locked_at > 0 && (time() - $locked_at) > 10 * MINUTE_IN_SECONDS) {
                update_post_meta($post_id, $lock_key, time());
            } else {
                return;
            }
        }

        $started_at = microtime(true);
        platform_submissions_update_classified_finalization_status($post_id, 'processing');
        try {
            $result = platform_submissions_finalize_classified_submission($post_id);
            if (is_wp_error($result)) {
                throw new RuntimeException($result->get_error_message());
            }
            if (is_array($result) && !empty($result['cancelled'])) {
                platform_submissions_update_classified_finalization_status($post_id, 'cancelled');
                return;
            }

            $post_after_finalization = get_post($post_id);
            if ($post_after_finalization && $post_after_finalization->post_status === 'trash') {
                platform_submissions_cleanup_media_descriptors(platform_submissions_get_listing_media_descriptors($post_id), $post_id);
                platform_submissions_update_classified_finalization_status($post_id, 'cancelled');
                return;
            }

            platform_submissions_update_classified_finalization_status($post_id, 'ready');
            update_post_meta($post_id, '_platform_submission_finalization_completed_at', gmdate('c'));
            if (function_exists('platform_2424_log_event')) {
                platform_2424_log_event('info', 'submissions', 'Finalisation d annonce terminee.', array(
                    'postId' => $post_id,
                    'durationMs' => (int) round((microtime(true) - $started_at) * 1000),
                ));
            }
        } catch (Throwable $error) {
            $delays = platform_submissions_classified_finalization_retry_delays();
            if ($attempt < count($delays)) {
                platform_submissions_update_classified_finalization_status($post_id, 'retrying', $error->getMessage());
                update_post_meta($post_id, '_platform_submission_finalization_attempts', $attempt + 1);
                platform_submissions_schedule_classified_finalization($post_id, $attempt + 1, time() + $delays[$attempt]);
            } else {
                platform_submissions_update_classified_finalization_status($post_id, 'failed', $error->getMessage());
                if (function_exists('platform_2424_log_event')) {
                    platform_2424_log_event('error', 'submissions', 'Finalisation d annonce echouee.', array('postId' => $post_id));
                }
            }
        } finally {
            delete_post_meta($post_id, $lock_key);
        }
    }
    add_action('platform_submissions_finalize_classified_action', 'platform_submissions_process_classified_finalization_action', 10, 1);

    function platform_submissions_get_classified_finalization_status($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);
        $post = $listing_id > 0 ? get_post($listing_id) : null;
        if (!$post || $post->post_type !== 'classified_ad') {
            return new WP_Error('platform_submissions_listing_not_found', 'Annonce introuvable.', array('status' => 404));
        }
        if ($user_id <= 0 || (int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Cette annonce ne vous appartient pas.', array('status' => 403));
        }

        return array(
            'listingId' => $listing_id,
            'finalizationStatus' => sanitize_key((string) get_post_meta($listing_id, '_platform_submission_finalization_status', true)) ?: 'ready',
            'updatedAt' => sanitize_text_field((string) get_post_meta($listing_id, '_platform_submission_finalization_updated_at', true)),
            'message' => sanitize_key((string) get_post_meta($listing_id, '_platform_submission_finalization_status', true)) === 'failed'
                ? 'La preparation de l annonce a echoue. Vous pouvez la modifier puis reessayer.'
                : '',
        );
    }

    function platform_submissions_insert_content($kind, $payload) {
        $started_at = microtime(true);
        $timings = array(
            'userSyncMs' => 0,
            'postInsertMs' => 0,
            'metadataMs' => 0,
            'taxonomyMs' => 0,
            'locationMs' => 0,
            'mediaMs' => 0,
        );
        $idempotency_option_key = platform_submissions_get_idempotency_option_key($kind, $payload);
        if ($idempotency_option_key !== '') {
            $existing = get_option($idempotency_option_key, false);
            $recovery = platform_submissions_get_idempotency_recovery($existing, $kind);
            if (is_array($recovery) || is_wp_error($recovery)) {
                return $recovery;
            }

            $created_at = is_array($existing) ? absint($existing['createdAt'] ?? 0) : 0;
            if ($created_at > 0 && (time() - $created_at) < 10 * MINUTE_IN_SECONDS) {
                return new WP_Error('platform_submissions_request_in_progress', 'Cette demande est deja en cours de traitement.', array('status' => 409));
            }

            if ($existing !== false) {
                delete_option($idempotency_option_key);
            }

            if (!add_option($idempotency_option_key, array('createdAt' => time()), '', 'no')) {
                $existing = get_option($idempotency_option_key, false);
                $recovery = platform_submissions_get_idempotency_recovery($existing, $kind);
                if (is_array($recovery) || is_wp_error($recovery)) {
                    return $recovery;
                }

                return new WP_Error('platform_submissions_request_in_progress', 'Cette demande est deja en cours de traitement.', array('status' => 409));
            }
        }

        // Keep successful requests replayable, but never leave a failed draft locked.
        $release_idempotency_lock = function () use ($idempotency_option_key) {
            if ($idempotency_option_key !== '') {
                delete_option($idempotency_option_key);
            }
        };

        $author_payload = isset($payload['author']) && is_array($payload['author']) ? $payload['author'] : array();
        $step_started_at = microtime(true);
        $requested_author_id = absint($payload['wpUserId'] ?? 0);
        $existing_author = $requested_author_id > 0 ? get_user_by('id', $requested_author_id) : null;
        $user_sync = $existing_author instanceof WP_User
            ? array('wpUserId' => (int) $existing_author->ID)
            : platform_submissions_with_deferred_revalidation(function () use ($author_payload) {
                return platform_submissions_sync_user($author_payload);
            }, array(), true);
        $timings['userSyncMs'] = (int) round((microtime(true) - $step_started_at) * 1000);
        if (is_wp_error($user_sync)) {
            $release_idempotency_lock();
            return $user_sync;
        }

        $author_id = (int) $user_sync['wpUserId'];
        $title = sanitize_text_field(platform_submissions_decode_html_entities((string) ($payload['title'] ?? '')));
        $content = wp_kses_post((string) ($payload['content'] ?? ''));
        $excerpt = wp_kses_post((string) ($payload['excerpt'] ?? ''));

        if (!$title || !$content) {
            $release_idempotency_lock();
            return new WP_Error('platform_submissions_invalid_payload', 'Missing required submission fields.', array('status' => 400));
        }

        $post_type = 'post';
        $meta = array(
            'submission_source' => 'next-frontend',
            'auth_user_id' => sanitize_text_field((string) ($author_payload['auth0Sub'] ?? $author_payload['email'] ?? '')),
            'contact_email' => sanitize_email((string) ($payload['contactEmail'] ?? $author_payload['email'] ?? '')),
            'location' => sanitize_text_field((string) ($payload['location'] ?? '')),
            'city' => sanitize_text_field((string) ($payload['city'] ?? '')),
            'area' => sanitize_text_field((string) ($payload['area'] ?? '')),
            'price' => sanitize_text_field((string) ($payload['price'] ?? '')),
            'currency' => sanitize_text_field((string) ($payload['currency'] ?? 'MGA')),
            'budget' => sanitize_text_field((string) ($payload['budget'] ?? '')),
            'deadline' => sanitize_text_field((string) ($payload['deadline'] ?? '')),
            'details_pdf_url' => esc_url_raw((string) ($payload['detailsPdfUrl'] ?? '')),
            'details_pdf_name' => sanitize_text_field((string) ($payload['detailsPdfName'] ?? '')),
            'payment_status' => 'unpaid',
        );

        $category_name = sanitize_text_field((string) ($payload['category'] ?? ''));

        if ($kind === 'classified') {
            $post_type = 'classified_ad';
            $photo_limit_check = platform_submissions_validate_classified_photo_limit($payload, $author_id);
            if (is_wp_error($photo_limit_check)) {
                $release_idempotency_lock();
                return $photo_limit_check;
            }
            $meta['contact_phone'] = sanitize_text_field((string) ($payload['contactPhone'] ?? ''));
            $meta['contact_phone_country'] = sanitize_key((string) ($payload['contactPhoneCountry'] ?? ''));
            $meta['company_name'] = sanitize_text_field((string) ($payload['companyName'] ?? ''));
            $meta['condition'] = sanitize_text_field((string) ($payload['condition'] ?? ''));
        }

        if ($kind === 'tender') {
            $post_type = 'tender_notice';
            $meta['contact_phone'] = sanitize_text_field((string) ($payload['contactPhone'] ?? ''));
            $meta['contact_phone_country'] = sanitize_key((string) ($payload['contactPhoneCountry'] ?? ''));
            $meta['company_name'] = sanitize_text_field((string) ($payload['companyName'] ?? ''));
        }

        if ($kind === 'job') {
            $post_type = 'job_offer';
            $meta['contact_phone'] = sanitize_text_field((string) ($payload['contactPhone'] ?? ''));
            $meta['contact_phone_country'] = sanitize_key((string) ($payload['contactPhoneCountry'] ?? ''));
            $meta['company_name'] = sanitize_text_field((string) ($payload['companyName'] ?? ''));
            $meta['skills'] = wp_json_encode(platform_submissions_sanitize_string_list($payload['skills'] ?? array(), 5));
            $meta['experience_years'] = sanitize_text_field((string) ($payload['experienceYears'] ?? ''));
            $meta['need_by'] = sanitize_text_field((string) ($payload['needBy'] ?? ''));
        }

        $step_started_at = microtime(true);
        $post_id = platform_submissions_with_deferred_revalidation(function () use ($post_type, $title, $content, $excerpt, $author_id) {
            return wp_insert_post(array(
                'post_type' => $post_type,
                'post_status' => 'draft',
                'post_title' => $title,
                'post_content' => $content,
                'post_excerpt' => $excerpt,
                'post_author' => $author_id,
            ), true);
        });
        $timings['postInsertMs'] = (int) round((microtime(true) - $step_started_at) * 1000);

        if (is_wp_error($post_id)) {
            $release_idempotency_lock();
            return $post_id;
        }

        if ($idempotency_option_key !== '') {
            update_post_meta($post_id, '_platform_submission_request_id', sanitize_text_field((string) ($payload['requestId'] ?? '')));
            update_option($idempotency_option_key, array(
                'createdAt' => time(),
                'postId' => (int) $post_id,
                'status' => 'finalizing',
            ), false);
            if (function_exists('platform_2424_log')) {
                platform_2424_log('info', 'Annonce creee et en cours de finalisation.', array(
                    'kind' => $kind,
                    'postId' => (int) $post_id,
                ));
            }
        }

        $step_started_at = microtime(true);
        foreach ($meta as $meta_key => $meta_value) {
            if ($meta_value === '') {
                continue;
            }
            update_post_meta($post_id, $meta_key, $meta_value);
        }
        $timings['metadataMs'] = (int) round((microtime(true) - $step_started_at) * 1000);

        $step_started_at = microtime(true);
        platform_submissions_with_deferred_revalidation(function () use ($category_name, $kind, $payload, $post_id) {
            if ($category_name !== '') {
                $taxonomy = platform_submissions_taxonomy_for_kind($kind);
                $type_name = sanitize_text_field((string) ($payload['type'] ?? ''));
                platform_submissions_assign_taxonomy_selection($post_id, $taxonomy, $category_name, $type_name);
            }

            if ($kind === 'classified') {
                $product_tag_name = sanitize_text_field((string) ($payload['productTag'] ?? ''));
                platform_submissions_assign_classified_product_tag($post_id, $product_tag_name);
            }
        }, array($post_id));
        $timings['taxonomyMs'] = (int) round((microtime(true) - $step_started_at) * 1000);

        $step_started_at = microtime(true);
        platform_submissions_with_deferred_revalidation(function () use ($post_id, $kind, $payload) {
            return platform_submissions_assign_structured_location($post_id, $kind, $payload);
        }, array($post_id));
        $timings['locationMs'] = (int) round((microtime(true) - $step_started_at) * 1000);

        $step_started_at = microtime(true);
        $image_result = platform_submissions_attach_images_to_post($post_id, $post_type, $author_id, $payload);
        $timings['mediaMs'] = (int) round((microtime(true) - $step_started_at) * 1000);
        if (is_wp_error($image_result)) {
            wp_delete_post($post_id, true);
            $release_idempotency_lock();
            return $image_result;
        }

        $result = platform_submissions_build_insert_result($post_id);

        if ($idempotency_option_key !== '') {
            update_option($idempotency_option_key, array(
                'createdAt' => time(),
                'postId' => (int) $post_id,
                'status' => 'completed',
                'result' => $result,
            ), false);
        }

        if (function_exists('platform_2424_log')) {
            platform_2424_log('info', 'Annonce finalisee.', array(
                'kind' => $kind,
                'postId' => (int) $post_id,
            ));
        }

        $timings['totalMs'] = (int) round((microtime(true) - $started_at) * 1000);
        platform_submissions_log_slow_content_insert($kind, $post_id, $timings);

        return $result;
    }
}

if (!function_exists('platform_submissions_map_kind_to_post_type')) {
    function platform_submissions_map_kind_to_post_type($kind) {
        if ($kind === 'directory') {
            return 'annuaire';
        }

        if ($kind === 'classified') {
            return 'classified_ad';
        }

        if ($kind === 'tender') {
            return 'tender_notice';
        }

        if ($kind === 'job') {
            return 'job_offer';
        }

        return 'post';
    }
}

if (!function_exists('platform_submissions_map_post_type_to_kind')) {
    function platform_submissions_map_post_type_to_kind($post_type) {
        $post_type = sanitize_key((string) $post_type);
        if ($post_type === 'annuaire') {
            return 'directory';
        }

        if ($post_type === 'classified_ad') {
            return 'classified';
        }

        if ($post_type === 'tender_notice') {
            return 'tender';
        }

        if ($post_type === 'job_offer') {
            return 'job';
        }

        if ($post_type === 'post') {
            return 'news';
        }

        return '';
    }
}

if (!function_exists('platform_submissions_assign_taxonomy_selection')) {
    function platform_submissions_assign_taxonomy_selection($post_id, $taxonomy, $category_name, $type_name = '') {
        if ($post_id <= 0 || $taxonomy === '' || !taxonomy_exists($taxonomy)) {
            return;
        }

        $category_name = sanitize_text_field((string) $category_name);
        $type_name = sanitize_text_field((string) $type_name);
        $term_ids = array();
        $parent_term_id = 0;

        if ($category_name !== '') {
            $category_term = term_exists($category_name, $taxonomy);
            if (!$category_term) {
                $category_term = wp_insert_term($category_name, $taxonomy);
            }
            if (!is_wp_error($category_term) && !empty($category_term['term_id'])) {
                $parent_term_id = absint($category_term['term_id']);
                if ($parent_term_id > 0) {
                    $term_ids[] = $parent_term_id;
                }
            }
        }

        if ($type_name !== '') {
            $type_term = $parent_term_id > 0 ? term_exists($type_name, $taxonomy, $parent_term_id) : term_exists($type_name, $taxonomy);
            if (!$type_term) {
                $args = array();
                if ($parent_term_id > 0) {
                    $args['parent'] = $parent_term_id;
                }
                $type_term = wp_insert_term($type_name, $taxonomy, $args);
            }
            if (!is_wp_error($type_term) && !empty($type_term['term_id'])) {
                $type_term_id = absint($type_term['term_id']);
                if ($type_term_id > 0) {
                    $term_ids[] = $type_term_id;
                }
            }
        }

        if (!empty($term_ids)) {
            wp_set_object_terms($post_id, array_values(array_unique($term_ids)), $taxonomy, false);
        }
    }
}

if (!function_exists('platform_submissions_resolve_taxonomy_pair')) {
    function platform_submissions_resolve_taxonomy_pair($post_id, $taxonomy) {
        $result = array('category' => '', 'type' => '');
        if ($post_id <= 0 || $taxonomy === '' || !taxonomy_exists($taxonomy)) {
            return $result;
        }

        $assigned_terms = wp_get_object_terms($post_id, $taxonomy);
        if (!is_array($assigned_terms) || empty($assigned_terms)) {
            return $result;
        }

        usort($assigned_terms, function ($left, $right) {
            $left_order = absint(get_term_meta($left->term_id, 'platform_term_order', true));
            $right_order = absint(get_term_meta($right->term_id, 'platform_term_order', true));
            if ($left_order === $right_order) {
                return strcasecmp((string) $left->name, (string) $right->name);
            }
            return $left_order <=> $right_order;
        });

        foreach ($assigned_terms as $term) {
            if (!($term instanceof WP_Term)) {
                continue;
            }
            if (absint($term->parent) > 0) {
                $parent_term = get_term((int) $term->parent, $taxonomy);
                if ($parent_term instanceof WP_Term && !is_wp_error($parent_term)) {
                    $result['category'] = (string) $parent_term->name;
                    $result['type'] = (string) $term->name;
                    return $result;
                }
            }
        }

        $primary_term = $assigned_terms[0];
        if ($primary_term instanceof WP_Term) {
            $result['category'] = (string) $primary_term->name;
        }

        return $result;
    }
}

if (!function_exists('platform_submissions_get_default_pricing_code_for_post')) {
    function platform_submissions_get_default_pricing_code_for_post($post) {
        $post = get_post($post);
        if (!$post) {
            return '';
        }

        $kind = platform_submissions_map_post_type_to_kind($post->post_type);
        if ($kind === 'news') {
            return 'news_post_30d';
        }

        if ($kind === 'job') {
            return 'job_post_30d';
        }

        if ($kind === 'tender') {
            return 'tender_post_30d';
        }

        if ($kind === 'classified') {
            $gallery_images = get_post_meta($post->ID, 'gallery_images', true);
            $image_count = is_array($gallery_images) ? count($gallery_images) : 0;
            return $image_count > 1 ? 'classified_post_30d_4_photo' : 'classified_post_30d_1_photo';
        }

        return '';
    }
}

if (!function_exists('platform_submissions_get_boost_pricing_code_for_post')) {
    function platform_submissions_get_boost_pricing_code_for_post($post) {
        $post = get_post($post);
        if (!$post) {
            return '';
        }

        $kind = platform_submissions_map_post_type_to_kind($post->post_type);
        if ($kind === 'news') {
            return 'news_boost_7d';
        }

        if ($kind === 'job') {
            return 'job_boost_7d';
        }

        if ($kind === 'tender') {
            return 'tender_boost_7d';
        }

        if ($kind === 'classified') {
            return 'classified_boost_7d';
        }

        return '';
    }
}

if (!function_exists('platform_submissions_business_directory_statuses')) {
    function platform_submissions_business_directory_statuses() {
        return array('active', 'trialing');
    }
}

if (!function_exists('platform_submissions_get_directory_minimum_plan')) {
    function platform_submissions_get_directory_minimum_plan() {
        $value = get_option('platform_2424_directory_minimum_plan', 'essentiel');
        return function_exists('platform_2424_sanitize_directory_minimum_plan')
            ? platform_2424_sanitize_directory_minimum_plan($value)
            : (in_array($value, array('free', 'essentiel', 'business'), true) ? $value : 'essentiel');
    }
}

if (!function_exists('platform_submissions_is_business_user_visible_in_directory')) {
    function platform_submissions_is_business_user_visible_in_directory($user_id) {
        $user_id = absint($user_id);
        if ($user_id <= 0 || !function_exists('platform_billing_get_subscription_snapshot')) {
            return false;
        }

        // Stress-test accounts must never influence public directory queries.
        if ((string) get_user_meta($user_id, 'platform_2424_test_data', true) === '1') {
            return false;
        }

        // Administrators can remove a profile from public discovery without
        // changing its subscription or the account owner's preference.
        if ((string) get_user_meta($user_id, '_platform_directory_hidden_by_admin', true) === '1') {
            return false;
        }

        if (function_exists('platform_billing_user_has_all_privileges')
            && platform_billing_user_has_all_privileges($user_id)) {
            return (string) get_user_meta($user_id, '_platform_all_privileges_directory_visible', true) === '1';
        }

        $snapshot = platform_billing_get_subscription_snapshot($user_id);
        $plan_id = sanitize_key((string) ($snapshot['planId'] ?? ''));
        $status = sanitize_key((string) ($snapshot['status'] ?? 'none'));

        if (function_exists('platform_auth_get_directory_visibility_enabled') && !platform_auth_get_directory_visibility_enabled($user_id)) {
            return false;
        }

        $minimum_plan = platform_submissions_get_directory_minimum_plan();
        $meets_minimum = function_exists('platform_auth_plan_meets_minimum')
            ? platform_auth_plan_meets_minimum($plan_id, $minimum_plan)
            : in_array($plan_id, $minimum_plan === 'business' ? array('business') : ($minimum_plan === 'essentiel' ? array('essentiel', 'business') : array('free', 'essentiel', 'business')), true);
        if (!$meets_minimum) {
            return false;
        }

        // Free has no subscription lifecycle. When the administrator explicitly
        // selects Free, the profile visibility toggle is the eligibility gate.
        return $plan_id === 'free' && $minimum_plan === 'free'
            ? true
            : in_array($status, platform_submissions_business_directory_statuses(), true);
    }
}

if (!function_exists('platform_submissions_build_directory_business_item')) {
    function platform_submissions_get_string_list_meta($user_id, $meta_key) {
        $raw = get_user_meta((int) $user_id, (string) $meta_key, true);

        if (is_array($raw)) {
            $values = $raw;
        } else {
            $decoded = json_decode((string) $raw, true);
            $values = is_array($decoded) ? $decoded : array();
        }

        $sanitized = array();
        foreach ($values as $value) {
            $clean = sanitize_text_field((string) $value);
            if ($clean !== '') {
                $sanitized[] = $clean;
            }
        }

        return array_values(array_unique($sanitized));
    }

    function platform_submissions_resolve_location_terms($post_id, $taxonomy) {
        $result = array(
            'regions' => array(),
            'cities' => array(),
        );

        if ($post_id <= 0 || $taxonomy === '' || !taxonomy_exists($taxonomy)) {
            return $result;
        }

        $assigned_terms = wp_get_object_terms($post_id, $taxonomy);
        if (!is_array($assigned_terms) || empty($assigned_terms)) {
            return $result;
        }

        foreach ($assigned_terms as $term) {
            if (!($term instanceof WP_Term)) {
                continue;
            }

            if (absint($term->parent) > 0) {
                $parent_term = get_term((int) $term->parent, $taxonomy);
                if ($parent_term instanceof WP_Term && !is_wp_error($parent_term)) {
                    $result['regions'][] = (string) $parent_term->name;
                }
                $result['cities'][] = (string) $term->name;
                continue;
            }

            $result['regions'][] = (string) $term->name;
        }

        $result['regions'] = array_values(array_unique(array_filter(array_map('sanitize_text_field', $result['regions']))));
        $result['cities'] = array_values(array_unique(array_filter(array_map('sanitize_text_field', $result['cities']))));

        return $result;
    }

    function platform_submissions_build_directory_business_item(WP_User $user) {
        $user_id = absint($user->ID);
        if ($user_id <= 0 || !platform_submissions_is_business_user_visible_in_directory($user_id)) {
            return null;
        }

        $display_name = trim((string) $user->display_name);
        $profile_photo = trim((string) get_user_meta($user_id, 'profile_photo', true));
        $has_profile_photo = $profile_photo !== '';
        if (!$has_profile_photo) {
            $profile_photo = (string) get_avatar_url($user_id);
        }
        $company_logo = trim((string) get_user_meta($user_id, 'company_logo', true));

        $business_category = sanitize_text_field((string) get_user_meta($user_id, 'business_activity_category', true));
        $address = sanitize_text_field((string) get_user_meta($user_id, 'address', true));
        $business_regions = platform_submissions_get_string_list_meta($user_id, 'business_regions');
        $business_cities = platform_submissions_get_string_list_meta($user_id, 'business_cities');
        $phone = sanitize_text_field((string) get_user_meta($user_id, 'phone', true));
        $email = sanitize_email((string) $user->user_email);
        $featured = (string) get_user_meta($user_id, '_platform_directory_business_featured', true) === '1';
        $created_at = '';
        $rating_summary = platform_submissions_get_user_rating_summary($user_id);

        if ($user instanceof WP_User && !empty($user->user_registered) && $user->user_registered !== '0000-00-00 00:00:00') {
            $created_at = mysql2date('d/m/Y', $user->user_registered);
        }

        return array(
            'id' => -1 * $user_id,
            'title' => $display_name !== '' ? $display_name : (string) $user->user_login,
            'description' => '',
            'content' => '',
            'location' => $address !== '' ? $address : 'Madagascar',
            'date' => $created_at,
            'category' => $business_category !== '' ? $business_category : 'Business',
            'regions' => $business_regions,
            'cities' => $business_cities,
            'type' => '',
            'featured' => $featured,
            'image' => $profile_photo !== '' ? esc_url_raw($profile_photo) : '',
            'images' => $profile_photo !== '' ? array(esc_url_raw($profile_photo)) : array(),
            'contactPhone' => $phone,
            'contactPhoneCountry' => '',
            'contactEmail' => $email,
            'ownerWpUserId' => $user_id,
            'ownerEmail' => $email,
            'ownerRatingAverage' => (float) ($rating_summary['average'] ?? 0),
            'ownerRatingCount' => absint($rating_summary['count'] ?? 0),
            'companyName' => $display_name !== '' ? $display_name : (string) $user->user_login,
            'website' => '',
            'publisherName' => $display_name !== '' ? $display_name : (string) $user->user_login,
            'profilePhoto' => $profile_photo !== '' ? esc_url_raw($profile_photo) : '',
            // The generated WordPress avatar is not a directory photo. Keep
            // this distinction so the frontend can retain its initial-based
            // placeholder for companies without an uploaded image.
            'hasProfilePhoto' => $has_profile_photo,
            'companyLogo' => $company_logo !== '' ? esc_url_raw($company_logo) : '',
            'price' => '',
            'currency' => '',
            'budget' => '',
            'detailsPdfUrl' => '',
            'detailsPdfName' => '',
            'deadline' => '',
            'isAdminCreated' => false,
        );
    }
}

if (!function_exists('platform_submissions_directory_matches_filters')) {
    function platform_submissions_directory_matches_filters($item, $search = '', $category = '', $id = 0) {
        $item_id = absint($item['id'] ?? 0);
        if ($id > 0 && $item_id !== $id) {
            return false;
        }

        if ($category !== '') {
            $item_category = sanitize_text_field((string) ($item['category'] ?? ''));
            if (strcasecmp($item_category, $category) !== 0) {
                return false;
            }
        }

        if ($search !== '') {
            $haystack = implode(' ', array(
                (string) ($item['title'] ?? ''),
                (string) ($item['description'] ?? ''),
                (string) ($item['content'] ?? ''),
                (string) ($item['location'] ?? ''),
                (string) ($item['category'] ?? ''),
                implode(' ', array_map('sanitize_text_field', (array) ($item['regions'] ?? array()))),
                implode(' ', array_map('sanitize_text_field', (array) ($item['cities'] ?? array()))),
                (string) ($item['companyName'] ?? ''),
                (string) ($item['publisherName'] ?? ''),
            ));

            if (function_exists('mb_stripos')) {
                if (mb_stripos($haystack, $search) === false) {
                    return false;
                }
            } elseif (stripos($haystack, $search) === false) {
                return false;
            }
        }

        return true;
    }
}

if (!function_exists('platform_submissions_get_user_rating_summary')) {
    function platform_submissions_get_user_rating_summary($user_id) {
        $user_id = absint($user_id);
        if ($user_id <= 0) {
            return array(
                'average' => 0,
                'count' => 0,
            );
        }

        return array(
            'average' => (float) get_user_meta($user_id, 'rating_average', true),
            'count' => absint(get_user_meta($user_id, 'rating_count', true)),
        );
    }
}

if (!function_exists('platform_submissions_get_existing_user_rating')) {
    function platform_submissions_get_existing_user_rating($seller_user_id, $rater_user_id, $listing_id) {
        $seller_user_id = absint($seller_user_id);
        $rater_user_id = absint($rater_user_id);
        $listing_id = absint($listing_id);

        if ($seller_user_id <= 0 || $rater_user_id <= 0) {
            return null;
        }

        $existing_ratings = get_posts(array(
            'post_type' => 'platform_user_rating',
            'post_status' => array('publish'),
            'posts_per_page' => 1,
            'fields' => 'ids',
            'meta_query' => array(
                'relation' => 'AND',
                array(
                    'key' => 'seller_user_id',
                    'value' => $seller_user_id,
                    'compare' => '=',
                    'type' => 'NUMERIC',
                ),
                array(
                    'key' => 'rater_user_id',
                    'value' => $rater_user_id,
                    'compare' => '=',
                    'type' => 'NUMERIC',
                ),
            ),
            'orderby' => 'date',
            'order' => 'ASC',
        ));

        $rating_post_id = !empty($existing_ratings) ? absint($existing_ratings[0]) : 0;
        if ($rating_post_id <= 0) {
            return null;
        }

        return array(
            'ratingId' => $rating_post_id,
            'score' => absint(get_post_meta($rating_post_id, 'score', true)),
            // The original listing remains available for audit only. A rating
            // is now unique to the reviewer and advertiser, not to a listing.
            'listingId' => absint(get_post_meta($rating_post_id, 'listing_id', true)),
        );
    }
}

if (!function_exists('platform_submissions_migrate_user_ratings_to_seller_scope')) {
    function platform_submissions_migrate_user_ratings_to_seller_scope() {
        $migration_option = 'platform_submissions_user_rating_scope_v1';
        if ((string) get_option($migration_option, '') === 'completed') {
            return array('alreadyMigrated' => true, 'archived' => 0);
        }

        $rating_ids = get_posts(array(
            'post_type' => 'platform_user_rating',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'fields' => 'ids',
            'orderby' => 'date',
            'order' => 'ASC',
        ));
        $kept_by_pair = array();
        $affected_seller_ids = array();
        $archived = 0;

        foreach ($rating_ids as $rating_post_id) {
            $rating_post_id = absint($rating_post_id);
            $seller_user_id = absint(get_post_meta($rating_post_id, 'seller_user_id', true));
            $rater_user_id = absint(get_post_meta($rating_post_id, 'rater_user_id', true));
            if ($seller_user_id <= 0 || $rater_user_id <= 0) {
                continue;
            }

            $pair_key = $seller_user_id . ':' . $rater_user_id;
            if (!isset($kept_by_pair[$pair_key])) {
                $kept_by_pair[$pair_key] = $rating_post_id;
                $affected_seller_ids[$seller_user_id] = true;
                continue;
            }

            $kept_rating_id = absint($kept_by_pair[$pair_key]);
            update_post_meta($rating_post_id, 'superseded_by_rating_id', (string) $kept_rating_id);
            update_post_meta($rating_post_id, 'rating_archived_at', gmdate('c'));
            wp_update_post(array(
                'ID' => $rating_post_id,
                'post_status' => 'draft',
            ));
            $affected_seller_ids[$seller_user_id] = true;
            $archived++;
        }

        foreach (array_keys($affected_seller_ids) as $seller_user_id) {
            platform_submissions_recalculate_user_rating_aggregate((int) $seller_user_id);
        }

        update_option($migration_option, 'completed', false);

        if (function_exists('platform_2424_log_event')) {
            platform_2424_log_event('info', 'submissions', 'Migration des notes par annonceur terminee.', array(
                'archived' => $archived,
                'sellers' => count($affected_seller_ids),
            ));
        }

        return array('alreadyMigrated' => false, 'archived' => $archived);
    }
}

if (!function_exists('platform_submissions_schedule_user_rating_scope_migration')) {
    function platform_submissions_schedule_user_rating_scope_migration() {
        if ((string) get_option('platform_submissions_user_rating_scope_v1', '') === 'completed') {
            return;
        }

        $hook = 'platform_submissions_migrate_user_ratings_to_seller_scope';
        if (!wp_next_scheduled($hook)) {
            wp_schedule_single_event(time() + MINUTE_IN_SECONDS, $hook);
        }
    }
}

add_action('init', 'platform_submissions_schedule_user_rating_scope_migration', 45);
add_action('platform_submissions_migrate_user_ratings_to_seller_scope', 'platform_submissions_migrate_user_ratings_to_seller_scope');

if (!function_exists('platform_submissions_recalculate_user_rating_aggregate')) {
    function platform_submissions_recalculate_user_rating_aggregate($seller_user_id) {
        $seller_user_id = absint($seller_user_id);
        if ($seller_user_id <= 0) {
            return array(
                'average' => 0,
                'count' => 0,
            );
        }

        $ratings = get_posts(array(
            'post_type' => 'platform_user_rating',
            'post_status' => array('publish'),
            'posts_per_page' => -1,
            'fields' => 'ids',
            'meta_query' => array(
                array(
                    'key' => 'seller_user_id',
                    'value' => $seller_user_id,
                    'compare' => '=',
                    'type' => 'NUMERIC',
                ),
            ),
        ));

        $scores = array();
        foreach ($ratings as $rating_post_id) {
            $score = absint(get_post_meta((int) $rating_post_id, 'score', true));
            if ($score >= 1 && $score <= 5) {
                $scores[] = $score;
            }
        }

        $count = count($scores);
        $average = $count > 0 ? round(array_sum($scores) / $count, 2) : 0;
        update_user_meta($seller_user_id, 'rating_average', $average);
        update_user_meta($seller_user_id, 'rating_count', $count);

        return array(
            'average' => $average,
            'count' => $count,
        );
    }
}

if (!function_exists('platform_submissions_upsert_user_rating')) {
    function platform_submissions_upsert_user_rating($payload) {
        $seller_user_id = absint($payload['sellerUserId'] ?? 0);
        $rater_user_id = absint($payload['raterUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);
        $score = absint($payload['score'] ?? 0);
        $thread_key = sanitize_text_field((string) ($payload['threadKey'] ?? ''));

        if ($seller_user_id <= 0 || $rater_user_id <= 0 || $listing_id <= 0 || $score < 1 || $score > 5) {
            return new WP_Error('platform_submissions_invalid_rating', 'Parametres de note invalides.', array('status' => 400));
        }

        $existing_rating = platform_submissions_get_existing_user_rating($seller_user_id, $rater_user_id, $listing_id);
        $existing_post_id = !empty($existing_rating['ratingId']) ? absint($existing_rating['ratingId']) : 0;
        if ($existing_post_id > 0) {
            return new WP_Error('platform_submissions_rating_exists', 'Vous avez deja note cet annonceur.', array('status' => 409));
        }

        $rating_post_id = wp_insert_post(array(
            'post_type' => 'platform_user_rating',
            'post_status' => 'publish',
            'post_title' => sprintf('rating-%d-%d-%d', $seller_user_id, $rater_user_id, $listing_id),
        ), true);

        if (is_wp_error($rating_post_id) || !$rating_post_id) {
            return new WP_Error('platform_submissions_rating_create_failed', 'Impossible d enregistrer la note.', array('status' => 500));
        }

        update_post_meta($rating_post_id, 'seller_user_id', $seller_user_id);
        update_post_meta($rating_post_id, 'rater_user_id', $rater_user_id);
        update_post_meta($rating_post_id, 'listing_id', $listing_id);
        update_post_meta($rating_post_id, 'thread_key', $thread_key);
        update_post_meta($rating_post_id, 'score', $score);

        $summary = platform_submissions_recalculate_user_rating_aggregate($seller_user_id);

        return array(
            'ratingId' => absint($rating_post_id),
            'sellerUserId' => $seller_user_id,
            'score' => $score,
            'average' => $summary['average'],
            'count' => $summary['count'],
        );
    }
}

if (!function_exists('platform_submissions_compare_directory_items')) {
    function platform_submissions_compare_directory_items($left, $right) {
        $left_featured = !empty($left['featured']);
        $right_featured = !empty($right['featured']);

        if ($left_featured !== $right_featured) {
            return $left_featured ? -1 : 1;
        }

        $left_title = (string) ($left['title'] ?? '');
        $right_title = (string) ($right['title'] ?? '');

        return strcasecmp($left_title, $right_title);
    }
}

if (!function_exists('platform_submissions_get_public_directory_listings')) {
    function platform_submissions_get_public_directory_listings($payload) {
        $page = absint($payload['page'] ?? 1);
        $per_page = absint($payload['perPage'] ?? 24);
        $featured_only = isset($payload['featured']) && filter_var($payload['featured'], FILTER_VALIDATE_BOOLEAN);
        $search = sanitize_text_field((string) ($payload['search'] ?? ''));
        $category = sanitize_text_field((string) ($payload['category'] ?? ''));
        $id = absint($payload['id'] ?? 0);
        $taxonomy = platform_submissions_taxonomy_for_kind('directory');

        if ($page < 1) {
            $page = 1;
        }

        if ($per_page < 1) {
            $per_page = 24;
        }
        if ($per_page > 50) {
            $per_page = 50;
        }

        $query_args = array(
            'post_type' => 'annuaire',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
        );

        if ($id > 0) {
            $query_args['post__in'] = array($id);
        }

        if ($taxonomy !== '' && $category !== '' && strcasecmp($category, 'Business') !== 0) {
            $query_args['tax_query'] = array(
                array(
                    'taxonomy' => $taxonomy,
                    'field' => 'name',
                    'terms' => array($category),
                ),
            );
        }

        $search_filter = null;
        if ($search !== '') {
            global $wpdb;
            $search_token = wp_generate_uuid4();
            $query_args['s'] = $search;
            $query_args['platform_submissions_public_search_token'] = $search_token;
            $search_filter = function ($search_sql, $wp_query) use ($search_token, $search, $taxonomy, $location_taxonomy, $wpdb) {
                if ((string) $wp_query->get('platform_submissions_public_search_token') !== $search_token) {
                    return $search_sql;
                }

                $like = '%' . $wpdb->esc_like($search) . '%';
                $taxonomies = array_filter(array_unique(array(
                    $taxonomy,
                    $location_taxonomy,
                    taxonomy_exists('classified_product_tag') ? 'classified_product_tag' : '',
                )));
                $taxonomy_conditions = array();
                foreach ($taxonomies as $search_taxonomy) {
                    $taxonomy_conditions[] = $wpdb->prepare('tt.taxonomy = %s', $search_taxonomy);
                }
                $taxonomy_sql = !empty($taxonomy_conditions) ? implode(' OR ', $taxonomy_conditions) : '1 = 0';
                $sql = " AND (
                    {$wpdb->posts}.post_title LIKE %s
                    OR {$wpdb->posts}.post_content LIKE %s
                    OR EXISTS (
                        SELECT 1 FROM {$wpdb->postmeta} listing_meta
                        WHERE listing_meta.post_id = {$wpdb->posts}.ID
                        AND listing_meta.meta_key IN ('company_name', 'location', 'city', 'area')
                        AND listing_meta.meta_value LIKE %s
                    )
                    OR EXISTS (
                        SELECT 1 FROM {$wpdb->users} listing_author
                        WHERE listing_author.ID = {$wpdb->posts}.post_author
                        AND (listing_author.display_name LIKE %s OR listing_author.user_login LIKE %s)
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM {$wpdb->term_relationships} listing_terms
                        INNER JOIN {$wpdb->term_taxonomy} tt ON tt.term_taxonomy_id = listing_terms.term_taxonomy_id
                        INNER JOIN {$wpdb->terms} listing_term_names ON listing_term_names.term_id = tt.term_id
                        WHERE listing_terms.object_id = {$wpdb->posts}.ID
                        AND ({$taxonomy_sql})
                        AND listing_term_names.name LIKE %s
                    )
                )";

                return $wpdb->prepare($sql, $like, $like, $like, $like, $like, $like);
            };
            add_filter('posts_search', $search_filter, 20, 2);
        }

        $query = new WP_Query($query_args);
        if ($search_filter !== null) {
            remove_filter('posts_search', $search_filter, 20);
        }
        $items = array();

        foreach ($query->posts as $post) {
            $thumbnail = platform_submissions_rewrite_media_url((string) get_the_post_thumbnail_url($post, 'large'));
            $featured_image_url = platform_submissions_rewrite_media_url((string) get_post_meta($post->ID, 'featured_image_url', true));
            $gallery_images = get_post_meta($post->ID, 'gallery_images', true);
            if (!is_array($gallery_images)) {
                $gallery_images = array();
            }

            $images = array_values(array_filter(array_map('platform_submissions_rewrite_media_url', $gallery_images)));
            if ($thumbnail) {
                array_unshift($images, $thumbnail);
            } elseif ($featured_image_url) {
                array_unshift($images, $featured_image_url);
            }
            $images = array_values(array_unique($images));
            $taxonomy_pair = platform_submissions_resolve_taxonomy_pair($post->ID, $taxonomy);
            $location_terms = platform_submissions_resolve_location_terms($post->ID, platform_submissions_location_taxonomy_for_kind('directory'));
            $first_category = (string) ($taxonomy_pair['category'] ?? '');
            $post_author = get_userdata((int) $post->post_author);
            $publisher_name = '';
            $publisher_profile_photo = '';
            $publisher_company_logo = '';
            $rating_summary = platform_submissions_get_user_rating_summary((int) $post->post_author);
            if ($post_author instanceof WP_User) {
                $publisher_name = trim((string) $post_author->display_name);
                $publisher_profile_photo = trim((string) get_user_meta($post_author->ID, 'profile_photo', true));
                $publisher_company_logo = trim((string) get_user_meta($post_author->ID, 'company_logo', true));
                if ($publisher_profile_photo === '') {
                    $publisher_profile_photo = (string) get_avatar_url($post_author->ID);
                }
            }
            if ($publisher_name === '') {
                $publisher_name = trim((string) get_the_author_meta('display_name', (int) $post->post_author));
            }

            $items[] = array(
                'id' => (int) $post->ID,
                'title' => platform_submissions_decode_html_entities(get_the_title($post)),
                'description' => wp_trim_words(wp_strip_all_tags((string) $post->post_content), 40),
                'content' => wp_kses_post((string) $post->post_content),
                'location' => sanitize_text_field((string) get_post_meta($post->ID, 'location', true)),
                'date' => platform_submissions_get_public_listing_reference_date($post),
                'lastModified' => get_post_modified_time('c', true, $post),
                'category' => $first_category,
                'regions' => $location_terms['regions'],
                'cities' => $location_terms['cities'],
                'type' => '',
                'featured' => (bool) get_post_meta($post->ID, 'directory_featured', true),
                'image' => $thumbnail ? $thumbnail : $featured_image_url,
                'images' => array_slice($images, 0, 10),
                'contactPhone' => sanitize_text_field((string) get_post_meta($post->ID, 'contact_phone', true)),
                'contactPhoneCountry' => '',
                'contactEmail' => sanitize_email((string) get_post_meta($post->ID, 'contact_email', true)),
                'ownerWpUserId' => (int) $post->post_author,
                'ownerEmail' => $post_author instanceof WP_User ? sanitize_email((string) $post_author->user_email) : '',
                'ownerRatingAverage' => (float) ($rating_summary['average'] ?? 0),
                'ownerRatingCount' => absint($rating_summary['count'] ?? 0),
                'companyName' => sanitize_text_field((string) get_post_meta($post->ID, 'company_name', true)),
                'website' => esc_url_raw((string) get_post_meta($post->ID, 'website', true)),
                'publisherName' => sanitize_text_field($publisher_name),
                'profilePhoto' => esc_url_raw($publisher_profile_photo),
                'companyLogo' => esc_url_raw($publisher_company_logo),
                'price' => '',
                'currency' => '',
                'budget' => '',
                'detailsPdfUrl' => '',
                'detailsPdfName' => '',
                'deadline' => '',
                'isAdminCreated' => true,
            );
        }

        wp_reset_postdata();

        // Exclude stress accounts in SQL. Loading 50,000 test users and resolving
        // a subscription snapshot for each of them can make the directory time out.
        $business_users = get_users(array(
            'fields' => 'all',
            'meta_query' => array(
                'relation' => 'OR',
                array(
                    'key' => 'platform_2424_test_data',
                    'compare' => 'NOT EXISTS',
                ),
                array(
                    'key' => 'platform_2424_test_data',
                    'value' => '1',
                    'compare' => '!=',
                ),
            ),
        ));
        $eligible_business_count = 0;
        $matched_business_count = 0;

        foreach ($business_users as $business_user) {
            if (!($business_user instanceof WP_User)) {
                continue;
            }

            $business_item = platform_submissions_build_directory_business_item($business_user);
            if ($business_item === null) {
                continue;
            }
            $eligible_business_count++;

            if (!platform_submissions_directory_matches_filters($business_item, $search, $category, $id)) {
                continue;
            }

            $matched_business_count++;
            $items[] = $business_item;
        }

        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(
                sprintf(
                    '[2424 directory] annuaire_posts=%d eligible_business=%d matched_business=%d total_items=%d search="%s" category="%s" id=%d',
                    count($query->posts),
                    $eligible_business_count,
                    $matched_business_count,
                    count($items),
                    $search,
                    $category,
                    $id
                )
            );
        }

        usort($items, 'platform_submissions_compare_directory_items');

        $total = count($items);
        $total_pages = $per_page > 0 ? (int) max(1, ceil($total / $per_page)) : 1;
        $offset = ($page - 1) * $per_page;
        $paged_items = array_slice($items, $offset, $per_page);

        return array(
            'items' => array_values($paged_items),
            'pagination' => array(
                'page' => $page,
                'perPage' => $per_page,
                'total' => $total,
                'totalPages' => $total_pages,
            ),
        );
    }
}

if (!function_exists('platform_submissions_post_uses_listing_expiration')) {
    /**
     * Editorial posts created in WordPress are permanent content. Only listings,
     * plus paid articles explicitly submitted through the platform, use a duration.
     */
    function platform_submissions_post_uses_listing_expiration($post_or_id) {
        $post = $post_or_id instanceof WP_Post ? $post_or_id : get_post(absint($post_or_id));
        if (!$post instanceof WP_Post) {
            return false;
        }

        if (in_array($post->post_type, array('classified_ad', 'job_offer', 'tender_notice'), true)) {
            return true;
        }

        return $post->post_type === 'post'
            && sanitize_key((string) get_post_meta($post->ID, 'submission_source', true)) === 'next-frontend';
    }
}

if (!function_exists('platform_submissions_resolve_listing_expires_ts')) {
    function platform_submissions_resolve_listing_expires_ts($post_or_id, $args = array()) {
        $allow_backfill = !empty($args['backfill']);
        $post = $post_or_id instanceof WP_Post ? $post_or_id : get_post(absint($post_or_id));
        if (!platform_submissions_post_uses_listing_expiration($post)) {
            return 0;
        }

        $expires_ts = absint(get_post_meta($post->ID, 'listing_expires_at_ts', true));
        if ($expires_ts > 0) {
            return $expires_ts;
        }

        $pricing_code = sanitize_key((string) get_post_meta($post->ID, 'pricing_code', true));
        if ($pricing_code === '') {
            $pricing_code = platform_submissions_get_default_pricing_code_for_post($post);
        }

        if ($pricing_code === '') {
            return 0;
        }

        $pricing_definition = platform_submissions_get_pricing_definition($pricing_code);
        if (!is_array($pricing_definition) || empty($pricing_definition['durationDays'])) {
            return 0;
        }

        $duration_days = max(1, absint($pricing_definition['durationDays']));
        $published_ts = (int) get_post_time('U', true, $post);
        if ($published_ts <= 0) {
            $published_ts = strtotime((string) $post->post_date_gmt);
        }
        if ($published_ts <= 0) {
            $published_ts = strtotime((string) $post->post_date);
        }
        if ($published_ts <= 0) {
            return 0;
        }

        $expires_ts = $published_ts + ($duration_days * DAY_IN_SECONDS);

        if ($allow_backfill) {
            update_post_meta($post->ID, 'pricing_code', $pricing_code);
            update_post_meta($post->ID, 'listing_expires_at_ts', (string) $expires_ts);
            update_post_meta($post->ID, 'listing_expires_at', gmdate('c', $expires_ts));
        }

        return $expires_ts;
    }
}

if (!function_exists('platform_submissions_is_content_expired')) {
    function platform_submissions_is_content_expired($post_id, $now_ts = null) {
        $post_id = absint($post_id);
        if ($post_id <= 0) {
            return false;
        }

        $expires_ts = platform_submissions_resolve_listing_expires_ts($post_id, array(
            'backfill' => true,
        ));
        if ($expires_ts <= 0) {
            return false;
        }

        $now_ts = $now_ts !== null ? (int) $now_ts : time();
        return $expires_ts < $now_ts;
    }
}

if (!function_exists('platform_submissions_is_deadline_expired')) {
    function platform_submissions_is_deadline_expired($post_or_id, $now_ts = null) {
        $post = $post_or_id instanceof WP_Post ? $post_or_id : get_post(absint($post_or_id));
        if (!$post instanceof WP_Post) {
            return false;
        }

        $kind = platform_submissions_map_post_type_to_kind($post->post_type);
        if (!in_array($kind, array('job', 'tender'), true)) {
            return false;
        }

        $deadline = sanitize_text_field((string) get_post_meta($post->ID, 'deadline', true));
        if ($deadline === '') {
            return false;
        }

        $deadline_has_time = preg_match('/\d{1,2}:\d{2}/', $deadline) === 1;
        $deadline_ts = strtotime($deadline_has_time ? $deadline : $deadline . ' 23:59:59');
        if ($deadline_ts === false || $deadline_ts <= 0) {
            return false;
        }

        $now_ts = $now_ts !== null ? (int) $now_ts : time();
        return $deadline_ts < $now_ts;
    }
}

if (!function_exists('platform_submissions_build_expiration_meta_query')) {
    function platform_submissions_build_expiration_meta_query($now_ts = null) {
        $now_ts = $now_ts !== null ? (int) $now_ts : time();

        return array(
            'relation' => 'OR',
            array(
                'key' => 'listing_expires_at_ts',
                'compare' => 'NOT EXISTS',
            ),
            array(
                'key' => 'listing_expires_at_ts',
                'value' => $now_ts,
                'compare' => '>=',
                'type' => 'NUMERIC',
            ),
        );
    }
}

if (!function_exists('platform_submissions_normalize_scheduled_publish_at')) {
    function platform_submissions_normalize_scheduled_publish_at($value) {
        $raw_value = trim((string) $value);
        if ($raw_value === '') {
            return array(
                'iso' => '',
                'timestamp' => 0,
            );
        }

        $timestamp = strtotime($raw_value);
        if ($timestamp === false || $timestamp <= 0) {
            return array(
                'iso' => '',
                'timestamp' => 0,
            );
        }

        return array(
            'iso' => gmdate('c', $timestamp),
            'timestamp' => (int) $timestamp,
        );
    }
}

if (!function_exists('platform_submissions_is_scheduled_for_future')) {
    function platform_submissions_is_scheduled_for_future($post_id, $now_ts = null) {
        $post_id = absint($post_id);
        if ($post_id <= 0) {
            return false;
        }

        $scheduled_ts = absint(get_post_meta($post_id, 'scheduled_publish_at_ts', true));
        if ($scheduled_ts <= 0) {
            return false;
        }

        $now_ts = $now_ts !== null ? (int) $now_ts : time();
        return $scheduled_ts > $now_ts;
    }
}

if (!function_exists('platform_submissions_is_boost_active')) {
    function platform_submissions_is_boost_active($post_id, $now_ts = null) {
        $post_id = absint($post_id);
        if ($post_id <= 0) {
            return false;
        }

        $expires_ts = absint(get_post_meta($post_id, 'boost_expires_at_ts', true));
        if ($expires_ts <= 0) {
            return false;
        }

        $now_ts = $now_ts !== null ? (int) $now_ts : time();
        return $expires_ts >= $now_ts;
    }
}

if (!function_exists('platform_submissions_apply_boost_to_post')) {
    function platform_submissions_apply_boost_to_post($post_id, $pricing_code, $args = array()) {
        $post_id = absint($post_id);
        $pricing_code = sanitize_key((string) $pricing_code);
        if ($post_id <= 0 || $pricing_code === '') {
            return 0;
        }

        $pricing_definition = platform_submissions_get_pricing_definition($pricing_code);
        if (!is_array($pricing_definition) || empty($pricing_definition['durationDays'])) {
            return 0;
        }

        $duration_days = max(1, absint($pricing_definition['durationDays']));
        $now_ts = isset($args['nowTs']) ? (int) $args['nowTs'] : time();
        $preserve_existing = !isset($args['preserveExisting']) || (bool) $args['preserveExisting'];
        $current_expires_ts = absint(get_post_meta($post_id, 'boost_expires_at_ts', true));
        $base_ts = ($preserve_existing && $current_expires_ts > $now_ts) ? $current_expires_ts : $now_ts;
        $next_expires_ts = $base_ts + ($duration_days * DAY_IN_SECONDS);

        update_post_meta($post_id, 'boost_expires_at_ts', (string) $next_expires_ts);
        update_post_meta($post_id, 'boost_expires_at', gmdate('c', $next_expires_ts));

        return $next_expires_ts;
    }
}
if (!function_exists('platform_submissions_apply_expiration_to_post')) {
    function platform_submissions_apply_expiration_to_post($post_id, $pricing_code, $args = array()) {
        $post_id = absint($post_id);
        $pricing_code = sanitize_key((string) $pricing_code);
        if ($post_id <= 0 || $pricing_code === '' || !platform_submissions_post_uses_listing_expiration($post_id)) {
            return 0;
        }

        $pricing_definition = platform_submissions_get_pricing_definition($pricing_code);
        if (!is_array($pricing_definition) || empty($pricing_definition['durationDays'])) {
            return 0;
        }

        $duration_days = max(1, absint($pricing_definition['durationDays']));
        $now_ts = isset($args['nowTs']) ? (int) $args['nowTs'] : time();
        $preserve_existing = !isset($args['preserveExisting']) || (bool) $args['preserveExisting'];
        $current_expires_ts = absint(get_post_meta($post_id, 'listing_expires_at_ts', true));
        $base_ts = ($preserve_existing && $current_expires_ts > $now_ts) ? $current_expires_ts : $now_ts;
        $next_expires_ts = $base_ts + ($duration_days * DAY_IN_SECONDS);

        update_post_meta($post_id, 'pricing_code', $pricing_code);
        update_post_meta($post_id, 'listing_expires_at_ts', (string) $next_expires_ts);
        update_post_meta($post_id, 'listing_expires_at', gmdate('c', $next_expires_ts));

        return $next_expires_ts;
    }
}

if (!function_exists('platform_submissions_assign_expiration_on_publish')) {
    function platform_submissions_assign_expiration_on_publish($new_status, $old_status, $post) {
        if (!$post instanceof WP_Post) {
            return;
        }

        if ($new_status !== 'publish') {
            return;
        }

        if (!platform_submissions_post_uses_listing_expiration($post)) {
            return;
        }

        if ($old_status === 'publish' && absint(get_post_meta($post->ID, 'listing_expires_at_ts', true)) > 0) {
            return;
        }

        $pricing_code = sanitize_key((string) get_post_meta($post->ID, 'pricing_code', true));
        if ($pricing_code === '') {
            $pricing_code = platform_submissions_get_default_pricing_code_for_post($post);
        }

        if ($pricing_code === '') {
            return;
        }

        platform_submissions_apply_expiration_to_post($post->ID, $pricing_code, array(
            'preserveExisting' => false,
            'nowTs' => (int) get_post_time('U', true, $post),
        ));
    }
}

add_action('transition_post_status', 'platform_submissions_assign_expiration_on_publish', 20, 3);

if (!function_exists('platform_submissions_get_user_items')) {
    function platform_submissions_get_user_items($kind, $payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        if (!$user_id) {
            return new WP_Error('platform_submissions_invalid_user', 'User ID is required.', array('status' => 400));
        }

        $user = get_user_by('id', $user_id);
        if (!$user) {
            return new WP_Error('platform_submissions_unknown_user', 'Compte introuvable.', array('status' => 404));
        }

        $post_type = platform_submissions_map_kind_to_post_type($kind);
        $query_args = array(
            'post_type' => $post_type,
            'author' => $user_id,
            'post_status' => array('pending', 'draft', 'publish', 'future', 'private'),
            'posts_per_page' => 20,
            'orderby' => 'date',
            'order' => 'DESC',
            'no_found_rows' => true,
        );
        $listing_id = absint($payload['listingId'] ?? 0);
        if ($listing_id > 0) {
            $query_args['p'] = $listing_id;
            $query_args['posts_per_page'] = 1;
        }
        $query = new WP_Query($query_args);

        $items = array();

        foreach ($query->posts as $post) {
            platform_submissions_resolve_listing_expires_ts($post, array(
                'backfill' => true,
            ));
            $thumbnail = get_the_post_thumbnail_url($post, 'medium');
            $thumbnail = platform_submissions_rewrite_media_url((string) $thumbnail);
            $featured_image_url = platform_submissions_rewrite_media_url((string) get_post_meta($post->ID, 'featured_image_url', true));
            $gallery_images = get_post_meta($post->ID, 'gallery_images', true);
            if (!is_array($gallery_images)) {
                $gallery_images = array();
            }

            $images = array_values(array_filter(array_map('platform_submissions_rewrite_media_url', $gallery_images)));
            if ($thumbnail) {
                array_unshift($images, $thumbnail);
            } elseif ($featured_image_url) {
                array_unshift($images, $featured_image_url);
            }
            $images = array_values(array_unique($images));
            $images = array_slice($images, 0, $kind === 'classified' ? platform_submissions_get_classified_gallery_limit_max() : 10);
            $taxonomy = platform_submissions_taxonomy_for_kind($kind);
            $taxonomy_pair = platform_submissions_resolve_taxonomy_pair($post->ID, $taxonomy);
            $category = (string) ($taxonomy_pair['category'] ?? '');
            $type = (string) ($taxonomy_pair['type'] ?? '');
            $product_tag = $kind === 'classified' ? platform_submissions_get_assigned_classified_product_tag($post->ID) : '';
            $location_terms = platform_submissions_resolve_location_terms($post->ID, platform_submissions_location_taxonomy_for_kind($kind));
            $resolved_city = sanitize_text_field((string) ($location_terms['regions'][0] ?? get_post_meta($post->ID, 'city', true)));
            $resolved_area = sanitize_text_field((string) ($location_terms['cities'][0] ?? get_post_meta($post->ID, 'area', true)));
            $resolved_location = platform_submissions_build_location_display_value($resolved_city, $resolved_area);
            $is_expired = platform_submissions_is_content_expired($post->ID);
            $expires_at = sanitize_text_field((string) get_post_meta($post->ID, 'listing_expires_at', true));
            $scheduled_publish_at = sanitize_text_field((string) get_post_meta($post->ID, 'scheduled_publish_at', true));
            $is_scheduled = platform_submissions_is_scheduled_for_future($post->ID);
            $moderation_status = sanitize_key((string) get_post_meta($post->ID, 'platform_moderation_status', true));
            $moderation_message = sanitize_textarea_field((string) get_post_meta($post->ID, 'platform_moderation_message', true));
            $finalization_status = sanitize_key((string) get_post_meta($post->ID, '_platform_submission_finalization_status', true));
            $status_label = $finalization_status === 'processing' || $finalization_status === 'retrying'
                ? 'Preparation en cours'
                : ($finalization_status === 'failed'
                    ? 'Preparation a reprendre'
                    : ($moderation_status === 'flagged' ? 'Signale' : ($is_expired ? 'Expire' : ($is_scheduled ? 'Programme' : ucfirst((string) $post->post_status)))));
            $workspace_author = get_userdata((int) $post->post_author);
            $workspace_profile_photo = '';
            $workspace_company_logo = '';
            if ($workspace_author instanceof WP_User) {
                $workspace_profile_photo = trim((string) get_user_meta($workspace_author->ID, 'profile_photo', true));
                $workspace_company_logo = trim((string) get_user_meta($workspace_author->ID, 'company_logo', true));
                if ($workspace_profile_photo === '') {
                    $workspace_profile_photo = (string) get_avatar_url($workspace_author->ID);
                }
            }
            $items[] = array(
                'id' => (string) $post->ID,
                'title' => platform_submissions_decode_html_entities(get_the_title($post)),
                'description' => wp_trim_words(wp_strip_all_tags((string) $post->post_content), 24),
                'content' => wp_kses_post((string) $post->post_content),
                'meta' => sprintf('%s - %s', $status_label, $is_scheduled && $scheduled_publish_at !== '' ? gmdate('d/m/Y H:i', strtotime($scheduled_publish_at)) : get_the_date('d/m/Y', $post)),
                'image' => $thumbnail ? $thumbnail : $featured_image_url,
                'images' => $images,
                'location' => $resolved_location !== '' ? $resolved_location : sanitize_text_field((string) get_post_meta($post->ID, 'location', true)),
                'city' => $resolved_city,
                'area' => $resolved_area,
                'regions' => $location_terms['regions'],
                'cities' => $location_terms['cities'],
                'contactPhone' => sanitize_text_field((string) get_post_meta($post->ID, 'contact_phone', true)),
                'contactPhoneCountry' => sanitize_key((string) get_post_meta($post->ID, 'contact_phone_country', true)),
                'contactEmail' => sanitize_email((string) get_post_meta($post->ID, 'contact_email', true)),
                'category' => $category,
                'type' => $type,
                'productTag' => $product_tag,
                'condition' => sanitize_text_field((string) get_post_meta($post->ID, 'condition', true)),
                'companyName' => sanitize_text_field((string) get_post_meta($post->ID, 'company_name', true)),
                'profilePhoto' => $workspace_profile_photo !== '' ? esc_url_raw($workspace_profile_photo) : '',
                'companyLogo' => $workspace_company_logo !== '' ? esc_url_raw($workspace_company_logo) : '',
                'skills' => platform_submissions_get_job_skills($post->ID),
                'experienceYears' => sanitize_text_field((string) get_post_meta($post->ID, 'experience_years', true)),
                'needBy' => sanitize_text_field((string) get_post_meta($post->ID, 'need_by', true)),
                'deadline' => sanitize_text_field((string) get_post_meta($post->ID, 'deadline', true)),
                'price' => sanitize_text_field((string) get_post_meta($post->ID, 'price', true)),
                'budget' => sanitize_text_field((string) get_post_meta($post->ID, 'budget', true)),
                'detailsPdfUrl' => esc_url_raw((string) get_post_meta($post->ID, 'details_pdf_url', true)),
                'detailsPdfName' => sanitize_text_field((string) get_post_meta($post->ID, 'details_pdf_name', true)),
                'currency' => sanitize_text_field((string) get_post_meta($post->ID, 'currency', true)),
                'paymentStatus' => sanitize_key((string) get_post_meta($post->ID, 'payment_status', true)),
                'postStatus' => sanitize_key((string) $post->post_status),
                'finalizationStatus' => $finalization_status !== '' ? $finalization_status : 'ready',
                'featured' => in_array($kind, array('classified', 'job', 'tender'), true) ? platform_submissions_is_boost_active($post->ID) : false,
                'expiresAt' => $expires_at,
                'isExpired' => $is_expired,
                'scheduledPublishAt' => $scheduled_publish_at,
                'isScheduled' => $is_scheduled,
                'moderationStatus' => $moderation_status,
                'moderationMessage' => $moderation_status === 'flagged' ? $moderation_message : '',
            );
        }

        wp_reset_postdata();

        return array(
            'title' => $kind === 'classified' ? 'Mes annonces' : ($kind === 'tender' ? "Mes appels d'offres" : ($kind === 'job' ? "Mes offres d'emploi" : 'Mes articles')),
            'items' => $items,
        );
    }
}

if (!function_exists('platform_submissions_get_user_item')) {
    function platform_submissions_get_user_item($kind, $payload) {
        $result = platform_submissions_get_user_items($kind, $payload);
        if (is_wp_error($result)) {
            return $result;
        }

        $items = is_array($result['items'] ?? null) ? $result['items'] : array();
        if (empty($items)) {
            return new WP_Error('platform_submissions_listing_not_found', 'Publication introuvable.', array('status' => 404));
        }

        return $items[0];
    }
}

if (!function_exists('platform_submissions_resolve_contact_email')) {
    function platform_submissions_resolve_contact_email($post_id, $post_author_id) {
        $contact_email = sanitize_email((string) get_post_meta($post_id, 'contact_email', true));
        if ($contact_email !== '') {
            return $contact_email;
        }

        $author = get_userdata((int) $post_author_id);
        if ($author instanceof WP_User) {
            return sanitize_email((string) $author->user_email);
        }

        return '';
    }
}

if (!function_exists('platform_submissions_get_public_items')) {
    function platform_submissions_get_public_items($kind, $payload) {
        if ($kind === 'directory') {
            if (function_exists('platform_2424_directory_index_query')) {
                return platform_2424_directory_index_query($payload);
            }
            return platform_submissions_get_public_directory_listings($payload);
        }

        // The active SQL projection remains available while a separate build
        // table is reconstructed, so public reads never touch postmeta here.
        if (function_exists('platform_2424_public_listing_index_query')) {
            return platform_2424_public_listing_index_query($kind, $payload);
        }

        $page = absint($payload['page'] ?? 1);
        $per_page = absint($payload['perPage'] ?? 24);
        $featured_only = isset($payload['featured']) && filter_var($payload['featured'], FILTER_VALIDATE_BOOLEAN);
        $search = sanitize_text_field((string) ($payload['search'] ?? ''));
        $category = sanitize_text_field((string) ($payload['category'] ?? ''));
        $type = sanitize_text_field((string) ($payload['type'] ?? ''));
        $product_tag = sanitize_text_field((string) ($payload['productTag'] ?? ''));
        $location = sanitize_text_field((string) ($payload['location'] ?? ''));
        $city = sanitize_text_field((string) ($payload['city'] ?? ''));
        $area = sanitize_text_field((string) ($payload['area'] ?? ''));
        $company = sanitize_text_field((string) ($payload['company'] ?? ''));
        $price_min = preg_replace('/[^0-9.]/', '', (string) ($payload['priceMin'] ?? ''));
        $price_max = preg_replace('/[^0-9.]/', '', (string) ($payload['priceMax'] ?? ''));
        $currency = sanitize_key((string) ($payload['currency'] ?? ''));
        $owner_wp_user_id = absint($payload['ownerWpUserId'] ?? 0);
        $id = absint($payload['id'] ?? 0);

        if ($page < 1) {
            $page = 1;
        }

        if ($per_page < 1) {
            $per_page = 24;
        }
        if ($per_page > 50) {
            $per_page = 50;
        }

        $post_type = platform_submissions_map_kind_to_post_type($kind);
        $taxonomy = platform_submissions_taxonomy_for_kind($kind);

        $query_args = array(
            'post_type' => $post_type,
            'post_status' => 'publish',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => $kind === 'directory' ? 'title' : 'date',
            'order' => $kind === 'directory' ? 'ASC' : 'DESC',
        );

        if ($search !== '') {
            $query_args['s'] = $search;
        }

        if ($id > 0) {
            $query_args['post__in'] = array($id);
            $query_args['posts_per_page'] = 1;
            $query_args['paged'] = 1;
        }

        if ($owner_wp_user_id > 0) {
            $query_args['author'] = $owner_wp_user_id;
        }

        $tax_query = array();
        if ($taxonomy !== '' && $category !== '') {
            $tax_query[] = array(
                'taxonomy' => $taxonomy,
                'field' => 'name',
                'terms' => array($category),
            );
        }

        if ($taxonomy !== '' && $type !== '') {
            $tax_query[] = array(
                'taxonomy' => $taxonomy,
                'field' => 'name',
                'terms' => array($type),
                'include_children' => false,
            );
        }

        if ($kind === 'classified' && $product_tag !== '' && taxonomy_exists('classified_product_tag')) {
            $tax_query[] = array(
                'taxonomy' => 'classified_product_tag',
                'field' => 'name',
                'terms' => array($product_tag),
            );
        }

        $location_taxonomy = platform_submissions_location_taxonomy_for_kind($kind);
        if ($location_taxonomy !== '' && taxonomy_exists($location_taxonomy)) {
            if ($location !== '') {
                $tax_query[] = array(
                    'taxonomy' => $location_taxonomy,
                    'field' => 'name',
                    'terms' => array($location),
                    'include_children' => true,
                );
            } elseif ($city !== '') {
                $tax_query[] = array(
                    'taxonomy' => $location_taxonomy,
                    'field' => 'name',
                    'terms' => array($city),
                    'include_children' => true,
                );
            }

            if ($area !== '') {
                $tax_query[] = array(
                    'taxonomy' => $location_taxonomy,
                    'field' => 'name',
                    'terms' => array($area),
                    'include_children' => false,
                );
            }
        }

        if (!empty($tax_query)) {
            if (count($tax_query) > 1) {
                $tax_query['relation'] = 'AND';
            }
            $query_args['tax_query'] = $tax_query;
        }

        $now_ts = time();
        $query_args['meta_query'] = array(
            'relation' => 'AND',
            platform_submissions_build_expiration_meta_query($now_ts),
            array(
                'relation' => 'OR',
                array(
                    'key' => 'scheduled_publish_at_ts',
                    'compare' => 'NOT EXISTS',
                ),
                array(
                    'key' => 'scheduled_publish_at_ts',
                    'value' => $now_ts,
                    'compare' => '<=',
                    'type' => 'NUMERIC',
                ),
            ),
        );

        if ($featured_only && in_array($kind, array('classified', 'job', 'tender'), true)) {
            $query_args['meta_query'][] = array(
                'key' => 'boost_expires_at_ts',
                'value' => $now_ts,
                'compare' => '>=',
                'type' => 'NUMERIC',
            );
        }

        if ($company !== '') {
            $query_args['meta_query'][] = array(
                'key' => 'company_name',
                'value' => $company,
                'compare' => '=',
            );
        }

        if ($kind === 'classified') {
            if ($currency !== '') {
                $query_args['meta_query'][] = array(
                    'key' => 'currency',
                    'value' => strtoupper($currency),
                    'compare' => '=',
                );
            }
            if ($price_min !== '') {
                $query_args['meta_query'][] = array(
                    'key' => 'price',
                    'value' => (float) $price_min,
                    'compare' => '>=',
                    'type' => 'NUMERIC',
                );
            }
            if ($price_max !== '') {
                $query_args['meta_query'][] = array(
                    'key' => 'price',
                    'value' => (float) $price_max,
                    'compare' => '<=',
                    'type' => 'NUMERIC',
                );
            }
        }

        $query = new WP_Query($query_args);
        $items = array();

        foreach ($query->posts as $post) {
            platform_submissions_resolve_listing_expires_ts($post, array(
                'backfill' => false,
                'nowTs' => $now_ts,
            ));
            if (platform_submissions_is_content_expired($post->ID, $now_ts)) {
                continue;
            }

            if (platform_submissions_is_deadline_expired($post, $now_ts)) {
                continue;
            }

            $thumbnail = platform_submissions_rewrite_media_url((string) get_the_post_thumbnail_url($post, 'large'));
            $featured_image_url = platform_submissions_rewrite_media_url((string) get_post_meta($post->ID, 'featured_image_url', true));
            $gallery_images = get_post_meta($post->ID, 'gallery_images', true);
            if (!is_array($gallery_images)) {
                $gallery_images = array();
            }

            $images = array_values(array_filter(array_map('platform_submissions_rewrite_media_url', $gallery_images)));
            if ($thumbnail) {
                array_unshift($images, $thumbnail);
            } elseif ($featured_image_url) {
                array_unshift($images, $featured_image_url);
            }
            $images = array_values(array_unique($images));
            $taxonomy_pair = platform_submissions_resolve_taxonomy_pair($post->ID, $taxonomy);
            $first_category = (string) ($taxonomy_pair['category'] ?? '');
            $type_name = (string) ($taxonomy_pair['type'] ?? '');
            $product_tag_name = $kind === 'classified' ? platform_submissions_get_assigned_classified_product_tag($post->ID) : '';
            $location_terms = platform_submissions_resolve_location_terms($post->ID, $location_taxonomy);
            $resolved_city = sanitize_text_field((string) ($location_terms['regions'][0] ?? get_post_meta($post->ID, 'city', true)));
            $resolved_area = sanitize_text_field((string) ($location_terms['cities'][0] ?? get_post_meta($post->ID, 'area', true)));
            $resolved_location = platform_submissions_build_location_display_value($resolved_city, $resolved_area);
            $is_featured = platform_submissions_is_boost_active($post->ID);
            $submission_source = sanitize_key((string) get_post_meta($post->ID, 'submission_source', true));
            $is_admin_created = $submission_source !== 'next-frontend';
            $post_author = get_userdata((int) $post->post_author);
            $publisher_name = '';
            $publisher_profile_photo = '';
            $publisher_company_logo = '';
            if ($post_author instanceof WP_User) {
                $publisher_name = trim((string) $post_author->display_name);
                $publisher_profile_photo = trim((string) get_user_meta($post_author->ID, 'profile_photo', true));
                $publisher_company_logo = trim((string) get_user_meta($post_author->ID, 'company_logo', true));
                if ($publisher_profile_photo === '') {
                    $publisher_profile_photo = (string) get_avatar_url($post_author->ID);
                }
            }
            if ($publisher_name === '') {
                $publisher_name = trim((string) get_the_author_meta('display_name', (int) $post->post_author));
            }

            $items[] = array(
                'id' => (int) $post->ID,
                'title' => platform_submissions_decode_html_entities(get_the_title($post)),
                'description' => wp_trim_words(wp_strip_all_tags((string) $post->post_content), 40),
                'content' => wp_kses_post((string) $post->post_content),
                'location' => $resolved_location !== '' ? $resolved_location : sanitize_text_field((string) get_post_meta($post->ID, 'location', true)),
                'city' => $resolved_city,
                'area' => $resolved_area,
                'date' => platform_submissions_get_public_listing_reference_date($post),
                'category' => $first_category,
                'type' => $type_name,
                'productTag' => $product_tag_name,
                'condition' => sanitize_text_field((string) get_post_meta($post->ID, 'condition', true)),
                'viewCount' => platform_submissions_get_view_count($post->ID),
                'regions' => $location_terms['regions'],
                'cities' => $location_terms['cities'],
                'featured' => $is_featured,
                'image' => $thumbnail ? $thumbnail : $featured_image_url,
                'images' => array_slice($images, 0, $kind === 'classified' ? platform_submissions_get_classified_gallery_limit_max() : 10),
                'contactPhone' => sanitize_text_field((string) get_post_meta($post->ID, 'contact_phone', true)),
                'contactPhoneCountry' => sanitize_key((string) get_post_meta($post->ID, 'contact_phone_country', true)),
                'contactEmail' => platform_submissions_resolve_contact_email($post->ID, (int) $post->post_author),
                'ownerWpUserId' => (int) $post->post_author,
                'ownerEmail' => $post_author instanceof WP_User ? sanitize_email((string) $post_author->user_email) : '',
                'companyName' => sanitize_text_field((string) get_post_meta($post->ID, 'company_name', true)),
                'website' => esc_url_raw((string) get_post_meta($post->ID, 'website', true)),
                'publisherName' => sanitize_text_field($publisher_name),
                'profilePhoto' => esc_url_raw($publisher_profile_photo),
                'companyLogo' => esc_url_raw($publisher_company_logo),
                'price' => sanitize_text_field((string) get_post_meta($post->ID, 'price', true)),
                'currency' => sanitize_text_field((string) get_post_meta($post->ID, 'currency', true)),
                'budget' => sanitize_text_field((string) get_post_meta($post->ID, 'budget', true)),
                'detailsPdfUrl' => esc_url_raw((string) get_post_meta($post->ID, 'details_pdf_url', true)),
                'detailsPdfName' => sanitize_text_field((string) get_post_meta($post->ID, 'details_pdf_name', true)),
                'skills' => platform_submissions_get_job_skills($post->ID),
                'experienceYears' => sanitize_text_field((string) get_post_meta($post->ID, 'experience_years', true)),
                'needBy' => sanitize_text_field((string) get_post_meta($post->ID, 'need_by', true)),
                'deadline' => sanitize_text_field((string) get_post_meta($post->ID, 'deadline', true)),
                'isAdminCreated' => $is_admin_created,
            );
        }

        wp_reset_postdata();

        return array(
            'items' => $items,
            'pagination' => array(
                'page' => $page,
                'perPage' => $per_page,
                'total' => (int) $query->found_posts,
                'totalPages' => (int) $query->max_num_pages,
            ),
        );
    }
}

if (!function_exists('platform_submissions_get_sitemap_listing_items')) {
    /**
     * Returns a compact, internal-only sitemap page without changing the
     * smaller public listing endpoint used by interactive pages.
     */
    function platform_submissions_get_sitemap_listing_items($kind, $payload) {
        if (!in_array($kind, array('classified', 'job', 'tender'), true)) {
            return new WP_Error('platform_sitemap_invalid_kind', 'Type de contenu invalide.', array('status' => 400));
        }

        $page = max(1, absint($payload['page'] ?? 1));
        $per_page = min(1000, max(1, absint($payload['perPage'] ?? 1000)));
        $now_ts = time();
        $query = new WP_Query(array(
            'post_type' => platform_submissions_map_kind_to_post_type($kind),
            'post_status' => 'publish',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'modified',
            'order' => 'DESC',
            'meta_query' => array(
                'relation' => 'AND',
                platform_submissions_build_expiration_meta_query($now_ts),
                array(
                    'relation' => 'OR',
                    array('key' => 'scheduled_publish_at_ts', 'compare' => 'NOT EXISTS'),
                    array('key' => 'scheduled_publish_at_ts', 'value' => $now_ts, 'compare' => '<=', 'type' => 'NUMERIC'),
                ),
                array(
                    'relation' => 'OR',
                    array('key' => 'platform_2424_test_data', 'compare' => 'NOT EXISTS'),
                    array('key' => 'platform_2424_test_data', 'value' => '1', 'compare' => '!='),
                ),
            ),
            'no_found_rows' => false,
        ));

        $items = array();
        foreach ($query->posts as $post) {
            if (platform_submissions_is_content_expired($post->ID, $now_ts) || platform_submissions_is_deadline_expired($post, $now_ts)) {
                continue;
            }

            $prefix = $kind === 'classified' ? 'annonce' : ($kind === 'job' ? 'offre' : 'appel-offres');
            $title_slug = sanitize_title(get_the_title($post));
            $items[] = array(
                'id' => (int) $post->ID,
                'slug' => $title_slug !== '' ? $title_slug . '-' . (int) $post->ID : $prefix . '-' . (int) $post->ID,
                'lastModified' => get_post_modified_time('c', true, $post),
            );
        }
        wp_reset_postdata();

        return array(
            'items' => $items,
            'pagination' => array(
                'page' => $page,
                'perPage' => $per_page,
                'total' => (int) $query->found_posts,
                'totalPages' => (int) $query->max_num_pages,
            ),
        );
    }
}

if (!function_exists('platform_submissions_track_public_view')) {
    function platform_submissions_track_public_view($payload) {
        $kind = sanitize_key((string) ($payload['kind'] ?? ''));
        $post_id = absint($payload['id'] ?? 0);

        if (!in_array($kind, array('classified', 'job', 'tender'), true)) {
            return new WP_Error('invalid_kind', "Type de contenu invalide pour le suivi de vues.", array('status' => 400));
        }

        if ($post_id <= 0) {
            return new WP_Error('invalid_id', "Identifiant de contenu invalide.", array('status' => 400));
        }

        $post = get_post($post_id);
        if (!$post instanceof WP_Post) {
            return new WP_Error('not_found', "Contenu introuvable.", array('status' => 404));
        }

        $expected_post_type = platform_submissions_map_kind_to_post_type($kind);
        if ($expected_post_type === '' || (string) $post->post_type !== $expected_post_type) {
            return new WP_Error('invalid_post_type', "Le contenu ne correspond pas au type attendu.", array('status' => 400));
        }

        $counted = platform_submissions_increment_view_count($post_id);

        return array(
            'ok' => true,
            'id' => $post_id,
            'kind' => $kind,
            'counted' => $counted,
        );
    }
}

if (!function_exists('platform_submissions_get_news_post_from_payload')) {
    function platform_submissions_get_news_post_from_payload($payload) {
        $post_id = absint($payload['postId'] ?? 0);
        $slug = sanitize_title((string) ($payload['slug'] ?? ''));

        if ($post_id > 0) {
            $post = get_post($post_id);
            if ($post instanceof WP_Post && in_array((string) $post->post_type, array('post', 'news'), true)) {
                return $post;
            }
        }

        if ($slug !== '') {
            $post = get_page_by_path($slug, OBJECT, 'post');
            if ($post instanceof WP_Post) {
                return $post;
            }

            $news_item = get_page_by_path($slug, OBJECT, 'news');
            if ($news_item instanceof WP_Post) {
                return $news_item;
            }
        }

        return null;
    }
}

if (!function_exists('platform_submissions_get_news_article_comments')) {
    function platform_submissions_get_news_article_comments($payload) {
        $post = platform_submissions_get_news_post_from_payload($payload);
        if (!$post instanceof WP_Post) {
            return new WP_Error('platform_news_post_not_found', 'Article introuvable.', array('status' => 404));
        }

        $comments = get_comments(array(
            'post_id' => (int) $post->ID,
            'status' => 'approve',
            'type' => 'comment',
            'orderby' => 'comment_date_gmt',
            'order' => 'DESC',
        ));

        $items = array();
        foreach ($comments as $comment) {
            if (!$comment instanceof WP_Comment) {
                continue;
            }

            $comment_date = $comment->comment_date_gmt ? $comment->comment_date_gmt : $comment->comment_date;
            $items[] = array(
                'id' => (int) $comment->comment_ID,
                'author' => sanitize_text_field((string) $comment->comment_author),
                'date' => gmdate('c', strtotime($comment_date . ' UTC')),
                'content' => wp_strip_all_tags((string) $comment->comment_content),
            );
        }

        return array(
            'postId' => (int) $post->ID,
            'slug' => (string) $post->post_name,
            'commentCount' => platform_submissions_get_public_comment_count((int) $post->ID),
            'commentsOpen' => comments_open($post),
            'items' => $items,
        );
    }
}

if (!function_exists('platform_submissions_create_news_article_comment')) {
    function platform_submissions_create_news_article_comment($payload) {
        $post = platform_submissions_get_news_post_from_payload($payload);
        if (!$post instanceof WP_Post) {
            return new WP_Error('platform_news_post_not_found', 'Article introuvable.', array('status' => 404));
        }

        if (!comments_open($post)) {
            return new WP_Error('platform_news_comments_closed', 'Les commentaires sont fermés pour cet article.', array('status' => 409));
        }

        $user_id = absint($payload['wpUserId'] ?? 0);
        $author_name = sanitize_text_field((string) ($payload['authorName'] ?? ''));
        $author_email = sanitize_email((string) ($payload['email'] ?? ''));
        $content = trim((string) ($payload['content'] ?? ''));

        if ($user_id <= 0 || $author_name === '' || $author_email === '' || $content === '') {
            return new WP_Error('platform_news_comment_invalid', 'Informations de commentaire invalides.', array('status' => 400));
        }

        $comment_id = wp_new_comment(array(
            'comment_post_ID' => (int) $post->ID,
            'comment_content' => wp_kses_post($content),
            'user_id' => $user_id,
            'comment_author' => $author_name,
            'comment_author_email' => $author_email,
            'comment_type' => '',
        ), true);

        if (is_wp_error($comment_id)) {
            return $comment_id;
        }

        $comment = get_comment($comment_id);
        $approved = $comment instanceof WP_Comment && (string) $comment->comment_approved === '1';

        return array(
            'ok' => true,
            'approved' => $approved,
            'commentId' => (int) $comment_id,
            'commentCount' => platform_submissions_get_public_comment_count((int) $post->ID),
            'commentsOpen' => comments_open($post),
            'message' => $approved ? 'Commentaire publié.' : 'Commentaire envoyé. Il sera visible après validation.',
            'item' => $approved && $comment instanceof WP_Comment ? array(
                'id' => (int) $comment->comment_ID,
                'author' => sanitize_text_field((string) $comment->comment_author),
                'date' => gmdate('c', strtotime(($comment->comment_date_gmt ? $comment->comment_date_gmt : $comment->comment_date) . ' UTC')),
                'content' => wp_strip_all_tags((string) $comment->comment_content),
            ) : null,
        );
    }
}

if (!function_exists('platform_submissions_track_news_article_view')) {
    function platform_submissions_track_news_article_view($payload) {
        $post = platform_submissions_get_news_post_from_payload($payload);
        if (!$post instanceof WP_Post) {
            return new WP_Error('platform_news_post_not_found', 'Article introuvable.', array('status' => 404));
        }

        $counted = platform_submissions_increment_view_count((int) $post->ID);

        return array(
            'ok' => true,
            'postId' => (int) $post->ID,
            'slug' => (string) $post->post_name,
            'counted' => $counted,
        );
    }
}

if (!function_exists('platform_submissions_get_taxonomy_terms')) {
    function platform_submissions_get_taxonomy_terms($kind, $parent_id = null, $limit = 0) {
        $taxonomy = platform_submissions_taxonomy_for_kind($kind);
        if ($taxonomy === '' || !taxonomy_exists($taxonomy)) {
            return new WP_Error('platform_submissions_taxonomy_not_found', 'Taxonomie introuvable.', array('status' => 404));
        }

        $query_args = array(
            'taxonomy' => $taxonomy,
            'hide_empty' => false,
        );
        if ($parent_id !== null) {
            $query_args['parent'] = absint($parent_id);
        }
        if ($limit > 0) {
            $query_args['number'] = min(100, absint($limit));
        }
        $terms = get_terms($query_args);

        if (is_wp_error($terms)) {
            return $terms;
        }

        // Load ordering metadata in one query. This keeps taxonomy imports from
        // turning a form-open request into one database read per term.
        $term_ids = array_map('absint', wp_list_pluck($terms, 'term_id'));
        if (!empty($term_ids)) {
            update_termmeta_cache($term_ids);
        }

        usort($terms, function ($left, $right) {
            $left_order = absint(get_term_meta($left->term_id, 'platform_term_order', true));
            $right_order = absint(get_term_meta($right->term_id, 'platform_term_order', true));

            if ($left_order === $right_order) {
                return strcasecmp((string) $left->name, (string) $right->name);
            }

            return $left_order <=> $right_order;
        });

        $mapped = array();
        foreach ($terms as $term) {
            $mapped[] = platform_submissions_map_term_payload($term, $taxonomy);
        }

        $response = array('terms' => $mapped);
        if ($kind === 'classified' && taxonomy_exists('classified_product_tag')) {
            $response['productTags'] = array_map(function ($term) {
                return platform_submissions_map_term_payload($term, 'classified_product_tag');
            }, platform_submissions_get_classified_product_tag_terms());
        }

        return $response;
    }
}

if (!function_exists('platform_submissions_get_location_terms')) {
    function platform_submissions_get_location_terms($kind, $parent_id = null, $limit = 0) {
        $taxonomy = platform_submissions_location_taxonomy_for_kind($kind);
        if ($taxonomy === '' || !taxonomy_exists($taxonomy)) {
            return new WP_Error('platform_submissions_taxonomy_not_found', 'Taxonomie de localisation introuvable.', array('status' => 404));
        }

        $query_args = array(
            'taxonomy' => $taxonomy,
            'hide_empty' => false,
        );
        if ($parent_id !== null) {
            $query_args['parent'] = absint($parent_id);
        }
        if ($limit > 0) {
            $query_args['number'] = min(100, absint($limit));
        }
        $terms = get_terms($query_args);

        if (is_wp_error($terms)) {
            return $terms;
        }

        // Location terms use the same admin ordering metadata as categories.
        $term_ids = array_map('absint', wp_list_pluck($terms, 'term_id'));
        if (!empty($term_ids)) {
            update_termmeta_cache($term_ids);
        }

        usort($terms, function ($left, $right) {
            $left_order = absint(get_term_meta($left->term_id, 'platform_term_order', true));
            $right_order = absint(get_term_meta($right->term_id, 'platform_term_order', true));

            if ($left_order === $right_order) {
                return strcasecmp((string) $left->name, (string) $right->name);
            }

            return $left_order <=> $right_order;
        });

        return array(
            'terms' => array_map(function ($term) use ($taxonomy) {
                $parent_id = isset($term->parent) ? absint($term->parent) : 0;
                $parent_name = '';
                $parent_slug = '';
                if ($parent_id > 0) {
                    $parent_term = get_term($parent_id, $taxonomy);
                    if ($parent_term instanceof WP_Term && !is_wp_error($parent_term)) {
                        $parent_name = platform_submissions_decode_html_entities((string) $parent_term->name);
                        $parent_slug = (string) $parent_term->slug;
                    }
                }

                return array(
                    'id' => (int) $term->term_id,
                    'name' => platform_submissions_decode_html_entities((string) $term->name),
                    'slug' => (string) $term->slug,
                    'count' => (int) $term->count,
                    'order' => absint(get_term_meta($term->term_id, 'platform_term_order', true)),
                    'parentId' => $parent_id,
                    'parentName' => $parent_name,
                    'parentSlug' => $parent_slug,
                );
            }, $terms),
        );
    }
}

if (!function_exists('platform_submissions_get_form_config')) {
    function platform_submissions_get_form_config($kind, $category_id = 0, $city_id = 0) {
        $taxonomy = platform_submissions_taxonomy_for_kind($kind);
        $location_taxonomy = platform_submissions_location_taxonomy_for_kind($kind);
        $category_parent = 0;
        $city_parent = 0;

        if (absint($category_id) > 0 && $taxonomy !== '') {
            $category = get_term(absint($category_id), $taxonomy);
            if ($category instanceof WP_Term) {
                $category_parent = (int) $category->term_id;
            }
        }
        if (absint($city_id) > 0 && $location_taxonomy !== '') {
            $city = get_term(absint($city_id), $location_taxonomy);
            if ($city instanceof WP_Term) {
                $city_parent = (int) $city->term_id;
            }
        }

        // The form only needs root options initially. Children are requested
        // after the user picks their parent, avoiding a huge payload and DOM.
        $terms = platform_submissions_get_taxonomy_terms($kind, $category_parent, 100);
        if (is_wp_error($terms)) {
            return $terms;
        }

        $locations = platform_submissions_get_location_terms($kind, $city_parent, 100);
        if (is_wp_error($locations)) {
            return $locations;
        }

        return array(
            'terms' => is_array($terms['terms'] ?? null) ? $terms['terms'] : array(),
            'locations' => is_array($locations['terms'] ?? null) ? $locations['terms'] : array(),
            // Checkout loads its own catalog. Opening a form must not depend on
            // WooCommerce products or subscription data.
            'pricing' => null,
        );
    }
}

if (!function_exists('platform_submissions_pricing_catalog_definitions')) {
    function platform_submissions_pricing_catalog_definitions() {
        return array(
            array('code' => 'news_post_30d', 'sku' => 'news_post_30d', 'kind' => 'news', 'action' => 'post', 'variant' => '', 'durationDays' => 30),
            array('code' => 'news_boost_7d', 'sku' => 'news_boost_7d', 'kind' => 'news', 'action' => 'boost', 'variant' => '', 'durationDays' => 7),
            array('code' => 'job_post_30d', 'sku' => 'job_post_30d', 'kind' => 'job', 'action' => 'post', 'variant' => '', 'durationDays' => 30),
            array('code' => 'job_boost_7d', 'sku' => 'job_boost_7d', 'kind' => 'job', 'action' => 'boost', 'variant' => '', 'durationDays' => 7),
            array('code' => 'classified_post_30d_1_photo', 'sku' => 'classified_post_30d_1_photo', 'kind' => 'classified', 'action' => 'post', 'variant' => '1_photo', 'durationDays' => 30),
            array('code' => 'classified_post_30d_4_photo', 'sku' => 'classified_post_30d_4_photo', 'kind' => 'classified', 'action' => 'post', 'variant' => '4_photo', 'durationDays' => 30),
            array('code' => 'classified_boost_7d', 'sku' => 'classified_boost_7d', 'kind' => 'classified', 'action' => 'boost', 'variant' => '', 'durationDays' => 7),
            array('code' => 'tender_post_30d', 'sku' => 'tender_post_30d', 'kind' => 'tender', 'action' => 'post', 'variant' => '', 'durationDays' => 30),
            array('code' => 'tender_boost_7d', 'sku' => 'tender_boost_7d', 'kind' => 'tender', 'action' => 'boost', 'variant' => '', 'durationDays' => 7),
        );
    }
}

if (!function_exists('platform_submissions_get_pricing_rule')) {
    function platform_submissions_get_pricing_rule($code) {
        $code = sanitize_key((string) $code);
        if ($code === '') {
            return array();
        }

        $rules = get_option('platform_2424_pricing_rules', array());
        if (!is_array($rules) || !isset($rules[$code]) || !is_array($rules[$code])) {
            return array();
        }

        return $rules[$code];
    }
}

if (!function_exists('platform_submissions_get_pricing_definition')) {
    function platform_submissions_get_pricing_definition($code) {
        $code = sanitize_key((string) $code);
        if ($code === '') {
            return null;
        }

        foreach (platform_submissions_pricing_catalog_definitions() as $definition) {
            $definition_code = sanitize_key((string) ($definition['code'] ?? ''));
            if ($definition_code !== $code) {
                continue;
            }

            $rule = platform_submissions_get_pricing_rule($code);
            $definition['configuredProductId'] = absint($rule['product_id'] ?? 0);
            $configured_duration = absint($rule['duration_days'] ?? 0);
            if ($configured_duration > 0) {
                $definition['durationDays'] = $configured_duration;
            }

            return $definition;
        }

        return null;
    }
}

if (!function_exists('platform_submissions_get_pricing_display_label')) {
    function platform_submissions_get_pricing_display_label($code) {
        $definition = platform_submissions_get_pricing_definition($code);
        if (!is_array($definition)) {
            return '';
        }

        $kind_labels = array(
            'classified' => 'Petites annonces',
            'job' => 'Offres d\'emploi',
            'tender' => 'Appels d\'offres',
            'news' => 'Actualités',
        );
        $action_labels = array(
            'post' => 'Publication',
            'boost' => 'Boost',
            'extend' => 'Prolongation',
        );

        $kind = sanitize_key((string) ($definition['kind'] ?? ''));
        $action = sanitize_key((string) ($definition['action'] ?? ''));
        $duration_days = absint($definition['durationDays'] ?? 0);
        if (!isset($kind_labels[$kind], $action_labels[$action]) || $duration_days <= 0) {
            return '';
        }

        return sprintf('%s %d jours — %s', $action_labels[$action], $duration_days, $kind_labels[$kind]);
    }
}

if (!function_exists('platform_submissions_invalidate_pricing_catalog')) {
    /**
     * The catalogue is used by checkout quotes as well as the admin settings.
     * Clear every historical key so a tariff change is reflected immediately.
     */
    function platform_submissions_invalidate_pricing_catalog() {
        delete_transient('platform_submissions_pricing_catalog_v1');
        delete_transient('platform_submissions_pricing_catalog_v2');
        delete_transient('platform_submissions_pricing_catalog_v3');
        delete_transient('platform_submissions_pricing_catalog_v4');
    }
}

if (!function_exists('platform_submissions_get_pricing_catalog')) {
    function platform_submissions_get_pricing_catalog() {
        if (!function_exists('wc_get_product_id_by_sku') || !function_exists('wc_get_product')) {
            return new WP_Error('platform_submissions_woocommerce_missing', 'WooCommerce non disponible.', array('status' => 500));
        }

        // v4 deliberately starts cold after the cache-invalidation fix. Old v3
        // entries may otherwise survive a plugin update for up to five minutes.
        $cache_key = 'platform_submissions_pricing_catalog_v4';
        $cached = get_transient($cache_key);
        if (is_array($cached) && isset($cached['items']) && is_array($cached['items'])) {
            return $cached;
        }

        $items = array();
        foreach (platform_submissions_pricing_catalog_definitions() as $definition) {
            $resolved_definition = platform_submissions_get_pricing_definition($definition['code'] ?? '');
            if (is_array($resolved_definition)) {
                $definition = $resolved_definition;
            }

            $sku = sanitize_text_field((string) ($definition['sku'] ?? ''));
            $configured_product_id = absint($definition['configuredProductId'] ?? 0);
            $product_id = $configured_product_id > 0 ? $configured_product_id : ($sku !== '' ? (int) wc_get_product_id_by_sku($sku) : 0);
            $product = $product_id > 0 ? wc_get_product($product_id) : null;

            $price_string = ($product && method_exists($product, 'get_price')) ? (string) $product->get_price() : '';
            $price_number = is_numeric($price_string) ? (float) $price_string : null;

            $items[] = array(
                'code' => sanitize_key((string) ($definition['code'] ?? '')),
                'sku' => $sku,
                'kind' => sanitize_key((string) ($definition['kind'] ?? '')),
                'action' => sanitize_key((string) ($definition['action'] ?? '')),
                'variant' => sanitize_key((string) ($definition['variant'] ?? '')),
                'durationDays' => (int) ($definition['durationDays'] ?? 0),
                'wcProductId' => $product_id > 0 ? $product_id : null,
                'name' => $product ? sanitize_text_field((string) $product->get_name()) : null,
                'price' => $price_number,
                'currency' => function_exists('get_woocommerce_currency') ? (string) get_woocommerce_currency() : null,
                'status' => ($product && method_exists($product, 'get_status')) ? sanitize_key((string) $product->get_status()) : null,
                'exists' => $product_id > 0,
            );
        }

        $result = array(
            'generatedAt' => gmdate('c'),
            'items' => $items,
        );

        set_transient($cache_key, $result, 5 * MINUTE_IN_SECONDS);
        return $result;
    }
}

if (!function_exists('platform_submissions_get_listing_payable_quote')) {
    function platform_submissions_listing_is_ready_for_payment($post_id) {
        $status = sanitize_key((string) get_post_meta($post_id, '_platform_submission_finalization_status', true));
        return $status === '' || $status === 'ready';
    }

    function platform_submissions_get_listing_payable_quote($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);
        $action = sanitize_key((string) ($payload['action'] ?? 'post'));
        if ($action !== 'boost') {
            $action = 'post';
        }

        if ($user_id <= 0 || $listing_id <= 0) {
            return new WP_Error('platform_submissions_invalid_payload', 'wpUserId et listingId sont requis.', array('status' => 400));
        }

        $post = get_post($listing_id);
        $post_kind = $post ? platform_submissions_map_post_type_to_kind($post->post_type) : '';
        if (!$post || !in_array($post_kind, array('classified', 'job', 'tender', 'news'), true)) {
            return new WP_Error('platform_submissions_listing_not_found', 'Contenu introuvable.', array('status' => 404));
        }

        if ((int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Ce contenu ne vous appartient pas.', array('status' => 403));
        }

        if (!platform_submissions_listing_is_ready_for_payment($listing_id)) {
            return new WP_Error('platform_submissions_listing_finalizing', 'La preparation de cette annonce est encore en cours.', array('status' => 409));
        }

        if (platform_submissions_is_deadline_expired($post)) {
            return new WP_Error('platform_submissions_listing_deadline_expired', 'La date limite de cette offre est deja depassee.', array('status' => 409));
        }

        $allowed_statuses = array('pending', 'draft', 'private', 'publish');
        if (!in_array((string) $post->post_status, $allowed_statuses, true)) {
            return new WP_Error('platform_submissions_listing_not_payable', 'Ce contenu n est pas payable dans son etat actuel.', array('status' => 409));
        }

        $payment_status = sanitize_key((string) get_post_meta($listing_id, 'payment_status', true));
        $is_expired = platform_submissions_is_content_expired($listing_id);
        $image_count = 0;
        $photo_pack = '1_photo';
        $pricing_code = '';

        if ($action === 'boost') {
            if ((string) $post->post_status !== 'publish') {
                return new WP_Error('platform_submissions_listing_not_published', 'Boost possible uniquement pour un contenu publie.', array('status' => 409));
            }

            if ($payment_status !== 'paid' || $is_expired) {
                return new WP_Error('platform_submissions_listing_not_boostable', 'Boost impossible tant que le contenu n est pas actif et visible.', array('status' => 409));
            }

            $pricing_code = platform_submissions_get_boost_pricing_code_for_post($post);
        } else {
            if ((string) $post->post_status === 'publish' && $payment_status === 'paid' && !$is_expired) {
                return new WP_Error('platform_submissions_listing_already_paid', 'Ce contenu est deja marque comme paye.', array('status' => 409));
            }

            if ($post->post_type === 'classified_ad') {
                $gallery_images = get_post_meta($listing_id, 'gallery_images', true);
                if (!is_array($gallery_images)) {
                    $gallery_images = array();
                }

                $unique_gallery = array_values(array_unique(array_filter(array_map('platform_submissions_rewrite_media_url', $gallery_images))));
                $featured_image_url = platform_submissions_rewrite_media_url((string) get_post_meta($listing_id, 'featured_image_url', true));
                if ($featured_image_url !== '' && !in_array($featured_image_url, $unique_gallery, true)) {
                    array_unshift($unique_gallery, $featured_image_url);
                }

                $image_count = count($unique_gallery);
                $photo_pack = $image_count > 1 ? '4_photo' : '1_photo';
            }

            $pricing_code = platform_submissions_get_default_pricing_code_for_post($post);
        }

        if ($pricing_code === '') {
            return new WP_Error('platform_submissions_missing_pricing_code', 'Impossible de determiner le code tarifaire.', array('status' => 409));
        }

        $response_kind = $post_kind === 'news' ? 'article' : $post_kind;

        return array(
            'listingId' => $listing_id,
            'kind' => $response_kind,
            'action' => $action,
            'postStatus' => (string) $post->post_status,
            'paymentStatus' => $payment_status !== '' ? $payment_status : 'unpaid',
            'imageCount' => $image_count,
            'photoPack' => $photo_pack,
            'pricingCode' => $pricing_code,
            'title' => platform_submissions_decode_html_entities(get_the_title($post)),
        );
    }
}

if (!function_exists('platform_submissions_get_classified_payable_quote')) {
    function platform_submissions_get_classified_payable_quote($payload) {
        return platform_submissions_get_listing_payable_quote($payload);
    }
}

if (!function_exists('platform_submissions_mark_listing_paid')) {
    function platform_submissions_finalize_listing_order($order, $session_id, $listing_id, $pricing_code = '') {
        if (!$order || !is_a($order, 'WC_Order')) {
            return 0;
        }

        $session_id = sanitize_text_field((string) $session_id);
        $listing_id = absint($listing_id);
        $pricing_code = sanitize_key((string) $pricing_code);

        if ($session_id !== '') {
            $order->update_meta_data('_stripe_checkout_session_id', $session_id);
            $order->update_meta_data('_platform_stripe_checkout_session_id', $session_id);
        }

        if ($listing_id > 0) {
            $order->update_meta_data('_2424_listing_id', (string) $listing_id);
        }

        if ($pricing_code !== '') {
            $order->update_meta_data('_2424_pricing_code', $pricing_code);
        }

        if (!$order->get_date_paid()) {
            $order->payment_complete($session_id);
        }

        if (!$order->has_status(array('completed'))) {
            $order->set_status('completed', 'Annonce classee payee et publiee automatiquement.');
        }

        $order->save();
        return absint($order->get_id());
    }

    function platform_submissions_revalidate_listing_boost($post) {
        if (!($post instanceof WP_Post) || !function_exists('next_revalidate_post_payload') || !function_exists('next_revalidate_send_payload')) {
            return;
        }

        // A boost only updates post meta, so save_post never notifies Next.js.
        // Send a dedicated event to clear the cached featured listing collection.
        next_revalidate_send_payload(next_revalidate_post_payload('listing.boosted', $post));
    }

    function platform_submissions_mark_listing_paid($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);
        $session_id = sanitize_text_field((string) ($payload['sessionId'] ?? ''));
        $pricing_code = sanitize_key((string) ($payload['pricingCode'] ?? ''));
        $wp_product_id = absint($payload['wpProductId'] ?? 0);
        $scheduled_publish = platform_submissions_normalize_scheduled_publish_at($payload['scheduledPublishAt'] ?? '');
        $scheduled_publish_at = (string) $scheduled_publish['iso'];
        $scheduled_publish_ts = (int) $scheduled_publish['timestamp'];

        if ($user_id <= 0 || $listing_id <= 0 || $session_id === '') {
            return new WP_Error('platform_submissions_invalid_payload', 'wpUserId, listingId et sessionId sont requis.', array('status' => 400));
        }

        $post = get_post($listing_id);
        $post_kind = $post ? platform_submissions_map_post_type_to_kind($post->post_type) : '';
        if (!$post || !in_array($post_kind, array('classified', 'job', 'tender', 'news'), true)) {
            return new WP_Error('platform_submissions_listing_not_found', 'Contenu introuvable.', array('status' => 404));
        }

        if ((int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Ce contenu ne vous appartient pas.', array('status' => 403));
        }

        if (!platform_submissions_listing_is_ready_for_payment($listing_id)) {
            return new WP_Error('platform_submissions_listing_finalizing', 'La preparation de cette annonce est encore en cours.', array('status' => 409));
        }

        $existing_status = sanitize_key((string) get_post_meta($listing_id, 'payment_status', true));
        $existing_session = sanitize_text_field((string) get_post_meta($listing_id, 'stripe_checkout_session_id', true));
        if ($existing_status === 'paid' && $existing_session === $session_id) {
            $existing_order_id = absint(get_post_meta($listing_id, 'woo_order_id', true));
            if ($existing_order_id > 0 && function_exists('wc_get_order')) {
                $existing_order = wc_get_order($existing_order_id);
                if ($existing_order && !is_wp_error($existing_order)) {
                    platform_submissions_finalize_listing_order($existing_order, $session_id, $listing_id, $pricing_code);
                }
            }

            if (strpos($pricing_code, 'boost_7d') !== false) {
                platform_submissions_revalidate_listing_boost($post);
            }

            return array(
                'listingId' => $listing_id,
                'paymentStatus' => 'paid',
                'alreadyPaid' => true,
                'scheduledPublishAt' => sanitize_text_field((string) get_post_meta($listing_id, 'scheduled_publish_at', true)) ?: null,
                'isScheduled' => platform_submissions_is_scheduled_for_future($listing_id),
            );
        }

        if ((strpos($pricing_code, 'boost_7d') !== false || strpos($pricing_code, 'extend_7d') !== false) && (string) $post->post_status !== 'publish') {
            return new WP_Error('platform_submissions_listing_not_published', 'Boost/rallonge possibles uniquement pour un contenu publie.', array('status' => 409));
        }
        if (strpos($pricing_code, 'boost_7d') !== false && platform_submissions_is_content_expired($listing_id)) {
            return new WP_Error('platform_submissions_listing_expired', 'Boost impossible sur un contenu expire.', array('status' => 409));
        }
        $pricing_definition = platform_submissions_get_pricing_definition($pricing_code);
        $is_boost_pricing = strpos($pricing_code, 'boost_7d') !== false;
        $next_expires_ts = $is_boost_pricing
            ? platform_submissions_apply_boost_to_post($listing_id, $pricing_code, array(
                'preserveExisting' => true,
            ))
            : platform_submissions_apply_expiration_to_post($listing_id, $pricing_code, array(
                'preserveExisting' => false,
                'nowTs' => $scheduled_publish_ts > time() ? $scheduled_publish_ts : time(),
            ));

        update_post_meta($listing_id, 'payment_status', 'paid');
        update_post_meta($listing_id, 'stripe_checkout_session_id', $session_id);
        update_post_meta($listing_id, 'payment_paid_at', gmdate('c'));
        if ($scheduled_publish_ts > time()) {
            update_post_meta($listing_id, 'scheduled_publish_at', $scheduled_publish_at);
            update_post_meta($listing_id, 'scheduled_publish_at_ts', (string) $scheduled_publish_ts);
        } else {
            delete_post_meta($listing_id, 'scheduled_publish_at');
            delete_post_meta($listing_id, 'scheduled_publish_at_ts');
        }

        if ((string) $post->post_status !== 'publish' && strpos($pricing_code, 'boost_7d') === false && strpos($pricing_code, 'extend_7d') === false) {
            wp_update_post(array(
                'ID' => $listing_id,
                'post_status' => 'publish',
            ));
        }

        $woo_order_id = 0;
        if (function_exists('wc_get_orders') && function_exists('wc_create_order') && function_exists('wc_get_product') && function_exists('wc_get_order')) {
            $existing_order_ids = wc_get_orders(array(
                'limit' => 1,
                'return' => 'ids',
                'meta_key' => '_platform_stripe_checkout_session_id',
                'meta_value' => $session_id,
            ));

            if (empty($existing_order_ids)) {
                $existing_order_ids = wc_get_orders(array(
                    'limit' => 1,
                    'return' => 'ids',
                    'meta_key' => '_stripe_checkout_session_id',
                    'meta_value' => $session_id,
                ));
            }

            if (is_array($existing_order_ids) && !empty($existing_order_ids)) {
                $existing_order = wc_get_order(absint($existing_order_ids[0]));
                if ($existing_order && !is_wp_error($existing_order)) {
                    $woo_order_id = platform_submissions_finalize_listing_order($existing_order, $session_id, $listing_id, $pricing_code);
                }
            } else {
                if ($wp_product_id <= 0 && is_array($pricing_definition)) {
                    $wp_product_id = absint($pricing_definition['configuredProductId'] ?? 0);
                    if ($wp_product_id <= 0 && !empty($pricing_definition['sku']) && function_exists('wc_get_product_id_by_sku')) {
                        $wp_product_id = (int) wc_get_product_id_by_sku((string) $pricing_definition['sku']);
                    }
                }
            }

            if ($wp_product_id > 0) {
                $product = wc_get_product($wp_product_id);
                if ($product) {
                    $order = wc_create_order(array(
                        'customer_id' => $user_id,
                    ));

                    if ($order && !is_wp_error($order)) {
                        $order->add_product($product, 1);
                        $order->set_created_via('2424-listing');
                        $order->set_payment_method('stripe');
                        $order->set_payment_method_title('Stripe');
                        $order->calculate_totals();
                        $woo_order_id = platform_submissions_finalize_listing_order($order, $session_id, $listing_id, $pricing_code);
                    }
                }
            }
        }

        if ($woo_order_id > 0) {
            update_post_meta($listing_id, 'woo_order_id', (string) $woo_order_id);
        }

        if ($is_boost_pricing) {
            platform_submissions_revalidate_listing_boost($post);
        }

        return array(
            'listingId' => $listing_id,
            'paymentStatus' => 'paid',
            'alreadyPaid' => false,
            'postStatus' => 'publish',
            'scheduledPublishAt' => $scheduled_publish_at !== '' ? $scheduled_publish_at : null,
            'isScheduled' => $scheduled_publish_ts > time(),
            'expiresAt' => gmdate('c', $next_expires_ts),
            'wooOrderId' => $woo_order_id > 0 ? $woo_order_id : null,
        );
    }
}

if (!function_exists('platform_submissions_get_listing_image_urls')) {
    function platform_submissions_use_included_listing_access($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);
        $scheduled_publish = platform_submissions_normalize_scheduled_publish_at($payload['scheduledPublishAt'] ?? '');
        $scheduled_publish_at = (string) $scheduled_publish['iso'];
        $scheduled_publish_ts = (int) $scheduled_publish['timestamp'];

        if ($user_id <= 0 || $listing_id <= 0) {
            return new WP_Error('platform_submissions_invalid_payload', 'wpUserId et listingId sont requis.', array('status' => 400));
        }

        $post = get_post($listing_id);
        $post_kind = $post ? platform_submissions_map_post_type_to_kind($post->post_type) : '';
        if (!$post || !in_array($post_kind, array('classified', 'job', 'tender'), true)) {
            return new WP_Error('platform_submissions_listing_not_found', 'Contenu introuvable.', array('status' => 404));
        }

        if ((int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Ce contenu ne vous appartient pas.', array('status' => 403));
        }

        if (!platform_submissions_listing_is_ready_for_payment($listing_id)) {
            return new WP_Error('platform_submissions_listing_finalizing', 'La preparation de cette annonce est encore en cours.', array('status' => 409));
        }

        if (platform_submissions_is_deadline_expired($post)) {
            return new WP_Error('platform_submissions_listing_deadline_expired', 'La date limite de cette offre est deja depassee.', array('status' => 409));
        }

        $pricing_code = platform_submissions_get_default_pricing_code_for_post($post);
        if ($pricing_code === '') {
            return new WP_Error('platform_submissions_missing_pricing_code', 'Impossible de determiner le code tarifaire inclus.', array('status' => 409));
        }

        $was_already_paid = sanitize_key((string) get_post_meta($listing_id, 'payment_status', true)) === 'paid';
        $included_credit_meta_key = 'platform_2424_included_publication_consumed_at';
        $should_consume_included_credit = !$was_already_paid && !metadata_exists('post', $listing_id, $included_credit_meta_key);
        $legacy_post_type = $post_kind === 'job'
            ? 'job_offer'
            : ($post_kind === 'tender' ? 'tender_notice' : 'classified_ad');

        // Enforce the same entitlement server-side so an internal API request
        // cannot publish a tender without an available included credit.
        if (function_exists('platform_auth_get_publishing_access_status')) {
            $publishing_access_status = platform_auth_get_publishing_access_status(array('wpUserId' => $user_id));
            if (is_wp_error($publishing_access_status)) {
                return $publishing_access_status;
            }

            $access_key = $post_kind === 'job' ? 'jobs' : ($post_kind === 'tender' ? 'tenders' : 'classifieds');
            $access = is_array($publishing_access_status[$access_key] ?? null) ? $publishing_access_status[$access_key] : array();
            if (empty($access['canPublish'])) {
                return new WP_Error('platform_submissions_included_access_forbidden', 'Votre plan actuel ne permet pas cette publication incluse.', array('status' => 403));
            }
            if (isset($access['monthlyRemaining']) && absint($access['monthlyRemaining']) <= 0) {
                return new WP_Error('platform_submissions_included_access_exhausted', 'Votre quota mensuel inclus est déjà atteint.', array('status' => 403));
            }
        }

        // Initialize the legacy counter before this listing is marked paid. Otherwise a
        // first-use migration can count this same listing once in the legacy query and once again here.
        if ($should_consume_included_credit && function_exists('platform_auth_get_user_monthly_included_publication_count')) {
            platform_auth_get_user_monthly_included_publication_count($user_id, $post_kind, $legacy_post_type);
        }

        $next_expires_ts = platform_submissions_apply_expiration_to_post($listing_id, $pricing_code, array(
            'preserveExisting' => false,
            'nowTs' => $scheduled_publish_ts > time() ? $scheduled_publish_ts : time(),
        ));
        if ($next_expires_ts <= 0) {
            return new WP_Error('platform_submissions_expiration_failed', 'Impossible de definir la duree de publication.', array('status' => 409));
        }

        if ((string) $post->post_status !== 'publish') {
            $published = wp_update_post(array(
                'ID' => $listing_id,
                'post_status' => 'publish',
            ), true);
            if (is_wp_error($published) || !$published) {
                return is_wp_error($published)
                    ? $published
                    : new WP_Error('platform_submissions_publish_failed', 'Impossible de publier ce contenu.', array('status' => 500));
            }
        }

        $published_post = get_post($listing_id);
        if (!$published_post || (string) $published_post->post_status !== 'publish') {
            return new WP_Error('platform_submissions_publish_failed', 'Impossible de confirmer la publication de ce contenu.', array('status' => 500));
        }

        if (!$was_already_paid) {
            update_post_meta($listing_id, 'payment_status', 'paid');
            update_post_meta($listing_id, 'payment_paid_at', gmdate('c'));
            delete_post_meta($listing_id, 'stripe_checkout_session_id');
        }

        if ($scheduled_publish_ts > time()) {
            update_post_meta($listing_id, 'scheduled_publish_at', $scheduled_publish_at);
            update_post_meta($listing_id, 'scheduled_publish_at_ts', (string) $scheduled_publish_ts);
        } else {
            delete_post_meta($listing_id, 'scheduled_publish_at');
            delete_post_meta($listing_id, 'scheduled_publish_at_ts');
        }

        // Claim the credit once with an atomic post-meta insert. Retries keep the listing
        // published but cannot consume another credit.
        $included_credit_consumed = false;
        if ($should_consume_included_credit) {
            $included_credit_consumed = add_post_meta($listing_id, $included_credit_meta_key, gmdate('c'), true);
            if ($included_credit_consumed && function_exists('platform_auth_increment_user_monthly_included_publication_count')) {
                platform_auth_increment_user_monthly_included_publication_count(
                    $user_id,
                    $post_kind,
                    $legacy_post_type
                );
            }
        }

        $publishing_access_status = function_exists('platform_auth_get_publishing_access_status')
            ? platform_auth_get_publishing_access_status(array('wpUserId' => $user_id))
            : null;

        return array(
            'listingId' => $listing_id,
            'paymentStatus' => 'paid',
            'postStatus' => 'publish',
            'scheduledPublishAt' => $scheduled_publish_at !== '' ? $scheduled_publish_at : null,
            'isScheduled' => $scheduled_publish_ts > time(),
            'expiresAt' => gmdate('c', $next_expires_ts),
            'pricingCode' => $pricing_code,
            'usedIncludedAccess' => true,
            'alreadyPaid' => $was_already_paid,
            'includedCreditConsumed' => (bool) $included_credit_consumed,
            'publishingAccessStatus' => is_wp_error($publishing_access_status) ? null : $publishing_access_status,
        );
    }

    function platform_submissions_use_all_privileges_listing_access($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);
        $action = sanitize_key((string) ($payload['action'] ?? 'post')) === 'boost' ? 'boost' : 'post';
        $request_id = sanitize_text_field((string) ($payload['requestId'] ?? ''));

        if ($user_id <= 0 || $listing_id <= 0 || $request_id === '') {
            return new WP_Error('platform_submissions_invalid_payload', 'wpUserId, listingId et requestId sont requis.', array('status' => 400));
        }
        if (!function_exists('platform_billing_user_has_all_privileges') || !platform_billing_user_has_all_privileges($user_id)) {
            return new WP_Error('platform_submissions_all_privileges_forbidden', 'Cet accès gratuit est indisponible pour ce compte.', array('status' => 403));
        }

        $post = get_post($listing_id);
        if (!$post || !in_array(platform_submissions_map_post_type_to_kind($post->post_type), array('classified', 'job', 'tender'), true)) {
            return new WP_Error('platform_submissions_listing_not_found', 'Contenu introuvable.', array('status' => 404));
        }
        if ((int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Ce contenu ne vous appartient pas.', array('status' => 403));
        }
        if (!platform_submissions_listing_is_ready_for_payment($listing_id)) {
            return new WP_Error('platform_submissions_listing_finalizing', 'La preparation de ce contenu est encore en cours.', array('status' => 409));
        }

        $processed_request_id = sanitize_text_field((string) get_post_meta($listing_id, '_platform_all_privileges_request_id', true));
        if ($processed_request_id !== '' && hash_equals($processed_request_id, $request_id)) {
            return array(
                'listingId' => $listing_id,
                'action' => $action,
                'accessGrant' => 'all_privileges',
                'alreadyProcessed' => true,
                'paymentStatus' => sanitize_key((string) get_post_meta($listing_id, 'payment_status', true)),
                'postStatus' => (string) get_post_status($listing_id),
            );
        }

        if ($action === 'post') {
            $result = platform_submissions_use_included_listing_access(array(
                'wpUserId' => $user_id,
                'listingId' => $listing_id,
                'scheduledPublishAt' => $payload['scheduledPublishAt'] ?? '',
            ));
            if (is_wp_error($result)) {
                return $result;
            }
        } else {
            if ((string) $post->post_status !== 'publish') {
                return new WP_Error('platform_submissions_listing_not_published', 'La mise en avant est disponible uniquement pour un contenu publie.', array('status' => 409));
            }
            if (platform_submissions_is_content_expired($listing_id)) {
                return new WP_Error('platform_submissions_listing_expired', 'La mise en avant est indisponible pour un contenu expire.', array('status' => 409));
            }
            $quote = platform_submissions_get_listing_payable_quote(array('wpUserId' => $user_id, 'listingId' => $listing_id, 'action' => 'boost'));
            if (is_wp_error($quote)) {
                return $quote;
            }
            $boost_expires_at = platform_submissions_apply_boost_to_post($listing_id, (string) $quote['pricingCode'], array('preserveExisting' => true));
            if ($boost_expires_at <= 0) {
                return new WP_Error('platform_submissions_boost_failed', 'Impossible d activer la mise en avant.', array('status' => 409));
            }
            update_post_meta($listing_id, 'payment_status', 'paid');
            update_post_meta($listing_id, 'payment_paid_at', gmdate('c'));
            $result = array(
                'listingId' => $listing_id,
                'action' => 'boost',
                'paymentStatus' => 'paid',
                'postStatus' => 'publish',
                'boostExpiresAt' => gmdate('c', $boost_expires_at),
                'pricingCode' => sanitize_key((string) $quote['pricingCode']),
            );
            platform_submissions_revalidate_listing_boost($post);
        }

        update_post_meta($listing_id, 'payment_method', 'all_privileges');
        update_post_meta($listing_id, '_platform_all_privileges_request_id', $request_id);
        update_post_meta($listing_id, '_platform_all_privileges_last_action', $action);
        update_post_meta($listing_id, '_platform_all_privileges_applied_at', gmdate('c'));
        if (function_exists('platform_2424_log')) {
            platform_2424_log('info', 'All privileges listing action applied.', array('wpUserId' => $user_id, 'listingId' => $listing_id, 'action' => $action));
        }

        return array_merge($result, array('action' => $action, 'accessGrant' => 'all_privileges', 'alreadyProcessed' => false));
    }

    function platform_submissions_get_listing_image_urls($post_id, $post_type = '') {
        $post_id = absint($post_id);
        if ($post_id <= 0) {
            return array();
        }

        $resolved_post_type = $post_type !== '' ? (string) $post_type : (string) get_post_type($post_id);
        $gallery_images = get_post_meta($post_id, 'gallery_images', true);
        if (!is_array($gallery_images)) {
            $gallery_images = array();
        }

        $unique_gallery_urls = array_values(array_unique(array_filter(array_map('platform_submissions_rewrite_media_url', $gallery_images))));
        $featured_image_url = platform_submissions_rewrite_media_url((string) get_post_meta($post_id, 'featured_image_url', true));
        if ($featured_image_url !== '' && !in_array($featured_image_url, $unique_gallery_urls, true)) {
            array_unshift($unique_gallery_urls, $featured_image_url);
        }

        return array_slice($unique_gallery_urls, 0, $resolved_post_type === 'classified_ad' ? platform_submissions_get_classified_gallery_limit_max() : 10);
    }
}

if (!function_exists('platform_submissions_update_classified_item')) {
    function platform_submissions_update_classified_item($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);

        if ($user_id <= 0 || $listing_id <= 0) {
            return new WP_Error('platform_submissions_invalid_payload', 'wpUserId et listingId sont requis.', array('status' => 400));
        }

        $post = get_post($listing_id);
        if (!$post || $post->post_type !== 'classified_ad') {
            return new WP_Error('platform_submissions_listing_not_found', 'Annonce introuvable.', array('status' => 404));
        }

        if ((int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Cette annonce ne vous appartient pas.', array('status' => 403));
        }

        $allowed_statuses = array('pending', 'draft', 'publish');
        if (!in_array((string) $post->post_status, $allowed_statuses, true)) {
            return new WP_Error('platform_submissions_listing_not_editable', 'Cette annonce ne peut ÃƒÆ’Ã‚Âªtre modifiÃƒÆ’Ã‚Â©e que lorsqu elle est en brouillon, en attente ou dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  publiÃƒÆ’Ã‚Â©e.', array('status' => 409));
        }

        $photo_limit_check = platform_submissions_validate_classified_photo_limit($payload, $user_id);
        if (is_wp_error($photo_limit_check)) {
            return $photo_limit_check;
        }

        $previous_image_descriptors = platform_submissions_get_listing_media_descriptors($listing_id);

        $is_published = (string) $post->post_status === 'publish';
        $title = $is_published
            ? (string) $post->post_title
            : sanitize_text_field(platform_submissions_decode_html_entities((string) ($payload['title'] ?? $post->post_title)));
        $content = wp_kses_post((string) ($payload['content'] ?? $post->post_content));
        $excerpt = wp_kses_post((string) ($payload['excerpt'] ?? $post->post_excerpt));
        if ($title === '' || $content === '') {
            return new WP_Error('platform_submissions_invalid_payload', 'Titre et contenu requis.', array('status' => 400));
        }

        $updated = platform_submissions_with_deferred_revalidation(function () use ($listing_id, $title, $content, $excerpt) {
            return wp_update_post(array(
                'ID' => $listing_id,
                'post_title' => $title,
                'post_content' => $content,
                'post_excerpt' => $excerpt,
            ), true);
        }, array($listing_id));

        if (is_wp_error($updated)) {
            return $updated;
        }

        $meta_updates = array(
            'price' => sanitize_text_field((string) ($payload['price'] ?? '')),
            'currency' => sanitize_text_field((string) ($payload['currency'] ?? 'MGA')),
            'contact_phone' => sanitize_text_field((string) ($payload['contactPhone'] ?? '')),
            'contact_phone_country' => sanitize_key((string) ($payload['contactPhoneCountry'] ?? '')),
            'company_name' => sanitize_text_field((string) ($payload['companyName'] ?? '')),
            'condition' => sanitize_text_field((string) ($payload['condition'] ?? '')),
        );

        foreach ($meta_updates as $meta_key => $meta_value) {
            if ($meta_value === '') {
                delete_post_meta($listing_id, $meta_key);
            } else {
                update_post_meta($listing_id, $meta_key, $meta_value);
            }
        }
        $category_name = sanitize_text_field((string) ($payload['category'] ?? ''));
        $type_name = sanitize_text_field((string) ($payload['type'] ?? ''));
        platform_submissions_with_deferred_revalidation(function () use ($listing_id, $category_name, $type_name, $payload) {
            platform_submissions_assign_taxonomy_selection($listing_id, 'classified_category', $category_name, $type_name);
            platform_submissions_assign_classified_product_tag($listing_id, sanitize_text_field((string) ($payload['productTag'] ?? '')));
            platform_submissions_assign_structured_location($listing_id, 'classified', $payload);
        }, array($listing_id));

        $image_result = platform_submissions_attach_images_to_post($listing_id, 'classified_ad', $user_id, $payload);
        if (is_wp_error($image_result)) {
            return $image_result;
        }

        if (sanitize_key((string) get_post_meta($listing_id, '_platform_submission_finalization_status', true)) === 'failed') {
            delete_post_meta($listing_id, '_platform_submission_finalization_payload');
            platform_submissions_update_classified_finalization_status($listing_id, 'ready');
        }

        $post_status = (string) $post->post_status;
        $payment_status = sanitize_key((string) get_post_meta($listing_id, 'payment_status', true));
        $updated_image_urls = platform_submissions_get_listing_image_urls($listing_id, 'classified_ad');
        $did_upgrade_photo_pack = $is_published && count($previous_image_descriptors) <= 1 && count($updated_image_urls) > 1;

        $updated_image_descriptors = platform_submissions_get_listing_media_descriptors($listing_id);
        $updated_urls = array();
        foreach ($updated_image_descriptors as $descriptor) {
            $updated_urls[$descriptor['url']] = true;
        }
        $removed_image_descriptors = array_values(array_filter($previous_image_descriptors, function ($descriptor) use ($updated_urls) {
            return empty($updated_urls[$descriptor['url'] ?? '']);
        }));
        $media_cleanup = platform_submissions_cleanup_media_descriptors($removed_image_descriptors, $listing_id);

        if ($did_upgrade_photo_pack) {
            $draft_result = wp_update_post(array(
                'ID' => $listing_id,
                'post_status' => 'draft',
            ), true);

            if (is_wp_error($draft_result)) {
                return $draft_result;
            }

            update_post_meta($listing_id, 'payment_status', 'unpaid');
            $post_status = 'draft';
            $payment_status = 'unpaid';
        }

        return array(
            'id' => $listing_id,
            'status' => 'updated',
            'postStatus' => $post_status,
            'paymentStatus' => $payment_status !== '' ? $payment_status : 'unpaid',
            'requiresRepublish' => $did_upgrade_photo_pack,
            'cleanedMediaUrls' => $media_cleanup['cleaned'],
            'queuedMediaUrls' => $media_cleanup['queued'],
            'blockedMediaUrls' => $media_cleanup['blocked'],
            'mediaCleanupActionIds' => $media_cleanup['actionIds'],
        );
    }
}

if (!function_exists('platform_submissions_trash_listing_item')) {
    /**
     * Moves an owned listing to the trash exactly once. A retried request may
     * arrive after WordPress completed the first deletion but before its HTTP
     * response reached the caller, so an already-trashed post is a success.
     */
    function platform_submissions_trash_listing_item($listing_id, $post) {
        $started_at = microtime(true);
        if ((string) $post->post_status === 'trash') {
            return array('alreadyDeleted' => true, 'trashDurationMs' => 0);
        }

        $defer_revalidation = function ($defer, $post_id) use ($listing_id) {
            return $defer || absint($post_id) === absint($listing_id);
        };
        add_filter('next_revalidate_defer_post_payload', $defer_revalidation, 10, 2);
        try {
            $trashed = wp_trash_post($listing_id);
        } finally {
            remove_filter('next_revalidate_defer_post_payload', $defer_revalidation, 10);
        }
        if ($trashed) {
            return array('alreadyDeleted' => false, 'trashDurationMs' => (int) round((microtime(true) - $started_at) * 1000));
        }

        // A concurrent request can trash the post between the first read and
        // wp_trash_post(). Re-read it before reporting a real failure.
        $current_post = get_post($listing_id);
        if ($current_post && (string) $current_post->post_status === 'trash') {
            return array('alreadyDeleted' => true, 'trashDurationMs' => (int) round((microtime(true) - $started_at) * 1000));
        }

        return new WP_Error('platform_submissions_delete_failed', 'Suppression impossible.', array('status' => 500));
    }
}

if (!function_exists('platform_submissions_log_slow_listing_deletion')) {
    function platform_submissions_log_slow_listing_deletion($kind, $listing_id, $timings) {
        $total_ms = absint($timings['totalMs'] ?? 0);
        if ($total_ms < 500 || !function_exists('platform_2424_log_event')) {
            return;
        }

        platform_2424_log_event('warning', 'submissions', 'Suppression de listing lente.', array(
            'kind' => sanitize_key($kind),
            'listingId' => absint($listing_id),
            'totalMs' => $total_ms,
            'mediaResolveMs' => absint($timings['mediaResolveMs'] ?? 0),
            'trashMs' => absint($timings['trashMs'] ?? 0),
            'mediaQueueMs' => absint($timings['mediaQueueMs'] ?? 0),
        ));
    }
}

if (!function_exists('platform_submissions_delete_classified_item')) {
    function platform_submissions_delete_classified_item($payload) {
        $started_at = microtime(true);
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);

        if ($user_id <= 0 || $listing_id <= 0) {
            return new WP_Error('platform_submissions_invalid_payload', 'wpUserId et listingId sont requis.', array('status' => 400));
        }

        $post = get_post($listing_id);
        if (!$post || $post->post_type !== 'classified_ad') {
            return new WP_Error('platform_submissions_listing_not_found', 'Annonce introuvable.', array('status' => 404));
        }

        if ((int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Cette annonce ne vous appartient pas.', array('status' => 403));
        }

        $trash_result = platform_submissions_trash_listing_item($listing_id, $post);
        if (is_wp_error($trash_result)) {
            return $trash_result;
        }

        $already_deleted = !empty($trash_result['alreadyDeleted']);
        // Storage cleanup is intentionally deferred to the orphan-media audit.
        // Cancelling only prevents a pending finalizer from attaching new files.
        platform_submissions_cancel_classified_finalization($listing_id);
        platform_submissions_log_slow_listing_deletion('classified', $listing_id, array(
            'totalMs' => (int) round((microtime(true) - $started_at) * 1000),
            'trashMs' => $trash_result['trashDurationMs'] ?? 0,
        ));

        return array(
            'id' => $listing_id,
            'status' => 'deleted',
            'alreadyDeleted' => $already_deleted,
        );
    }
}

if (!function_exists('platform_submissions_update_job_item')) {
    function platform_submissions_update_job_item($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);

        if ($user_id <= 0 || $listing_id <= 0) {
            return new WP_Error('platform_submissions_invalid_payload', 'wpUserId et listingId sont requis.', array('status' => 400));
        }

        $post = get_post($listing_id);
        if (!$post || $post->post_type !== 'job_offer') {
            return new WP_Error('platform_submissions_listing_not_found', 'Offre introuvable.', array('status' => 404));
        }

        if ((int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Cette offre ne vous appartient pas.', array('status' => 403));
        }

        $allowed_statuses = array('pending', 'draft', 'publish');
        if (!in_array((string) $post->post_status, $allowed_statuses, true)) {
            return new WP_Error('platform_submissions_listing_not_editable', 'Cette offre ne peut ÃƒÆ’Ã‚Âªtre modifiÃƒÆ’Ã‚Â©e que lorsqu elle est en brouillon, en attente ou dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  publiÃƒÆ’Ã‚Â©e.', array('status' => 409));
        }

        $is_published = (string) $post->post_status === 'publish';
        $title = $is_published
            ? (string) $post->post_title
            : sanitize_text_field(platform_submissions_decode_html_entities((string) ($payload['title'] ?? $post->post_title)));
        $content = wp_kses_post((string) ($payload['content'] ?? $post->post_content));
        $excerpt = wp_kses_post((string) ($payload['excerpt'] ?? $post->post_excerpt));
        if ($title === '' || $content === '') {
            return new WP_Error('platform_submissions_invalid_payload', 'Titre et contenu requis.', array('status' => 400));
        }

        $updated = platform_submissions_with_deferred_revalidation(function () use ($listing_id, $title, $content, $excerpt) {
            return wp_update_post(array(
                'ID' => $listing_id,
                'post_title' => $title,
                'post_content' => $content,
                'post_excerpt' => $excerpt,
            ), true);
        }, array($listing_id));

        if (is_wp_error($updated)) {
            return $updated;
        }

        $meta_updates = array(
            'skills' => wp_json_encode(platform_submissions_sanitize_string_list($payload['skills'] ?? array(), 5)),
            'experience_years' => sanitize_text_field((string) ($payload['experienceYears'] ?? '')),
            'need_by' => sanitize_text_field((string) ($payload['needBy'] ?? '')),
            'deadline' => sanitize_text_field((string) ($payload['deadline'] ?? '')),
            'contact_phone' => sanitize_text_field((string) ($payload['contactPhone'] ?? '')),
            'contact_phone_country' => sanitize_key((string) ($payload['contactPhoneCountry'] ?? '')),
            'contact_email' => sanitize_email((string) ($payload['contactEmail'] ?? '')),
            'company_name' => sanitize_text_field((string) ($payload['companyName'] ?? '')),
        );

        foreach ($meta_updates as $meta_key => $meta_value) {
            if ($meta_value === '') {
                delete_post_meta($listing_id, $meta_key);
            } else {
                update_post_meta($listing_id, $meta_key, $meta_value);
            }
        }

        $category_name = sanitize_text_field((string) ($payload['category'] ?? ''));
        $type_name = sanitize_text_field((string) ($payload['type'] ?? ''));
        platform_submissions_with_deferred_revalidation(function () use ($listing_id, $category_name, $type_name, $payload) {
            if ($category_name !== '' && taxonomy_exists('job_category')) {
                platform_submissions_assign_taxonomy_selection($listing_id, 'job_category', $category_name, $type_name);
            }

            platform_submissions_assign_structured_location($listing_id, 'job', $payload);
        }, array($listing_id));

        $image_result = platform_submissions_attach_images_to_post($listing_id, 'job_offer', $user_id, $payload);
        if (is_wp_error($image_result)) {
            return $image_result;
        }

        return array(
            'id' => $listing_id,
            'status' => 'updated',
        );
    }
}

if (!function_exists('platform_submissions_delete_job_item')) {
    function platform_submissions_delete_job_item($payload) {
        $started_at = microtime(true);
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);

        if ($user_id <= 0 || $listing_id <= 0) {
            return new WP_Error('platform_submissions_invalid_payload', 'wpUserId et listingId sont requis.', array('status' => 400));
        }

        $post = get_post($listing_id);
        if (!$post || $post->post_type !== 'job_offer') {
            return new WP_Error('platform_submissions_listing_not_found', 'Offre introuvable.', array('status' => 404));
        }

        if ((int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Cette offre ne vous appartient pas.', array('status' => 403));
        }

        $trash_result = platform_submissions_trash_listing_item($listing_id, $post);
        if (is_wp_error($trash_result)) {
            return $trash_result;
        }
        platform_submissions_log_slow_listing_deletion('job', $listing_id, array(
            'totalMs' => (int) round((microtime(true) - $started_at) * 1000),
            'trashMs' => $trash_result['trashDurationMs'] ?? 0,
        ));

        return array(
            'id' => $listing_id,
            'status' => 'deleted',
            'alreadyDeleted' => !empty($trash_result['alreadyDeleted']),
        );
    }
}

if (!function_exists('platform_submissions_update_tender_item')) {
    function platform_submissions_update_tender_item($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);

        if ($user_id <= 0 || $listing_id <= 0) {
            return new WP_Error('platform_submissions_invalid_payload', 'wpUserId et listingId sont requis.', array('status' => 400));
        }

        $post = get_post($listing_id);
        if (!$post || $post->post_type !== 'tender_notice') {
            return new WP_Error('platform_submissions_listing_not_found', 'Appel d\'offre introuvable.', array('status' => 404));
        }

        if ((int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Cet appel d\'offre ne vous appartient pas.', array('status' => 403));
        }

        $allowed_statuses = array('pending', 'draft', 'publish');
        if (!in_array((string) $post->post_status, $allowed_statuses, true)) {
            return new WP_Error('platform_submissions_listing_not_editable', 'Cet appel d offre ne peut ÃƒÆ’Ã‚Âªtre modifiÃƒÆ’Ã‚Â© que lorsqu il est en brouillon, en attente ou dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  publiÃƒÆ’Ã‚Â©.', array('status' => 409));
        }

        $is_published = (string) $post->post_status === 'publish';
        $title = $is_published
            ? (string) $post->post_title
            : sanitize_text_field(platform_submissions_decode_html_entities((string) ($payload['title'] ?? $post->post_title)));
        $content = wp_kses_post((string) ($payload['content'] ?? $post->post_content));
        $excerpt = wp_kses_post((string) ($payload['excerpt'] ?? $post->post_excerpt));
        if ($title === '' || $content === '') {
            return new WP_Error('platform_submissions_invalid_payload', 'Titre et contenu requis.', array('status' => 400));
        }

        $updated = platform_submissions_with_deferred_revalidation(function () use ($listing_id, $title, $content, $excerpt) {
            return wp_update_post(array(
                'ID' => $listing_id,
                'post_title' => $title,
                'post_content' => $content,
                'post_excerpt' => $excerpt,
            ), true);
        }, array($listing_id));

        if (is_wp_error($updated)) {
            return $updated;
        }

        $meta_updates = array(
            'location' => sanitize_text_field((string) ($payload['location'] ?? '')),
            'deadline' => sanitize_text_field((string) ($payload['deadline'] ?? '')),
            'budget' => sanitize_text_field((string) ($payload['budget'] ?? '')),
            'currency' => sanitize_text_field((string) ($payload['currency'] ?? 'MGA')),
            'details_pdf_url' => esc_url_raw((string) ($payload['detailsPdfUrl'] ?? '')),
            'details_pdf_name' => sanitize_text_field((string) ($payload['detailsPdfName'] ?? '')),
            'contact_phone' => sanitize_text_field((string) ($payload['contactPhone'] ?? '')),
            'contact_phone_country' => sanitize_key((string) ($payload['contactPhoneCountry'] ?? '')),
            'company_name' => sanitize_text_field((string) ($payload['companyName'] ?? '')),
        );

        foreach ($meta_updates as $meta_key => $meta_value) {
            if ($meta_value === '') {
                delete_post_meta($listing_id, $meta_key);
            } else {
                update_post_meta($listing_id, $meta_key, $meta_value);
            }
        }

        $category_name = sanitize_text_field((string) ($payload['category'] ?? ''));
        $type_name = sanitize_text_field((string) ($payload['type'] ?? ''));
        platform_submissions_with_deferred_revalidation(function () use ($listing_id, $category_name, $type_name) {
            if ($category_name !== '' && taxonomy_exists('tender_category')) {
                platform_submissions_assign_taxonomy_selection($listing_id, 'tender_category', $category_name, $type_name);
            }
        }, array($listing_id));

        $image_result = platform_submissions_attach_images_to_post($listing_id, 'tender_notice', $user_id, $payload);
        if (is_wp_error($image_result)) {
            return $image_result;
        }

        return array(
            'id' => $listing_id,
            'status' => 'updated',
        );
    }
}

if (!function_exists('platform_submissions_delete_tender_item')) {
    function platform_submissions_delete_tender_item($payload) {
        $started_at = microtime(true);
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);

        if ($user_id <= 0 || $listing_id <= 0) {
            return new WP_Error('platform_submissions_invalid_payload', 'wpUserId et listingId sont requis.', array('status' => 400));
        }

        $post = get_post($listing_id);
        if (!$post || $post->post_type !== 'tender_notice') {
            return new WP_Error('platform_submissions_listing_not_found', 'Appel d\'offre introuvable.', array('status' => 404));
        }

        if ((int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Cet appel d\'offre ne vous appartient pas.', array('status' => 403));
        }

        $trash_result = platform_submissions_trash_listing_item($listing_id, $post);
        if (is_wp_error($trash_result)) {
            return $trash_result;
        }
        platform_submissions_log_slow_listing_deletion('tender', $listing_id, array(
            'totalMs' => (int) round((microtime(true) - $started_at) * 1000),
            'trashMs' => $trash_result['trashDurationMs'] ?? 0,
        ));

        return array(
            'id' => $listing_id,
            'status' => 'deleted',
            'alreadyDeleted' => !empty($trash_result['alreadyDeleted']),
        );
    }
}

if (!function_exists('platform_submissions_move_item_to_draft')) {
    function platform_submissions_move_item_to_draft($payload, $expected_post_type, $labels = array()) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $listing_id = absint($payload['listingId'] ?? 0);
        $singular = isset($labels['singular']) ? (string) $labels['singular'] : 'contenu';

        if ($user_id <= 0 || $listing_id <= 0) {
            return new WP_Error('platform_submissions_invalid_payload', 'wpUserId et listingId sont requis.', array('status' => 400));
        }

        $post = get_post($listing_id);
        if (!$post || $post->post_type !== $expected_post_type) {
            return new WP_Error('platform_submissions_listing_not_found', ucfirst($singular) . ' introuvable.', array('status' => 404));
        }

        if ((int) $post->post_author !== $user_id) {
            return new WP_Error('platform_submissions_listing_forbidden', 'Ce contenu ne vous appartient pas.', array('status' => 403));
        }

        $payment_status = sanitize_key((string) get_post_meta($listing_id, 'payment_status', true));
        if ($payment_status !== 'paid') {
            return new WP_Error('platform_submissions_listing_not_paid', 'Ce contenu doit etre paye avant changement de statut.', array('status' => 409));
        }

        $current_status = sanitize_key((string) $post->post_status);
        $is_expired = platform_submissions_is_content_expired($listing_id);
        if ($current_status === 'draft') {
            return array(
                'id' => $listing_id,
                'status' => 'draft',
                'postStatus' => 'draft',
                'expiresAt' => sanitize_text_field((string) get_post_meta($listing_id, 'listing_expires_at', true)),
                'isExpired' => $is_expired,
            );
        }

        $updated = wp_update_post(array(
            'ID' => $listing_id,
            'post_status' => 'draft',
        ), true);

        if (is_wp_error($updated)) {
            return $updated;
        }

        return array(
            'id' => $listing_id,
            'status' => 'draft',
            'postStatus' => 'draft',
            'expiresAt' => sanitize_text_field((string) get_post_meta($listing_id, 'listing_expires_at', true)),
            'isExpired' => $is_expired,
        );
    }
}

if (!function_exists('platform_submissions_mark_classified_paid')) {
    function platform_submissions_mark_classified_paid($payload) {
        return platform_submissions_mark_listing_paid($payload);
    }
}

if (!function_exists('platform_submissions_expiration_batch_size')) {
    function platform_submissions_expiration_batch_size($value = 200) {
        return min(500, max(1, absint($value)));
    }
}

if (!function_exists('platform_submissions_build_expired_listing_meta_query')) {
    function platform_submissions_build_expired_listing_meta_query($now_ts = null) {
        $now_ts = $now_ts !== null ? (int) $now_ts : time();

        return array(
            'relation' => 'OR',
            array(
                'key' => 'listing_expires_at_ts',
                'value' => $now_ts,
                'compare' => '<',
                'type' => 'NUMERIC',
            ),
            // Les nouvelles offres utilisent une date ISO. Ce filtre evite de
            // parcourir les contenus sans date limite a chaque cron.
            array(
                'key' => 'deadline',
                'value' => gmdate('Y-m-d', $now_ts),
                'compare' => '<=',
                'type' => 'DATE',
            ),
        );
    }
}

if (!function_exists('platform_submissions_draft_expired_listing')) {
    function platform_submissions_draft_expired_listing($post_id, $now_ts = null) {
        $post_id = absint($post_id);
        if ($post_id <= 0) {
            return false;
        }

        $now_ts = $now_ts !== null ? (int) $now_ts : time();
        $expires_ts = absint(get_post_meta($post_id, 'listing_expires_at_ts', true));
        $is_listing_expired = $expires_ts > 0 && $expires_ts < $now_ts;
        $is_deadline_expired = platform_submissions_is_deadline_expired($post_id, $now_ts);

        if (!$is_listing_expired && !$is_deadline_expired) {
            return false;
        }

        $updated = wp_update_post(array(
            'ID' => $post_id,
            'post_status' => 'draft',
        ), true);

        return !is_wp_error($updated) && $updated > 0;
    }
}

if (!function_exists('platform_submissions_expire_published_listings')) {
    function platform_submissions_expire_published_listings($args = array()) {
        $now_ts = isset($args['nowTs']) ? (int) $args['nowTs'] : time();
        $batch_size = platform_submissions_expiration_batch_size($args['batch'] ?? 200);
        $query = new WP_Query(array(
            'post_type' => array('classified_ad', 'job_offer', 'tender_notice'),
            'post_status' => 'publish',
            'posts_per_page' => $batch_size,
            'fields' => 'ids',
            'no_found_rows' => true,
            'orderby' => 'ID',
            'order' => 'ASC',
            'meta_query' => platform_submissions_build_expired_listing_meta_query($now_ts),
        ));
        $expired_count = 0;

        foreach ((array) $query->posts as $post_id) {
            if (platform_submissions_draft_expired_listing($post_id, $now_ts)) {
                $expired_count++;
            }
        }

        return array(
            'checked' => count((array) $query->posts),
            'expired' => $expired_count,
        );
    }
}

if (!function_exists('platform_submissions_backfill_expiration_batch')) {
    function platform_submissions_backfill_expiration_batch($args = array()) {
        global $wpdb;

        $now_ts = isset($args['nowTs']) ? (int) $args['nowTs'] : time();
        $batch_size = platform_submissions_expiration_batch_size($args['batch'] ?? 200);
        $offset = max(0, absint($args['offset'] ?? 0));
        $dry_run = !empty($args['dryRun']);
        $post_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts} WHERE post_type IN ('classified_ad', 'job_offer', 'tender_notice') AND post_status = 'publish' AND ID > %d ORDER BY ID ASC LIMIT %d",
            $offset,
            $batch_size
        ));
        $post_ids = array_values(array_filter(array_map('absint', (array) $post_ids)));
        $backfilled = 0;
        $expired = 0;
        $last_id = $offset;

        foreach ($post_ids as $post_id) {
            $last_id = $post_id;
            $needs_backfill = get_post_meta($post_id, 'listing_expires_at_ts', true) === '';
            $expires_ts = platform_submissions_resolve_listing_expires_ts($post_id, array(
                'backfill' => !$dry_run,
                'nowTs' => $now_ts,
            ));
            if ($expires_ts > 0 && $needs_backfill) {
                $backfilled++;
            }

            $is_listing_expired = $expires_ts > 0 && $expires_ts < $now_ts;
            $is_deadline_expired = platform_submissions_is_deadline_expired($post_id, $now_ts);
            if (($is_listing_expired || $is_deadline_expired) && (!$dry_run ? platform_submissions_draft_expired_listing($post_id, $now_ts) : true)) {
                $expired++;
            }
        }

        return array(
            'checked' => count($post_ids),
            'backfilled' => $backfilled,
            'expired' => $expired,
            'nextOffset' => $last_id,
        );
    }
}

if (!function_exists('platform_submissions_clear_admin_article_expirations_batch')) {
    /**
     * Removes legacy listing expiry metadata from editorial posts authored in WP.
     * Platform-submitted paid articles keep their own duration metadata intact.
     */
    function platform_submissions_clear_admin_article_expirations_batch($args = array()) {
        global $wpdb;

        $batch_size = platform_submissions_expiration_batch_size($args['batch'] ?? 200);
        $offset = max(0, absint($args['offset'] ?? 0));
        $dry_run = !empty($args['dryRun']);
        $post_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT DISTINCT posts.ID
             FROM {$wpdb->posts} AS posts
             INNER JOIN {$wpdb->postmeta} AS expiration_meta
                ON expiration_meta.post_id = posts.ID
                AND expiration_meta.meta_key IN ('listing_expires_at', 'listing_expires_at_ts')
             WHERE posts.post_type = 'post'
                AND posts.ID > %d
                AND NOT EXISTS (
                    SELECT 1 FROM {$wpdb->postmeta} AS source_meta
                    WHERE source_meta.post_id = posts.ID
                        AND source_meta.meta_key = 'submission_source'
                        AND source_meta.meta_value = 'next-frontend'
                )
             ORDER BY posts.ID ASC
             LIMIT %d",
            $offset,
            $batch_size
        ));
        $post_ids = array_values(array_filter(array_map('absint', (array) $post_ids)));
        $last_id = $offset;
        $cleared = 0;

        foreach ($post_ids as $post_id) {
            $last_id = $post_id;
            if (!$dry_run) {
                delete_post_meta($post_id, 'listing_expires_at');
                delete_post_meta($post_id, 'listing_expires_at_ts');
            }
            $cleared++;
        }

        return array(
            'checked' => count($post_ids),
            'cleared' => $cleared,
            'nextOffset' => $last_id,
            'hasMore' => count($post_ids) === $batch_size,
        );
    }
}

if (!function_exists('platform_submissions_schedule_expiration_cron')) {
    function platform_submissions_schedule_expiration_cron() {
        if (!wp_next_scheduled('platform_submissions_expire_classified_ads_event')) {
            wp_schedule_event(time() + MINUTE_IN_SECONDS, 'hourly', 'platform_submissions_expire_classified_ads_event');
        }
    }
}

add_action('init', 'platform_submissions_schedule_expiration_cron', 40);
add_action('platform_submissions_expire_classified_ads_event', 'platform_submissions_expire_published_listings');

if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('2424 backfill-trashed-media-cleanup', function ($args, $assoc_args) {
        $result = platform_submissions_backfill_trashed_media_cleanup();
        if (is_wp_error($result)) {
            WP_CLI::error($result->get_error_message());
        }
        WP_CLI::success(!empty($result['alreadyScheduled'])
            ? 'Une recherche des suppressions manquées est déjà en cours.'
            : 'Recherche des suppressions manquées planifiée dans Action Scheduler.');
    });

    WP_CLI::add_command('2424 repair-article-preview-spaces', function ($args, $assoc_args) {
        $dry_run = isset($assoc_args['dry-run']);
        $report = platform_submissions_repair_legacy_article_preview_spaces($dry_run);
        $prefix = $dry_run ? 'Simulation : ' : '';
        $ids = $report['updatedIds'] ? implode(', ', $report['updatedIds']) : 'aucun';

        WP_CLI::success(sprintf(
            '%s%d article(s) vérifié(s), %d aperçu(s) réglé(s) à 115 espaces, %d ignoré(s). IDs : %s.',
            $prefix,
            $report['checked'],
            $report['updated'],
            $report['skipped'],
            $ids
        ));
    });

    WP_CLI::add_command('2424 migrate-locations', function ($args, $assoc_args) {
        $report = platform_submissions_migrate_shared_locations_batch(
            isset($assoc_args['batch']) ? $assoc_args['batch'] : 200,
            isset($assoc_args['offset']) ? $assoc_args['offset'] : 0,
            isset($assoc_args['dry-run'])
        );
        WP_CLI::success(sprintf(
            '%s%d contenu(s) vérifié(s), %d migration(s). %s',
            isset($assoc_args['dry-run']) ? 'Simulation : ' : '',
            $report['checked'],
            $report['migrated'],
            $report['hasMore'] ? 'Reprendre avec --offset=' . $report['nextOffset'] . '.' : 'Migration terminée.'
        ));
    });

    WP_CLI::add_command('2424 expire-listings', function ($args, $assoc_args) {
        $result = platform_submissions_backfill_expiration_batch(array(
            'batch' => isset($assoc_args['batch']) ? $assoc_args['batch'] : 200,
            'offset' => isset($assoc_args['offset']) ? $assoc_args['offset'] : 0,
            'dryRun' => isset($assoc_args['dry-run']),
        ));
        $prefix = !empty($assoc_args['dry-run']) ? 'Simulation : ' : '';
        WP_CLI::success(sprintf(
            '%s%d contenu(s) verifie(s), %d expiration(s) renseignee(s), %d contenu(s) expire(s). Reprendre avec --offset=%d.',
            $prefix,
            $result['checked'],
            $result['backfilled'],
            $result['expired'],
            $result['nextOffset']
        ));
    });

    WP_CLI::add_command('2424 clear-admin-article-expirations', function ($args, $assoc_args) {
        $result = platform_submissions_clear_admin_article_expirations_batch(array(
            'batch' => isset($assoc_args['batch']) ? $assoc_args['batch'] : 200,
            'offset' => isset($assoc_args['offset']) ? $assoc_args['offset'] : 0,
            'dryRun' => isset($assoc_args['dry-run']),
        ));
        WP_CLI::success(sprintf(
            '%s%d article(s) editorial(aux) verifie(s), %d date(s) d expiration supprimee(s). %s',
            !empty($assoc_args['dry-run']) ? 'Simulation : ' : '',
            $result['checked'],
            $result['cleared'],
            $result['hasMore'] ? 'Reprendre avec --offset=' . $result['nextOffset'] . '.' : 'Nettoyage termine.'
        ));
    });
}

add_action('rest_api_init', function () {
    register_rest_route('2424/v1', '/auth/sync-user', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_sync_user($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/news/article/view', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_track_news_article_view($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/news/article/comments', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_get_news_article_comments($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/news/article/comments/create', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_create_news_article_comment($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/(?P<kind>classified|tender|article|job)', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $kind = (string) $request->get_param('kind');
            $result = platform_submissions_insert_content($kind, $request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/classified/finalization-status', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_get_classified_finalization_status($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/(?P<kind>classified|tender|article|job)/mine', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $kind = (string) $request->get_param('kind');
            $result = platform_submissions_get_user_items($kind, $request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/(?P<kind>classified|tender|job)/mine/(?P<listing_id>\d+)', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $payload = $request->get_json_params() ?: array();
            $payload['listingId'] = absint($request->get_param('listing_id'));
            $result = platform_submissions_get_user_item((string) $request->get_param('kind'), $payload);
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response(array('item' => $result));
        },
    ));

    register_rest_route('2424/v1', '/submissions/(?P<kind>classified|tender|job)/form-config', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_get_form_config(
                (string) $request->get_param('kind'),
                absint($request->get_param('categoryId')),
                absint($request->get_param('cityId'))
            );
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/public/(?P<kind>classified|tender|job|directory)', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $kind = (string) $request->get_param('kind');
            $result = platform_submissions_get_public_items($kind, $request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/seo/sitemap/(?P<kind>classified|tender|job)', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_get_sitemap_listing_items(
                sanitize_key((string) $request->get_param('kind')),
                $request->get_json_params() ?: array()
            );
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/public/view', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_track_public_view($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/taxonomies/(?P<kind>classified|tender|job|directory)/terms', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $kind = (string) $request->get_param('kind');
            $result = platform_submissions_get_taxonomy_terms($kind);
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/taxonomies/(?P<kind>classified|job|tender|directory)/locations', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $kind = (string) $request->get_param('kind');
            $result = platform_submissions_get_location_terms($kind);
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/classified/payable', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_get_classified_payable_quote($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/listing/payable', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_get_listing_payable_quote($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/classified/mark-paid', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_mark_classified_paid($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/listing/mark-paid', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_mark_listing_paid($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/listing/use-included-access', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_use_included_listing_access($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/listing/use-all-privileges', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_use_all_privileges_listing_access($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/classified/update', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_update_classified_item($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/classified/delete', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_delete_classified_item($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/job/update', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_update_job_item($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/job/delete', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_delete_job_item($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/tender/update', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_update_tender_item($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/tender/delete', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_delete_tender_item($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/classified/status', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_move_item_to_draft($request->get_json_params() ?: array(), 'classified_ad', array(
                'singular' => 'annonce',
            ));
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/job/status', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_move_item_to_draft($request->get_json_params() ?: array(), 'job_offer', array(
                'singular' => 'offre',
            ));
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/submissions/tender/status', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_move_item_to_draft($request->get_json_params() ?: array(), 'tender_notice', array(
                'singular' => "appel d'offre",
            ));
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/ratings/user/upsert', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_submissions_upsert_user_rating($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/ratings/user/summary', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $params = $request->get_json_params() ?: array();
            $seller_user_id = isset($params['sellerUserId']) ? absint($params['sellerUserId']) : 0;
            return rest_ensure_response(platform_submissions_get_user_rating_summary($seller_user_id));
        },
    ));

    register_rest_route('2424/v1', '/ratings/user/current', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $params = $request->get_json_params() ?: array();
            $seller_user_id = isset($params['sellerUserId']) ? absint($params['sellerUserId']) : 0;
            $rater_user_id = isset($params['raterUserId']) ? absint($params['raterUserId']) : 0;
            $listing_id = isset($params['listingId']) ? absint($params['listingId']) : 0;
            $rating = platform_submissions_get_existing_user_rating($seller_user_id, $rater_user_id, $listing_id);

            return rest_ensure_response(array(
                'hasRated' => !empty($rating),
                'ratingId' => absint($rating['ratingId'] ?? 0),
                'score' => absint($rating['score'] ?? 0),
            ));
        },
    ));

    register_rest_route('2424/v1', '/pricing/catalog', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_submissions_ensure_request_authorized($request);
        },
        'callback' => function () {
            $result = platform_submissions_get_pricing_catalog();
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));
});











