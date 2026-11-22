# QuantumultX Rewrites

iPhone 上的 QuantumultX 重写脚本合集。主要用途：给那些**接口加密、网页版不存在**的 App 做接口捕获与改写，配合 LumeBox 源使用。

## 目录

| 路径 | 说明 |
| --- | --- |
| `remote/91dj.rules.conf` | **远程重写资源**（配合 QX 的 `[rewrite_remote]` 引用）：首行 `hostname` 指令会把域名并入 MitM，后面是 3 条重写规则 |
| `remote/91dj.conf` | 整段**本地配置**片段（`[mitm]` + `[rewrite_local]`），想一次性手工粘贴时用 |
| `scripts/91dj_capture.js` | 抓 `/api/app/*` 的请求头（含 `authorization`）、请求体、响应体 |
| `scripts/91dj_m3u8.js` | 只盯播放列表 `/api/app/vid/h5/m3u8/...`，把 `路径 token + ?token=JWT&c=` 整条存下并通知 |
| `scripts/91dj_store.js` | 一键导出已捕获内容（QX 里手动跑一次，整段复制） |

## 用法 A（推荐）：远程资源引用

QX 配置文件里加一行即可，脚本和规则都在 GitHub 上，改脚本不用重装配置：

```
[rewrite_remote]
https://raw.githubusercontent.com/teng662858/QuantumultX-Rewrites/main/remote/91dj.rules.conf, tag=91短剧抓包, update-interval=172800, enabled=true
```

或者用图形界面：**QX → 设置 → 资源 → 重写 → 新增**
- 资源标签：`91短剧抓包`
- 插入资源：开
- 资源解析器：**关**（文件本身就是 QX 原生格式）
- 资源路径：上面那条 raw 链接

**MITM 主机名**：`remote/91dj.rules.conf` 第一行是

```
hostname = %APPEND% 91hts.rlkfus.cn, tyuio.rlkfus.cn, dp539615g9mv7.cloudfront.net, rs2sts.pjrwfe.cn, *.pjrwfe.cn, *.rlkfus.cn
```

QX 引用远程重写资源时会读这一行，把域名**追加**进 MitM 主机名（`%APPEND%` 表示不覆盖你原有的）。
如果你的 QX 版本没自动并入，就手工在 **设置 → MitM → 主机名** 里加这 6 条（只需一次）。

证书仍然必须**手动安装并信任**（这一步没法远程），另外记得 **设置 → 通用 → 关闭 HTTP/3（QUIC）**。

## 用法 B：整段本地配置

把 `remote/91dj.conf` 里的 `[mitm]`、`[rewrite_local]` 两段直接粘进本地配置文件，效果一样，但不会自动更新。

## 抓完怎么用

打开 App 播一集，QX 日志会出现：

```
[91DJ-PLAY] [1] key=JHA-214 line=tk1
[91DJ-PLAY] pathToken=…
[91DJ-PLAY] full=https://91hts.rlkfus.cn/api/app/vid/h5/m3u8/<key>/tk1/<token>.m3u8?token=<JWT>&c=https://rs2sts.pjrwfe.cn
```

`full=` 那条**本身就是标准 HLS**：

- 列表里 `#EXT-X-KEY:METHOD=AES-128,URI="/api/app/vid/sec"`
- 而 `https://91hts.rlkfus.cn/api/app/vid/sec` 返回 16 字节密钥、**免鉴权**
- 实测按它取分片、AES-128-CBC/IV=0 解密 → 首字节 `0x47`、188 对齐，确认是合法 MPEG-TS

所以这条链接可以直接丢进 **nPlayer / Infuse / IINA** 播完整一集（不用开 App、不用会员）。也可以发给我做进 LumeBox 源。

## 已知（2026-11-22 实测）

- 鉴权头是 `authorization: <JWT>`，**不能加 `Bearer`**（会返回 `invalid token`）
- 播放列表缺少 `?token=` 时返回 `{"code":5005,"msg":"no token"}`
- `/api/app/*` 的请求参数与响应体为 AES 密文（`{"code":…,"data":"<base64>","hash":true}`，data = 12B nonce + 密文 + 16B tag）；密钥在 Flutter `libapp.so` 里，已用 blutter 反出 199 个接口清单与 `aes_util.dart`，正在还原派生细节
- 该 App 没有可浏览的 H5 版本：`985.fun` 只是导航页，`91djvip.com` 只跳下载页
