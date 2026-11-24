// Trợ lý CDP tối thiểu (không gói ngoài) cho test trình duyệt của module chia sẻ: dựng server tĩnh từ server.js,
// mở Chrome/Edge headless, mỗi Tab một cửa sổ. Dùng chung cho share-e2e.mjs và tools/og/render-og-images.mjs.
import { spawn } from "node:child_process";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

export const REPO = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function startServer() {
  const require = createRequire(import.meta.url);
  const server = require(join(REPO, "server.js")); // server thật (cả WebSocket phòng online), cổng ngẫu nhiên
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

export async function launchChrome() {
  const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
  if (!CHROME) throw new Error("Không thấy Chrome/Edge");
  const prof = mkdtempSync(join(tmpdir(), "lk-share-"));
  const port = 9400 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--hide-scrollbars", "--no-first-run",
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "about:blank"], { stdio: "ignore" });
  let ver;
  for (let i = 0; i < 80; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(250); } }
  const bws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r) => (bws.onopen = r));
  let bid = 0; const pend = new Map();
  bws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++bid; pend.set(i, r); bws.send(JSON.stringify({ id: i, method, params })); });
  return {
    port, cmd,
    async newTab(name, w = 1366, h = 768, mobile = false, browserContextId) { return new Tab(this, name).open(w, h, mobile, browserContextId); },
    /** Hồ sơ trình duyệt riêng (localStorage / cookie tách biệt) — để giả lập nhiều người chơi trên cùng một Chrome. */
    async newContext() { return (await cmd("Target.createBrowserContext", { disposeOnDetach: true })).result.browserContextId; },
    close() { try { bws.close(); } catch {} proc.kill(); setTimeout(() => { try { rmSync(prof, { recursive: true, force: true }); } catch {} }, 800); },
  };
}

export class Tab {
  constructor(chrome, name) { this.chrome = chrome; this.name = name; this.id = 0; this.pend = new Map(); this.errors = []; this.console = []; }
  async open(w, h, mobile, browserContextId) {
    const { targetId } = (await this.chrome.cmd("Target.createTarget", { url: "about:blank", newWindow: true, ...(browserContextId ? { browserContextId } : {}) })).result;
    this.ws = new WebSocket(`ws://127.0.0.1:${this.chrome.port}/devtools/page/${targetId}`);
    await new Promise((r) => (this.ws.onopen = r));
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pend.has(m.id)) { this.pend.get(m.id)(m); this.pend.delete(m.id); }
      if (m.method === "Runtime.exceptionThrown") this.errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === "Runtime.consoleAPICalled") this.console.push(`${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description).join(" ")}`);
      if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/favicon|fonts\.g|fonts\.gstatic/.test(m.params.entry.url || "")) this.errors.push(`${m.params.entry.text} ${m.params.entry.url || ""}`);
    };
    await this.cmd("Runtime.enable"); await this.cmd("Page.enable"); await this.cmd("Log.enable");
    await this.cmd("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
    if (mobile) await this.cmd("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    return this;
  }
  cmd(method, params = {}) { return new Promise((r) => { const i = ++this.id; this.pend.set(i, r); this.ws.send(JSON.stringify({ id: i, method, params })); }); }
  async ev(expr) {
    const r = await this.cmd("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.result?.exceptionDetails) throw new Error(`${this.name}: ${expr.slice(0, 120)} :: ${r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text}`);
    return r.result?.result?.value;
  }
  async go(url) { await this.cmd("Page.navigate", { url }); await this.waitFor('document.readyState==="complete"'); await sleep(300); }
  async waitFor(expr, ms = 15000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { if (await this.ev(expr)) return true; } catch {} await sleep(100); }
    throw new Error(`${this.name}: hết giờ chờ ${expr.slice(0, 140)}`);
  }
  async shot(file) {
    const { writeFileSync } = await import("node:fs");
    const r = await this.cmd("Page.captureScreenshot", { format: "png" });
    writeFileSync(file, Buffer.from(r.result.data, "base64"));
  }
  /** Bấm thật vào giữa phần tử (chuột hoặc chạm). Trả về false nếu phần tử bị che (elementFromPoint ≠ phần tử). */
  async click(selector, { touch = false } = {}) {
    const p = await this.ev(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({block:"center"});
      const r = el.getBoundingClientRect(); const x = r.left + r.width/2, y = r.top + r.height/2; const top = document.elementFromPoint(x, y);
      return { x, y, free: !!top && (top === el || el.contains(top)) }; })()`);
    if (!p) throw new Error(`${this.name}: không thấy ${selector}`);
    if (touch) {
      await this.cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y }] });
      await this.cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else {
      await this.cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
      await this.cmd("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
      await this.cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
    }
    return p.free;
  }
  close() { try { this.ws.close(); } catch {} }
}

/** Đọc Blob ảnh trong trang (biến toàn cục name) ⇒ Buffer PNG + kích thước. */
export async function blobFromPage(tab, expr) {
  const r = await tab.ev(`(async () => { const b = await (${expr}); const bmp = await createImageBitmap(b);
    const buf = new Uint8Array(await b.arrayBuffer()); let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return { type: b.type, size: b.size, w: bmp.width, h: bmp.height, b64: btoa(s) }; })()`);
  return { ...r, buf: Buffer.from(r.b64, "base64") };
}
