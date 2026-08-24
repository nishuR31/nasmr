import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';

const CitizenPortal = React.lazy(() => import('./pages/CitizenPortal').then(module => ({ default: module.CitizenPortal })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const MapView = React.lazy(() => import('./pages/MapView').then(module => ({ default: module.MapView })));
const ReportForm = React.lazy(() => import('./pages/ReportForm').then(module => ({ default: module.ReportForm })));

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-dark-bg text-white">
        <Navbar />
        <main>
          <Suspense fallback={<div className="flex h-[50vh] items-center justify-center text-gray-400">Loading application...</div>}>
            <Routes>
              <Route path="/" element={<CitizenPortal />} />
              <Route path="/report" element={<ReportForm />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/map" element={<MapView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}
