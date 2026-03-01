/**
 * @project AncestorTree
 * @file src/app/(main)/guide/page.tsx
 * @description Trang hướng dẫn sử dụng — static content page
 * @version 1.0.0
 * @updated 2026-03-01
 */

import {
  HelpCircle,
  UserPlus,
  GitBranchPlus,
  Users,
  BookUser,
  Calendar,
  ClipboardList,
  Trophy,
  BookOpen,
  ScrollText,
  RotateCcw,
  FileText,
  Settings,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function GuidePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          Hướng dẫn sử dụng
        </h1>
        <p className="text-muted-foreground">
          Tìm hiểu cách sử dụng các tính năng của gia phả điện tử Đào tộc —
          Ninh thôn.
        </p>
      </div>
      <Separator />

      {/* Roles overview */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h2 className="font-semibold text-lg">Phân quyền trên hệ thống</h2>
        <p className="text-sm text-muted-foreground">
          Mỗi tài khoản được gán một trong ba vai trò sau:
        </p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>
            <strong>Quản trị viên (Admin)</strong> — Toàn quyền: quản lý người
            dùng, duyệt đề xuất, thêm/sửa/xóa mọi dữ liệu.
          </li>
          <li>
            <strong>Biên tập viên (Editor)</strong> — Thêm/sửa/xóa thành viên,
            sự kiện, vinh danh, quỹ, hương ước, cầu đương. Có thể bị giới hạn
            phạm vi sửa trong một nhánh.
          </li>
          <li>
            <strong>Người xem (Viewer)</strong> — Xem tất cả thông tin công
            khai. Có thể gửi đề xuất chỉnh sửa để admin duyệt.
          </li>
        </ul>
      </div>

      {/* Feature guides */}
      <Accordion type="multiple" className="space-y-2">
        {/* 1. Getting started */}
        <AccordionItem value="getting-started" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Bắt đầu sử dụng</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>Để sử dụng hệ thống, bạn cần có tài khoản.</p>
            <div>
              <h4 className="font-medium mb-1">Đăng ký tài khoản</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Nhấn &quot;Đăng ký&quot; ở cuối thanh bên trái.</li>
                <li>
                  Nhập họ tên, email và mật khẩu. Mật khẩu cần ít nhất 6 ký tự.
                </li>
                <li>
                  Xác nhận email theo hướng dẫn trong thư được gửi đến hộp thư
                  của bạn.
                </li>
                <li>Đăng nhập bằng email và mật khẩu đã đăng ký.</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-1">Quên mật khẩu</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Tại trang đăng nhập, nhấn &quot;Quên mật khẩu?&quot;.</li>
                <li>Nhập email đã đăng ký.</li>
                <li>
                  Mở email và nhấn liên kết đặt lại mật khẩu rồi nhập mật khẩu
                  mới.
                </li>
              </ol>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Tài khoản mới mặc định có vai trò &quot;Người xem&quot;. Liên hệ
              quản trị viên nếu cần quyền biên tập.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Family Tree */}
        <AccordionItem value="tree" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <GitBranchPlus className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Cây gia phả</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>
              Hiển thị trực quan cây phả hệ dưới dạng sơ đồ. Mỗi thẻ gồm tên,
              năm sinh/mất, đời (thế hệ), chi, và trạng thái (Còn sống / Đã
              mất ☸).
            </p>
            <div>
              <h4 className="font-medium mb-1">Thao tác cơ bản</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>Di chuyển:</strong> Kéo chuột (hoặc vuốt trên điện
                  thoại) để dịch chuyển sơ đồ.
                </li>
                <li>
                  <strong>Phóng to/thu nhỏ:</strong> Cuộn chuột hoặc dùng nút
                  +/− ở góc màn hình.
                </li>
                <li>
                  <strong>Xem chi tiết:</strong> Nhấn vào thẻ thành viên để mở
                  hồ sơ.
                </li>
                <li>
                  <strong>Menu chuột phải:</strong> Nhấn chuột phải (hoặc nhấn
                  giữ trên điện thoại) vào thẻ để xem tùy chọn: đi đến cha/mẹ,
                  vợ/chồng, con cái, hoặc thêm thành viên mới.
                </li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-1">Bộ lọc</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>Chính tộc:</strong> Chỉ hiển thị con trai theo dòng
                  đích (patrilineal).
                </li>
                <li>
                  <strong>Đầy đủ:</strong> Hiển thị tất cả thành viên bao gồm
                  con gái, con dâu, con rể.
                </li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 3. Members */}
        <AccordionItem value="people" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Thành viên</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>Xem danh sách, tìm kiếm, và quản lý hồ sơ thành viên.</p>
            <div>
              <h4 className="font-medium mb-1">Tìm kiếm & lọc</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Gõ tên vào ô tìm kiếm để lọc nhanh.</li>
                <li>
                  Sử dụng bộ lọc: giới tính, còn sống/đã mất, đời (thế hệ),
                  chi.
                </li>
                <li>Nhấn vào thẻ thành viên để xem hồ sơ chi tiết.</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-1">
                Thêm / sửa thành viên{' '}
                <span className="text-xs text-amber-600">(Editor+)</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Nhấn nút &quot;Thêm thành viên&quot; trên trang danh sách.</li>
                <li>
                  Điền thông tin: họ tên, giới tính, năm sinh, năm mất, quê
                  quán, nghề nghiệp, tiểu sử.
                </li>
                <li>
                  Thiết lập quan hệ gia đình: chọn cha, mẹ, vợ/chồng.
                </li>
                <li>Tải lên ảnh đại diện nếu có (tối đa 5MB).</li>
                <li>Nhấn &quot;Lưu&quot; để hoàn tất.</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-1">Xem hồ sơ</h4>
              <p className="text-muted-foreground">
                Trang hồ sơ hiển thị đầy đủ thông tin cá nhân, quan hệ gia đình
                (cha mẹ, vợ/chồng, con cái, anh chị em), và thư viện ảnh.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Directory */}
        <AccordionItem value="directory" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <BookUser className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Danh bạ</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>
              Tra cứu thông tin liên lạc (số điện thoại, địa chỉ, email) của
              các thành viên còn sống.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Gõ tên vào ô tìm kiếm để tìm nhanh.</li>
              <li>
                Thông tin liên lạc tuân theo cấp độ quyền riêng tư: công khai,
                chỉ thành viên, hoặc riêng tư.
              </li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        {/* 5. Events */}
        <AccordionItem value="events" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Lịch cúng lễ</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>
              Xem lịch các ngày giỗ, lễ tết, và sự kiện quan trọng của dòng họ
              theo cả lịch dương và lịch âm.
            </p>
            <div>
              <h4 className="font-medium mb-1">Xem lịch</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Dùng mũi tên trái/phải để chuyển tháng.</li>
                <li>Ngày có sự kiện sẽ được đánh dấu trên lưới lịch.</li>
                <li>Nhấn vào ngày để xem chi tiết sự kiện.</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-1">
                Thêm sự kiện{' '}
                <span className="text-xs text-amber-600">(Editor+)</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Nhấn nút &quot;Thêm sự kiện&quot;.</li>
                <li>
                  Chọn loại sự kiện, nhập ngày (hỗ trợ cả ngày âm lịch), tiêu
                  đề và mô tả.
                </li>
                <li>Nhấn &quot;Lưu&quot; để thêm vào lịch.</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 6. Contributions */}
        <AccordionItem value="contributions" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Đề xuất chỉnh sửa</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>
              Tất cả thành viên đều có thể gửi đề xuất chỉnh sửa thông tin.
              Đề xuất sẽ được quản trị viên xem xét và phê duyệt.
            </p>
            <div>
              <h4 className="font-medium mb-1">Gửi đề xuất</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Vào trang &quot;Đề xuất&quot; từ thanh bên.</li>
                <li>
                  Nhấn &quot;Gửi đề xuất mới&quot; — chọn thành viên cần chỉnh sửa.
                </li>
                <li>
                  Chọn trường cần sửa (tên, số điện thoại, năm sinh, tiểu
                  sử...), nhập giá trị mới và lý do.
                </li>
                <li>Nhấn &quot;Gửi&quot; — đề xuất sẽ ở trạng thái &quot;Chờ duyệt&quot;.</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-1">Theo dõi trạng thái</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>Chờ duyệt:</strong> Đang chờ quản trị viên xem xét.
                </li>
                <li>
                  <strong>Đã duyệt:</strong> Thông tin đã được cập nhật.
                </li>
                <li>
                  <strong>Từ chối:</strong> Đề xuất không được chấp nhận (có ghi
                  chú lý do).
                </li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 7. Achievements */}
        <AccordionItem value="achievements" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Vinh danh</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>
              Tôn vinh các thành tích nổi bật của thành viên trong dòng họ.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>Học tập:</strong> Thành tích học hành, bằng cấp xuất
                sắc.
              </li>
              <li>
                <strong>Sự nghiệp:</strong> Thăng tiến, chức vụ, đóng góp nghề
                nghiệp.
              </li>
              <li>
                <strong>Cống hiến:</strong> Đóng góp cho dòng họ, cộng đồng.
              </li>
              <li>
                <strong>Khác:</strong> Các thành tích đặc biệt khác.
              </li>
            </ul>
            <p className="text-muted-foreground">
              Dùng ô tìm kiếm để tìm theo tên hoặc tiêu đề thành tích.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 8. Fund */}
        <AccordionItem value="fund" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Quỹ khuyến học</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>
              Theo dõi quỹ khuyến học của dòng họ: số dư, lịch sử thu/chi, và
              danh sách học bổng, khen thưởng.
            </p>
            <div>
              <h4 className="font-medium mb-1">Xem thông tin quỹ</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Số dư hiện tại hiển thị ở đầu trang.</li>
                <li>
                  Danh sách giao dịch ghi lại các khoản thu (đóng góp) và chi
                  (học bổng, khen thưởng).
                </li>
                <li>
                  Tab &quot;Học bổng&quot; liệt kê các suất đã cấp và đang chờ duyệt.
                </li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 9. Charter */}
        <AccordionItem value="charter" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Hương ước</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>
              Tập hợp các quy ước, gia huấn, và lời dặn dò của tiền nhân được
              số hóa.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>Gia huấn:</strong> Lời dạy của tổ tiên.
              </li>
              <li>
                <strong>Quy ước:</strong> Nội quy, quy định của dòng họ.
              </li>
              <li>
                <strong>Lời dặn con cháu:</strong> Di huấn, lời nhắn nhủ.
              </li>
            </ul>
            <p className="text-muted-foreground">
              Chọn danh mục từ bộ lọc để xem theo từng loại.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 10. Cau Duong */}
        <AccordionItem value="cau-duong" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Cầu đương</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>
              Phân công luân phiên trách nhiệm tổ chức cúng lễ hàng năm cho
              từng thành viên trong dòng họ.
            </p>
            <div>
              <h4 className="font-medium mb-1">Xem phân công</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Chọn năm để xem lịch phân công.</li>
                <li>
                  Mỗi lễ (Tết Nguyên Đán, Thanh Minh, Đoan Ngọ, Trung Thu, Giỗ
                  Tổ...) hiển thị người được phân công và trạng thái.
                </li>
                <li>
                  Danh sách thành viên đủ điều kiện được sắp xếp theo thứ tự
                  luân phiên.
                </li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-1">Trạng thái</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>Đã phân công:</strong> Đang chờ thực hiện.
                </li>
                <li>
                  <strong>Đã hoàn thành:</strong> Đã tổ chức xong.
                </li>
                <li>
                  <strong>Đã ủy quyền:</strong> Đã nhờ người khác thay.
                </li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 11. Documents */}
        <AccordionItem value="documents" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Tài liệu</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>Trung tâm tài liệu gia phả số hóa.</p>
            <div>
              <h4 className="font-medium mb-1">Gia phả sách</h4>
              <p className="text-muted-foreground">
                Xem toàn bộ gia phả dưới dạng sách có mục lục theo đời, chi.
                Hỗ trợ in hoặc lưu PDF bằng nút &quot;In / Lưu PDF&quot;.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Xuất GEDCOM</h4>
              <p className="text-muted-foreground">
                Tải file GEDCOM 5.5.1 — định dạng chuẩn quốc tế cho phả hệ. Có
                thể mở bằng các phần mềm gia phả khác như Gramps, Family Tree
                Maker.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 12. Admin */}
        <AccordionItem value="admin" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-600" />
              <span className="font-semibold">
                Quản trị{' '}
                <span className="text-xs text-amber-600">(Admin/Editor)</span>
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm space-y-3 pb-4">
            <p>
              Khu vực dành cho quản trị viên và biên tập viên. Mục &quot;Quản
              trị&quot; chỉ hiển thị trên thanh bên khi bạn có quyền.
            </p>
            <div>
              <h4 className="font-medium mb-1">Bảng điều khiển</h4>
              <p className="text-muted-foreground">
                Tổng quan nhanh: tổng thành viên, số đời, số chi, số gia đình.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Quản lý người dùng</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Xem danh sách tài khoản đã đăng ký với vai trò hiện tại.
                </li>
                <li>
                  Đổi vai trò (Admin / Editor / Viewer) bằng cách chọn từ menu
                  thả xuống.
                </li>
                <li>
                  Liên kết tài khoản với thành viên trong cây phả hệ — cho phép
                  tự sửa hồ sơ của mình.
                </li>
                <li>
                  Giới hạn phạm vi sửa cho editor: chỉ được sửa một nhánh
                  nhất định.
                </li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-1">Duyệt đề xuất</h4>
              <p className="text-muted-foreground">
                Xem các đề xuất chỉnh sửa từ thành viên, so sánh giá trị cũ —
                mới, rồi phê duyệt hoặc từ chối kèm ghi chú.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">
                Quản lý nội dung
              </h4>
              <p className="text-muted-foreground">
                Thêm/sửa/xóa: Vinh danh, Giao dịch quỹ, Học bổng, Hương ước,
                và phân công Cầu đương. Mỗi mục có trang quản lý riêng trong
                khu vực Admin.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer note */}
      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>
          Nếu bạn gặp khó khăn hoặc cần hỗ trợ thêm, vui lòng liên hệ quản
          trị viên của hệ thống.
        </p>
      </div>
    </div>
  );
}
