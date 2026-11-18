<?php

if (getenv('TANYORA_ISOLATED_MODE') !== 'true' || getenv('PLATFORM_PUBLIC_SITE_URL') !== 'https://tanyora.mijary.tech') {
    fwrite(STDERR, "Refusing to update a non-Tanyora WordPress site.\n");
    exit(1);
}

$email = getenv('TANYORA_ADMIN_EMAIL');
if (!is_string($email) || $email === '') {
    fwrite(STDERR, "Missing admin email.\n");
    exit(1);
}

$_SERVER['HTTP_HOST'] = 'tanyora-admin.mijary.tech';
$_SERVER['HTTPS'] = 'on';
$_SERVER['SERVER_PORT'] = '443';
$_SERVER['REQUEST_URI'] = '/';

require '/var/www/html/wp-load.php';

if (!is_email($email)) {
    fwrite(STDERR, "Invalid admin email.\n");
    exit(1);
}

$user = get_user_by('login', 'tanyora-admin');
if (!$user) {
    fwrite(STDERR, "Tanyora admin account not found.\n");
    exit(1);
}

$result = wp_update_user(array('ID' => $user->ID, 'user_email' => $email));
if (is_wp_error($result) || get_userdata($user->ID)->user_email !== $email) {
    fwrite(STDERR, "Admin email update failed.\n");
    exit(1);
}

update_option('admin_email', $email);
if (get_option('admin_email') !== $email) {
    fwrite(STDERR, "Site admin email update failed.\n");
    exit(1);
}

echo "Tanyora account and site admin emails updated and verified.\n";
