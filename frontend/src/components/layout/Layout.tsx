import React from 'react';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, ShoppingBag, Users,
  Newspaper, Plus, User
} from 'lucide-react';
import { cn } from '../../lib/utils';

const SIDE_NAV_ITEMS = [
  { icon: Home, label: 'Feed', href: '/' },
  { icon: ShoppingBag, label: 'Marketplace', href: '/marketplace' },
  { icon: Newspaper, label: 'Vendors', href: '/vendors' },
  { icon: Users, label: 'Community', href: '/community' },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden text-slate-800 font-sans">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Side Navigation */}
        <nav className="hidden lg:flex w-64 bg-white border-r border-slate-200 p-6 flex-col shrink-0">
          <div className="space-y-1 mb-6">
            {SIDE_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors font-bold text-sm",
                    isActive 
                      ? "bg-primary/5 text-primary" 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="space-y-1 mb-8 pt-6 border-t border-slate-100">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Professional</p>
            {[
              { icon: Plus, label: 'Add Listing', href: '/add-listing' },
              { icon: User, label: 'My Profile', href: '/profile' }
            ].map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors font-bold text-sm",
                    isActive 
                      ? "bg-primary/5 text-primary" 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-auto p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Market Activity</p>
            <div className="flex justify-between items-end h-12 space-x-1">
              <div className="bg-primary w-full rounded-t-sm h-[40%]"></div>
              <div className="bg-primary w-full rounded-t-sm h-[60%]"></div>
              <div className="bg-primary w-full rounded-t-sm h-[55%]"></div>
              <div className="bg-primary w-full rounded-t-sm h-[90%]"></div>
              <div className="bg-primary w-full rounded-t-sm h-[75%]"></div>
              <div className="bg-primary w-full rounded-t-sm h-[85%]"></div>
            </div>
            <p className="text-xs mt-2 font-medium">+12.4% <span className="text-slate-400 font-normal">this week</span></p>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24 md:pb-6 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      <BottomNav />

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[10px] font-medium text-slate-400 shrink-0 uppercase tracking-tighter">
        <div className="flex space-x-6">
          <span>Active Listings: <span className="text-slate-800">12,450</span></span>
          <span>Verified Dealers: <span className="text-slate-800">1,042</span></span>
          <span>24h Volume: <span className="text-slate-800">$1.2M USD</span></span>
        </div>
        <div className="flex space-x-4">
          <span className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-success mr-1.5"></div>
            Platform Online
          </span>
          <span className="text-primary">Sri Lanka Standard Time: {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </footer>
    </div>
  );
};
