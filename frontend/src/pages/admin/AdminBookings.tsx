import React, { useEffect, useState } from 'react';
import {
    Search, Filter, ChevronDown, Calendar, MapPin, Users, DollarSign,
    Clock, Loader2, AlertTriangle, X, Eye, User
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminService } from '../../services/api';

interface BookingRecord {
    id: string;
    traveler: string;
    travelerAvatar: string;
    buddyName: string;
    buddyAvatar: string;
    title: string;
    description: string;
    meetingPoint?: string;
    date: string;
    time: string;
    hours: number;
    guests: number;
    totalPrice: number;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
    meetupStatus: string;
}

type FilterStatus = 'All' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

const BookingAvatar = ({ src, name, className }: { src?: string; name?: string; className: string }) => (
    src ? (
        <img src={src} className={`${className} object-cover shadow-lg`} alt={name || 'User'} />
    ) : (
        <div className={`${className} flex items-center justify-center bg-indigo-100 text-xs font-black uppercase text-indigo-600 shadow-lg`}>
            {(name || 'LB').slice(0, 2)}
        </div>
    )
);

const AdminBookings: React.FC = () => {
    const [filter, setFilter] = useState<FilterStatus>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);

    const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all bookings from backend
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await adminService.getAllBookings();
                setAllBookings(data || []);
            } catch (err: any) {
                setError(err.message || 'Failed to load bookings');
                console.error('Error fetching bookings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    // Filter data based on status filter and search query
    const filteredData = allBookings
        .filter((item) => filter === 'All' || item.status === filter)
        .filter((item) => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return (
                item.traveler.toLowerCase().includes(query) ||
                item.buddyName.toLowerCase().includes(query) ||
                item.title.toLowerCase().includes(query) ||
                (item.meetingPoint || '').toLowerCase().includes(query)
            );
        });

    // Get counts for each status
    const statusCounts = {
        All: allBookings.length,
        PENDING: allBookings.filter((b) => b.status === 'PENDING').length,
        CONFIRMED: allBookings.filter((b) => b.status === 'CONFIRMED').length,
        COMPLETED: allBookings.filter((b) => b.status === 'COMPLETED').length,
        CANCELLED: allBookings.filter((b) => b.status === 'CANCELLED').length,
        REJECTED: allBookings.filter((b) => b.status === 'REJECTED').length,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-amber-100 text-amber-600';
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-600';
            case 'COMPLETED':
                return 'bg-emerald-100 text-emerald-600';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-600';
            case 'REJECTED':
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusDotColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-amber-500 animate-pulse';
            case 'CONFIRMED':
                return 'bg-blue-500';
            case 'COMPLETED':
                return 'bg-emerald-500';
            case 'CANCELLED':
                return 'bg-gray-500';
            case 'REJECTED':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-10 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tight text-admin-main flex items-center gap-3">
                            <Calendar className="text-indigo-600" size={36} />
                            Booking Management
                        </h1>
                        <p className="text-lg font-bold text-admin-muted">
                            Monitor and manage all bookings across the platform.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group w-full max-w-xs">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-muted group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search bookings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full admin-input pl-12"
                            />
                        </div>

                        <div className="relative group">
                            <button className="flex items-center gap-3 h-12 px-6 text-sm font-black bg-admin-surface border border-admin rounded-2xl transition-all shadow-sm hover:border-indigo-500/50">
                                <Filter size={18} className="text-indigo-500" />
                                {filter}
                                <ChevronDown size={16} className="text-admin-muted group-hover:rotate-180 transition-transform" />
                            </button>
                            <div className="absolute right-0 mt-3 w-48 admin-glass rounded-2xl shadow-2xl overflow-hidden border border-admin invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-50">
                                {(['All', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'] as FilterStatus[]).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className="w-full text-left px-6 py-4 text-xs font-black hover:bg-indigo-600 hover:text-white transition-all border-b border-admin last:border-none text-admin-main flex items-center justify-between"
                                    >
                                        <span>{f}</span>
                                        <span className="text-admin-muted text-[10px]">{statusCounts[f]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total', count: statusCounts.All, color: 'indigo' },
                        { label: 'Pending', count: statusCounts.PENDING, color: 'amber' },
                        { label: 'Confirmed', count: statusCounts.CONFIRMED, color: 'blue' },
                        { label: 'Completed', count: statusCounts.COMPLETED, color: 'emerald' },
                        { label: 'Cancelled', count: statusCounts.CANCELLED, color: 'gray' },
                        { label: 'Rejected', count: statusCounts.REJECTED, color: 'red' },
                    ].map((stat) => (
                        <div key={stat.label} className="admin-card p-6">
                            <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.2em] mb-2">
                                {stat.label}
                            </p>
                            <p className={`text-3xl font-black text-${stat.color}-600`}>{stat.count}</p>
                        </div>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium flex items-center gap-3">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto hover:opacity-70">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="p-12 rounded-2xl bg-admin-surface border border-admin text-center">
                        <Loader2 size={48} className="animate-spin text-indigo-500 mx-auto mb-4" />
                        <p className="text-sm font-medium text-admin-muted">Loading bookings...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredData.length === 0 && (
                    <div className="p-12 rounded-2xl bg-admin-surface border border-admin text-center">
                        <div className="w-16 h-16 bg-admin-layout-bg rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar size={32} className="text-admin-muted" />
                        </div>
                        <h3 className="text-lg font-black text-admin-main mb-2">No Bookings Found</h3>
                        <p className="text-sm text-admin-muted">
                            {searchQuery || filter !== 'All'
                                ? 'Try adjusting your filters or search query.'
                                : 'No bookings available yet.'}
                        </p>
                    </div>
                )}

                {/* Bookings Table */}
                {!loading && filteredData.length > 0 && (
                    <div className="admin-card !p-0 overflow-hidden border-none shadow-2xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-admin bg-admin-surface/50">
                                        <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                                            Booking Details
                                        </th>
                                        <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em] md:table-cell hidden">
                                            Date & Time
                                        </th>
                                        <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em] md:table-cell hidden">
                                            Location
                                        </th>
                                        <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                                            Price
                                        </th>
                                        <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                                            Status
                                        </th>
                                        <th className="px-8 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-admin">
                                    {filteredData.map((booking) => (
                                        <tr key={booking.id} className="group hover:bg-admin-surface/50 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <BookingAvatar src={booking.travelerAvatar} name={booking.traveler} className="w-10 h-10 rounded-xl" />
                                                        <div>
                                                            <p className="text-xs font-black text-admin-main">{booking.traveler}</p>
                                                            <p className="text-[10px] font-bold text-admin-muted">Traveler</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <BookingAvatar src={booking.buddyAvatar} name={booking.buddyName} className="w-10 h-10 rounded-xl" />
                                                        <div>
                                                            <p className="text-xs font-black text-admin-main">{booking.buddyName}</p>
                                                            <p className="text-[10px] font-bold text-admin-muted">Buddy</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-black text-indigo-600 mt-2">{booking.title}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 md:table-cell hidden">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-admin-main text-xs font-black">
                                                        <Calendar size={16} className="text-indigo-500" />
                                                        {new Date(booking.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-admin-muted text-xs font-black">
                                                        <Clock size={16} className="text-indigo-500" />
                                                        {booking.time} ({booking.hours}h)
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 md:table-cell hidden">
                                                <div className="flex items-center gap-2 text-admin-muted text-xs font-black">
                                                    <MapPin size={16} className="text-indigo-500" />
                                                    {booking.meetingPoint || 'To be confirmed'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-admin-surface text-indigo-600 text-xs font-black border border-admin">
                                                    <DollarSign size={14} />
                                                    ${booking.totalPrice}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div
                                                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(booking.status)}`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${getStatusDotColor(booking.status)}`}></span>
                                                    {booking.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="w-10 h-10 rounded-xl bg-admin-surface text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-admin flex items-center justify-center lg:ml-auto lg:mr-0"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Detail Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-fade-in">
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                        onClick={() => setSelectedBooking(null)}
                    ></div>

                    <div className="bg-admin-sidebar border border-admin w-full max-w-3xl rounded-[48px] shadow-2xl overflow-hidden relative z-10">
                        <button
                            className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-admin-surface flex items-center justify-center text-admin-muted hover:text-rose-500 border border-admin shadow-sm transition-all z-20"
                            onClick={() => setSelectedBooking(null)}
                        >
                            <X size={24} />
                        </button>

                        <div className="p-12 space-y-8 overflow-y-auto custom-scrollbar max-h-[85vh]">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-admin-main">Booking Details</h3>

                                <div className="p-6 bg-admin-surface rounded-[32px] border border-admin">
                                    <p className="text-xl font-black text-indigo-600 mb-4">{selectedBooking.title}</p>
                                    <p className="text-sm text-admin-muted leading-relaxed">{selectedBooking.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="admin-card p-6">
                                        <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.2em] mb-3">
                                            Traveler
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <BookingAvatar src={selectedBooking.travelerAvatar} name={selectedBooking.traveler} className="w-12 h-12 rounded-2xl" />
                                            <div>
                                                <p className="text-sm font-black text-admin-main">{selectedBooking.traveler}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-card p-6">
                                        <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.2em] mb-3">
                                            Buddy
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <BookingAvatar src={selectedBooking.buddyAvatar} name={selectedBooking.buddyName} className="w-12 h-12 rounded-2xl" />
                                            <div>
                                                <p className="text-sm font-black text-admin-main">{selectedBooking.buddyName}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {[
                                        { icon: Calendar, label: 'Date', value: new Date(selectedBooking.date).toLocaleDateString() },
                                        { icon: Clock, label: 'Time & Duration', value: `${selectedBooking.time} (${selectedBooking.hours} hours)` },
                                        { icon: MapPin, label: 'Location', value: selectedBooking.meetingPoint || 'To be confirmed' },
                                        { icon: Users, label: 'Guests', value: `${selectedBooking.guests} guest(s)` },
                                        { icon: DollarSign, label: 'Total Price', value: `$${selectedBooking.totalPrice}` },
                                    ].map((info, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-admin-surface border border-admin flex items-center justify-center text-admin-muted shrink-0">
                                                <info.icon size={20} />
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0">
                                                <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.2em] mb-1">
                                                    {info.label}
                                                </p>
                                                <p className="text-sm font-black text-admin-main truncate">{info.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-admin">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.2em]">
                                            Booking Status
                                        </p>
                                        <div
                                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(selectedBooking.status)}`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${getStatusDotColor(selectedBooking.status)}`}></span>
                                            {selectedBooking.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminBookings;
