/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext';

// Feed and Marketplace are the landing surfaces — keep them in the main chunk.
import { FeedPage } from './pages/FeedPage';
import { MarketplacePage } from './pages/MarketplacePage';

// Everything else loads on demand. This keeps heavy, rarely-visited dependencies
// (recharts on the admin dashboard, faker in the seeder) out of the initial download.
const VendorsPage = lazy(() => import('./pages/VendorsPage').then((m) => ({ default: m.VendorsPage })));
const DealerProfilePage = lazy(() => import('./pages/DealerProfilePage').then((m) => ({ default: m.DealerProfilePage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const SeedPage = lazy(() => import('./pages/SeedPage').then((m) => ({ default: m.SeedPage })));
const ProductPage = lazy(() => import('./pages/ProductPage').then((m) => ({ default: m.ProductPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const AddListingPage = lazy(() => import('./pages/AddListingPage').then((m) => ({ default: m.AddListingPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ChatPage = lazy(() => import('./pages/ChatPage').then((m) => ({ default: m.ChatPage })));

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-6">
      <h2 className="text-4xl">?</h2>
    </div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
    <p className="text-gray-500 max-w-md">
      This page is part of our upcoming industry-first digital platform. The core MVP elements of
      Feed and Marketplace are already live!
    </p>
  </div>
);

const RouteFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
  </div>
);

const NotFound = () => <Placeholder title="Page Not Found" />;

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<FeedPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/news" element={<Placeholder title="Industry News Portal" />} />
              <Route path="/events" element={<Placeholder title="Global Events Module" />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/dealers/:id" element={<DealerProfilePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/seed" element={<SeedPage />} />
              <Route path="/listings/:id" element={<ProductPage />} />
              <Route path="/add-listing" element={<AddListingPage />} />
              <Route path="/messages" element={<ChatPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
