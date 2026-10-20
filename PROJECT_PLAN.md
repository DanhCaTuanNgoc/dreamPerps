Chương trình **dreamDEX Perps Builder Bounty** là một cuộc đua kép về **Tốc độ** (Feedback Track) và **Chiều sâu kỹ thuật + Viral** (MVP Track). Vì sự kiện đã bắt đầu từ ngày 19/10 (hôm nay là 20/10) và ngân sách $1,500 cho Feedback hoạt động theo cơ chế **"Ai báo cáo trước ăn trước - Hết tiền là dừng"**, bạn cần một chiến thuật kết hợp cả hai track thành một quy trình duy nhất: **Dùng quá trình xây dựng hệ thống tự động của MVP để càn quét bug cho Feedback Track.**

---

## 1. Giải phẫu Đề bài & Các "Điểm mù" Chiến thuật

| Tiêu chí | Chi tiết quan trọng | Chiến thuật khai thác tối đa |
| --- | --- | --- |
| **Cơ chế Feedback ($1,500 Pool)** | $40/bug (Critical/Major), $15/bug (Normal). Trả theo thứ tự báo cáo đầu tiên. Hết quỹ $1,500 là dừng. | **Đánh phủ đầu trong 72h đầu tiên (20/10 - 23/10).** Không đợi làm xong MVP mới viết report. Tìm thấy lỗi nào, đẩy lên GitHub/submit ngay lập tức để khóa quyền ưu tiên (First-come, first-served). |
| **Cơ chế MVP (3 giải x $500)** | Giải ngân 2 đợt: $300 khi thắng giải, $200 khi chạy đặt lệnh thật trên Mainnet (trong 30 ngày sau launch). | Sản phẩm phải có **kiến trúc sẵn sàng cho Mainnet** (quản lý Private Key an toàn, cấu hình RPC động, kiểm soát rủi ro/slippage chặt chẽ) để lấy trọn $200 sau cùng và gây ấn tượng mạnh với giám khảo về tính thực tiễn. |
| **Yếu tố Cộng điểm (Bonus)** | Tích hợp **Somnia Primitives** (`Reactivity` hoặc `Somnia Agents`) + Có vòng lặp sử dụng lại (Repeat-use loop) hoặc Viral. | Đây là **vũ khí chí mạng** để lọt Top 3. Đa số thí sinh chỉ dùng REST API/SDK cơ bản. Nếu bạn gắn `Somnia Reactivity` (phản ứng sự kiện on-chain tức thời) vào một AI Agent, bài thi sẽ vượt trội hoàn toàn. |
| **Quản lý Vốn Testnet (`USDso`)** | Ví Perps Arena bị giới hạn tiền hàng tuần. Ví xin thêm quỹ (Bounty Account) bị giám sát, cấm chuyển tiền sang Arena. | **Tách biệt hoàn toàn 2 ví ngay từ đầu:**<br>

<br>• **Ví 1 (Arena Wallet):** Dùng cho MVP để show lịch sử giao dịch chuẩn chỉnh.<br>

<br>• **Ví 2 (Bounty Stress-test Wallet):** Xin thêm `USDso` trên Discord với lý do *"Chạy Automated Fuzzing & High-Frequency Stress Test cho SDK"*, dùng ví này để bắn lệnh liên tục tìm bug. |

---

## 2. Chiến lược Track 1: "Săn" Tối Đa Bug ($40/Hit)

Để ăn trọn các khoản $40 (Critical/Major) và lấp đầy bằng các khoản $15 (Normal), đừng test thủ công bằng giao diện web. Hãy viết một **Bộ kịch bản Kiểm thử Tự động (Automated Fuzzing & Stress-test Suite)** bằng Node.js đánh thẳng vào SDK và API.

### A. Tấn công vào SDK & API (Mục tiêu: Lỗi $40 - Critical/Major)

Các sàn Perps mới trên Testnet thường gặp lỗi nặng ở phần đồng bộ trạng thái (State Sync) giữa Off-chain Orderbook/API và On-chain Contracts:

1. **Race Conditions (Đua lệnh đồng thời):** Dùng `Promise.all()` bắn cùng lúc 10-20 lệnh `Place Order` và `Cancel Order` trong cùng một mili-giây trên cùng một mức ký quỹ (Margin). Kiểm tra xem API có trả về lỗi 500, âm số dư khả dụng, hoặc tạo ra các "Orphan Orders" (lệnh kẹt trên UI nhưng đã hủy dưới contract) hay không.
2. **Boundary & Precision Fuzzing (Lỗi làm tròn số học):**
* Gửi khối lượng lệnh (Size) hoặc giá (Price) với số thập phân cực lẻ (ví dụ: `0.000000000000000001` hoặc vượt quá `uint256` / giới hạn `tickSize` và `stepSize`).
* Đặt đòn bẩy (Leverage) ở mức biên (ví dụ: `0.99x`, `100.01x`, số âm, hoặc `NaN`). Nếu SDK không chặn ở tầng Client mà để lọt xuống API/Contract gây Revert không rõ nguyên nhân -> **Báo cáo lỗi SDK Validation**.


