// 91短剧 / 91国产 —— 播放列表捕获
// 目标请求：GET /api/app/vid/h5/m3u8/<key>/tk1/<pathToken>.m3u8?token=<JWT>&c=<分片源>
// 抓到后把整条 URL 存下来（这是后续取流、做 LumeBox 源的钥匙）。

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

if (!match) {
  console.log(TAG + ' 未识别的播放列表请求: ' + url.slice(0, 160));
  $done({});
} else {
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
  $done({});
}
