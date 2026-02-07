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
    <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-2xl mx-auto w-full">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="text-slate-400">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-3xl font-bold">{createdTrips.length}</p>
          <p className="text-slate-400 text-sm">Trips created</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-3xl font-bold">{joinedTrips.length}</p>
          <p className="text-slate-400 text-sm">Trips joined</p>
        </div>
      </div>

      {/* My trips */}
      {createdTrips.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            TRIPS I CREATED
          </h3>
          <div className="space-y-2">
            {createdTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: trip.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{trip.name}</p>
                  <p className="text-sm text-slate-500">
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
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            TRIPS I JOINED
          </h3>
          <div className="space-y-2">
            {joinedTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: trip.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{trip.name}</p>
                  <p className="text-sm text-slate-500">
                    {trip.members.length} traveler{trip.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full py-3 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg"
        >
          Log out
        </button>
        <p className="text-center text-slate-600 text-xs mt-4">
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
