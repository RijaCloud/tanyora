<?php

class Platform_2424_Plugin_Runtime_Test extends WP_UnitTestCase {
    public function test_typesense_tab_is_available_and_its_key_is_never_exported() {
        $_GET['tab'] = 'typesense';
        $this->assertSame('typesense', platform_2424_get_admin_tab());
        $this->assertContains('platform_2424_typesense_api_key', platform_2424_get_sensitive_settings_option_keys());
        unset($_GET['tab']);
    }

    public function test_web_push_config_is_private_and_available_only_to_internal_requests() {
        $previous_secret = getenv('PLATFORM_SUBMISSIONS_SECRET');
        putenv('PLATFORM_SUBMISSIONS_SECRET=push-config-secret');
        update_option('platform_2424_vapid_public_key', 'public-vapid-key');
        update_option('platform_2424_vapid_private_key', 'private-vapid-key');
        update_option('platform_2424_vapid_subject', 'mailto:contact@2424.mg');
        do_action('rest_api_init');

        $this->assertContains('platform_2424_vapid_private_key', platform_2424_get_sensitive_settings_option_keys());
        $this->assertContains('platform_2424_vapid_private_key', platform_2424_get_non_transferable_settings_option_keys());
        $this->assertSame(array(
            'configured' => true,
            'publicKey' => 'public-vapid-key',
            'privateKey' => 'private-vapid-key',
            'subject' => 'mailto:contact@2424.mg',
        ), platform_auth_get_web_push_config());

        $forbidden = rest_get_server()->dispatch(new WP_REST_Request('POST', '/2424/v1/auth/web-push-config'));
        $this->assertSame(403, $forbidden->get_status());

        $request = new WP_REST_Request('POST', '/2424/v1/auth/web-push-config');
        $request->set_header('x-2424-internal-secret', 'push-config-secret');
        $response = rest_get_server()->dispatch($request);
        $this->assertSame(200, $response->get_status());
        $this->assertSame('private, no-store', $response->get_headers()['Cache-Control']);
        $this->assertSame('private-vapid-key', $response->get_data()['privateKey']);

        putenv('PLATFORM_SUBMISSIONS_SECRET=' . ($previous_secret ?: ''));
    }

    public function test_registers_post_types_and_canonical_location_taxonomy() {
        do_action('init');
        $this->assertTrue(post_type_exists('classified_ad'));
        $this->assertTrue(post_type_exists('job_offer'));
        $this->assertTrue(post_type_exists('tender_notice'));
        $this->assertTrue(taxonomy_exists('listing_location'));
        $this->assertTrue(is_object_in_taxonomy('classified_ad', 'listing_location'));
        $this->assertTrue(is_object_in_taxonomy('job_offer', 'listing_location'));
        $this->assertTrue(is_object_in_taxonomy('tender_notice', 'listing_location'));
    }

    public function test_public_featured_listings_only_return_active_boosts() {
        do_action('init');
        $boosted_id = self::factory()->post->create(array(
            'post_type' => 'classified_ad',
            'post_status' => 'publish',
        ));
        self::factory()->post->create(array(
            'post_type' => 'classified_ad',
            'post_status' => 'publish',
        ));
        update_post_meta($boosted_id, 'boost_expires_at_ts', (string) (time() + DAY_IN_SECONDS));

        $result = platform_submissions_get_public_items('classified', array(
            'page' => 1,
            'perPage' => 24,
            'featured' => true,
        ));

        $this->assertSame(array((string) $boosted_id), array_values(array_map(function ($item) {
            return (string) ($item['id'] ?? '');
        }, $result['items'])));
    }

    public function test_internal_routes_reject_requests_without_a_secret() {
        putenv('PLATFORM_SUBMISSIONS_SECRET=test-shared-secret');
        do_action('rest_api_init');
        $response = rest_get_server()->dispatch(new WP_REST_Request('POST', '/2424/v1/submissions/classified'));
        $this->assertSame(403, $response->get_status());
    }

