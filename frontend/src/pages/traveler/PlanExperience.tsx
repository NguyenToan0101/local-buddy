import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Send, MessageSquare, Coffee, Utensils, ShoppingBag, Map, Bell, ArrowLeft, ChevronDown, Heart, Star, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';

const PlanExperience: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activityType, setActivityType] = useState('Explore');
  const { user } = useAuth();

  const activities = [
    { icon: Utensils, label: 'Food & Dining', desc: 'Taste local flavors' },
    { icon: Coffee, label: 'Coffee & Chill', desc: 'Relax at best spots' },
    { icon: ShoppingBag, label: 'Local Markets', desc: 'Hidden gems shopping' },
    { icon: Map, label: 'Explore City', desc: 'Custom walking tour' }
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col">
      <Navbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Breadcrumbs & Navigation */}
        <div className="mb-12 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700">
           <Link to={`/traveller/buddies`} className="group flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] text-secondary/30 hover:text-primary transition-all">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowLeft size={14} />
              </div>
              Back to Buddies
           </Link>
           <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-accent-green/10 text-accent-green rounded-full text-[9px] font-black uppercase tracking-widest">
                 <ShieldCheck size={14} /> Secure Booking
              </div>
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-4 border-white shadow-premium">
                 <img src="https://i.pravatar.cc/100?u=me" alt="me" className="w-full h-full object-cover" />
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[48px] shadow-premium overflow-hidden border border-gray-50 transition-all duration-700 hover:shadow-premium-hover">
           <div className="relative">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
              
              <div className="p-8 sm:p-16 lg:p-24 space-y-24 relative z-10">
                {/* Header section */}
                <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
                   <div className="space-y-6 max-w-2xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest">
                         Step 1 of 2
                      </div>
                      <h1 className="text-5xl sm:text-7xl font-black text-secondary tracking-tighter leading-[0.9]">
                        Tailor your <br/>
                        <span className="text-primary italic">Adventure.</span>
                      </h1>
                      <p className="text-secondary/40 font-bold text-lg leading-relaxed">
                        Share your interests with <span className="text-secondary underline decoration-primary/30 underline-offset-4">Mateo</span>. He'll craft a unique local experience just for you in Madrid.
                      </p>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                         <h4 className="font-black text-secondary tracking-tight">Mateo</h4>
                         <div className="flex items-center gap-1.5 justify-end">
                            <Star className="text-primary fill-primary" size={14} />
                            <span className="text-xs font-black text-secondary/60">4.9 (124 reviews)</span>
                         </div>
                      </div>
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-[40px] overflow-hidden shadow-2xl ring-8 ring-white group-hover:scale-105 transition-transform duration-500">
                           <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400" alt="Mateo" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-accent-orange rounded-2xl flex items-center justify-center text-white shadow-xl rotate-12 scale-90 group-hover:scale-100 transition-transform">
                           <MessageSquare size={20} />
                        </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-20">
                   {/* Activity Type selection */}
                   <div className="space-y-10">
                      <div className="flex justify-between items-end">
                         <label className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.4em]">Choose your vibe</label>
                         <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Current: {activityType}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                         {activities.map((item) => {
                            const isSelected = activityType === item.label.split(' ')[0];
                            return (
                               <button 
                                 key={item.label} 
                                 onClick={() => setActivityType(item.label.split(' ')[0])}
                                 className={`group relative flex flex-col items-center justify-center gap-6 p-10 rounded-[40px] border-4 transition-all duration-500 ${isSelected ? 'bg-white border-primary shadow-premium scale-[1.02]' : 'bg-gray-50/50 border-transparent text-secondary/30 hover:bg-white hover:border-gray-200'}`}
                               >
                                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-primary text-white shadow-lg rotate-12' : 'bg-white shadow-sm text-secondary/20 group-hover:text-primary group-hover:rotate-6'}`}>
                                     <item.icon size={32} />
                                  </div>
                                  <div className="text-center">
                                     <h4 className={`text-sm font-black uppercase tracking-widest leading-none mb-2 ${isSelected ? 'text-secondary' : 'text-secondary/40'}`}>{item.label}</h4>
                                     <p className={`text-[10px] font-bold ${isSelected ? 'text-secondary/40' : 'text-secondary/20 invisible group-hover:visible'}`}>{item.desc}</p>
                                  </div>
                                  {isSelected && (
                                     <div className="absolute top-4 right-4 text-primary">
                                        <div className="w-2 h-2 bg-primary rounded-full shadow-primary-glow"></div>
                                     </div>
                                  )}
                               </button>
                            );
                         })}
                      </div>
                   </div>

                   {/* Description textarea */}
                   <div className="space-y-10">
                      <label className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.4em]">Personalize your request</label>
                      <div className="relative group">
                        <textarea 
                          placeholder="Hey Mateo! I'm really looking forward to seeing Madrid. I'd love to focus on coffee shops and maybe a quiet place to read..."
                          className="w-full bg-gray-50/50 border-2 border-transparent rounded-[48px] p-12 text-secondary font-bold text-xl focus:bg-white focus:border-primary/10 focus:ring-4 focus:ring-primary/5 shadow-inner transition-all min-h-[250px] resize-none outline-none placeholder:text-secondary/10"
                        ></textarea>
                        <div className="absolute top-8 right-8 text-secondary/5 group-focus-within:text-primary/10 transition-colors">
                           <MessageSquare size={60} />
                        </div>
                      </div>
                   </div>

                   {/* Grid Inputs for details */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="space-y-8">
                         <label className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.4em]">When should we meet?</label>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="relative group">
                               <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-primary group-focus-within:scale-110 transition-all" size={20} />
                               <input type="text" placeholder="Date" className="w-full bg-gray-50 border-2 border-transparent rounded-3xl py-6 pl-16 pr-6 font-bold text-secondary outline-none focus:bg-white focus:border-primary/10 transition-all" />
                            </div>
                            <div className="relative group">
                               <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-primary group-focus-within:scale-110 transition-all" size={20} />
                               <input type="text" placeholder="Time" className="w-full bg-gray-50 border-2 border-transparent rounded-3xl py-6 pl-16 pr-6 font-bold text-secondary outline-none focus:bg-white focus:border-primary/10 transition-all" />
                            </div>
                         </div>
                      </div>
                      <div className="space-y-8">
                         <label className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.4em]">Duration & Meeting Area</label>
                         <div className="grid grid-cols-2 gap-6">
                           <div className="relative group">
                              <select className="w-full bg-gray-50 border-2 border-transparent rounded-3xl py-6 px-6 font-bold text-secondary outline-none focus:bg-white focus:border-primary/10 appearance-none cursor-pointer pr-12">
                                 <option>2 hours</option>
                                 <option>4 hours</option>
                                 <option>Full Day</option>
                              </select>
                              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-secondary/20" size={20} />
                           </div>
                           <div className="relative group">
                              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-primary group-focus-within:scale-110 transition-all" size={20} />
                              <input type="text" placeholder="Area" className="w-full bg-gray-50 border-2 border-transparent rounded-3xl py-6 pl-16 pr-6 font-bold text-secondary outline-none focus:bg-white focus:border-primary/10 transition-all" />
                           </div>
                         </div>
                      </div>
                   </div>

                   {/* Pricing & CTA section */}
                   <div className="bg-gray-50/50 rounded-[48px] p-12 flex flex-col items-center text-center space-y-10 border border-gray-100/50 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                           <div className="w-8 h-px bg-secondary/10"></div>
                           <span className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.4em]">Estimated Investment</span>
                           <div className="w-8 h-px bg-secondary/10"></div>
                        </div>
                        <h3 className="text-6xl font-black text-secondary italic leading-none">$120</h3>
                        <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em]">+ 15% booking deposit</p>
                      </div>

                      <div className="w-full max-w-lg space-y-6">
                          <Button 
                            onClick={() => {
                              if (user?.role === 'TRAVELER' && user?.verificationStatus !== 'verified') {
                                navigate('/traveller/profile');
                              } else {
                                navigate('/traveller/checkout');
                              }
                            }}
                            className="w-full py-8 text-2xl shadow-premium-hover flex items-center justify-center gap-5 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                             <Send size={24} className="-rotate-12 relative -top-0.5" /> 
                             Confirm & Plan Checkout
                          </Button>
                         <p className="text-[10px] uppercase font-black text-secondary/30 tracking-widest leading-relaxed">
                            No immediate charges. Mateo will review and confirm <br/> within <span className="text-secondary">24 hours</span> or suggest changes.
                         </p>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default PlanExperience;
