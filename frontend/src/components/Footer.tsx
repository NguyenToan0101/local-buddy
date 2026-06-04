import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Users, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white py-8 sm:py-12 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <Users size={24} />
              </div>
              <span className="text-xl font-bold text-secondary">Local Buddy</span>
            </Link>
            <p className="text-secondary/60 max-w-xs leading-relaxed">
              Making travel friendlier, safer, and unforgettable through local connections, one city at a time.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram].map((Icon, idx) => (
                <a key={idx} href="#" className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-secondary/40 hover:text-primary hover:border-primary transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Company", links: ["About Us", "How it works", "Careers", "Journal", "Contact"] },
            { title: "Support", links: ["Help Center", "Safety Rules", "Terms of Service", "Privacy Policy"] },
            { title: "Explore", links: ["Europe Buddies", "Asia Adventures", "Food Tours", "Photography"] }
          ].map((col, idx) => (
            <div key={idx} className="space-y-4">
              <h4 className="font-bold text-secondary">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-secondary/60 hover:text-primary hover:translate-x-2 transition-all block">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-secondary/40 font-medium">
          <p>© 2024 Local Buddy Inc. All rights reserved.</p>
          <div className="flex flex-wrap gap-3 md:gap-6 justify-center md:justify-end">
            <a href="#" className="hover:text-primary transition-colors">Cookies</a>
            <a href="#" className="hover:text-primary transition-colors">Sitemap</a>
            <a href="#" className="hover:text-primary transition-colors">Press Kit</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
