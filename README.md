# QuantumultX Rewrites

iPhone 上的 QuantumultX 重写脚本合集。主要用途：给那些**接口加密、网页版不存在**的 App 做接口捕获与改写，配合 LumeBox 源使用。

## 目录

| 路径 | 说明 |
| --- | --- |
| `remote/91dj.rules.conf` | **远程重写资源**（配合 QX 的 `[rewrite_remote]` 引用）：首行 `hostname` 指令只把 3 个接口域名并入 MitM，后面是 3 条重写规则 |
| `remote/91dj.conf` | 整段**本地配置**片段（`[mitm]` + `[rewrite_local]`），想一次性手工粘贴时用 |
| `scripts/91dj_capture.js` | 抓 `/api/app/*` 的请求头（含 `authorization`）、请求体、响应体 |
| `scripts/91dj_m3u8.js` | 只盯播放列表 `/api/app/vid/h5/m3u8/...`，把 `路径 token + ?token=JWT&c=` 整条存下并通知 |
| `scripts/91dj_store.js` | 一键导出已捕获内容（QX 里手动跑一次，整段复制） |

## 用法 A（推荐）：远程资源引用

QX 配置文件里加一行，脚本和规则都在 GitHub 上，改脚本不用重装配置：

```
[rewrite_remote]
https://raw.githubusercontent.com/teng662858/QuantumultX-Rewrites/main/remote/91dj.rules.conf, tag=91短剧抓包, update-interval=172800, enabled=true
```

图形界面等价操作：**QX → 设置 → 资源 → 重写 → 新增**
- 资源标签：`91短剧抓包`
- 插入资源：开
- 资源解析器：**关**（文件本身就是 QX 原生格式）
- 资源路径：上面那条 raw 链接

MITM 主机名会由资源首行自动并入：

```
hostname = %APPEND% 91hts.rlkfus.cn, tyuio.rlkfus.cn, dp539615g9mv7.cloudfront.net
```

**只加这 3 个接口域名，千万别加 `*.rlkfus.cn` / `*.pjrwfe.cn` / `rs2sts.pjrwfe.cn`** —— 分片 CDN 和线路探测域名被 MitM 拦下来，App 会直接报「APP线路检测失败 / 选线失败」。

证书必须本地安装并信任（远程无法代劳），并关闭 HTTP/3：**设置 → 通用 → 关闭 QUIC**。

## 用法 B：整段本地配置

把 `remote/91dj.conf` 的 `[mitm]`、`[rewrite_local]` 两段粘进本地配置，效果一样，但不会自动更新。

## 排错：App 报「APP线路检测失败 / 选线失败」

这与抓包直接相关，按顺序排查：

1. **先关 MitM 总开关**，重开 App → 若恢复正常，说明是 MitM 拦了线路探测域名。
2. 把 MitM 主机名收窄到只有那 3 个接口域名（本仓库已改好；如果你手工加过 `*.rlkfus.cn`、`*.pjrwfe.cn`，删掉）。
3. 确认 QX 里 `rlkfus.cn`、`pjrwfe.cn`、`cloudfront.net` 的分流策略是 **direct（直连）**，别走代理节点。
4. 还不行就把资源先关掉（`enabled=false`）确认 App 本身能不能连，再逐步加回。

## 抓完怎么用

播一集后 QX 日志出现：

```
[91DJ-PLAY] [1] key=JHA-214 line=tk1
[91DJ-PLAY] pathToken=…
[91DJ-PLAY] full=https://91hts.rlkfus.cn/api/app/vid/h5/m3u8/<key>/tk1/<token>.m3u8?token=<JWT>&c=https://rs2sts.pjrwfe.cn
```

`full=` 那条**本身就是标准 HLS**：

- 列表里 `#EXT-X-KEY:METHOD=AES-128,URI="/api/app/vid/sec"`
- `https://91hts.rlkfus.cn/api/app/vid/sec` 返回 16 字节密钥、**免鉴权**
- 实测取分片 + AES-128-CBC/IV=0 解密 → 首字节 `0x47`、188 对齐，合法 MPEG-TS

所以可以直接丢进 **nPlayer / Infuse / IINA** 播完整一集（不用开 App、不用会员）。

## 已知（2026-11-22 实测）

- 鉴权头是 `authorization: <JWT>`，**不能加 `Bearer`**（会返回 `invalid token`）
- 播放列表缺少 `?token=` 时返回 `{"code":5005,"msg":"no token"}`
- `/api/app/*` 请求参数与响应体为 AES 密文（`{"code":…,"data":"<base64>","hash":true}`，data = 12B nonce + 密文 + 16B tag），密钥在 Flutter `libapp.so`，已用 blutter 反出 199 个接口与 `aes_util.dart`，正在还原派生细节
- 该 App 无可用 H5：`985.fun` 只是导航页，`91djvip.com` 只跳下载页
