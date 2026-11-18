// Tạo âm thanh riêng cho Ma Sói bằng tổng hợp sóng (không dùng mẫu/AI/dịch vụ trả phí) ⇒ WAV ⇒ OGG (cần ffmpeg).
// Chạy: node prototype/games/ma-soi/tools/make-sfx.mjs
// Các file dùng chung (thang/thua/buoc-nhay/trung-da/het-gio) chép từ bộ sfx sẵn có của Nối Từ/2048.
import { writeFileSync, copyFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '../assets/sfx');
const SR = 22050;
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1; // nhiễu có hạt giống ⇒ tạo lại ra y hệt

function render(sec, fn) {
  const n = Math.round(sec * SR), a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = fn(i / SR, i);
  let peak = 0; for (const x of a) peak = Math.max(peak, Math.abs(x));
  for (let i = 0; i < n; i++) a[i] = (a[i] / (peak || 1)) * 0.85;
  const fade = Math.min(n, SR * 0.02); for (let i = 0; i < fade; i++) a[n - 1 - i] *= i / fade; // không "bụp" cuối file
  return a;
}
function wav(a) {
  const b = Buffer.alloc(44 + a.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + a.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(a.length * 2, 40);
  for (let i = 0; i < a.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, a[i])) * 32767), 44 + i * 2);
  return b;
}
function save(name, a) {
  const w = join(OUT, name + '.wav');
  writeFileSync(w, wav(a));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', w, '-c:a', 'libvorbis', '-q:a', '3', join(OUT, name + '.ogg')]);
  unlinkSync(w); console.log('✔', name + '.ogg');
}
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

// Sói hú (vào đêm): sóng sin trượt cao độ lên rồi hạ, rung nhẹ, thêm hoạ âm + chút gió.
{ let ph = 0;
  save('hu-dem', render(2.2, (t) => {
    const k = Math.min(1, t / 0.55), f = (t < 0.55 ? 330 + 230 * Math.sin(k * Math.PI / 2) : 560 - 150 * ((t - 0.55) / 1.65) ** 1.4) * (1 + 0.012 * Math.sin(2 * Math.PI * 5.5 * t));
    ph += 2 * Math.PI * f / SR;
    const amp = Math.min(1, t / 0.25) * (t > 1.5 ? Math.max(0, 1 - (t - 1.5) / 0.7) : 1);
    return amp * (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)) + 0.05 * rnd() * amp;
  })); }

// Chiêng sáng (trời sáng): các hoạ âm không điều hoà tắt dần — tiếng chiêng/cồng làng.
save('chieng-sang', render(2.4, (t) => {
  const P = [[110, 1, 1.6], [221, .6, 1.1], [298, .45, .9], [415, .3, .6], [557, .2, .45], [702, .12, .3]];
  let s = 0; for (const [f, g, d] of P) s += g * Math.sin(2 * Math.PI * f * t * (1 + 0.004 * Math.exp(-t * 3))) * Math.exp(-t / d);
  return s * Math.min(1, t / 0.004) + 0.25 * rnd() * Math.exp(-t / 0.02);
}));

// Lật thẻ vai: tiếng "phạch" — nhiễu lọc thông thấp + tiếng gõ gỗ ngắn.
{ let lp = 0;
  save('lat-the', render(0.32, (t) => {
    lp += 0.35 * (rnd() - lp);
    const swish = lp * env(t, 0.06, 0.05) * 2.2;
    const knock = t > 0.1 ? Math.sin(2 * Math.PI * 520 * (t - 0.1)) * Math.exp(-(t - 0.1) / 0.03) : 0;
    return swish + 0.7 * knock;
  })); }

// Trống bỏ phiếu: hai tiếng trống da trầm (cao độ hạ nhanh).
save('trong-phieu', render(0.75, (t) => {
  let s = 0;
  for (const t0 of [0, 0.28]) if (t >= t0) { const u = t - t0; s += Math.sin(2 * Math.PI * (55 + 70 * Math.exp(-u * 18)) * u) * Math.exp(-u / 0.16) + 0.15 * rnd() * Math.exp(-u / 0.01); }
  return s;
}));

// Tin nhắn mới: hai nốt "tinh tinh" nhỏ, nhẹ.
save('tin-nhan', render(0.28, (t) => {
  const a = Math.sin(2 * Math.PI * 1175 * t) * Math.exp(-t / 0.05);
  const b = t > 0.09 ? Math.sin(2 * Math.PI * 1568 * (t - 0.09)) * Math.exp(-(t - 0.09) / 0.07) : 0;
  return (a + b) * Math.min(1, t / 0.003);
}));

for (const f of ['thang', 'thua', 'buoc-nhay', 'trung-da', 'het-gio']) { copyFileSync(join(HERE, '../../noi-tu/assets/sfx', f + '.ogg'), join(OUT, f + '.ogg')); console.log('↳ chép', f + '.ogg'); }
