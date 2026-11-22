// 91短剧 / 91国产 —— 接口捕获（请求头/请求体/响应体）
// QX 用法：script-request-header 与 script-response-body 都指向本文件。
// 日志前缀 [91DJ-REQ] / [91DJ-RESP]，每条带序号，方便整段复制。
//
// 重要：脚本必须把请求/响应原样放行，否则 App 的「线路检测」会失败（拿到空响应）。
//   - request-header 阶段：$done({ headers: $request.headers })
//   - response-body   阶段：$done({ body: $response.body, status: $response.statusCode, headers: $response.headers })

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
  // 原样放行，绝对不要返回空对象（会把响应体清空）
  $done({ body: body, status: $response.statusCode, headers: $response.headers });
} else {
  const record = save({
    kind: 'REQ',
    method: $request.method,
    url: $request.url,
    headers: $request.headers,
    body: $request.body || '',
  });
  emit(record);
  // 原样放行
  $done({ headers: $request.headers });
}
