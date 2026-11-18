<?php

class Platform_2424_Auth_Test extends WP_UnitTestCase {
    public function test_password_policy_requires_eight_characters_and_all_complexity_rules() {
        $this->assertTrue(platform_auth_password_is_strong('Abcdef1!'));
        $this->assertFalse(platform_auth_password_is_strong('Abcde1!'));
        $this->assertFalse(platform_auth_password_is_strong('abcdef1!'));
        $this->assertFalse(platform_auth_password_is_strong('ABCDEF1!'));
        $this->assertFalse(platform_auth_password_is_strong('Abcdefgh!'));
        $this->assertFalse(platform_auth_password_is_strong('Abcdef12'));
    }

    public function test_password_change_verifies_the_current_password_before_updating() {
        $user_id = self::factory()->user->create(array(
            'user_login' => 'password-change-user',
            'user_pass' => 'Current1!',
            'user_email' => 'password-change@example.test',
        ));

        $invalid = platform_auth_change_password(array(
            'wpUserId' => $user_id,
            'currentPassword' => 'WrongPass1!',
            'newPassword' => 'Updated1!',
        ));
        $this->assertWPError($invalid);
        $this->assertSame('platform_auth_current_password_invalid', $invalid->get_error_code());

        $result = platform_auth_change_password(array(
            'wpUserId' => $user_id,
            'currentPassword' => 'Current1!',
            'newPassword' => 'Updated1!',
        ));
        $this->assertIsArray($result);
        $this->assertTrue($result['ok']);

        $updated_user = get_user_by('id', $user_id);
        $this->assertFalse(wp_check_password('Current1!', $updated_user->user_pass, $user_id));
        $this->assertTrue(wp_check_password('Updated1!', $updated_user->user_pass, $user_id));
    }
}
