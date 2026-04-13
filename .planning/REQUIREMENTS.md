# Requirements: Hệ thống Quản lý Kho Thiết Bị Công Ty

**Defined:** 2026-04-14
**Core Value:** Quản trị viên kho có thể biết ngay thiết bị nào đang ở đâu, ai đang dùng, và trạng thái tài chính liên quan — để không bao giờ mất dấu tài sản công ty.

## v1 Requirements

### Authentication (AUTH)

- [ ] **AUTH-01**: Admin có thể đăng nhập bằng username và password
- [ ] **AUTH-02**: Phiên đăng nhập được duy trì qua browser refresh (session persistence)
- [ ] **AUTH-03**: Hệ thống ghi lại nhật ký mọi thao tác ghi (audit trail): ai, làm gì, lúc nào, giá trị cũ/mới

### Quản lý Thiết bị (EQP)

- [ ] **EQP-01**: Admin có thể thêm thiết bị với đầy đủ thông tin (tên, serial, danh mục, ngày mua, giá mua, ghi chú)
- [ ] **EQP-02**: Admin có thể upload ảnh cho thiết bị và xem ảnh trên trang chi tiết
- [ ] **EQP-03**: Admin có thể sửa và xóa thông tin thiết bị
- [ ] **EQP-04**: Admin có thể quản lý danh mục thiết bị (thêm/sửa/xóa: IT, Văn phòng, Công nghiệp...)
- [ ] **EQP-05**: Admin có thể tìm kiếm thiết bị theo tên/serial và lọc theo trạng thái/danh mục/phòng ban
- [ ] **EQP-06**: Mỗi thiết bị hiển thị trạng thái hiện tại: Trong kho / Đang bàn giao / Trong dự án / Bảo trì / Đã thanh lý

### Nhà cung cấp (SUP)

- [ ] **SUP-01**: Admin có thể quản lý nhà cung cấp (thêm/sửa/xóa): tên, địa chỉ, thông tin liên hệ
- [ ] **SUP-02**: Nhà cung cấp được liên kết với phiếu nhập kho

### Nhập Kho (IMP)

- [ ] **IMP-01**: Admin có thể tạo phiếu nhập kho từ nhà cung cấp (NCC, danh sách thiết bị, đơn giá, số lượng, số hóa đơn, ngày nhập)
- [ ] **IMP-02**: Hệ thống tự động tạo bản ghi thiết bị khi phiếu nhập được xác nhận
- [ ] **IMP-03**: Admin có thể ghi nhận thanh toán cho NCC (số tiền đã trả, ngày thanh toán, số tiền còn nợ)
- [ ] **IMP-04**: Admin có thể xem lịch sử tất cả phiếu nhập, lọc theo khoảng thời gian

### Nhân viên & Phòng ban (EMP)

- [ ] **EMP-01**: Admin có thể quản lý nhân viên (thêm/sửa/xóa): tên, phòng ban, liên hệ
- [ ] **EMP-02**: Admin có thể quản lý phòng ban (thêm/sửa/xóa)

### Bàn giao cho Nhân viên (ASNE)

- [ ] **ASNE-01**: Admin có thể tạo phiếu bàn giao thiết bị cho nhân viên (thiết bị, nhân viên, ngày bàn giao, tình trạng khi bàn giao, ghi chú)
- [ ] **ASNE-02**: Admin có thể ghi nhận nhân viên hoàn trả thiết bị (ngày trả, tình trạng khi trả)
- [ ] **ASNE-03**: Admin có thể ghi nhận thu tiền phạt khi thiết bị hoàn trả bị hư hỏng (số tiền phạt, ngày thu, mô tả hư hỏng)

### Cấp thiết bị cho Dự án (PROJ)

- [ ] **PROJ-01**: Admin có thể quản lý dự án (thêm/sửa/xóa): tên, mô tả, ngày bắt đầu/kết thúc
- [ ] **PROJ-02**: Admin có thể tạo phiếu cấp thiết bị cho dự án (danh sách thiết bị, dự án, ngày cấp)
- [ ] **PROJ-03**: Admin có thể ghi nhận thiết bị hoàn trả từ dự án về kho (ngày trả, tình trạng)

### Bảo trì & Thanh lý (MAINT)

- [ ] **MAINT-01**: Admin có thể ghi nhận sự cố/sửa chữa thiết bị (ngày, mô tả, chi phí sửa, kỹ thuật viên)
- [ ] **MAINT-02**: Admin có thể đặt ngày bảo trì định kỳ tiếp theo cho thiết bị
- [ ] **MAINT-03**: Hệ thống hiển thị danh sách thiết bị đến hạn hoặc quá hạn bảo trì
- [ ] **MAINT-04**: Admin có thể ghi nhận thanh lý thiết bị (ngày thanh lý, giá bán, lý do)

### Tài chính (FIN)

