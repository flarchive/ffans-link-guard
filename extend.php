<?php

/*
 * This file is part of ffans/link-guard.
 *
 * Copyright (c) 2026 .
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace FFans\LinkGuard;

use Flarum\Extend;

return [
    // Assets
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/less/forum.less'),
    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js'),
    new Extend\Locales(__DIR__ . '/locale'),

    // Settings
    (new Extend\Settings())
        ->default('ffans-link-guard.warning_title', '')
        ->default('ffans-link-guard.warning_message', '')
        ->default('ffans-link-guard.trusted_domains', '')
        ->default('ffans-link-guard.use_modal', false)
        ->serializeToForum('linkGuardWarningTitle', 'ffans-link-guard.warning_title')
        ->serializeToForum('linkGuardWarningMessage', 'ffans-link-guard.warning_message')
        ->serializeToForum('linkGuardTrustedDomains', 'ffans-link-guard.trusted_domains')
        ->serializeToForum('linkGuardUseModal', 'ffans-link-guard.use_modal', 'boolval'),

    // Routes
    (new Extend\Frontend('forum'))
        ->route('/link-guard', 'ffansLinkGuard'),
];
