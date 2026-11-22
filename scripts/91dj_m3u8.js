// 91短剧 / 91国产 —— 播放列表捕获（只记录，不修改任何东西）
// 目标请求：GET /api/app/vid/h5/m3u8/<key>/<line>/<pathToken>.m3u8?token=<JWT>&c=<分片源>
//
// 重要：这是 script-request-header 脚本，必须原样放行请求（返回 headers），
// 返回空对象会把请求搞坏 → App 报「选线失败 / 线路检测失败」。

const KEY = 'qx91_play_v1';
const MAX = 80;
const TAG = '[91DJ-PLAY]';

function readList() {
  const raw = $persistentStore.read(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

const url = $request.url || '';
const match = url.match(/\/api\/app\/vid\/h5\/m3u8\/([^/]+)\/([^/]+)\/([^.?]+)\.m3u8(?:\?(.*))?$/i);

if (match) {
  const list = readList();
  const record = {
    n: list.length + 1,
    ts: new Date().toISOString(),
    key: match[1],
    line: match[2],
    pathToken: match[3],
    query: match[4] || '',
    url: url,
  };
  list.push(record);
  while (list.length > MAX) list.shift();
  $persistentStore.write(JSON.stringify(list), KEY);

  console.log(TAG + ' [' + record.n + '] key=' + record.key + ' line=' + record.line);
  console.log(TAG + ' pathToken=' + record.pathToken);
  console.log(TAG + ' query=' + record.query);
  console.log(TAG + ' full=' + url);
  $notify(TAG, record.key + ' / ' + record.line, '第 ' + record.n + ' 条已保存');
} else {
  console.log(TAG + ' 未识别的播放列表请求: ' + url.slice(0, 160));
}

// 原样放行
$done({ headers: $request.headers });
