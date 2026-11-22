# QuantumultX Rewrites

iPhone 上的 QuantumultX 重写脚本合集。主要用途：给那些**接口加密、网页版不存在**的 App 做接口捕获与改写，配合 LumeBox 源使用。

## 目录

| 路径 | 说明 |
| --- | --- |
| `remote/91dj.conf` | 91短剧 / 91国产（`qpkx.fzmyb.jevyq`）的 QX 远程片段：MITM 主机名 + 重写规则 |
| `scripts/91dj_capture.js` | 把 `/api/app/*` 的请求头、请求体、响应体打到 QX 日志（加密体也会记，用于事后分析） |
| `scripts/91dj_m3u8.js` | 专门盯播放列表 `/api/app/vid/h5/m3u8/...`，把 `路径 token + ?token=JWT&c=` 存下来并通知 |
| `scripts/91dj_store.js` | 小工具：把累计捕获导出成一段文本（在 QX 的 JS 环境里跑一次即可） |

## 怎么用（3 步）

1. QX → 设置 → **MitM** → 生成证书 → 安装并信任 → 打开 MitM
2. QX → 设置 → 通用 → **关闭 HTTP/3（QUIC）**（不关抓不到）
3. 把下面这行加进 QX 配置的 `[rewrite_local]` 段（远程引用，改脚本不用重装配置）：

```
https://raw.githubusercontent.com/teng662858/QuantumultX-Rewrites/main/remote/91dj.conf url 200
```

> 也可以不用远程引用，直接把 `remote/91dj.conf` 里的 `[mitm]` 与 `[rewrite_local]` 两段手工粘进本地配置。

## 抓完怎么给 LumeBox 用

打开那个 App 播一集 → QX 日志里会出现 `[91DJ-PLAY]` 开头的行，里面是：

```
https://91hts.rlkfus.cn/api/app/vid/h5/m3u8/<key>/tk1/<token>.m3u8?token=<JWT>&c=<分片源>
```

把整条发出来即可：有了 `token` 和 `JWT`，同一集的播放列表、分片地址、AES-128 密钥都能在电脑上直接取，不需要 App 参与（分片用 `/api/app/vid/sec` 返回的 16 字节密钥、AES-128-CBC/IV=0 解密）。

## 已知（2026-11-22 实测）

- 鉴权头是 `authorization: <JWT>`，**不能加 `Bearer`**（会返回 `invalid token`）
- 播放列表缺少 `?token=` 时返回 `{"code":5005,"msg":"no token"}`
- 分片密钥接口 `GET /api/app/vid/sec` 返回 16 字节裸数据，**免鉴权**
- `/api/app/*` 的参数与响应体为 AES 密文（密钥在 Flutter 的 `libapp.so` 里，正在逆）
- 该 App 没有可浏览的 H5 版本：`985.fun` 只是导航页，`91djvip.com` 只跳下载页
