// 导出已捕获数据：在 QX 里手动跑一次（或挂到 task_local），日志里整段复制给开发者。
// QX 的持久化对象是 $prefs。

const PLAY = 'qx91_play_v1';
const LOG = 'qx91_log_v1';

function storeRead(key) {
  try {
    if (typeof $prefs !== 'undefined' && $prefs.valueForKey) return $prefs.valueForKey(key);
    if (typeof $persistentStore !== 'undefined' && $persistentStore.read) return $persistentStore.read(key);
  } catch (error) {}
  return null;
}

function parse(key) {
  const raw = storeRead(key);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

const plays = parse(PLAY);
const logs = parse(LOG);

let text = '# QX 捕获导出 ' + new Date().toISOString() + '\n';
text += '## 播放列表 ' + plays.length + ' 条\n';
plays.forEach((item) => {
  text += item.url + '\n';
});
text += '\n## 接口调用 ' + logs.length + ' 条（只列 URL 与鉴权头）\n';
logs.forEach((item) => {
  const auth = item.headers && item.headers.authorization ? ' auth=' + item.headers.authorization.slice(0, 24) + '…' : '';
  text += item.kind + ' ' + item.method + ' ' + item.url + auth + '\n';
});

console.log(text);
try {
  if (typeof $notify === 'function') {
    $notify('QX 导出', '播放列表 ' + plays.length + ' 条 / 接口 ' + logs.length + ' 条', '日志里可整段复制');
  }
} catch (error) {}
$done({});
