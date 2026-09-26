# FFans Link Guard

[![License](https://img.shields.io/packagist/l/ffans/link-guard.svg?label=license)](https://raw.githubusercontent.com/FFans/link-guard/1.x/LICENSE) [![Flarum](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FFFans%2Flink-guard%2F1.x%2Fcomposer.json&query=%24.require%5B%22flarum%2Fcore%22%5D&label=Flarum)](https://docs.flarum.org/1.x/) [![Version](https://img.shields.io/github/v/tag/FFans/link-guard?filter=v1.*&sort=semver&label=version)](https://github.com/FFans/link-guard/releases) [![Flarum](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FFFans%2Flink-guard%2F2.x%2Fcomposer.json&query=%24.require%5B%22flarum%2Fcore%22%5D&label=Flarum)](https://docs.flarum.org/2.x/) [![Version](https://img.shields.io/github/v/tag/FFans/link-guard?filter=v2.*&sort=semver&label=version)](https://github.com/FFans/link-guard/releases) [![Release Date](https://img.shields.io/github/release-date/ffans/link-guard.svg?display_date=published_at&label=release%20date)](https://github.com/ffans/link-guard/releases/latest) [![Total Downloads](https://img.shields.io/packagist/dt/ffans/link-guard.svg?label=downloads)](https://packagist.org/packages/ffans/link-guard/stats) [![Monthly Downloads](https://img.shields.io/packagist/dm/ffans/link-guard.svg?label=downloads)](https://packagist.org/packages/ffans/link-guard/stats)

A [Flarum](https://flarum.org) extension. Adds a confirmation page before users follow external links in posts. Users can review the destination address before deciding whether to continue.

**Link Guard provides a reminder before leaving the forum. It does not check, verify, or guarantee the safety of the destination website.**

## Features

- **External link confirmation**: HTTP/HTTPS links to domains outside the trusted list open a warning page in a new tab or open a confirming modal if you set.
- **Visible destination**: The warning page displays the warning text and the complete destination address.
- **User choice**: Users decide whether to continue or return to the forum. There is no automatic redirect.
- **Trusted domains**: Exact domain rules and subdomain wildcards let matching links bypass the warning.
- **Custom warnings**: Administrators can change the warning title and message, or leave them blank to use the defaults.
- **Post loading support**: Links are processed as posts render, update, or load through infinite scrolling, without changing stored post content or using a backend redirect.

## Compatibility

| Flarum Version | Extension Version | Branch |
|----------------|-------------------|--------|
| 2.x            | `2.x`             | `2.x`  |
| 1.x            | `1.x`             | `1.x`  |

## Installation

Install with Composer:

```sh
composer require ffans/link-guard:"*"
php flarum cache:clear
```

## Updating

```sh
composer update ffans/link-guard
php flarum cache:clear
```

## Admin Settings

Open the **FFans Link Guard** extension page in the admin dashboard:

| Setting           | Description                                                                       | Default when blank                                           |
|-------------------|-----------------------------------------------------------------------------------|--------------------------------------------------------------|
| Warning title     | Custom title for the confirmation page. Plain text only.                          | “You are about to leave {forumName}”                         |
| Warning message   | Custom warning text. Line breaks are supported; HTML and Markdown are not parsed. | “Please keep your account and personal information safe.”    |
| Trusted domains   | One domain rule per line. Matching links bypass the warning.                      | All HTTP/HTTPS links to a different origin show the warning. |
| Use Modal Warning | If enabled, the warning will be shown via modal.                                  | Independent warning page by default.                         |

After saving, reload any open forum pages to apply the new settings.

### Trusted Domains

For example, to trust `github.com`, `example.com`, and all subdomains of `example.com`:

```text
github.com
example.com
*.example.com
```

| Rule | Matches | Does not match |
| --- | --- | --- |
| `github.com` | `github.com` | `www.github.com`, `gist.github.com`, `evilgithub.com` |
| `*.example.com` | `www.example.com`, `a.b.example.com` | `example.com`, `fakeexample.com` |

- An exact rule matches only that domain. It does not automatically include subdomains.
- A `*.` rule matches subdomains at any depth, but **does not include the root domain**. Add the root domain on a separate line if you want to trust it too.
- Domain matching is case-insensitive. Leading and trailing whitespace and blank lines are ignored, and trailing dots in domain names are normalized.
- Enter domain names only, without a protocol, port, path, query string, or complete URL. For example, `https://example.com`, `example.com:8443`, and `example.com/path` are invalid rules.
- Wildcards in other positions, such as `foo.*.example.com` or `example.*`, are not supported. Invalid rules are ignored.

Trusted rules match the hostname regardless of HTTP/HTTPS or the destination port. Adding a domain to the trusted list only skips the confirmation page; it does not mean the extension has verified that the website is safe.

## Protection Scope

Only links in the body of Flarum comment posts (`CommentPost`) are processed.

The following links retain their original behavior:

- Links with the same origin as the forum, including relative internal links and page anchors.
- HTTP/HTTPS links matching a trusted domain rule.
- Non-HTTP/HTTPS links, such as `mailto:` and `tel:`.

“Same origin” means the protocol, hostname, and port all match. For example, if the forum is at `https://forum.example.com`, neither `http://forum.example.com` nor `https://forum.example.com:8443` has the same origin. These links still show the warning unless a trusted domain rule matches. Same-origin links do not need to be added to the trusted list.

Headers, footers, user profiles, the admin dashboard, OAuth / SSO flows, buttons provided by third-party extensions, and custom post types are outside the current scope. Link Guard does not intercept external links across the entire site.

## Warning Page Behavior

The warning page is available at the forum's `/link-guard` route. It is publicly accessible and requires no permission configuration.

If "Show in modal" enabled, the warning will be shown via modal.

For Independent Page:

- **Continue**: Available only for a valid HTTP/HTTPS destination. The destination's path, query parameters, and fragment are preserved.
- **Close this tab**: Asks the browser to close the current tab. If the browser does not allow it, the page asks the user to close the tab manually and provides a “return to the community” link.
- **Return to the community**: Returns to an available same-origin referring page, or to the forum homepage otherwise.
- **Invalid links**: Opening the page without a destination, or with a missing, unparseable, or unsupported destination, displays “Invalid external link” without a Continue action.

## Permissions

Link Guard does not register custom permissions. Guests, members, moderators, and administrators follow the same rules. Trusted domains control which external links bypass the warning.

## Privacy and Limitations

The destination address is passed in a URL fragment, such as `/link-guard#url=...`, rather than a query parameter. The fragment is not sent to the server in the HTTP request for the warning page, so it does not enter server request logs through that request. It remains available to scripts on the warning page.

Link Guard does not request the destination website, use third-party security checks, or record click statistics or external link history. It uses Flarum's native settings and does not create application-specific database tables.

Link processing runs in the forum frontend and requires JavaScript to work.

## GDPR Integration

Link Guard currently provides no GDPR or Audit integration. It does not define a GDPR data type or provide extension-specific export, anonymization, or deletion actions.

## Translations

To help translate this extension, visit the [Weblate project](https://weblate.rob006.net/projects/flarum2/ffans-link-guard/).

## Links

- [GitHub](https://github.com/ffans/link-guard)
- [Packagist](https://packagist.org/packages/ffans/link-guard)
- [Discuss](https://discuss.flarum.org/d/39937)
- [Chinese Community](https://discuss.flarum.org.cn/d/16571)

## License

This extension is released under the [MIT License](LICENSE.md).
