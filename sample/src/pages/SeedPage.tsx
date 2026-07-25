import React, { useState } from 'react';
import { Database, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { seedDatabase } from '../lib/api';
import { SEED_USERS, SEED_VENDORS, SEED_LISTINGS, SEED_POSTS } from '../lib/seedData';

const ms = (hoursAgo: number) => Date.now() - hoursAgo * 3_600_000;

/** Builds the full dataset the server inserts after wiping every table. */
function buildBundle() {
  const users = [
    // Vendor owners double as user accounts (role VENDOR).
    ...SEED_VENDORS.map((v) => ({
      uid: v.userId,
      displayName: v.companyName,
      contactNumber: v.phone,
      phone: v.phone,
      email: v.contactEmail,
      photoURL: v.logo,
      role: 'VENDOR',
      bio: v.description,
      followersCount: v.followersCount,
      followingCount: 0,
      following: [],
      vendorStatus: 'APPROVED',
      seeded: 1,
      createdAt: ms(v.hoursAgo),
      lastActive: ms(1),
    })),
    ...SEED_USERS.map((u) => ({
      uid: u.uid,
      displayName: u.displayName,
      contactNumber: u.contactNumber,
      phone: u.phone,
      photoURL: u.photoURL,
      role: u.role,
      bio: u.bio,
      followersCount: u.followersCount,
      followingCount: u.followingCount,
      following: u.following,
      seeded: 1,
      createdAt: ms(u.hoursAgo),
      lastActive: ms(1),
    })),
  ];

  const vendors = SEED_VENDORS.map(({ hoursAgo, seeded, verified, ...rest }) => ({
    ...rest,
    verified: verified ? 1 : 0,
    seeded: 1,
    createdAt: ms(hoursAgo),
  }));

  const listings = SEED_LISTINGS.map(({ hoursAgo, seeded, featured, ...rest }) => ({
    ...rest,
    featured: featured ? 1 : 0,
    seeded: 1,
    createdAt: ms(hoursAgo),
  }));

  const posts = SEED_POSTS.map(({ hoursAgo, seeded, ...rest }) => ({
    ...rest,
    seeded: 1,
    createdAt: ms(hoursAgo),
  }));

  return { users, vendors, listings, posts };
}

export const SeedPage = () => {
  const [status, setStatus] = useState<'IDLE' | 'SEEDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setStatus('SEEDING');
    setError(null);
    try {
      await seedDatabase(buildBundle());
      setStatus('SUCCESS');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Seeding failed. Is the API reachable and the database configured?');
      setStatus('ERROR');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-8 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
            <Database size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset & Seed Platform</h1>
          <p className="text-gray-500">
            Wipes all existing accounts and content, then loads a realistic Sri Lankan gem
            market: <strong>5 verified dealers, 10 users, 6 gem listings and 12 feed posts</strong>.
          </p>
        </div>

        <div className="p-8">
          {status === 'IDLE' && (
            <button
              onClick={run}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Play size={20} />
              Reset & Seed Now
            </button>
          )}

          {status === 'SEEDING' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 size={40} className="text-primary animate-spin" />
              <p className="font-bold text-gray-900">Resetting and seeding the platform…</p>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Platform Seeded Successfully!</h2>
              <p className="text-gray-500">5 dealers, 10 users, 6 listings and 12 posts are now live.</p>
              <button
                onClick={() => (window.location.href = '/')}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold mt-4"
              >
                Go to Home Feed
              </button>
            </div>
          )}

          {status === 'ERROR' && (
            <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex gap-4">
              <AlertCircle className="text-red-600 shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-red-900 mb-1">Seeding Failed</h3>
                <p className="text-sm text-red-700">{error}</p>
                <button onClick={run} className="mt-4 text-sm font-bold text-red-600 hover:underline">
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
