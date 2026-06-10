import { Link } from 'react-router-dom';
import { Star, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BuddyProps {
  id: string | number;
  name: string;
  location: string;
  rating: number;
  languages: string[];
  description: string;
  imageUrl: string;
  price: number;
  tags?: string[];
  verificationStatus?: string;
}

const BuddyCard: React.FC<BuddyProps> = ({
  id,
  name,
  location,
  rating,
  languages,
  description,
  imageUrl,
  price,
  tags = [],
  verificationStatus = 'unverified'
}) => {
  const { user } = useAuth();
  const detailPath = user?.role === 'TRAVELER'
    ? `/traveller/buddy/${id}`
    : user?.role === 'BUDDY'
      ? '/buddy/dashboard'
      : user?.role === 'ADMIN'
        ? '/admin/dashboard'
        : '/login';

  const isVerified = verificationStatus === 'verified' || verificationStatus === 'auto_approved' || verificationStatus === 'manual_approved';
  const trustScore = isVerified ? Math.min(100, 94 + Math.round(rating * 1.2)) : Math.min(88, 65 + Math.round(rating * 3.5));

  return (
    <Link 
      to={detailPath}
      data-buddy-id={id} 
      className="bg-white rounded-[40px] overflow-hidden isolate shadow-premium hover:shadow-premium-hover transition-all duration-500 group border border-gray-50 flex flex-col h-full block"
      style={{ maskImage: 'radial-gradient(white, black)', WebkitMaskImage: '-webkit-radial-gradient(white, black)', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
    >
      {/* Image Container */}
      <div className="relative h-[300px] w-full shrink-0 overflow-hidden bg-gray-100 isolate" style={{ maskImage: 'radial-gradient(white, black)', WebkitMaskImage: '-webkit-radial-gradient(white, black)', transform: 'translateZ(0)' }}>
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        
        {/* Verification Shield Badge */}
        {isVerified && (
          <div className="absolute top-5 left-5 bg-[#10b981] text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md border border-[#10b981]/25 z-10 text-[9px] font-black uppercase tracking-widest animate-pulse">
            <Shield size={12} className="fill-current" />
            <span>Verified</span>
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-white/20 z-10">
          <Star size={14} className="fill-primary text-primary" />
          <span className="text-xs font-black text-secondary">{rating}</span>
        </div>

        {/* Hover Description Overlay */}
        <div className="absolute inset-0 bg-secondary/60 backdrop-blur-[2px] flex items-end p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
           <p className="text-white text-sm font-bold leading-relaxed italic translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
              "{description}"
           </p>
        </div>
      </div>
      
      {/* Content Container */}
      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-secondary tracking-tight group-hover:text-primary transition-colors duration-300">
                {name}
              </h3>
              <span className="text-xs font-bold text-secondary/40">
                {location}
              </span>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-sm font-black text-primary">${price}</span>
               <span className="text-[8px] font-black text-secondary/20 uppercase tracking-widest leading-none">/hour</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[9px] text-primary font-black uppercase tracking-[0.12em] pt-0.5">
              {languages.slice(0, 3).join(' • ')}
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
            <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/10">
              <Shield size={10} className="fill-emerald-500 text-emerald-600" />
              <span>{trustScore}% Trust</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 pt-2">
          {tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 bg-surface-dark text-secondary/50 text-[8px] font-black rounded-lg uppercase tracking-wider border border-gray-100 transition-all group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default BuddyCard;
