# dreamDEX Perps Builder Bounty - Phân Tích Kỹ Thuật & Kế Hoạch Triển Khai

> **Tài liệu tham khảo chính:** [hackathon_details.md](hackathon_details.md)  
> **Thời gian:** 19/10/2026 – 01/11/2026 (Hạn chót: 01/11 lúc 23:59 UTC)  
> **Mạng triển khai:** Somnia Tokyo / Shannon Testnet (Chain ID: `50312`)

---

## 1. Tổng quan chương trình & Hai Track thi đấu

Chương trình **dreamDEX Perps Builder Bounty** là sự kiện dành cho developer nhằm stress-test API và SDK của sàn phái sinh dreamDEX trên mạng Somnia Testnet.

### 1.1. Track 1: Feedback Track (Quỹ thưởng $1,500)
- **Mục tiêu:** Tìm lỗi (bug), lỗi API/SDK, thiếu sót tài liệu (docs gaps) và tính năng còn thiếu.
- **Mức thưởng:**
  - **$40** cho mỗi issue Critical / Major được chấp nhận.
  - **$15** cho mỗi issue Normal được chấp nhận.
  - Cơ chế First-Come First-Served: Chỉ trả thưởng cho người báo cáo đầu tiên có thể tái hiện lỗi (reproducible).
- **Quy chuẩn lưu trữ:**
  - Mỗi issue là một file markdown riêng nằm trong thư mục `feedback/` của repository:
  ```markdown
  # Short title
  Severity: critical | major | normal
  Area: API | SDK | docs | app | contracts

  ## Steps to reproduce
  1. ...

  ## Expected
  ## Actual
  ## Evidence (Transaction hash, request/response, screenshots)
  ## Environment (SDK version, network, wallet address)
  ```
  - *Lỗ hổng bảo mật nghiêm trọng:* Gửi kín về `security@dreamdex.io`.

### 1.2. Track 2: MVP Track (3 giải x $500)
- **Mục tiêu:** Xây dựng một sản phẩm perps có giá trị thực tế (Trading bot, AI agent, Trader tool hoặc Consumer perps app).
- **Cơ cấu giải thưởng:** $300 khi công bố kết quả + $200 khi MVP chạy và phát sinh lệnh trên Mainnet trong 30 ngày sau launch. Kèm 1 bài technical breakdown trên tài khoản X của dreamDEX.
- **Yêu cầu kỹ thuật bắt buộc:**
  1. MVP phải thực hiện **đặt lệnh phái sinh thật (real perps orders)** trên Somnia Tokyo Testnet.
  2. README chuẩn: giải thích tính năng, đối tượng người dùng, hướng dẫn chạy chi tiết.
  3. README phải có mục **`X posts`** chứa liên kết đến 2 - 3 bài post trên X gắn thẻ `@DreamDEXSomnia`.
  4. *Điểm cộng:* Tận dụng các primitive của Somnia như Reactivity hoặc Somnia Agents.

---

## 2. Phân tích chi tiết 5 tài liệu & tài nguyên kỹ thuật

### 2.1. Perps on Testnet for Developers: Network, Contracts & SDK Setup
- **Tài liệu:** `https://app.testnet.dreamdex.io/docs/developers/perps-testnet`
- **Thông số mạng Somnia Testnet:**
  - Chain ID: `50312`
  - Native Token: `STT` (gas fee)
  - RPC URL: `https://dream-rpc.somnia.network` hoặc `https://api.infra.testnet.somnia.network`
  - WebSocket RPC: `wss://api.infra.testnet.somnia.network/ws`
  - Explorer: `https://shannon-explorer.somnia.network`
- **Smart Contracts kiến trúc:**
  - **CLOB Engine:** Hợp đồng sổ lệnh khớp lệnh on-chain (sub-10ms matching).
  - **MarginBank:** Hợp đồng quản lý tiền ký quỹ, trạng thái cross-margin, thanh lý và tính funding fee.
  - **Price Oracles:** Cung cấp index price từ on-chain EMA / Pyth feeds.

### 2.2. Perps on Testnet for Traders: Orders, Margin, Funding
- **Tài liệu:** `https://app.testnet.dreamdex.io/docs/trading/perps-testnet`
- **Cơ chế cốt lõi cần lưu ý khi viết bot:**
  - **Ký quỹ tập trung (MarginBank):** Perps **không** trừ token trực tiếp từ ví khi đặt lệnh. Trader/Bot phải gọi lệnh `depositMargin` chuyển stablecoin `USDso` vào `MarginBank`.
  - **Cross-Margin:** Tất cả vị thế perps dùng chung một bể ký quỹ MarginBank.
  - **Đòn bẩy:** Hỗ trợ lên đến 20x.
  - **Funding Rate & ADL:** Phí funding được trao đổi định kỳ giữa Long và Short. Cơ chế Auto-Deleveraging (ADL) tự động thanh lý giảm rủi ro hệ thống khi thị trường biến động quá mạnh.

