<?php
/**
 * 2424 Platform Auth module
 * Description: WordPress-backed auth endpoints for the Next.js frontend.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('PLATFORM_2424_AUTH_MODULE_VERSION')) {
    define('PLATFORM_2424_AUTH_MODULE_VERSION', '1.0.1');
}

if (!function_exists('platform_auth_secret')) {
    function platform_auth_secret() {
        if (function_exists('platform_submissions_secret')) {
            return platform_submissions_secret();
        }

        if (defined('PLATFORM_SUBMISSIONS_SECRET') && PLATFORM_SUBMISSIONS_SECRET) {
            return PLATFORM_SUBMISSIONS_SECRET;
        }

        $env = getenv('PLATFORM_SUBMISSIONS_SECRET');
        return $env ? $env : '';
    }
}

if (!function_exists('platform_auth_set_last_mail_error')) {
    function platform_auth_set_last_mail_error($message) {
        $message = trim((string) $message);
        update_option('platform_auth_last_mail_error', $message, false);
    }

    function platform_auth_get_last_mail_error() {
        return trim((string) get_option('platform_auth_last_mail_error', ''));
    }

    function platform_auth_clear_last_mail_error() {
        delete_option('platform_auth_last_mail_error');
    }
}

if (!function_exists('platform_auth_append_last_mail_debug')) {
    function platform_auth_append_last_mail_debug($line) {
        $line = trim((string) $line);
        if ($line === '') {
            return;
        }

        $existing = get_option('platform_auth_last_mail_debug', array());
        if (!is_array($existing)) {
            $existing = array();
        }

        $existing[] = $line;
        if (count($existing) > 50) {
            $existing = array_slice($existing, -50);
        }

        update_option('platform_auth_last_mail_debug', $existing, false);
    }

    function platform_auth_get_last_mail_debug() {
        $lines = get_option('platform_auth_last_mail_debug', array());
        return is_array($lines) ? $lines : array();
    }

    function platform_auth_clear_last_mail_debug() {
        delete_option('platform_auth_last_mail_debug');
    }
}

if (!function_exists('platform_auth_sanitize_smtp_debug_line')) {
    function platform_auth_sanitize_smtp_debug_line($line) {
        $line = trim((string) $line);
        if ($line === '') {
            return '';
        }

        if (stripos($line, 'CLIENT -> SERVER: AUTH') !== false) {
            return 'CLIENT -> SERVER: [SMTP AUTH REDACTED]';
        }

        if (stripos($line, 'CLIENT -> SERVER:') !== false) {
            $payload = trim((string) substr($line, strlen('CLIENT -> SERVER:')));
            if ($payload !== '' && preg_match('/^[A-Za-z0-9+\/=]{16,}$/', $payload)) {
                return 'CLIENT -> SERVER: [SMTP AUTH PAYLOAD REDACTED]';
            }
        }

        return $line;
    }
}

if (!function_exists('platform_auth_capture_phpmailer_debug')) {
    function platform_auth_capture_phpmailer_debug($phpmailer) {
        if (!is_object($phpmailer)) {
            return;
        }

        $phpmailer->SMTPDebug = 2;
        $phpmailer->Debugoutput = static function ($line, $level) {
            $sanitized = platform_auth_sanitize_smtp_debug_line($line);
            if ($sanitized === '') {
                return;
            }

            platform_auth_append_last_mail_debug('[level=' . (int) $level . '] ' . $sanitized);
        };
    }
}
add_action('phpmailer_init', 'platform_auth_capture_phpmailer_debug', 999);

if (!function_exists('platform_auth_ensure_request_authorized')) {
    function platform_auth_ensure_request_authorized(WP_REST_Request $request) {
        $expected = platform_auth_secret();
        if (!$expected) {
            return new WP_Error('platform_auth_missing_secret', 'Platform auth secret is not configured.', array('status' => 500));
        }

        $received = (string) $request->get_header('x-2424-internal-secret');
        if (!$received || !hash_equals($expected, $received)) {
            return new WP_Error('platform_auth_forbidden', 'Invalid platform auth secret.', array('status' => 403));
        }

        return true;
    }
}

if (!function_exists('platform_auth_register_user_meta')) {
    function platform_auth_register_user_meta() {
        $meta_keys = array(
            'platform_username' => 'string',
            'platform_onboarding_completed' => 'boolean',
            'platform_notification_emails_enabled' => 'boolean',
            'phone' => 'string',
            'birth_date' => 'string',
            'address' => 'string',
            'business_activity_category' => 'string',
            'business_regions' => 'string',
            'business_cities' => 'string',
            'platform_directory_visibility_enabled' => 'boolean',
            'profile_photo' => 'string',
            'social_facebook' => 'string',
            'social_instagram' => 'string',
            'social_x' => 'string',
            'social_youtube' => 'string',
            'platform_email_verified_at' => 'string',
            'platform_email_verification_token_hash' => 'string',
            'platform_email_verification_expires_at' => 'integer',
            'platform_email_verification_sent_at' => 'string',
        );

        foreach ($meta_keys as $meta_key => $type) {
            register_meta('user', $meta_key, array(
                'type' => $type,
                'single' => true,
                'show_in_rest' => true,
                'auth_callback' => '__return_true',
            ));
        }
    }
}
add_action('init', 'platform_auth_register_user_meta');

if (!function_exists('platform_auth_user_payload')) {
    function platform_auth_is_email_verified($user_id) {
        $verified_at = (string) get_user_meta((int) $user_id, 'platform_email_verified_at', true);
        return $verified_at !== '';
    }

    function platform_auth_mark_email_verified($user_id) {
        $user_id = (int) $user_id;
        update_user_meta($user_id, 'platform_email_verified_at', gmdate('Y-m-d H:i:s'));
        delete_user_meta($user_id, 'platform_email_verification_token_hash');
        delete_user_meta($user_id, 'platform_email_verification_expires_at');
    }

    function platform_auth_user_payload(WP_User $user) {
        $platform_username = (string) get_user_meta($user->ID, 'platform_username', true);

        return array(
            'wpUserId' => (int) $user->ID,
            'email' => (string) $user->user_email,
            'displayName' => (string) $user->display_name,
            'username' => $platform_username !== '' ? $platform_username : (string) $user->user_login,
            'role' => implode(',', $user->roles),
            'emailVerified' => platform_auth_is_email_verified($user->ID),
            'onboardingCompleted' => platform_auth_has_completed_onboarding($user->ID),
        );
    }
}

if (!function_exists('platform_auth_profile_payload')) {
    function platform_auth_get_directory_visibility_enabled($user_id) {
        $value = get_user_meta((int) $user_id, 'platform_directory_visibility_enabled', true);

        // Existing Business accounts remain visible until their owner opts out.
        if ($value === '' || $value === null) {
            return true;
        }

        return !in_array(strtolower((string) $value), array('0', 'false', 'no', 'off'), true);
    }

    function platform_auth_get_string_list_meta($user_id, $meta_key) {
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

    function platform_auth_sanitize_string_list($values) {
        if (!is_array($values)) {
            return array();
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

    function platform_auth_get_notification_emails_enabled($user_id) {
        $value = get_user_meta((int) $user_id, 'platform_notification_emails_enabled', true);
        if ($value === '' || $value === null) {
            return true;
        }

        if (is_bool($value)) {
            return $value;
        }

        $normalized = strtolower(trim((string) $value));
        if (in_array($normalized, array('0', 'false', 'no', 'off'), true)) {
            return false;
        }

        return true;
    }

    function platform_auth_set_notification_emails_enabled($user_id, $enabled) {
        update_user_meta((int) $user_id, 'platform_notification_emails_enabled', $enabled ? '1' : '0');
    }

    function platform_auth_get_onboarding_completed_meta($user_id) {
        $value = get_user_meta((int) $user_id, 'platform_onboarding_completed', true);
        if ($value === '' || $value === null) {
            return null;
        }

        if (is_bool($value)) {
            return $value;
        }

        $normalized = strtolower(trim((string) $value));
        if (in_array($normalized, array('1', 'true', 'yes', 'on'), true)) {
            return true;
        }
        if (in_array($normalized, array('0', 'false', 'no', 'off'), true)) {
            return false;
        }

        return null;
    }

    function platform_auth_set_onboarding_completed($user_id, $completed) {
        update_user_meta((int) $user_id, 'platform_onboarding_completed', $completed ? '1' : '0');
    }

    function platform_auth_user_has_paid_membership($user_id) {
        $user_id = (int) $user_id;
        if ($user_id <= 0 || !function_exists('platform_billing_get_subscription_snapshot')) {
            return false;
        }

        $snapshot = platform_billing_get_subscription_snapshot($user_id);
        if (!is_array($snapshot)) {
            return false;
        }

        $plan_id = sanitize_key((string) ($snapshot['planId'] ?? 'free'));
        $status = sanitize_key((string) ($snapshot['status'] ?? 'none'));

        return in_array($plan_id, array('essentiel', 'business'), true) && in_array($status, array('active', 'trialing', 'past_due'), true);
    }

    function platform_auth_has_completed_onboarding($user_id) {
        $user_id = (int) $user_id;
        if ($user_id <= 0) {
            return false;
        }

        $persisted = platform_auth_get_onboarding_completed_meta($user_id);
        if ($persisted !== null) {
            if ($persisted === false && platform_auth_user_has_paid_membership($user_id)) {
                if (function_exists('platform_2424_log')) {
                    platform_2424_log('info', 'Onboarding auto-repare pour un compte avec abonnement payant.', array(
                        'user_id' => (string) $user_id,
                        'persisted' => 'false',
                        'reason' => 'paid_membership',
                    ));
                }
                platform_auth_set_onboarding_completed($user_id, true);
                return true;
            }

            if (function_exists('platform_2424_log')) {
                platform_2424_log('info', 'Etat onboarding lu depuis la meta utilisateur.', array(
                    'user_id' => (string) $user_id,
                    'persisted' => $persisted ? 'true' : 'false',
                    'source' => 'user_meta',
                ));
            }
            return $persisted;
        }

        if (platform_auth_user_has_paid_membership($user_id)) {
            if (function_exists('platform_2424_log')) {
                platform_2424_log('info', 'Onboarding initialise a true pour un compte payant sans meta persistee.', array(
                    'user_id' => (string) $user_id,
                    'reason' => 'paid_membership_without_meta',
                ));
            }
            platform_auth_set_onboarding_completed($user_id, true);
            return true;
        }

        if (function_exists('platform_2424_log')) {
            platform_2424_log('info', 'Etat onboarding absent, fallback a false.', array(
                'user_id' => (string) $user_id,
                'source' => 'fallback',
            ));
        }
        return false;
    }

    function platform_auth_profile_payload(WP_User $user) {
        $profile_photo = (string) get_user_meta($user->ID, 'profile_photo', true);
        if ($profile_photo !== '' && preg_match('/^data:image\/[a-zA-Z0-9.+-]+;base64,/', $profile_photo)) {
            $profile_photo = '';
        }
        $company_logo = (string) get_user_meta($user->ID, 'company_logo', true);
        if ($company_logo !== '' && preg_match('/^data:image\/[a-zA-Z0-9.+-]+;base64,/', $company_logo)) {
            $company_logo = '';
        }

        $payload = array_merge(platform_auth_user_payload($user), array(
            'firstName' => (string) $user->first_name,
            'lastName' => (string) $user->last_name,
            'phone' => (string) get_user_meta($user->ID, 'phone', true),
            'birthDate' => (string) get_user_meta($user->ID, 'birth_date', true),
            'address' => (string) get_user_meta($user->ID, 'address', true),
            'businessActivityCategory' => (string) get_user_meta($user->ID, 'business_activity_category', true),
            'businessRegions' => platform_auth_get_string_list_meta($user->ID, 'business_regions'),
            'businessCities' => platform_auth_get_string_list_meta($user->ID, 'business_cities'),
            'directoryVisibilityEnabled' => platform_auth_get_directory_visibility_enabled($user->ID),
            'profilePhoto' => $profile_photo,
            'companyLogo' => $company_logo,
            'avatarUrl' => get_avatar_url($user->ID),
            'notificationEmailsEnabled' => platform_auth_get_notification_emails_enabled($user->ID),
            'socialLinks' => array(
                'facebook' => (string) get_user_meta($user->ID, 'social_facebook', true),
                'instagram' => (string) get_user_meta($user->ID, 'social_instagram', true),
                'x' => (string) get_user_meta($user->ID, 'social_x', true),
                'youtube' => (string) get_user_meta($user->ID, 'social_youtube', true),
            ),
        ));

        if (function_exists('platform_2424_log')) {
            platform_2424_log('info', 'Payload profil genere pour l\'utilisateur.', array(
                'user_id' => (string) (int) $user->ID,
                'email' => (string) $user->user_email,
                'onboarding_completed' => !empty($payload['onboardingCompleted']) ? 'true' : 'false',
                'persisted_meta' => var_export(platform_auth_get_onboarding_completed_meta($user->ID), true),
            ));
        }

        return $payload;
    }
}

if (!function_exists('platform_auth_find_user_by_identifier')) {
    function platform_auth_find_user_by_identifier($identifier) {
        $identifier = trim((string) $identifier);
        if (!$identifier) {
            return null;
        }

        if (is_email($identifier)) {
            $user = get_user_by('email', $identifier);
            if ($user) {
                return $user;
            }
        }

        return get_user_by('login', sanitize_user($identifier, true));
    }
}

if (!function_exists('platform_auth_check_availability')) {
    function platform_auth_check_availability($payload) {
        $username = sanitize_user((string) ($payload['username'] ?? ''), true);
        $email = sanitize_email((string) ($payload['email'] ?? ''));

        return array(
            'username' => array(
                'value' => $username,
                'available' => $username ? !username_exists($username) : false,
            ),
            'email' => array(
                'value' => $email,
                'available' => $email ? !email_exists($email) : false,
            ),
        );
    }
}

if (!function_exists('platform_auth_password_is_strong')) {
    function platform_auth_password_is_strong($password) {
        $password = (string) $password;

        if (strlen($password) < 8) {
            return false;
        }

        if (!preg_match('/[a-z]/', $password)) {
            return false;
        }

        if (!preg_match('/[A-Z]/', $password)) {
            return false;
        }

        if (!preg_match('/\d/', $password)) {
            return false;
        }

        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            return false;
        }

        return true;
    }
}

if (!function_exists('platform_auth_birth_date_is_valid')) {
    function platform_auth_birth_date_is_valid($birth_date) {
        $birth_date = trim((string) $birth_date);
        if ($birth_date === '') {
            return true;
        }

        if (!preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $birth_date, $matches)) {
            return false;
        }

        $day = (int) $matches[1];
        $month = (int) $matches[2];
        $year = (int) $matches[3];

        if (!checkdate($month, $day, $year)) {
            return false;
        }

        $birth = DateTime::createFromFormat('d/m/Y', $birth_date);
        $birth->setTime(0, 0, 0);
        $today = new DateTime('today');

        return $birth < $today;
    }
}

if (!function_exists('platform_auth_build_email_verification_url')) {
    function platform_auth_get_public_site_base_url() {
        if (function_exists('platform_2424_get_public_site_url')) {
            return rtrim((string) platform_2424_get_public_site_url(), '/');
        }

        $base_url = '';

        $configured_public_site_url = get_option('platform_2424_public_site_url', '');
        if (is_string($configured_public_site_url) && trim($configured_public_site_url) !== '') {
            $base_url = (string) $configured_public_site_url;
        }

        if ($base_url === '' && defined('PLATFORM_PUBLIC_SITE_URL') && PLATFORM_PUBLIC_SITE_URL) {
            $base_url = (string) PLATFORM_PUBLIC_SITE_URL;
        }

        if ($base_url === '') {
            $env_public_site_url = getenv('PLATFORM_PUBLIC_SITE_URL');
            if ($env_public_site_url) {
                $base_url = (string) $env_public_site_url;
            }
        }

        if ($base_url === '') {
            $env_public_site_url = getenv('NEXT_PUBLIC_SITE_URL');
            if ($env_public_site_url) {
                $base_url = (string) $env_public_site_url;
            }
        }

        if ($base_url === '' && defined('APP_BASE_URL') && APP_BASE_URL) {
            $base_url = (string) APP_BASE_URL;
        }

        if ($base_url === '') {
            $env_base_url = getenv('APP_BASE_URL');
            if ($env_base_url) {
                $base_url = (string) $env_base_url;
            }
        }

        return $base_url === '' ? 'https://2424.mg' : rtrim((string) $base_url, '/');
    }

    function platform_auth_build_email_verification_url(WP_User $user, $token) {
        $base_url = platform_auth_get_public_site_base_url();
        $query = array(
            'email' => strtolower((string) $user->user_email),
            'token' => (string) $token,
        );

        return $base_url . '/verification-email?' . http_build_query($query);
    }

    function platform_auth_build_password_reset_url(WP_User $user, $reset_key) {
        $base_url = platform_auth_get_public_site_base_url();
        $query = array(
            'login' => (string) $user->user_login,
            'key' => (string) $reset_key,
        );

        return $base_url . '/reinitialiser-mot-de-passe?' . http_build_query($query);
    }
}

if (!function_exists('platform_auth_render_transactional_email_shell')) {
    function platform_auth_get_site_host_label($site_url) {
        $host = wp_parse_url((string) $site_url, PHP_URL_HOST);
        if (!is_string($host) || trim($host) === '') {
            return '2424';
        }

        return preg_replace('/^www\./i', '', trim($host));
    }

    function platform_auth_render_transactional_email_shell($args) {
        if (function_exists('platform_2424_render_transactional_email_shell')) {
            return platform_2424_render_transactional_email_shell($args);
        }

        $title = isset($args['title']) ? (string) $args['title'] : '';
        $preheader = isset($args['preheader']) ? (string) $args['preheader'] : '';
        $body_html = isset($args['body_html']) ? (string) $args['body_html'] : '';
        $cta_label = isset($args['cta_label']) ? (string) $args['cta_label'] : '';
        $cta_url = isset($args['cta_url']) ? esc_url((string) $args['cta_url']) : '';
        $site_url = platform_auth_get_public_site_base_url();
        $site_host_label = platform_auth_get_site_host_label($site_url);
        $logo_url = esc_url(trailingslashit($site_url) . 'logo.png');
        $support_email = function_exists('platform_2424_get_support_email')
            ? platform_2424_get_support_email()
            : ($site_host_label !== '' ? 'contact@' . $site_host_label : 'contact@2424.mg');
        $location_label = 'Antananarivo, Madagascar';
        $youtube_url = 'https://www.youtube.com/channel/UCcjS1Us2l3yB8lLsDu3Vr6w';
        $x_url = 'https://twitter.com/2424_mg';
        $instagram_url = 'https://www.instagram.com/2424.mg/';
        $facebook_url = 'https://web.facebook.com/2424.mg/';

        ob_start();
        ?>
<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo esc_html($title); ?></title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f5f5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      <?php echo esc_html($preheader); ?>
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
                      <img src="<?php echo esc_url($logo_url); ?>" alt="<?php echo esc_attr($site_host_label !== '' ? $site_host_label : '2424'); ?>" width="134" style="display:block;width:134px;max-width:134px;height:auto;border:0;" />
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
                      <div style="margin:0;font-size:12px;line-height:14px;font-weight:400;color:#111111;">
                        <?php echo wp_kses_post($body_html); ?>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:40px;">
                      <a href="<?php echo esc_url($cta_url); ?>" style="display:inline-block;min-width:246px;background-color:#cc202a;border-radius:6px;color:#ffffff;font-size:12px;line-height:40px;font-weight:400;text-align:center;text-decoration:none;padding:0 20px;">
                        <?php echo esc_html($cta_label); ?>
                      </a>
                    </td>
                  </tr>
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
                        <a href="<?php echo esc_url($site_url); ?>" style="color:#2563eb;text-decoration:underline;"><?php echo esc_html($site_host_label); ?></a>
                        <span style="color:#6b7280;">&nbsp;-&nbsp;<?php echo esc_html($location_label); ?>&nbsp;-&nbsp;</span>
                        <a href="mailto:<?php echo esc_attr($support_email); ?>" style="color:#2563eb;text-decoration:underline;"><?php echo esc_html($support_email); ?></a>
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
                        <a href="<?php echo esc_url($youtube_url); ?>" style="color:#6b7280;text-decoration:none;">YouTube</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="<?php echo esc_url($x_url); ?>" style="color:#6b7280;text-decoration:none;">X</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="<?php echo esc_url($instagram_url); ?>" style="color:#6b7280;text-decoration:none;">Instagram</a>
                        <span>&nbsp;&nbsp;</span>
                        <a href="<?php echo esc_url($facebook_url); ?>" style="color:#6b7280;text-decoration:none;">Facebook</a>
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
}

if (!function_exists('platform_auth_email_dispatcher_url')) {
    function platform_auth_email_dispatcher_url() {
        if (function_exists('platform_2424_get_email_dispatcher_endpoint')) {
            $value = trim((string) platform_2424_get_email_dispatcher_endpoint());
            if ($value !== '') {
                return $value;
            }
        }

        if (defined('EMAIL_DISPATCHER_LAMBDA_URL') && EMAIL_DISPATCHER_LAMBDA_URL) {
            return trim((string) EMAIL_DISPATCHER_LAMBDA_URL);
        }

        $env = getenv('EMAIL_DISPATCHER_LAMBDA_URL');
        return $env ? trim((string) $env) : '';
    }
}

if (!function_exists('platform_auth_email_dispatcher_secret')) {
    function platform_auth_email_dispatcher_secret() {
        if (function_exists('platform_2424_get_email_dispatcher_secret')) {
            $value = trim((string) platform_2424_get_email_dispatcher_secret());
            if ($value !== '') {
                return $value;
            }
        }

        if (defined('EMAIL_DISPATCHER_SHARED_SECRET') && EMAIL_DISPATCHER_SHARED_SECRET) {
            return trim((string) EMAIL_DISPATCHER_SHARED_SECRET);
        }

        $env = getenv('EMAIL_DISPATCHER_SHARED_SECRET');
        return $env ? trim((string) $env) : '';
    }
}

if (!function_exists('platform_auth_get_email_dispatcher_branding')) {
    function platform_auth_get_email_dispatcher_branding() {
        $site_url = platform_auth_get_public_site_base_url();
        $branding = function_exists('platform_2424_get_email_branding')
            ? platform_2424_get_email_branding()
            : array();

        return array(
            'siteUrl' => $site_url,
            'logoUrl' => isset($branding['logo_url']) ? esc_url_raw((string) $branding['logo_url']) : '',
            'supportEmail' => isset($branding['support_email']) ? sanitize_email((string) $branding['support_email']) : '',
            'locationLabel' => isset($branding['location_label']) ? sanitize_text_field((string) $branding['location_label']) : '',
            'youtubeUrl' => isset($branding['youtube_url']) ? esc_url_raw((string) $branding['youtube_url']) : '',
            'xUrl' => isset($branding['x_url']) ? esc_url_raw((string) $branding['x_url']) : '',
            'instagramUrl' => isset($branding['instagram_url']) ? esc_url_raw((string) $branding['instagram_url']) : '',
            'facebookUrl' => isset($branding['facebook_url']) ? esc_url_raw((string) $branding['facebook_url']) : '',
        );
    }
}

if (!function_exists('platform_auth_dispatch_email_event')) {
    function platform_auth_dispatch_email_event($payload) {
        // WooCommerce and WordPress transactional mail share the configured SMTP transport.
        if (function_exists('platform_2424_is_smtp_configured') && platform_2424_is_smtp_configured()) {
            return new WP_Error('platform_auth_smtp_configured', 'SMTP is configured for transactional email.');
        }

        $url = platform_auth_email_dispatcher_url();
        $secret = platform_auth_email_dispatcher_secret();

        if ($url === '' || $secret === '') {
            return new WP_Error('platform_auth_email_dispatcher_missing_config', 'Email dispatcher is not configured.', array(
                'status' => 500,
                'has_url' => $url !== '',
                'has_secret' => $secret !== '',
            ));
        }

        $response = wp_remote_post($url, array(
            'method' => 'POST',
            'timeout' => 8,
            'headers' => array(
                'Content-Type' => 'application/json',
                'x-2424-email-secret' => $secret,
            ),
            'body' => wp_json_encode($payload),
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        if ($status >= 400) {
            return new WP_Error('platform_auth_email_dispatcher_http_error', 'Email dispatcher returned an HTTP error.', array(
                'status' => $status,
                'body' => wp_remote_retrieve_body($response),
                'url' => $url,
            ));
        }

        return array(
            'ok' => true,
            'status' => $status,
            'body' => wp_remote_retrieve_body($response),
        );
    }
}

if (!function_exists('platform_auth_format_dispatcher_error')) {
    function platform_auth_format_dispatcher_error($dispatch_result) {
        if (!is_wp_error($dispatch_result)) {
            return '';
        }

        $message = trim((string) $dispatch_result->get_error_message());
        $data = $dispatch_result->get_error_data();
        if (!is_array($data)) {
            return $message;
        }

        $parts = array();
        if (!empty($data['status'])) {
            $parts[] = 'status=' . (int) $data['status'];
        }
        if (!empty($data['url'])) {
            $parts[] = 'url=' . (string) $data['url'];
        }
        if (!empty($data['body'])) {
            $parts[] = 'body=' . (string) $data['body'];
        }

        if (empty($parts)) {
            return $message;
        }

        return trim($message . ' [' . implode(' | ', $parts) . ']');
    }
}

if (!function_exists('platform_auth_should_attempt_wp_mail_fallback')) {
    function platform_auth_should_attempt_wp_mail_fallback($dispatch_result = null) {
        if (is_wp_error($dispatch_result) && (string) $dispatch_result->get_error_code() === 'platform_auth_smtp_configured') {
            return true;
        }

        if (defined('PLATFORM_AUTH_ENABLE_WP_MAIL_FALLBACK')) {
            return (bool) PLATFORM_AUTH_ENABLE_WP_MAIL_FALLBACK;
        }

        if (is_wp_error($dispatch_result)) {
            $error_code = (string) $dispatch_result->get_error_code();
            if (!in_array($error_code, array('platform_auth_email_dispatcher_missing_config', 'platform_auth_smtp_configured'), true)) {
                return false;
            }
        }

        return (bool) apply_filters('platform_auth_enable_wp_mail_fallback', true, $dispatch_result);
    }
}

if (!function_exists('platform_auth_dispatcher_deferred_to_smtp')) {
    function platform_auth_dispatcher_deferred_to_smtp($dispatch_result) {
        return is_wp_error($dispatch_result)
            && (string) $dispatch_result->get_error_code() === 'platform_auth_smtp_configured';
    }
}

if (!function_exists('platform_auth_send_email_verification')) {
    function platform_auth_send_email_verification(WP_User $user) {
        if (platform_auth_is_email_verified($user->ID)) {
            return array(
                'ok' => true,
                'alreadyVerified' => true,
                'emailSent' => false,
                'message' => 'Email deja verifie.',
            );
        }

        $token = wp_generate_password(48, false, false);
        $token_hash = hash('sha256', $token);
        $expires_at = time() + DAY_IN_SECONDS;

        update_user_meta($user->ID, 'platform_email_verification_token_hash', $token_hash);
        update_user_meta($user->ID, 'platform_email_verification_expires_at', (int) $expires_at);
        update_user_meta($user->ID, 'platform_email_verification_sent_at', gmdate('Y-m-d H:i:s'));

        $verification_url = platform_auth_build_email_verification_url($user, $token);
        $display_name = trim((string) ($user->display_name ?: $user->user_login));
        $first_name = trim((string) get_user_meta($user->ID, 'first_name', true));
        $site_host_label = platform_auth_get_site_host_label(platform_auth_get_public_site_base_url());
        $subject = 'Confirmez votre adresse email';
        $message = platform_auth_render_transactional_email_shell(array(
            'title' => 'Confirmez votre adresse email',
            'preheader' => sprintf('Confirmez votre adresse email pour activer votre compte %s.', $site_host_label),
            'body_html' => sprintf(
                'Bonjour %1$s,<br/>Merci de confirmer votre adresse email pour activer votre compte %3$s.<br/><br/>Si le bouton ne fonctionne pas, vous pouvez aussi copier et coller ce lien dans votre navigateur :<br/><a href="%2$s" style="color:#2563eb;text-decoration:underline;word-break:break-all;">%2$s</a>',
                esc_html($display_name !== '' ? $display_name : 'a vous'),
                esc_url($verification_url),
                esc_html($site_host_label)
            ),
            'cta_label' => 'Confirmer mon email',
            'cta_url' => $verification_url,
        ));
        $headers = array('Content-Type: text/html; charset=UTF-8');

        $dispatch_result = platform_auth_dispatch_email_event(array(
            'eventName' => 'email-verification.requested.v1',
            'recipient' => array(
                'email' => (string) $user->user_email,
                'name' => $display_name,
            ),
            'templateData' => array_merge(platform_auth_get_email_dispatcher_branding(), array(
                'firstName' => $first_name !== '' ? $first_name : null,
                'displayName' => $display_name !== '' ? $display_name : null,
                'identifier' => $display_name !== '' ? $display_name : null,
                'verificationUrl' => $verification_url,
            )),
            'metadata' => array(
                'channel' => 'auth',
                'flow' => 'email-verification',
                'wpUserId' => (string) (int) $user->ID,
            ),
        ));

        if (!is_wp_error($dispatch_result)) {
            if (function_exists('platform_2424_log')) {
                platform_2424_log('info', 'Email de verification envoye via email dispatcher.', array(
                    'user_id' => (string) (int) $user->ID,
                    'email' => (string) $user->user_email,
                ));
            }

            return array(
                'ok' => true,
                'alreadyVerified' => false,
                'emailSent' => true,
                'message' => 'Email de verification envoye.',
            );
        }

        $dispatch_error = platform_auth_format_dispatcher_error($dispatch_result);
        $dispatch_error_data = is_wp_error($dispatch_result) ? $dispatch_result->get_error_data() : array();
        $dispatch_status = is_array($dispatch_error_data) && isset($dispatch_error_data['status']) ? (int) $dispatch_error_data['status'] : 0;
        $dispatch_body = is_array($dispatch_error_data) && isset($dispatch_error_data['body']) ? (string) $dispatch_error_data['body'] : '';
        $dispatch_url = is_array($dispatch_error_data) && isset($dispatch_error_data['url']) ? (string) $dispatch_error_data['url'] : '';
        $uses_smtp = platform_auth_dispatcher_deferred_to_smtp($dispatch_result);
        if (!$uses_smtp && function_exists('platform_2424_log')) {
            platform_2424_log('warning', 'Email dispatcher indisponible pour la verification, fallback wp_mail.', array(
                'user_id' => (string) (int) $user->ID,
                'email' => (string) $user->user_email,
                'error' => $dispatch_error,
                'status' => $dispatch_status > 0 ? (string) $dispatch_status : '',
                'body' => $dispatch_body,
                'url' => $dispatch_url,
            ));
        }

        if (!platform_auth_should_attempt_wp_mail_fallback($dispatch_result)) {
            if (function_exists('platform_2424_log')) {
                platform_2424_log('error', 'Email de verification non envoye: dispatcher indisponible et fallback wp_mail desactive.', array(
                    'user_id' => (string) (int) $user->ID,
                    'email' => (string) $user->user_email,
                    'error' => $dispatch_error,
                ));
            }

            return array(
                'ok' => false,
                'alreadyVerified' => false,
                'emailSent' => false,
                'message' => 'Compte créé, mais email non envoyé. ' . $dispatch_error,
            );
        }

        platform_auth_clear_last_mail_error();
        platform_auth_clear_last_mail_debug();
        $email_sent = wp_mail($user->user_email, $subject, $message, $headers);
        $mail_error = platform_auth_get_last_mail_error();

        if (!$email_sent) {
            if ($mail_error === '') {
                $mail_error = 'wp_mail a retourne false sans detail supplementaire.';
            }
            if (!$uses_smtp && $dispatch_error !== '') {
                $mail_error = trim($dispatch_error . ' | ' . $mail_error, ' |');
            }
            if (function_exists('platform_2424_log')) {
                platform_2424_log('error', 'Echec envoi email de verification.', array(
                    'user_id' => (string) (int) $user->ID,
                    'email' => (string) $user->user_email,
                    'error' => $mail_error,
                ));
            }
            error_log('[platform_auth] Email verification send failed for user #' . (int) $user->ID . ' (' . $user->user_email . '): ' . $mail_error);
        } elseif (function_exists('platform_2424_log')) {
            platform_2424_log('info', $uses_smtp ? 'Email de verification envoye via SMTP.' : 'Email de verification envoye via wp_mail fallback.', array(
                'user_id' => (string) (int) $user->ID,
                'email' => (string) $user->user_email,
            ));
        }

        return array(
            'ok' => (bool) $email_sent,
            'alreadyVerified' => false,
            'emailSent' => (bool) $email_sent,
            'message' => $email_sent ? 'Email de verification envoye.' : ('Compte cree, mais email non envoye. ' . $mail_error),
        );
    }
}

if (!function_exists('platform_auth_sanitize_profile_photo')) {
    function platform_auth_sanitize_profile_photo($value) {
        $value = trim((string) $value);

        if ($value === '') {
            return '';
        }

        if (preg_match('/^data:image\/[a-zA-Z0-9.+-]+;base64,/', $value)) {
            return $value;
        }

        return esc_url_raw($value);
    }
}

if (!function_exists('platform_auth_store_profile_photo')) {
    function platform_auth_store_profile_photo($value, $user_id = 0) {
        $value = trim((string) $value);

        if ($value === '') {
            return '';
        }

        if (!preg_match('/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/', $value, $matches)) {
            return esc_url_raw($value);
        }

        $user_id = absint($user_id);
        if (!$user_id) {
            return new WP_Error('platform_auth_invalid_profile_photo_user', 'Utilisateur invalide pour la photo de profil.', array('status' => 400));
        }

        $extension = strtolower((string) $matches[1]);
        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        $allowed = array('jpg', 'png', 'webp', 'gif');
        if (!in_array($extension, $allowed, true)) {
            return new WP_Error('platform_auth_invalid_profile_photo_format', 'Format de photo non pris en charge.', array('status' => 400));
        }

        $binary = base64_decode((string) $matches[2], true);
        if ($binary === false) {
            return new WP_Error('platform_auth_invalid_profile_photo_data', 'Photo de profil invalide.', array('status' => 400));
        }

        if (strlen($binary) > 5 * 1024 * 1024) {
            return new WP_Error('platform_auth_profile_photo_too_large', 'La photo de profil depasse 5 Mo.', array('status' => 400));
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $filename = sprintf('profile-%d-%s.%s', $user_id, wp_generate_password(8, false, false), $extension);
        $uploaded = wp_upload_bits($filename, null, $binary);

        if (!empty($uploaded['error'])) {
            return new WP_Error('platform_auth_profile_photo_upload_failed', (string) $uploaded['error'], array('status' => 500));
        }

        $mime_type = wp_check_filetype((string) $uploaded['file'], null);
        $attachment_id = wp_insert_attachment(array(
            'guid' => (string) $uploaded['url'],
            'post_mime_type' => (string) ($mime_type['type'] ?? 'image/' . $extension),
            'post_title' => sanitize_file_name(pathinfo($filename, PATHINFO_FILENAME)),
            'post_content' => '',
            'post_status' => 'inherit',
        ), (string) $uploaded['file']);

        if (is_wp_error($attachment_id)) {
            return $attachment_id;
        }

        $attachment_meta = wp_generate_attachment_metadata($attachment_id, (string) $uploaded['file']);
        if (is_array($attachment_meta)) {
            wp_update_attachment_metadata($attachment_id, $attachment_meta);
        }

        update_user_meta($user_id, 'profile_photo_attachment_id', (int) $attachment_id);

        return esc_url_raw((string) wp_get_attachment_url($attachment_id));
    }
}

if (!function_exists('platform_auth_store_company_logo')) {
    function platform_auth_store_company_logo($value, $user_id = 0) {
        $value = trim((string) $value);

        if ($value === '') {
            return '';
        }

        if (!preg_match('/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/', $value, $matches)) {
            return esc_url_raw($value);
        }

        $user_id = absint($user_id);
        if (!$user_id) {
            return new WP_Error('platform_auth_invalid_company_logo_user', 'Utilisateur invalide pour le logo.', array('status' => 400));
        }

        $extension = strtolower((string) $matches[1]);
        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        $allowed = array('jpg', 'png', 'webp', 'gif');
        if (!in_array($extension, $allowed, true)) {
            return new WP_Error('platform_auth_invalid_company_logo_format', 'Format de logo non pris en charge.', array('status' => 400));
        }

        $binary = base64_decode((string) $matches[2], true);
        if ($binary === false) {
            return new WP_Error('platform_auth_invalid_company_logo_data', 'Logo invalide.', array('status' => 400));
        }

        if (strlen($binary) > 5 * 1024 * 1024) {
            return new WP_Error('platform_auth_company_logo_too_large', 'Le logo depasse 5 Mo.', array('status' => 400));
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $filename = sprintf('company-logo-%d-%s.%s', $user_id, wp_generate_password(8, false, false), $extension);
        $uploaded = wp_upload_bits($filename, null, $binary);

        if (!empty($uploaded['error'])) {
            return new WP_Error('platform_auth_company_logo_upload_failed', (string) $uploaded['error'], array('status' => 500));
        }

        $mime_type = wp_check_filetype((string) $uploaded['file'], null);
        $attachment_id = wp_insert_attachment(array(
            'guid' => (string) $uploaded['url'],
            'post_mime_type' => (string) ($mime_type['type'] ?? 'image/' . $extension),
            'post_title' => sanitize_file_name(pathinfo($filename, PATHINFO_FILENAME)),
            'post_content' => '',
            'post_status' => 'inherit',
        ), (string) $uploaded['file']);

        if (is_wp_error($attachment_id)) {
            return $attachment_id;
        }

        $attachment_meta = wp_generate_attachment_metadata($attachment_id, (string) $uploaded['file']);
        if (is_array($attachment_meta)) {
            wp_update_attachment_metadata($attachment_id, $attachment_meta);
        }

        update_user_meta($user_id, 'company_logo_attachment_id', (int) $attachment_id);

        return esc_url_raw((string) wp_get_attachment_url($attachment_id));
    }
}
if (!function_exists('platform_auth_register_user')) {
    function platform_auth_register_user($payload) {
        $username = sanitize_user((string) ($payload['username'] ?? ''), true);
        $first_name = sanitize_text_field((string) ($payload['firstName'] ?? ''));
        $last_name = sanitize_text_field((string) ($payload['lastName'] ?? ''));
        $email = sanitize_email((string) ($payload['email'] ?? ''));
        $password = (string) ($payload['password'] ?? '');
        $birth_date = sanitize_text_field((string) ($payload['birthDate'] ?? ''));

        if (!$username || !$first_name || !$last_name || !$email || !$password) {
            return new WP_Error('platform_auth_invalid_payload', 'Missing required registration fields.', array('status' => 400));
        }

        if (!platform_auth_password_is_strong($password)) {
            return new WP_Error('platform_auth_weak_password', 'Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule, un chiffre et un caractere special.', array('status' => 400));
        }

        if (!platform_auth_birth_date_is_valid($birth_date)) {
            return new WP_Error('platform_auth_invalid_birth_date', 'La date de naissance doit etre une date valide anterieure a la date du jour.', array('status' => 400));
        }

        if (username_exists($username)) {
            return new WP_Error('platform_auth_username_exists', 'Ce nom d\'utilisateur existe deja.', array('status' => 409));
        }

        if (email_exists($email)) {
            return new WP_Error('platform_auth_email_exists', 'Cet email existe deja.', array('status' => 409));
        }

        $created = wp_insert_user(array(
            'user_login' => $username,
            'user_pass' => $password,
            'user_email' => $email,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'display_name' => trim($first_name . ' ' . $last_name),
            'role' => 'subscriber',
        ));

        if (is_wp_error($created)) {
            return $created;
        }

        $user = get_user_by('id', $created);
        $socials = isset($payload['socialLinks']) && is_array($payload['socialLinks']) ? $payload['socialLinks'] : array();

        update_user_meta($user->ID, 'platform_username', $username);
        update_user_meta($user->ID, 'phone', sanitize_text_field((string) ($payload['phone'] ?? '')));
        update_user_meta($user->ID, 'birth_date', $birth_date);
        update_user_meta($user->ID, 'address', sanitize_text_field((string) ($payload['address'] ?? '')));
        $profile_photo_value = platform_auth_store_profile_photo($payload['profilePhoto'] ?? '', $user->ID);
        if (is_wp_error($profile_photo_value)) {
            return $profile_photo_value;
        }
        update_user_meta($user->ID, 'profile_photo', $profile_photo_value);
        update_user_meta($user->ID, 'social_facebook', esc_url_raw((string) ($socials['facebook'] ?? '')));
        update_user_meta($user->ID, 'social_instagram', esc_url_raw((string) ($socials['instagram'] ?? '')));
        update_user_meta($user->ID, 'social_x', esc_url_raw((string) ($socials['x'] ?? '')));
        update_user_meta($user->ID, 'social_youtube', esc_url_raw((string) ($socials['youtube'] ?? '')));
        platform_auth_set_notification_emails_enabled($user->ID, true);
        platform_auth_set_onboarding_completed($user->ID, false);

        if (function_exists('platform_2424_log')) {
            platform_2424_log('info', 'Nouvelle inscription email creee avec onboarding incomplet.', array(
                'user_id' => (string) (int) $user->ID,
                'email' => (string) $user->user_email,
                'platform_username' => (string) $username,
                'persisted_meta_after_register' => var_export(platform_auth_get_onboarding_completed_meta($user->ID), true),
            ));
        }

        delete_user_meta($user->ID, 'platform_email_verified_at');
        $verification_result = platform_auth_send_email_verification($user);

        return array(
            'user' => platform_auth_user_payload($user),
            'emailSent' => (bool) ($verification_result['emailSent'] ?? false),
            'emailMessage' => (string) ($verification_result['message'] ?? 'Compte cree. Verifiez votre email.'),
        );
    }
}

if (!function_exists('platform_auth_get_profile')) {
    function platform_auth_get_profile($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        if (!$user_id) {
            return new WP_Error('platform_auth_invalid_user', 'User ID is required.', array('status' => 400));
        }

        $user = get_user_by('id', $user_id);
        if (!$user) {
            return new WP_Error('platform_auth_unknown_user', 'Compte introuvable.', array('status' => 404));
        }

        if (function_exists('platform_2424_log')) {
            platform_2424_log('info', 'Lecture du profil utilisateur demandee.', array(
                'user_id' => (string) $user_id,
                'persisted_meta_before_payload' => var_export(platform_auth_get_onboarding_completed_meta($user_id), true),
            ));
        }

        return platform_auth_profile_payload($user);
    }
}

if (!function_exists('platform_auth_update_profile')) {
    function platform_auth_update_profile($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        if (!$user_id) {
            return new WP_Error('platform_auth_invalid_user', 'User ID is required.', array('status' => 400));
        }

        $user = get_user_by('id', $user_id);
        if (!$user) {
            return new WP_Error('platform_auth_unknown_user', 'Compte introuvable.', array('status' => 404));
        }

        $username = sanitize_user((string) ($payload['username'] ?? ''), true);
        $first_name = sanitize_text_field((string) ($payload['firstName'] ?? ''));
        $last_name = sanitize_text_field((string) ($payload['lastName'] ?? ''));
        $birth_date = sanitize_text_field((string) ($payload['birthDate'] ?? ''));
        $business_regions = array_slice(platform_auth_sanitize_string_list($payload['businessRegions'] ?? array()), 0, 1);
        $business_cities = array_slice(platform_auth_sanitize_string_list($payload['businessCities'] ?? array()), 0, 1);
        $complete_onboarding = !empty($payload['completeOnboarding']);
        $notification_emails_enabled = array_key_exists('notificationEmailsEnabled', $payload)
            ? !empty($payload['notificationEmailsEnabled'])
            : platform_auth_get_notification_emails_enabled($user_id);

        if (!$first_name || !$last_name) {
            return new WP_Error('platform_auth_invalid_payload', 'First name and last name are required.', array('status' => 400));
        }

        if (empty($business_regions)) {
            return new WP_Error('platform_auth_missing_regions', 'Veuillez sélectionner au moins une région.', array('status' => 400));
        }

        if (!platform_auth_birth_date_is_valid($birth_date)) {
            return new WP_Error('platform_auth_invalid_birth_date', 'La date de naissance doit etre une date valide anterieure a la date du jour.', array('status' => 400));
        }

        $updated = wp_update_user(array(
            'ID' => $user_id,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'display_name' => trim($first_name . ' ' . $last_name),
        ));

        if (is_wp_error($updated)) {
            return $updated;
        }

        $socials = isset($payload['socialLinks']) && is_array($payload['socialLinks']) ? $payload['socialLinks'] : array();

        if ($username !== '') {
            update_user_meta($user_id, 'platform_username', $username);
        }
        update_user_meta($user_id, 'phone', sanitize_text_field((string) ($payload['phone'] ?? '')));
        update_user_meta($user_id, 'birth_date', $birth_date);
        update_user_meta($user_id, 'address', sanitize_text_field((string) ($payload['address'] ?? '')));
        update_user_meta($user_id, 'business_activity_category', sanitize_text_field((string) ($payload['businessActivityCategory'] ?? '')));
        update_user_meta($user_id, 'business_regions', wp_json_encode($business_regions));
        update_user_meta($user_id, 'business_cities', wp_json_encode($business_cities));
        if (array_key_exists('directoryVisibilityEnabled', $payload)) {
            update_user_meta($user_id, 'platform_directory_visibility_enabled', !empty($payload['directoryVisibilityEnabled']) ? '1' : '0');
        }
        $profile_photo_value = platform_auth_store_profile_photo($payload['profilePhoto'] ?? '', $user_id);
        if (is_wp_error($profile_photo_value)) {
            return $profile_photo_value;
        }
        update_user_meta($user_id, 'profile_photo', $profile_photo_value);
        $company_logo_value = platform_auth_store_company_logo($payload['companyLogo'] ?? '', $user_id);
        if (is_wp_error($company_logo_value)) {
            return $company_logo_value;
        }
        update_user_meta($user_id, 'company_logo', $company_logo_value);
        update_user_meta($user_id, 'social_facebook', esc_url_raw((string) ($socials['facebook'] ?? '')));
        update_user_meta($user_id, 'social_instagram', esc_url_raw((string) ($socials['instagram'] ?? '')));
        update_user_meta($user_id, 'social_x', esc_url_raw((string) ($socials['x'] ?? '')));
        update_user_meta($user_id, 'social_youtube', esc_url_raw((string) ($socials['youtube'] ?? '')));
        platform_auth_set_notification_emails_enabled($user_id, $notification_emails_enabled);
        if ($complete_onboarding || platform_auth_has_completed_onboarding($user_id)) {
            platform_auth_set_onboarding_completed($user_id, true);
        }

        $updated_user = get_user_by('id', $user_id);
        return platform_auth_profile_payload($updated_user);
    }
}

if (!function_exists('platform_auth_update_profile_photo')) {
    function platform_auth_update_profile_photo($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $profile_photo = trim((string) ($payload['profilePhoto'] ?? ''));
        if (!$user_id || $profile_photo === '') {
            return new WP_Error('platform_auth_invalid_profile_photo_payload', 'Utilisateur et photo de profil requis.', array('status' => 400));
        }

        $user = get_user_by('id', $user_id);
        if (!$user) {
            return new WP_Error('platform_auth_unknown_user', 'Utilisateur introuvable.', array('status' => 404));
        }

        $stored_photo = platform_auth_store_profile_photo($profile_photo, $user_id);
        if (is_wp_error($stored_photo)) {
            return $stored_photo;
        }

        update_user_meta($user_id, 'profile_photo', $stored_photo);
        return platform_auth_profile_payload($user);
    }
}

if (!function_exists('platform_auth_find_user_by_email_address')) {
    function platform_auth_find_user_by_email_address($email) {
        $email = sanitize_email((string) $email);
        if (!$email) {
            return null;
        }

        $user = get_user_by('email', $email);
        return $user instanceof WP_User ? $user : null;
    }
}

if (!function_exists('platform_auth_get_notification_preferences')) {
    function platform_auth_get_notification_preferences($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $email = sanitize_email((string) ($payload['email'] ?? ''));

        if ($user_id > 0) {
            $user = get_user_by('id', $user_id);
        } elseif ($email !== '') {
            $user = platform_auth_find_user_by_email_address($email);
        } else {
            $user = null;
        }

        if (!$user) {
            return array(
                'found' => false,
                'email' => $email,
                'notificationEmailsEnabled' => true,
            );
        }

        return array(
            'found' => true,
            'wpUserId' => (int) $user->ID,
            'email' => (string) $user->user_email,
            'notificationEmailsEnabled' => platform_auth_get_notification_emails_enabled($user->ID),
        );
    }
}

if (!function_exists('platform_auth_update_notification_preferences')) {
    function platform_auth_update_notification_preferences($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $email = sanitize_email((string) ($payload['email'] ?? ''));
        $enabled = !empty($payload['notificationEmailsEnabled']);

        if ($user_id > 0) {
            $user = get_user_by('id', $user_id);
        } elseif ($email !== '') {
            $user = platform_auth_find_user_by_email_address($email);
        } else {
            $user = null;
        }

        if (!$user) {
            return new WP_Error('platform_auth_unknown_user', 'Compte introuvable.', array('status' => 404));
        }

        platform_auth_set_notification_emails_enabled($user->ID, $enabled);

        return array(
            'ok' => true,
            'found' => true,
            'wpUserId' => (int) $user->ID,
            'email' => (string) $user->user_email,
            'notificationEmailsEnabled' => platform_auth_get_notification_emails_enabled($user->ID),
        );
    }
}

if (!function_exists('platform_auth_get_email_dispatcher_config')) {
    function platform_auth_get_email_dispatcher_config() {
        $endpoint = '';
        $shared_secret = '';

        if (function_exists('platform_2424_get_email_dispatcher_endpoint')) {
            $endpoint = trim((string) platform_2424_get_email_dispatcher_endpoint());
        }

        if (function_exists('platform_2424_get_email_dispatcher_secret')) {
            $shared_secret = trim((string) platform_2424_get_email_dispatcher_secret());
        }

        return array(
            'configured' => $endpoint !== '' && $shared_secret !== '',
            'endpoint' => $endpoint,
            'sharedSecret' => $shared_secret,
        );
    }
}

if (!function_exists('platform_auth_get_web_push_config')) {
    function platform_auth_get_web_push_config() {
        if (!function_exists('platform_2424_get_web_push_config')) {
            return array(
                'configured' => false,
                'publicKey' => '',
                'privateKey' => '',
                'subject' => '',
            );
        }

        return platform_2424_get_web_push_config();
    }
}

if (!function_exists('platform_auth_get_public_site_config')) {
    function platform_auth_get_current_plan_id($user_id) {
        $user_id = absint($user_id);
        if ($user_id <= 0 || !function_exists('platform_billing_get_subscription_snapshot')) {
            return 'free';
        }

        $snapshot = platform_billing_get_subscription_snapshot($user_id);
        $plan_id = sanitize_key((string) ($snapshot['planId'] ?? 'free'));
        return in_array($plan_id, array('free', 'essentiel', 'business'), true) ? $plan_id : 'free';
    }

    function platform_auth_get_plan_limit($limits, $plan_id) {
        $plan_id = sanitize_key((string) $plan_id);
        if (!is_array($limits)) {
            return 0;
        }

        return absint($limits[$plan_id] ?? 0);
    }

    function platform_auth_plan_meets_minimum($plan_id, $minimum_plan) {
        $order = array('free' => 0, 'essentiel' => 1, 'business' => 2);
        $plan_id = sanitize_key((string) $plan_id);
        $minimum_plan = sanitize_key((string) $minimum_plan);
        $plan_level = isset($order[$plan_id]) ? $order[$plan_id] : 0;
        $minimum_level = isset($order[$minimum_plan]) ? $order[$minimum_plan] : 0;

        return $plan_level >= $minimum_level;
    }

    function platform_auth_count_user_monthly_publications($user_id, $post_type) {
        $user_id = absint($user_id);
        $post_type = sanitize_key((string) $post_type);
        if ($user_id <= 0 || $post_type === '') {
            return 0;
        }

        $month_start = gmdate('Y-m-01\\T00:00:00');
        $next_month_start = gmdate('Y-m-01\\T00:00:00', strtotime('+1 month'));

        $query = new WP_Query(array(
            'post_type' => $post_type,
            'post_status' => 'any',
            'author' => $user_id,
            'posts_per_page' => 1,
            'fields' => 'ids',
            'meta_query' => array(
                'relation' => 'AND',
                array(
                    'key' => 'payment_status',
                    'value' => 'paid',
                    'compare' => '=',
                ),
                array(
                    'key' => 'payment_paid_at',
                    'value' => array($month_start, $next_month_start),
                    'compare' => 'BETWEEN',
                    'type' => 'CHAR',
                ),
            ),
        ));

        return absint($query->found_posts);
    }

    function platform_auth_get_monthly_included_publication_counter_meta_key($kind, $month_key = '') {
        $normalized_kind = sanitize_key((string) $kind);
        $normalized_month_key = preg_replace('/[^0-9\\-]/', '', (string) $month_key);
        if ($normalized_month_key === '') {
            $normalized_month_key = gmdate('Y-m');
        }

        return sprintf('platform_2424_included_publications_%s_%s', $normalized_kind, $normalized_month_key);
    }

    function platform_auth_get_user_monthly_included_publication_count($user_id, $kind, $legacy_post_type = '') {
        $user_id = absint($user_id);
        $normalized_kind = sanitize_key((string) $kind);
        if ($user_id <= 0 || $normalized_kind === '') {
            return 0;
        }

        $meta_key = platform_auth_get_monthly_included_publication_counter_meta_key($normalized_kind);
        $stored_count = get_user_meta($user_id, $meta_key, true);
        if ($stored_count !== '' && $stored_count !== null) {
            return max(0, absint($stored_count));
        }

        $legacy_count = $legacy_post_type !== '' ? platform_auth_count_user_monthly_publications($user_id, $legacy_post_type) : 0;
        update_user_meta($user_id, $meta_key, (string) $legacy_count);
        return $legacy_count;
    }

    function platform_auth_increment_user_monthly_included_publication_count($user_id, $kind, $legacy_post_type = '') {
        $user_id = absint($user_id);
        $normalized_kind = sanitize_key((string) $kind);
        if ($user_id <= 0 || $normalized_kind === '') {
            return 0;
        }

        $current_count = platform_auth_get_user_monthly_included_publication_count($user_id, $normalized_kind, $legacy_post_type);
        $next_count = $current_count + 1;
        $meta_key = platform_auth_get_monthly_included_publication_counter_meta_key($normalized_kind);
        update_user_meta($user_id, $meta_key, (string) $next_count);

        return $next_count;
    }

    function platform_auth_get_publishing_access_status($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        if ($user_id <= 0) {
            return new WP_Error('platform_auth_missing_wp_user_id', 'Utilisateur WordPress introuvable.', array('status' => 400));
        }

        $plan_id = platform_auth_get_current_plan_id($user_id);
        $access_grant = function_exists('platform_billing_user_has_all_privileges') && platform_billing_user_has_all_privileges($user_id)
            ? 'all_privileges'
            : null;
        $matrix = function_exists('platform_2424_get_access_matrix') ? platform_2424_get_access_matrix() : array();
        $classified_monthly_limit = platform_auth_get_plan_limit($matrix['classifieds']['monthlyPosts'] ?? array(), $plan_id);
        $classified_max_photos = max(1, platform_auth_get_plan_limit($matrix['classifieds']['maxPhotos'] ?? array(), $plan_id));
        $job_monthly_limit = platform_auth_get_plan_limit($matrix['jobs']['monthlyPosts'] ?? array(), $plan_id);
        $tender_monthly_limit = platform_auth_get_plan_limit($matrix['tenders']['monthlyPosts'] ?? array(), $plan_id);
        $tender_minimum_plan = sanitize_key((string) ($matrix['tenders']['minimumPlan'] ?? 'business'));
        $tender_response_minimum_plan = sanitize_key((string) ($matrix['tenders']['responseMinimumPlan'] ?? 'business'));
        $classified_used = platform_auth_get_user_monthly_included_publication_count($user_id, 'classified', 'classified_ad');
        $job_used = platform_auth_get_user_monthly_included_publication_count($user_id, 'job', 'job_offer');
        $tender_used = platform_auth_get_user_monthly_included_publication_count($user_id, 'tender', 'tender_notice');

        return array(
            'wpUserId' => $user_id,
            'planId' => $plan_id,
            'accessGrant' => $access_grant,
            'classifieds' => array(
                'canCreateDraft' => true,
                'canPublish' => $classified_monthly_limit > 0,
                'monthlyLimit' => $classified_monthly_limit,
                'monthlyUsed' => $classified_used,
                'monthlyRemaining' => max(0, $classified_monthly_limit - $classified_used),
                'maxPhotos' => $classified_max_photos,
            ),
            'jobs' => array(
                'canCreateDraft' => $job_monthly_limit > 0,
                'canPublish' => $job_monthly_limit > 0,
                'monthlyLimit' => $job_monthly_limit,
                'monthlyUsed' => $job_used,
                'monthlyRemaining' => max(0, $job_monthly_limit - $job_used),
            ),
            'tenders' => array(
                'canCreateDraft' => platform_auth_plan_meets_minimum($plan_id, $tender_minimum_plan) && $tender_monthly_limit > 0,
                'canPublish' => platform_auth_plan_meets_minimum($plan_id, $tender_minimum_plan) && $tender_monthly_limit > 0,
                'monthlyLimit' => $tender_monthly_limit,
                'monthlyUsed' => $tender_used,
                'monthlyRemaining' => max(0, $tender_monthly_limit - $tender_used),
                'canRespond' => platform_auth_plan_meets_minimum($plan_id, $tender_response_minimum_plan),
                'minimumPlan' => $tender_minimum_plan,
                'responseMinimumPlan' => $tender_response_minimum_plan,
            ),
            'period' => array(
                'monthKey' => gmdate('Y-m'),
                'resetsAt' => gmdate('c', strtotime('first day of next month 00:00:00 UTC')),
            ),
        );
    }

    function platform_auth_get_public_site_config() {
        $display_mode = function_exists('platform_2424_get_annonces_display_mode')
            ? platform_2424_get_annonces_display_mode()
            : 'separate';

        return array(
            'classifiedJobBlendEnabled' => $display_mode === 'blended',
            'annoncesDisplayMode' => $display_mode,
            'editorialSourceGraphqlUrl' => function_exists('platform_2424_get_editorial_source_graphql_url')
                ? platform_2424_get_editorial_source_graphql_url()
                : '',
            'seo' => function_exists('platform_2424_get_public_seo_config')
                ? platform_2424_get_public_seo_config()
                : array(),
            'footer' => function_exists('platform_2424_get_public_footer_config')
                ? platform_2424_get_public_footer_config()
                : array(),
            'adsense' => function_exists('platform_2424_get_adsense_config')
                ? platform_2424_get_adsense_config()
                : array(
                    'enabled' => false,
                    'clientId' => '',
                    'slots' => array(
                        'topBanner' => '',
                        'homeTop' => '',
                        'homeAfterEditorial' => '',
                        'archiveInline' => '',
                        'articleInline' => '',
                        'articleRail' => '',
                    ),
                ),
            'accessMatrix' => function_exists('platform_2424_get_access_matrix') ? platform_2424_get_access_matrix() : array(),
        );
    }
}

if (!function_exists('platform_auth_login_user')) {
    function platform_auth_get_login_otp_ttl_seconds() {
        return 15 * MINUTE_IN_SECONDS;
    }

    function platform_auth_get_login_otp_code_length() {
        return 6;
    }

    function platform_auth_get_login_otp_max_attempts() {
        return 5;
    }

    function platform_auth_get_login_otp_resend_cooldown_seconds() {
        return MINUTE_IN_SECONDS;
    }

    function platform_auth_get_login_otp_transient_key($challenge_id) {
        return 'platform_login_otp_' . sanitize_key((string) $challenge_id);
    }

    function platform_auth_hash_login_otp_code($code) {
        return hash_hmac('sha256', (string) $code, wp_salt('auth'));
    }

    function platform_auth_generate_login_otp_code() {
        $digits = '';
        $length = platform_auth_get_login_otp_code_length();
        for ($index = 0; $index < $length; $index++) {
            $digits .= (string) random_int(0, 9);
        }

        return $digits;
    }

    function platform_auth_mask_login_email($email) {
        $email = trim((string) $email);
        if ($email === '' || strpos($email, '@') === false) {
            return $email;
        }

        list($local, $domain) = explode('@', $email, 2);
        $local = trim((string) $local);
        if ($local === '') {
            return '***@' . $domain;
        }

        if (strlen($local) <= 2) {
            $masked_local = substr($local, 0, 1) . '*';
        } else {
            $masked_local = substr($local, 0, 1) . str_repeat('*', max(1, strlen($local) - 2)) . substr($local, -1);
        }

        return $masked_local . '@' . $domain;
    }

    function platform_auth_send_login_otp_email(WP_User $user, $code) {
        $display_name = trim((string) ($user->display_name ?: $user->user_login));
        $site_url = platform_auth_get_public_site_base_url();
        $site_host_label = platform_auth_get_site_host_label($site_url);
        $subject = 'Votre code de connexion';
        $message = platform_auth_render_transactional_email_shell(array(
            'title' => 'Code de connexion',
            'preheader' => sprintf('Utilisez ce code pour terminer votre connexion sur %s.', $site_host_label),
            'body_html' => sprintf(
                'Bonjour %1$s,<br/>Voici votre code de connexion à usage unique :<br/><br/><strong style="font-size:28px;letter-spacing:0.22em;color:#cc202a;">%2$s</strong><br/><br/>Ce code reste valide pendant 15 minutes.<br/>Si vous n\'êtes pas à l\'origine de cette demande, vous pouvez ignorer cet email.',
                esc_html($display_name !== '' ? $display_name : 'à vous'),
                esc_html((string) $code)
            ),
            'cta_label' => 'Retourner sur 2424',
            'cta_url' => $site_url,
        ));
        $headers = array('Content-Type: text/html; charset=UTF-8');

        $dispatch_result = platform_auth_dispatch_email_event(array(
            'eventName' => 'login-otp.requested.v1',
            'recipient' => array(
                'email' => (string) $user->user_email,
                'name' => $display_name,
            ),
            'templateData' => array_merge(platform_auth_get_email_dispatcher_branding(), array(
                'displayName' => $display_name !== '' ? $display_name : null,
                'identifier' => $display_name !== '' ? $display_name : null,
                'otpCode' => (string) $code,
                'loginUrl' => $site_url,
            )),
            'metadata' => array(
                'channel' => 'auth',
                'flow' => 'login-otp',
                'wpUserId' => (string) (int) $user->ID,
            ),
        ));

        if (!is_wp_error($dispatch_result)) {
            return array(
                'ok' => true,
                'emailSent' => true,
            );
        }

        if (!platform_auth_should_attempt_wp_mail_fallback($dispatch_result)) {
            return new WP_Error(
                'platform_auth_login_otp_send_failed',
                'Impossible d\'envoyer le code de connexion pour le moment.',
                array('status' => 502)
            );
        }

        platform_auth_clear_last_mail_error();
        platform_auth_clear_last_mail_debug();
        $email_sent = wp_mail($user->user_email, $subject, $message, $headers);
        if (!$email_sent) {
            $mail_error = platform_auth_get_last_mail_error();
            if ($mail_error === '') {
                $mail_error = 'wp_mail a retourne false sans detail supplementaire.';
            }

            return new WP_Error(
                'platform_auth_login_otp_send_failed',
                'Impossible d\'envoyer le code de connexion pour le moment. ' . $mail_error,
                array('status' => 502)
            );
        }

        return array(
            'ok' => true,
            'emailSent' => true,
        );
    }

    function platform_auth_create_login_otp_challenge(WP_User $user, $existing_challenge_id = '') {
        $challenge_id = $existing_challenge_id !== '' ? sanitize_key((string) $existing_challenge_id) : wp_generate_password(24, false, false);
        if ($challenge_id === '') {
            $challenge_id = wp_generate_password(24, false, false);
        }

        $code = platform_auth_generate_login_otp_code();
        $ttl = platform_auth_get_login_otp_ttl_seconds();
        $now = time();
        $payload = array(
            'userId' => (int) $user->ID,
            'email' => (string) $user->user_email,
            'codeHash' => platform_auth_hash_login_otp_code($code),
            'attempts' => 0,
            'maxAttempts' => platform_auth_get_login_otp_max_attempts(),
            'expiresAt' => $now + $ttl,
            'sentAt' => $now,
        );

        $send_result = platform_auth_send_login_otp_email($user, $code);
        if (is_wp_error($send_result)) {
            return $send_result;
        }

        set_transient(platform_auth_get_login_otp_transient_key($challenge_id), $payload, $ttl);

        return array(
            'otpRequired' => true,
            'challengeId' => $challenge_id,
            'email' => platform_auth_mask_login_email($user->user_email),
            'expiresInSeconds' => $ttl,
            'resendAvailableInSeconds' => platform_auth_get_login_otp_resend_cooldown_seconds(),
            'message' => 'Un code de connexion a été envoyé à votre adresse email.',
        );
    }

    function platform_auth_request_login_otp($payload) {
        $identifier = trim((string) ($payload['identifier'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        if (!$identifier || !$password) {
            return new WP_Error('platform_auth_invalid_credentials', 'Email ou mot de passe manquant.', array('status' => 400));
        }

        $user = platform_auth_find_user_by_identifier($identifier);
        if (!$user) {
            return new WP_Error('platform_auth_unknown_user', 'Compte introuvable.', array('status' => 404));
        }

        $authenticated = wp_authenticate($user->user_login, $password);
        if (is_wp_error($authenticated)) {
            return new WP_Error('platform_auth_bad_password', 'Email ou mot de passe invalide.', array('status' => 401));
        }

        return platform_auth_create_login_otp_challenge($authenticated);
    }

    function platform_auth_verify_login_otp($payload) {
        $challenge_id = sanitize_key((string) ($payload['challengeId'] ?? ''));
        $code = preg_replace('/\D+/', '', (string) ($payload['code'] ?? ''));
        if ($challenge_id === '' || $code === '') {
            return new WP_Error('platform_auth_login_otp_missing_payload', 'Code de connexion manquant.', array('status' => 400));
        }

        $transient_key = platform_auth_get_login_otp_transient_key($challenge_id);
        $challenge = get_transient($transient_key);
        if (!is_array($challenge)) {
            return new WP_Error('platform_auth_login_otp_expired', 'Ce code a expire. Merci de recommencer la connexion.', array('status' => 400));
        }

        $expires_at = isset($challenge['expiresAt']) ? (int) $challenge['expiresAt'] : 0;
        if ($expires_at > 0 && $expires_at < time()) {
            delete_transient($transient_key);
            return new WP_Error('platform_auth_login_otp_expired', 'Ce code a expire. Merci de recommencer la connexion.', array('status' => 400));
        }

        $attempts = isset($challenge['attempts']) ? (int) $challenge['attempts'] : 0;
        $max_attempts = isset($challenge['maxAttempts']) ? (int) $challenge['maxAttempts'] : platform_auth_get_login_otp_max_attempts();
        if ($attempts >= $max_attempts) {
            delete_transient($transient_key);
            return new WP_Error('platform_auth_login_otp_locked', 'Trop de tentatives pour ce code. Merci de recommencer la connexion.', array('status' => 429));
        }

        $expected_hash = (string) ($challenge['codeHash'] ?? '');
        $provided_hash = platform_auth_hash_login_otp_code($code);
        if ($expected_hash === '' || !hash_equals($expected_hash, $provided_hash)) {
            $challenge['attempts'] = $attempts + 1;
            $remaining_ttl = max(1, $expires_at - time());
            set_transient($transient_key, $challenge, $remaining_ttl);

            if ($challenge['attempts'] >= $max_attempts) {
                delete_transient($transient_key);
                return new WP_Error('platform_auth_login_otp_locked', 'Trop de tentatives pour ce code. Merci de recommencer la connexion.', array('status' => 429));
            }

            return new WP_Error('platform_auth_login_otp_invalid', 'Code de connexion invalide.', array('status' => 401));
        }

        $user_id = isset($challenge['userId']) ? absint($challenge['userId']) : 0;
        $user = $user_id > 0 ? get_user_by('id', $user_id) : false;
        delete_transient($transient_key);

        if (!$user || !($user instanceof WP_User)) {
            return new WP_Error('platform_auth_unknown_user', 'Compte introuvable.', array('status' => 404));
        }

        return array(
            'ok' => true,
            'user' => platform_auth_user_payload($user),
        );
    }

    function platform_auth_resend_login_otp($payload) {
        $challenge_id = sanitize_key((string) ($payload['challengeId'] ?? ''));
        if ($challenge_id === '') {
            return new WP_Error('platform_auth_login_otp_missing_challenge', 'Session de connexion introuvable.', array('status' => 400));
        }

        $transient_key = platform_auth_get_login_otp_transient_key($challenge_id);
        $challenge = get_transient($transient_key);
        if (!is_array($challenge)) {
            return new WP_Error('platform_auth_login_otp_expired', 'Ce code a expire. Merci de recommencer la connexion.', array('status' => 400));
        }

        $sent_at = isset($challenge['sentAt']) ? (int) $challenge['sentAt'] : 0;
        $cooldown = platform_auth_get_login_otp_resend_cooldown_seconds();
        $retry_after = $cooldown - max(0, time() - $sent_at);
        if ($retry_after > 0) {
            return new WP_Error(
                'platform_auth_login_otp_resend_cooldown',
                'Merci d\'attendre avant de demander un nouveau code.',
                array('status' => 429, 'retryAfter' => $retry_after)
            );
        }

        $user_id = isset($challenge['userId']) ? absint($challenge['userId']) : 0;
        $user = $user_id > 0 ? get_user_by('id', $user_id) : false;
        if (!$user || !($user instanceof WP_User)) {
            delete_transient($transient_key);
            return new WP_Error('platform_auth_unknown_user', 'Compte introuvable.', array('status' => 404));
        }

        return platform_auth_create_login_otp_challenge($user, $challenge_id);
    }

    function platform_auth_login_user($payload) {
        return platform_auth_request_login_otp($payload);
    }
}

if (!function_exists('platform_auth_request_account_deletion_code')) {
    function platform_auth_account_deletion_transient_key($challenge_id) {
        return 'platform_account_deletion_' . sanitize_key((string) $challenge_id);
    }

    function platform_auth_send_account_deletion_code(WP_User $user, $code) {
        $display_name = trim((string) ($user->display_name ?: $user->user_login));
        $site_url = platform_auth_get_public_site_base_url();
        $subject = 'Code de suppression de votre compte';
        $message = platform_auth_render_transactional_email_shell(array(
            'title' => 'Confirmez la suppression de votre compte',
            'preheader' => 'Utilisez ce code pour confirmer la suppression de votre compte 2424.mg.',
            'body_html' => sprintf(
                'Bonjour %1$s,<br/>Voici votre code à usage unique :<br/><br/><strong style="font-size:28px;letter-spacing:0.22em;color:#cc202a;">%2$s</strong><br/><br/>Ce code reste valide pendant 15 minutes. Si vous n\'êtes pas à l\'origine de cette demande, vous pouvez ignorer cet email.',
                esc_html($display_name !== '' ? $display_name : 'à vous'),
                esc_html((string) $code)
            ),
            'cta_label' => 'Retourner sur 2424',
            'cta_url' => $site_url,
        ));

        platform_auth_clear_last_mail_error();
        platform_auth_clear_last_mail_debug();
        if (!wp_mail($user->user_email, $subject, $message, array('Content-Type: text/html; charset=UTF-8'))) {
            return new WP_Error('platform_auth_account_deletion_code_send_failed', 'Impossible d\'envoyer le code de confirmation pour le moment.', array('status' => 502));
        }

        return true;
    }

    function platform_auth_request_account_deletion_code($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $user = $user_id > 0 ? get_user_by('id', $user_id) : false;
        if (!$user || !($user instanceof WP_User)) {
            return new WP_Error('platform_auth_unknown_user', 'Compte introuvable.', array('status' => 404));
        }

        $challenge_id = wp_generate_password(24, false, false);
        $code = platform_auth_generate_login_otp_code();
        $ttl = platform_auth_get_login_otp_ttl_seconds();
        $sent = platform_auth_send_account_deletion_code($user, $code);
        if (is_wp_error($sent)) {
            return $sent;
        }

        set_transient(platform_auth_account_deletion_transient_key($challenge_id), array(
            'userId' => (int) $user->ID,
            'codeHash' => platform_auth_hash_login_otp_code($code),
            'attempts' => 0,
            'maxAttempts' => platform_auth_get_login_otp_max_attempts(),
            'expiresAt' => time() + $ttl,
        ), $ttl);

        return array(
            'ok' => true,
            'challengeId' => $challenge_id,
            'expiresInSeconds' => $ttl,
            'email' => platform_auth_mask_login_email($user->user_email),
        );
    }

    function platform_auth_verify_account_deletion_code($user_id, $challenge_id, $code) {
        $key = platform_auth_account_deletion_transient_key($challenge_id);
        $challenge = get_transient($key);
        if (!is_array($challenge) || absint($challenge['userId'] ?? 0) !== absint($user_id)) {
            return new WP_Error('platform_auth_account_deletion_code_expired', 'Ce code a expiré. Demandez-en un nouveau.', array('status' => 400));
        }

        $expires_at = absint($challenge['expiresAt'] ?? 0);
        $attempts = absint($challenge['attempts'] ?? 0);
        $max_attempts = absint($challenge['maxAttempts'] ?? platform_auth_get_login_otp_max_attempts());
        if (($expires_at > 0 && $expires_at < time()) || $attempts >= $max_attempts) {
            delete_transient($key);
            return new WP_Error('platform_auth_account_deletion_code_expired', 'Ce code n\'est plus valide. Demandez-en un nouveau.', array('status' => 400));
        }

        if (!hash_equals((string) ($challenge['codeHash'] ?? ''), platform_auth_hash_login_otp_code(preg_replace('/\D+/', '', (string) $code)))) {
            $challenge['attempts'] = $attempts + 1;
            set_transient($key, $challenge, max(1, $expires_at - time()));
            return new WP_Error('platform_auth_account_deletion_code_invalid', 'Code de confirmation invalide.', array('status' => 401));
        }

        delete_transient($key);
        return true;
    }

    function platform_auth_delete_account_content($user_id) {
        $post_ids = get_posts(array(
            'post_type' => array('annuaire', 'classified_ad', 'job_offer', 'tender_notice'),
            'post_status' => 'any',
            'author' => absint($user_id),
            'posts_per_page' => -1,
            'fields' => 'ids',
        ));

        foreach ((array) $post_ids as $post_id) {
            if (!wp_delete_post(absint($post_id), true)) {
                return new WP_Error('platform_auth_account_deletion_content_failed', 'Impossible de supprimer un contenu associé au compte.', array('status' => 500));
            }
        }

        $attachment_ids = get_posts(array(
            'post_type' => 'attachment',
            'post_status' => 'any',
            'author' => absint($user_id),
            'posts_per_page' => -1,
            'fields' => 'ids',
        ));
        foreach ((array) $attachment_ids as $attachment_id) {
            wp_delete_attachment(absint($attachment_id), true);
        }

        return count((array) $post_ids);
    }

    function platform_auth_anonymize_account_activity($user_id) {
        global $wpdb;
        $user_id = absint($user_id);
        $wpdb->update($wpdb->comments, array(
            'user_id' => 0,
            'comment_author' => 'Utilisateur supprimé',
            'comment_author_email' => '',
            'comment_author_url' => '',
            'comment_author_IP' => '',
        ), array('user_id' => $user_id));

        $rating_ids = get_posts(array(
            'post_type' => 'platform_user_rating',
            'post_status' => 'any',
            'posts_per_page' => -1,
            'fields' => 'ids',
            'meta_query' => array(
                array(
                    'key' => 'rater_user_id',
                    'value' => $user_id,
                    'compare' => '=',
                    'type' => 'NUMERIC',
                ),
            ),
        ));
        foreach ((array) $rating_ids as $rating_id) {
            update_post_meta(absint($rating_id), 'rater_user_id', 0);
            update_post_meta(absint($rating_id), 'thread_key', '');
        }

        $received_rating_ids = get_posts(array(
            'post_type' => 'platform_user_rating',
            'post_status' => 'any',
            'posts_per_page' => -1,
            'fields' => 'ids',
            'meta_query' => array(
                array(
                    'key' => 'seller_user_id',
                    'value' => $user_id,
                    'compare' => '=',
                    'type' => 'NUMERIC',
                ),
            ),
        ));
        foreach ((array) $received_rating_ids as $rating_id) {
            wp_delete_post(absint($rating_id), true);
        }
    }

    function platform_auth_delete_account($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $confirmation = trim((string) ($payload['confirmation'] ?? ''));
        $user = $user_id > 0 ? get_user_by('id', $user_id) : false;
        if (!$user || !($user instanceof WP_User)) {
            return new WP_Error('platform_auth_unknown_user', 'Compte introuvable.', array('status' => 404));
        }
        if ($confirmation !== 'SUPPRIMER') {
            return new WP_Error('platform_auth_account_deletion_confirmation', 'Confirmation de suppression invalide.', array('status' => 400));
        }
        if (platform_auth_user_has_paid_membership($user_id)) {
            return new WP_Error('platform_auth_account_deletion_subscription_active', 'Résiliez votre abonnement payant avant de supprimer votre compte.', array('status' => 409));
        }

        $current_password = (string) ($payload['currentPassword'] ?? '');
        $challenge_id = sanitize_key((string) ($payload['challengeId'] ?? ''));
        $verification_code = (string) ($payload['verificationCode'] ?? '');
        if ($challenge_id !== '') {
            $verified = platform_auth_verify_account_deletion_code($user_id, $challenge_id, $verification_code);
            if (is_wp_error($verified)) {
                return $verified;
            }
        } elseif ($current_password === '' || !wp_check_password($current_password, $user->user_pass, $user_id)) {
            return new WP_Error('platform_auth_account_deletion_bad_password', 'Mot de passe actuel invalide.', array('status' => 401));
        }

        $deleted_content_count = platform_auth_delete_account_content($user_id);
        if (is_wp_error($deleted_content_count)) {
            return $deleted_content_count;
        }
        platform_auth_anonymize_account_activity($user_id);

        require_once ABSPATH . 'wp-admin/includes/user.php';
        if (!wp_delete_user($user_id)) {
            return new WP_Error('platform_auth_account_deletion_failed', 'Impossible de supprimer le compte pour le moment.', array('status' => 500));
        }

        if (function_exists('platform_2424_log')) {
            platform_2424_log('info', 'Compte utilisateur supprimé à la demande de son titulaire.', array(
                'user_id' => (string) $user_id,
                'deleted_content_count' => (string) $deleted_content_count,
            ));
        }

        return array('ok' => true, 'message' => 'Votre compte a été supprimé.');
    }
}

if (!function_exists('platform_auth_request_password_reset')) {
    function platform_auth_request_password_reset($payload) {
        $identifier = trim((string) ($payload['identifier'] ?? ''));
        if (!$identifier) {
            return new WP_Error('platform_auth_missing_identifier', 'Email manquant.', array('status' => 400));
        }

        $user = platform_auth_find_user_by_identifier($identifier);
        if ($user) {
            platform_auth_clear_last_mail_error();
            platform_auth_clear_last_mail_debug();
            $reset_key = get_password_reset_key($user);
            if (is_wp_error($reset_key)) {
                return new WP_Error('platform_auth_reset_failed', 'Impossible de préparer l\'email de réinitialisation pour le moment.', array('status' => 500));
            }

            $reset_url = platform_auth_build_password_reset_url($user, $reset_key);
            $display_name = trim((string) ($user->display_name ?: $user->user_login));
            $first_name = trim((string) get_user_meta($user->ID, 'first_name', true));
            $site_host_label = platform_auth_get_site_host_label(platform_auth_get_public_site_base_url());
            $subject = sprintf('Réinitialisez votre mot de passe %s', $site_host_label);
            $message = platform_auth_render_transactional_email_shell(array(
                'title' => 'Réinitialisez votre mot de passe',
                'preheader' => sprintf('Choisissez un nouveau mot de passe pour accéder à votre compte %s.', $site_host_label),
                'body_html' => sprintf(
                    'Bonjour %1$s,<br/>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte %3$s.<br/><br/>Si vous êtes à l\'origine de cette demande, utilisez le bouton ci-dessous pour définir un nouveau mot de passe.<br/><br/>Si le bouton ne fonctionne pas, vous pouvez aussi copier et coller ce lien dans votre navigateur :<br/><a href="%2$s" style="color:#2563eb;text-decoration:underline;word-break:break-all;">%2$s</a>',
                    esc_html($display_name !== '' ? $display_name : 'a vous'),
                    esc_url($reset_url),
                    esc_html($site_host_label)
                ),
                'cta_label' => 'Choisir un nouveau mot de passe',
                'cta_url' => $reset_url,
            ));
            $headers = array('Content-Type: text/html; charset=UTF-8');

            $dispatch_result = platform_auth_dispatch_email_event(array(
                'eventName' => 'password-reset.requested.v1',
                'recipient' => array(
                    'email' => (string) $user->user_email,
                    'name' => $display_name,
                ),
                'templateData' => array_merge(platform_auth_get_email_dispatcher_branding(), array(
                    'firstName' => $first_name !== '' ? $first_name : null,
                    'displayName' => $display_name !== '' ? $display_name : null,
                    'identifier' => $display_name !== '' ? $display_name : null,
                    'resetUrl' => $reset_url,
                    'forgotPasswordUrl' => $reset_url,
                )),
                'metadata' => array(
                    'channel' => 'auth',
                    'flow' => 'password-reset',
                    'wpUserId' => (string) (int) $user->ID,
                ),
            ));

            if (is_wp_error($dispatch_result)) {
                $dispatch_error = platform_auth_format_dispatcher_error($dispatch_result);
                $dispatch_error_data = $dispatch_result->get_error_data();
                $dispatch_status = is_array($dispatch_error_data) && isset($dispatch_error_data['status']) ? (int) $dispatch_error_data['status'] : 0;
                $dispatch_body = is_array($dispatch_error_data) && isset($dispatch_error_data['body']) ? (string) $dispatch_error_data['body'] : '';
                $dispatch_url = is_array($dispatch_error_data) && isset($dispatch_error_data['url']) ? (string) $dispatch_error_data['url'] : '';
                $uses_smtp = platform_auth_dispatcher_deferred_to_smtp($dispatch_result);

                if (!$uses_smtp && function_exists('platform_2424_log')) {
                    platform_2424_log('warning', 'Email dispatcher indisponible pour la réinitialisation, fallback wp_mail.', array(
                        'user_id' => (string) (int) $user->ID,
                        'email' => (string) $user->user_email,
                        'error' => $dispatch_error,
                        'status' => $dispatch_status > 0 ? (string) $dispatch_status : '',
                        'body' => $dispatch_body,
                        'url' => $dispatch_url,
                    ));
                }

                if (!platform_auth_should_attempt_wp_mail_fallback($dispatch_result)) {
                    if (function_exists('platform_2424_log')) {
                        platform_2424_log('error', 'Email de réinitialisation non envoyé: dispatcher indisponible et fallback wp_mail désactivé.', array(
                            'user_id' => (string) (int) $user->ID,
                            'email' => (string) $user->user_email,
                            'error' => $dispatch_error,
                        ));
                    }

                    return new WP_Error('platform_auth_reset_failed', 'Impossible d\'envoyer l\'email de réinitialisation pour le moment. ' . $dispatch_error, array('status' => 502));
                }

                platform_auth_clear_last_mail_error();
                platform_auth_clear_last_mail_debug();
                $email_sent = wp_mail($user->user_email, $subject, $message, $headers);
                $mail_error = platform_auth_get_last_mail_error();

                if (!$email_sent) {
                    if ($mail_error === '') {
                        $mail_error = 'wp_mail a retourne false sans detail supplementaire.';
                    }
                    if (!$uses_smtp && $dispatch_error !== '') {
                        $mail_error = trim($dispatch_error . ' | ' . $mail_error, ' |');
                    }
                    if (function_exists('platform_2424_log')) {
                        platform_2424_log('error', 'Échec envoi email de réinitialisation.', array(
                            'user_id' => (string) (int) $user->ID,
                            'email' => (string) $user->user_email,
                            'error' => $mail_error,
                        ));
                    }
                    error_log('[platform_auth] Password reset send failed for user #' . (int) $user->ID . ' (' . $user->user_email . '): ' . $mail_error);
                    return new WP_Error('platform_auth_reset_failed', 'Impossible d\'envoyer l\'email de réinitialisation pour le moment.', array('status' => 500));
                }

                if (function_exists('platform_2424_log')) {
                    platform_2424_log('info', $uses_smtp ? 'Email de réinitialisation envoyé via SMTP.' : 'Email de réinitialisation envoyé via wp_mail fallback.', array(
                        'user_id' => (string) (int) $user->ID,
                        'email' => (string) $user->user_email,
                    ));
                }
            } elseif (function_exists('platform_2424_log')) {
                platform_2424_log('info', 'Email de réinitialisation envoyé via email dispatcher.', array(
                    'user_id' => (string) (int) $user->ID,
                    'email' => (string) $user->user_email,
                ));
            }
        }

        return array(
            'ok' => true,
            'message' => 'Si un compte existe avec cette adresse, un email de réinitialisation vient d\'être envoyé.',
        );
    }
}

if (!function_exists('platform_auth_confirm_password_reset')) {
    function platform_auth_confirm_password_reset($payload) {
        $login = sanitize_user((string) ($payload['login'] ?? ''), true);
        $key = trim((string) ($payload['key'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        if ($login === '' || $key === '' || $password === '') {
            return new WP_Error('platform_auth_invalid_reset_payload', 'Lien de réinitialisation invalide.', array('status' => 400));
        }

        if (!platform_auth_password_is_strong($password)) {
            return new WP_Error('platform_auth_weak_password', 'Le mot de passe ne respecte pas le niveau de sécurité requis.', array('status' => 400));
        }

        $user = check_password_reset_key($key, $login);
        if (is_wp_error($user)) {
            return new WP_Error('platform_auth_invalid_reset_key', 'Lien de réinitialisation invalide ou expiré.', array('status' => 400));
        }

        if (!($user instanceof WP_User)) {
            return new WP_Error('platform_auth_reset_user_not_found', 'Compte introuvable.', array('status' => 404));
        }

        reset_password($user, $password);

        if (function_exists('platform_2424_log')) {
            platform_2424_log('info', 'Mot de passe réinitialisé depuis le frontend.', array(
                'user_id' => (string) (int) $user->ID,
                'email' => (string) $user->user_email,
            ));
        }

        return array(
            'ok' => true,
            'message' => 'Votre mot de passe a été réinitialisé avec succès.',
        );
    }
}

if (!function_exists('platform_auth_change_password')) {
    function platform_auth_change_password($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $current_password = (string) ($payload['currentPassword'] ?? '');
        $new_password = (string) ($payload['newPassword'] ?? '');

        if (!$user_id || $current_password === '' || $new_password === '') {
            return new WP_Error('platform_auth_invalid_password_change_payload', 'Mot de passe actuel et nouveau mot de passe requis.', array('status' => 400));
        }

        if (!platform_auth_password_is_strong($new_password)) {
            return new WP_Error('platform_auth_weak_password', 'Le mot de passe ne respecte pas le niveau de sécurité requis.', array('status' => 400));
        }

        if ($current_password === $new_password) {
            return new WP_Error('platform_auth_password_unchanged', 'Le nouveau mot de passe doit être différent de l\'ancien.', array('status' => 400));
        }

        $user = get_user_by('id', $user_id);
        if (!$user instanceof WP_User) {
            return new WP_Error('platform_auth_unknown_user', 'Compte introuvable.', array('status' => 404));
        }

        if (!wp_check_password($current_password, $user->user_pass, $user_id)) {
            return new WP_Error('platform_auth_current_password_invalid', 'Le mot de passe actuel est incorrect.', array('status' => 400));
        }

        wp_set_password($new_password, $user_id);

        if (function_exists('platform_2424_log')) {
            platform_2424_log('info', 'Mot de passe modifié depuis le profil frontend.', array(
                'user_id' => (string) $user_id,
                'email' => (string) $user->user_email,
            ));
        }

        return array(
            'ok' => true,
            'message' => 'Votre mot de passe a été mis à jour.',
        );
    }
}
add_action('wp_mail_failed', function ($error) {
    if (!is_wp_error($error)) {
        return;
    }

    $message = $error->get_error_message();
    $data = $error->get_error_data();

    if (is_array($data) && isset($data['phpmailer_exception_code'])) {
        $message .= ' [phpmailer_exception_code=' . $data['phpmailer_exception_code'] . ']';
    }

    if (is_array($data) && isset($data['to'])) {
        $recipients = is_array($data['to']) ? implode(',', array_map('strval', $data['to'])) : (string) $data['to'];
        $message .= ' [to=' . $recipients . ']';
    }

    $debug_lines = platform_auth_get_last_mail_debug();
    if (!empty($debug_lines)) {
        $message .= ' [smtp_debug=' . implode(' || ', $debug_lines) . ']';
    }

    platform_auth_set_last_mail_error($message);
    if (function_exists('platform_2424_log')) {
        platform_2424_log('error', 'wp_mail_failed capture une erreur PHPMailer.', array(
            'error' => $message,
            'smtp_debug' => $debug_lines,
        ));
    }
}, 10, 1);

if (!function_exists('platform_auth_send_verification_email_for_user')) {
    function platform_auth_send_verification_email_for_user($payload) {
        $user_id = absint($payload['wpUserId'] ?? 0);
        $email = sanitize_email((string) ($payload['email'] ?? ''));

        $user = null;
        if ($user_id > 0) {
            $user = get_user_by('id', $user_id);
        }
        if (!$user && $email !== '') {
            $user = get_user_by('email', $email);
        }
        if (!$user) {
            return new WP_Error('platform_auth_unknown_user', 'Compte introuvable.', array('status' => 404));
        }

        return platform_auth_send_email_verification($user);
    }
}

if (!function_exists('platform_auth_confirm_email_verification')) {
    function platform_auth_confirm_email_verification($payload) {
        $email = sanitize_email((string) ($payload['email'] ?? ''));
        $token = trim((string) ($payload['token'] ?? ''));

        if ($email === '' || $token === '') {
            return new WP_Error('platform_auth_invalid_verification_payload', 'Lien de verification invalide.', array('status' => 400));
        }

        $user = get_user_by('email', $email);
        if (!$user) {
            return new WP_Error('platform_auth_unknown_user', 'Compte introuvable.', array('status' => 404));
        }

        if (platform_auth_is_email_verified($user->ID)) {
            return array(
                'ok' => true,
                'emailVerified' => true,
                'user' => platform_auth_user_payload($user),
                'message' => 'Email deja verifie.',
            );
        }

        $expected_hash = (string) get_user_meta($user->ID, 'platform_email_verification_token_hash', true);
        $expires_at = (int) get_user_meta($user->ID, 'platform_email_verification_expires_at', true);
        $provided_hash = hash('sha256', $token);

        if ($expected_hash === '' || !hash_equals($expected_hash, $provided_hash)) {
            return new WP_Error('platform_auth_invalid_verification_token', 'Lien de verification invalide.', array('status' => 400));
        }

        if ($expires_at > 0 && time() > $expires_at) {
            return new WP_Error('platform_auth_verification_token_expired', 'Lien de verification expire.', array('status' => 400));
        }

        platform_auth_mark_email_verified($user->ID);
        $verified_user = get_user_by('id', $user->ID);

        return array(
            'ok' => true,
            'emailVerified' => true,
            'user' => platform_auth_user_payload($verified_user),
            'message' => 'Email verifie avec succes.',
        );
    }
}

add_action('rest_api_init', function () {
    register_rest_route('2424/v1', '/auth/availability', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            return rest_ensure_response(platform_auth_check_availability($request->get_json_params() ?: array()));
        },
    ));

    register_rest_route('2424/v1', '/auth/register', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_register_user($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/login', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_login_user($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/login/verify-otp', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_verify_login_otp($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/login/resend-otp', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_resend_login_otp($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/password-reset', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_request_password_reset($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/password-reset/confirm', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_confirm_password_reset($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/password/change', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_change_password($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/account-deletion/request-code', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_request_account_deletion_code($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/account-deletion', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_delete_account($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/email-verification/send', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_send_verification_email_for_user($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/email-verification/confirm', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_confirm_email_verification($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/profile', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_get_profile($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/profile/update', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_update_profile($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/profile/photo', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_update_profile_photo($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/notification-preferences', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_get_notification_preferences($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/notification-preferences/update', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_update_notification_preferences($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));

    register_rest_route('2424/v1', '/auth/email-dispatcher-config', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function () {
            return rest_ensure_response(platform_auth_get_email_dispatcher_config());
        },
    ));

    register_rest_route('2424/v1', '/auth/web-push-config', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function () {
            $response = rest_ensure_response(platform_auth_get_web_push_config());
            $response->header('Cache-Control', 'private, no-store');
            return $response;
        },
    ));

    register_rest_route('2424/v1', '/auth/public-site-config', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function () {
            return rest_ensure_response(platform_auth_get_public_site_config());
        },
    ));

    register_rest_route('2424/v1', '/auth/public-privacy-policy', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function () {
            $policy = function_exists('platform_2424_get_public_privacy_policy')
                ? platform_2424_get_public_privacy_policy()
                : array('configured' => false);

            return rest_ensure_response($policy);
        },
    ));

    register_rest_route('2424/v1', '/auth/publishing-access-status', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => function (WP_REST_Request $request) {
            return platform_auth_ensure_request_authorized($request);
        },
        'callback' => function (WP_REST_Request $request) {
            $result = platform_auth_get_publishing_access_status($request->get_json_params() ?: array());
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
    ));
});
