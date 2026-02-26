'use client';

import { RouteError } from '@/components/shared/route-error';

export default function PersonNewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="Lỗi tải trang thêm thành viên" />;
}