    public function test_submission_revalidation_is_deferred_only_during_the_submission() {
        $post_id = self::factory()->post->create(array('post_status' => 'draft'));
        $post = get_post($post_id);
        $observed = array();

        platform_submissions_with_deferred_revalidation(function () use (&$observed, $post_id, $post) {
            $observed['post'] = apply_filters('next_revalidate_defer_post_payload', false, $post_id, $post, false);
            $observed['otherPost'] = apply_filters('next_revalidate_defer_post_payload', false, $post_id + 1, $post, false);
            $observed['taxonomy'] = apply_filters('next_revalidate_defer_taxonomy_payload', false, 'listing_location', 'term.created', array('classified'));
            $observed['profile'] = apply_filters('next_revalidate_defer_profile_payload', false, 1, null, null);
        }, array($post_id), true);

        $this->assertTrue($observed['post']);
        $this->assertFalse($observed['otherPost']);
        $this->assertTrue($observed['taxonomy']);
        $this->assertTrue($observed['profile']);
        $this->assertFalse(apply_filters('next_revalidate_defer_post_payload', false, $post_id, $post, false));
        $this->assertFalse(apply_filters('next_revalidate_defer_profile_payload', false, 1, null, null));
    }

    public function test_revalidation_skips_non_public_drafts() {
        $draft_id = self::factory()->post->create(array('post_status' => 'draft'));
        $published_id = self::factory()->post->create(array('post_status' => 'publish'));

        $this->assertTrue(next_revalidate_should_skip_post($draft_id, get_post($draft_id)));
        $this->assertFalse(next_revalidate_should_skip_post($published_id, get_post($published_id)));
    }

    public function test_classified_finalization_status_is_exposed_to_its_owner() {
        do_action('init');
        $user_id = self::factory()->user->create();
        $listing_id = self::factory()->post->create(array(
            'post_type' => 'classified_ad',
            'post_status' => 'draft',
            'post_author' => $user_id,
        ));
        update_post_meta($listing_id, '_platform_submission_finalization_status', 'processing');

        $status = platform_submissions_get_classified_finalization_status(array(
            'wpUserId' => $user_id,
            'listingId' => $listing_id,
        ));

        $this->assertIsArray($status);
        $this->assertSame('processing', $status['finalizationStatus']);

        $items = platform_submissions_get_user_items('classified', array('wpUserId' => $user_id));
        $this->assertSame('processing', $items['items'][0]['finalizationStatus']);
        $this->assertStringContainsString('Preparation en cours', $items['items'][0]['meta']);
    }

    public function test_classified_payment_is_blocked_until_finalization_is_ready() {
        do_action('init');
        $user_id = self::factory()->user->create();
        $listing_id = self::factory()->post->create(array(
            'post_type' => 'classified_ad',
            'post_status' => 'draft',
            'post_author' => $user_id,
        ));
        update_post_meta($listing_id, '_platform_submission_finalization_status', 'processing');

        $result = platform_submissions_get_listing_payable_quote(array(
            'wpUserId' => $user_id,
            'listingId' => $listing_id,
            'action' => 'post',
        ));

        $this->assertWPError($result);
        $this->assertSame('platform_submissions_listing_finalizing', $result->get_error_code());
    }

    public function test_cloudfront_media_url_is_classified_as_a_managed_s3_key() {
        update_option('platform_2424_media_public_base_url', 'https://cdn.example.test');

        $descriptor = platform_submissions_get_media_descriptor('https://cdn.example.test/uploads/2026-10-04/photo.webp?width=1200');

        $this->assertSame('s3', $descriptor['provider']);
        $this->assertSame('uploads/2026-10-04/photo.webp', $descriptor['key']);
        $this->assertSame('', platform_submissions_get_s3_key_from_media_url('https://other.example.test/uploads/photo.webp'));
        $this->assertSame('', platform_submissions_get_s3_key_from_media_url('https://cdn.example.test/private/photo.webp'));
        delete_option('platform_2424_media_public_base_url');
    }

