'use client';

import { useAuthStore } from '@/stores/authStore';
import { useTripStore } from '@/stores/tripStore';

export function UserProfile() {
  const { user, logout } = useAuthStore();
  const { trips } = useTripStore();

  if (!user) return null;

  const createdTrips = trips.filter((t) => t.creatorId === user.id);
  const joinedTrips = trips.filter((t) => t.creatorId !== user.id);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-2xl mx-auto w-full bg-white">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-3xl font-bold text-gray-900">{createdTrips.length}</p>
          <p className="text-gray-500 text-sm">Trips created</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-3xl font-bold text-gray-900">{joinedTrips.length}</p>
          <p className="text-gray-500 text-sm">Trips joined</p>
        </div>
      </div>

      {/* Created trips */}
      {createdTrips.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Trips I Created
          </h3>
          <div className="space-y-2">
            {createdTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: trip.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{trip.name}</p>
                  <p className="text-sm text-gray-500">
                    {trip.members.length} traveler{trip.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Joined trips */}
      {joinedTrips.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Trips I Joined
          </h3>
          <div className="space-y-2">
            {joinedTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: trip.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{trip.name}</p>
                  <p className="text-sm text-gray-500">
                    {trip.members.length} traveler{trip.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Sign out
        </button>
        <p className="text-center text-gray-400 text-xs mt-4">
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
