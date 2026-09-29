import React, { useEffect, useRef, useState } from 'react';
import { AuthError, useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Phone, Camera, ArrowLeft, ArrowRight, Loader2, Check, Store, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findUserByContact } from '../lib/api';
import { formatLkMobileInput, parseLkMobile } from '../lib/phone';
import { UserRole } from '../types';

type Mode = 'create' | 'signin';
type CreateStep = 'details' | 'role' | 'photo';

export const LoginPage = () => {
  const { userProfile, createAccount, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/';

  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'signin' ? 'signin' : 'create');
  const [createStep, setCreateStep] = useState<CreateStep>('details');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [contactConfirm, setContactConfirm] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  if (userProfile) return <Navigate to={nextPath} replace />;

  const switchMode = (next: Mode) => {
    setError('');
    setCreateStep('details');
    setMode(next);
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'signin') nextParams.set('mode', 'signin');
    else nextParams.delete('mode');
    setSearchParams(nextParams, { replace: true });
  };

  const goToRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    const parsed = parseLkMobile(contact);
    const confirmed = parseLkMobile(contactConfirm);
    if (!parsed) return setError('Please enter a valid Sri Lankan mobile number.');
    if (parsed !== confirmed) return setError('Contact numbers do not match.');

    setLoading(true);
    try {
      const existing = await findUserByContact(parsed);
      if (existing && existing.uid) {
        switchMode('signin');
        setError('This number is already registered. Sign in instead.');
        return;
      }
      setCreateStep('role');
    } catch {
      setError('Could not check this number. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelected = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const finishCreate = async () => {
    setError('');
    setLoading(true);
    try {
      await createAccount({ displayName: name, contactNumber: contact, photoFile, role });
      navigate(nextPath, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not create your account. Please try again.';
      if (err instanceof AuthError && err.code === 'exists') {
        switchMode('signin');
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const finishSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(contact);
      navigate(nextPath, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not sign in. Please try again.';
      if (err instanceof AuthError && err.code === 'not_found') {
        switchMode('create');
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const heading =
    mode === 'signin'
      ? 'Welcome back'
      : createStep === 'details'
        ? 'Create your account'
        : createStep === 'role'
          ? 'How will you use GemBook?'
          : 'Add a profile photo';

  const subtitle =
    mode === 'signin'
      ? 'Enter the mobile number you registered with — no password needed.'
      : createStep === 'details'
        ? 'Name and Sri Lankan mobile number. That’s your identity.'
        : createStep === 'role'
          ? 'You can change this later from your profile.'
          : 'Help dealers and buyers recognise you.';

  const icon =
    mode === 'signin'
      ? <Phone size={40} />
      : createStep === 'photo'
        ? <Camera size={40} />
        : createStep === 'role'
          ? <Store size={40} />
          : <User size={40} />;

  return (
    <div className="max-w-md mx-auto py-12 px-4 min-h-[80vh] flex flex-col justify-center">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100 flex flex-col items-center">
          <div className="flex w-full rounded-2xl bg-white p-1 border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => switchMode('create')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                mode === 'create' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                mode === 'signin' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign in
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${createStep}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6"
            >
              {icon}
            </motion.div>
          </AnimatePresence>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{heading}</h1>
          <p className="text-slate-500 text-sm font-medium">{subtitle}</p>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {mode === 'signin' ? (
              <motion.form
                key="signin"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                onSubmit={finishSignIn}
                className="space-y-5"
              >
                <PhoneField id="signin-contact" value={contact} onChange={setContact} />
                {error && <ErrorText>{error}</ErrorText>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 transition-all shadow-xl shadow-primary/30"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('create')}
                  className="w-full py-3 text-slate-500 font-bold text-xs hover:text-slate-900 transition-colors"
                >
                  New here? Create an account
                </button>
              </motion.form>
            ) : createStep === 'details' ? (
              <motion.form
                key="details"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                onSubmit={goToRole}
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

                <PhoneField id="contact" value={contact} onChange={setContact} />
                <PhoneField
                  id="contact-confirm"
                  label="Confirm number"
                  value={contactConfirm}
                  onChange={setContactConfirm}
                />

                {error && <ErrorText>{error}</ErrorText>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 transition-all shadow-xl shadow-primary/30"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {loading ? 'Checking...' : 'Continue'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full py-3 text-slate-500 font-bold text-xs hover:text-slate-900 transition-colors"
                >
                  Keep browsing for now
                </button>
              </motion.form>
            ) : createStep === 'role' ? (
              <motion.div
                key="role"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-4"
              >
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    role === 'USER' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900">Buyer</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Browse listings, chat with dealers, follow shops.</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('VENDOR')}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    role === 'VENDOR' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                      <Store size={20} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900">Dealer</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Get a storefront and list gems on the marketplace.</p>
                    </div>
                  </div>
                </button>

                {error && <ErrorText>{error}</ErrorText>}

                <button
                  type="button"
                  onClick={() => setCreateStep('photo')}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all shadow-xl shadow-primary/30"
                >
                  Continue <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setCreateStep('details')}
                  className="w-full py-3 text-slate-500 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              </motion.div>
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

                {error && <ErrorText>{error}</ErrorText>}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={finishCreate}
                    disabled={loading}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 transition-all shadow-xl shadow-primary/30"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateStep('role')}
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

function PhoneField({
  id,
  label = 'Contact number',
  value,
  onChange,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
        {label}
      </label>
      <div className="relative">
        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          onChange={(e) => onChange(formatLkMobileInput(e.target.value))}
          placeholder="+94771234567"
          className="w-full py-4 pl-12 pr-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
        />
      </div>
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{children}</p>;
}