    public function test_deleting_a_pending_classified_cancels_its_media_finalization() {
        do_action('init');
        update_option('platform_2424_media_public_base_url', 'https://cdn.example.test');
        $listing_id = self::factory()->post->create(array(
            'post_type' => 'classified_ad',
            'post_status' => 'draft',
        ));
        update_post_meta($listing_id, '_platform_submission_finalization_payload', array(
            'featuredImageUrl' => 'https://cdn.example.test/uploads/2026-10-04/photo.webp',
            'galleryImageUrls' => array('https://cdn.example.test/uploads/2026-10-04/gallery.webp'),
        ));

        $cancelled = platform_submissions_cancel_classified_finalization($listing_id);

        $this->assertTrue($cancelled);
        $this->assertSame('cancelled', get_post_meta($listing_id, '_platform_submission_finalization_status', true));
        $this->assertSame('', get_post_meta($listing_id, '_platform_submission_finalization_payload', true));
        delete_option('platform_2424_media_public_base_url');
    }

    public function test_user_rating_is_unique_per_advertiser_across_listings() {
        do_action('init');
        $seller_user_id = self::factory()->user->create();
        $rater_user_id = self::factory()->user->create();

        $first_rating = platform_submissions_upsert_user_rating(array(
            'sellerUserId' => $seller_user_id,
            'raterUserId' => $rater_user_id,
            'listingId' => 101,
            'score' => 4,
            'threadKey' => 'classified:101:test',
        ));
        $this->assertIsArray($first_rating);

        $existing_rating = platform_submissions_get_existing_user_rating($seller_user_id, $rater_user_id, 202);
        $this->assertSame((int) $first_rating['ratingId'], (int) $existing_rating['ratingId']);
        $this->assertSame(4, (int) $existing_rating['score']);
        $this->assertSame(101, (int) $existing_rating['listingId']);

        $duplicate_rating = platform_submissions_upsert_user_rating(array(
            'sellerUserId' => $seller_user_id,
            'raterUserId' => $rater_user_id,
            'listingId' => 202,
            'score' => 5,
            'threadKey' => 'job:202:test',
        ));
        $this->assertWPError($duplicate_rating);
        $this->assertSame('platform_submissions_rating_exists', $duplicate_rating->get_error_code());
    }

    public function test_rating_scope_migration_keeps_the_first_rating_and_archives_duplicates() {
        do_action('init');
        delete_option('platform_submissions_user_rating_scope_v1');
        $seller_user_id = self::factory()->user->create();
        $rater_user_id = self::factory()->user->create();
        $first_rating_id = self::factory()->post->create(array(
            'post_type' => 'platform_user_rating',
            'post_status' => 'publish',
            'post_date' => '2026-01-01 00:00:00',
        ));
        $duplicate_rating_id = self::factory()->post->create(array(
            'post_type' => 'platform_user_rating',
            'post_status' => 'publish',
            'post_date' => '2026-02-01 00:00:00',
        ));
        foreach (array($first_rating_id => 3, $duplicate_rating_id => 5) as $rating_id => $score) {
            update_post_meta($rating_id, 'seller_user_id', $seller_user_id);
            update_post_meta($rating_id, 'rater_user_id', $rater_user_id);
            update_post_meta($rating_id, 'listing_id', $rating_id);
            update_post_meta($rating_id, 'score', $score);
        }

        $result = platform_submissions_migrate_user_ratings_to_seller_scope();

        $this->assertFalse($result['alreadyMigrated']);
        $this->assertSame('publish', get_post_status($first_rating_id));
        $this->assertSame('draft', get_post_status($duplicate_rating_id));
        $this->assertSame((string) $first_rating_id, get_post_meta($duplicate_rating_id, 'superseded_by_rating_id', true));
        $this->assertSame(3.0, (float) get_user_meta($seller_user_id, 'rating_average', true));
        $this->assertSame(1, (int) get_user_meta($seller_user_id, 'rating_count', true));
    }

    public function test_disabling_logs_keeps_the_selected_level() {
        update_option('platform_2424_logs_enabled', 'no', false);
        update_option('platform_2424_log_level', 'debug', false);
        delete_option(PLATFORM_2424_LOG_OPTION);
        platform_2424_log('error', 'This event must not be stored.');
        $this->assertSame('debug', get_option('platform_2424_log_level'));
        $this->assertSame(false, get_option(PLATFORM_2424_LOG_OPTION, false));
    }

