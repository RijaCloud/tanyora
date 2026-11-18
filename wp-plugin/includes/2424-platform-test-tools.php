<?php
/** Staging-only stress-test campaigns. Never enable this tool on production. */
if (!defined('ABSPATH')) { exit; }

if (!function_exists('platform_2424_stress_test_is_staging')) {
    function platform_2424_stress_test_is_staging() {
        return function_exists('platform_billing_is_staging_site') && platform_billing_is_staging_site();
    }
}

if (!function_exists('platform_2424_stress_test_is_enabled')) {
    function platform_2424_stress_test_is_enabled() {
        return platform_2424_stress_test_is_staging()
            && (string) get_option('platform_2424_stress_test_enabled', 'no') === 'yes';
    }
}

if (!function_exists('platform_2424_stress_test_sanitize_enabled')) {
    function platform_2424_stress_test_sanitize_enabled($value) {
        return $value === 'yes' && platform_2424_stress_test_is_staging() ? 'yes' : 'no';
    }
}

if (!function_exists('platform_2424_stress_test_campaign_option')) {
    function platform_2424_stress_test_campaign_option() { return 'platform_2424_stress_test_campaign'; }
}

if (!function_exists('platform_2424_stress_test_get_campaign')) {
    function platform_2424_stress_test_get_campaign() {
        $campaign = get_option(platform_2424_stress_test_campaign_option(), array());
        return is_array($campaign) ? $campaign : array();
    }
}

if (!function_exists('platform_2424_stress_test_update_campaign')) {
    function platform_2424_stress_test_update_campaign($campaign) {
        update_option(platform_2424_stress_test_campaign_option(), is_array($campaign) ? $campaign : array(), false);
    }
}

if (!function_exists('platform_2424_stress_test_schedule')) {
    function platform_2424_stress_test_schedule($hook, $args, $force = false) {
        $group = '2424-stress-test';
        // A batch schedules its successor while it is still running. It must not
        // be rejected as a duplicate of the currently executing action.
        if (function_exists('as_schedule_single_action')) {
            if (!$force && function_exists('as_has_scheduled_action') && as_has_scheduled_action($hook, $args, $group)) {
                return false;
            }
            return as_schedule_single_action(time() + 1, $hook, $args, $group, false);
        }
        if (!$force && wp_next_scheduled($hook, $args)) { return false; }
        return wp_schedule_single_event(time() + 1, $hook, $args);
    }
}

if (!function_exists('platform_2424_stress_test_update_progress')) {
    function platform_2424_stress_test_update_progress($campaign_id, $content_created, $updates = array()) {
        $campaign = platform_2424_stress_test_get_campaign();
        if ((string) ($campaign['id'] ?? '') !== (string) $campaign_id) { return; }
        $campaign['contentCreated'] = max(absint($campaign['contentCreated'] ?? 0), absint($content_created));
        $campaign['lastProgressAt'] = gmdate('c');
        foreach ((array) $updates as $key => $value) { $campaign[$key] = $value; }
        platform_2424_stress_test_update_campaign($campaign);
    }
}

if (!function_exists('platform_2424_stress_test_resume_generation')) {
    function platform_2424_stress_test_resume_generation($campaign_id) {
        $campaign = platform_2424_stress_test_get_campaign();
        if (!platform_2424_stress_test_is_enabled() || (string) ($campaign['id'] ?? '') !== (string) $campaign_id || ($campaign['status'] ?? '') !== 'generating') {
            return false;
        }
        $campaign['lastResumeAt'] = gmdate('c');
        platform_2424_stress_test_update_campaign($campaign);
        return platform_2424_stress_test_schedule('platform_2424_stress_test_generate_batch', array($campaign_id));
    }
}

if (!function_exists('platform_2424_stress_test_mark_post')) {
    function platform_2424_stress_test_mark_post($post_id, $campaign_id) {
        update_post_meta($post_id, 'platform_2424_test_data', '1');
        update_post_meta($post_id, 'platform_2424_stress_campaign', $campaign_id);
    }
}

