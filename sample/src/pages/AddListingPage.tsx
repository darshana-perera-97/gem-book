import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ImagePlus, X, Loader2, ShieldCheck, Star } from 'lucide-react';
import { uploadImageFile, createListing } from '../lib/api';
import { ensureVendorProfile } from '../lib/vendors';

interface SelectedImage {
  file: File;
  previewUrl: string;
}

const MAX_IMAGES = 6;
const MAX_TITLE = 80;
const MAX_DESCRIPTION = 1500;
const MAX_PRICE = 100_000_000;

interface FieldErrors {
  title?: string;
  description?: string;
  price?: string;
  images?: string;
}

export const AddListingPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { images.forEach((img) => URL.revokeObjectURL(img.previewUrl)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listing needs a contactable seller, so ask visitors to set up a profile first.
  if (!userProfile) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6 mx-auto">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Set up your profile to sell</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Just your name, contact number, and a photo so buyers can reach you — it takes about a minute.
        </p>
        <Link
          to="/login?next=/add-listing"
          className="block w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 hover:-translate-y-0.5 transition-all"
        >
          Get Started
        </Link>
        <button
          onClick={() => navigate('/marketplace')}
          className="w-full py-4 text-slate-500 font-bold text-xs uppercase tracking-widest mt-2"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const validate = (): boolean => {
    const next: FieldErrors = {};
    const trimmedTitle = title.trim();
    const priceValue = Number(price);

    if (!trimmedTitle) next.title = 'Give your gem a name.';
    else if (trimmedTitle.length < 3) next.title = 'Name must be at least 3 characters.';
    else if (trimmedTitle.length > MAX_TITLE) next.title = `Keep the name under ${MAX_TITLE} characters.`;

    if (!description.trim()) next.description = 'Add a short description for buyers.';
    else if (description.length > MAX_DESCRIPTION) next.description = 'Description is too long.';

    if (!price.trim()) next.price = 'Set an asking price.';
    else if (!Number.isFinite(priceValue) || priceValue <= 0) next.price = 'Enter a price greater than zero.';
    else if (priceValue > MAX_PRICE) next.price = 'That price looks too high — please check it.';

    if (images.length === 0) next.images = 'Add at least one photo.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    setErrors((prev) => ({ ...prev, images: undefined }));

    const room = MAX_IMAGES - images.length;
    const accepted = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (accepted.length > room) {
      setErrors((prev) => ({ ...prev, images: `You can add up to ${MAX_IMAGES} photos.` }));
    }

    setImages((prev) => [
      ...prev,
      ...accepted.slice(0, room).map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    try {
      const profile = userProfile;
      if (!profile) {
        setFormError('Please set up your profile again.');
        return;
      }

      // Make sure this seller resolves to a real dealer profile on their cards.
      await ensureVendorProfile(profile);

      setStatus('uploading');
      const imageUrls = await Promise.all(
        images.map((img) => uploadImageFile(`listings/${profile.uid}`, img.file))
      );

      setStatus('saving');
      const saved = await createListing({
        vendorId: profile.uid,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        currency: 'LKR',
        images: imageUrls,
        status: 'ACTIVE',
      });

      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      navigate(`/listings/${saved.id}`);
    } catch (error) {
      console.error('Could not publish listing:', error);
      setFormError('We could not publish your listing. Please check your connection and try again.');
    } finally {
      setStatus('idle');
    }
  };

  const busy = status !== 'idle';
  const inputBase =
    'w-full px-5 rounded-2xl bg-slate-50 border font-medium text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none';

  return (
    <div className="max-w-xl mx-auto py-6 px-4 pb-24">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6 hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="px-8 pt-8 pb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">List Gem</h1>
          <p className="text-slate-400 text-xs font-medium">Marketplace Submission</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-7" noValidate>
          {/* NAME */}
          <div className="space-y-2">
            <label htmlFor="listing-name" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Name
            </label>
            <input
              id="listing-name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              maxLength={MAX_TITLE}
              placeholder="Natural Unheated Ceylon Blue Sapphire"
              className={`${inputBase} h-16 text-2xl md:text-3xl font-black placeholder:font-black ${
                errors.title ? 'border-red-300' : 'border-slate-100'
              }`}
            />
            {errors.title && <p className="text-xs font-bold text-red-600">{errors.title}</p>}
          </div>

          {/* IMAGES */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Images</label>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div key={img.previewUrl} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100">
                  <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Star size={8} fill="currentColor" /> Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label="Remove image"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-primary hover:text-primary transition-colors ${
                    errors.images ? 'border-red-300' : 'border-slate-200'
                  }`}
                >
                  <ImagePlus size={22} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Add</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
            {errors.images ? (
              <p className="text-xs font-bold text-red-600">{errors.images}</p>
            ) : (
              <p className="text-[10px] text-slate-400 font-medium">
                First photo is the cover. Images are optimised automatically before upload.
              </p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <label htmlFor="listing-description" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Description
            </label>
            <textarea
              id="listing-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={MAX_DESCRIPTION}
              placeholder="Tell buyers about this gem — origin, character, what makes it special..."
              className={`${inputBase} p-5 resize-none ${errors.description ? 'border-red-300' : 'border-slate-100'}`}
            />
            {errors.description && <p className="text-xs font-bold text-red-600">{errors.description}</p>}
          </div>

          {/* PRICE */}
          <div className="space-y-2">
            <label htmlFor="listing-price" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Price (LKR)
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rs.</span>
              <input
                id="listing-price"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))}
                type="text"
                inputMode="decimal"
                placeholder="285000"
                className={`${inputBase} h-14 pl-14 ${errors.price ? 'border-red-300' : 'border-slate-100'}`}
              />
            </div>
            {errors.price && <p className="text-xs font-bold text-red-600">{errors.price}</p>}
          </div>

          {formError && (
            <p className="text-xs font-bold text-red-600 bg-red-50 px-4 py-3 rounded-2xl border border-red-100">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:translate-y-0 mt-4"
          >
            {busy && <Loader2 size={22} className="animate-spin" />}
            {status === 'uploading' ? 'Optimising photos...' : status === 'saving' ? 'Publishing...' : 'List Your Gem'}
            {!busy && <ArrowRight size={22} />}
          </button>
        </form>
      </div>
    </div>
  );
};