    public function test_papi_webhook_signature_requires_the_fresh_raw_payload() {
        update_option('platform_2424_papi_webhook_secret', 'test-papi-signing-secret', false);
        $raw_body = '{"paymentStatus":"SUCCESS","merchantPaymentReference":"2424-123"}';
        $timestamp = (string) time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $raw_body, 'test-papi-signing-secret');

        $this->assertTrue(platform_2424_papi_verify_signature($raw_body, 't=' . $timestamp . ',v1=' . $signature));
        $this->assertFalse(platform_2424_papi_verify_signature($raw_body . ' ', 't=' . $timestamp . ',v1=' . $signature));
        $this->assertFalse(platform_2424_papi_verify_signature($raw_body, 't=' . (time() - 301) . ',v1=' . $signature));
    }

    public function test_papi_checkout_is_blocked_before_order_creation_when_configuration_is_incomplete() {
        update_option('platform_2424_papi_enabled', 'no', false);
        delete_option('platform_2424_papi_api_key');
        delete_option('platform_2424_papi_webhook_secret');

        $result = platform_2424_papi_start_payment(array(
            'wpUserId' => self::factory()->user->create(),
            'flow' => 'subscription',
            'planId' => 'essentiel',
        ));

        $this->assertWPError($result);
        $this->assertSame('platform_papi_not_configured', $result->get_error_code());
        $configuration = platform_2424_papi_configuration_status();
        $this->assertFalse($configuration['ready']);
        $this->assertContains('activation', $configuration['missing']);
        $this->assertContains('api_key', $configuration['missing']);
        $this->assertContains('webhook_secret', $configuration['missing']);
    }

    public function test_papi_payment_descriptions_use_the_business_flow() {
        $subscription_order = new class {
            public function get_meta($key) {
                $meta = array(
                    '_platform_papi_flow' => 'subscription',
                    '_platform_papi_planId' => 'essentiel',
                    '_platform_papi_billingPeriod' => 'monthly',
                );
                return $meta[$key] ?? '';
            }
        };
        $boost_order = new class {
            public function get_meta($key) {
                $meta = array(
                    '_platform_papi_flow' => 'listing',
                    '_platform_papi_pricingCode' => 'classified_boost_7d',
                    '_platform_papi_action' => 'boost',
                );
                return $meta[$key] ?? '';
            }
        };

        $this->assertSame('Abonnement Essentiel mensuel', platform_2424_papi_order_description($subscription_order));
        $this->assertSame('Boost 7 jours - Petites annonces', platform_2424_papi_order_description($boost_order));
        $this->assertSame('Publication 30 jours - Offres d’emploi', platform_2424_papi_order_description(new class {
            public function get_meta($key) {
                $meta = array(
                    '_platform_papi_flow' => 'listing',
                    '_platform_papi_pricingCode' => 'job_post_30d',
                    '_platform_papi_action' => 'post',
                );
                return $meta[$key] ?? '';
            }
        }));
        $this->assertSame('Boost 7 jours - Appels d’offres', platform_2424_papi_order_description(new class {
            public function get_meta($key) {
                $meta = array(
                    '_platform_papi_flow' => 'listing',
                    '_platform_papi_pricingCode' => 'tender_boost_7d',
                    '_platform_papi_action' => 'boost',
                );
                return $meta[$key] ?? '';
            }
        }));
    }

    public function test_woocommerce_customer_subjects_use_the_2424_brand() {
        $order = new class {
            public function get_order_number() {
                return '124487';
            }
        };

        $this->assertSame(
            'Votre paiement 2424.mg est confirmé — Commande #124487',
            platform_2424_get_customer_woocommerce_subject('customer_completed_order', $order)
        );
        $this->assertSame(
            'Votre commande 2424.mg est en attente de paiement — Commande #124487',
            platform_2424_get_customer_woocommerce_subject('customer_on_hold_order', $order)
        );
        $this->assertSame(
            'Votre paiement 2424.mg n\'a pas abouti — Commande #124487',
            platform_2424_get_customer_woocommerce_subject('customer_failed_order', $order)
        );
        $this->assertSame(
            'Votre remboursement 2424.mg est confirmé — Commande #124487',
            platform_2424_get_customer_woocommerce_subject('customer_refunded_order', $order)
        );
        $this->assertSame(
            'Nouvelle information concernant votre commande 2424.mg — Commande #124487',
            platform_2424_get_customer_woocommerce_subject('customer_note', $order)
        );
    }

    public function test_woocommerce_listing_items_use_a_client_friendly_pricing_label() {
        $product = new class {
            public function get_sku() {
                return 'classified_boost_7d';
            }
        };
        $item = new class($product) {
            private $product;

            public function __construct($product) {
                $this->product = $product;
            }

            public function get_product() {
                return $this->product;
            }
        };

        $this->assertSame('Boost 7 jours — Petites annonces', platform_submissions_get_pricing_display_label('classified_boost_7d'));
        $this->assertSame('Publication 30 jours — Offres d\'emploi', platform_submissions_get_pricing_display_label('job_post_30d'));
        $this->assertSame(
            'Boost 7 jours — Petites annonces',
            platform_2424_filter_woocommerce_listing_order_item_name('classified_boost_7d', $item, true)
        );

        $new_item = new class($product) {
            public $name = 'classified_boost_7d';
            private $product;

            public function __construct($product) {
                $this->product = $product;
            }

            public function get_product() {
                return $this->product;
            }

            public function set_name($name) {
                $this->name = $name;
            }

            public function save() {
            }
        };
        platform_2424_set_woocommerce_listing_order_item_name(1, $new_item, 1);
        $this->assertSame('Boost 7 jours — Petites annonces', $new_item->name);
    }

    public function test_email_logo_url_defaults_to_the_public_png_and_can_be_configured() {
        update_option('platform_2424_public_site_url', 'https://example.test');
        delete_option('platform_2424_email_logo_url');
        $this->assertSame('https://example.test/email-logo.png', platform_2424_get_email_logo_url());

        update_option('platform_2424_email_logo_url', 'https://cdn.example.test/brand.png');
        $this->assertSame('https://cdn.example.test/brand.png', platform_2424_get_email_logo_url());

        delete_option('platform_2424_email_logo_url');
        delete_option('platform_2424_public_site_url');
    }

    public function test_papi_link_helpers_preserve_safe_amount_statuses_and_descriptions() {
        $this->assertSame(400, platform_2424_papi_link_error_status(400));
        $this->assertSame(409, platform_2424_papi_link_error_status(409));
        $this->assertSame(422, platform_2424_papi_link_error_status(422));
        $this->assertSame(502, platform_2424_papi_link_error_status(500));
        $this->assertSame('Boost 7 jours - Petites annonces', platform_2424_papi_sanitize_description('  Boost 7 jours - Petites annonces  '));
        $this->assertSame(255, strlen(platform_2424_papi_sanitize_description(str_repeat('a', 300))));
    }

    public function test_wordpress_editorial_articles_never_receive_listing_expiration() {
        $post_id = self::factory()->post->create(array(
            'post_status' => 'draft',
            'post_date_gmt' => '2026-01-01 00:00:00',
        ));
        $post = get_post($post_id);

        platform_submissions_assign_expiration_on_publish('publish', 'draft', $post);

        $this->assertFalse(platform_submissions_post_uses_listing_expiration($post));
        $this->assertSame(0, platform_submissions_resolve_listing_expires_ts($post_id));
        $this->assertSame('', get_post_meta($post_id, 'listing_expires_at', true));
        $this->assertSame('', get_post_meta($post_id, 'listing_expires_at_ts', true));
    }

    public function test_platform_submitted_articles_keep_their_listing_duration() {
        $post_id = self::factory()->post->create(array('post_status' => 'publish'));
        update_post_meta($post_id, 'submission_source', 'next-frontend');
        update_post_meta($post_id, 'listing_expires_at_ts', (string) (time() + DAY_IN_SECONDS));

        $this->assertTrue(platform_submissions_post_uses_listing_expiration($post_id));
        $this->assertGreaterThan(time(), platform_submissions_resolve_listing_expires_ts($post_id));
    }
}
