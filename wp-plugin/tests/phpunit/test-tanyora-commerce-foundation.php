<?php

class Tanyora_Commerce_Foundation_Test extends WP_UnitTestCase {
    private function eligible_facts() {
        $digest = str_repeat('a', 64);
        return array(
            'seller_organization_id' => 10,
            'seller_verification_organization_id' => 10,
            'seller_verification_status' => 'approved',
            'seller_verification_source' => 'direct_official_confirmation',
            'seller_verification_recorded_by' => 20,
            'seller_verification_approved_by' => 21,
            'seller_verification_reference_digest' => $digest,
            'seller_verification_expires_at' => 2000,
            'seller_scope_organization_id' => 10,
            'seller_scope_status' => 'active',
            'seller_scope_substance' => 'gold',
            'seller_scope_market' => 'international',
            'seller_scope_expires_at' => 2000,
            'seller_actor_type' => 'licensed_gold_comptoir',
            'listing_organization_id' => 10,
            'listing_substance' => 'gold',
            'listing_market' => 'international',
            'listing_quantity_positive' => true,
            'listing_compliance_status' => 'approved',
            'listing_commercial_status' => 'published',
            'destination_country' => 'FR',
            'export_rules_approved' => true,
            'quantity_pool_available' => true,
            'buyer_organization_id' => 30,
            'buyer_verification_organization_id' => 30,
            'buyer_verification_status' => 'approved',
            'buyer_verification_source' => 'external_kyc_provider',
            'buyer_verification_reference_digest' => $digest,
            'buyer_verification_expires_at' => 2000,
            'agreed_offer_or_fixed_price' => true,
        );
    }

    public function test_policy_requires_distinct_official_reviewers() {
        $facts = $this->eligible_facts();
        $facts['seller_verification_approved_by'] = 20;
        $result = tanyora_commerce_evaluate_policy('publish', $facts, 1000);
        $this->assertFalse($result['eligible']);
        $this->assertContains('seller_not_confirmed', $result['reasons']);
    }

    public function test_policy_rejects_internal_buyer_approval() {
        $facts = $this->eligible_facts();
        $facts['buyer_verification_source'] = 'admin_decision';
        $result = tanyora_commerce_evaluate_policy('rfq', $facts, 1000);
        $this->assertFalse($result['eligible']);
        $this->assertContains('buyer_not_verified', $result['reasons']);
    }

    public function test_policy_rejects_expired_or_cross_organization_rights() {
        $facts = $this->eligible_facts();
        $facts['seller_scope_expires_at'] = 1000;
        $facts['buyer_verification_organization_id'] = 31;
        $result = tanyora_commerce_evaluate_policy('order', $facts, 1000);
        $this->assertContains('seller_scope_expired', $result['reasons']);
        $this->assertContains('buyer_not_verified', $result['reasons']);
    }

    public function test_gold_export_requires_licensed_comptoir_and_destination() {
        $facts = $this->eligible_facts();
        $facts['seller_actor_type'] = 'collector';
        $facts['destination_country'] = '';
        $result = tanyora_commerce_evaluate_policy('publish', $facts, 1000);
        $this->assertContains('gold_export_actor_not_eligible', $result['reasons']);
        $this->assertContains('export_not_approved', $result['reasons']);
    }

    public function test_order_requires_available_quantity_and_agreed_price() {
        $facts = $this->eligible_facts();
        $facts['quantity_pool_available'] = false;
        $facts['agreed_offer_or_fixed_price'] = false;
        $result = tanyora_commerce_evaluate_policy('order', $facts, 1000);
        $this->assertContains('quantity_unavailable', $result['reasons']);
        $this->assertContains('price_not_agreed', $result['reasons']);
    }

    public function test_complete_facts_are_eligible_but_do_not_enable_capabilities() {
        $facts = $this->eligible_facts();
        foreach (array('publish', 'rfq', 'order') as $action) {
            $this->assertTrue(tanyora_commerce_evaluate_policy($action, $facts, 1000)['eligible']);
        }
        $this->assertFalse(tanyora_commerce_capabilities()['orders']);
    }

    public function test_unknown_action_is_rejected() {
        $result = tanyora_commerce_evaluate_policy('payment', $this->eligible_facts(), 1000);
        $this->assertFalse($result['eligible']);
        $this->assertSame(array('invalid_action'), $result['reasons']);
    }

    public function test_commercial_capabilities_are_closed_by_default() {
        $capabilities = tanyora_commerce_capabilities();

        $this->assertFalse($capabilities['mineralCatalog']);
        $this->assertFalse($capabilities['sellerVerification']);
        $this->assertFalse($capabilities['buyerVerification']);
        $this->assertFalse($capabilities['quotes']);
        $this->assertFalse($capabilities['orders']);
        $this->assertFalse($capabilities['onlinePayments']);
    }

