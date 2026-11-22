// 导出已捕获的数据：在 QX 里用「手动执行脚本」跑一次，整段复制给我即可。
// 也可以在任意一个命中规则里临时把脚本换成它。

const PLAY = 'qx91_play_v1';
const LOG = 'qx91_log_v1';

function parse(key) {
  const raw = $persistentStore.read(key);
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
$notify('QX 导出', '播放列表 ' + plays.length + ' 条 / 接口 ' + logs.length + ' 条', '日志里可整段复制');
$done({});
