import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  LayoutDashboard,
  Users,
  MessageSquareQuote,
  LogOut,
  ChevronRight,
  Flame,
  UserCircle,
  CalendarClock,
  FileText,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { to: '/admin',              label: 'Overview',     icon: LayoutDashboard,    end: true  },
  { to: '/admin/founders',     label: 'Founders',     icon: UserCircle,         end: false },
  { to: '/admin/sessions',     label: 'Sessions',     icon: CalendarClock,      end: false },
  { to: '/admin/reports',      label: 'Reports',      icon: FileText,           end: false },
  { to: '/admin/follow-ups',   label: 'Follow-ups',   icon: Bell,               end: false },
  { to: '/admin/submissions',  label: 'Submissions',  icon: Users,              end: false },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote, end: false },
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
    <div className="min-h-screen bg-[#080808] flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 bg-[#0d0d0d] border-r border-white/5 flex flex-col">
        {/* Brand */}
        <div className="px-6 py-7 border-b border-white/5">
          <NavLink to="/" className="flex items-center gap-3 group">
            <Flame className="size-4 text-ember shrink-0" />
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase text-white font-medium leading-tight">
                خبير الفشل
              </p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-white/25 mt-0.5">
                Admin Panel
              </p>
            </div>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }, index) => {
            const isLegacyDivider = label === 'Submissions';
            return (
              <div key={to}>
                {isLegacyDivider && <hr className="my-2 border-white/5" />}
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] tracking-[0.15em] uppercase transition-all duration-200 group',
                      isActive
                        ? 'bg-white/8 text-white'
                        : 'text-white/40 hover:text-white/80 hover:bg-white/4'
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
                        <ChevronRight className="size-3 text-ember/60" />
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
          <div className="px-3 py-2 mb-2">
            <p className="text-[10px] text-white/25 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] tracking-[0.15em] uppercase text-white/40 hover:text-white/80 hover:bg-white/4 transition-all duration-200 group"
          >
            <LogOut className="size-4 text-white/30 group-hover:text-white/60 transition-colors" />
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page header */}
        <header className="px-8 py-7 border-b border-white/5 bg-[#0a0a0a]">
          <div className="flex items-start gap-4">
            <div className="h-px w-6 bg-ember mt-3 shrink-0" />
            <div>
              <h1 className="text-xl font-serif-display text-white leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] tracking-[0.2em] uppercase text-white/35 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
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