    public function test_capability_route_requires_internal_authentication() {
        $old_secret = getenv('PLATFORM_SUBMISSIONS_SECRET');
        putenv('PLATFORM_SUBMISSIONS_SECRET=tanyora-commerce-test-secret');
        do_action('rest_api_init');

        $denied = rest_get_server()->dispatch(new WP_REST_Request('POST', '/2424/v1/tanyora/commerce/capabilities'));
        $this->assertSame(403, $denied->get_status());

        $request = new WP_REST_Request('POST', '/2424/v1/tanyora/commerce/capabilities');
        $request->set_header('x-2424-internal-secret', 'tanyora-commerce-test-secret');
        $allowed = rest_get_server()->dispatch($request);
        $this->assertSame(200, $allowed->get_status());
        $this->assertFalse($allowed->get_data()['orders']);
        $this->assertSame('private, no-store', $allowed->get_headers()['Cache-Control']);

        if ($old_secret === false) putenv('PLATFORM_SUBMISSIONS_SECRET');
        else putenv('PLATFORM_SUBMISSIONS_SECRET=' . $old_secret);
    }

    public function test_schema_installation_is_explicit_and_versioned() {
        global $wpdb;

        $this->assertFalse(tanyora_commerce_schema_ready());
        $this->assertTrue(tanyora_commerce_install_schema());
        $this->assertTrue(tanyora_commerce_schema_ready());
        $this->assertTrue(tanyora_commerce_install_schema());
        $this->assertSame(TANYORA_COMMERCE_SCHEMA_VERSION, get_option('tanyora_commerce_schema_version'));

        foreach (tanyora_commerce_tables() as $table) {
            $found = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table)));
            $this->assertSame($table, $found);
        }

        $columns = $wpdb->get_col('SHOW COLUMNS FROM ' . tanyora_commerce_tables()['orders'], 0);
        $this->assertContains('buyer_verification_id', $columns);
        $this->assertContains('seller_scope_id', $columns);

        $this->assertFalse(tanyora_commerce_capabilities()['orders']);
    }

    public function test_organization_declaration_is_idempotent_and_tenant_scoped() {
        $this->assertTrue(tanyora_commerce_install_schema());
        $owner = self::factory()->user->create();
        $stranger = self::factory()->user->create();
        $key = 'test-organization-request-12345678';

        $first = tanyora_commerce_create_organization($owner, 'Cabinet Test', 'MG', $key);
        $this->assertFalse(is_wp_error($first));
        $this->assertSame('pending', $first['status']);
        $retry = tanyora_commerce_create_organization($owner, 'Changed Name', 'MG', $key);
        $this->assertSame($first['id'], $retry['id']);
        $this->assertSame('Cabinet Test', $retry['name']);

        $owner_items = tanyora_commerce_user_organizations($owner);
        $stranger_items = tanyora_commerce_user_organizations($stranger);
        $this->assertCount(1, $owner_items);
        $this->assertSame('owner', $owner_items[0]['member_role']);
        $this->assertSame(array(), $stranger_items);
        $this->assertTrue(tanyora_commerce_user_is_member($first['id'], $owner));
        $this->assertFalse(tanyora_commerce_user_is_member($first['id'], $stranger));
        $this->assertFalse(tanyora_commerce_capabilities()['quotes']);
    }

    public function test_organization_declaration_rejects_invalid_identity() {
        $this->assertTrue(tanyora_commerce_install_schema());
        $result = tanyora_commerce_create_organization(0, 'Cabinet Test', 'MG', 'test-key-12345678');
        $this->assertTrue(is_wp_error($result));
        $this->assertSame('tanyora_commerce_invalid_organization', $result->get_error_code());
    }

    public function test_organization_route_rejects_requests_without_internal_secret() {
        $old_secret = getenv('PLATFORM_SUBMISSIONS_SECRET');
        putenv('PLATFORM_SUBMISSIONS_SECRET=tanyora-organization-test-secret');
        delete_option('tanyora_commerce_schema_version');
        do_action('rest_api_init');

        $request = new WP_REST_Request('POST', '/2424/v1/tanyora/commerce/organizations/list');
        $request->set_body(wp_json_encode(array('wpUserId' => 1)));
        $request->set_header('Content-Type', 'application/json');
        $denied = rest_get_server()->dispatch($request);
        $this->assertSame(403, $denied->get_status());

        $request->set_header('x-2424-internal-secret', 'tanyora-organization-test-secret');
        $allowed = rest_get_server()->dispatch($request);
        $this->assertSame(503, $allowed->get_status());

        if ($old_secret === false) putenv('PLATFORM_SUBMISSIONS_SECRET');
        else putenv('PLATFORM_SUBMISSIONS_SECRET=' . $old_secret);
    }
}
