<?php

if (getenv('TANYORA_ISOLATED_MODE') !== 'true') {
    fwrite(STDERR, "Refusing to change a non-Tanyora WordPress site.\n");
    exit(1);
}

$_SERVER['HTTP_HOST'] = 'tanyora-admin.mijary.tech';
$_SERVER['HTTPS'] = 'on';
$_SERVER['SERVER_PORT'] = '443';
$_SERVER['REQUEST_URI'] = '/';

require '/var/www/html/wp-load.php';

$url = 'https://tanyora-admin.mijary.tech';
$allowed = array('http://127.0.0.1:9088', $url);
$home = (string) get_option('home');
$siteurl = (string) get_option('siteurl');

if (!in_array($home, $allowed, true) || !in_array($siteurl, $allowed, true)) {
    fwrite(STDERR, "Unexpected existing WordPress URL; no changes made.\n");
    exit(1);
}

update_option('home', $url);
update_option('siteurl', $url);

echo "Tanyora WordPress URLs now use the HTTPS admin hostname.\n";
