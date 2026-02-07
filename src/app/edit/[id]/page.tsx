'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useTripStore } from '@/stores/tripStore';
import { CitySearch } from '@/components/CreateTrip/CitySearch';
import { CitySearchResult, Trip } from '@/types';

interface CityInput {
  id: string;
  city: CitySearchResult | null;
  arriveDate: string;
  departDate: string;
}

export default function EditTripPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isLoading: authLoading, checkAuth } = useAuthStore();
  const { trips, updateTrip, fetchTrips } = useTripStore();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [name, setName] = useState('');
  const [cities, setCities] = useState<CityInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user, fetchTrips]);

  // Load trip data
  useEffect(() => {
    const foundTrip = trips.find(t => t.id === params.id);
    if (foundTrip) {
      setTrip(foundTrip);
      setName(foundTrip.name);
      setCities(foundTrip.cities.map(c => ({
        id: c.id,
        city: {
          name: c.name,
          country: c.country,
          lat: c.lat,
          lng: c.lng,
          displayName: `${c.name}, ${c.country}`,
        },
        arriveDate: c.arriveDate.split('T')[0],
        departDate: c.departDate ? c.departDate.split('T')[0] : '',
      })));
    }
  }, [trips, params.id]);

  const addCity = () => {
    setCities([
      ...cities,
      { id: Date.now().toString(), city: null, arriveDate: '', departDate: '' },
    ]);
  };

  const removeCity = (id: string) => {
    if (cities.length > 1) {
      setCities(cities.filter((c) => c.id !== id));
    }
  };

  const updateCity = (id: string, updates: Partial<CityInput>) => {
    setCities(
      cities.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const validateDates = (arrive: string, depart: string): string | null => {
    if (!arrive || !depart) return null;
    if (new Date(depart) < new Date(arrive)) {
      return 'Departure date cannot be before arrival date';
    }
    return null;
  };

  const getCityError = (cityInput: CityInput): string | null => {
    return validateDates(cityInput.arriveDate, cityInput.departDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validCities = cities.filter((c) => c.city && c.arriveDate);
    if (validCities.length === 0) {
      setError('Add at least one city with a date');
      return;
    }

    for (const city of validCities) {
      const dateError = getCityError(city);
      if (dateError) {
        setError(dateError);
        return;
      }
    }

    // Sort cities by arrival date
    const sortedCities = [...validCities].sort((a, b) => 
      new Date(a.arriveDate).getTime() - new Date(b.arriveDate).getTime()
    );

    setIsLoading(true);

    try {
      await updateTrip(params.id, {
        name: name || `Trip to ${sortedCities[0].city!.name}`,
        cities: sortedCities.map((c) => ({
          name: c.city!.name,
          country: c.city!.country,
          lat: c.city!.lat,
          lng: c.city!.lng,
          arriveDate: c.arriveDate,
          departDate: c.departDate || undefined,
        })),
      });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trip');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading trip...</div>
      </div>
    );
  }

  if (trip.creatorId !== user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">Only the organizer can edit this trip.</p>
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

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Cancel
          </button>
          <h1 className="font-semibold">Edit Trip</h1>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip name */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Trip name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer in Japan"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* Cities */}
          <div className="space-y-4">
            <label className="block text-sm text-slate-400">
              Destinations
            </label>
            
            {cities.map((cityInput, index) => {
              const cityError = getCityError(cityInput);
              return (
                <div
                  key={cityInput.id}
                  className={`p-4 bg-slate-900 rounded-lg space-y-3 border ${
                    cityError ? 'border-red-500/50' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Stop {index + 1}
                    </span>
                    {cities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCity(cityInput.id)}
                        className="text-slate-500 hover:text-red-400 text-sm transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <CitySearch
                    value={cityInput.city}
                    onChange={(city) => updateCity(cityInput.id, { city })}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Arrive
                      </label>
                      <input
                        type="date"
                        value={cityInput.arriveDate}
                        onChange={(e) =>
                          updateCity(cityInput.id, { arriveDate: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Depart (optional)
                      </label>
                      <input
                        type="date"
                        value={cityInput.departDate}
                        min={cityInput.arriveDate || undefined}
                        onChange={(e) =>
                          updateCity(cityInput.id, { departDate: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {cityError && (
                    <p className="text-red-400 text-xs">{cityError}</p>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={addCity}
              className="w-full py-3 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-primary hover:text-primary transition-colors"
            >
              + Add another destination
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/20 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:bg-blue-600 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </main>
    </div>
  );
}
