<?php

if (!defined('ABSPATH')) {
    exit;
}

const TANYORA_COMMERCE_SCHEMA_VERSION = '3';

function tanyora_commerce_tables() {
    global $wpdb;

    $prefix = $wpdb->prefix . 'tanyora_';
    return array(
        'organizations' => $prefix . 'organizations',
        'memberships' => $prefix . 'organization_memberships',
        'verifications' => $prefix . 'commercial_verifications',
        'seller_scopes' => $prefix . 'seller_scopes',
        'listing_compliance' => $prefix . 'listing_compliance',
        'quantity_pools' => $prefix . 'quantity_pools',
        'quantity_movements' => $prefix . 'quantity_movements',
        'reservations' => $prefix . 'quantity_reservations',
        'rfqs' => $prefix . 'mineral_rfqs',
        'offers' => $prefix . 'mineral_offers',
        'orders' => $prefix . 'mineral_orders',
        'audit_events' => $prefix . 'commerce_audit_events',
    );
}

function tanyora_commerce_schema_ready() {
    return get_option('tanyora_commerce_schema_version') === TANYORA_COMMERCE_SCHEMA_VERSION;
}

/** No commercial capability can be opened by an environment flag alone. */
function tanyora_commerce_capabilities() {
    return array(
        'schemaReady' => tanyora_commerce_schema_ready(),
        'mineralCatalog' => false,
        'sellerVerification' => false,
        'buyerVerification' => false,
        'quotes' => false,
        'orders' => false,
        'onlinePayments' => false,
    );
}

/** Evaluate trusted server-side facts; never accept these facts from a browser request. */
function tanyora_commerce_evaluate_policy($action, $facts, $now = null) {
    $reasons = array();
    if (!in_array($action, array('publish', 'rfq', 'order'), true) || !is_array($facts)) {
        return array('eligible' => false, 'reasons' => array('invalid_action'));
    }

    $now = $now === null ? time() : $now;
    if (!is_int($now) || $now <= 0) {
        return array('eligible' => false, 'reasons' => array('invalid_time'));
    }

    if (($facts['seller_verification_status'] ?? '') !== 'approved' ||
        ($facts['seller_verification_source'] ?? '') !== 'direct_official_confirmation' ||
        empty($facts['seller_organization_id']) ||
        ($facts['seller_verification_organization_id'] ?? null) !== ($facts['seller_organization_id'] ?? null) ||
        empty($facts['seller_verification_recorded_by']) ||
        empty($facts['seller_verification_approved_by']) ||
        (int) $facts['seller_verification_recorded_by'] === (int) $facts['seller_verification_approved_by'] ||
        empty($facts['seller_verification_reference_digest'])) {
        $reasons[] = 'seller_not_confirmed';
    }

    $seller_expiry = $facts['seller_verification_expires_at'] ?? null;
    if (!is_int($seller_expiry) || $seller_expiry <= $now) {
        $reasons[] = 'seller_confirmation_expired';
    }

    if (($facts['seller_scope_status'] ?? '') !== 'active' ||
        ($facts['seller_scope_organization_id'] ?? null) !== ($facts['seller_organization_id'] ?? null) ||
        ($facts['listing_organization_id'] ?? null) !== ($facts['seller_organization_id'] ?? null) ||
        ($facts['seller_scope_substance'] ?? '') === '' ||
        ($facts['seller_scope_substance'] ?? '') !== ($facts['listing_substance'] ?? null) ||
        ($facts['seller_scope_market'] ?? '') !== ($facts['listing_market'] ?? null)) {
        $reasons[] = 'seller_scope_mismatch';
    }

    $scope_expiry = $facts['seller_scope_expires_at'] ?? null;
    if (!is_int($scope_expiry) || $scope_expiry <= $now) {
        $reasons[] = 'seller_scope_expired';
    }

    if (($facts['listing_compliance_status'] ?? '') !== 'approved' ||
        !in_array($facts['listing_market'] ?? '', array('local', 'international'), true) ||
        empty($facts['listing_quantity_positive'])) {
        $reasons[] = 'listing_not_compliant';
    }

    if (($facts['listing_market'] ?? '') === 'international' &&
        (empty($facts['destination_country']) || empty($facts['export_rules_approved']))) {
        $reasons[] = 'export_not_approved';
    }

    if (($facts['listing_substance'] ?? '') === 'gold' &&
        ($facts['listing_market'] ?? '') === 'international' &&
        ($facts['seller_actor_type'] ?? '') !== 'licensed_gold_comptoir') {
        $reasons[] = 'gold_export_actor_not_eligible';
    }

    if (empty($facts['quantity_pool_available'])) {
        $reasons[] = 'quantity_unavailable';
    }

    if ($action !== 'publish') {
        if (($facts['buyer_verification_status'] ?? '') !== 'approved' ||
            ($facts['buyer_verification_source'] ?? '') !== 'external_kyc_provider' ||
            empty($facts['buyer_organization_id']) ||
            ($facts['buyer_organization_id'] ?? null) === ($facts['seller_organization_id'] ?? null) ||
            ($facts['buyer_verification_organization_id'] ?? null) !== ($facts['buyer_organization_id'] ?? null) ||
            empty($facts['buyer_verification_reference_digest'])) {
            $reasons[] = 'buyer_not_verified';
        }

        $buyer_expiry = $facts['buyer_verification_expires_at'] ?? null;
        if (!is_int($buyer_expiry) || $buyer_expiry <= $now) {
            $reasons[] = 'buyer_verification_expired';
        }

        if (($facts['listing_commercial_status'] ?? '') !== 'published') {
            $reasons[] = 'listing_not_available';
        }
    }

    if ($action === 'order' && empty($facts['agreed_offer_or_fixed_price'])) {
        $reasons[] = 'price_not_agreed';
    }

    return array('eligible' => count($reasons) === 0, 'reasons' => $reasons);
}

