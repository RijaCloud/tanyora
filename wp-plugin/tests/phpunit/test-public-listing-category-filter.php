<?php

class Platform_Public_Listing_Category_Filter_Test extends WP_UnitTestCase {
    public function test_parent_category_matches_all_assigned_categories_and_descendants() {
        global $wpdb;
        if (!taxonomy_exists('classified_category')) {
            register_taxonomy('classified_category', 'classified_ad', array('hierarchical' => true));
        }
        platform_2424_public_listing_index_install_schema();
        $parent = self::factory()->term->create(array('taxonomy' => 'classified_category', 'name' => 'Mode & Accessoire'));
        $child = self::factory()->term->create(array('taxonomy' => 'classified_category', 'name' => 'Chaussures', 'parent' => $parent));
        $other = self::factory()->term->create(array('taxonomy' => 'classified_category', 'name' => 'Autre categorie'));
        $multi = self::factory()->post->create(array('post_type' => 'classified_ad', 'post_status' => 'publish'));
        $direct = self::factory()->post->create(array('post_type' => 'classified_ad', 'post_status' => 'publish'));
        $unrelated = self::factory()->post->create(array('post_type' => 'classified_ad', 'post_status' => 'publish'));
        wp_set_object_terms($multi, array($child, $other), 'classified_category');
        wp_set_object_terms($direct, array($parent), 'classified_category');
        wp_set_object_terms($unrelated, array($other), 'classified_category');

        $table = platform_2424_public_listing_index_table();
        foreach (array($multi, $direct, $unrelated) as $id) {
            $wpdb->replace($table, array(
                'listing_id' => $id, 'kind' => 'classified', 'post_type' => 'classified_ad',
                'is_visible' => 1, 'published_at' => time(), 'category_name' => $id === $direct ? 'Mode &amp; Accessoire' : 'Autre categorie',
                'search_text' => '', 'payload' => wp_json_encode(array('id' => $id)),
                'updated_at' => current_time('mysql', true),
            ));
        }
        $result = platform_2424_public_listing_index_query('classified', array('category' => 'Mode & Accessoire'));
        $ids = array_column($result['items'], 'id');
        $this->assertContains($multi, $ids);
        $this->assertContains($direct, $ids);
        $this->assertNotContains($unrelated, $ids);
        $this->assertSame(2, $result['pagination']['total']);
        $wpdb->query($wpdb->prepare("DELETE FROM {$table} WHERE listing_id IN (%d, %d, %d)", $multi, $direct, $unrelated));
    }
}
