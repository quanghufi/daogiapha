import { Badge } from '@/components/ui/badge';
import type { ScholarshipStatus } from '@/types';

export function ScholarshipStatusBadge({ status }: { status: ScholarshipStatus }) {
  switch (status) {
    case 'pending': return <Badge variant="outline" className="text-xs">Chờ duyệt</Badge>;
    case 'approved': return <Badge className="bg-blue-100 text-blue-800 text-xs">Đã duyệt</Badge>;
    case 'paid': return <Badge className="bg-green-100 text-green-800 text-xs">Đã cấp</Badge>;
    default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}