/** Explicit migration entry point; never runs on a public request or plugin update. */
function tanyora_commerce_install_schema() {
    global $wpdb;

    if (tanyora_commerce_schema_ready()) {
        return true;
    }

    $t = tanyora_commerce_tables();
    $prior_version = get_option('tanyora_commerce_schema_version');
    if ($prior_version !== TANYORA_COMMERCE_SCHEMA_VERSION) {
        $existing_table = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($t['organizations'])));
        if ($existing_table === $t['organizations'] && (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t['organizations']}") > 0) {
            return new WP_Error('tanyora_commerce_manual_migration_required', 'Existing organizations require a reviewed migration.');
        }
    }

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();
    $queries = array(
        "CREATE TABLE {$t['organizations']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL,
            country_code char(2) NOT NULL,
            status varchar(32) NOT NULL DEFAULT 'pending',
            created_by bigint(20) unsigned NOT NULL,
            creation_key char(64) NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY creation_key (creation_key),
            KEY created_by (created_by)
        ) ENGINE=InnoDB {$charset};",
        "CREATE TABLE {$t['memberships']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            organization_id bigint(20) unsigned NOT NULL,
            user_id bigint(20) unsigned NOT NULL,
            member_role varchar(32) NOT NULL,
            status varchar(32) NOT NULL DEFAULT 'active',
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY organization_user (organization_id,user_id),
            KEY user_id (user_id)
        ) ENGINE=InnoDB {$charset};",
        "CREATE TABLE {$t['verifications']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            organization_id bigint(20) unsigned NOT NULL,
            verification_kind varchar(16) NOT NULL,
            source_type varchar(32) NOT NULL,
            status varchar(32) NOT NULL DEFAULT 'pending',
            reference_digest char(64) NOT NULL,
            recorded_by bigint(20) unsigned NOT NULL DEFAULT 0,
            approved_by bigint(20) unsigned NOT NULL DEFAULT 0,
            confirmed_at datetime DEFAULT NULL,
            expires_at datetime DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY organization_kind (organization_id,verification_kind,status),
            KEY expiry (expires_at)
        ) ENGINE=InnoDB {$charset};",
        "CREATE TABLE {$t['seller_scopes']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            verification_id bigint(20) unsigned NOT NULL,
            organization_id bigint(20) unsigned NOT NULL,
            substance_code varchar(80) NOT NULL,
            market varchar(16) NOT NULL,
            actor_type varchar(32) NOT NULL,
            max_quantity decimal(24,6) DEFAULT NULL,
            quantity_unit varchar(16) NOT NULL,
            status varchar(32) NOT NULL DEFAULT 'pending',
            expires_at datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY organization_substance (organization_id,substance_code,market,status),
            KEY verification_id (verification_id)
        ) ENGINE=InnoDB {$charset};",
        "CREATE TABLE {$t['listing_compliance']} (
            listing_id bigint(20) unsigned NOT NULL,
            organization_id bigint(20) unsigned NOT NULL,
            seller_scope_id bigint(20) unsigned NOT NULL DEFAULT 0,
            substance_code varchar(80) NOT NULL,
            market varchar(16) NOT NULL,
            destination_country char(2) NOT NULL DEFAULT '',
            listing_quantity decimal(24,6) NOT NULL DEFAULT 0,
            quantity_unit varchar(16) NOT NULL,
            compliance_status varchar(32) NOT NULL DEFAULT 'pending',
            commercial_status varchar(32) NOT NULL DEFAULT 'draft',
            reviewed_at datetime DEFAULT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (listing_id),
            KEY organization_status (organization_id,compliance_status),
            KEY seller_scope_id (seller_scope_id)
        ) ENGINE=InnoDB {$charset};",
        "CREATE TABLE {$t['quantity_pools']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            seller_scope_id bigint(20) unsigned NOT NULL,
            unit varchar(16) NOT NULL,
            max_quantity decimal(24,6) DEFAULT NULL,
            published_quantity decimal(24,6) NOT NULL DEFAULT 0,
            reserved_quantity decimal(24,6) NOT NULL DEFAULT 0,
            committed_quantity decimal(24,6) NOT NULL DEFAULT 0,
            sold_quantity decimal(24,6) NOT NULL DEFAULT 0,
            version bigint(20) unsigned NOT NULL DEFAULT 0,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY seller_scope_id (seller_scope_id)
        ) ENGINE=InnoDB {$charset};",
        "CREATE TABLE {$t['quantity_movements']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            pool_id bigint(20) unsigned NOT NULL,
            listing_id bigint(20) unsigned NOT NULL DEFAULT 0,
            order_id bigint(20) unsigned NOT NULL DEFAULT 0,
            movement_type varchar(32) NOT NULL,
            quantity decimal(24,6) NOT NULL,
            idempotency_key varchar(100) NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY idempotency_key (idempotency_key),
            KEY pool_created (pool_id,created_at)
        ) ENGINE=InnoDB {$charset};",
        "CREATE TABLE {$t['reservations']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            pool_id bigint(20) unsigned NOT NULL,
            listing_id bigint(20) unsigned NOT NULL,
            buyer_organization_id bigint(20) unsigned NOT NULL,
            order_id bigint(20) unsigned NOT NULL DEFAULT 0,
            quantity decimal(24,6) NOT NULL,
            status varchar(32) NOT NULL DEFAULT 'active',
            expires_at datetime NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY pool_status (pool_id,status),
            KEY expiry (status,expires_at)
        ) ENGINE=InnoDB {$charset};",
        "CREATE TABLE {$t['rfqs']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            listing_id bigint(20) unsigned NOT NULL,
            buyer_organization_id bigint(20) unsigned NOT NULL,
            seller_organization_id bigint(20) unsigned NOT NULL,
            buyer_verification_id bigint(20) unsigned NOT NULL,
            seller_scope_id bigint(20) unsigned NOT NULL,
            market varchar(16) NOT NULL,
            destination_country char(2) NOT NULL,
            quantity decimal(24,6) NOT NULL,
            quantity_unit varchar(16) NOT NULL,
            status varchar(32) NOT NULL DEFAULT 'draft',
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY buyer_status (buyer_organization_id,status),
            KEY seller_status (seller_organization_id,status)
        ) ENGINE=InnoDB {$charset};",
        "CREATE TABLE {$t['offers']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            rfq_id bigint(20) unsigned NOT NULL,
            revision int(10) unsigned NOT NULL,
            price decimal(24,2) NOT NULL,
            currency char(3) NOT NULL,
            status varchar(32) NOT NULL DEFAULT 'proposed',
            created_by bigint(20) unsigned NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY rfq_revision (rfq_id,revision)
        ) ENGINE=InnoDB {$charset};",
        "CREATE TABLE {$t['orders']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            listing_id bigint(20) unsigned NOT NULL,
            rfq_id bigint(20) unsigned NOT NULL DEFAULT 0,
            offer_id bigint(20) unsigned NOT NULL DEFAULT 0,
            buyer_organization_id bigint(20) unsigned NOT NULL,
            seller_organization_id bigint(20) unsigned NOT NULL,
            buyer_verification_id bigint(20) unsigned NOT NULL,
            seller_scope_id bigint(20) unsigned NOT NULL,
            reservation_id bigint(20) unsigned NOT NULL DEFAULT 0,
            market varchar(16) NOT NULL,
            destination_country char(2) NOT NULL,
            quantity decimal(24,6) NOT NULL,
            quantity_unit varchar(16) NOT NULL,
            agreed_price decimal(24,2) NOT NULL,
            currency char(3) NOT NULL,
            status varchar(32) NOT NULL DEFAULT 'pending_compliance',
            settlement_status varchar(32) NOT NULL DEFAULT 'not_due',
            settlement_reference_digest char(64) NOT NULL DEFAULT '',
            idempotency_key varchar(100) NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY idempotency_key (idempotency_key),
            KEY buyer_status (buyer_organization_id,status),
            KEY seller_status (seller_organization_id,status)
        ) ENGINE=InnoDB {$charset};",
        "CREATE TABLE {$t['audit_events']} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            event_type varchar(80) NOT NULL,
            entity_type varchar(40) NOT NULL,
            entity_id bigint(20) unsigned NOT NULL,
            actor_user_id bigint(20) unsigned NOT NULL DEFAULT 0,
            actor_organization_id bigint(20) unsigned NOT NULL DEFAULT 0,
            payload_digest char(64) NOT NULL DEFAULT '',
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY entity_history (entity_type,entity_id,created_at),
            KEY actor_history (actor_user_id,created_at)
        ) ENGINE=InnoDB {$charset};",
    );

    foreach ($queries as $query) {
        dbDelta($query);
        if ($wpdb->last_error !== '') {
            return new WP_Error('tanyora_commerce_schema_error', 'Commerce schema installation failed.');
        }
    }

    foreach ($t as $table) {
        $found = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table)));
        if ($found !== $table) {
            return new WP_Error('tanyora_commerce_schema_incomplete', 'Commerce schema installation incomplete.');
        }
        $status = $wpdb->get_row($wpdb->prepare('SHOW TABLE STATUS LIKE %s', $wpdb->esc_like($table)), ARRAY_A);
        if (!$status || ($status['Engine'] ?? '') !== 'InnoDB') {
            return new WP_Error('tanyora_commerce_schema_incomplete', 'Commerce schema must use InnoDB.');
        }
    }

    $creation_index = $wpdb->get_row("SHOW INDEX FROM {$t['organizations']} WHERE Key_name = 'creation_key'", ARRAY_A);
    if (!$creation_index || (int) ($creation_index['Non_unique'] ?? 1) !== 0) {
        return new WP_Error('tanyora_commerce_schema_incomplete', 'Commerce idempotency index is missing.');
    }

    $required_columns = array(
        'organizations' => array('creation_key', 'status', 'created_by'),
        'verifications' => array('reference_digest', 'recorded_by', 'approved_by', 'expires_at'),
        'seller_scopes' => array('substance_code', 'market', 'actor_type', 'max_quantity'),
        'listing_compliance' => array('substance_code', 'market', 'destination_country', 'listing_quantity'),
        'quantity_pools' => array('reserved_quantity', 'committed_quantity', 'version'),
        'rfqs' => array('buyer_verification_id', 'seller_scope_id', 'destination_country'),
        'orders' => array('offer_id', 'buyer_verification_id', 'seller_scope_id', 'idempotency_key'),
    );
    foreach ($required_columns as $key => $columns) {
        $existing = $wpdb->get_col("SHOW COLUMNS FROM {$t[$key]}", 0);
        if ($wpdb->last_error !== '' || array_diff($columns, (array) $existing)) {
            return new WP_Error('tanyora_commerce_schema_incomplete', 'Commerce schema installation incomplete.');
        }
    }

    update_option('tanyora_commerce_schema_version', TANYORA_COMMERCE_SCHEMA_VERSION, false);
    return true;
}

