import { useEffect, useState } from 'react';
import { VendorProfile } from '../types';
import { fetchVendor, getCachedVendor } from '../lib/vendorCache';

/**
 * Resolves a vendor by id through the shared batching cache.
 * Already-cached vendors resolve synchronously on first render (no flash).
 */
export function useVendor(vendorId: string | undefined): VendorProfile | null {
  const [vendor, setVendor] = useState<VendorProfile | null>(() =>
    vendorId ? getCachedVendor(vendorId) ?? null : null
  );

  useEffect(() => {
    if (!vendorId) {
      setVendor(null);
      return;
    }

    const cached = getCachedVendor(vendorId);
    if (cached !== undefined) {
      setVendor(cached);
      return;
    }

    let active = true;
    fetchVendor(vendorId).then((v) => {
      if (active) setVendor(v);
    });
    return () => { active = false; };
  }, [vendorId]);

  return vendor;
}
