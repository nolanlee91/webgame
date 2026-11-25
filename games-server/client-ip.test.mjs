import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { clientIp, isCloudflare } = createRequire(import.meta.url)("./client-ip.js");

const req = (xff, cf, sock = "10.0.0.1") => ({ headers: { ...(xff ? { "x-forwarded-for": xff } : {}), ...(cf ? { "cf-connecting-ip": cf } : {}) }, socket: { remoteAddress: sock } });

test("dải Cloudflare v4 / v6 nhận đúng, IP thường không", () => {
  for (const ip of ["173.245.48.1", "104.16.0.0", "104.23.255.255", "172.71.10.5", "162.159.1.1", "::ffff:198.41.200.3", "2606:4700::6810:84e5", "2a06:98c7:1::1"]) assert.ok(isCloudflare(ip), ip);
  for (const ip of ["1.1.1.1", "8.8.8.8", "104.32.0.1", "113.161.1.1", "2001:db8::1", "", "abc", "999.1.1.1"]) assert.ok(!isCloudflare(ip), ip);
});

test("không tin proxy ⇒ IP socket", () => {
  assert.equal(clientIp(req("1.2.3.4", "5.6.7.8"), false), "10.0.0.1");
});

test("tin proxy, không qua Cloudflare ⇒ phần tử cuối X-Forwarded-For, bỏ CF-Connecting-IP giả", () => {
  assert.equal(clientIp(req("9.9.9.9, 113.161.1.1"), true), "113.161.1.1");
  assert.equal(clientIp(req("113.161.1.1", "6.6.6.6"), true), "113.161.1.1"); // gọi thẳng Railway, tự đặt header CF ⇒ bỏ qua
});

test("tin proxy, qua Cloudflare ⇒ CF-Connecting-IP", () => {
  assert.equal(clientIp(req("6.6.6.6, 172.70.1.2", "113.161.1.1"), true), "113.161.1.1");
  assert.equal(clientIp(req("2606:4700::1", "2405:4800::9"), true), "2405:4800::9");
  assert.equal(clientIp(req("172.70.1.2"), true), "172.70.1.2"); // thiếu header CF ⇒ IP hop
});

test("không có X-Forwarded-For ⇒ IP socket", () => {
  assert.equal(clientIp(req("", "1.2.3.4"), true), "10.0.0.1");
});
