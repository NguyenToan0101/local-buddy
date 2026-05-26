import React, { useEffect, useMemo, useState } from 'react';
import {
  Siren,
  FileDown,
  Megaphone,
  AlertTriangle,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

type SosStatus = 'ACTIVE' | 'RESPONDING' | 'RESOLVED';
type Severity = 'CRITICAL' | 'PENDING';

type SosAlert = {
  id: string;
  createdAt: string; // ISO
  status: SosStatus;
  severity: Severity;
  userId: string;
  userRole: 'TRAVELER' | 'BUDDY';
  userName: string;
  userAvatar?: string;
  buddyId?: string;
  buddyName?: string;
  locationText?: string;
  lat?: number;
  lng?: number;
  note?: string;
};

const MOCK_KEY = 'mock_sos_alerts_v1';

const seedMockAlerts = (): SosAlert[] => ([
  {
    id: 'sos_1001',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    severity: 'CRITICAL',
    userId: 'u_demo_1',
    userRole: 'TRAVELER',
    userName: 'Alex Murphy',
    userAvatar: 'https://i.pravatar.cc/150?u=alex-murphy',
    buddyId: '1',
    buddyName: 'Officer Sarah Jenkins',
    locationText: 'Hanoi Old Quarter',
    lat: 21.033,
    lng: 105.850,
    note: 'Medical emergency – traveler feels dizzy.',
  },
  {
    id: 'sos_1002',
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    severity: 'PENDING',
    userId: 'b_demo_2',
    userRole: 'BUDDY',
    userName: 'Linda Bennett',
    userAvatar: 'https://i.pravatar.cc/150?u=linda-bennett',
    buddyId: '2',
    buddyName: 'Michael Bennett (Family)',
    locationText: 'Ho Chi Minh City, District 1',
    note: 'Suspicious activity reported near meetup point.',
  },
  {
    id: 'sos_1003',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'RESPONDING',
    severity: 'CRITICAL',
    userId: 'u_demo_3',
    userRole: 'TRAVELER',
    userName: 'Tom Chen',
    userAvatar: 'https://i.pravatar.cc/150?u=tom-chen',
    buddyId: '8',
    buddyName: 'EMS Unit #42',
    locationText: 'Da Nang, Vietnam',
    note: 'Accident report – moving to nearest clinic.',
  },
]);

function loadMock(): SosAlert[] {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    if (!raw) {
      const seeded = seedMockAlerts();
      localStorage.setItem(MOCK_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch {
    return seedMockAlerts();
  }
}

function saveMock(next: SosAlert[]) {
  try {
    localStorage.setItem(MOCK_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function downloadTextFile(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const AdminSOSMonitoring: React.FC = () => {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const demo = loadMock().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAlerts(demo);
      if (!selectedId && demo.length > 0) setSelectedId(demo[0].id);
    } catch (err: any) {
      const demo = loadMock().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAlerts(demo);
      if (!selectedId && demo.length > 0) setSelectedId(demo[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  const selected = useMemo(
    () => alerts.find((a) => a.id === selectedId) || null,
    [alerts, selectedId]
  );

  const metrics = useMemo(() => {
    const active = alerts.filter((a) => a.status !== 'RESOLVED').length;
    const responding = alerts.filter((a) => a.status === 'RESPONDING').length;
    // Placeholder avg: based on minutes since creation for unresolved
    const unresolved = alerts.filter((a) => a.status !== 'RESOLVED');
    const avgSec =
      unresolved.length === 0
        ? 0
        : Math.floor(
            unresolved.reduce((acc, a) => acc + (Date.now() - new Date(a.createdAt).getTime()) / 1000, 0) /
              unresolved.length
          );
    return { active, responding, avgSec };
  }, [alerts]);

  const exportLogs = () => {
    const rows = alerts.map((a) => ({
      id: a.id,
      createdAt: a.createdAt,
      status: a.status,
      severity: a.severity,
      userId: a.userId,
      userRole: a.userRole,
      userName: a.userName,
      buddyId: a.buddyId || '',
      buddyName: a.buddyName || '',
      locationText: a.locationText || '',
      lat: a.lat ?? '',
      lng: a.lng ?? '',
      note: a.note || '',
    }));
    downloadTextFile(`sos-logs-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(rows, null, 2), 'application/json');
  };

  const broadcastAlert = () => {
    downloadTextFile(
      `broadcast-template-${new Date().toISOString().slice(0, 10)}.txt`,
      `Broadcast message template:\n\nWe are aware of an SOS alert and our safety team is responding.\n\n- Admin`,
      'text/plain'
    );
  };

  const setStatus = async (id: string, status: SosStatus) => {
    try {
      setLoading(true);
      setError(null);
      const next = alerts.map((a) => (a.id === id ? { ...a, status } : a));
      setAlerts(next);
      saveMock(next);
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <AdminLayout>
      <div className="space-y-10 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-admin-main flex items-center gap-3">
              <Siren className="text-rose-500" size={34} />
              Live SOS Monitoring
            </h1>
            <p className="text-lg font-bold text-admin-muted">
              Real-time emergency tracking and response dispatch center.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportLogs}
              className="h-12 px-6 rounded-2xl bg-admin-surface border border-admin text-admin-main font-black text-[11px] uppercase tracking-[0.18em] hover:border-indigo-500/40 transition-all"
            >
              <span className="inline-flex items-center gap-2">
                <FileDown size={18} /> Export Logs
              </span>
            </button>
            <button
              onClick={broadcastAlert}
              className="h-12 px-6 rounded-2xl bg-rose-500 text-white font-black text-[11px] uppercase tracking-[0.18em] shadow-xl shadow-rose-500/20 hover:scale-[1.02] transition-all"
            >
              <span className="inline-flex items-center gap-2">
                <Megaphone size={18} /> Broadcast Alert
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium flex items-center gap-3">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        {loading && (
          <div className="p-4 rounded-2xl bg-admin-surface border border-admin text-admin-muted text-sm font-medium">
            Loading SOS monitoring...
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Left: Alerts list */}
          <div className="xl:col-span-1 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="admin-card">
                <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.25em] mb-2">
                  Active Alerts
                </p>
                <p className="text-4xl font-black text-admin-main">{metrics.active}</p>
              </div>
              <div className="admin-card">
                <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.25em] mb-2">
                  Responders Dispatched
                </p>
                <p className="text-4xl font-black text-admin-main">{String(metrics.responding).padStart(2, '0')}</p>
                <p className="text-[11px] font-black text-emerald-500 mt-2">All units communicating</p>
              </div>
              <div className="admin-card">
                <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.25em] mb-2">
                  Avg. Response Time
                </p>
                <p className="text-4xl font-black text-admin-main">{formatDuration(metrics.avgSec)}</p>
                <p className="text-[11px] font-black text-admin-muted mt-2">Estimate based on open alerts</p>
              </div>
            </div>

            <div className="admin-card !p-0 overflow-hidden border-none shadow-2xl">
              <div className="px-8 py-6 border-b border-admin flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-admin-main tracking-tight">Incoming Distress</h3>
                  <p className="text-sm font-bold text-admin-muted">Newest alerts first.</p>
                </div>
                <button onClick={refresh} className="admin-btn-muted border border-admin !h-11 !px-5">
                  Refresh
                </button>
              </div>
              <div className="divide-y divide-admin">
                {alerts.map((a) => {
                  const isActive = a.id === selectedId;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedId(a.id)}
                      className={`w-full text-left px-8 py-6 hover:bg-admin-surface/50 transition-all ${
                        isActive ? 'bg-admin-surface/60' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4 min-w-0">
                          <img
                            src={a.userAvatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(a.userId)}`}
                            className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                            alt=""
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-black text-admin-main truncate">{a.userName}</p>
                            <p className="text-[10px] font-black text-admin-muted uppercase tracking-widest truncate">
                              {a.userRole} • {new Date(a.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              a.severity === 'CRITICAL'
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {a.severity}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              a.status === 'ACTIVE'
                                ? 'bg-rose-500/10 text-rose-500'
                                : a.status === 'RESPONDING'
                                ? 'bg-indigo-500/10 text-indigo-500'
                                : 'bg-emerald-500/10 text-emerald-500'
                            }`}
                          >
                            {a.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {alerts.length === 0 && (
                  <div className="px-8 py-16 text-center text-admin-muted font-bold">
                    No SOS alerts yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Map + details */}
          <div className="xl:col-span-2 space-y-10">
            <div className="admin-card !p-0 overflow-hidden border-none shadow-2xl">
              <div className="relative h-[420px]">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                  className="w-full h-full object-cover opacity-90"
                  alt="map"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] via-black/10 to-transparent"></div>
                <div className="absolute left-10 bottom-10 bg-admin-surface/90 backdrop-blur-xl border border-admin rounded-3xl px-6 py-4">
                  <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.25em]">Live Legend</p>
                  <div className="mt-3 space-y-2 text-[11px] font-black">
                    <div className="flex items-center gap-3 text-admin-main">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Unconfirmed SOS
                    </div>
                    <div className="flex items-center gap-3 text-admin-main">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Police Unit
                    </div>
                    <div className="flex items-center gap-3 text-admin-main">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Public Service
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-admin-main tracking-tight">Incident Details</h3>
                  <p className="text-sm font-bold text-admin-muted">
                    {selected ? `Alert #${selected.id}` : 'Select an alert from the left panel.'}
                  </p>
                </div>
                {selected && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStatus(selected.id, 'RESPONDING')}
                      disabled={selected.status === 'RESPONDING' || selected.status === 'RESOLVED'}
                      className="h-12 px-6 rounded-2xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.18em] shadow-primary-glow disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Clock size={18} /> Dispatch Unit
                      </span>
                    </button>
                    <button
                      onClick={() => setStatus(selected.id, 'RESOLVED')}
                      disabled={selected.status === 'RESOLVED'}
                      className="h-12 px-6 rounded-2xl bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.18em] shadow-xl shadow-emerald-600/20 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 size={18} /> Resolve
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {selected ? (
                <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-admin-surface border border-admin">
                      <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.25em] mb-2">Caller</p>
                      <div className="flex items-center gap-4">
                        <img
                          src={selected.userAvatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(selected.userId)}`}
                          className="w-14 h-14 rounded-2xl object-cover shadow-lg"
                          alt=""
                        />
                        <div>
                          <p className="text-sm font-black text-admin-main">{selected.userName}</p>
                          <p className="text-[10px] font-black text-admin-muted uppercase tracking-widest">
                            {selected.userRole} • {selected.severity}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-admin-surface border border-admin">
                      <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.25em] mb-2">Assigned Buddy</p>
                      <p className="text-sm font-black text-admin-main">
                        {selected.buddyName ? `${selected.buddyName} (ID: ${selected.buddyId})` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-admin-surface border border-admin">
                      <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.25em] mb-2">Location</p>
                      <p className="text-sm font-black text-admin-main inline-flex items-center gap-2">
                        <MapPin size={18} className="text-indigo-500" />
                        {selected.locationText || 'Unknown'}
                      </p>
                      <p className="text-[10px] font-black text-admin-muted uppercase tracking-widest mt-2">
                        {selected.lat != null && selected.lng != null ? `${selected.lat}, ${selected.lng}` : ''}
                      </p>
                    </div>

                    <div className="p-6 rounded-3xl bg-admin-surface border border-admin">
                      <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.25em] mb-2">Notes</p>
                      <p className="text-sm font-bold text-admin-muted">{selected.note || '—'}</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-admin-surface border border-admin flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.25em]">Status</p>
                        <p className="text-sm font-black text-admin-main mt-1">{selected.status}</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center">
                        <Phone size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-10 text-admin-muted font-bold">No alert selected.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSOSMonitoring;

