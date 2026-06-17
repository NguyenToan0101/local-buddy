import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Globe2,
  MousePointerClick,
  RefreshCw,
  Route,
  UserCircle2,
  Users,
  Search,
  X,
  ChevronRight,
  Download,
  Calendar,
  ArrowUpRight,
  PieChartIcon,
  ListCollapse,
  Copy,
  Check,
  Eye,
  Filter,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

type AnalyticsOverview = {
  totalEvents: number;
  uniqueSessions: number;
  loggedInUsers: number;
};

type PopularPage = {
  pageUrl: string;
  views: number;
};

type TopEvent = {
  eventType: string;
  count: number;
};

type TrafficSource = {
  trafficSource: string;
  sessions: number;
};

type RecentActivity = {
  eventId: string;
  sessionKey: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: 'TRAVELER' | 'BUDDY' | string;
  eventType: string;
  pageUrl?: string;
  metadata?: Record<string, unknown>;
  trafficSource?: string;
  referrer?: string;
  landingPage?: string;
  createdAt?: string;
};

const numberFormat = new Intl.NumberFormat('en-US');
const formatCount = (value?: number) => numberFormat.format(value || 0);

const formatRole = (role?: string) => {
  if (role === 'BUDDY') return 'Buddy';
  if (role === 'TRAVELER') return 'Traveller';
  return 'Visitor';
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Unknown time';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const actionLabels: Record<string, string> = {
  PAGE_VIEW: 'Viewed a page',
  SEARCH_BUDDY: 'Searched buddies',
  VIEW_BUDDY_PROFILE: 'Viewed buddy profile',
  CREATE_BOOKING: 'Created booking',
  COMPLETE_PAYMENT: 'Completed payment',
  LOGIN: 'Logged in',
  REGISTER: 'Registered account',
  SEND_MESSAGE: 'Sent message',
  ADD_FAVORITE: 'Added favorite',
};

const metadataSummary = (metadata?: Record<string, unknown>) => {
  if (!metadata) return [];
  const keys = ['buddyId', 'bookingId', 'conversationId', 'paymentId', 'searchQuery', 'bookingType'];
  return keys
    .filter((key) => metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== '')
    .map((key) => `${key}: ${String(metadata[key]).slice(0, 48)}`);
};

const DONUT_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#3b82f6', // Blue
];