- [ ] **FIN-01**: Hệ thống tổng hợp tổng chi phí mua thiết bị (theo NCC, theo danh mục, theo khoảng thời gian)
- [ ] **FIN-02**: Hệ thống tổng hợp tổng doanh thu từ thanh lý thiết bị
- [ ] **FIN-03**: Hệ thống tổng hợp tổng tiền phạt hư hỏng đã thu từ nhân viên
- [ ] **FIN-04**: Hệ thống hiển thị bảng tổng kết tài chính (tổng chi phí vs tổng doanh thu)

### Báo cáo & Dashboard (RPT)

- [ ] **RPT-01**: Admin xem Dashboard với KPI cards: tổng thiết bị, đang bàn giao, đang bảo trì, giá trị tồn kho
- [ ] **RPT-02**: Admin xem báo cáo tồn kho hiện tại (số lượng theo danh mục và trạng thái)
- [ ] **RPT-03**: Admin xem báo cáo lịch sử xuất/nhập lọc theo khoảng thời gian
- [ ] **RPT-04**: Admin xem báo cáo thiết bị đang sử dụng phân theo phòng ban
- [ ] **RPT-05**: Admin xem lịch sử bàn giao của một thiết bị cụ thể (ai đã dùng và khi nào)
- [ ] **RPT-06**: Admin có thể xuất bất kỳ báo cáo nào ra file Excel
- [ ] **RPT-07**: Admin có thể xuất bất kỳ báo cáo nào ra file PDF

---

## v2 Requirements

### Authentication

- **AUTH-V2-01**: Admin có thể tự đổi mật khẩu
- **AUTH-V2-02**: Hỗ trợ đăng nhập qua Active Directory / SSO

### Thiết bị

- **EQP-V2-01**: Import hàng loạt thiết bị qua file CSV/Excel
- **EQP-V2-02**: Scan mã QR/barcode để tra cứu thiết bị
- **EQP-V2-03**: Theo dõi ngày hết hạn bảo hành

### Bàn giao

- **ASNE-V2-01**: In phiếu bàn giao PDF có chữ ký

### Báo cáo

- **RPT-V2-01**: Phân tích tài sản chưa được sử dụng (nằm kho quá N ngày)
- **RPT-V2-02**: Biểu đồ xu hướng (thiết bị nhập theo tháng, bảo trì theo quý)

### Kho

- **WH-V2-01**: Hỗ trợ nhiều kho / chi nhánh

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cổng tự phục vụ cho nhân viên (self-service portal) | Tăng gấp đôi độ phức tạp; quy trình do Admin thao tác |
| Tích hợp Active Directory / SSO | Phụ thuộc hạ tầng IT; đăng nhập độc lập là đủ cho v1 |
| Ứng dụng mobile native | Admin dùng desktop; web-app đáp ứng đủ |
| Khấu hao tài sản tự động | Thuộc phạm vi ERP/kế toán; không phải hệ thống vận hành |
| Tích hợp ERP / phần mềm kế toán | Phức tạp, đặc thù từng công ty; xuất Excel thay thế |
| Nhiều kho / chi nhánh | Chỉ 1 kho trung tâm trong v1 |
| IoT / theo dõi vị trí thời gian thực | Ngoài phạm vi; cập nhật thủ công đủ dùng |
| Quản lý bản quyền phần mềm | Domain khác; có thể ghi chú thủ công vào trường ghi chú |
| QR code / barcode | Cần phần cứng; defer sang v2 |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| EQP-04 | Phase 1 | Pending |
| SUP-01 | Phase 1 | Pending |
| EMP-02 | Phase 1 | Pending |
| EQP-01 | Phase 2 | Pending |
| EQP-02 | Phase 2 | Pending |
| EQP-03 | Phase 2 | Pending |
| EQP-05 | Phase 2 | Pending |
| EQP-06 | Phase 2 | Pending |
| EMP-01 | Phase 2 | Pending |
| PROJ-01 | Phase 2 | Pending |
| SUP-02 | Phase 3 | Pending |
| IMP-01 | Phase 3 | Pending |
| IMP-02 | Phase 3 | Pending |
| IMP-03 | Phase 3 | Pending |
| IMP-04 | Phase 3 | Pending |
| ASNE-01 | Phase 4 | Pending |
| ASNE-02 | Phase 4 | Pending |
| ASNE-03 | Phase 4 | Pending |
| PROJ-02 | Phase 4 | Pending |
| PROJ-03 | Phase 4 | Pending |
| MAINT-01 | Phase 5 | Pending |
| MAINT-02 | Phase 5 | Pending |
| MAINT-03 | Phase 5 | Pending |
| MAINT-04 | Phase 5 | Pending |
| FIN-01 | Phase 5 | Pending |
| FIN-02 | Phase 5 | Pending |
| FIN-03 | Phase 5 | Pending |
| FIN-04 | Phase 5 | Pending |
| RPT-01 | Phase 6 | Pending |
| RPT-02 | Phase 6 | Pending |
| RPT-03 | Phase 6 | Pending |
| RPT-04 | Phase 6 | Pending |
| RPT-05 | Phase 6 | Pending |
| RPT-06 | Phase 6 | Pending |
| RPT-07 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-13 after roadmap creation — traceability complete*
