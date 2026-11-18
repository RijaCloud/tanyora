<?php

class Platform_2424_Stress_Test_Tools_Test extends WP_UnitTestCase {
    public function test_stress_test_is_disabled_outside_recognized_staging() {
        update_option('platform_2424_stress_test_enabled', 'yes', false);

        $this->assertSame('no', platform_2424_stress_test_sanitize_enabled('yes'));
        $this->assertFalse(platform_2424_stress_test_is_enabled());
    }

    public function test_unknown_campaign_cannot_be_deleted() {
        update_option(platform_2424_stress_test_campaign_option(), array('id' => 'known-campaign'), false);
        $result = platform_2424_stress_test_delete_campaign('other-campaign', true);

        $this->assertWPError($result);
        $this->assertSame('stress_test_campaign_missing', $result->get_error_code());
    }

    public function test_mass_media_catalog_normalizes_and_deduplicates_https_urls() {
        $catalog = platform_2424_stress_mass_normalize_catalog("https://cdn.example.test/avatar-a.jpg\nhttp://cdn.example.test/not-allowed.jpg\nhttps://cdn.example.test/avatar-a.jpg\nhttps://cdn.example.test/avatar-b.jpg");

        $this->assertSame(array(
            'https://cdn.example.test/avatar-a.jpg',
            'https://cdn.example.test/avatar-b.jpg',
        ), $catalog);
        $this->assertFalse(platform_2424_stress_mass_catalog_input_is_valid("https://cdn.example.test/avatar-a.jpg\nhttp://cdn.example.test/not-allowed.jpg"));
    }

    public function test_mass_media_catalog_preserves_legacy_single_fixture() {
        update_option('platform_2424_stress_mass_fixture_avatar', 'https://cdn.example.test/legacy-avatar.jpg', false);
        delete_option('platform_2424_stress_mass_catalog_avatar');

        $this->assertSame(array('https://cdn.example.test/legacy-avatar.jpg'), platform_2424_stress_mass_catalog('avatar'));
        $this->assertSame(array('https://cdn.example.test/frozen-avatar.jpg'), platform_2424_stress_mass_campaign_catalog(array(
            'settings' => array('fixtures' => array('avatar' => 'https://cdn.example.test/frozen-avatar.jpg')),
        ), 'avatar'));
    }

    public function test_stress_users_are_never_eligible_for_the_public_directory() {
        $user_id = self::factory()->user->create();
        update_user_meta($user_id, 'platform_2424_test_data', '1');
        update_user_meta($user_id, 'platform_plan_id', 'business');
        update_user_meta($user_id, 'platform_directory_visibility_enabled', '1');

        $this->assertFalse(platform_submissions_is_business_user_visible_in_directory($user_id));
    }

    public function test_admin_directory_hide_override_prevents_visibility() {
        $user_id = self::factory()->user->create();
        update_user_meta($user_id, 'platform_plan_id', 'business');
        update_user_meta($user_id, 'platform_directory_visibility_enabled', '1');
        update_user_meta($user_id, '_platform_directory_hidden_by_admin', '1');

        $this->assertFalse(platform_submissions_is_business_user_visible_in_directory($user_id));
    }
}
