/**
 * @project AncestorTree
 * @file src/app/(main)/events/page.tsx
 * @description Memorial calendar and events page with lunar date support
 * @version 2.1.0
 * @updated 2026-02-25
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useEvents, useDeleteEvent } from '@/hooks/use-events';
import { usePeople } from '@/hooks/use-people';
import { useAuth } from '@/components/auth/auth-provider';
import { parseLunarString, getNextLunarOccurrence, formatLunarDate, solarToLunar } from '@/lib/lunar-calendar';
import { CalendarGrid } from '@/components/events/calendar-grid';
import { AddEventDialog } from '@/components/events/add-event-dialog';
import { EVENT_TYPE_LABELS, MONTHS_VI } from '@/components/events/event-constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type { Event, Person } from '@/types';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

interface UpcomingEvent {
  event: Event;
  person?: Person;
  nextDate: Date;
  daysUntil: number;
  lunarDisplay: string;
  isAuto: boolean;
}

export default function EventsPage() {
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: people, isLoading: peopleLoading } = usePeople();
  const { isEditor } = useAuth();
  const deleteEvent = useDeleteEvent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const isLoading = eventsLoading || peopleLoading;

  const peopleMap = useMemo(() => {
    const map = new Map<string, typeof people extends (infer T)[] | undefined ? T : never>();
    if (people) for (const p of people) map.set(p.id, p);
    return map;
  }, [people]);

  // Compute upcoming events (next 60 days)
  const upcomingEvents = useMemo<UpcomingEvent[]>(() => {
    if (!events || !people) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const results: UpcomingEvent[] = [];

    for (const event of events) {
      let nextDate: Date | null = null;
      let lunarDisplay = '';

      if (event.event_lunar) {
        const parsed = parseLunarString(event.event_lunar);
        if (parsed) {
          nextDate = getNextLunarOccurrence(parsed.day, parsed.month, now);
          lunarDisplay = formatLunarDate(parsed.day, parsed.month);
        }
      } else if (event.event_date) {
        nextDate = new Date(event.event_date);
        const lunar = solarToLunar(nextDate.getDate(), nextDate.getMonth() + 1, nextDate.getFullYear());
        lunarDisplay = formatLunarDate(lunar.day, lunar.month);
      }

      if (!nextDate) continue;

      const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil > 60) continue;

      const person = event.person_id ? peopleMap.get(event.person_id) : undefined;
      results.push({ event, person, nextDate, daysUntil, lunarDisplay, isAuto: false });
    }

    return results.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [events, peopleMap]);

  // Auto-generate giỗ events from deceased people with death_lunar (fix m2: mark as isAuto)
  const autoGioEvents = useMemo<UpcomingEvent[]>(() => {
    if (!people || !events) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const existingPersonIds = new Set(events.filter(e => e.person_id).map(e => e.person_id));
    const results: UpcomingEvent[] = [];

    for (const person of people) {
      if (person.is_living || !person.death_lunar || existingPersonIds.has(person.id)) continue;

      const parsed = parseLunarString(person.death_lunar);
      if (!parsed) continue;

      const nextDate = getNextLunarOccurrence(parsed.day, parsed.month, now);
      const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil > 60) continue;

      results.push({
        event: {
          id: `gio-auto-${person.id}`,
          title: `Giỗ ${person.display_name}`,
          event_type: 'gio',
          event_lunar: person.death_lunar,
          person_id: person.id,
          recurring: true,
          created_at: new Date().toISOString(),
        },
        person,
        nextDate,
        daysUntil,
        lunarDisplay: formatLunarDate(parsed.day, parsed.month),
        isAuto: true,
      });
    }

    return results.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [people, events]);

  const allUpcoming = useMemo(() => {
    const merged = [...upcomingEvents, ...autoGioEvents];
    return merged.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [upcomingEvents, autoGioEvents]);

  // Filtered events for list view
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (typeFilter === 'all') return events;
    return events.filter(e => e.event_type === typeFilter);
  }, [events, typeFilter]);

  const navigateMonth = (dir: number) => {
    let m = calendarMonth + dir;
    let y = calendarYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  // Fix m4: delete with confirmation is handled by AlertDialog below
  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success('Đã xóa sự kiện');
    } catch {
      toast.error('Lỗi khi xóa sự kiện');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Calendar className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lịch cúng lễ</h1>
            <p className="text-muted-foreground">Quản lý ngày giỗ, lễ tết và sự kiện dòng họ</p>
          </div>
        </div>
        {isEditor && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Thêm sự kiện
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Thêm sự kiện mới</DialogTitle>
                <DialogDescription>Thêm ngày giỗ, lễ tết hoặc sự kiện dòng họ</DialogDescription>
              </DialogHeader>
              <AddEventDialog
                people={people || []}
                onClose={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Upcoming events banner */}
      {allUpcoming.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Sắp tới ({allUpcoming.length} sự kiện trong 60 ngày)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allUpcoming.slice(0, 5).map(({ event, person, nextDate, daysUntil, lunarDisplay, isAuto }) => {
                const typeInfo = EVENT_TYPE_LABELS[event.event_type];
                const TypeIcon = typeInfo.icon;
                return (
                  <div key={event.id} className="flex items-center gap-3 bg-background rounded-lg p-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${typeInfo.color}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {event.title}
                        {isAuto && <span className="text-xs text-muted-foreground ml-1">(tự động)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(nextDate)} · {lunarDisplay}
                        {person && (
                          <>
                            {' · '}
                            <Link href={`/people/${person.id}`} className="hover:underline">
                              {person.display_name}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={daysUntil <= 7 ? 'destructive' : daysUntil <= 30 ? 'default' : 'secondary'}
                    >
                      {daysUntil === 0 ? 'Hôm nay' : `${daysUntil} ngày`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="calendar">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Lịch</TabsTrigger>
          <TabsTrigger value="list">Danh sách</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">
                  {MONTHS_VI[calendarMonth - 1]} {calendarYear}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <CalendarGrid
                  month={calendarMonth}
                  year={calendarYear}
                  events={events || []}
                  people={people || []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>
                  {isLoading ? 'Đang tải...' : `${filteredEvents.length} sự kiện`}
                </CardDescription>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {Object.entries(EVENT_TYPE_LABELS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  Chưa có sự kiện nào
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map(event => {
                    const typeInfo = EVENT_TYPE_LABELS[event.event_type];
                    const TypeIcon = typeInfo.icon;
                    const person = event.person_id ? peopleMap.get(event.person_id) : undefined;
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${typeInfo.color}`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.event_lunar && <span>{event.event_lunar} (ÂL)</span>}
                            {event.event_date && (
                              <span>
                                {event.event_lunar && ' · '}
                                {formatDate(event.event_date)}
                              </span>
                            )}
                            {event.location && ` · ${event.location}`}
                            {person && (
                              <>
                                {' · '}
                                <Link href={`/people/${person.id}`} className="hover:underline">
                                  {person.display_name}
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline">{typeInfo.label}</Badge>
                          {event.recurring && (
                            <Badge variant="secondary" className="text-xs">Hàng năm</Badge>
                          )}
                          {isEditor && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xóa sự kiện</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc muốn xóa &ldquo;{event.title}&rdquo;? Hành động này không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(event.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
