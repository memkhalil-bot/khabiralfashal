import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useAdminLanguage, type AdminLanguage } from '@/hooks/useAdminLanguage';
import { adminT as adminTAr } from '@/i18n/adminTranslations';
import {
  LayoutDashboard,
  MessageSquareQuote,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Flame,
  UserCircle,
  CalendarClock,
  Bell,
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
  Package,
  Sun,
  Moon,
  Languages,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { NotificationBell } from './NotificationBell';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Section labels aren't part of the per-key translation namespaces (they were
// historically Arabic-only literals in this file), so they're kept here —
// translated for both languages — rather than expanding adminTranslations.
const SECTION_LABELS: Record<AdminLanguage, Record<'operations' | 'clients' | 'sales' | 'content' | 'admin', string>> = {
  ar: {
    operations: 'العمليات',
    clients:    'العملاء',
    sales:      'المبيعات',
    content:    'المحتوى',
    admin:      'الإدارة',
  },
  en: {
    operations: 'Operations',
    clients:    'Clients',
    sales:      'Sales',
    content:    'Content',
    admin:      'Admin',
  },
};

function buildNavGroups(t: typeof adminTAr, language: AdminLanguage): NavGroup[] {
  const s = SECTION_LABELS[language];
  return [
    {
      label: '',
      items: [
        { to: '/admin', label: t.nav.overview, icon: LayoutDashboard, end: true },
      ],
    },
    {
      label: s.operations,
      items: [
        { to: '/admin/action-center', label: t.nav.actionCenter,  icon: Zap           },
        { to: '/admin/sessions',      label: t.nav.sessions,      icon: CalendarClock },
        { to: '/admin/bookings',      label: t.nav.bookings,      icon: CalendarPlus  },
        { to: '/admin/report-queue',  label: t.nav.reportQueue,   icon: Inbox         },
        { to: '/admin/fail-kit',      label: t.nav.failKit,       icon: Package       },
      ],
    },
    {
      label: s.clients,
      items: [
        { to: '/admin/founders',      label: t.nav.founders,      icon: UserCircle         },
        { to: '/admin/valley-leads',  label: t.nav.valleyLeads,   icon: TrendingUp         },
        { to: '/admin/follow-ups',    label: t.nav.followUps,     icon: Bell               },
        { to: '/admin/testimonials',  label: t.nav.testimonials,  icon: MessageSquareQuote },
      ],
    },
    {
      label: s.sales,
      items: [
        { to: '/admin/revenue',       label: t.nav.revenue,       icon: DollarSign },
        { to: '/admin/promo-codes',   label: t.nav.promoCodes,    icon: Tag        },
        { to: '/admin/retargeting',   label: t.nav.retargeting,   icon: Target     },
      ],
    },
    {
      label: s.content,
      items: [
        { to: '/admin/email-templates',  label: t.nav.emailTemplates,  icon: Mail           },
        { to: '/admin/report-templates', label: t.nav.reportTemplates, icon: LayoutTemplate },
      ],
    },
    {
      label: s.admin,
      items: [
        { to: '/admin/team',          label: t.nav.team,          icon: UserCheck  },
        { to: '/admin/activity-log',  label: t.nav.activityLog,   icon: ScrollText },
        { to: '/admin/debug',         label: t.nav.debug,         icon: Bug        },
        { to: '/admin/services',      label: t.nav.services,      icon: Settings   },
      ],
    },
  ];
}

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AdminLayout({ children, title, subtitle }: Props) {
  const { user, signOut } = useAdminAuth();
  const { theme, toggleTheme } = useAdminTheme();
  const { language, dir, t, toggleLanguage } = useAdminLanguage();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navGroups = buildNavGroups(t, language);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/admin/login');
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div
      dir={dir}
      data-admin-theme={theme}
      data-admin-lang={language}
      className="min-h-screen bg-admin-bg flex font-arabic"
    >

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 256 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="shrink-0 bg-admin-bg border-e border-admin-border flex flex-col overflow-hidden"
      >

        {/* Brand */}
        <div className="px-5 py-7 border-b border-admin-border">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="relative shrink-0">
              <Flame className="size-4 text-ember" />
              <span className="absolute inset-0 blur-md bg-ember/40 rounded-full" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[12px] tracking-wider text-admin-text font-semibold leading-tight truncate">
                  خبير الفشل
                </p>
                <p className="text-[9px] tracking-[0.2em] uppercase text-admin-text-muted mt-0.5 truncate">
                  {t.nav.adminPanel}
                </p>
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden hide-scrollbar space-y-4">
          {navGroups.map((group, gi) => (
            <div key={group.label || `__top-${gi}`}>
              {group.label && !collapsed && (
                <p className="px-3 mb-1.5 text-[9px] tracking-[0.22em] uppercase text-admin-text-muted/70 font-medium truncate">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] transition-all duration-200 group',
                        collapsed && 'justify-center px-0',
                        isActive
                          ? 'bg-ember/10 text-admin-text border border-ember/15'
                          : 'text-admin-text-muted hover:text-admin-text hover:bg-white/4 border border-transparent'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'size-4 shrink-0 transition-colors',
                            isActive ? 'text-ember' : 'text-admin-text-muted/70 group-hover:text-admin-text/80'
                          )}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{label}</span>
                            {isActive && (
                              <ChevronLeft className={cn('size-3 text-ember/50 shrink-0', dir === 'ltr' && 'rotate-180')} />
                            )}
                          </>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 py-3 border-t border-admin-border">
          <button
            onClick={toggleCollapsed}
            title={collapsed ? t.common.viewAll : undefined}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] text-admin-text-muted hover:text-admin-text hover:bg-white/4 border border-transparent transition-all duration-200 group',
              collapsed && 'justify-center px-0'
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 text-admin-text-muted/70 group-hover:text-admin-text/80 transition-colors" />
            ) : (
              <>
                <PanelLeftClose className="size-4 text-admin-text-muted/70 group-hover:text-admin-text/80 transition-colors shrink-0" />
                <span className="flex-1 truncate text-start">{language === 'ar' ? 'طي القائمة' : 'Collapse menu'}</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="px-8 py-5 border-b border-admin-border bg-admin-bg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-5 w-0.5 bg-ember rounded-full shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-admin-text leading-tight truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-[10px] tracking-[0.2em] uppercase text-admin-text-muted mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Theme switch */}
              <button
                onClick={toggleTheme}
                title={theme === 'focus' ? 'Day Mode' : 'Focus Mode'}
                aria-label="Toggle theme"
                className="p-2 rounded-lg text-admin-text-muted hover:text-admin-text hover:bg-white/5 transition-all duration-200"
              >
                {theme === 'focus' ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </button>

              {/* Language switch */}
              <button
                onClick={toggleLanguage}
                title={language === 'ar' ? 'English' : 'العربية'}
                aria-label="Toggle language"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-admin-text-muted hover:text-admin-text hover:bg-white/5 transition-all duration-200 text-[11px] font-medium tracking-wide"
              >
                <Languages className="size-4" />
                <span className="uppercase">{language === 'ar' ? 'EN' : 'ع'}</span>
              </button>

              <NotificationBell />

              {/* User menu */}
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className={cn(
                    'flex items-center gap-2 ps-1 pe-2.5 py-1.5 rounded-lg transition-all duration-200',
                    userMenuOpen ? 'bg-white/8 text-admin-text' : 'text-admin-text-muted hover:text-admin-text hover:bg-white/5'
                  )}
                >
                  <span className="size-7 rounded-full bg-admin-primary/30 border border-admin-primary/40 flex items-center justify-center text-admin-text text-[11px] font-semibold uppercase shrink-0">
                    {(user?.email ?? '?').slice(0, 1)}
                  </span>
                  <ChevronDown className={cn('size-3.5 transition-transform duration-200', userMenuOpen && 'rotate-180')} />
                </button>

                {userMenuOpen && (
                  <div className="absolute top-full end-0 mt-2 w-60 bg-admin-card border border-admin-border rounded-xl shadow-2xl shadow-black/30 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-admin-border">
                      <p className="text-[11px] text-admin-text-muted truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[12px] text-admin-text-muted hover:text-crimson hover:bg-crimson/8 transition-all duration-200 group"
                    >
                      <LogOut className="size-4 text-admin-text-muted/70 group-hover:text-crimson/70 transition-colors" />
                      {signingOut ? t.nav.signingOut : t.nav.signOut}
                    </button>
                  </div>
                )}
              </div>
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
