import React from 'react';
import { 
  Home, Search, ShoppingBag, Users, 
  MessageSquare, Bell, User, Menu,
  Gem, Newspaper, Calendar
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { icon: Home, label: 'Feed', href: '/' },
  { icon: ShoppingBag, label: 'Marketplace', href: '/marketplace' },
  { icon: Newspaper, label: 'Industry News', href: '/news' },
  { icon: Calendar, label: 'Events', href: '/events' },
  { icon: Users, label: 'Community', href: '/community' },
];

export const Navbar = () => {
  const { userProfile } = useAuth();
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 md:h-10 w-auto group-hover:scale-105 transition-transform">
            <img 
              src="/src/assets/images/GemBook Logo.png" 
              alt="GemBook Logo" 
              className="h-full w-auto object-contain"
            />
          </div>
        </Link>
        
        <div className="hidden md:block relative">
          <input 
            type="text" 
            placeholder="Search gems, vendors, or news..." 
            className="w-80 bg-slate-100 border-none rounded-full py-2 px-10 text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
          />
          <div className="absolute left-3 top-2.5">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden md:flex lg:hidden items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
          </button>
          <Link to="/messages" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors relative">
            <MessageSquare size={20} />
          </Link>
        </div>
        
        <div className="flex items-center gap-3 md:border-l md:border-slate-200 md:pl-6">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-slate-800">{userProfile?.displayName || 'Guest User'}</p>
            <p className="text-[10px] text-success font-medium uppercase tracking-wider">{userProfile?.role === 'VENDOR' ? 'Verified Vendor' : 'Member'}</p>
          </div>
          <Link to={userProfile ? "/profile" : "/login"} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            <img src={userProfile?.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} alt="Avatar" className="w-full h-full object-cover" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ icon: Icon, label, href }: any) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
        isActive 
          ? "bg-primary/5 text-primary shadow-sm ring-1 ring-primary/10" 
          : "text-gray-500 hover:bg-slate-50 hover:text-gray-900"
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
};
