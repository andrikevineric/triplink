'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/stores/authStore';
import { useTripStore } from '@/stores/tripStore';
import { AuthModal } from '@/components/Auth/AuthModal';
import { TripList } from '@/components/TripList/TripList';
import { TripDetail } from '@/components/TripDetail/TripDetail';
import { CreateTripModal } from '@/components/CreateTrip/CreateTripModal';
import { Tabs } from '@/components/Layout/Tabs';
import { UserProfile } from '@/components/Profile/UserProfile';

// Dynamically import Globe to avoid SSR issues with Three.js
const Globe = dynamic(() => import('@/components/Globe/Globe').then(mod => mod.Globe), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading globe...</span>
      </div>
    </div>
  ),
});

export default function Home() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const { trips, selectedTripId, fetchTrips, selectTrip } = useTripStore();
  const [activeTab, setActiveTab] = useState<'trips' | 'me'>('trips');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user, fetchTrips]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  return (
    <main className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm">
        <h1 className="text-xl font-semibold">
          <span className="text-primary">Trip</span>Link
        </h1>
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {activeTab === 'trips' ? (
          <>
            {/* Globe Section */}
            <div className="h-[50vh] lg:h-full lg:flex-1 relative">
              <Globe
                trips={trips}
                selectedTripId={selectedTripId}
                onSelectTrip={selectTrip}
              />
              
              {/* FAB with tooltip */}
              <div className="absolute bottom-4 right-4 group">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-14 h-14 bg-primary hover:bg-blue-500 hover:scale-105 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-2xl transition-all duration-200"
                  title="Add destination"
                >
                  +
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-slate-900 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap border border-slate-700 shadow-xl">
                    Where are you going next?
                  </div>
                </div>
              </div>

              {/* Empty state overlay */}
              {trips.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-slate-400 text-lg mb-2">No trips yet</p>
                    <p className="text-slate-500 text-sm">Click the + button to plan your first adventure</p>
                  </div>
                </div>
              )}
            </div>

            {/* Trip List / Detail Section */}
            <div className="flex-1 lg:w-96 lg:flex-none border-t lg:border-t-0 lg:border-l border-slate-800 overflow-hidden flex flex-col bg-slate-950">
              {selectedTrip ? (
                <TripDetail
                  trip={selectedTrip}
                  onClose={() => selectTrip(null)}
                />
              ) : (
                <TripList
                  trips={trips}
                  onSelectTrip={selectTrip}
                />
              )}
            </div>
          </>
        ) : (
          <UserProfile />
        )}
      </div>

      {/* Create Trip Modal */}
      {showCreateModal && (
        <CreateTripModal onClose={() => setShowCreateModal(false)} />
      )}
    </main>
  );
}
