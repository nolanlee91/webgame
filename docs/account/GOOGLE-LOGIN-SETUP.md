# Bật đăng nhập Google cho Lụm Kèo: hướng dẫn cho chủ dự án

Code đã chạy sẵn trên bản thật nhưng **nút Google tự ẩn** cho tới khi Supabase bật nhà cung cấp Google. Làm đủ 4 bước dưới đây là nút
"Lưu tiến độ bằng Google" hiện ra trong ô hồ sơ (avatar + tên, góc trên trang chủ). Không cần deploy lại.

> **Không dán Client Secret, service key hay mật khẩu vào chat với agent.** Secret chỉ đi thẳng từ Google Cloud sang ô nhập trong
> Supabase. Agent không cần biết các giá trị này.

Cần chuẩn bị:
- `<project-ref>`: mã project Supabase, là phần đầu của Project URL `https://<project-ref>.supabase.co`
  (Supabase → Project Settings → General → Project ID, hoặc xem biến `SUPABASE_URL` trên Railway).
- Tài khoản Google dùng để quản lý (nên là tài khoản của dự án, không phải tài khoản cá nhân).

---

## Bước 1. Google Cloud: màn hình xin quyền (OAuth consent screen)

1. Vào <https://console.cloud.google.com/>, tạo project mới (ví dụ `lumkeo-auth`) hoặc chọn project có sẵn.
2. Menu ☰ → **APIs & Services** → **OAuth consent screen** (giao diện mới tên là **Google Auth Platform**). Bấm **Get started**.
3. **App information**
   - App name: `Lụm Kèo`
   - User support email: email hỗ trợ của dự án
4. **Audience**: chọn **External** (người chơi là bất kỳ ai có tài khoản Google).
5. **Contact information**: email nhận thông báo từ Google. Đồng ý điều khoản → **Create**.
6. **Branding** (menu trái):
   - Application home page: `https://lumkeo.com`
   - Application privacy policy link: `https://lumkeo.com/homepage/quyen-rieng-tu.html`
   - Authorized domains: thêm `lumkeo.com` và `supabase.co`
   - **Không tải logo lên.** Có logo thì Google bắt xét duyệt (vài ngày đến vài tuần). Không logo thì dùng được ngay.
   - **Save**.
7. **Data access** → **Add or remove scopes**: chỉ tick 3 quyền cơ bản, không thêm gì khác:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`

   Đây là quyền "không nhạy cảm" nên không cần Google xét duyệt. **Update** → **Save**.
8. **Audience** → mục Publishing status → bấm **Publish app** → Confirm. Trạng thái phải là **In production**.
   Nếu để "Testing" thì chỉ những email trong danh sách Test users đăng nhập được, người chơi khác bị chặn.

## Bước 2. Google Cloud: tạo Web client

1. **APIs & Services** → **Credentials** (hoặc Google Auth Platform → **Clients**) → **Create credentials** → **OAuth client ID**.
2. Application type: **Web application**. Name: `Lụm Kèo web`.
3. **Authorized JavaScript origins** → Add URI:
   - `https://lumkeo.com`
   - (tuỳ chọn, để thử trên máy dev) `http://localhost:8991`
4. **Authorized redirect URIs** → Add URI (đúng một dòng, thay `<project-ref>`):
   - `https://<project-ref>.supabase.co/auth/v1/callback`

   Lưu ý: redirect URI ở đây là địa chỉ **của Supabase**, không phải lumkeo.com. Google trả về Supabase, Supabase mới chuyển về lumkeo.com.
5. **Create**. Google hiện **Client ID** và **Client secret**. Để cửa sổ này mở (hoặc tải JSON về máy), dùng ở bước 3.
   Không gửi hai giá trị này cho ai.

## Bước 3. Supabase: bật Google, khai báo địa chỉ quay về, bật Manual linking

Vào <https://supabase.com/dashboard> → chọn project của Lụm Kèo.

1. **Authentication** → **Sign In / Providers** (tên cũ: Providers) → **Google**:
   - Bật **Enable Sign in with Google**.
   - **Client IDs**: dán Client ID từ bước 2.
   - **Client Secret (for OAuth)**: dán Client secret từ bước 2.
   - Ô "Callback URL (for OAuth)" Supabase hiện sẵn phải trùng với redirect URI đã nhập ở bước 2.4.
   - Để nguyên "Skip nonce checks" (tắt). **Save**.
2. Vẫn trong **Authentication** → **Sign In / Providers**, mục **User Signups** (hoặc **Authentication → Settings**):
   - **Allow anonymous sign-ins**: phải **đang bật** (người chơi mới vẫn vào bằng tài khoản ẩn danh như trước).
   - **Allow manual linking**: **bật**. Thiếu bước này thì bấm "Lưu tiến độ bằng Google" sẽ báo
     "Tính năng lưu bằng Google chưa bật xong" (lỗi `manual_linking_disabled`). **Save**.
3. **Authentication** → **URL Configuration**:
   - **Site URL**: `https://lumkeo.com/homepage/`
   - **Redirect URLs** → **Add URL**, thêm:
     - `https://lumkeo.com/**`
     - (tuỳ chọn, máy dev) `http://localhost:8991/**`
   - **Save**. Thiếu dòng `https://lumkeo.com/**` thì sau khi chọn tài khoản Google, người chơi bị đưa về Site URL thay vì trang
     đang mở (vẫn đăng nhập được vì trang chủ tự xử lý, nhưng mất vị trí đang xem).

