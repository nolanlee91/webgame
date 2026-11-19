// CDP tối thiểu cho Chrome headless (không thêm thư viện). Dùng bởi test/e2e.mjs.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch(outDir, dbgPort = 9371) {
  mkdirSync(outDir, { recursive: true });
  const prof = outDir + "/prof-" + dbgPort;
  try { rmSync(prof, { recursive: true, force: true }); } catch {}
  const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${dbgPort}`, "--user-data-dir=" + prof, "--hide-scrollbars", "--mute-audio", "about:blank"], { stdio: "ignore" });
  let ws;
  for (let i = 0; i < 80 && !ws; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${dbgPort}/json`)).json(); const p = l.find((x) => x.type === "page"); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {}
    if (!ws) await sleep(250);
  }
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); const errors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) errors.push("console." + m.params.type + " " + m.params.args.map((a) => a.value || a.description).join(" "));
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push(m.params.entry.text + " " + (m.params.entry.url || ""));
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(expr.slice(0, 200) + " :: " + JSON.stringify(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
    return r.result.result.value;
  };
  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
  const api = {
    send, ev, errors,
    async nav(url) {
      await send("Page.navigate", { url }); await sleep(400);
      for (let i = 0; i < 60 && !(await ev('typeof __game==="object"').catch(() => false)); i++) await sleep(200);
      await sleep(300);
    },
    view: (w, h, mobile = false, dpr = 1) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile }),
    touch: (on) => send("Emulation.setTouchEmulationEnabled", { enabled: on, maxTouchPoints: on ? 5 : 1 }),
    async shot(path, full = false) {
      let p = { format: "png" };
      if (full) { const h = await ev("Math.ceil(document.documentElement.scrollHeight)"), w = await ev("innerWidth"); p = { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } }; }
      const r = await send("Page.captureScreenshot", p); writeFileSync(path, Buffer.from(r.result.data, "base64"));
    },
    async click(x, y) { for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); },
    async tap(x, y) { await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); },
    close() { try { ws.close(); } catch {} proc.kill(); setTimeout(() => { try { rmSync(prof, { recursive: true, force: true }); } catch {} }, 600); },
  };
  return api;
}
