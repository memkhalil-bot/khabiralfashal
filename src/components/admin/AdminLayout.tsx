import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  LayoutDashboard,
  Users,
  MessageSquareQuote,
  LogOut,
  ChevronLeft,
  Flame,
  UserCircle,
  CalendarClock,
  FileText,
  Bell,
  CheckSquare,
  CalendarPlus,
  TrendingUp,
  Inbox,
  Tag,
  UserCheck,
  DollarSign,
  Bug,
  Mail,
  Zap,
  Settings,
  LayoutTemplate,
  Target,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { adminT } from '@/i18n/adminTranslations';
import { NotificationBell } from './NotificationBell';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
}

interface NavGroup {
  labelAr: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    labelAr: '',
    items: [
      { to: '/admin',               label: adminT.nav.overview,      icon: LayoutDashboard, end: true },
      { to: '/admin/action-center', label: adminT.nav.actionCenter,  icon: Zap             },
    ],
  },
  {
    labelAr: 'العمليات',
    items: [
      { to: '/admin/sessions',      label: adminT.nav.sessions,      icon: CalendarClock },
      { to: '/admin/bookings',      label: adminT.nav.bookings,      icon: CalendarPlus  },
      { to: '/admin/report-queue',  label: adminT.nav.reportQueue,   icon: Inbox         },
      { to: '/admin/revenue',       label: adminT.nav.revenue,       icon: DollarSign    },
    ],
  },
  {
    labelAr: 'المبيعات',
    items: [
      { to: '/admin/founders',      label: adminT.nav.founders,      icon: UserCircle  },
      { to: '/admin/valley-leads',  label: adminT.nav.valleyLeads,   icon: TrendingUp  },
      { to: '/admin/retargeting',   label: adminT.nav.retargeting,   icon: Target      },
    ],
  },
  {
    labelAr: 'المحتوى',
    items: [
      { to: '/admin/approvals',        label: adminT.nav.approvals,       icon: CheckSquare        },
      { to: '/admin/reports',          label: adminT.nav.reports,         icon: FileText           },
      { to: '/admin/follow-ups',       label: adminT.nav.followUps,       icon: Bell               },
      { to: '/admin/submissions',      label: adminT.nav.submissions,     icon: Users              },
      { to: '/admin/testimonials',     label: adminT.nav.testimonials,    icon: MessageSquareQuote },
      { to: '/admin/report-templates', label: adminT.nav.reportTemplates, icon: LayoutTemplate     },
      { to: '/admin/email-templates',  label: adminT.nav.emailTemplates,  icon: Mail               },
    ],
  },
  {
    labelAr: 'الإدارة',
    items: [
      { to: '/admin/services',      label: adminT.nav.services,      icon: Settings   },
      { to: '/admin/promo-codes',   label: adminT.nav.promoCodes,    icon: Tag        },
      { to: '/admin/team',          label: adminT.nav.team,          icon: UserCheck  },
      { to: '/admin/activity-log',  label: adminT.nav.activityLog,   icon: ScrollText },
      { to: '/admin/debug',         label: adminT.nav.debug,         icon: Bug        },
    ],
  },
];

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AdminLayout({ children, title, subtitle }: Props) {
  const { user, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#0c1119] flex font-arabic">

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 bg-[#090d14] border-l border-white/6 flex flex-col">

        {/* Brand */}
        <div className="px-6 py-7 border-b border-white/6">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Flame className="size-4 text-ember shrink-0" />
              <span className="absolute inset-0 blur-md bg-ember/40 rounded-full" />
            </div>
            <div>
              <p className="text-[12px] tracking-wider text-white font-semibold leading-tight">
                خبير الفشل
              </p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-white/25 mt-0.5">
                {adminT.nav.adminPanel}
              </p>
            </div>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
          {navGroups.map((group) => (
            <div key={group.labelAr || '__top'}>
              {group.labelAr && (
                <p className="px-3 mb-1.5 text-[9px] tracking-[0.22em] uppercase text-white/20 font-medium">
                  {group.labelAr}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] transition-all duration-200 group',
                        isActive
                          ? 'bg-ember/10 text-white border border-ember/15'
                          : 'text-white/40 hover:text-white/80 hover:bg-white/4 border border-transparent'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'size-4 shrink-0 transition-colors',
                            isActive ? 'text-ember' : 'text-white/30 group-hover:text-white/60'
                          )}
                        />
                        <span className="flex-1">{label}</span>
                        {isActive && (
                          <ChevronLeft className="size-3 text-ember/50" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/6">
          <div className="px-3 py-2 mb-1">
            <p className="text-[10px] text-white/20 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] text-white/40 hover:text-crimson hover:bg-crimson/8 border border-transparent transition-all duration-200 group"
          >
            <LogOut className="size-4 text-white/30 group-hover:text-crimson/70 transition-colors" />
            {signingOut ? adminT.nav.signingOut : adminT.nav.signOut}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Page header */}
        <header className="px-8 py-5 border-b border-white/6 bg-[#0a0d14]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-5 w-0.5 bg-ember rounded-full shrink-0" />
              <div>
                <h1 className="text-lg font-semibold text-white leading-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