if (!function_exists('platform_2424_stress_test_create_users')) {
    function platform_2424_stress_test_create_users($campaign_id) {
        $plans = array_merge(array_fill(0, 60, 'free'), array_fill(0, 25, 'essentiel'), array_fill(0, 15, 'business'));
        $user_ids = array();
        foreach ($plans as $index => $plan) {
            $email = sprintf('stress-%s-%03d@2424.test', $campaign_id, $index + 1);
            $existing = get_user_by('email', $email);
            $user_id = $existing ? (int) $existing->ID : wp_insert_user(array(
                'user_login' => sprintf('stress_%s_%03d', substr($campaign_id, 0, 8), $index + 1),
                'user_email' => $email,
                'user_pass' => wp_generate_password(32, true, true),
                'role' => 'subscriber',
                'display_name' => sprintf('Utilisateur recette %03d', $index + 1),
            ));
            if (!is_wp_error($user_id) && $user_id) {
                update_user_meta($user_id, 'platform_2424_test_data', '1');
                update_user_meta($user_id, 'platform_2424_stress_campaign', $campaign_id);
                update_user_meta($user_id, 'platform_plan_id', $plan);
                update_user_meta($user_id, 'platform_email_verified', '1');
                update_user_meta($user_id, 'platform_onboarding_completed', '1');
                $user_ids[] = (int) $user_id;
            }
        }
        return $user_ids;
    }
}

if (!function_exists('platform_2424_stress_test_terms')) {
    function platform_2424_stress_test_terms($taxonomy) {
        $terms = get_terms(array('taxonomy' => $taxonomy, 'hide_empty' => false, 'number' => 0));
        return is_wp_error($terms) || !is_array($terms) ? array() : array_values($terms);
    }
}

if (!function_exists('platform_2424_stress_test_create_content')) {
    function platform_2424_stress_test_create_content($campaign, $offset, $limit) {
        $campaign_id = (string) ($campaign['id'] ?? '');
        $users = array_map('absint', (array) ($campaign['userIds'] ?? array()));
        if ($campaign_id === '' || !$users) { return 0; }
        $definitions = array(
            array('count' => 390, 'postType' => 'classified_ad', 'taxonomy' => 'classified_category', 'label' => 'Annonce'),
            array('count' => 180, 'postType' => 'job_offer', 'taxonomy' => 'job_category', 'label' => 'Offre emploi'),
            array('count' => 180, 'postType' => 'tender_notice', 'taxonomy' => 'tender_category', 'label' => 'Appel offre'),
            array('count' => 250, 'postType' => 'annuaire', 'taxonomy' => 'directory_category', 'label' => 'Entreprise'),
        );
        $created = 0;
        $locations = platform_2424_stress_test_terms('listing_location');
        $directory_locations = platform_2424_stress_test_terms('directory_location');
        foreach ($definitions as &$definition) {
            $definition['terms'] = platform_2424_stress_test_terms($definition['taxonomy']);
        }
        unset($definition);
        for ($position = $offset; $position < min(1000, $offset + $limit); $position++) {
            $cursor = $position;
            $definition = null;
            foreach ($definitions as $candidate) {
                if ($cursor < $candidate['count']) { $definition = $candidate; break; }
                $cursor -= $candidate['count'];
            }
            if (!$definition) { continue; }
            $author_id = $users[$position % count($users)];
            $post_id = wp_insert_post(array(
                'post_type' => $definition['postType'],
                'post_status' => 'publish',
                'post_author' => $author_id,
                'post_title' => sprintf('%s de recette %04d', $definition['label'], $position + 1),
                'post_content' => 'Contenu de charge genere pour verifier les listes, filtres, recherches et fiches de la plateforme 2424.',
                'post_excerpt' => 'Contenu de recette pour le stress test staging.',
            ), true);
            if (is_wp_error($post_id) || !$post_id) { continue; }
            platform_2424_stress_test_mark_post((int) $post_id, $campaign_id);
            update_post_meta($post_id, 'price', (string) (50000 + (($position % 40) * 25000)));
            update_post_meta($post_id, 'currency', 'MGA');
            update_post_meta($post_id, 'platform_submission_source', 'stress_test');
            $terms = $definition['terms'];
            if ($terms) { wp_set_object_terms($post_id, array((int) $terms[$cursor % count($terms)]->term_id), $definition['taxonomy'], false); }
            if ($definition['postType'] === 'annuaire') {
                if ($directory_locations) { wp_set_object_terms($post_id, array((int) $directory_locations[$position % count($directory_locations)]->term_id), 'directory_location', false); }
            } elseif ($locations) {
                wp_set_object_terms($post_id, array((int) $locations[$position % count($locations)]->term_id), 'listing_location', false);
            }
            $created++;
            // Persist meaningful checkpoints so the admin screen can report
            // real progress even while a long Action Scheduler request runs.
            if ($created % 10 === 0) {
                platform_2424_stress_test_update_progress($campaign_id, $offset + $created, array('phase' => 'creation_contenus'));
            }
        }
        return $created;
    }
}

