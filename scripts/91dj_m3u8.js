// 91短剧 / 91国产 —— 播放列表捕获（只记录，不改动任何东西）
// 目标：GET /api/app/vid/h5/m3u8/<key>/<line>/<pathToken>.m3u8?token=<JWT>&c=<分片源>
//
// 注意：QX 的持久化对象是 $prefs（$persistentStore 在 QX 里不存在，会抛异常让重写失效）。

const KEY = 'qx91_play_v1';
const MAX = 80;
const TAG = '[91DJ-PLAY]';

function storeRead(key) {
  try {
    if (typeof $prefs !== 'undefined' && $prefs.valueForKey) return $prefs.valueForKey(key);
    if (typeof $persistentStore !== 'undefined' && $persistentStore.read) return $persistentStore.read(key);
  } catch (error) {}
  return null;
}

function storeWrite(value, key) {
  try {
    if (typeof $prefs !== 'undefined' && $prefs.setValueForKey) {
      $prefs.setValueForKey(value, key);
      return;
    }
    if (typeof $persistentStore !== 'undefined' && $persistentStore.write) {
      $persistentStore.write(value, key);
    }
  } catch (error) {}
}

function notify(title, subtitle, message) {
  try {
    if (typeof $notify === 'function') $notify(title, subtitle, message);
  } catch (error) {}
}

function readList() {
  const raw = storeRead(KEY);
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
  storeWrite(JSON.stringify(list), KEY);

  console.log(TAG + ' [' + record.n + '] key=' + record.key + ' line=' + record.line);
  console.log(TAG + ' pathToken=' + record.pathToken);
  console.log(TAG + ' query=' + record.query);
  console.log(TAG + ' full=' + url);
  notify(TAG, record.key + ' / ' + record.line, '第 ' + record.n + ' 条已保存');
} else {
  console.log(TAG + ' 未识别的播放列表请求: ' + url.slice(0, 160));
}

// 原样放行
$done({ headers: $request.headers });
