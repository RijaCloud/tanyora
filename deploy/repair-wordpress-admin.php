<?php

if (getenv('TANYORA_ISOLATED_MODE') !== 'true' || getenv('PLATFORM_PUBLIC_SITE_URL') !== 'https://tanyora.mijary.tech') {
    fwrite(STDERR, "Refusing to update a non-Tanyora WordPress site.\n");
    exit(1);
}

$password = getenv('TANYORA_ADMIN_PASSWORD');
if (!$password) {
    fwrite(STDERR, "Missing Tanyora admin password.\n");
    exit(1);
}

$_SERVER['HTTP_HOST'] = 'tanyora-admin.mijary.tech';
$_SERVER['HTTPS'] = 'on';
$_SERVER['SERVER_PORT'] = '443';
$_SERVER['REQUEST_URI'] = '/';

require '/var/www/html/wp-load.php';

$user = get_user_by('login', 'tanyora-admin');
if (!$user) {
    fwrite(STDERR, "Tanyora admin account not found.\n");
    exit(1);
}

$result = wp_update_user(array('ID' => $user->ID, 'user_email' => 'admin@tanyora.local'));
if (is_wp_error($result)) {
    fwrite(STDERR, "Could not update the admin email.\n");
    exit(1);
}

wp_set_password($password, $user->ID);
$updated = get_userdata($user->ID);
if (!$updated || $updated->user_email !== 'admin@tanyora.local' || !wp_check_password($password, $updated->user_pass, $user->ID)) {
    fwrite(STDERR, "Tanyora admin verification failed.\n");
    exit(1);
}

echo "Tanyora admin email and password verified.\n";