3. **Desync giữa WebSocket và REST API:** Mở kết nối WebSocket lắng nghe Orderbook/Position, đồng thời xả lệnh Market lớn. So sánh dữ liệu trả về từ WS và endpoint GET của REST API xem có độ trễ hoặc lệch dữ liệu (Stale Data) không.
4. **Cơ chế Thanh lý (Liquidation) & Funding Rate:** Mở vị thế đòn bẩy tối đa sát giá thanh lý. Quan sát cách hệ thống xử lý khi giá chạm ngưỡng: SDK có emit đúng sự kiện không? Phí Funding tính toán lúc giao thời có khớp với công thức trong Docs không?

### B. Tấn công vào Docs & Developer Experience (Mục tiêu: Lỗi $15 - Nhanh, dễ ăn)

* **Chạy thử 100% Code Snippets trong Docs:** Copy toàn bộ code mẫu từ `Somnia Markets SDK docs` và `dreamDEX bot kit` chạy thử. Bất kỳ dòng code nào báo lỗi thiếu thư viện, sai tên hàm (deprecated method), sai kiểu dữ liệu trả về (TypeScript type mismatch), hoặc thiếu biến môi trường -> Gom thành từng file Markdown riêng biệt.
* **Kiểm tra Error Codes:** Khi gọi API sai tham số, nếu API chỉ trả về lỗi chung chung như `{"error": "Internal Server Error"}` hoặc `{"code": 400}` mà không nói rõ trường nào sai -> Báo cáo lỗi **Missing Descriptive Error Messages in API**.

### C. Quy trình xuất bản Báo cáo Chuẩn "Auto-Accept"

Giám khảo chỉ trả tiền khi họ **tái hiện (reproduce) được lỗi nhanh chóng**. Trong mỗi file `feedback/issue-XX.md`, hãy đính kèm một đoạn script ngắn gọn (khoảng 15 dòng code Node.js) để giám khảo chỉ cần copy-paste và chạy `node reproduce.js` là thấy lỗi ngay lập tức.

---

## 3. Chiến lược Track 2: Xây dựng Sản phẩm Phái sinh Đỉnh Nhất (MVP)

Để thắng giải MVP ($500) và khiến đội ngũ dreamDEX muốn viết bài phân tích kỹ thuật (Technical Breakdown) trên X, sản phẩm của bạn phải giải quyết cả 3 bài toán: **Đúng hệ sinh thái (Somnia Primitives) + Hữu ích cho Trader + Có tính Viral trên X**.

### Ý tưởng Đề xuất (Top Pick): **"DreamPulse AI" – Autonomous Reactive Perps Agent & Liquidation Shield**

Một nền tảng kết hợp giữa **AI Trading Agent**, **Công cụ bảo vệ vị thế tự động (Dựa trên Somnia Reactivity)** và **Trạm phát tín hiệu trực tiếp lên X (Viral Loop)**.

#### Kiến trúc 3 Мо-đun Cốt lõi:

1. **Mô-đun 1: Reactive Liquidation Shield (Ăn điểm Somnia Primitives)**
* **Vấn đề:** Trader đánh Perps sợ nhất là bị râu nến quét thanh lý (Liquidation) khi đang ngủ hoặc mạng lag không kịp bơm thêm giáp (Margin).
* **Giải pháp:** Tích hợp **Somnia Reactivity** để lắng nghe biến động giá on-chain và tỷ lệ ký quỹ (Margin Ratio) theo thời gian thực ở cấp độ block. Ngay khi vị thế rơi vào vùng nguy hiểm (ví dụ: cách giá thanh lý 2%), Agent tự động kích hoạt lệnh giảm một phần vị thế (Partial Close) hoặc nạp thêm Margin từ quỹ dự phòng trong tích tắc mà không cần chờ polling qua REST API truyền thống.


