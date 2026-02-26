'use client';

import { RouteError } from '@/components/shared/route-error';

export default function AdminCauDuongError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="Lỗi tải trang quản lý Cầu đương" />;
}
