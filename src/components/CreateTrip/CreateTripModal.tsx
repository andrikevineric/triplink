'use client';

import { useState } from 'react';
import { useTripStore } from '@/stores/tripStore';
import { CitySearch } from './CitySearch';
import { CitySearchResult } from '@/types';

interface CityInput {
  id: string;
  city: CitySearchResult | null;
  arriveDate: string;
  departDate: string;
  notes: string;
}

interface CreateTripModalProps {
  onClose: () => void;
}

export function CreateTripModal({ onClose }: CreateTripModalProps) {
  const { createTrip } = useTripStore();
  const [name, setName] = useState('');
  const [cities, setCities] = useState<CityInput[]>([
    { id: '1', city: null, arriveDate: '', departDate: '', notes: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCity = () => {
    setCities([
      ...cities,
      { id: Date.now().toString(), city: null, arriveDate: '', departDate: '', notes: '' },
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
      await createTrip({
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
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
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
                  className={`p-4 bg-gray-50 rounded-lg space-y-3 border ${
                    cityError ? 'border-red-300' : 'border-transparent'
                  }`}
                >
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

                  {cityError && (
                    <p className="text-red-500 text-xs">{cityError}</p>
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
