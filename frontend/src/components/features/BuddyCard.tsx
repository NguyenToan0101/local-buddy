import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
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
  tags = []
}) => {
  const { user } = useAuth();
  const detailPath = user ? `/traveller/buddy/${id}` : '/login';

  return (
    <Link 
      to={detailPath}
      data-buddy-id={id} 
      className="bg-white rounded-[48px] overflow-hidden isolate shadow-premium hover:shadow-premium-hover transition-all duration-700 group border border-gray-50 flex flex-col h-full block"
      style={{ maskImage: 'radial-gradient(white, black)', WebkitMaskImage: '-webkit-radial-gradient(white, black)', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
    >
      {/* Image Container */}
      <div className="relative h-[340px] w-full shrink-0 overflow-hidden bg-gray-100 isolate" style={{ maskImage: 'radial-gradient(white, black)', WebkitMaskImage: '-webkit-radial-gradient(white, black)', transform: 'translateZ(0)' }}>
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        
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
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="space-y-1">
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
          <p className="text-[9px] text-primary font-black uppercase tracking-[0.12em] pt-0.5">
            {languages.slice(0, 3).join(' • ')}
          </p>
        </div>

        <div className="flex flex-wrap gap-1 mt-auto">
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
