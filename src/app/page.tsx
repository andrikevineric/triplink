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
    <div className="flex items-center justify-center h-full bg-slate-900">
      <div className="text-slate-400">Loading globe...</div>
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  return (
    <main className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
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
              
              {/* FAB */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="absolute bottom-4 right-4 w-14 h-14 bg-primary hover:bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-2xl"
                title="Create new trip"
              >
                +
              </button>
            </div>

            {/* Trip List / Detail Section */}
            <div className="flex-1 lg:w-96 lg:flex-none border-t lg:border-t-0 lg:border-l border-slate-800 overflow-hidden flex flex-col">
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
