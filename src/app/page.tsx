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

const TripMap = dynamic(() => import('@/components/Map/TripMap').then(mod => mod.TripMap), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">Loading map...</span>
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  return (
    <main className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
        <h1 className="text-xl font-semibold text-gray-900">
          TripLink
        </h1>
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {activeTab === 'trips' ? (
          <>
            {/* Map Section */}
            <div className="h-[50vh] lg:h-full lg:flex-1 relative">
              <TripMap
                trips={trips}
                selectedTripId={selectedTripId}
                onSelectTrip={selectTrip}
              />

              {/* Empty state */}
              {trips.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gray-50/80">
                  <div className="text-center">
                    <p className="text-gray-600 text-lg font-medium mb-1">No trips yet</p>
                    <p className="text-gray-400 text-sm">Click "New Trip" to plan your first adventure</p>
                  </div>
                </div>
              )}
            </div>

            {/* Trip List / Detail Section */}
            <div className="flex-1 lg:w-96 lg:flex-none border-t lg:border-t-0 lg:border-l border-gray-200 overflow-hidden flex flex-col bg-white">
              {selectedTrip ? (
                <TripDetail
                  trip={selectedTrip}
                  onClose={() => selectTrip(null)}
                />
              ) : (
                <TripList
                  trips={trips}
                  onSelectTrip={selectTrip}
                  onCreateTrip={() => setShowCreateModal(true)}
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
