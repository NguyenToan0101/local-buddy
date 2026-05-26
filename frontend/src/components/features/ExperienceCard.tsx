import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Experience } from '../../services/api';

interface ExperienceCardProps {
  experience: Experience;
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({ experience: exp }) => {
  const { user } = useAuth();
  const detailPath = user ? `/traveller/experience/${exp.id}` : '/login';

  return (
    <Link
      to={detailPath}
      className="w-full bg-white rounded-[40px] overflow-hidden isolate shadow-premium hover:shadow-premium-hover transition-all duration-700 group border border-gray-50 flex flex-col hover:-translate-y-2 h-full block"
      style={{ maskImage: 'radial-gradient(white, black)', WebkitMaskImage: '-webkit-radial-gradient(white, black)', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
    >
      <div className="relative h-[300px] w-full shrink-0 overflow-hidden bg-gray-100 isolate">
        <img
          src={exp.image}
          alt={exp.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-white/20 z-10">
          <Star size={14} className="fill-primary text-primary" />
          <span className="text-xs font-black text-secondary">{exp.rating || '5.0'}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

        {/* Hover Description Overlay - Consistent with BuddyCard */}
        <div className="absolute inset-0 bg-secondary/60 backdrop-blur-[2px] flex items-end p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
          <p className="text-white text-sm font-bold leading-relaxed italic translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100 line-clamp-6">
            "{exp.storyContent}"
          </p>
        </div>

        <div className="absolute bottom-5 left-5 right-5 z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-lg">
              <img src={exp.travelerAvatar || `https://i.pravatar.cc/100?u=${exp.travelerName}`} alt={exp.travelerName} className="w-full h-full object-cover" />
            </div>
            <span className="text-white text-xs font-black drop-shadow-md">{exp.travelerName}</span>
          </div>
          <h3 className="text-lg font-black text-white leading-tight drop-shadow-md line-clamp-2">
            {exp.title}
          </h3>
        </div>
      </div>
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="pt-4 mt-auto border-t border-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <MapPin size={12} />
            </div>
            <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">{exp.location}</span>
          </div>
          <div className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            {/* Read Story text removed */}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ExperienceCard;
