// Ma Sói online mặc định BẬT: server.js không cần biến MASOI_ONLINE trên Railway; MASOI_ONLINE=0 thì tắt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function canConnect(extraEnv, port) {
  const env = { ...process.env, PORT: String(port) };
  delete env.MASOI_ONLINE;
  Object.assign(env, extraEnv);
  const p = spawn(process.execPath, ['server.js'], { cwd: ROOT, env, stdio: 'ignore' });
  try {
    await sleep(1200);
    return await new Promise((r) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/ma-soi`);
      const t = setTimeout(() => r(false), 3000);
      ws.onopen = () => { clearTimeout(t); ws.close(); r(true); };
      ws.onerror = () => { clearTimeout(t); r(false); };
    });
  } finally { p.kill(); }
}

test('không đặt MASOI_ONLINE ⇒ /ws/ma-soi nhận kết nối (mặc định bật)', async () => {
  assert.equal(await canConnect({}, 18791), true);
});
test('MASOI_ONLINE=0 ⇒ tắt máy chủ Ma Sói', async () => {
  assert.equal(await canConnect({ MASOI_ONLINE: '0' }, 18792), false);
});
