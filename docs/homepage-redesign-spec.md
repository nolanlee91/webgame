# Dac ta Tai thiet ke Bo cuc Homepage: Webgame Portal (Lum Keo)
**Tai lieu:** Homepage Redesign Specification (Ban de xuat duy nhat)  
**Nguoi lap:** Gehihi (UX/UI Designer)  
**Trang thai:** De xuat trinh Chu du an phe duyet truoc khi lap trinh  
**Ngay:** 17/11/2026  
**Nguyen tac chi dao:** Premium Detailed Pixel Art x Clear Visual Hierarchy x Social Gaming (Spatial UX)

---

## 1. Chan doan 6 van de cua Homepage hien tai & Nguyen tac giai quyet

Tu ma nguon prototype/homepage/ va anh chup thuc te, cac han che cot loi gom:
1. **Visual Hierarchy mat can doi:** Card Hero (Dao Vang) chiem toi 2/3 be ngang nhung chi dong vai tro "to hon", trong khi 4 card ben canh va 18 card ben duoi co cung mot trong so thi giac, gay canh tranh su chu y lan nhau.
2. **Qua tai chi tiet, thieu khoang nghi (Breathing Room):** Moi o game deu nhet day tranh Pixel Art nhieu mau, thieu cac mang dem (solid panels, khoang cach nhip dieu) khien mat nguoi dung bi moi.
3. **Multiplayer & Loi vao "Choi cung ban" bi giau nhem:** Loi vao phong bi nhet len thanh header bang mot o input be xiu hoac icon mo nhat, lam mat di ban sac "Dau Tri / Cong game ru ban".
4. **Danh muc duoi day bi vun va chim:** 18 o game xep san sat 4:3 ben duoi tao cam giac nhu mot kho file anh catalog chu khong phai mot sanh game co to chuc.
5. **UI Kit chua dong bo voi Art Bible V5:** Van con dung gradient mem (linear-gradient), bong do mo va vien go don dieu thay vi cau truc Bevel 3D Pixel dut khoat nhu o Co Ca Ngua (board-v5 / hud.css).

---

## 2. Phuong an Bo cuc Tong the: "The Grand Arcade Lobby" (Sanh Dau Song Dong)

Phuong an chia trang chu thanh **4 tang thi giac ro rang**, moi tang co mot nhiem vu chuc nang va mat do thong tin rieng biet:

```
+----------------------------------------------------------------------------------------+
| [HEADER] Logo Pixel "LUM KEO" | Search game... | [+ Tao phong] [Key Nhap ma phong]     |
+----------------------------------------------------------------------------------------+
| TANG 1: THE ARENA HERO & MULTIPLAYER HUB (Trung tam So tai & Game Tieu diem)           |
| +-------------------------------------------+ +--------------------------------------+ |
| | [COT TRAI - 60%]: GAME TIEU DIEM TUAN     | | [COT PHAI - 40%]: SANH CHO REALTIME  | |
| | - Artwork dai canh 16:9 sac net (Co Ca    | | - The PIN noi bat: [ Nhap ma phong ] | |
| |   Ngua / Dao Vang)                        | | - 3 Phong mo dang thieu nguoi:       | |
| | - Tag: Dang so tai (4 nguoi)              | |   * Co Ca Ngua #492 (3/4) [Vao ngay] | |
| | - CTA Vang: [ PLAY NOW - 1 CLICK ]        | |   * Co Caro #108 (1/2)    [Vao ngay] | |
| | - Stat: "1.248 dau thu dang online"       | | - Nut CTA Xanh: [ + TAO PHONG MOI ]  | |
| +-------------------------------------------+ +--------------------------------------+ |
+----------------------------------------------------------------------------------------+
| TANG 2: JUMP BACK IN / PHONG CUA BAN (Chi hien khi co lich su choi - Cao 80px)         |
| [Vua choi]: [Co Caro (Van 3)]  [Dao Vang ($1200)]  [Noi Thu (Man 4)] -> Nho gon, em mat|
+----------------------------------------------------------------------------------------+
| TANG 3: BO SUU TAP THEO CHU DE & KHOANG NGHI (The Curated Shelves)                     |
| +------------------------------------------------------------------------------------+ |
| | [Tab Chu De Pixel]: [TAT CA (18)]  [RU BAN DAU (8)]  [TRI TUE]  [GIAI DO]          | |
| +------------------------------------------------------------------------------------+ |
| | DONG 1: GAME DOI KHANG DONG NGUOI (Featured Row - 4 Card lon co badge phong):      | |
| | [ Co Ca Ngua ]    [ Co Caro ]    [ Dat Bom ]    [ Noi Tu ]                         | |
| | (Card co preview ban co + tag so nguoi choi noi bat)                               | |
| +------------------------------------------------------------------------------------+ |
| | DONG 2: THU THACH DON & GIAI TRI NHANH (Grid 6 cot - Nho gon, icon ro net):        | |
| | [Pikachu] [Dao Vang] [2048] [Ban Bong] [Xep Gach] [Sudoku]...                      | |
| +------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------+
| TANG 4: FOOTER & NHA TAI TRO (Gan ket tu nhien, khong che khuat)                       |
| - Mini-banner SpeakUp Kids Pixel hoa hai hoa - Ban quyen & Tuy chon am thanh portal    |
+----------------------------------------------------------------------------------------+
```

---

## 3. Dac ta Chi tiet Tung Khu vuc & Co che Visual Hierarchy

