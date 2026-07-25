import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Phone, Camera, ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginPage = () => {
  const { userProfile, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/';

  const [step, setStep] = useState<'details' | 'photo'>('details');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  // Already onboarded — skip straight through.
  if (userProfile) return <Navigate to={nextPath} replace />;

  const goToPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (contact.replace(/\D/g, '').length < 7) return setError('Please enter a valid contact number.');
    setStep('photo');
  };

  const handlePhotoSelected = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const finish = async () => {
    setError('');
    setLoading(true);
    try {
      await signUp({ displayName: name, contactNumber: contact, photoFile });
      navigate(nextPath, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Could not complete setup. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 min-h-[80vh] flex flex-col justify-center">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100 flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6"
            >
              {step === 'details' ? <User size={40} /> : <Camera size={40} />}
            </motion.div>
          </AnimatePresence>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            {step === 'details' ? 'Welcome to GemBook' : 'Add a Profile Photo'}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {step === 'details'
              ? 'Just your name and number — no passwords, no hassle.'
              : 'Help dealers and buyers recognise you.'}
          </p>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 'details' ? (
              <motion.form
                key="details"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                onSubmit={goToPhoto}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label htmlFor="name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full py-4 pl-12 pr-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      id="contact"
                      type="tel"
                      value={contact}
                      onChange={(e) => setContact(e.target.value.replace(/[^\d+\s]/g, ''))}
                      placeholder="+94 77 123 4567"
                      className="w-full py-4 pl-12 pr-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-xl shadow-primary/30"
                >
                  Continue <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full py-3 text-slate-500 font-bold text-xs hover:text-slate-900 transition-colors"
                >
                  Keep browsing for now
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="photo"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-32 h-32 rounded-full border-4 border-white shadow-lg bg-slate-100 overflow-hidden group"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                        <Camera size={28} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Upload</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handlePhotoSelected(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <p className="text-xs text-slate-400 font-medium text-center">
                    Optional — you can add or change this later.
                  </p>
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={finish}
                    disabled={loading}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 transition-all shadow-xl shadow-primary/30"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {loading ? 'Setting up...' : 'Finish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    disabled={loading}
                    className="w-full py-3 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
