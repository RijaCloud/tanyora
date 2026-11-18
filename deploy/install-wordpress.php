<?php

define('WP_INSTALLING', true);
$_SERVER['HTTP_HOST'] = '127.0.0.1:9088';
$_SERVER['REQUEST_URI'] = '/';

require '/var/www/html/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/upgrade.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';

$password = getenv('TANYORA_ADMIN_PASSWORD');
$url = getenv('TANYORA_PREVIEW_URL');

if (!$password || !$url) {
    fwrite(STDERR, "Missing installation settings.\n");
    exit(1);
}

if (!is_blog_installed()) {
    wp_install('Tanyora', 'tanyora-admin', 'admin@tanyora.local', false, '', $password);
}

update_option('home', $url);
update_option('siteurl', $url);

$result = activate_plugin('tanyora/tanyora.php');
if (is_wp_error($result)) {
    fwrite(STDERR, "Tanyora plugin activation failed: " . $result->get_error_message() . "\n");
    exit(1);
}

echo "WordPress and Tanyora plugin ready.\n";