/** An organization declaration is not an institutional verification. */
function tanyora_commerce_create_organization($user_id, $name, $country_code, $request_key) {
    global $wpdb;

    if (!tanyora_commerce_schema_ready()) {
        return new WP_Error('tanyora_commerce_not_ready', 'Organization registration is unavailable.', array('status' => 503));
    }

    $user_id = absint($user_id);
    $name = sanitize_text_field(trim((string) $name));
    $name_length = function_exists('mb_strlen') ? mb_strlen($name, 'UTF-8') : strlen($name);
    $country_code = strtoupper(trim((string) $country_code));
    $request_key = trim((string) $request_key);
    if (!$user_id || !get_user_by('id', $user_id) || $name === '' || $name_length > 120 ||
        !preg_match('/^[A-Z]{2}$/D', $country_code) ||
        !preg_match('/^[A-Za-z0-9_-]{8,100}$/D', $request_key)) {
        return new WP_Error('tanyora_commerce_invalid_organization', 'Invalid organization request.', array('status' => 400));
    }

    $tables = tanyora_commerce_tables();
    $creation_key = hash('sha256', $user_id . ':' . $request_key);
    $existing = $wpdb->get_row($wpdb->prepare(
        "SELECT id, name, country_code, status FROM {$tables['organizations']} WHERE creation_key = %s AND created_by = %d",
        $creation_key,
        $user_id
    ), ARRAY_A);
    if ($existing) {
        $existing['id'] = (int) $existing['id'];
        return $existing;
    }

    if ($wpdb->query('START TRANSACTION') === false) {
        return new WP_Error('tanyora_commerce_unavailable', 'Organization registration is unavailable.', array('status' => 503));
    }

    $now = current_time('mysql', true);
    $created = $wpdb->insert($tables['organizations'], array(
        'name' => $name,
        'country_code' => $country_code,
        'status' => 'pending',
        'created_by' => $user_id,
        'creation_key' => $creation_key,
        'created_at' => $now,
        'updated_at' => $now,
    ));
    if ($created === false) {
        $wpdb->query('ROLLBACK');
        // A concurrent retry may have committed the same idempotency key.
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id, name, country_code, status FROM {$tables['organizations']} WHERE creation_key = %s AND created_by = %d",
            $creation_key,
            $user_id
        ), ARRAY_A);
        if ($existing) $existing['id'] = (int) $existing['id'];
        return $existing ?: new WP_Error('tanyora_commerce_unavailable', 'Organization registration is unavailable.', array('status' => 503));
    }

    $organization_id = (int) $wpdb->insert_id;
    $member = $wpdb->insert($tables['memberships'], array(
        'organization_id' => $organization_id,
        'user_id' => $user_id,
        'member_role' => 'owner',
        'status' => 'active',
        'created_at' => $now,
    ));
    $audit = $member === false ? false : $wpdb->insert($tables['audit_events'], array(
        'event_type' => 'organization_declared',
        'entity_type' => 'organization',
        'entity_id' => $organization_id,
        'actor_user_id' => $user_id,
        'actor_organization_id' => $organization_id,
        'created_at' => $now,
    ));
    if ($member === false || $audit === false || $wpdb->query('COMMIT') === false) {
        $wpdb->query('ROLLBACK');
        return new WP_Error('tanyora_commerce_unavailable', 'Organization registration is unavailable.', array('status' => 503));
    }

    return array('id' => $organization_id, 'name' => $name, 'country_code' => $country_code, 'status' => 'pending');
}