2. **Mô-đun 2: Natural Language / One-Click Strategy Execution (Ăn điểm AI Agent & Trader Tool)**
* Cho phép người dùng (hoặc chính bạn khi demo) nhập lệnh bằng ngôn ngữ tự nhiên hoặc chọn chiến thuật phức tạp (ví dụ: *"Grid Trading biên độ 5% với tự động dời Trailing Stop"* hoặc *"Săn Funding Rate lệch pha"*).
* Hệ thống chuyển hóa thành chuỗi lệnh qua `dreamDEX SDK` và `dreamBot Builder`, hiển thị trực quan trên một Dashboard Next.js thời gian thực (vẽ biểu đồ PnL, độ trễ RPC, lịch sử khớp lệnh kèm link TxHash trên Somnia Tokyo Explorer).


3. **Mô-đun 3: "Proof-of-Alpha" Viral X Card Generator (Ăn điểm Repeat-use & Communication)**
* Đề bài yêu cầu đăng 2-3 bài X tag `@DreamDEXSomnia` và đánh giá cao khả năng tạo **Viral Loop**.
* Tích hợp tính năng tự động xuất ra một **Thẻ hình ảnh PnL / Báo cáo cứu thua (Liquidation Saved Card)** cực đẹp ngay trên giao diện mỗi khi Agent thực hiện thành công một pha giao dịch hoặc cứu một lệnh khỏi thanh lý, kèm nút **"Share to X"** gắn sẵn TxHash, thông số tốc độ xử lý của Somnia, và tag `@DreamDEXSomnia`.



---

## 4. Kế hoạch Hành động 12 Ngày (20/10 – 01/11)

### Giai đoạn 1: Khởi động & Càn quét Bug Sớm (20/10 – 23/10) — *Ưu tiên Số 1*

* **Hành động ngay hôm nay (20/10):**
1. Vào Discord của dreamDEX hoặc Telegram SomniaHacks gửi email DoraHacks để **Whitelist** ngay lập tức.
2. Tham gia Perps Arena tại `app.testnet.dreamdex.io` để nhận `USDso` đợt đầu, đồng thời tạo ví thứ 2 và mở ticket xin cấp quỹ Bounty `USDso` để test tải nặng.
3. Khởi tạo GitHub Repo chuẩn cấu trúc có sẵn thư mục `feedback/`.


* **Ngày 21/10 - 23/10 (Săn tiền thưởng Feedback):**
* Viết bộ script Node.js kết nối toàn bộ các hàm trong `Somnia Markets SDK` và `dreamDEX API`.
* Chạy Fuzzing test (như mục 2A & 2B). Đặt mục tiêu tìm ra **10 - 15 lỗi** (ít nhất 5 lỗi Major/Critical về logic đặt lệnh, tính toán margin, hoặc lỗi SDK crash) và đẩy liên tục lên thư mục `feedback/`.



### Giai đoạn 2: Xây dựng Core MVP & Tích hợp Somnia Primitives (24/10 – 27/10)

* Tận dụng chính bộ khung code đã dùng để test SDK ở Giai đoạn 1, nâng cấp thành **Backend Engine** (Node.js/TypeScript) cho bot giao dịch.
* Tích hợp **Somnia Reactivity / Somnia Agents** để xử lý luồng sự kiện on-chain.
* Cho Bot chạy liên tục (24/7) trên ví MVP để tạo ra **hàng trăm Transaction Hashes thực tế** trên Somnia Tokyo Testnet (bằng chứng thép cho mục *Evidence of building*).
* **Đăng bài X số 1 (Ngày 25/10):** Chia sẻ quá trình stress-test SDK, số lượng giao dịch bot đã xử lý thành công trên Somnia Tokyo testnet, kèm ảnh chụp màn hình terminal/logs và tag `@DreamDEXSomnia`.

### Giai đoạn 3: Hoàn thiện UI, Viral Loop & Đóng gói (28/10 – 01/11)

* Xây dựng giao diện Dashboard (Next.js + Tailwind CSS) hiển thị trực quan trạng thái của Agent, danh sách vị thế đang mở, lịch sử các pha "Cứu thanh lý" và bảng thống kê hiệu suất.
* **Đăng bài X số 2 (Ngày 29/10):** Đăng video demo ngắn (60 giây) quay cảnh Agent tự động phản ứng với biến động thị trường và đặt lệnh trực tiếp trên dreamDEX.
* **Đăng bài X số 3 (Ngày 31/10):** Tổng hợp kiến trúc kỹ thuật (Technical Thread) giải thích cách kết hợp `dreamDEX SDK` với `Somnia Reactivity`, đính kèm link GitHub và bản Live Demo.
* **Ngày 01/11 (Trước 23:59 UTC):** Rà soát toàn bộ file `README.md` (đảm bảo có đủ hướng dẫn cài đặt, giải thích giá trị sản phẩm, danh sách TxHash tiêu biểu, và link tới 3 bài X) cùng toàn bộ các file báo cáo trong `feedback/`, sau đó bấm Submit trên DoraHacks.