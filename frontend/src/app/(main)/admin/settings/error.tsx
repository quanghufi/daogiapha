'use client';

import { RouteError } from '@/components/shared/route-error';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="Lỗi tải trang cài đặt" />;
}
