# FFans Link Guard · 外链防护

[![许可证](https://img.shields.io/packagist/l/ffans/link-guard.svg?label=许可证)](https://raw.githubusercontent.com/FFans/link-guard/2.x/LICENSE) [![Flarum](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FFFans%2Flink-guard%2F1.x%2Fcomposer.json&query=%24.require%5B%22flarum%2Fcore%22%5D&label=Flarum)](https://docs.flarum.org/1.x/) [![最新版本](https://img.shields.io/github/v/tag/FFans/link-guard?filter=v1.*&sort=semver&label=最新版本)](https://github.com/FFans/link-guard/releases) [![Flarum](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FFFans%2Flink-guard%2F2.x%2Fcomposer.json&query=%24.require%5B%22flarum%2Fcore%22%5D&label=Flarum)](https://docs.flarum.org/2.x/) [![最新版本](https://img.shields.io/github/v/tag/FFans/link-guard?filter=v2.*&sort=semver&label=最新版本)](https://github.com/FFans/link-guard/releases) [![发布日期](https://img.shields.io/github/release-date/ffans/link-guard.svg?display_date=published_at&label=发布日期)](https://github.com/ffans/link-guard/releases/latest) [![总下载量](https://img.shields.io/packagist/dt/ffans/link-guard.svg?label=总下载量)](https://packagist.org/packages/ffans/link-guard/stats) [![月下载量](https://img.shields.io/packagist/dm/ffans/link-guard.svg?label=月下载量)](https://packagist.org/packages/ffans/link-guard/stats)

为 [Flarum]([Flarum](https://flarum.org)) 帖子中的外部链接增加离站确认页。用户点击外链后，先提示目标地址，再由用户决定是否继续访问。

**Link Guard 只提供离站提醒，不检测、验证或保证目标网站的安全性。**

## 功能

- **离站确认**：非可信域名的 HTTP/HTTPS 外链默认在新标签页打开提示页，也可在后台切换为当前页面弹窗提示。
- **明确展示目标**：无外框提示页分开展示标题与说明，突出目标域名，并完整显示目标地址；支持手机和深色主题。
- **自主选择**：由用户选择继续访问或返回论坛，没有自动跳转。
- **可信域名**：支持精确域名和子域名通配符，可信域名的链接跳过提示。
- **自定义提示**：管理员可修改警告标题和内容，留空使用默认文案。
- **适配帖子加载**：随帖子渲染、更新及无限滚动处理正文链接，不修改帖子数据库内容，无后端。

## 兼容性

| Flarum 版本 | 扩展版本 | 分支  |
|-------------|----------|-------|
| 2.x         | `2.x`    | `2.x` |
| 1.x         | `1.x`    | `1.x` |

## 安装

使用 Composer:

```sh
composer require ffans/link-guard:"*"
php flarum cache:clear
```

## 更新

```sh
composer update ffans/link-guard
php flarum cache:clear
```

## 后台设置

进入管理后台的 **FFans Link Guard** 扩展页面配置：

| 设置         | 说明                                                          | 留空时默认                           |
|--------------|---------------------------------------------------------------|--------------------------------------|
| 警告标题     | 自定义离站提示标题，仅支持纯文本                              | “即将离开 {论坛名称}“                |
| 警告内容     | 自定义提醒内容，仅支持纯文本，可换行；不解析 HTML 或 Markdown | ”请注意账号财产安全。”               |
| 可信域名     | 一行一条域名规则，命中的外链跳过提示                          | 所有非同源 HTTP/HTTPS 链接均显示提示 |
| 使用弹窗提示 | 开启后，在当前页面弹窗提示                                    | 默认关闭，使用独立提示页             |

保存后，请重新加载已打开的论坛页面，使新设置生效。

### 可信域名

例如，同时信任 `github.com`、`example.com` 及后者的全部子域：

```text
github.com
example.com
*.example.com
```

| 规则            | 匹配示例                             | 不匹配示例                                            |
|-----------------|--------------------------------------|-------------------------------------------------------|
| `github.com`    | `github.com`                         | `www.github.com`、`gist.github.com`、`evilgithub.com` |
| `*.example.com` | `www.example.com`、`a.b.example.com` | `example.com`、`fakeexample.com`                      |

- 精确规则只匹配该域名，不自动包含子域。
- `*.` 规则匹配任意层级子域， **不包含根域名**。需要同时信任根域时，请另加一行。
- 域名不区分大小写；忽略首尾空白和空行，并规范化域名末尾的点。
- 只填写域名，不填写协议、端口、路径、查询参数或完整 URL。例如 `https://example.com`、`example.com:8443`、`example.com/path`
  均为无效规则。
- 不支持 `foo.*.example.com`、`example.*` 等任意位置通配；无效规则会被忽略。

可信规则按域名匹配，不区分 HTTP/HTTPS 或目标端口。加入可信列表仅表示跳过离站提示，不代表扩展已确认该网站安全。

## 保护范围

当前只处理 Flarum 评论帖子（`CommentPost`）正文中的链接。

以下链接保持原有行为：

- 与当前论坛同源的链接，包括站内相对地址和页面锚点。
- 命中可信域名规则的 HTTP/HTTPS 链接。
- `mailto:`、`tel:` 等非 HTTP/HTTPS 链接。

“同源”要求协议、域名和端口均相同。例如，论坛位于 `https://forum.example.com` 时，`http://forum.example.com` 或
`https://forum.example.com:8443` 并不同源；未配置可信规则时仍会显示提示。同源链接无需加入可信域名。

页头、页脚、用户资料、管理后台、OAuth / SSO、第三方扩展自己的按钮及自定义帖子类型不在当前保护范围内。Link Guard
不提供全站外链拦截。

## 提示页行为

提示页位于论坛的 `/link-guard` 路由，可公开访问，无权限配置。

开启“使用弹窗提示”后，会在当前页面显示提示弹窗。

以下行为适用于独立提示页：

- **继续访问**：仅在目标是有效的 HTTP/HTTPS 地址时显示；保留目标地址的路径、查询参数和锚点。
- **关闭此页**：请求浏览器关闭当前标签页。若浏览器不允许关闭，页面会提示手动关闭，并提供“返回社区”链接。
- **返回社区**：优先前往可用的同源来源页，否则返回论坛首页。
- **无效链接**：直接打开不带目标地址的提示页，或目标缺失、无法解析、协议不受支持时，显示“无效的外部链接”，不提供“继续访问”。

## 隐私与边界

目标地址通过 URL 片段传递，例如 `/link-guard#url=...`，而非查询参数。片段不会随打开提示页的 HTTP
请求发送给服务器，因此不会因这一请求进入服务器请求日志；仅可被跳转页面读取。

Link Guard 本身不请求目标网站、不调用第三方安全检测服务，也不记录点击统计或外链历史。扩展使用 Flarum 原生设置，不创建业务数据库表，暂不提供 GDPR 或 Audit 集成。

链接处理在论坛前端完成，需要 JavaScript 正常运行。

## 翻译

帮助翻译本扩展，请前往 [Weblate 平台](https://weblate.rob006.net/projects/flarum2/ffans-link-guard/)。

## 链接

- [GitHub](https://github.com/ffans/link-guard)
- [Packagist](https://packagist.org/packages/ffans/link-guard)
- [英文社区](https://discuss.flarum.org/d/39937)
- [中文社区](https://discuss.flarum.org.cn/d/16571)

## 许可证

本扩展采用 [MIT 许可证](LICENSE.md)。
