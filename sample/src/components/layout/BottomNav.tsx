import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  PlusCircle,
  MessageSquare,
  Users
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const BottomNav: React.FC = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-50 px-4 flex items-center justify-between pb-safe">
      <NavItem to="/" icon={Home} label="Feed" />
      <NavItem to="/marketplace" icon={ShoppingBag} label="Shop" />
      
      <div className="relative -top-4 flex flex-col items-center">
        <NavLink 
          to="/add-listing"
          className={({ isActive }) => cn(
            "w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 transition-transform active:scale-95",
            isActive && "ring-4 ring-primary/20"
          )}
        >
          <PlusCircle size={28} />
        </NavLink>
        <span className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">List</span>
      </div>

      <NavItem to="/messages" icon={MessageSquare} label="Chats" />
      <NavItem to="/vendors" icon={Users} label="Vendors" />
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: any;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label }) => {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => cn(
        "flex flex-col items-center justify-center gap-1 transition-all",
        isActive ? "text-primary" : "text-gray-400"
      )}
    >
      {({ isActive }) => (
        <>
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-tighter",
            isActive ? "text-primary" : "text-gray-500"
          )}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
};
