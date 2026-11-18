<?php

if (getenv('TANYORA_ISOLATED_MODE') !== 'true' || getenv('PLATFORM_PUBLIC_SITE_URL') !== 'https://tanyora.mijary.tech') {
    fwrite(STDERR, "Refusing to activate outside the isolated Tanyora site.\n");
    exit(1);
}

$_SERVER['HTTP_HOST'] = '127.0.0.1:9088';
$_SERVER['REQUEST_URI'] = '/';

require '/var/www/html/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';

$result = activate_plugin('tanyora-platform/2424-platform.php');
if (is_wp_error($result)) {
    fwrite(STDERR, "Plugin activation failed: " . $result->get_error_message() . "\n");
    exit(1);
}

echo "2424-derived plugin activated on Tanyora WordPress.\n";