## Bước 4. Kiểm tra

**4a. Supabase đã bật Google chưa** (không lộ gì: anon key là khoá công khai, trang web nào cũng gửi):
mở trình duyệt, vào `https://<project-ref>.supabase.co/auth/v1/settings?apikey=<SUPABASE_ANON_KEY>`.
Phải thấy `"google": true` trong mục `"external"`. Anon key xem ở biến `SUPABASE_ANON_KEY` trên Railway hoặc
Supabase → Project Settings → API Keys (publishable key).

**4b. Thử luồng thật trên lumkeo.com** (nên dùng cửa sổ ẩn danh để bắt đầu như người chơi mới):
1. Mở `https://lumkeo.com`, bấm ô hồ sơ (avatar + tên). Phải thấy nút **Lưu tiến độ bằng Google**.
   - Không thấy nút: đóng hẳn cửa sổ ẩn danh, mở lại (trang nhớ kết quả "Google tắt" trong một phiên trình duyệt), rồi xem lại 4a.
2. Chơi một Thử thách (ví dụ Đố Vui `?daily=1`) để có điểm trên bảng.
3. Bấm **Lưu tiến độ bằng Google** → chọn tài khoản Google → quay về trang chủ. Popover tự mở:
   **"✓ Đã lưu bằng Google · ab•••@gmail.com"** và "Xong! Tên và điểm của bạn đã được lưu." Thanh địa chỉ không còn `?code=`.
4. Supabase → **Authentication → Users**: người dùng này giờ có provider **google** và email, **UID không đổi** so với lúc ẩn danh
   (nên điểm vẫn của họ).
5. Máy/trình duyệt khác: mở lumkeo.com → ô hồ sơ → **Đã lưu ở máy khác? Đăng nhập** (hoặc bấm "Lưu tiến độ bằng Google", trang sẽ
   báo tài khoản đã lưu trước đó và mời **Đăng nhập bằng Google**) → xác nhận → chọn cùng tài khoản. Tên hiển thị đổi về tên đã lưu,
   hạng hôm nay hiện đúng.
6. Bấm **Đăng xuất** → xác nhận. Máy đó quay về tên khách mới; máy kia vẫn đăng nhập (đăng xuất chỉ trên máy đang dùng).

**4c. Lỗi hay gặp**

| Thấy gì | Nguyên nhân | Sửa |
|---|---|---|
| Google báo `Error 400: redirect_uri_mismatch` | Redirect URI ở bước 2.4 sai | Phải đúng `https://<project-ref>.supabase.co/auth/v1/callback`, không có `/` cuối |
| Google báo "Access blocked" / "This app is blocked" | App còn ở Testing, hoặc có logo chưa duyệt | Bước 1.8 Publish app; gỡ logo |
| Popover báo "Tính năng lưu bằng Google chưa bật xong" | Manual linking tắt | Bước 3.2 |
| Quay về trang chủ thay vì trang đang mở | Thiếu Redirect URL | Bước 3.3 thêm `https://lumkeo.com/**` |
| "Tài khoản Google này đã lưu tiến độ trước đó" | Đúng thiết kế: Google đó đã gắn với người chơi khác (máy cũ) | Bấm "Đăng nhập bằng Google" |

## Xoá tài khoản khi người chơi yêu cầu

Trang Quyền riêng tư hứa xoá trong 7 ngày khi người chơi gửi yêu cầu **từ chính email Google đó**.
Supabase → **Authentication → Users** → tìm theo email → **Delete user**. Profile và điểm của người đó tự xoá theo
(`on delete cascade`, xem `docs/accounts/README.md`).

## Tóm tắt kỹ thuật (cho dev)

- Dò Google: trình duyệt gọi `GET {SUPABASE_URL}/auth/v1/settings` (header `apikey` = anon key), đọc `external.google`; nhớ trong
  `sessionStorage` (`wgp.google.v1`). Tắt / lỗi ⇒ không hiện gì. Chỉ hỏi khi người chơi mở ô hồ sơ.
- Lưu tiến độ = `supabase.auth.linkIdentity({ provider: "google" })` trên phiên ẩn danh ⇒ cùng user id. Luồng PKCE
  (`flowType: "pkce"`), quay về `?code=` ⇒ `exchangeCodeForSession` ⇒ dọn URL (`history.replaceState`).
- Máy mới: `identity_already_exists` ⇒ `signInWithOAuth` (có pxConfirm cảnh báo mất tiến độ khách) ⇒ lấy tên từ
  `GET /api/account/me` (profiles.name). Tên Google thật không bao giờ thành tên hiển thị.
- Đăng xuất = `signOut({ scope: "local" })` + tên khách tự sinh mới; lần gửi điểm sau tự tạo người dùng ẩn danh mới.
- Code: `prototype/games/_shared/account.js` (mục "Google"), `prototype/homepage/profile.js`. Chi tiết: `docs/audits/fixes/D6-google.md`.