if (!function_exists('platform_2424_stress_test_call_next')) {
    function platform_2424_stress_test_bridge_url() {
        if (function_exists('platform_2424_get_public_site_url')) {
            return untrailingslashit((string) platform_2424_get_public_site_url());
        }

        return untrailingslashit((string) get_option('platform_2424_public_site_url', ''));
    }

    function platform_2424_stress_test_bridge_secret() {
        // Keep the stress-test bridge on the same runtime secret as every
        // other WordPress-to-Next internal request. Reading the saved option
        // directly can use an obsolete value after a server-side rotation.
        if (function_exists('platform_submissions_secret')) {
            return trim((string) platform_submissions_secret());
        }

        return trim((string) get_option('platform_2424_submissions_secret', ''));
    }

    function platform_2424_stress_test_bridge_status() {
        $site = platform_2424_stress_test_bridge_url();
        $host = strtolower((string) (wp_parse_url($site, PHP_URL_HOST) ?: ''));
        return array(
            'urlConfigured' => $site !== '',
            'secretConfigured' => platform_2424_stress_test_bridge_secret() !== '',
            'host' => $host,
            'hostAllowed' => in_array($host, array('staging.2424.mg', '2424.winfordcap.com', 'localhost', '127.0.0.1'), true),
        );
    }

    function platform_2424_stress_test_call_next($path, $payload) {
        $site = platform_2424_stress_test_bridge_url();
        $secret = platform_2424_stress_test_bridge_secret();
        if ($site === '' || $secret === '') { return new WP_Error('stress_test_next_not_configured', 'Le pont interne Next n est pas configure.'); }
        $response = wp_remote_post($site . $path, array('timeout' => 30, 'headers' => array('Content-Type' => 'application/json', 'x-2424-internal-secret' => $secret), 'body' => wp_json_encode($payload)));
        if (is_wp_error($response)) { return $response; }
        $code = (int) wp_remote_retrieve_response_code($response);
        $body = json_decode((string) wp_remote_retrieve_body($response), true);
        if ($code >= 200 && $code < 300 && is_array($body)) { return $body; }
        // Surface a safe diagnostic in the staging-only UI. Never include the
        // secret, request body, or raw server response.
        $remote_code = is_array($body) ? sanitize_key((string) ($body['code'] ?? $body['error'] ?? 'unknown')) : 'invalid_response';
        return new WP_Error('stress_test_next_failed', sprintf('Le pont interne Next a refuse la campagne (HTTP %d, %s).', $code, $remote_code));
    }
}

