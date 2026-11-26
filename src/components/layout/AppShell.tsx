import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  CalendarClock,
  ThermometerSun,
  ClipboardCheck,
  BarChart3,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  ArrowUpRight,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useFarmData } from '../../context/FarmDataContext';
import { formatDateShort } from '../../utils/formatters';

const AVATAR_URL = '/src/assets/images/avatar_farm_manager_1795698952962.jpg';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/batches', label: 'Crop Batches', icon: Sprout },
  { to: '/predictions', label: 'Harvest Predictions', icon: CalendarClock },
  { to: '/environment', label: 'Environment', icon: ThermometerSun },
  { to: '/harvest', label: 'Harvest Management', icon: ClipboardCheck },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({
  title,
  breadcrumb,
  actions,
  children,
}: {
  title: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { state, unreadAlertsCount, acknowledgeAlert, acknowledgeAllAlerts } = useFarmData();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const quickResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const batchMatches = state.batches
      .filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.cultivar.toLowerCase().includes(q) ||
          b.rackNumber.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((b) => ({
        label: `${b.id} · ${b.cultivar}`,
        meta: `Rack ${b.rackNumber} · ${b.status}`,
        path: `/batches/${b.id}`,
      }));
    const pageMatches = NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(q)).map((n) => ({
      label: n.label,
      meta: 'Page',
      path: n.to,
    }));
    return [...batchMatches, ...pageMatches].slice(0, 6);
  }, [searchQuery, state.batches]);

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#153F32] text-white">
      <div>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#287A55] text-white">
              <Sprout className="h-4 w-4" />
            </span>
            <span>HARVESTIQ</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
            <p className="text-[11px] font-medium text-[#A6C4B5]">Active Facility</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-white">
              {state.farmProfile.name}
            </p>
            <p className="mt-0.5 text-[11px] text-white/70">
              {state.zones.length} Zones · {state.farmProfile.primaryCrop}
            </p>
          </div>
        </div>

        <nav className="space-y-1 px-3" aria-label="Application navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#287A55] text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 p-4">
        <Link
          to="/"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span>Product Overview</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F7F9F5] text-[#202923]">
      {/* Desktop persistent sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[#DFE6DD] lg:block">
        <div className="sticky top-0 h-screen">{SidebarContent}</div>
      </aside>

      {/* Mobile slide-over sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-[#202923]/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw]">{SidebarContent}</div>
        </div>
      )}

      {/* Main workspace column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#DFE6DD] bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg border border-[#DFE6DD] p-2 text-[#202923] hover:bg-[#F7F9F5] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-[#78847D]">
                <span className="truncate font-medium text-[#153F32]">
                  {state.farmProfile.name}
                </span>
                <span aria-hidden="true">/</span>
                <span className="truncate">{breadcrumb || title}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden font-mono text-xs text-[#78847D] tabular-nums md:inline">
              {formatDateShort(state.farmProfile.referenceDate)}
            </span>

            {/* Quick Search */}
            <div ref={searchRef} className="relative hidden sm:block">
              <div className="flex items-center rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] px-2.5 py-1.5 focus-within:border-[#153F32] focus-within:bg-white">
                <Search className="h-3.5 w-3.5 text-[#78847D]" />
                <input
                  type="search"
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  placeholder="Jump to batch or page..."
                  aria-label="Quick search batches or pages"
                  className="ml-2 w-44 bg-transparent text-xs text-[#202923] placeholder:text-[#78847D] focus:outline-none lg:w-56"
                />
              </div>
              {searchOpen && searchQuery.trim().length > 0 && (
                <div className="absolute right-0 mt-1.5 w-72 rounded-lg border border-[#DFE6DD] bg-white py-1.5 shadow-lg">
                  {quickResults.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-[#78847D]">No matching batch or route.</p>
                  ) : (
                    quickResults.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          navigate(item.path);
                          setSearchQuery('');
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-[#F7F9F5]"
                      >
                        <span className="font-medium text-[#202923]">{item.label}</span>
                        <span className="text-[11px] text-[#78847D]">{item.meta}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((o) => !o)}
                aria-label="Toggle alerts notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#DFE6DD] bg-white text-[#202923] transition-colors hover:bg-[#F7F9F5]"
              >
                <Bell className="h-4 w-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B91C1C] px-1 font-mono text-[10px] font-semibold text-white tabular-nums">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-[#DFE6DD] bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#EDF2EB] px-4 py-3">
                    <span className="text-xs font-semibold text-[#202923]">
                      Farm Alerts ({unreadAlertsCount} unread)
                    </span>
                    {unreadAlertsCount > 0 && (
                      <button
                        type="button"
                        onClick={acknowledgeAllAlerts}
                        className="text-xs font-medium text-[#287A55] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 divide-y divide-[#EDF2EB] overflow-y-auto">
                    {state.alerts.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-[#78847D]">
                        No active alerts.
                      </p>
                    ) : (
                      state.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`px-4 py-3 ${alert.acknowledged ? 'bg-white opacity-70' : 'bg-[#F7F9F5]'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-[11px] font-semibold ${
                                alert.severity === 'Critical' ? 'text-[#B91C1C]' : 'text-[#9E6816]'
                              }`}
                            >
                              {alert.severity} · {alert.category}
                            </span>
                            {!alert.acknowledged && (
                              <button
                                type="button"
                                onClick={() => acknowledgeAlert(alert.id)}
                                title="Acknowledge alert"
                                className="rounded p-1 text-[#78847D] hover:bg-white hover:text-[#153F32]"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-xs font-medium text-[#202923]">{alert.title}</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-[#78847D]">
                            {alert.description}
                          </p>
                          {alert.batchId && (
                            <button
                              type="button"
                              onClick={() => {
                                setNotificationsOpen(false);
                                navigate(`/batches/${alert.batchId}`);
                              }}
                              className="mt-1.5 text-[11px] font-medium text-[#153F32] hover:underline"
                            >
                              Inspect {alert.batchId}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg border border-[#DFE6DD] bg-white py-1 pl-1.5 pr-2.5 text-left transition-colors hover:bg-[#F7F9F5]"
              >
                <div className="h-7 w-7 overflow-hidden rounded-md bg-[#E8F0E8]">
                  <img
                    src={AVATAR_URL}
                    alt={state.farmProfile.managerName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="hidden text-xs font-medium text-[#202923] md:inline whitespace-nowrap">
                  {state.farmProfile.managerName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#78847D]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#DFE6DD] bg-white py-1.5 shadow-lg">
                  <div className="border-b border-[#EDF2EB] px-4 py-2.5">
                    <p className="text-xs font-semibold text-[#202923]">
                      {state.farmProfile.managerName}
                    </p>
                    <p className="text-[11px] text-[#78847D]">{state.farmProfile.managerRole}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="block w-full px-4 py-2 text-left text-xs text-[#202923] hover:bg-[#F7F9F5]"
                  >
                    Farm & Model Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/');
                    }}
                    className="block w-full px-4 py-2 text-left text-xs text-[#202923] hover:bg-[#F7F9F5]"
                  >
                    Return to Landing Page
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Header + Content */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#202923] sm:text-[26px]">
                {title}
              </h1>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
