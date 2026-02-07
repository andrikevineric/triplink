'use client';

import { useState } from 'react';
import { useTripStore } from '@/stores/tripStore';
import { CitySearch } from './CitySearch';
import { CitySearchResult } from '@/types';

interface ActivityInput {
  id: string;
  name: string;
  date: string;
  description: string;
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

interface CreateTripModalProps {
  onClose: () => void;
}

export function CreateTripModal({ onClose }: CreateTripModalProps) {
  const { createTrip, fetchTrips } = useTripStore();
  const [name, setName] = useState('');
  const [cities, setCities] = useState<CityInput[]>([
    { id: '1', city: null, arriveDate: '', departDate: '', notes: '', activities: [], isExpanded: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);

  const addCity = () => {
    setCities([
      ...cities,
      { id: Date.now().toString(), city: null, arriveDate: '', departDate: '', notes: '', activities: [], isExpanded: false },
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
      // For new trips, use generic suggestions
      const suggestions = [
        { name: `Explore ${cityName} Old Town`, description: 'Walk through historic streets and discover local architecture' },
        { name: 'Visit Local Markets', description: 'Experience authentic local food and crafts' },
        { name: 'Try Local Cuisine', description: `Sample traditional ${country} dishes at recommended restaurants` },
        { name: 'Cultural Museum Visit', description: 'Learn about local history and culture' },
        { name: 'Scenic Viewpoint', description: 'Find the best panoramic views of the city' },
      ];

      const cityInput = cities.find(c => c.id === cityId);
      
      setCities(
        cities.map((c) => {
          if (c.id === cityId) {
            const newActivities = suggestions.map((s, i) => ({
              id: `new-${Date.now()}-${i}`,
              name: s.name,
              date: c.arriveDate,
              description: s.description,
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
      const trip = await createTrip({
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

      // Save activities for each city
      await fetchTrips();
      
      for (let i = 0; i < sortedCities.length; i++) {
        const cityInput = sortedCities[i];
        const dbCity = trip.cities[i];
        
        if (dbCity && cityInput.activities.length > 0) {
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

      await fetchTrips();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Trip</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Trip name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trip name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer in Japan"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Cities */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Destinations
            </label>
            
            {cities.map((cityInput, index) => {
              const cityError = getCityError(cityInput);
              return (
                <div
                  key={cityInput.id}
                  className={`bg-gray-50 rounded-lg border ${
                    cityError ? 'border-red-300' : 'border-transparent'
                  }`}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Stop {index + 1}
                      </span>
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
                        <label className="block text-xs text-gray-500 mb-1">
                          Arrive
                        </label>
                        <input
                          type="date"
                          value={cityInput.arriveDate}
                          onChange={(e) =>
                            updateCity(cityInput.id, { arriveDate: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Depart (optional)
                        </label>
                        <input
                          type="date"
                          value={cityInput.departDate}
                          min={cityInput.arriveDate || undefined}
                          onChange={(e) =>
                            updateCity(cityInput.id, { departDate: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        value={cityInput.notes}
                        onChange={(e) =>
                          updateCity(cityInput.id, { notes: e.target.value })
                        }
                        placeholder="Hotel, flight info, tips..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    {cityError && (
                      <p className="text-red-500 text-xs">{cityError}</p>
                    )}

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
                    <div className="border-t border-gray-200 p-4 bg-white/50 space-y-3">
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
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