function tanyora_commerce_user_organizations($user_id) {
    global $wpdb;

    if (!tanyora_commerce_schema_ready()) {
        return new WP_Error('tanyora_commerce_not_ready', 'Organizations are unavailable.', array('status' => 503));
    }
    $user_id = absint($user_id);
    if (!$user_id) {
        return new WP_Error('tanyora_commerce_invalid_user', 'Invalid user.', array('status' => 400));
    }

    $tables = tanyora_commerce_tables();
    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT o.id, o.name, o.country_code, o.status, m.member_role
         FROM {$tables['organizations']} o
         INNER JOIN {$tables['memberships']} m ON m.organization_id = o.id
         WHERE m.user_id = %d AND m.status = 'active'
         ORDER BY o.id DESC LIMIT 100",
        $user_id
    ), ARRAY_A);
    return $wpdb->last_error === '' ? $rows : new WP_Error('tanyora_commerce_unavailable', 'Organizations are unavailable.', array('status' => 503));
}

function tanyora_commerce_user_is_member($organization_id, $user_id) {
    global $wpdb;

    if (!tanyora_commerce_schema_ready() || !absint($organization_id) || !absint($user_id)) {
        return false;
    }
    $tables = tanyora_commerce_tables();
    return (bool) $wpdb->get_var($wpdb->prepare(
        "SELECT 1 FROM {$tables['memberships']}
         WHERE organization_id = %d AND user_id = %d AND status = 'active' LIMIT 1",
        $organization_id,
        $user_id
    ));
}

