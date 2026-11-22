// 91短剧 / 91国产 —— 接口捕获（请求头/请求体/响应体）
// QX 用法：script-request-header 与 script-response-body 都指向本文件。
//
// 重要：
//  1) QuantumultX 的持久化对象是 $prefs（$persistentStore 是 Surge/Loon 的，QX 里不存在，会抛
//     "Can't find variable: $persistentStore" 并让重写异常 → App 报选线失败）。这里两种都兼容。
//  2) 必须原样放行，不能返回空对象，否则响应体会被清空。

const KEY = 'qx91_log_v1';
const MAX = 60;
const TAG = '[91DJ]';

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

function clip(value, limit) {
  const text = String(value == null ? '' : value);
  return text.length > limit ? text.slice(0, limit) + '…' : text;
}

function save(record) {
  const list = readList();
  record.n = list.length + 1;
  record.ts = new Date().toISOString();
  list.push(record);
  while (list.length > MAX) list.shift();
  storeWrite(JSON.stringify(list), KEY);
  return record;
}

function emit(record) {
  const lines = [TAG + ' [' + record.kind + '-' + record.n + '] ' + record.method + ' ' + record.url];
  if (record.headers) {
    const picked = {};
    ['authorization', 'token', 'cookie', 'user-agent', 'content-type', 'sign', 'ts', 'deviceid', 'device-id', 'x-sign']
      .forEach((key) => {
        if (record.headers[key] != null) picked[key] = record.headers[key];
      });
    lines.push('  headers: ' + clip(JSON.stringify(picked), 700));
  }
  if (record.body) lines.push('  body: ' + clip(record.body, 700));
  console.log(lines.join('\n'));
}

if (typeof $response !== 'undefined') {
  const body = typeof $response.body === 'string' ? $response.body : '';
  const record = save({ kind: 'RESP', method: $request.method, url: $request.url, body: body });
  emit(record);
  if (typeof $response.body === 'string') {
    $done({ body: body, status: $response.statusCode, headers: $response.headers });
  } else {
    // 非文本响应（二进制/压缩未解）一律不动，避免破坏响应
    $done({});
  }
} else {
  const record = save({
    kind: 'REQ',
    method: $request.method,
    url: $request.url,
    headers: $request.headers,
    body: $request.body || '',
  });
  emit(record);
  $done({ headers: $request.headers });
}
