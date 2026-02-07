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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Oops!</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary hover:bg-blue-600 rounded-lg"
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-primary">Trip</span>Link
          </h1>
          <p className="text-slate-400">You've been invited to join a trip!</p>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          {/* Trip preview */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-4 h-4 rounded-full mt-1"
                style={{ backgroundColor: trip.color }}
              />
              <div>
                <h2 className="text-xl font-bold">{trip.name}</h2>
                <p className="text-slate-400 text-sm">{cities}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Starting</p>
                <p>
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
                <p className="text-slate-500">Travelers</p>
                <p>{trip.members.length} people</p>
              </div>
            </div>
          </div>

          {/* Travelers list */}
          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-2">Who's going</p>
            <div className="flex flex-wrap gap-2">
              {trip.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full text-sm"
                >
                  <div className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs">
                    {member.user.name.charAt(0)}
                  </div>
                  {member.user.name}
                </div>
              ))}
            </div>
          </div>

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full py-3 bg-primary hover:bg-blue-600 disabled:opacity-50 rounded-lg font-medium"
          >
            {isJoining ? 'Joining...' : 'Join This Trip'}
          </button>
        </div>

        <p className="text-center text-slate-600 text-sm mt-4">
          Joining as {user.name}
        </p>
      </div>
    </div>
  );
}
