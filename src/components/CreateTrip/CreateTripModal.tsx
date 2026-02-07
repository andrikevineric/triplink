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
}

interface CreateTripModalProps {
  onClose: () => void;
}

export function CreateTripModal({ onClose }: CreateTripModalProps) {
  const { createTrip } = useTripStore();
  const [name, setName] = useState('');
  const [cities, setCities] = useState<CityInput[]>([
    { id: '1', city: null, arriveDate: '', departDate: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const validCities = cities.filter((c) => c.city && c.arriveDate);
    if (validCities.length === 0) {
      setError('Add at least one city with a date');
      return;
    }

    setIsLoading(true);

    try {
      await createTrip({
        name: name || `Trip to ${validCities[0].city!.name}`,
        cities: validCities.map((c) => ({
          name: c.city!.name,
          country: c.city!.country,
          lat: c.city!.lat,
          lng: c.city!.lng,
          arriveDate: c.arriveDate,
          departDate: c.departDate || undefined,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-semibold">Where are you going?</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Trip name */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Trip name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer in Japan"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* Cities */}
          <div className="space-y-4">
            <label className="block text-sm text-slate-400">
              Destinations
            </label>
            
            {cities.map((cityInput, index) => (
              <div
                key={cityInput.id}
                className="p-4 bg-slate-800/50 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Stop {index + 1}
                  </span>
                  {cities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCity(cityInput.id)}
                      className="text-slate-500 hover:text-red-400 text-sm"
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
                      onChange={(e) =>
                        updateCity(cityInput.id, { departDate: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addCity}
              className="w-full py-3 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-slate-500 hover:text-slate-300"
            >
              + Add another stop
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:bg-blue-600 disabled:opacity-50 rounded-lg font-medium"
          >
            {isLoading ? 'Creating...' : 'Create Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
