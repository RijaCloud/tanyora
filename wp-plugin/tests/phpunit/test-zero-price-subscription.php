<?php

if (!function_exists('wc_get_product')) {
    function wc_get_product($id) {
        return $GLOBALS['platform_test_products'][$id] ?? false;
    }
}
if (!function_exists('wc_get_product_id_by_sku')) {
    function wc_get_product_id_by_sku($sku) {
        return 0;
    }
}

class Platform_Test_Priced_Product {
    public $price;
    public $regular_price = '';
    public function __construct($price) { $this->price = $price; }
    public function get_price() { return $this->price; }
    public function get_regular_price() { return $this->regular_price; }
}

class Platform_Zero_Price_Subscription_Test extends WP_UnitTestCase {
    private $map_filter;

    public function set_up(): void {
        parent::set_up();
        $GLOBALS['platform_test_products'] = array(101 => new Platform_Test_Priced_Product('0'), 102 => new Platform_Test_Priced_Product('0'));
        $this->map_filter = function ($map) {
            $map['monthly']['essentiel'] = 101;
            $map['annual']['essentiel'] = 102;
            return $map;
        };
        add_filter('platform_billing_plan_product_map', $this->map_filter);
    }

    public function tear_down(): void {
        remove_filter('platform_billing_plan_product_map', $this->map_filter);
        unset($GLOBALS['platform_test_products']);
        parent::tear_down();
    }

    public function test_zero_prices_and_annual_availability() {
        $GLOBALS['platform_test_products'][101]->regular_price = '15000';
        $GLOBALS['platform_test_products'][102]->regular_price = '140000';
        $pricing = platform_billing_get_plan_pricing_snapshot('essentiel');
        $this->assertSame(0.0, $pricing['monthlyPriceAr']);
        $this->assertSame(15000.0, $pricing['monthlyRegularPriceAr']);
        $this->assertTrue($pricing['annual']['available']);
        $this->assertSame(140000.0, $pricing['annual']['regularPriceAr']);
        $this->assertSame(0.0, $pricing['annual']['finalAmountAr']);
    }

    public function test_activation_is_idempotent_and_expires_normally() {
        $user_id = self::factory()->user->create();
        $payload = array('wpUserId' => $user_id, 'flow' => 'subscription', 'planId' => 'essentiel', 'billingPeriod' => 'annual');
        $result = platform_2424_papi_start_payment($payload);
        $this->assertTrue($result['activated']);
        $expiry = get_user_meta($user_id, '_platform_papi_renews_at', true);
        $this->assertGreaterThan(time() + 360 * DAY_IN_SECONDS, strtotime($expiry));
        $this->assertSame('zero_price', get_user_meta($user_id, '_platform_papi_activation_source', true));
        $this->assertSame('local', platform_billing_get_papi_snapshot($user_id)['billingProvider']);
        $this->assertTrue(platform_2424_papi_start_payment($payload)['activated']);
        $this->assertSame($expiry, get_user_meta($user_id, '_platform_papi_renews_at', true));
        update_user_meta($user_id, '_platform_papi_renews_at', gmdate('c', time() - 1));
        $this->assertSame('free', platform_billing_get_papi_snapshot($user_id)['planId']);
    }

    public function test_empty_or_changed_price_never_activates() {
        $user_id = self::factory()->user->create();
        $payload = array('wpUserId' => $user_id, 'flow' => 'subscription', 'planId' => 'essentiel', 'billingPeriod' => 'monthly', 'expectedZeroPrice' => true);
        $GLOBALS['platform_test_products'][101]->price = '';
        $this->assertWPError(platform_2424_papi_start_payment($payload));
        $GLOBALS['platform_test_products'][101]->price = '300';
        $result = platform_2424_papi_start_payment($payload);
        $this->assertWPError($result);
        $this->assertSame('platform_papi_price_changed', $result->get_error_code());
        $this->assertSame('', get_user_meta($user_id, '_platform_papi_plan_id', true));
    }
}
