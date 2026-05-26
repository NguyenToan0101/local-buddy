import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { X, AlertCircle, CheckSquare, Clock, ArrowRight, ChevronDown } from 'lucide-react';
import Button from '../../components/ui/Button';

const CancelBooking: React.FC = () => {
  const { id } = useParams();
  const [reason, setReason] = useState("");

  const booking = {
    id: "LB-98234",
    title: "City Walking Tour with Mike",
    date: "Oct 24, 2023",
    time: "10:00 AM",
    location: "Central Plaza, Barcelona",
    image: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?q=80&w=400",
    paid: 45.00,
    cancellationFee: 0.00,
    refund: 45.00
  };

  return (
    <div className="min-h-screen bg-surface-dark/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-[800px] w-full bg-white rounded-[56px] shadow-2xl border border-white overflow-hidden">
         
         <div className="p-8 sm:p-14 space-y-12">
            
            {/* Header */}
            <div className="flex justify-between items-start">
               <div className="space-y-2">
                  <h1 className="text-6xl font-black text-secondary tracking-tighter">Cancel Booking?</h1>
                  <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Booking ID: {booking.id}</p>
               </div>
               <Link to={`/traveller/booking/${id}`} className="w-14 h-14 bg-surface rounded-full flex items-center justify-center text-secondary/20 hover:text-primary transition-all">
                  <X size={28} />
               </Link>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-[40px] p-2 pr-8 border border-gray-100 flex items-center gap-8 shadow-sm group">
               <div className="w-48 h-32 rounded-[32px] overflow-hidden shadow-lg shrink-0">
                  <img src={booking.image} alt={booking.title} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
               </div>
               <div className="flex-1 space-y-4">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Upcoming Booking</span>
                  <h3 className="text-2xl font-extrabold text-secondary tracking-tight">{booking.title}</h3>
                  <div className="flex flex-wrap gap-6 text-xs font-bold text-secondary/40 uppercase tracking-widest">
                     <div className="flex items-center gap-2"><Clock size={16} /> {booking.date} • {booking.time}</div>
                     <div className="flex items-center gap-2"><ArrowRight size={16} /> {booking.location}</div>
                  </div>
               </div>
            </div>

            {/* Policy Box */}
            <div className="bg-[#FFEAE1]/30 rounded-[40px] p-8 border border-[#FFEAE1] space-y-6">
               <div className="flex items-center gap-3 text-primary">
                  <AlertCircle size={24} />
                  <h4 className="text-lg font-extrabold uppercase tracking-widest">Cancellation Policy</h4>
               </div>
               <div className="space-y-4">
                  <div className="flex gap-4">
                     <div className="w-6 h-6 rounded-full bg-accent-green text-white flex items-center justify-center shrink-0">
                        <CheckSquare size={14} />
                     </div>
                     <p className="text-sm font-bold text-secondary/70 leading-relaxed">
                        <span className="text-accent-green">Full Refund:</span> You are eligible for a 100% refund because you are cancelling more than 24 hours before the tour.
                     </p>
                  </div>
                  <div className="flex gap-4 opacity-40">
                     <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
                        <Clock size={14} />
                     </div>
                     <p className="text-sm font-medium text-secondary leading-relaxed">
                        Cancellations made within 24 hours of the event start time are strictly non-refundable according to our guide's protection policy.
                     </p>
                  </div>
               </div>
            </div>

            {/* Reason Select */}
            <div className="space-y-4">
               <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-4">Reason for cancelling?</label>
               <div className="relative group">
                  <select 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-surface border-none rounded-3xl py-6 px-8 font-bold text-secondary outline-none appearance-none focus:ring-4 focus:ring-primary/10 transition-all"
                  >
                     <option value="" disabled>Select a reason (optional)</option>
                     <option>Change of plans</option>
                     <option>Weather conditions</option>
                     <option>Health issues</option>
                     <option>Other</option>
                  </select>
                  <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within:text-primary transition-colors" size={20} />
               </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
               <Button variant="ghost" className="w-full py-6 text-xl bg-[#FFEAE1]/50 border-none text-primary font-black hover:bg-primary hover:text-white shadow-lg shadow-primary/5">
                  Confirm Cancellation
               </Button>
               <Link to={`/traveller/booking/${id}`}>
                  <Button className="w-full py-6 text-xl shadow-2xl shadow-primary/30">
                     Keep My Booking
                  </Button>
               </Link>
            </div>

            {/* Refund Summary Footer */}
            <div className="pt-12 border-t border-dashed border-gray-100 space-y-4">
               <div className="flex justify-between items-center text-sm font-bold text-secondary/40 uppercase tracking-widest">
                  <span>Total Paid</span>
                  <span className="text-secondary">${booking.paid.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-bold text-secondary/40 uppercase tracking-widest">
                  <span>Cancellation Fee</span>
                  <span className="text-accent-green">${booking.cancellationFee.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center pt-2">
                  <span className="text-xl font-black text-secondary tracking-tight">Estimated Refund</span>
                  <span className="text-3xl font-black text-primary tracking-tight">${booking.refund.toFixed(2)}</span>
               </div>
               <p className="text-[10px] text-center text-secondary/20 font-bold uppercase tracking-[0.2em] pt-4">
                  Refunds usually take 5-10 business days to appear on your bank statement.
               </p>
            </div>
         </div>

      </div>
    </div>
  );
};

export default CancelBooking;
