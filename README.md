## NineBall — Ứng dụng quản lý và xếp hạng Billiards (Pool)

Đây là một ứng dụng front-end đơn giản dùng để quản lý người chơi, giải đấu, trận đấu và lịch sử điểm (Elo / điểm tích lũy) cho bộ môn billiards (ví dụ dạng 9-ball). Ứng dụng được tổ chức theo các trang (pages) tách riêng, có các tính năng tạo giải, lưu lịch sử trận đấu, bộ đếm điểm (score counter) cho trận đấu đơn/đôi và trang thống kê/biểu đồ.

Nội dung README tóm tắt nhanh cấu trúc, cách chạy và một vài lưu ý khi phát triển.

## Tính năng chính
- Xem bảng xếp hạng (Rankings).
- Quản lý giải đấu (Tournaments): tạo, xem chi tiết, kết thúc giải và cấp điểm cho người chơi.
- Ghi lại lịch sử trận đấu (Match History) và tính điểm Elo / điểm nhận được.
- Score Counter: bộ đếm điểm cho trận đấu (hỗ trợ singles/doubles và chế độ "race to").
- Trang chi tiết người chơi với thống kê (số trận, tỉ lệ thắng, lịch sử điểm) và biểu đồ.
- Trang thống kê tổng quan (Overall) với biểu đồ lịch sử điểm của tất cả người chơi.

## Công nghệ
- HTML, CSS (Tailwind CDN dùng trong các trang)
- JavaScript (module-based): các file `pages/*/*.js`, `app.js`, `data.js`
- Chart.js cho các biểu đồ
- PWA manifest (có `manifest.json`) — app có cấu hình để dùng như một ứng dụng độc lập

## Cấu trúc thư mục chính
- `index.html` — entry point, chứa nav và vùng `#app` để load các trang động.
- `app.js` — router động, load html/css/js cho từng page và gọi hàm `render()` trong module page.
- `data.js` — module toàn cục quản lý `poolData` (players, tournaments, matchHistory, history_point, history_points_den) và helper API (fetch/create/update/delete).
- `pages/` — mỗi trang có 3 file: `{page}.html`, `{page}.css`, `{page}.js`.
  - `rankings/` — trang bảng xếp hạng.
  - `tournaments/` — danh sách giải và form tạo giải.
  - `tournament_details/` — chi tiết 1 giải, quản lý trận, end tournament.
  - `tourDen_ongoing/` — chế độ "Đền" đang diễn ra (mâm 3-6-9), xử lý tính điểm theo rack.
  - `score_counter/` — bộ đếm điểm khi thi đấu (race to / lưu localStorage và có thể lưu lên server).
  - `match_history/` — trang lịch sử trận đấu, bộ lọc, phân trang.
  - `player_details/` — trang chi tiết người chơi + biểu đồ.
  - `overall/` — trang tổng quan / slideshow + biểu đồ tất cả người chơi.

Ngoài ra có: `style.css`, `manifest.json`, `data.js`, `app.js`, và thư mục `images/` chứa ảnh dùng trong giao diện.

## Hướng dẫn chạy (local)
1. Mở thư mục dự án trong trình duyệt: cách đơn giản nhất là mở `index.html` bằng trình duyệt (double-click), nhưng một số trình duyệt chặn `fetch` file từ hệ file — do đó nên chạy một HTTP server tạm thời.

Ví dụ dùng Python (Windows PowerShell):

```powershell
# vào thư mục chứa project
cd "c:\Users\Laptop\Desktop\Billards"
# chạy HTTP server (Python 3.x)
python -m http.server 8000
# sau đó mở http://localhost:8000 trong trình duyệt
```

2. Ứng dụng dùng fetch để load `pages/{page}/{page}.html` và import module JS, nên cần server (hoặc mở file nhưng có thể gặp lỗi CORS/file fetch).

## Lưu ý quan trọng về cấu hình và bảo mật
- `data.js` chứa cấu hình API (BASE URL và key). Hiện tại repository có chứa khóa (SECRET_KEY) hard-coded trong file `data.js`. Đây là rủi ro bảo mật lớn nếu repo công khai — khuyến nghị:
  - Không commit khóa bí mật (secret) vào kho mã. Thay bằng cách dùng biến môi trường (trong backend) hoặc một server-proxy an toàn.
  - Nếu cần test local, di chuyển giá trị khóa ra file cục bộ không được commit (ví dụ `.env`), hoặc dùng mock data.

## Luồng dữ liệu (tóm tắt nhanh)
- `data.js` tải các bảng từ API (players, tournaments, match-history, history_point, history_points_den) và điền vào `poolData`.
- Khi `poolData` sẵn sàng, `app.js` lắng nghe event `poolDataReady` rồi gọi router để load trang hiện tại, import module page và gọi `render({ id })` nếu page cần param `id`.

## Gợi ý cải thiện (nhỏ, có giá trị)
- Di chuyển API keys ra chỗ an toàn (server). Nếu muốn làm PWA thật, cập nhật service worker & caching.
- Thêm file README từng page (hoặc comment) mô tả contract các module page: export `render({ id })`.
- Viết test đơn vị cho các helper (ví dụ parse date, tính tổng điểm) nếu chuyển sang Node/npm project.
- Refactor `data.js` để không export SECRET_KEY; dùng các method rõ ràng hơn cho mock vs production.

## Muốn tôi làm gì tiếp theo?
- Tôi có thể: giúp tách config API ra file `.env` + hướng dẫn để không commit; hoặc tạo một script dev (npm + lite-server) để chạy local; hoặc tạo file CONTRIBUTING.md. Hãy cho biết bạn muốn ưu tiên phần nào.

---
File này được tạo tự động bằng công cụ hỗ trợ. Nếu cần bổ sung phần giới thiệu hay thay đổi ngôn ngữ/chi tiết, nói tôi biết để tôi cập nhật.