### 3.1. Header: Dua "Tao phong / Vao phong" thanh hanh dong bac 1 (Primary Action)
- **Van de cu:** Nut "Vao phong" dung o text nho xiu chim trong header.
- **Xu ly moi:**
  - Nut **[+ Tao phong]** (Mau xanh ngoc `--px-teal`, vien noi pixel bevel).
  - Nut **[Nhap ma]** (Mau vang `--px-gold`, bam vao mo popup PIN pad 6 so chuan retro).
  - Thanh tim kiem co dan thong minh, dung icon kinh lup pixel 16px.

### 3.2. Tang 1: The Arena Hero & Multiplayer Hub (Xoa bo su don doc cua Hero cu)
- **Khac biet cot loi:** Thay vi 1 anh Dao Vang khong lo dung canh 4 card nho vo nghia, Tang 1 la **su doi thoai giua 1 Tua Game Tieu Diem va Sanh Cho Cong Dong**.
- **Cot Trai (60%): Featured Spotlight Game:**
  - Khong chi de anh to, ma co tieu de ro rang: *Tua game cua tuan*.
  - Hien thi thong so song dong: *Dang dien ra 84 tran dau | 4 nguoi choi*.
  - Nut Primary CTA: `[ PLAY NOW ]` voi hieu ung dap noi `--px-drop` va mau vang `--px-gold` ruc ro nhat man hinh.
- **Cot Phai (40%): Live Lobby Board (Bang Sanh Cho Truc Tiep):**
  - Dong khung theo chuan **Cabinet Frame** go soi vien doi (`--px-panel: #1d1a16`).
  - Danh sach 3 phong choi cong khai dang mo realtime (Game name, so nguoi `[2/4]`, ten chu phong, nut `[Vao]` mau xanh).
  - Day chinh la linh hon cua cong game phong cach Dau Tri: kich thich nguoi dung click tham gia ngay van dau cua nguoi khac ma khong can dan do tim kiem.

### 3.3. Tang 2: "Jump Back In" (Khoang nghi & Giu chan nguoi choi cu)
- **Vi tri nhip dieu:** Nam kep giua sanh dau nao nhiet va kho game ben duoi.
- **Quy cach:** Chieu cao chi 80px, nen toi tron diu mat (`#141b20`), cac the game mini 1:1 goc bo pixel cat 4px.
- **Tac dung UX:** Tao khoang nghi thi giac (visual rest) sau khu vuc Hero nhieu chi tiet, dong thoi cho phep nguoi choi quay lai van dau vua thoat voi 1 click.

### 3.4. Tang 3: The Curated Shelves (To chuc Kho Game 18 Tro Choi)
- **Xoa bo luoi 18 card dong dang:** Thay vi dan hang ngang 18 card giong het nhau, phan thanh **2 cap do the**:
  1. **Nhom Doi Khang Diem Nhan (4 Game):** Card kho trung binh (3:2), hien thi huy hieu Multiplayer, so phong dang mo va nut ru ban.
  2. **Nhom Thu Vien Toc Do (14 Game):** Dang luoi Compact Grid (4:3 hoac o vuong), nhan manh vao **Icon Pixel dac trung** (qua bom, con ran, khoi gach, trai keo) de nhan dien tu xa, giam thieu chu thua.
- **Tab Bo loc lien khoi (Segmented Tabs):**
  - Khung vien pixel cat goc, tab dang chon noi go vang/xanh bevel ro rang theo Art Bible V5.

---

## 4. Ung dung Chuan Pixel UI Design System (Theo Art Bible V5)

Bao dam toan bo trang chu tuan thu triet de tai lieu `docs/art-bible-v5.md` vua duoc duyet:
- **Khung & Panel:** Toan bo vien la net thang 2px-3px den co hoc (`--px-line: #0a0807`), goc cat bac thang pixel 3px (cut-corner), do bong cung offset 4px/4px khong blur (`--px-drop`).
- **Nut bam haptic:** Nut khi hover sang go tren (`inset 0 2px 0 rgba(255,255,255,0.15)`), khi click lun xuong dung 3px, triet tieu bong do, tao cam giac co hoc nhu bam ban phim co hoac nut may arcade.
- **Typography:**
  - Tieu de khu vuc: Font `Roboto Slab` dam chat bang hieu retro.
  - Nhan nut, so phong, thong so: Font `Be Vietnam Pro` sac net, de doc tren di dong.
  - Tuyet doi cam font pixel gia cay cho van ban dai.

---

## 5. Toi uu Da nen tang (Desktop vs Mobile)

- **Desktop (>= 1024px):**
  - Cot doi Tang 1 hien thi song song (Featured Game 60% + Lobby Board 40%).
  - Luoi game cap duoi tu dong co gian 4-6 cot thoang dang.
- **Mobile (< 768px - Trong tam thi truong VN):**
  - Cot doi Tang 1 xep doc: Hero Game rut gon chieu cao, ngay ben duoi la thanh dai ngang **[+ Tao phong] [Nhap PIN]** co lon (ngon cai cham de dang).
  - Bang phong cho thu thanh 1 carousel vuot ngang 1 cham.
  - Luoi game hien thi 2 cot hoac 3 cot mini icon, loai bo hoan toan cac doan mo ta dai dong, uu tien thumbnail nhan dien nhanh.

---
*Ban dac ta nay da san sang de Chu du an xem xet va phe duyet truoc khi chuyen giao cho Dev hien thuc hoa giao dien.*