if (!function_exists('platform_2424_stress_test_generate_batch')) {
    function platform_2424_stress_test_generate_batch($campaign_id) {
        $campaign = platform_2424_stress_test_get_campaign();
        if (!platform_2424_stress_test_is_enabled() || (string) ($campaign['id'] ?? '') !== (string) $campaign_id || ($campaign['status'] ?? '') !== 'generating') { return; }
        $offset = absint($campaign['contentCreated'] ?? 0);
        platform_2424_stress_test_update_progress($campaign_id, $offset, array('phase' => 'creation_contenus', 'batchStartedAt' => gmdate('c')));
        $created = platform_2424_stress_test_create_content($campaign, $offset, 50);
        $campaign = platform_2424_stress_test_get_campaign();
        $campaign['contentCreated'] = max($offset + $created, absint($campaign['contentCreated'] ?? 0));
        if ($campaign['contentCreated'] < 1000 && $created > 0) {
            $campaign['phase'] = 'creation_contenus';
            platform_2424_stress_test_update_campaign($campaign);
            platform_2424_stress_test_schedule('platform_2424_stress_test_generate_batch', array($campaign_id), true);
            return;
        }
        if ($campaign['contentCreated'] < 1000) {
            $campaign['status'] = 'failed';
            $campaign['phase'] = 'erreur_creation';
            $campaign['error'] = 'Le dernier lot n a cree aucun contenu. Utilisez Reprendre apres avoir verifie les journaux.';
            $campaign['failedAt'] = gmdate('c');
            platform_2424_stress_test_update_campaign($campaign);
            return;
        }
        $campaign['phase'] = 'creation_interactions';
        platform_2424_stress_test_update_campaign($campaign);
        $listings = get_posts(array(
            'post_type' => array('classified_ad', 'job_offer', 'tender_notice'),
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'meta_key' => 'platform_2424_stress_campaign',
            'meta_value' => $campaign_id,
            'no_found_rows' => true,
        ));
        $campaign['listingIds'] = array_map(function ($post) {
            $kind = $post->post_type === 'job_offer' ? 'job' : ($post->post_type === 'tender_notice' ? 'tender' : 'classified');
            return array('id' => absint($post->ID), 'kind' => $kind, 'title' => (string) $post->post_title);
        }, $listings);
        $result = platform_2424_stress_test_call_next('/api/internal/stress-test/campaign', array('action' => 'seed', 'campaignId' => $campaign_id, 'users' => $campaign['users'] ?? array(), 'listings' => $campaign['listingIds'] ?? array()));
        $campaign['next'] = is_wp_error($result) ? array('error' => $result->get_error_message()) : $result;
        $campaign['status'] = is_wp_error($result) ? 'partial' : 'ready';
        $campaign['phase'] = is_wp_error($result) ? 'interactions_incompletes' : 'termine';
        $campaign['completedAt'] = gmdate('c');
        platform_2424_stress_test_update_campaign($campaign);
    }
}
add_action('platform_2424_stress_test_generate_batch', 'platform_2424_stress_test_generate_batch');

if (!function_exists('platform_2424_stress_test_delete_campaign')) {
    function platform_2424_stress_test_delete_campaign($campaign_id, $dry_run = false) {
        $campaign = platform_2424_stress_test_get_campaign();
        if ((string) ($campaign['id'] ?? '') !== (string) $campaign_id) { return new WP_Error('stress_test_campaign_missing', 'Campagne introuvable.'); }
        $post_ids = get_posts(array('post_type' => array('classified_ad', 'job_offer', 'tender_notice', 'annuaire'), 'post_status' => 'any', 'posts_per_page' => -1, 'fields' => 'ids', 'meta_key' => 'platform_2424_stress_campaign', 'meta_value' => $campaign_id, 'no_found_rows' => true));
        $user_query = new WP_User_Query(array('fields' => 'ID', 'number' => -1, 'meta_key' => 'platform_2424_stress_campaign', 'meta_value' => $campaign_id));
        if (!$dry_run) {
            foreach ((array) $post_ids as $post_id) { wp_delete_post((int) $post_id, true); }
            if (!function_exists('wp_delete_user')) { require_once ABSPATH . 'wp-admin/includes/user.php'; }
            foreach ((array) $user_query->get_results() as $user_id) { wp_delete_user((int) $user_id); }
            $next = platform_2424_stress_test_call_next('/api/internal/stress-test/campaign', array('action' => 'cleanup', 'campaignId' => $campaign_id, 'users' => $campaign['users'] ?? array()));
            $campaign['next'] = is_wp_error($next) ? array('error' => $next->get_error_message()) : $next;
            $campaign['status'] = 'deleted';
            $campaign['deletedAt'] = gmdate('c');
            platform_2424_stress_test_update_campaign($campaign);
        }
        return array('posts' => count((array) $post_ids), 'users' => count((array) $user_query->get_results()));
    }
}

