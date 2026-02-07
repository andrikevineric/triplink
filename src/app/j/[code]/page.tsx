'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useTripStore } from '@/stores/tripStore';
import { AuthModal } from '@/components/Auth/AuthModal';
import { Trip } from '@/types';

export default function JoinPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { user, isLoading: authLoading, checkAuth } = useAuthStore();
  const { joinTrip } = useTripStore();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/trips/join/${params.code}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Trip not found');
        }
        const data = await res.json();
        setTrip(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trip');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrip();
  }, [params.code]);

  const handleJoin = async () => {
    if (!trip) return;
    setIsJoining(true);

    try {
      await joinTrip(params.code);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join trip');
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Found</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  if (!trip) return null;

  const cities = trip.cities.map((c) => c.name).join(' → ');
  const firstDate = trip.cities[0]?.arriveDate;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TripLink
          </h1>
          <p className="text-gray-500">You've been invited to join a trip</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          {/* Trip preview */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-4 h-4 rounded-full mt-1"
                style={{ backgroundColor: trip.color }}
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{trip.name}</h2>
                <p className="text-gray-500 text-sm">{cities}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Starting</p>
                <p className="text-gray-900">
                  {firstDate
                    ? new Date(firstDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'TBD'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Travelers</p>
                <p className="text-gray-900">{trip.members.length} people</p>
              </div>
            </div>
          </div>

          {/* Travelers list */}
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Who's going</p>
            <div className="flex flex-wrap gap-2">
              {trip.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                    style={{ backgroundColor: trip.color }}
                  >
                    {member.user.name.charAt(0)}
                  </div>
                  <span className="text-gray-700">{member.user.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isJoining ? 'Joining...' : 'Join Trip'}
          </button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-4">
          Joining as {user.name}
        </p>
      </div>
    </div>
  );
}