const AdminAnalytics: React.FC = () => {
  const { theme } = useTheme();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [popularPages, setPopularPages] = useState<PopularPage[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'pages'>('overview');
  const [selectedActivity, setSelectedActivity] = useState<RecentActivity | null>(null);
  const [copiedSession, setCopiedSession] = useState(false);
  const [copiedMeta, setCopiedMeta] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [eventFilter, setEventFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, pagesData, eventsData, sourcesData, activityData] = await Promise.all([
        adminService.getAnalyticsOverview(),
        adminService.getPopularPages(15),
        adminService.getTopEvents(15),
        adminService.getTrafficSources(15),
        adminService.getRecentActivity(100), // Load 100 for robust filtering and session trace
      ]);
      setOverview(overviewData);
      setPopularPages(Array.isArray(pagesData) ? pagesData : []);
      setTopEvents(Array.isArray(eventsData) ? eventsData : []);
      setTrafficSources(Array.isArray(sourcesData) ? sourcesData : []);
      setRecentActivity(Array.isArray(activityData) ? activityData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const handleCopySession = (sessionKey: string) => {
    void navigator.clipboard.writeText(sessionKey);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  const handleCopyMeta = (metaStr: string) => {
    void navigator.clipboard.writeText(metaStr);
    setCopiedMeta(true);
    setTimeout(() => setCopiedMeta(false), 2000);
  };

  // Recharts formats
  const formattedTrafficSources = useMemo(() => {
    return trafficSources.map((source) => ({
      name: source.trafficSource || 'direct',
      value: source.sessions || 0,
    }));
  }, [trafficSources]);

  const formattedTopEvents = useMemo(() => {
    return topEvents.map((event) => ({
      name: actionLabels[event.eventType] || event.eventType,
      count: event.count || 0,
    }));
  }, [topEvents]);

  const formattedPages = useMemo(() => {
    return popularPages.map((page) => ({
      name: page.pageUrl || '/',
      views: page.views || 0,
    }));
  }, [popularPages]);

  // Session events journey (tracing timeline inside the current loaded batch)
  const sessionJourney = useMemo(() => {
    if (!selectedActivity?.sessionKey) return [];
    return recentActivity
      .filter((act) => act.sessionKey === selectedActivity.sessionKey)
      .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
  }, [selectedActivity, recentActivity]);

  // Filters application
  const filteredActivities = useMemo(() => {
    return recentActivity.filter((act) => {
      // 1. Role Filter
      if (roleFilter !== 'ALL') {
        if (roleFilter === 'VISITOR' && act.userRole) return false;
        if (roleFilter === 'BUDDY' && act.userRole !== 'BUDDY') return false;
        if (roleFilter === 'TRAVELER' && act.userRole !== 'TRAVELER') return false;
      }

      // 2. Event Type Filter
      if (eventFilter !== 'ALL' && act.eventType !== eventFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = act.userName?.toLowerCase().includes(query);
        const emailMatch = act.userEmail?.toLowerCase().includes(query);
        const pageMatch = act.pageUrl?.toLowerCase().includes(query);
        const eventMatch = act.eventType.toLowerCase().includes(query);
        const sourceMatch = act.trafficSource?.toLowerCase().includes(query);
        const sessionMatch = act.sessionKey.toLowerCase().includes(query);

        return nameMatch || emailMatch || pageMatch || eventMatch || sourceMatch || sessionMatch;
      }

      return true;
    });
  }, [recentActivity, roleFilter, eventFilter, searchQuery]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, eventFilter, searchQuery]);

  // Paginated activities
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredActivities.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActivities, currentPage]);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  // Export functions
  const handleExportCSV = () => {
    const headers = [
      'Event ID',
      'Session Key',
      'User Name',
      'User Email',
      'Role',
      'Event Type',
      'Page URL',
      'Traffic Source',
      'Referrer',
      'Landing Page',
      'Created At',
    ];
    const rows = filteredActivities.map((act) => [
      act.eventId,
      act.sessionKey,
      act.userName || 'Anonymous',
      act.userEmail || 'N/A',
      act.userRole || 'VISITOR',
      act.eventType,
      act.pageUrl || '/',
      act.trafficSource || 'direct',
      act.referrer || 'N/A',
      act.landingPage || 'N/A',
      act.createdAt || 'N/A',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `localbuddy_tracking_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredActivities, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `localbuddy_tracking_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = [
    {
      label: 'Tracked Events',
      value: overview?.totalEvents,
      icon: Activity,
      color: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20',
      description: 'Total user actions recorded',
    },
    {
      label: 'Unique Sessions',
      value: overview?.uniqueSessions,
      icon: MousePointerClick,
      color: 'from-emerald-400 to-emerald-600 shadow-emerald-500/20',
      description: 'Unique browsers tracked',
    },
    {
      label: 'Logged-in Users',
      value: overview?.loggedInUsers,
      icon: Users,
      color: 'from-amber-400 to-amber-600 shadow-amber-500/20',
      description: 'Authenticated accounts',
    },
  ];

  // Recharts dynamic styles
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const tooltipBgColor = theme === 'dark' ? '#111827' : '#ffffff';
  const tooltipBorderColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  // Tooltip helper
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: tooltipBgColor,
            borderColor: tooltipBorderColor,
            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
          }}
          className="border p-3 rounded-2xl shadow-xl text-xs font-bold"
        >
          <p className="font-black mb-1.5 text-admin-muted">{payload[0].name}</p>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Count: <span className="font-black">{formatCount(payload[0].value)}</span></span>
          </div>
        </div>
      );
    }
    return null;
  };

  const DonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: tooltipBgColor,
            borderColor: tooltipBorderColor,
            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
          }}
          className="border p-3 rounded-2xl shadow-2xl text-xs font-bold"
        >
          <p className="font-black mb-1 text-admin-muted uppercase tracking-widest text-[9px]">
            {data.name}
          </p>
          <p className="font-black text-emerald-400 text-sm flex items-center gap-1.5 mt-0.5">
            {formatCount(data.value)} <span className="text-admin-muted text-xs font-bold">sessions</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-slide-up relative min-h-screen pb-16">
        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-black uppercase tracking-[0.24em]">
              <BarChart3 size={15} className="animate-pulse" />
              Live User Intelligence
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-admin-main bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
              Visitor Behaviour & Actions
            </h1>
            <p className="mt-2 text-sm font-semibold text-admin-muted">
              Analyze product events, landing page performance, and trace active session journeys.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadAnalytics()}
              disabled={loading}
              className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-60 cursor-pointer border-none"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Sync Data
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-bold text-rose-500 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            {error}
          </div>
        )}

        {/* Analytics Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="group admin-card relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-12 -translate-y-12 blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-admin-muted">
                    {metric.label}
                  </p>
                  <h2 className="mt-3 text-4.5xl font-black text-admin-main tracking-tight">
                    {loading ? (
                      <span className="inline-block w-24 h-8 bg-admin-surface animate-pulse rounded-lg" />
                    ) : (
                      formatCount(metric.value)
                    )}
                  </h2>
                  <p className="mt-2 text-xs text-admin-muted font-medium flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-emerald-500" />
                    {metric.description}
                  </p>
                </div>
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${metric.color} text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300`}
                >
                  <metric.icon size={26} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation System */}
        <div className="flex border-b border-admin pb-px gap-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-all duration-200 border-b-2 flex items-center gap-2 cursor-pointer border-none bg-transparent ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-admin-muted hover:text-admin-main'
            }`}
          >
            <PieChartIcon size={16} />
            Overview Dashboard
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-all duration-200 border-b-2 flex items-center gap-2 cursor-pointer border-none bg-transparent ${
              activeTab === 'activity'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-admin-muted hover:text-admin-main'
            }`}
          >
            <Activity size={16} />
            Live Activities
            {!loading && filteredActivities.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-admin-surface text-indigo-600 dark:text-indigo-400 text-[10px] font-black border border-admin">
                {filteredActivities.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-all duration-200 border-b-2 flex items-center gap-2 cursor-pointer border-none bg-transparent ${
              activeTab === 'pages'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-admin-muted hover:text-admin-main'
            }`}
          >
            <Route size={16} />
            Pages & Traffic Channels
          </button>
        </div>

        {/* 1. OVERVIEW DASHBOARD VIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Donut Chart (Traffic Channels) */}
            <div className="lg:col-span-2 admin-card flex flex-col justify-between min-h-[420px]">
              <div>
                <h3 className="text-xl font-black text-admin-main flex items-center gap-2">
                  <Globe2 size={20} className="text-indigo-500" />
                  Traffic Channels
                </h3>
                <p className="text-xs text-admin-muted font-bold mt-1">
                  Visitor sessions split by referrer source.
                </p>
              </div>

              <div className="h-56 relative my-4 flex items-center justify-center">
                {loading ? (
                  <div className="w-32 h-32 rounded-full border-4 border-admin border-t-indigo-600 animate-spin" />
                ) : formattedTrafficSources.length === 0 ? (
                  <div className="text-xs text-admin-muted font-bold">No sessions captured.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formattedTrafficSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {formattedTrafficSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase text-admin-muted tracking-widest">
                    Sessions
                  </span>
                  <span className="text-2xl font-black text-admin-main mt-0.5">
                    {formatCount(overview?.uniqueSessions)}
                  </span>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                {formattedTrafficSources.slice(0, 6).map((source, index) => (
                  <div key={source.name} className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                    />
                    <span className="text-xs font-black text-admin-main truncate capitalize">
                      {source.name}
                    </span>
                    <span className="text-[10px] text-admin-muted font-bold ml-auto shrink-0">
                      {source.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart (Top Events Actions) */}
            <div className="lg:col-span-3 admin-card flex flex-col justify-between min-h-[420px]">
              <div>
                <h3 className="text-xl font-black text-admin-main flex items-center gap-2">
                  <Activity size={20} className="text-emerald-500" />
                  Top Triggered Events
                </h3>
                <p className="text-xs text-admin-muted font-bold mt-1">
                  Most frequent custom actions and user micro-conversions.
                </p>
              </div>

              <div className="h-68 my-4">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-admin border-t-indigo-600 animate-spin rounded-full" />
                  </div>
                ) : formattedTopEvents.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-admin-muted font-bold">
                    No events captured.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedTopEvents.slice(0, 6)} layout="vertical" margin={{ left: -10, right: 10 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke={axisColor}
                        fontSize={10}
                        fontWeight={800}
                        tickLine={false}
                        axisLine={false}
                        width={120}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={14}>
                        {formattedTopEvents.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-admin pt-4">
                <span className="text-[10px] font-black uppercase text-admin-muted tracking-widest">
                  Active tracking types: {topEvents.length}
                </span>
                <button
                  onClick={() => setActiveTab('activity')}
                  className="text-xs font-black text-indigo-500 flex items-center gap-1 hover:text-indigo-600 cursor-pointer border-none bg-transparent"
                >
                  Inspect Event Feed
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Quick Activity Highlights */}
            <div className="lg:col-span-5 admin-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-admin-main">Live Feed Pulse</h3>
                  <p className="text-xs text-admin-muted font-bold mt-1">
                    Latest event stream captured. Click to audit.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('activity')}
                  className="text-xs font-black text-indigo-500 hover:underline cursor-pointer border-none bg-transparent"
                >
                  View all logs
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentActivity.slice(0, 3).map((act) => {
                  const label = actionLabels[act.eventType] || act.eventType;
                  return (
                    <div
                      key={act.eventId}
                      onClick={() => {
                        setSelectedActivity(act);
                        setActiveTab('activity');
                      }}
                      className="border border-admin rounded-2xl p-4 bg-admin-surface hover:border-indigo-500/30 hover:bg-indigo-500/[0.01] transition-all cursor-pointer group flex flex-col justify-between min-h-[120px]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-admin-main truncate">
                            {act.userName || 'Guest User'}
                          </p>
                          <p className="text-[10px] text-admin-muted font-bold mt-0.5">
                            {formatRole(act.userRole)}
                          </p>
                        </div>
                        <span className="text-[9px] text-admin-muted font-bold shrink-0">
                          {new Date(act.createdAt || '').toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 truncate">
                          {label}
                        </p>
                        <p className="text-[10px] text-admin-muted font-bold truncate mt-1">
                          {act.pageUrl || '/'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. ACTIVITY timeline logs feed tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Filter Panel */}
            <div className="admin-card space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by visitor name, email, URL, referrer or session key..."
                    className="w-full admin-input pl-12 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-admin-main cursor-pointer border-none bg-transparent"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportCSV}
                    className="h-10 px-4 rounded-xl border border-admin text-admin-main text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 bg-admin-surface hover:bg-[var(--admin-card)] active:scale-95 transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    CSV
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="h-10 px-4 rounded-xl border border-admin text-admin-main text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 bg-admin-surface hover:bg-[var(--admin-card)] active:scale-95 transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    JSON
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-4 border-t border-admin">
                {/* Role selection tab pills */}
                <div className="flex items-center gap-1.5 bg-admin-surface p-1.5 rounded-xl border border-admin">
                  {['ALL', 'TRAVELER', 'BUDDY', 'VISITOR'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-none ${
                        roleFilter === role
                          ? 'bg-[var(--admin-card)] text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-admin-muted bg-transparent hover:text-admin-main'
                      }`}
                    >
                      {role === 'ALL'
                        ? 'All Users'
                        : role === 'TRAVELER'
                        ? 'Travellers'
                        : role === 'BUDDY'
                        ? 'Buddies'
                        : 'Guests'}
                    </button>
                  ))}
                </div>

                {/* Event type dropdown */}
                <div className="flex items-center gap-2">
                  <Filter size={13} className="text-admin-muted" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-admin-muted">
                    Action:
                  </span>
                  <select
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    className="bg-admin-surface border border-admin rounded-xl px-3 py-1.5 text-xs font-bold text-admin-main outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="ALL">All Event Types</option>
                    {Object.keys(actionLabels).map((key) => (
                      <option key={key} value={key}>
                        {actionLabels[key]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear all filters */}
                {(roleFilter !== 'ALL' || eventFilter !== 'ALL' || searchQuery !== '') && (
                  <button
                    onClick={() => {
                      setRoleFilter('ALL');
                      setEventFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 cursor-pointer ml-auto flex items-center gap-1 border-none bg-transparent"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* List View */}
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-[24px] border border-admin bg-[var(--admin-card)] p-5 animate-pulse flex flex-col gap-3"
                  >
                    <div className="h-5 w-48 bg-admin-surface rounded" />
                    <div className="h-4 w-96 bg-admin-surface rounded" />
                  </div>
                ))
              ) : paginatedActivities.length === 0 ? (
                <div className="rounded-[32px] border border-admin bg-[var(--admin-card)] py-16 text-center shadow-sm">
                  <Eye size={40} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-black text-admin-main">No activities match</h3>
                  <p className="text-xs text-admin-muted font-bold mt-1">
                    Try broadening your search text or removing the role/action filters.
                  </p>
                </div>
              ) : (
                paginatedActivities.map((act) => {
                  const meta = metadataSummary(act.metadata);
                  const label = actionLabels[act.eventType] || act.eventType;
                  const source = act.trafficSource || 'direct';
                  const isSelected = selectedActivity?.eventId === act.eventId;

                  return (
                    <div
                      key={act.eventId}
                      onClick={() => setSelectedActivity(act)}
                      className={`group rounded-2xl border transition-all p-4 cursor-pointer relative ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-md'
                          : 'border-admin bg-[var(--admin-card)] hover:border-indigo-500/20 hover:bg-admin-surface'
                      }`}
                    >
                      <div className="grid grid-cols-1 xl:grid-cols-[minmax(240px,0.9fr)_minmax(280px,1.2fr)_minmax(220px,0.8fr)] gap-4 items-center">
                        {/* 1. User details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-indigo-600/10 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center shrink-0">
                            <UserCircle2 size={22} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="truncate text-sm font-black text-admin-main">
                                {act.userName || 'Guest Visitor'}
                              </p>
                              <span
                                className={`shrink-0 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                                  act.userRole === 'BUDDY'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : act.userRole === 'TRAVELER'
                                    ? 'bg-indigo-600/10 text-indigo-500'
                                    : 'bg-admin-surface text-admin-muted border border-admin'
                                }`}
                              >
                                {formatRole(act.userRole)}
                              </span>
                            </div>
                            <p className="truncate text-[10px] font-bold text-admin-muted mt-0.5">
                              {act.userEmail || `Session Key: ${act.sessionKey?.slice(0, 10)}...`}
                            </p>
                          </div>
                        </div>

                        {/* 2. Action info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                            <p className="text-sm font-black text-admin-main truncate">{label}</p>
                          </div>
                          <p className="truncate text-[11px] font-bold text-admin-muted mt-1 leading-relaxed pl-4">
                            {act.pageUrl || '/'}
                          </p>
                          {meta.length > 0 && (
                            <div className="mt-2 pl-4 flex flex-wrap gap-1.5">
                              {meta.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-lg bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-[9px] font-black text-indigo-600 dark:text-indigo-400 border border-indigo-200/20"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 3. Session / Traffic info */}
                        <div className="xl:text-right min-w-0 flex flex-col xl:items-end justify-center pl-4 xl:pl-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-admin-muted">
                            {formatDateTime(act.createdAt)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] font-bold text-admin-muted">Referral Source:</span>
                            <span className="text-xs font-black text-indigo-500 capitalize">{source}</span>
                          </div>
                          {act.landingPage && (
                            <p className="truncate text-[10px] font-bold text-admin-muted mt-0.5">
                              Landing: {act.landingPage}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-admin pt-6">
                <span className="text-xs text-admin-muted font-bold">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredActivities.length)} of{' '}
                  {filteredActivities.length} logs
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest border border-admin rounded-xl bg-admin-surface text-admin-main hover:bg-[var(--admin-card)] disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-black text-admin-main px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest border border-admin rounded-xl bg-admin-surface text-admin-main hover:bg-[var(--admin-card)] disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. PAGES PERFORMANCE & TRAFFIC TAB */}
        {activeTab === 'pages' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Horizontal Bar Chart (Page view counts) */}
            <div className="xl:col-span-3 admin-card flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-admin-main flex items-center gap-2">
                  <Route size={20} className="text-indigo-500" />
                  Route Performance Chart
                </h3>
                <p className="text-xs text-admin-muted font-bold mt-1">
                  Graphical views count analysis across platform endpoints.
                </p>
              </div>

              <div className="h-80 my-6">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-admin border-t-indigo-600 animate-spin rounded-full" />
                  </div>
                ) : formattedPages.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-admin-muted font-bold">
                    No page views tracked.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedPages.slice(0, 7)} margin={{ left: -10, right: 10, bottom: 20 }}>
                      <XAxis
                        dataKey="name"
                        stroke={axisColor}
                        fontSize={9}
                        fontWeight={700}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => (value.length > 15 ? `${value.slice(0, 15)}...` : value)}
                      />
                      <YAxis stroke={axisColor} fontSize={10} fontWeight={800} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                      <Bar dataKey="views" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={16}>
                        {formattedPages.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="text-[10px] font-black uppercase text-admin-muted tracking-widest pt-4 border-t border-admin">
                Performance indicators scaled dynamically.
              </div>
            </div>

            {/* Popular Pages List meter rows */}
            <div className="xl:col-span-2 admin-card">
              <div className="mb-6">
                <h3 className="text-xl font-black text-admin-main flex items-center gap-2">
                  <Route size={20} className="text-indigo-500" />
                  Popular Pages List
                </h3>
                <p className="text-xs text-admin-muted font-bold mt-1">
                  Absolute page views grouped by system URLs.
                </p>
              </div>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {popularPages.length === 0 && !loading ? (
                  <div className="rounded-2xl border border-dashed border-admin py-12 text-center text-xs font-bold text-admin-muted bg-admin-surface">
                    No views captured.
                  </div>
                ) : (
                  popularPages.map((page, index) => {
                    const maxVal = Math.max(1, ...popularPages.map((p) => p.views));
                    const widthPercent = `${Math.max(5, Math.round((page.views / maxVal) * 100))}%`;
                    return (
                      <div key={page.pageUrl} className="flex flex-col gap-2 p-2 border-b border-admin">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-black text-admin-main truncate">
                            {page.pageUrl || '/'}
                          </span>
                          <span className="text-[10px] font-black text-indigo-500 whitespace-nowrap bg-admin-surface px-2 py-0.5 rounded-lg border border-admin">
                            {formatCount(page.views)} views
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-admin-surface overflow-hidden border border-admin">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: widthPercent,
                              backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. SESSION DETAILED INSPECTOR DRAWER */}
        {selectedActivity && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
              onClick={() => setSelectedActivity(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-2xl bg-[var(--admin-card)] border-l border-admin shadow-2xl flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-admin flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-admin-main">Session Event Inspector</h3>
                    <p className="text-xs text-admin-muted font-bold mt-0.5">
                      Session: <span className="text-indigo-500">{selectedActivity.sessionKey.slice(0, 16)}...</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCopySession(selectedActivity.sessionKey)}
                      className="w-9 h-9 rounded-xl bg-admin-surface text-admin-muted hover:text-admin-main flex items-center justify-center border border-admin transition-all cursor-pointer"
                      title="Copy Session Key"
                    >
                      {copiedSession ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => setSelectedActivity(null)}
                      className="w-9 h-9 rounded-xl bg-admin-surface text-admin-muted hover:text-admin-main flex items-center justify-center border border-admin transition-all cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Visitor Profile Info Card */}
                  <div className="border border-admin bg-admin-surface rounded-3xl p-5">
                    <h4 className="text-xs font-black uppercase text-admin-muted tracking-wider mb-4">
                      Visitor Audit Card
                    </h4>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <div>
                        <span className="text-[10px] text-admin-muted font-bold block">User Identity</span>
                        <span className="text-xs font-black text-admin-main mt-0.5 block">
                          {selectedActivity.userName || 'Anonymous Visitor'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-admin-muted font-bold block">User Role</span>
                        <span
                          className={`inline-block mt-0.5 rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            selectedActivity.userRole === 'BUDDY'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : selectedActivity.userRole === 'TRAVELER'
                              ? 'bg-indigo-600/10 text-indigo-500'
                              : 'bg-admin-surface text-admin-muted border border-admin'
                          }`}
                        >
                          {formatRole(selectedActivity.userRole)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-admin-muted font-bold block">Email Address</span>
                        <span className="text-xs font-black text-admin-main mt-0.5 block truncate">
                          {selectedActivity.userEmail || 'N/A (Visitor not logged in)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-admin-muted font-bold block">Traffic Channel</span>
                        <span className="text-xs font-black text-indigo-500 capitalize mt-0.5 block">
                          {selectedActivity.trafficSource || 'direct'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-admin-muted font-bold block">Action Event</span>
                        <span className="text-xs font-black text-emerald-500 mt-0.5 block">
                          {selectedActivity.eventType}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-admin-muted font-bold block">Page URL</span>
                        <span className="text-xs font-black text-admin-main mt-0.5 block leading-relaxed select-all">
                          {selectedActivity.pageUrl || '/'}
                        </span>
                      </div>
                      {selectedActivity.referrer && (
                        <div className="col-span-2">
                          <span className="text-[10px] text-admin-muted font-bold block">Referrer Url</span>
                          <span className="text-xs font-black text-admin-muted mt-0.5 block truncate select-all">
                            {selectedActivity.referrer}
                          </span>
                        </div>
                      )}
                      {selectedActivity.landingPage && (
                        <div className="col-span-2">
                          <span className="text-[10px] text-admin-muted font-bold block">Landing URL</span>
                          <span className="text-xs font-black text-admin-muted mt-0.5 block leading-relaxed select-all">
                            {selectedActivity.landingPage}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata Audit */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black uppercase text-admin-muted tracking-wider">
                        Action Metadata (JSON Payload)
                      </h4>
                      {selectedActivity.metadata && (
                        <button
                          onClick={() => handleCopyMeta(JSON.stringify(selectedActivity.metadata, null, 2))}
                          className="text-[10px] font-black text-indigo-500 flex items-center gap-1 hover:underline cursor-pointer border-none bg-transparent"
                        >
                          {copiedMeta ? 'Copied payload' : 'Copy payload'}
                        </button>
                      )}
                    </div>
                    {selectedActivity.metadata ? (
                      <pre className="bg-slate-950 text-slate-300 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-56 scrollbar-hide border border-slate-800 shadow-inner">
                        {JSON.stringify(selectedActivity.metadata, null, 2)}
                      </pre>
                    ) : (
                      <div className="bg-admin-surface border border-admin rounded-2xl py-6 text-center text-xs font-bold text-admin-muted">
                        No metadata details parsed for this action type.
                      </div>
                    )}
                  </div>

                  {/* Interactive session timeline trace */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-admin-muted tracking-wider mb-4">
                      Session Journey Path ({sessionJourney.length} actions logged)
                    </h4>

                    <div className="relative border-l border-admin ml-3 pl-6 space-y-6 py-2">
                      {sessionJourney.map((journeyAct) => {
                        const isCurrentEvent = journeyAct.eventId === selectedActivity.eventId;
                        const formattedTime = new Date(journeyAct.createdAt || '').toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        });

                        return (
                          <div
                            key={journeyAct.eventId}
                            onClick={() => setSelectedActivity(journeyAct)}
                            className="relative group cursor-pointer"
                          >
                            {/* Point Indicator */}
                            <span
                              className={`absolute -left-9 top-1 w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all ${
                                isCurrentEvent
                                  ? 'bg-indigo-600 border-indigo-100 dark:border-indigo-950 scale-110 shadow-md shadow-indigo-600/30'
                                  : 'bg-[var(--admin-card)] border-admin group-hover:border-indigo-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isCurrentEvent ? 'bg-white' : 'bg-slate-400 dark:bg-slate-600 group-hover:bg-indigo-400'
                                }`}
                              />
                            </span>

                            <div
                              className={`p-3.5 rounded-xl border transition-all ${
                                isCurrentEvent
                                  ? 'border-indigo-500/30 bg-indigo-50/10 dark:bg-indigo-950/20'
                                  : 'border-admin bg-admin-surface hover:border-slate-350 hover:bg-[var(--admin-card)]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <span className="text-xs font-black text-admin-main">
                                  {actionLabels[journeyAct.eventType] || journeyAct.eventType}
                                </span>
                                <span className="text-[10px] text-admin-muted font-bold">
                                  {formattedTime}
                                </span>
                              </div>
                              <p className="text-[10px] text-admin-muted font-bold truncate mt-1 select-all">
                                {journeyAct.pageUrl || '/'}
                              </p>

                              {journeyAct.metadata && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {metadataSummary(journeyAct.metadata).map((metaItem) => (
                                    <span
                                      key={metaItem}
                                      className="text-[8px] font-black bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-500 border border-indigo-200/10"
                                    >
                                      {metaItem}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