if (!function_exists('platform_2424_stress_test_render_tab')) {
    function platform_2424_stress_test_render_tab() {
        $campaign = platform_2424_stress_test_get_campaign();
        $enabled = platform_2424_stress_test_is_enabled();
        ?>
        <div class="platform-2424-tab-content">
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="platform-2424-card">
                <input type="hidden" name="action" value="platform_2424_stress_test_toggle" />
                <?php wp_nonce_field('platform_2424_stress_test'); ?>
                <h3>Acces de test staging</h3>
                <p class="description">Ce reglage est isole de la configuration generale. Il ne modifie jamais les secrets, paiements ou integrations.</p>
                <label><input type="hidden" name="platform_2424_stress_test_enabled" value="no" /><input type="checkbox" name="platform_2424_stress_test_enabled" value="yes" <?php checked($enabled); ?> /> Autoriser les campagnes de stress test sur cet environnement</label>
                <?php submit_button('Enregistrer', 'secondary', 'submit', false); ?>
            </form>
            <?php if (!$enabled) : ?><div class="notice notice-warning inline"><p>Activez l option ci-dessus sur staging pour utiliser cet outil.</p></div><?php return; endif; ?>
            <div class="platform-2424-card" id="platform-2424-stress-test-campaign" data-status-url="<?php echo esc_url(admin_url('admin-ajax.php')); ?>" data-nonce="<?php echo esc_attr(wp_create_nonce('platform_2424_stress_test_status')); ?>">
                <h3>Campagne de charge</h3>
                <p>100 utilisateurs, 1 000 contenus, 600 conversations, 1 800 messages, 300 favoris et 400 notifications internes.</p>
                <div class="platform-2424-stress-progress" <?php echo empty($campaign['id']) ? 'hidden' : ''; ?>>
                    <p><strong>Etat :</strong> <span data-stress-status><?php echo esc_html((string) ($campaign['status'] ?? 'Aucune campagne')); ?></span> · <span data-stress-phase><?php echo esc_html((string) ($campaign['phase'] ?? '')); ?></span></p>
                    <div style="max-width:680px;height:18px;background:#e5e5e5;border-radius:9px;overflow:hidden;"><span data-stress-bar style="display:block;height:100%;width:<?php echo esc_attr(min(100, absint($campaign['contentCreated'] ?? 0) / 10)); ?>%;background:#2271b1;transition:width .35s ease;"></span></div>
                    <p><strong data-stress-count><?php echo esc_html((string) ($campaign['contentCreated'] ?? 0)); ?>/1000 contenus</strong> <span data-stress-updated><?php echo !empty($campaign['lastProgressAt']) ? '· Derniere activite : ' . esc_html($campaign['lastProgressAt']) : ''; ?></span></p>
                    <p class="description" data-stress-message><?php echo esc_html((string) ($campaign['error'] ?? 'La progression est enregistree automatiquement. Vous pouvez recharger cette page sans perdre la campagne.')); ?></p>
                </div>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline-block;margin-right:8px;"><input type="hidden" name="action" value="platform_2424_stress_test_start" /><?php wp_nonce_field('platform_2424_stress_test'); ?><button class="button button-primary" <?php disabled(in_array(($campaign['status'] ?? ''), array('generating', 'ready'), true)); ?>>Generer la campagne</button></form>
                <?php if (!empty($campaign['id']) && in_array(($campaign['status'] ?? ''), array('generating', 'failed', 'partial'), true)) : ?><form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline-block;margin-right:8px;"><input type="hidden" name="action" value="platform_2424_stress_test_resume" /><?php wp_nonce_field('platform_2424_stress_test'); ?><button class="button">Reprendre la generation</button></form><?php endif; ?>
                <?php if (!empty($campaign['id'])) : ?>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline-block;margin-right:8px;"><input type="hidden" name="action" value="platform_2424_stress_test_delete" /><input type="hidden" name="dry_run" value="1" /><?php wp_nonce_field('platform_2424_stress_test'); ?><button class="button">Simulation de suppression</button></form>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline-block;"><input type="hidden" name="action" value="platform_2424_stress_test_delete" /><?php wp_nonce_field('platform_2424_stress_test'); ?><button class="button button-link-delete">Supprimer la campagne</button></form>
                <?php endif; ?>
            </div>
            <?php if (function_exists('platform_2424_stress_mass_render_tab')) { platform_2424_stress_mass_render_tab(); } ?>
            <script>
            (function () {
                var card = document.getElementById('platform-2424-stress-test-campaign');
                if (!card) return;
                var refresh = function () {
                    var body = new URLSearchParams({ action: 'platform_2424_stress_test_status', nonce: card.dataset.nonce });
                    fetch(card.dataset.statusUrl, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
                        .then(function (response) { return response.json(); })
                        .then(function (response) {
                            if (!response.success || !response.data || !response.data.id) return;
                            var data = response.data;
                            card.querySelector('.platform-2424-stress-progress').hidden = false;
                            card.querySelector('[data-stress-status]').textContent = data.statusLabel;
                            card.querySelector('[data-stress-phase]').textContent = data.phaseLabel;
                            card.querySelector('[data-stress-count]').textContent = data.contentCreated + '/1000 contenus';
                            card.querySelector('[data-stress-bar]').style.width = data.progress + '%';
                            card.querySelector('[data-stress-updated]').textContent = data.lastProgressAt ? '· Derniere activite : ' + data.lastProgressAt : '';
                            card.querySelector('[data-stress-message]').textContent = data.message;
                            if (data.status === 'generating') window.setTimeout(refresh, 3000);
                        })
                        .catch(function () { window.setTimeout(refresh, 5000); });
                };
                if (card.querySelector('[data-stress-status]') && card.querySelector('[data-stress-status]').textContent === 'generating') refresh();
            }());
            </script>
        </div>
        <?php
    }
}

if (!function_exists('platform_2424_stress_test_admin_guard')) {
    function platform_2424_stress_test_admin_guard() {
        if (!current_user_can('manage_options')) { wp_die('Acces refuse.'); }
        check_admin_referer('platform_2424_stress_test');
        if (!platform_2424_stress_test_is_enabled()) { wp_die('Stress test indisponible hors staging ou desactive.'); }
    }
}

add_action('admin_post_platform_2424_stress_test_toggle', function () {
    if (!current_user_can('manage_options')) { wp_die('Acces refuse.'); }
    check_admin_referer('platform_2424_stress_test');
    if (!platform_2424_stress_test_is_staging()) { wp_die('Stress test indisponible hors staging.'); }
    update_option('platform_2424_stress_test_enabled', !empty($_POST['platform_2424_stress_test_enabled']) && $_POST['platform_2424_stress_test_enabled'] === 'yes' ? 'yes' : 'no', false);
    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=stress-test')); exit;
});

add_action('admin_post_platform_2424_stress_test_start', function () {
    platform_2424_stress_test_admin_guard();
    $current = platform_2424_stress_test_get_campaign();
    if (in_array(($current['status'] ?? ''), array('generating', 'ready'), true)) { wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=stress-test')); exit; }
    $campaign_id = wp_generate_uuid4();
    $user_ids = platform_2424_stress_test_create_users($campaign_id);
    $users = array();
    foreach ($user_ids as $user_id) { $user = get_user_by('id', $user_id); if ($user) { $users[] = array('id' => $user_id, 'email' => $user->user_email, 'name' => $user->display_name); } }
    $campaign = array('id' => $campaign_id, 'status' => 'generating', 'phase' => 'en_attente', 'createdAt' => gmdate('c'), 'lastProgressAt' => gmdate('c'), 'users' => $users, 'userIds' => $user_ids, 'contentCreated' => 0, 'listingIds' => array());
    platform_2424_stress_test_update_campaign($campaign);
    platform_2424_stress_test_schedule('platform_2424_stress_test_generate_batch', array($campaign_id));
    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=stress-test')); exit;
});

add_action('admin_post_platform_2424_stress_test_resume', function () {
    platform_2424_stress_test_admin_guard();
    $campaign = platform_2424_stress_test_get_campaign();
    if (($campaign['status'] ?? '') === 'failed') {
        $campaign['status'] = 'generating';
        unset($campaign['error'], $campaign['failedAt']);
        platform_2424_stress_test_update_campaign($campaign);
    }
    platform_2424_stress_test_resume_generation((string) ($campaign['id'] ?? ''));
    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=stress-test')); exit;
});

add_action('admin_post_platform_2424_stress_test_delete', function () {
    platform_2424_stress_test_admin_guard();
    $campaign = platform_2424_stress_test_get_campaign();
    platform_2424_stress_test_delete_campaign((string) ($campaign['id'] ?? ''), !empty($_POST['dry_run']));
    wp_safe_redirect(admin_url('options-general.php?page=platform-2424-settings&tab=stress-test')); exit;
});

add_action('wp_ajax_platform_2424_stress_test_status', function () {
    if (!current_user_can('manage_options') || !check_ajax_referer('platform_2424_stress_test_status', 'nonce', false) || !platform_2424_stress_test_is_enabled()) {
        wp_send_json_error(array('message' => 'Acces refuse.'), 403);
    }
    $campaign = platform_2424_stress_test_get_campaign();
    if (($campaign['status'] ?? '') === 'generating') {
        $last = !empty($campaign['lastProgressAt']) ? strtotime((string) $campaign['lastProgressAt']) : 0;
        if ($last && time() - $last > 20) { platform_2424_stress_test_resume_generation((string) ($campaign['id'] ?? '')); }
    }
    $phase_labels = array('en_attente' => 'En attente du premier lot', 'creation_contenus' => 'Creation des contenus', 'creation_interactions' => 'Creation des interactions', 'interactions_incompletes' => 'Interactions a reprendre', 'termine' => 'Termine', 'erreur_creation' => 'Arrete sur erreur');
    $status_labels = array('generating' => 'Generation en cours', 'ready' => 'Prete', 'partial' => 'Partielle', 'failed' => 'A reprendre', 'deleted' => 'Supprimee');
    $created = absint($campaign['contentCreated'] ?? 0);
    wp_send_json_success(array(
        'id' => (string) ($campaign['id'] ?? ''),
        'status' => (string) ($campaign['status'] ?? ''),
        'statusLabel' => $status_labels[$campaign['status'] ?? ''] ?? 'Aucune campagne',
        'phaseLabel' => $phase_labels[$campaign['phase'] ?? ''] ?? '',
        'contentCreated' => $created,
        'progress' => min(100, $created / 10),
        'lastProgressAt' => (string) ($campaign['lastProgressAt'] ?? ''),
        'message' => (string) ($campaign['error'] ?? 'La progression est enregistree automatiquement. Vous pouvez recharger cette page sans perdre la campagne.'),
    ));
});
