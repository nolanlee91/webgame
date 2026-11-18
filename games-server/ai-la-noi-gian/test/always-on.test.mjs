// Ai Là Nội Gián online luôn chạy: server.js không có biến bật/tắt, /ws/ai-la-noi-gian luôn nhận kết nối.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function canConnect(extraEnv, port) {
  const env = { ...process.env, PORT: String(port) };
  Object.assign(env, extraEnv);
  const p = spawn(process.execPath, ['server.js'], { cwd: ROOT, env, stdio: 'ignore' });
  try {
    await sleep(1200);
    return await new Promise((r) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/ai-la-noi-gian`);
      const t = setTimeout(() => r(false), 3000);
      ws.onopen = () => { clearTimeout(t); ws.close(); r(true); };
      ws.onerror = () => { clearTimeout(t); r(false); };
    });
  } finally { p.kill(); }
}

test('server.js mở /ws/ai-la-noi-gian mà không cần biến môi trường nào', async () => {
  assert.equal(await canConnect({}, 18795), true);
});
test('NOIGIAN_ONLINE=0 không còn tác dụng (không có cờ tắt)', async () => {
  assert.equal(await canConnect({ NOIGIAN_ONLINE: '0' }, 18796), true);
});
