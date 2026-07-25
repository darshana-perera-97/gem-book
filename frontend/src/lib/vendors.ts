import { UserProfile, VendorProfile } from '../types';
import { getVendor, saveVendor } from './api';
import { primeVendors } from './vendorCache';

/**
 * Guarantees the seller has a vendor storefront keyed by their uid, so their
 * listings resolve to a real dealer profile. Called on first listing creation.
 */
export async function ensureVendorProfile(profile: UserProfile): Promise<VendorProfile> {
  const existing = await getVendor(profile.uid).catch(() => null);
  if (existing && existing.id) {
    primeVendors([existing]);
    return existing;
  }

  const vendor: VendorProfile = {
    id: profile.uid,
    userId: profile.uid,
    companyName: profile.displayName || 'Independent Dealer',
    logo: profile.photoURL,
    description: profile.bio,
    location: 'Sri Lanka',
    rating: 0,
    reviewCount: 0,
    followersCount: 0,
    verified: false,
    verificationLevel: 'NONE',
    contactEmail: profile.email || '',
    phone: profile.phone || profile.contactNumber,
    createdAt: new Date().toISOString(),
  };

  const saved = await saveVendor(vendor);
  primeVendors([saved]);
  return saved;
}
