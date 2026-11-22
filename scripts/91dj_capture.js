// 91短剧 / 91国产 —— 接口捕获（请求头/请求体/响应体）
// QX 用法：script-request-header 与 script-response-body 都指向本文件。
// 日志前缀 [91DJ-REQ] / [91DJ-RESP]，每条带行号，方便整段复制。

const KEY = 'qx91_log_v1';
const MAX = 60;
const TAG = '[91DJ]';

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
  $persistentStore.write(JSON.stringify(list), KEY);
  return record;
}

function emit(record) {
  const lines = [
    TAG + ' [' + record.kind + '-' + record.n + '] ' + record.method + ' ' + record.url,
  ];
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
  $notify(TAG + ' 抓到 ' + record.kind, clip(record.url.replace(/^https?:\/\//, ''), 60), '第 ' + record.n + ' 条');
}

if (typeof $response !== 'undefined') {
  const body = $response.body || '';
  const record = save({
    kind: 'RESP',
    method: $request.method,
    url: $request.url,
    body: typeof body === 'string' ? body : '',
  });
  emit(record);
  $done({});
} else {
  const record = save({
    kind: 'REQ',
    method: $request.method,
    url: $request.url,
    headers: $request.headers,
    body: $request.body || '',
  });
  emit(record);
  $done({});
}
