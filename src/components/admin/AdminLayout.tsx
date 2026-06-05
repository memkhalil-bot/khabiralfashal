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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { adminT } from '@/i18n/adminTranslations';
import { NotificationBell } from './NotificationBell';

const navItems = [
  { to: '/admin',              label: adminT.nav.overview,     icon: LayoutDashboard,    end: true  },
  { to: '/admin/founders',     label: adminT.nav.founders,     icon: UserCircle,         end: false },
  { to: '/admin/sessions',     label: adminT.nav.sessions,     icon: CalendarClock,      end: false },
  { to: '/admin/reports',      label: adminT.nav.reports,      icon: FileText,           end: false },
  { to: '/admin/follow-ups',   label: adminT.nav.followUps,    icon: Bell,               end: false },
  { to: '/admin/approvals',    label: adminT.nav.approvals,    icon: CheckSquare,        end: false },
  { to: '/admin/submissions',  label: adminT.nav.submissions,  icon: Users,              end: false },
  { to: '/admin/testimonials', label: adminT.nav.testimonials, icon: MessageSquareQuote, end: false },
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
    <div dir="rtl" className="min-h-screen bg-[#060606] flex font-arabic">

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 bg-[#0b0b0b] border-l border-white/5 flex flex-col">

        {/* Brand */}
        <div className="px-6 py-7 border-b border-white/5">
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
        <nav className="flex-1 px-3 py-6 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => {
            const isLegacyDivider = to === '/admin/submissions';
            return (
              <div key={to}>
                {isLegacyDivider && (
                  <div className="my-3 mx-3 flex items-center gap-2">
                    <hr className="flex-1 border-white/5" />
                    <span className="text-[8px] tracking-[0.25em] uppercase text-white/15">بيانات</span>
                    <hr className="flex-1 border-white/5" />
                  </div>
                )}
                <NavLink
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
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/5">
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
        <header className="px-8 py-5 border-b border-white/5 bg-[#080808]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* RTL accent: bar is on the right side of text */}
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
            {/* Notification bell */}
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
