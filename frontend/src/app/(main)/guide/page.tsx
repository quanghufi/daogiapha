/**
 * @project AncestorTree
 * @file src/app/(main)/guide/page.tsx
 * @description Trang hướng dẫn sử dụng chi tiết — thiết kế thân thiện cho người lớn tuổi
 * @version 2.0.0
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
  MousePointer,
  Smartphone,
  Search,
  Eye,
  Printer,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/* ---------- Helper components ---------- */

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold shrink-0 mt-0.5">
        {n}
      </span>
      <span className="text-base leading-relaxed">{children}</span>
    </li>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
      <p className="text-base leading-relaxed text-emerald-900">
        <strong>Mẹo:</strong> {children}
      </p>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-base leading-relaxed text-amber-900">
        <strong>Lưu ý:</strong> {children}
      </p>
    </div>
  );
}

function Btn({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-sm font-semibold text-gray-800">
      {children}
    </kbd>
  );
}

function SectionIcon({
  icon: Icon,
  color = 'emerald',
}: {
  icon: React.ElementType;
  color?: 'emerald' | 'amber' | 'blue';
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colors[color]}`}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

/* ---------- Table of contents data ---------- */

const tocItems = [
  { id: 'getting-started', label: 'Bắt đầu sử dụng' },
  { id: 'tree', label: 'Cây gia phả' },
  { id: 'people', label: 'Thành viên' },
  { id: 'directory', label: 'Danh bạ' },
  { id: 'events', label: 'Lịch cúng lễ' },
  { id: 'contributions', label: 'Đề xuất chỉnh sửa' },
  { id: 'achievements', label: 'Vinh danh' },
  { id: 'fund', label: 'Quỹ khuyến học' },
  { id: 'charter', label: 'Hương ước' },
  { id: 'cau-duong', label: 'Cầu đương' },
  { id: 'documents', label: 'Tài liệu' },
  { id: 'admin', label: 'Quản trị (dành cho Admin)' },
];

/* ========== PAGE ========== */

export default function GuidePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      {/* ===== Header ===== */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-emerald-600" />
          Hướng dẫn sử dụng
        </h1>
        <p className="text-lg text-muted-foreground mt-2 leading-relaxed">
          Trang này giải thích chi tiết cách sử dụng từng tính năng của gia phả
          điện tử <strong>Đào tộc — Ninh thôn</strong>. Bạn có thể nhấn vào mục
          lục bên dưới để nhảy đến phần cần đọc.
        </p>
      </div>

      {/* ===== Roles overview ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">
            Các vai trò trên hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">
            Khi tạo tài khoản, bạn được gán một trong ba vai trò. Vai trò quyết
            định những gì bạn được phép làm:
          </p>

          <div className="space-y-3">
            <div className="rounded-lg border p-4">
              <p className="text-base leading-relaxed">
                <Badge className="mr-2">Quản trị viên</Badge>
                Có toàn quyền trên hệ thống: quản lý tài khoản người dùng,
                duyệt đề xuất chỉnh sửa, thêm/sửa/xóa toàn bộ dữ liệu gia
                phả.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-base leading-relaxed">
                <Badge variant="secondary" className="mr-2">
                  Biên tập viên
                </Badge>
                Được phép thêm, sửa, xóa thành viên, sự kiện, vinh danh, quỹ
                khuyến học, hương ước và phân công cầu đương. Có thể bị giới hạn
                chỉ sửa được một nhánh nhất định trong gia phả.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-base leading-relaxed">
                <Badge variant="outline" className="mr-2">
                  Người xem
                </Badge>
                Được xem tất cả thông tin công khai. Có thể gửi đề xuất chỉnh
                sửa (ví dụ: cập nhật số điện thoại, sửa năm sinh) để quản trị
                viên duyệt.
              </p>
            </div>
          </div>

          <Tip>
            Tài khoản mới đăng ký mặc định là &quot;Người xem&quot;. Nếu bạn cần quyền
            biên tập, hãy liên hệ quản trị viên để được nâng cấp.
          </Tip>
        </CardContent>
      </Card>

      {/* ===== Table of contents ===== */}
      <nav className="rounded-lg border bg-muted/40 p-5">
        <p className="font-bold text-lg mb-3">Mục lục</p>
        <ol className="space-y-2 columns-1 sm:columns-2">
          {tocItems.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-base text-emerald-700 hover:underline hover:text-emerald-900"
              >
                {i + 1}. {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Separator />

      {/* ===== 1. Getting started ===== */}
      <section id="getting-started">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={UserPlus} />
              1. Bắt đầu sử dụng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Register */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Đăng ký tài khoản</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Bạn cần tạo tài khoản để sử dụng hệ thống. Tài khoản giúp hệ
                thống nhận biết bạn là ai và hiển thị thông tin phù hợp.
              </p>
              <ol className="space-y-3">
                <Step n={1}>
                  Mở trang web, nhìn ở cuối thanh bên trái (sidebar) và nhấn
                  nút <Btn>Đăng ký</Btn>.
                </Step>
                <Step n={2}>
                  Nhập <strong>họ tên</strong> của bạn,{' '}
                  <strong>địa chỉ email</strong> (ví dụ:
                  tên@gmail.com), và <strong>mật khẩu</strong>. Mật khẩu cần
                  ít nhất 6 ký tự.
                </Step>
                <Step n={3}>
                  Mở hộp thư email của bạn, tìm thư từ hệ thống với tiêu đề
                  &quot;Xác nhận email&quot;. Nhấn vào đường liên kết trong thư
                  để xác nhận.
                </Step>
                <Step n={4}>
                  Quay lại trang web, nhấn <Btn>Đăng nhập</Btn>, nhập email và
                  mật khẩu đã đăng ký. Sau khi đăng nhập thành công, bạn sẽ
                  thấy tên mình ở cuối thanh bên trái.
                </Step>
              </ol>
            </div>

            <Separator />

            {/* Forgot password */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Quên mật khẩu</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Nếu bạn quên mật khẩu, có thể đặt lại mật khẩu mới qua email.
              </p>
              <ol className="space-y-3">
                <Step n={1}>
                  Tại trang đăng nhập, nhấn dòng chữ{' '}
                  <Btn>Quên mật khẩu?</Btn> phía dưới ô mật khẩu.
                </Step>
                <Step n={2}>
                  Nhập địa chỉ email đã đăng ký rồi nhấn{' '}
                  <Btn>Gửi</Btn>.
                </Step>
                <Step n={3}>
                  Mở hộp thư email, nhấn vào liên kết đặt lại mật khẩu, rồi
                  nhập mật khẩu mới.
                </Step>
              </ol>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== 2. Family Tree ===== */}
      <section id="tree">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={GitBranchPlus} />
              2. Cây gia phả
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-base leading-relaxed">
              Đây là tính năng chính của hệ thống — hiển thị sơ đồ cây phả hệ
              dưới dạng hình ảnh trực quan. Mỗi thành viên được hiển thị trên
              một thẻ (ô chữ nhật) nối với nhau bằng đường kẻ thể hiện quan hệ
              cha — con.
            </p>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h4 className="font-semibold text-base">
                Mỗi thẻ thành viên hiển thị:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-base leading-relaxed text-muted-foreground">
                <li>Họ tên đầy đủ</li>
                <li>Năm sinh — năm mất (nếu đã mất)</li>
                <li>Đời (thế hệ) thứ mấy và thuộc chi nào</li>
                <li>
                  Trạng thái:{' '}
                  <strong className="text-emerald-700">Còn sống</strong> hoặc{' '}
                  <strong className="text-amber-700">Đã mất ☸</strong>
                </li>
              </ul>
            </div>

            <Separator />

            {/* Desktop */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-muted-foreground" />
                Trên máy tính
              </h3>
              <ol className="space-y-3">
                <Step n={1}>
                  <strong>Di chuyển sơ đồ:</strong> Nhấn giữ chuột trái rồi kéo
                  để dịch chuyển sơ đồ sang trái, phải, lên, xuống.
                </Step>
                <Step n={2}>
                  <strong>Phóng to / thu nhỏ:</strong> Cuộn bánh xe chuột lên để
                  phóng to, cuộn xuống để thu nhỏ. Hoặc dùng nút{' '}
                  <Btn>+</Btn> <Btn>−</Btn> ở góc màn hình.
                </Step>
                <Step n={3}>
                  <strong>Xem hồ sơ:</strong> Nhấn chuột trái vào thẻ thành
                  viên bất kỳ để mở trang hồ sơ chi tiết của người đó.
                </Step>
                <Step n={4}>
                  <strong>Menu tùy chọn:</strong> Nhấn chuột phải vào thẻ thành
                  viên để hiện menu: đi đến cha/mẹ, đi đến vợ/chồng, xem con
                  cái, hoặc thêm con/vợ/chồng mới (nếu bạn có quyền biên tập).
                </Step>
              </ol>
            </div>

            <Separator />

            {/* Mobile */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                Trên điện thoại
              </h3>
              <ol className="space-y-3">
                <Step n={1}>
                  <strong>Di chuyển:</strong> Dùng một ngón tay vuốt trên màn
                  hình để dịch sơ đồ.
                </Step>
                <Step n={2}>
                  <strong>Phóng to / thu nhỏ:</strong> Dùng hai ngón tay chụm
                  lại để thu nhỏ, mở rộng hai ngón để phóng to.
                </Step>
                <Step n={3}>
                  <strong>Xem hồ sơ:</strong> Chạm vào thẻ thành viên để mở
                  trang hồ sơ.
                </Step>
                <Step n={4}>
                  <strong>Menu tùy chọn:</strong> Nhấn giữ (chạm và giữ lâu)
                  vào thẻ thành viên để hiện menu.
                </Step>
              </ol>
            </div>

            <Separator />

            {/* Filters */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Bộ lọc hiển thị</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Phía trên sơ đồ có nút chuyển đổi giữa hai chế độ:
              </p>
              <div className="space-y-2">
                <div className="rounded-lg border p-4">
                  <p className="text-base leading-relaxed">
                    <strong>Chính tộc:</strong> Chỉ hiển thị dòng đích — tức là
                    chỉ con trai nối dõi. Sơ đồ gọn hơn, dễ nhìn hơn.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-base leading-relaxed">
                    <strong>Đầy đủ:</strong> Hiển thị tất cả thành viên bao gồm
                    con gái, con dâu, con rể. Sơ đồ đầy đủ nhưng phức tạp hơn.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== 3. Members ===== */}
      <section id="people">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={Users} />
              3. Thành viên
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-base leading-relaxed">
              Trang danh sách tất cả thành viên trong dòng họ. Bạn có thể tìm
              kiếm, lọc theo nhiều tiêu chí, và nhấn vào từng người để xem hồ
              sơ chi tiết.
            </p>

            {/* Search & filter */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                Tìm kiếm và lọc
              </h3>
              <ol className="space-y-3">
                <Step n={1}>
                  Gõ tên người cần tìm vào ô tìm kiếm ở đầu trang. Danh sách
                  sẽ tự động lọc khi bạn gõ.
                </Step>
                <Step n={2}>
                  Dùng các bộ lọc bên dưới ô tìm kiếm để thu hẹp kết quả:{' '}
                  <strong>giới tính</strong> (nam/nữ),{' '}
                  <strong>còn sống hay đã mất</strong>,{' '}
                  <strong>đời thứ mấy</strong> (thế hệ), và{' '}
                  <strong>thuộc chi nào</strong>.
                </Step>
                <Step n={3}>
                  Nhấn vào thẻ của một thành viên để mở trang hồ sơ chi tiết
                  của người đó.
                </Step>
              </ol>
            </div>

            <Separator />

            {/* View profile */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                Xem hồ sơ thành viên
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Trang hồ sơ hiển thị đầy đủ thông tin của một người:
              </p>
              <ul className="list-disc list-inside space-y-1 text-base leading-relaxed text-muted-foreground">
                <li>Ảnh đại diện, họ tên, giới tính</li>
                <li>Năm sinh, năm mất, tuổi</li>
                <li>Quê quán, nơi ở, nghề nghiệp</li>
                <li>Tiểu sử, ghi chú</li>
                <li>
                  Quan hệ gia đình: cha, mẹ, vợ/chồng, con cái, anh chị em
                </li>
                <li>Thư viện ảnh (nếu có)</li>
              </ul>
            </div>

            <Separator />

            {/* Add / edit */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">
                Thêm hoặc sửa thành viên
              </h3>
              <Warning>
                Tính năng này chỉ dành cho <strong>Biên tập viên</strong> và{' '}
                <strong>Quản trị viên</strong>. Nếu bạn là Người xem, hãy gửi
                đề xuất chỉnh sửa (xem mục 6).
              </Warning>
              <ol className="space-y-3">
                <Step n={1}>
                  Tại trang danh sách thành viên, nhấn nút{' '}
                  <Btn>Thêm thành viên</Btn> ở góc trên.
                </Step>
                <Step n={2}>
                  Điền đầy đủ thông tin:{' '}
                  <strong>họ tên, giới tính, năm sinh</strong>. Các trường khác
                  (năm mất, quê quán, nghề nghiệp, tiểu sử) điền nếu biết.
                </Step>
                <Step n={3}>
                  Thiết lập quan hệ gia đình: chọn <strong>cha</strong>,{' '}
                  <strong>mẹ</strong>, hoặc <strong>vợ/chồng</strong> từ danh
                  sách.
                </Step>
                <Step n={4}>
                  Tải lên ảnh đại diện nếu có (kích thước tối đa 5MB). Nhấn
                  vào vùng ảnh để chọn file từ máy tính hoặc điện thoại.
                </Step>
                <Step n={5}>
                  Nhấn <Btn>Lưu</Btn> để hoàn tất. Thành viên mới sẽ xuất hiện
                  trên cây gia phả ngay lập tức.
                </Step>
              </ol>
              <Tip>
                Để sửa hồ sơ, mở trang hồ sơ của người đó rồi nhấn nút{' '}
                <Btn>Sửa</Btn> ở góc trên phải. Sau khi sửa xong, nhấn{' '}
                <Btn>Lưu</Btn>.
              </Tip>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== 4. Directory ===== */}
      <section id="directory">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={BookUser} />
              4. Danh bạ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base leading-relaxed">
              Danh bạ giúp bạn tra cứu <strong>số điện thoại, địa chỉ,
              email</strong> của các thành viên còn sống trong dòng họ — giống
              như một cuốn danh bạ điện thoại của gia đình.
            </p>
            <ol className="space-y-3">
              <Step n={1}>
                Nhấn <Btn>Danh bạ</Btn> trên thanh bên trái.
              </Step>
              <Step n={2}>
                Gõ tên vào ô tìm kiếm để tìm nhanh người cần liên lạc.
              </Step>
              <Step n={3}>
                Thông tin liên lạc (số điện thoại, địa chỉ) được hiển thị trực
                tiếp trên danh sách.
              </Step>
            </ol>
            <Warning>
              Một số thành viên có thể đặt thông tin ở chế độ riêng tư. Trong
              trường hợp đó, bạn sẽ không thấy số điện thoại hoặc địa chỉ của
              họ.
            </Warning>
          </CardContent>
        </Card>
      </section>

      {/* ===== 5. Events ===== */}
      <section id="events">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={Calendar} />
              5. Lịch cúng lễ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-base leading-relaxed">
              Xem lịch các <strong>ngày giỗ</strong>, lễ tết, và sự kiện quan
              trọng của dòng họ. Hệ thống hỗ trợ cả{' '}
              <strong>lịch dương</strong> (dương lịch) và{' '}
              <strong>lịch âm</strong> (âm lịch).
            </p>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Xem lịch</h3>
              <ol className="space-y-3">
                <Step n={1}>
                  Nhấn <Btn>Lịch cúng lễ</Btn> trên thanh bên trái.
                </Step>
                <Step n={2}>
                  Lưới lịch hiển thị tháng hiện tại. Dùng nút mũi tên{' '}
                  <Btn>&larr;</Btn> <Btn>&rarr;</Btn> để chuyển sang tháng
                  trước hoặc tháng sau.
                </Step>
                <Step n={3}>
                  Ngày có sự kiện được đánh dấu bằng chấm tròn. Nhấn vào ngày
                  đó để xem chi tiết sự kiện.
                </Step>
              </ol>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Thêm sự kiện mới</h3>
              <Warning>
                Chỉ <strong>Biên tập viên</strong> và{' '}
                <strong>Quản trị viên</strong> mới được thêm sự kiện.
              </Warning>
              <ol className="space-y-3">
                <Step n={1}>
                  Nhấn nút <Btn>Thêm sự kiện</Btn> phía trên lịch.
                </Step>
                <Step n={2}>
                  Chọn loại sự kiện, nhập ngày (có thể chọn ngày âm lịch),
                  tiêu đề và mô tả chi tiết.
                </Step>
                <Step n={3}>
                  Nhấn <Btn>Lưu</Btn>. Sự kiện sẽ xuất hiện trên lịch ngay.
                </Step>
              </ol>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== 6. Contributions ===== */}
      <section id="contributions">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={ClipboardList} />
              6. Đề xuất chỉnh sửa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-base leading-relaxed">
              Nếu bạn phát hiện thông tin sai hoặc thiếu (ví dụ: sai năm sinh,
              thiếu số điện thoại), bạn có thể gửi đề xuất chỉnh sửa. Quản trị
              viên sẽ xem xét và cập nhật giúp bạn.
            </p>
            <Tip>
              Tính năng này dành cho tất cả thành viên — kể cả Người xem.
              Không cần quyền biên tập!
            </Tip>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Cách gửi đề xuất</h3>
              <ol className="space-y-3">
                <Step n={1}>
                  Nhấn <Btn>Đề xuất</Btn> trên thanh bên trái.
                </Step>
                <Step n={2}>
                  Nhấn nút <Btn>Gửi đề xuất mới</Btn>.
                </Step>
                <Step n={3}>
                  Chọn thành viên cần chỉnh sửa thông tin từ danh sách.
                </Step>
                <Step n={4}>
                  Chọn trường cần sửa (ví dụ: họ tên, số điện thoại, năm sinh,
                  tiểu sử...) rồi nhập giá trị mới.
                </Step>
                <Step n={5}>
                  Ghi lý do đề xuất (ví dụ: &quot;Năm sinh ghi nhầm, đúng
                  phải là 1955&quot;).
                </Step>
                <Step n={6}>
                  Nhấn <Btn>Gửi</Btn>. Đề xuất sẽ ở trạng thái{' '}
                  <strong>&quot;Chờ duyệt&quot;</strong>.
                </Step>
              </ol>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Trạng thái đề xuất</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Sau khi gửi, bạn có thể theo dõi kết quả trên trang Đề xuất:
              </p>
              <div className="space-y-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                  <p className="text-base">
                    <strong>Chờ duyệt</strong> — Đề xuất đã gửi, đang chờ quản
                    trị viên xem xét.
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                  <p className="text-base">
                    <strong>Đã duyệt</strong> — Quản trị viên đồng ý, thông tin
                    đã được cập nhật.
                  </p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                  <p className="text-base">
                    <strong>Từ chối</strong> — Đề xuất không được chấp nhận. Xem
                    ghi chú của quản trị viên để biết lý do.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== 7. Achievements ===== */}
      <section id="achievements">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={Trophy} color="amber" />
              7. Vinh danh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base leading-relaxed">
              Trang tôn vinh các thành tích nổi bật của thành viên trong dòng
              họ — những niềm tự hào chung của gia đình.
            </p>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h4 className="font-semibold text-base">
                Các loại thành tích:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-base leading-relaxed text-muted-foreground">
                <li>
                  <strong>Học tập:</strong> Bằng cấp xuất sắc, thành tích học
                  tập đặc biệt
                </li>
                <li>
                  <strong>Sự nghiệp:</strong> Chức vụ, đóng góp nghề nghiệp
                  nổi bật
                </li>
                <li>
                  <strong>Cống hiến:</strong> Đóng góp cho dòng họ, cộng đồng,
                  xã hội
                </li>
                <li>
                  <strong>Khác:</strong> Các thành tích đặc biệt khác
                </li>
              </ul>
            </div>

            <p className="text-base leading-relaxed text-muted-foreground">
              Dùng ô tìm kiếm ở đầu trang để tìm theo tên người hoặc tiêu đề
              thành tích. Các thành tích nổi bật được đánh dấu ngôi sao và
              hiển thị ở vị trí đầu tiên.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ===== 8. Fund ===== */}
      <section id="fund">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={BookOpen} color="blue" />
              8. Quỹ khuyến học
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-base leading-relaxed">
              Theo dõi quỹ khuyến học của dòng họ — nguồn quỹ dùng để trao học
              bổng, khen thưởng cho con cháu học giỏi.
            </p>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Xem thông tin quỹ</h3>
              <ol className="space-y-3">
                <Step n={1}>
                  Nhấn <Btn>Quỹ khuyến học</Btn> trên thanh bên trái.
                </Step>
                <Step n={2}>
                  <strong>Số dư hiện tại</strong> của quỹ hiển thị ở đầu trang
                  bằng số tiền VND.
                </Step>
                <Step n={3}>
                  Phần <strong>lịch sử giao dịch</strong> liệt kê các khoản thu
                  (đóng góp từ thành viên) và chi (cấp học bổng, khen thưởng).
                </Step>
                <Step n={4}>
                  Phần <strong>học bổng</strong> liệt kê các suất học bổng và
                  khen thưởng đã cấp, kèm trạng thái: đang chờ duyệt, đã
                  duyệt, hoặc đã cấp phát.
                </Step>
              </ol>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== 9. Charter ===== */}
      <section id="charter">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={ScrollText} />
              9. Hương ước
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base leading-relaxed">
              Tập hợp các quy ước, gia huấn, và lời dặn dò của tiền nhân đã
              được số hóa để con cháu lưu giữ và truyền lại.
            </p>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h4 className="font-semibold text-base">
                Ba loại nội dung:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-base leading-relaxed text-muted-foreground">
                <li>
                  <strong>Gia huấn:</strong> Lời dạy, lời răn của tổ tiên dành
                  cho con cháu
                </li>
                <li>
                  <strong>Quy ước:</strong> Nội quy, quy định chung của dòng họ
                </li>
                <li>
                  <strong>Lời dặn con cháu:</strong> Di huấn, lời nhắn nhủ từ
                  các bậc tiền bối
                </li>
              </ul>
            </div>

            <ol className="space-y-3">
              <Step n={1}>
                Nhấn <Btn>Hương ước</Btn> trên thanh bên trái.
              </Step>
              <Step n={2}>
                Chọn danh mục (Gia huấn / Quy ước / Lời dặn) từ bộ lọc ở đầu
                trang để xem theo từng loại.
              </Step>
              <Step n={3}>
                Các bài viết nổi bật được đánh dấu đặc biệt và hiển thị đầu
                tiên.
              </Step>
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* ===== 10. Cau Duong ===== */}
      <section id="cau-duong">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={RotateCcw} />
              10. Cầu đương
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-base leading-relaxed text-blue-900">
                <strong>Cầu đương là gì?</strong> Là truyền thống luân phiên
                phân công từng thành viên trong dòng họ chịu trách nhiệm tổ chức
                các buổi cúng lễ (Tết, Thanh Minh, Giỗ Tổ...) hàng năm. Mỗi
                năm, một nhóm người khác nhau sẽ được phân công.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Xem phân công</h3>
              <ol className="space-y-3">
                <Step n={1}>
                  Nhấn <Btn>Cầu đương</Btn> trên thanh bên trái.
                </Step>
                <Step n={2}>
                  Chọn năm cần xem. Mặc định hiển thị năm hiện tại.
                </Step>
                <Step n={3}>
                  Mỗi buổi lễ (Tết Nguyên Đán, Thanh Minh, Đoan Ngọ, Trung
                  Thu, Giỗ Tổ...) hiển thị tên người được phân công và trạng
                  thái.
                </Step>
              </ol>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Ý nghĩa trạng thái</h3>
              <div className="space-y-2">
                <div className="rounded-lg border p-3">
                  <p className="text-base">
                    <Badge variant="outline" className="mr-2">
                      Đã phân công
                    </Badge>
                    Người này đã được chỉ định, đang chờ thực hiện.
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-base">
                    <Badge className="mr-2 bg-emerald-600">Đã hoàn thành</Badge>
                    Buổi lễ đã tổ chức xong.
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-base">
                    <Badge variant="secondary" className="mr-2">
                      Đã ủy quyền
                    </Badge>
                    Người được phân công nhờ người khác thay.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== 11. Documents ===== */}
      <section id="documents">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={FileText} color="blue" />
              11. Tài liệu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-base leading-relaxed">
              Trung tâm tài liệu gia phả — nơi bạn có thể xem gia phả dưới
              dạng sách hoặc tải xuống file để lưu giữ.
            </p>

            {/* Book */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Printer className="h-5 w-5 text-muted-foreground" />
                Gia phả sách
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Hiển thị toàn bộ gia phả dưới dạng sách, có trang bìa, mục lục
                theo đời và chi, từng thành viên được trình bày gọn gàng giống
                sách gia phả truyền thống.
              </p>
              <ol className="space-y-3">
                <Step n={1}>
                  Nhấn <Btn>Tài liệu</Btn> trên thanh bên, rồi chọn{' '}
                  <Btn>Gia phả sách</Btn>.
                </Step>
                <Step n={2}>
                  Đọc nội dung trên trang web, cuộn xuống để xem từng đời,
                  từng chi.
                </Step>
                <Step n={3}>
                  Muốn in ra giấy hoặc lưu thành file PDF, nhấn nút{' '}
                  <Btn>In / Lưu PDF</Btn> ở đầu trang. Hộp thoại in sẽ mở ra —
                  chọn máy in hoặc chọn &quot;Save as PDF&quot; (Lưu dưới dạng
                  PDF).
                </Step>
              </ol>
            </div>

            <Separator />

            {/* GEDCOM */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Xuất file GEDCOM</h3>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-base leading-relaxed text-blue-900">
                  <strong>GEDCOM là gì?</strong> Là định dạng file chuẩn quốc
                  tế dùng cho phả hệ (đuôi .ged). File này có thể mở bằng các
                  phần mềm gia phả khác như Gramps, Family Tree Maker, hoặc
                  Ancestry.
                </p>
              </div>
              <ol className="space-y-3">
                <Step n={1}>
                  Nhấn <Btn>Tài liệu</Btn> trên thanh bên trái.
                </Step>
                <Step n={2}>
                  Nhấn nút <Btn>Xuất GEDCOM</Btn>. File sẽ được tải xuống máy
                  tính/điện thoại của bạn.
                </Step>
              </ol>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== 12. Admin ===== */}
      <section id="admin">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <SectionIcon icon={Settings} color="amber" />
              12. Quản trị
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-300 bg-amber-50 text-xs"
              >
                Admin / Editor
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Warning>
              Phần này chỉ dành cho <strong>Quản trị viên</strong> và{' '}
              <strong>Biên tập viên</strong>. Mục &quot;Quản trị&quot; chỉ xuất
              hiện trên thanh bên trái khi bạn có quyền.
            </Warning>

            {/* Dashboard */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Bảng điều khiển</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Nhấn <Btn>Bảng điều khiển</Btn> để xem tổng quan nhanh: tổng
                số thành viên, số đời (thế hệ), số chi, số gia đình, bao nhiêu
                người còn sống và đã mất.
              </p>
            </div>

            <Separator />

            {/* User management */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Quản lý người dùng</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Xem và quản lý tài khoản của tất cả người đã đăng ký.
              </p>
              <ol className="space-y-3">
                <Step n={1}>
                  Vào <Btn>Quản trị</Btn> &rarr; <Btn>Người dùng</Btn>.
                </Step>
                <Step n={2}>
                  <strong>Đổi vai trò:</strong> Nhấn vào menu thả xuống ở cột
                  &quot;Vai trò&quot;, chọn Admin / Biên tập viên / Người xem.
                  Xác nhận khi được hỏi.
                </Step>
                <Step n={3}>
                  <strong>Liên kết tài khoản:</strong> Nhấn nút liên kết ở cột
                  &quot;Thành viên tương ứng&quot; để gắn tài khoản với một
                  người trên cây phả hệ. Khi đã liên kết, người đó có thể tự
                  sửa hồ sơ của mình.
                </Step>
                <Step n={4}>
                  <strong>Giới hạn phạm vi sửa:</strong> Với biên tập viên, bạn
                  có thể chỉ cho phép họ sửa một nhánh nhất định bằng cách chọn
                  người gốc của nhánh đó ở cột &quot;Phạm vi sửa&quot;.
                </Step>
              </ol>
            </div>

            <Separator />

            {/* Review contributions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Duyệt đề xuất</h3>
              <ol className="space-y-3">
                <Step n={1}>
                  Vào <Btn>Quản trị</Btn> &rarr; <Btn>Đề xuất chỉnh sửa</Btn>.
                </Step>
                <Step n={2}>
                  Xem danh sách đề xuất đang chờ duyệt. Mỗi đề xuất hiển thị
                  giá trị cũ và giá trị mới được đề nghị để bạn so sánh.
                </Step>
                <Step n={3}>
                  Nhấn <Btn>Duyệt</Btn> để chấp nhận (thông tin sẽ được cập
                  nhật tự động) hoặc <Btn>Từ chối</Btn> kèm ghi chú lý do.
                </Step>
              </ol>
            </div>

            <Separator />

            {/* Other admin */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">
                Quản lý nội dung khác
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Trong khu vực Quản trị, bạn cũng có thể thêm, sửa, xóa:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base leading-relaxed text-muted-foreground">
                <li>
                  <strong>Vinh danh:</strong> Thêm thành tích mới, chọn người
                  được vinh danh, đánh dấu nổi bật.
                </li>
                <li>
                  <strong>Quỹ & Học bổng:</strong> Ghi nhận khoản thu/chi, thêm
                  suất học bổng/khen thưởng, phê duyệt và cấp phát.
                </li>
                <li>
                  <strong>Hương ước:</strong> Thêm bài viết mới (gia huấn, quy
                  ước, lời dặn), đánh dấu nổi bật, sắp xếp thứ tự.
                </li>
                <li>
                  <strong>Cầu đương:</strong> Tạo nhóm luân phiên, phân công
                  từng lễ cho từng năm, đánh dấu hoàn thành, ủy quyền hoặc đổi
                  ngày.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== Footer ===== */}
      <div className="rounded-lg bg-muted/50 p-5 text-center">
        <p className="text-base leading-relaxed text-muted-foreground">
          Nếu bạn gặp khó khăn hoặc cần hỗ trợ thêm, vui lòng liên hệ{' '}
          <strong>quản trị viên</strong> của hệ thống.
        </p>
      </div>
    </div>
  );
}
