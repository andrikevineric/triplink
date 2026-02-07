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
      return 'Departure cannot be before arrival';
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
      setError('Add at least one destination with a date');
      return;
    }

    for (const city of validCities) {
      const dateError = getCityError(city);
      if (dateError) {
        setError(dateError);
        return;
      }
    }

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading trip...</div>
      </div>
    );
  }

  if (trip.creatorId !== user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">Only the organizer can edit this trip.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 p-4 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <h1 className="font-semibold text-gray-900">Edit Trip</h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trip name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer in Japan"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Destinations
            </label>
            
            {cities.map((cityInput, index) => {
              const cityError = getCityError(cityInput);
              return (
                <div
                  key={cityInput.id}
                  className={`p-4 bg-white rounded-lg space-y-3 border ${
                    cityError ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Stop {index + 1}</span>
                    {cities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCity(cityInput.id)}
                        className="text-gray-400 hover:text-red-500 text-sm transition-colors"
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
                      <label className="block text-xs text-gray-500 mb-1">Arrive</label>
                      <input
                        type="date"
                        value={cityInput.arriveDate}
                        onChange={(e) => updateCity(cityInput.id, { arriveDate: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Depart (optional)</label>
                      <input
                        type="date"
                        value={cityInput.departDate}
                        min={cityInput.arriveDate || undefined}
                        onChange={(e) => updateCity(cityInput.id, { departDate: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>

                  {cityError && <p className="text-red-500 text-xs">{cityError}</p>}
                </div>
              );
            })}

            <button
              type="button"
              onClick={addCity}
              className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
            >
              + Add another destination
            </button>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </main>
    </div>
  );
}