add_action('rest_api_init', function () {
    register_rest_route('2424/v1', '/tanyora/commerce/capabilities', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => 'platform_submissions_ensure_request_authorized',
        'callback' => function () {
            $response = rest_ensure_response(tanyora_commerce_capabilities());
            $response->header('Cache-Control', 'private, no-store');
            return $response;
        },
    ));

    register_rest_route('2424/v1', '/tanyora/commerce/organizations/create', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => 'platform_submissions_ensure_request_authorized',
        'callback' => function (WP_REST_Request $request) {
            $payload = $request->get_json_params();
            $payload = is_array($payload) ? $payload : array();
            $result = tanyora_commerce_create_organization(
                $payload['wpUserId'] ?? 0,
                $payload['name'] ?? '',
                $payload['countryCode'] ?? '',
                $payload['requestKey'] ?? ''
            );
            if (is_wp_error($result)) return $result;
            $response = rest_ensure_response($result);
            $response->header('Cache-Control', 'private, no-store');
            return $response;
        },
    ));

    register_rest_route('2424/v1', '/tanyora/commerce/organizations/list', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => 'platform_submissions_ensure_request_authorized',
        'callback' => function (WP_REST_Request $request) {
            $payload = $request->get_json_params();
            $payload = is_array($payload) ? $payload : array();
            $result = tanyora_commerce_user_organizations($payload['wpUserId'] ?? 0);
            if (is_wp_error($result)) return $result;
            $response = rest_ensure_response(array('items' => $result));
            $response->header('Cache-Control', 'private, no-store');
            return $response;
        },
    ));
});

if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('tanyora commerce-migrate', function () {
        if (getenv('TANYORA_COMMERCE_MIGRATION_ALLOWED') !== '1') {
            WP_CLI::error('Set TANYORA_COMMERCE_MIGRATION_ALLOWED=1 after testing a backup.');
        }
        $result = tanyora_commerce_install_schema();
        if (is_wp_error($result)) {
            WP_CLI::error($result->get_error_message());
        }
        WP_CLI::success('Commerce schema version ' . TANYORA_COMMERCE_SCHEMA_VERSION . ' is ready.');
    });
}
