import { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, X, FileText, CalendarClock, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifType = 'newSubmission' | 'sessionRequest' | 'followUpDue' | 'reportRequest';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  minutesAgo: number;
  read: boolean;
}

// ── Mock data (replace with live query when table is ready) ───────────────────

function getMockNotifications(t: ReturnType<typeof useAdminLanguage>['t']): Notification[] {
  return [
    {
      id: '1',
      type: 'newSubmission',
      title: t.notifications.types.newSubmission,
      body: 'أكمل أحمد خالد تقييم وادي الفشل — درجة المخاطر ٧٨',
      minutesAgo: 12,
      read: false,
    },
    {
      id: '2',
      type: 'sessionRequest',
      title: t.notifications.types.sessionRequest,
      body: 'سارة محمد — طلبت جلسة مكثفة',
      minutesAgo: 95,
      read: false,
    },
    {
      id: '3',
      type: 'followUpDue',
      title: t.notifications.types.followUpDue,
      body: 'مراجعة التقرير النهائي — موعد الاستحقاق اليوم',
      minutesAgo: 300,
      read: true,
    },
    {
      id: '4',
      type: 'reportRequest',
      title: t.notifications.types.reportRequest,
      body: 'طلب تقرير تشريح جديد من: شركة نوفا تك',
      minutesAgo: 720,
      read: true,
    },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<NotifType, React.ElementType> = {
  newSubmission:  Activity,
  sessionRequest: CalendarClock,
  followUpDue:    AlertTriangle,
  reportRequest:  FileText,
};

const TYPE_COLOR: Record<NotifType, string> = {
  newSubmission:  'text-ember',
  sessionRequest: 'text-sky-400',
  followUpDue:    'text-amber-400',
  reportRequest:  'text-violet-400',
};

function timeLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} د`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} س`;
  return `${Math.floor(minutes / 1440)} ي`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { t: adminT } = useAdminLanguage();
  const [open, setOpen] = useState(false);
  const mock = useMemo(() => getMockNotifications(adminT), [adminT]);
  const [items, setItems] = useState<Notification[]>(mock);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(mock);
  }, [mock]);

  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative p-2 rounded-lg transition-all duration-200',
          open
            ? 'bg-white/8 text-white'
            : 'text-white/40 hover:text-white/80 hover:bg-white/5'
        )}
        aria-label={adminT.notifications.title}
      >
        <Bell className="size-4.5" />
        {unread > 0 && (
          <span className="absolute top-1 end-1 size-2 rounded-full bg-ember ring-1 ring-[#0a0a0a]" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full end-0 mt-2 w-80 bg-[#111111] border border-white/8 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
            <div className="flex items-center gap-2">
              <Bell className="size-3.5 text-ember" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-white/60 font-arabic">
                {adminT.notifications.title}
              </span>
              {unread > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-ember/20 text-ember text-[9px] font-medium tabular-nums">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-white/30 hover:text-white/60 transition-colors font-arabic"
              >
                {adminT.notifications.markAll}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="size-6 text-white/15 mx-auto mb-3" />
                <p className="text-[11px] text-white/30 font-arabic">
                  {adminT.notifications.empty}
                </p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = TYPE_ICON[n.type];
                const iconColor = TYPE_COLOR[n.type];
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b border-white/4 last:border-0 transition-colors',
                      n.read ? 'opacity-50' : 'bg-white/2'
                    )}
                  >
                    <div className={cn('mt-0.5 shrink-0', iconColor)}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-white/80 font-arabic leading-snug">
                        {n.title}
                      </p>
                      <p className="text-[10px] text-white/40 font-arabic mt-0.5 leading-relaxed">
                        {n.body}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[9px] text-white/25 tabular-nums">
                        {timeLabel(n.minutesAgo)}
                      </span>
                      <button
                        onClick={() => dismiss(n.id)}
                        className="text-white/20 hover:text-white/50 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/5">
              <button
                onClick={() => setOpen(false)}
                className="text-[10px] tracking-[0.15em] uppercase text-ember/60 hover:text-ember transition-colors w-full text-center font-arabic"
              >
                {adminT.notifications.viewAll}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
