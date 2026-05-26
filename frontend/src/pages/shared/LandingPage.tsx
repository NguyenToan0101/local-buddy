import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Shield, MessageCircle, Users, ArrowRight, Smartphone, AlertTriangle, Facebook, Twitter, Instagram, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { buddyService } from '../../services/api';
import type { Buddy } from '../../services/api';
import Button from '../../components/ui/Button';
import Navbar from '../../components/Navbar';
import BuddyCard from '../../components/features/BuddyCard';
import Footer from '../../components/Footer';

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredBuddies, setFeaturedBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      navigate('/traveller/home');
      return;
    }
    const fetchBuddies = async () => {
      try {
        const data = await buddyService.getAll();
        console.log("Fetched buddies:", data);
        setFeaturedBuddies(Array.isArray(data) ? data.slice(0, 4) : []);
      } catch (error) {
        console.error("Error fetching buddies:", error);
        setFeaturedBuddies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBuddies();
  }, []);
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto items-center grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-12">
          <div className="space-y-6">
            <h1 className="heading-mega">
              Explore the city with a <span className="text-primary italic">local friend</span>
            </h1>
            <p className="text-xl text-secondary/60 max-w-lg font-medium leading-relaxed">
              Experience Vietnam like a local, not a tourist. Connect with authentic companions who know the hidden gems only locals know.
            </p>
          </div>

          <div className="p-2 bg-white rounded-[32px] shadow-premium flex flex-col md:flex-row gap-2 max-w-xl border border-gray-50">
            <div className="flex-1 flex items-center gap-4 px-6 py-4">
              <MapPin className="text-primary" size={24} />
              <input
                type="text"
                placeholder="Where are you going?"
                className="w-full outline-none text-secondary font-bold placeholder:text-secondary/10 bg-transparent"
              />
            </div>
            <Link to="/login">
              <Button size="lg" className="shadow-primary-glow">Find a Buddy</Button>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-white overflow-hidden bg-gray-200">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-secondary/60">
              Joined by <span className="text-secondary font-bold">2,000+</span> local buddies
            </p>
          </div>
        </div>

        <div className="relative group">
          <div className="rounded-[40px] overflow-hidden shadow-2xl border border-gray-100">
            <img
              src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800"
              alt="Vietnam Travel"
              className="w-full h-[500px] object-cover transform group-hover:scale-105 transition-transform duration-1000"
            />
          </div>
          <div className="absolute bottom-10 left-10 bg-white/95 backdrop-blur-md p-5 rounded-[28px] shadow-2xl flex items-center gap-4 border border-white group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500">
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Shield size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Verified Buddy</p>
              <p className="text-lg font-black text-secondary tracking-tight">Linh in Hanoi</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 bg-surface-dark/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="heading-section">How it works</h2>
            <p className="text-secondary/40 font-bold text-base">Your journey to authentic local experiences starts here.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <Search size={32} />,
                title: "Step 1 — Match with a local buddy",
                desc: "Browse profiles of buddies who share your interests, hobbies, and vibe."
              },
              {
                icon: <MessageCircle size={32} />,
                title: "Step 2 — Plan your experience",
                desc: "Connect and message your favorites to plan the perfect itinerary together."
              },
              {
                icon: <Users size={32} />,
                title: "Step 3 — Explore the city together",
                desc: "Meet up safely and see the city through the eyes of someone who knows it."
              },
            ].map((step, idx) => (
              <div key={idx} className="bg-white p-12 rounded-[48px] space-y-8 shadow-premium hover:shadow-premium-hover hover:-translate-y-2 hover:border-primary/10 transition-all duration-500 group border border-gray-50 flex flex-col cursor-pointer">
                <div className="w-20 h-20 bg-primary/5 rounded-[28px] flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-primary">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-black text-secondary leading-tight tracking-tight">{step.title}</h3>
                <p className="text-secondary/40 font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Buddies */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-secondary">
              Featured <span className="text-primary italic">Buddies</span>
            </h2>
            <p className="text-secondary/50 font-medium text-lg max-w-md">
              Meet our top-rated companions ready to show you around Vietnam.
            </p>
          </div>
          <Link to="/login" className="group flex items-center gap-3 text-primary font-black uppercase tracking-widest text-xs hover:gap-5 transition-all">
            View all buddies
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-[48px] h-96 border border-gray-100"></div>
            ))
          ) : featuredBuddies.length > 0 ? (
            featuredBuddies.map((buddy: any) => (
              <BuddyCard
                key={buddy.id}
                id={String(buddy.id)}
                name={buddy.name}
                location={buddy.location}
                rating={buddy.rating}
                languages={buddy.languages}
                description={buddy.description}
                imageUrl={buddy.image}
                price={buddy.price}
                tags={buddy.tags}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="text-secondary/20 italic font-bold">No buddies found at the moment.</div>
              <p className="text-sm text-secondary/40">Please make sure the mock API is running on port 3000.</p>
              <Button variant="ghost" onClick={() => window.location.reload()}>Retry Connection</Button>
            </div>
          )}
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-20 bg-secondary text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-16">
            <div className="space-y-8">
              <span className="px-6 py-2 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-primary/20">
                Safe & Secure
              </span>
              <h2 className="heading-hero text-white">Your safety is our <span className="text-primary italic">top priority.</span></h2>
              <p className="text-white/40 text-xl leading-relaxed max-w-lg font-medium">
                We go the extra mile to ensure every connection on Local Buddy is safe, respectful, and reliable.
              </p>
            </div>

            <div className="space-y-12">
              {[
                { icon: <Shield size={28} />, title: "Identity verification", desc: "All buddies undergo identity verification and background checks." },
                { icon: <Smartphone size={28} />, title: "Live itinerary tracking", desc: "Real-time emergency assistance and share your location with loved ones." },
                { icon: <AlertTriangle size={28} />, title: "SOS emergency support", desc: "Red-focus feedback and 24/7 support for peace of mind." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-8 items-start group">
                  <div className="p-5 bg-white/5 rounded-[22px] border border-white/10 shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-primary">
                    {item.icon}
                  </div>
                  <div className="space-y-2 pt-2">
                    <h4 className="text-2xl font-black tracking-tight text-white group-hover:text-primary-light transition-colors">{item.title}</h4>
                    <p className="text-white/40 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-10 bg-primary/20 blur-[120px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative bg-[#1A110D] border border-white/10 rounded-[48px] p-8 shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-700">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl shrink-0"></div>
                  <span className="font-bold">Safety Center</span>
                </div>
                <Shield className="text-primary" />
              </div>

              <div className="bg-red-500 rounded-3xl p-8 mb-6 text-center space-y-4 group/sos cursor-pointer hover:bg-red-600 transition-colors">
                <h5 className="text-4xl font-extrabold text-white">SOS</h5>
                <p className="font-bold text-white">SOS Emergency</p>
                <p className="text-white/80 text-sm">Tap to call emergency help</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white">Status: Safe</p>
                    <p className="text-xs text-white/40">Real-time tracking active</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-green-500 rounded-full p-1">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Testimonials */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 bg-surface-dark/30 rounded-[48px] my-10">
        <div className="text-center space-y-4 mb-16">
          <h2 className="heading-section">What travelers say</h2>
          <p className="text-secondary/40 font-bold text-base">Real experiences from our global community.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              text: "Linh showed me hidden alleys in Hanoi's Old Quarter I never would have found. It felt like hanging out with an old friend.",
              author: "Sarah, UK",
              avatar: "https://i.pravatar.cc/150?u=sarah"
            },
            {
              text: "Nam's coffee tour was the highlight of Saigon. Authenticity at its best! Highly recommended for coffee lovers.",
              author: "James, USA",
              avatar: "https://i.pravatar.cc/150?u=james"
            },
            {
              text: "The SOS feature and verified profiles made me feel so safe traveling solo in Da Nang with Minh. A game changer!",
              author: "Maria, Brazil",
              avatar: "https://i.pravatar.cc/150?u=maria"
            }
          ].map((testi, idx) => (
            <div key={idx} className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-premium space-y-8 flex flex-col group hover:shadow-premium-hover hover:-translate-y-2 transition-all duration-700">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18} className="fill-primary text-primary transition-transform duration-500 group-hover:scale-110" />
                ))}
              </div>
              <p className="text-secondary italic text-xl leading-relaxed font-medium group-hover:text-secondary/80 transition-colors">"{testi.text}"</p>
              <div className="flex items-center gap-6 pt-4 mt-auto">
                <img src={testi.avatar} alt={testi.author} className="w-16 h-16 rounded-3xl object-cover ring-4 ring-primary/5 shadow-lg transition-transform duration-700 group-hover:scale-105" />
                <span className="font-black text-secondary text-lg group-hover:text-primary transition-colors">{testi.author}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto bg-primary rounded-[48px] p-12 sm:p-24 text-center space-y-8 relative overflow-hidden shadow-primary-glow">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>

          <h2 className="heading-hero text-white leading-tight">
            Start your local <br /> experience today
          </h2>
          <p className="text-white/80 text-xl max-w-xl mx-auto font-medium">
            Join thousands of travelers experiencing the world through local eyes.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link to="/login">
              <Button size="lg" className="!bg-white !text-primary hover:!bg-surface-dark w-full sm:w-auto px-16 shadow-xl">Join Now</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="border-white/40 text-white hover:bg-white/10 w-full sm:w-auto px-16">Explore Buddies</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
