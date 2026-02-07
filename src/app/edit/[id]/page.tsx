'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useTripStore } from '@/stores/tripStore';
import { CitySearch } from '@/components/CreateTrip/CitySearch';
import { CitySearchResult, Trip, Activity } from '@/types';

interface ActivityInput {
  id: string;
  name: string;
  date: string;
  description: string;
  isNew?: boolean;
  toDelete?: boolean;
}

interface CityInput {
  id: string;
  city: CitySearchResult | null;
  arriveDate: string;
  departDate: string;
  notes: string;
  activities: ActivityInput[];
  isExpanded: boolean;
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
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);

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
        notes: c.notes || '',
        activities: (c.activities || []).map((a: Activity) => ({
          id: a.id,
          name: a.name,
          date: a.date ? a.date.split('T')[0] : '',
          description: a.description || '',
          isNew: false,
        })),
        isExpanded: false,
      })));
    }
  }, [trips, params.id]);

  const addCity = () => {
    setCities([
      ...cities,
      { 
        id: `new-${Date.now()}`, 
        city: null, 
        arriveDate: '', 
        departDate: '', 
        notes: '',
        activities: [],
        isExpanded: false,
      },
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

  const toggleCityExpanded = (id: string) => {
    setCities(
      cities.map((c) => (c.id === id ? { ...c, isExpanded: !c.isExpanded } : c))
    );
  };

  const addActivity = (cityId: string) => {
    setCities(
      cities.map((c) => {
        if (c.id === cityId) {
          return {
            ...c,
            activities: [
              ...c.activities,
              {
                id: `new-${Date.now()}`,
                name: '',
                date: c.arriveDate,
                description: '',
                isNew: true,
              },
            ],
          };
        }
        return c;
      })
    );
  };

  const updateActivity = (cityId: string, activityId: string, updates: Partial<ActivityInput>) => {
    setCities(
      cities.map((c) => {
        if (c.id === cityId) {
          return {
            ...c,
            activities: c.activities.map((a) =>
              a.id === activityId ? { ...a, ...updates } : a
            ),
          };
        }
        return c;
      })
    );
  };

  const removeActivity = (cityId: string, activityId: string) => {
    setCities(
      cities.map((c) => {
        if (c.id === cityId) {
          return {
            ...c,
            activities: c.activities.filter((a) => a.id !== activityId),
          };
        }
        return c;
      })
    );
  };

  const suggestActivities = async (cityId: string, cityName: string, country: string) => {
    setSuggestingFor(cityId);
    try {
      // Use the city's database ID if it exists, otherwise use a mock endpoint
      const cityInput = cities.find(c => c.id === cityId);
      const dbCityId = cityInput?.id.startsWith('new-') ? null : cityInput?.id;
      
      let suggestions;
      if (dbCityId) {
        const res = await fetch(`/api/cities/${dbCityId}/suggest`, { method: 'POST' });
        const data = await res.json();
        suggestions = data.suggestions;
      } else {
        // Fallback for new cities not yet saved
        suggestions = [
          { name: `Explore ${cityName} Old Town`, description: 'Walk through historic streets and discover local architecture' },
          { name: 'Visit Local Markets', description: 'Experience authentic local food and crafts' },
          { name: 'Try Local Cuisine', description: `Sample traditional ${country} dishes at recommended restaurants` },
          { name: 'Cultural Museum Visit', description: 'Learn about local history and culture' },
          { name: 'Scenic Viewpoint', description: 'Find the best panoramic views of the city' },
        ];
      }

      // Add suggestions as new activities
      setCities(
        cities.map((c) => {
          if (c.id === cityId) {
            const newActivities = suggestions.map((s: { name: string; description: string }, i: number) => ({
              id: `new-${Date.now()}-${i}`,
              name: s.name,
              date: c.arriveDate,
              description: s.description,
              isNew: true,
            }));
            return {
              ...c,
              activities: [...c.activities, ...newActivities],
              isExpanded: true,
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    } finally {
      setSuggestingFor(null);
    }
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
      // First update the trip basics
      await updateTrip(params.id, {
        name: name || `Trip to ${sortedCities[0].city!.name}`,
        cities: sortedCities.map((c) => ({
          name: c.city!.name,
          country: c.city!.country,
          lat: c.city!.lat,
          lng: c.city!.lng,
          arriveDate: c.arriveDate,
          departDate: c.departDate || undefined,
          notes: c.notes || undefined,
        })),
      });

      // Refetch to get new city IDs, then save activities
      await fetchTrips();
      const updatedTrip = trips.find(t => t.id === params.id);
      
      if (updatedTrip) {
        // Match cities by order and save activities
        for (let i = 0; i < sortedCities.length; i++) {
          const cityInput = sortedCities[i];
          const dbCity = updatedTrip.cities[i];
          
          if (dbCity) {
            // Save activities for this city
            for (const activity of cityInput.activities) {
              if (activity.name.trim()) {
                await fetch(`/api/cities/${dbCity.id}/activities`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: activity.name.trim(),
                    date: activity.date || null,
                    description: activity.description.trim() || null,
                  }),
                });
              }
            }
          }
        }
      }

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
                  className={`bg-white rounded-lg border ${
                    cityError ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  {/* City Header */}
                  <div className="p-4 space-y-3">
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

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
                      <input
                        type="text"
                        value={cityInput.notes}
                        onChange={(e) => updateCity(cityInput.id, { notes: e.target.value })}
                        placeholder="Hotel, flight info, tips..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    {cityError && <p className="text-red-500 text-xs">{cityError}</p>}

                    {/* Activities Toggle */}
                    {cityInput.city && (
                      <button
                        type="button"
                        onClick={() => toggleCityExpanded(cityInput.id)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${cityInput.isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Activities ({cityInput.activities.length})
                      </button>
                    )}
                  </div>

                  {/* Activities Section */}
                  {cityInput.isExpanded && cityInput.city && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                      {cityInput.activities.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No activities yet</p>
                      ) : (
                        cityInput.activities.map((activity, actIndex) => (
                          <div
                            key={activity.id}
                            className="p-3 bg-white rounded-lg border border-gray-200 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Activity {actIndex + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeActivity(cityInput.id, activity.id)}
                                className="text-gray-400 hover:text-red-500 text-xs transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              type="text"
                              value={activity.name}
                              onChange={(e) => updateActivity(cityInput.id, activity.id, { name: e.target.value })}
                              placeholder="Activity name (e.g., Visit Tiananmen)"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Date (optional)</label>
                                <input
                                  type="date"
                                  value={activity.date}
                                  min={cityInput.arriveDate || undefined}
                                  max={cityInput.departDate || undefined}
                                  onChange={(e) => updateActivity(cityInput.id, activity.id, { date: e.target.value })}
                                  className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
                                <input
                                  type="text"
                                  value={activity.description}
                                  onChange={(e) => updateActivity(cityInput.id, activity.id, { description: e.target.value })}
                                  placeholder="Brief description..."
                                  className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => addActivity(cityInput.id)}
                          className="flex-1 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 text-sm transition-colors"
                        >
                          + Add activity
                        </button>
                        <button
                          type="button"
                          onClick={() => suggestActivities(cityInput.id, cityInput.city!.name, cityInput.city!.country)}
                          disabled={suggestingFor === cityInput.id}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                        >
                          {suggestingFor === cityInput.id ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Loading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              AI Suggest
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
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