### 2.3. dreamDEX Bot Kit: Perps Bot Examples & Strategies
- **Repository:** `https://github.com/somnia-chain/dreamdex-bot-kit`
- **Kiến trúc kit:**
  - Sử dụng TypeScript / Node.js.
  - Cung cấp sẵn các helper và chiến lược:
    1. `starter`: Quoting 2 chiều (Bid/Ask) cơ bản.
    2. `market-making`: Đặt lệnh quanh spread để nhận yield và zero fees.
    3. `grid`: Chiến lược giao dịch lưới (Grid Trading) mua thấp bán cao liên tục.
    4. `momentum`: Bot theo đà xu hướng giá.
    5. `mean-reversion`: Bot đảo chiều dựa trên Bollinger / RSI.
  - Hỗ trợ chế độ `dry-run` để test logic tính toán mà không tốn gas hoặc gửi lệnh lên chain.

### 2.4. dreamBot Builder & Link a Bot Guide
- **Web App:** `https://app.testnet.dreamdex.io/dreambot-builder`
- **Tính năng:**
  - Cung cấp giao diện Web UI trực quan để tinh chỉnh tham số bot (spread, kích thước vị thế, đòn bẩy, stop-loss).
  - Chức năng *Link a Bot* cho phép liên kết tài khoản bot đang chạy với Web UI để theo dõi PnL, volume, số lượng lệnh đã khớp trực quan.

### 2.5. Somnia Markets SDK Docs (`@somnia-chain/markets-sdk`)
- **NPM Package:** `@somnia-chain/markets-sdk` (v0.32.x)
- **Tài liệu:** `https://prd.smk.somnia.host/docs/typescript`
- **Các API cốt lõi:**
  - `SomniaMarkets`: Lớp khởi tạo chính kết nối với mạng và ví.
  - Quản lý ký quỹ: `exchange.depositMargin(symbol, amount)`, `exchange.withdrawMargin(symbol, amount)`.
  - Quản lý lệnh: `exchange.createOrder(...)`, `exchange.cancelOrder(...)`.
  - Stream dữ liệu: `exchange.watchOrderBook(symbol)`, `exchange.watchPositions()`, `exchange.watchPrice(symbol)`.
  - Phân tích vị thế: `perpPositionAnalytics` tính PnL, giá thanh lý (liquidation price) và đòn bẩy hiệu dụng cục bộ (không tốn thêm RPC round-trips).

---

## 3. Kiến trúc dự án đề xuất cho MVP Track

Nhằm đáp ứng trọn vẹn tiêu chí của MVP Track và tối ưu hóa việc săn thưởng Feedback Track:

### 3.1. Ý tưởng sản phẩm: **Somnia dreamPerps Sentinel & Grid Agent**
Một hệ thống Bot giao dịch Perps đa chức năng kết hợp:
1. **Dynamic Grid & Momentum Trading Engine:** Tự động đặt lệnh perps trên Somnia Testnet với quản lý rủi ro (TP/SL, trailing stop).
2. **Margin & Funding Rate Sentinel:** Giám sát tỷ lệ an toàn của MarginBank, cảnh báo thanh lý, và theo dõi chênh lệch funding rate.
3. **Interactive CLI / Dashboard:** Hiển thị trực quan sổ lệnh real-time, vị thế mở, unrealized PnL và lịch sử tx hash.
4. **Tích hợp Feedback Logging tự động:** Bất cứ khi nào gặp lỗi từ RPC, SDK hoặc giao dịch bị revert, hệ thống ghi log chi tiết phục vụ việc đóng gói thành file báo cáo cho Feedback Track.

### 3.2. Cấu trúc thư mục dự án
```text
├── feedback/               # Nơi lưu trữ các bug/docs report theo đúng format yêu cầu
│   └── TEMPLATE.md         # Template chuẩn bị sẵn để tạo issue nhanh chóng
├── src/
│   ├── config/             # Cấu hình mạng, RPC, địa chỉ token & contracts
│   ├── services/           # Wrapper SomniaMarkets SDK (MarginBank, Order management, Oracles)
│   ├── strategies/         # Các chiến lược: Grid, Market Maker, Momentum, Sentinel
│   ├── utils/              # Formatter, Logger, Risk Calculator
│   └── index.ts            # Entrypoint chạy bot với CLI tương tác
├── package.json
├── tsconfig.json
├── .env.example
├── README.md               # Mô tả chi tiết, hướng dẫn chạy và phần X posts
└── ANALYSIS.md             # Bản phân tích này
```


