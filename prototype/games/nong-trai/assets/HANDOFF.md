# Bàn giao sprite Nông Trại

Bộ ảnh pixel V5 dùng góc nhìn từ trên xuống 3/4, ánh sáng từ trên trái, viền tối một pixel cho cây, và không có chữ. Ba ảnh được tạo bằng ImageGen tích hợp, sau đó tách và xếp lại theo lưới đích. Prompt nằm trong `generation-prompts.json`.

| Tệp | Kích thước | Cách đọc |
|---|---|---|
| `crops.png` | 256 × 320, RGBA | 4 cột × 5 hàng, mỗi khung 64 × 64 |
| `tiles.webp` | 256 × 64, RGB WebP lossless | 4 ô 64 × 64, sát nhau, không có gutter |
| `icons.png` | 128 × 32, RGBA | 4 icon 32 × 32, nền trong suốt |

Hàng cây từ trên xuống gồm **Rau Muống, Cà Rốt, Bắp, Bí Đỏ, Dưa Hấu**. Cột từ trái sang phải gồm **Hạt vừa gieo, Mầm, Đang lớn, Chín**. Tọa độ nguồn là `(cột × 64, hàng × 64)`. Neo cục bộ là **(32, 56)**, đo theo mép pixel, và hàng pixel cuối cùng có hình là **y = 55**. Các khung cây có 8 hàng pixel trong suốt phía dưới để đặt thanh tiến độ.

Atlas địa hình từ trái sang phải gồm **đất khô có luống, đất đã tưới, cỏ A, cỏ B**. Mép đối diện khớp pixel trong từng cặp đất và cỏ khi xếp lặp. Chuyển từ đất sang cỏ thể hiện ranh giới vật liệu. Atlas icon từ trái sang phải gồm **đồng xu, giọt nước, sao XP, túi hạt giống**.

`asset-manifest.json` liệt kê tọa độ nguồn, thứ tự và neo cho từng khung. `sha256.json` chứa SHA-256 của ba ảnh giao. Khi hiển thị phóng to, dùng nearest-neighbor để giữ cạnh pixel.
