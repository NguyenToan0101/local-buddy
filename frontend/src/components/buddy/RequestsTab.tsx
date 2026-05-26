import React, { useState, useEffect } from 'react';
import { Check, X, Edit2, Calendar, Clock, Users, Globe } from 'lucide-react';
import { requestService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

const RequestsTab: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await requestService.getPending();
        // Filter by current buddy if API doesn't do it
        const buddyRequests = data.filter((r: any) => r.buddyId === (user?.id || "1"));
        setRequests(buddyRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [user?.id]);

  const handleAction = async (id: string, status: 'accepted' | 'declined') => {
    try {
      await requestService.updateStatus(id, status);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error(`Failed to ${status} request:`, error);
    }
  };

  if (loading) return <div className="text-center py-20 italic font-bold text-secondary/20">Loading requests...</div>;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h3 className="text-3xl font-black text-secondary tracking-tight">Booking Requests</h3>
        <p className="text-secondary/40 font-bold text-sm">Review and manage incoming adventure proposals from travelers.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-[48px] p-20 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 text-secondary/10">
            <Calendar size={40} />
          </div>
          <p className="text-secondary/30 font-bold italic">No pending requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-[56px] p-2 shadow-sm border border-gray-100 overflow-hidden flex flex-col xl:flex-row">
              <div className="xl:w-1/3 h-64 xl:h-auto rounded-[48px] overflow-hidden m-2 shadow-inner">
                <img src={request.image} alt={request.activity} className="w-full h-full object-cover transition-all duration-1000" />
              </div>
              
              <div className="flex-1 p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{request.type}</span>
                  <span className="bg-primary/5 text-primary px-4 py-2 rounded-2xl text-xs font-black tracking-tight">{request.price}</span>
                </div>

                <div>
                  <h4 className="text-3xl font-black text-secondary tracking-tighter leading-none mb-2">{request.activity}</h4>
                  <p className="text-primary font-bold text-xs uppercase tracking-widest">{request.customer} • {request.receivedTime}</p>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-8 pb-8 border-b border-gray-50">
                  <div className="flex items-center gap-4 text-xs font-bold text-secondary/60">
                    <div className="w-10 h-10 bg-surface rounded-2xl flex items-center justify-center text-primary"><Calendar size={18} /></div>
                    {request.date}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-secondary/60">
                    <div className="w-10 h-10 bg-surface rounded-2xl flex items-center justify-center text-primary"><Clock size={18} /></div>
                    {request.time}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-secondary/60">
                    <div className="w-10 h-10 bg-surface rounded-2xl flex items-center justify-center text-primary"><Users size={18} /></div>
                    {request.guests}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-secondary/60">
                    <div className="w-10 h-10 bg-surface rounded-2xl flex items-center justify-center text-primary"><Globe size={18} /></div>
                    {request.languages}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => handleAction(request.id, 'accepted')}
                    className="flex-1 bg-primary h-16 rounded-2xl flex items-center justify-center gap-3 text-white text-sm font-black shadow-primary-glow hover:bg-primary/90 transition-all active:scale-95 border-none"
                  >
                    <Check size={20} strokeWidth={3} /> Accept
                  </button>
                  <button className="flex-1 bg-secondary/5 h-16 rounded-2xl flex items-center justify-center gap-3 text-secondary text-sm font-black border border-gray-50 hover:bg-white transition-all active:scale-95">
                    <Edit2 size={16} /> Suggest Change
                  </button>
                  <button 
                    onClick={() => handleAction(request.id, 'declined')}
                    className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 border-none"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestsTab;
