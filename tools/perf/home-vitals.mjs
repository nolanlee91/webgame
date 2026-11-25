// Đo nhanh Web Vitals (lab) của một trang bằng Chrome headless qua CDP, không cần gói ngoài.
// Dùng: node tools/perf/home-vitals.mjs --base http://127.0.0.1:8931 [--path /homepage/] [--runs 3] [--out <thư mục ảnh>] [--dpr 1]
// Mỗi lần đo: hồ sơ trình duyệt mới, tắt cache, giả lập Slow 4G (150 ms RTT, 1,6 Mbps xuống / 750 kbps lên) + CPU chậm 4×
// (trừ cột "nhanh" không giới hạn). Ghi CLS (PerformanceObserver layout-shift, bỏ shift ngay sau thao tác), LCP, FCP,
// KB truyền (encodedDataLength, tách riêng font) và số request. In bảng JSON cuối cùng.
import { launchChrome, sleep } from "../../prototype/games/_shared/test/cdp.mjs";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("base", "http://127.0.0.1:8931");
const PATH = arg("path", "/homepage/");
const RUNS = Number(arg("runs", 3));
const OUT = arg("out", "");
const DPR = Number(arg("dpr", 1));
const ONLY = arg("only", "");
if (OUT) mkdirSync(OUT, { recursive: true });

const CASES = [
  { name: "390-slow", w: 390, h: 844, mobile: true, slow: true },
  { name: "412-slow", w: 412, h: 915, mobile: true, slow: true },
  { name: "1366-slow", w: 1366, h: 768, mobile: false, slow: true },
  { name: "1366-fast", w: 1366, h: 768, mobile: false, slow: false },
].filter((c) => !ONLY || ONLY.split(",").includes(c.name));

const OBSERVER = `(() => {
  const v = window.__vitals = { cls: 0, shifts: [], lcp: 0, lcpEl: "", fcp: 0 };
  const name = (n) => !n ? "" : (n.id ? "#" + n.id : n.nodeName + (n.className && typeof n.className === "string" ? "." + n.className.split(" ")[0] : ""));
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; v.cls += e.value;
    v.shifts.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), src: (e.sources || []).map((s) => name(s.node)).slice(0, 4).join(" ") }); } })
    .observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { v.lcp = Math.round(e.startTime); v.lcpEl = name(e.element) + (e.url ? " " + e.url.split("/").pop() : ""); } })
    .observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === "first-contentful-paint") v.fcp = Math.round(e.startTime); })
    .observe({ type: "paint", buffered: true });
})();`;

async function measure(chrome, c, run) {
  const ctx = await chrome.newContext();
  const tab = await chrome.newTab(c.name, c.w, c.h, c.mobile, ctx);
  await tab.cmd("Emulation.setDeviceMetricsOverride", { width: c.w, height: c.h, deviceScaleFactor: DPR, mobile: c.mobile });
  const reqs = new Map(); let bytes = 0, fontBytes = 0, imgBytes = 0, count = 0, failed = [];
  const orig = tab.ws.onmessage;
  tab.ws.onmessage = (e) => {
    orig(e);
    const m = JSON.parse(e.data);
    if (m.method === "Network.requestWillBeSent" && !m.params.request.url.startsWith("data:")) { count++; reqs.set(m.params.requestId, m.params.request.url); }
    if (m.method === "Network.responseReceived") { const r = reqs.get(m.params.requestId); if (r) reqs.set(m.params.requestId, { url: r, type: m.params.type }); }
    if (m.method === "Network.loadingFinished") {
      const r = reqs.get(m.params.requestId); const b = m.params.encodedDataLength; bytes += b;
      const type = r && r.type, url = r && (r.url || r);
      if (type === "Font" || /\.woff2?(\?|$)/.test(url || "")) fontBytes += b; else if (type === "Image") imgBytes += b;
    }
    if (m.method === "Network.loadingFailed") failed.push(reqs.get(m.params.requestId));
  };
  await tab.cmd("Network.enable");
  await tab.cmd("Network.setCacheDisabled", { cacheDisabled: true });
  if (c.slow) {
    await tab.cmd("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await tab.cmd("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  await tab.cmd("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVER });
  const t0 = Date.now();
  await tab.cmd("Page.navigate", { url: BASE + PATH });
  await tab.waitFor('document.readyState==="complete"', 90000);
  const loadMs = Date.now() - t0;
  await sleep(c.slow ? 5000 : 2500); // bắt các shift muộn (daily.js, /api/lobby, font swap)
  const v = await tab.ev("JSON.parse(JSON.stringify(window.__vitals))");
  const extra = await tab.ev(`({ overflow: document.documentElement.scrollWidth - innerWidth, lobby: (document.getElementById("roomStatus")||{}).textContent || "" })`);
  if (OUT && run === 0) await tab.shot(join(OUT, `${c.name}.png`));
  const res = { case: c.name, run, cls: +v.cls.toFixed(4), lcp: v.lcp, lcpEl: v.lcpEl, fcp: v.fcp, kb: Math.round(bytes / 1024), fontKb: Math.round(fontBytes / 1024),
    imgKb: Math.round(imgBytes / 1024), requests: count, loadMs, overflow: extra.overflow, lobby: extra.lobby, errors: tab.errors.slice(0, 5), failed: failed.filter(Boolean).slice(0, 5),
    shifts: v.shifts.filter((s) => s.v >= 0.01).slice(0, 8) };
  tab.close();
  await chrome.cmd("Target.disposeBrowserContext", { browserContextId: ctx });
  return res;
}

const chrome = await launchChrome();
const all = [];
try {
  for (const c of CASES) for (let i = 0; i < RUNS; i++) { const r = await measure(chrome, c, i); all.push(r); console.log(JSON.stringify(r)); }
} finally { chrome.close(); }
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const summary = CASES.map((c) => { const rs = all.filter((r) => r.case === c.name);
  return { case: c.name, clsMax: Math.max(...rs.map((r) => r.cls)), cls: rs.map((r) => r.cls), lcpMed: med(rs.map((r) => r.lcp)), fcpMed: med(rs.map((r) => r.fcp)),
    kbMed: med(rs.map((r) => r.kb)), fontKbMed: med(rs.map((r) => r.fontKb)), imgKbMed: med(rs.map((r) => r.imgKb)), reqMed: med(rs.map((r) => r.requests)) }; });
console.log("SUMMARY " + JSON.stringify(summary, null, 1));
