<?php

namespace FFans\LinkGuard\Tests\integration;

use Flarum\Locale\LocaleManager;
use Flarum\Testing\integration\TestCase;
use Illuminate\Support\Arr;
use Symfony\Component\Yaml\Yaml;

class LinkGuardTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->extension('ffans-link-guard');
        $this->prepareDatabase([
            'users' => [
                ['id' => 2, 'username' => 'member', 'email' => 'member@example.test', 'password' => password_hash('test-password', PASSWORD_BCRYPT), 'is_email_confirmed' => 1],
            ],
        ]);
    }

    public static function actors(): array
    {
        return ['guest' => [null], 'member' => [2], 'administrator' => [1]];
    }

    /** @dataProvider actors */
    public function test_warning_route_returns_forum_html_without_redirect(?int $actor): void
    {
        $response = $this->send($this->request('GET', '/link-guard', ['authenticatedAs' => $actor]));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertFalse($response->hasHeader('Location'));
        $this->assertStringContainsString('id="app"', (string) $response->getBody());
    }

    public function test_forum_exposes_only_the_default_link_guard_attributes(): void
    {
        $response = $this->send($this->request('GET', '/api'));
        $this->assertSame(200, $response->getStatusCode());
        $attributes = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR)['data']['attributes'];
        $linkGuard = array_filter($attributes, fn ($key) => str_starts_with($key, 'linkGuard'), ARRAY_FILTER_USE_KEY);

        $this->assertEquals([
            'linkGuardWarningTitle' => '',
            'linkGuardWarningMessage' => '',
            'linkGuardTrustedDomains' => '',
            'linkGuardUseModal' => false,
        ], $linkGuard);
    }

    public function test_custom_settings_are_serialized_without_interpretation(): void
    {
        $this->setting('ffans-link-guard.warning_title', '<b>自定义标题</b>');
        $this->setting('ffans-link-guard.warning_message', "第一行\n<script>alert(1)</script>");
        $this->setting('ffans-link-guard.trusted_domains', "github.com\n*.flarum.org");

        $response = $this->send($this->request('GET', '/api'));
        $this->assertSame(200, $response->getStatusCode());
        $attributes = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR)['data']['attributes'];
        $this->assertSame('<b>自定义标题</b>', $attributes['linkGuardWarningTitle']);
        $this->assertSame("第一行\n<script>alert(1)</script>", $attributes['linkGuardWarningMessage']);
        $this->assertSame("github.com\n*.flarum.org", $attributes['linkGuardTrustedDomains']);
    }

    public static function modalSettings(): array
    {
        return ['enabled' => ['1', true], 'disabled' => ['0', false]];
    }

    /** @dataProvider modalSettings */
    public function test_modal_setting_is_serialized_as_boolean(string $value, bool $expected): void
    {
        $this->setting('ffans-link-guard.use_modal', $value);

        $response = $this->send($this->request('GET', '/api'));
        $this->assertSame(200, $response->getStatusCode());
        $attributes = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR)['data']['attributes'];

        $this->assertSame($expected, $attributes['linkGuardUseModal']);
    }

    public function test_target_query_does_not_cause_a_server_redirect(): void
    {
        $response = $this->send($this->request('GET', '/link-guard?url=https%3A%2F%2Fexample.org'));
        $this->assertSame(200, $response->getStatusCode());
        $this->assertFalse($response->hasHeader('Location'));
    }

    public function test_forum_and_admin_assets_compile_through_flarum(): void
    {
        $container = $this->app()->getContainer();

        foreach (['forum', 'admin'] as $frontend) {
            $assets = $container->make('flarum.assets.'.$frontend);
            $css = $assets->makeCss();
            $css->commit(true);
            $this->assertNotNull($css->getUrl());
            $content = $assets->getAssetsDir()->get($css->getFilename());
            $this->assertNotEmpty($content);
            if ($frontend === 'forum') {
                $this->assertStringContainsString('.LinkGuardPage-notice', $content);
                $this->assertStringContainsString('overflow-wrap:anywhere', $content);
            }

            $js = $assets->makeJs();
            $js->commit(true);
            $this->assertNotNull($js->getUrl());
            $this->assertStringContainsString('ffans-link-guard', $assets->getAssetsDir()->get($js->getFilename()));
        }
    }

    public static function locales(): array
    {
        return ['English' => ['en', 'en'], 'Chinese' => ['zh-Hans', 'zh-Hans'], 'English fallback' => ['fr', 'en']];
    }

    /** @dataProvider locales */
    public function test_locale_assets_include_translations_and_shared_defaults(string $locale, string $sourceLocale): void
    {
        $container = $this->app()->getContainer();
        // The testing extension manager enables extensions after LocaleManager was
        // first resolved. Resolve it again so registered locale callbacks run.
        $container->forgetInstance(LocaleManager::class);
        $container->make(LocaleManager::class);
        $expected = Arr::dot(Yaml::parseFile(__DIR__.'/../../locale/'.$sourceLocale.'.yml'));

        foreach (['forum', 'admin'] as $frontend) {
            $assets = $container->make('flarum.assets.'.$frontend);
            $js = $assets->makeLocaleJs($locale);
            $js->commit(true);
            $content = $assets->getAssetsDir()->get($js->getFilename());

            foreach ($expected as $key => $value) {
                if (str_starts_with($key, 'ffans-link-guard.'.$frontend.'.') || str_starts_with($key, 'ffans-link-guard.lib.')) {
                    $this->assertStringContainsString(json_encode($key).':'.json_encode($value), $content, $frontend.' / '.$locale.' / '.$key);
                }
            }
        }
    }
}
