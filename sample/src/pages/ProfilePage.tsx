import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User, Mail, Phone, Shield,
  LogOut, ChevronRight,
  Store, BadgeCheck, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ensureVendorProfile } from '../lib/vendors';

export const ProfilePage = () => {
  const { userProfile, logout, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  const handleBecomeVendor = async () => {
    if (!userProfile) {
      navigate('/login?next=/profile');
      return;
    }
    setLoading(true);
    setNotice('');
    try {
      const profile = userProfile;
      await updateProfile({ role: 'VENDOR' });
      await ensureVendorProfile(profile);
      setNotice('You can now list gems on the marketplace.');
    } catch (error) {
      console.error('Error applying for vendor:', error);
      setNotice('Could not complete your application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view your profile</h1>
        <button
          onClick={() => navigate('/login?next=/profile')}
          className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/10 bg-slate-100">
          <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{userProfile.displayName}</h1>
          <p className="text-slate-500 font-medium">{userProfile.contactNumber || userProfile.phone}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
            <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              {userProfile.role}
            </span>
            {userProfile.role === 'VENDOR' && (
              <span className="bg-primary/5 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                <BadgeCheck size={12} /> Verified Seller
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="p-3 text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account Details */}
        <div className="space-y-4">
          <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm px-2">Account Settings</h2>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <SettingsItem icon={User} label="Display Name" value={userProfile.displayName} />
            <SettingsItem icon={Phone} label="Contact Number" value={userProfile.contactNumber || userProfile.phone || 'Not set'} />
            <SettingsItem icon={Mail} label="Email Address" value={userProfile.email || 'Not set'} last />
          </div>
        </div>

        {/* Vendor Onboarding */}
        <div className="space-y-4">
          <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm px-2">Business Portal</h2>
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Store size={120} />
            </div>
            <div className="relative z-10">
              {userProfile.role === 'VENDOR' ? (
                <>
                  <h3 className="text-xl font-bold mb-2">List a New Gem</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Add your inventory to the marketplace and reach verified buyers.
                  </p>
                  <button
                    onClick={() => navigate('/add-listing')}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  >
                    Add a Listing
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-2">Grow Your Business</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Join the premier network of Sri Lankan gemstone dealers. Start listing today.
                  </p>
                  <button
                    onClick={handleBecomeVendor}
                    disabled={loading}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Start Selling'}
                  </button>
                </>
              )}
              {notice && (
                <p className="mt-4 text-xs font-bold text-white/80 bg-white/10 px-4 py-3 rounded-xl">{notice}</p>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
             <AlertCircle className="text-amber-500 shrink-0" size={20} />
             <p className="text-[10px] text-amber-700 font-medium leading-relaxed uppercase tracking-wider">
                Identity verification is required for all vendors to maintain the highest standards of trust in the marketplace.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsItem = ({ icon: Icon, label, value, last }: any) => (
  <div className={cn(
    "p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group",
    !last && "border-b border-slate-100"
  )}>
    <div className="flex items-center gap-4">
      <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="font-bold text-slate-900">{value}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
  </div>
);

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
