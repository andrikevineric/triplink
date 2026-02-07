'use client';

import { useState, useMemo } from 'react';
import { Trip } from '@/types';

interface TripListProps {
  trips: Trip[];
  onSelectTrip: (id: string) => void;
}

type Filter = 'all' | 'upcoming' | 'past';

function getTripStatus(trip: Trip) {
  const now = new Date();
  const firstDate = trip.cities[0]?.arriveDate ? new Date(trip.cities[0].arriveDate) : null;
  const lastCity = trip.cities[trip.cities.length - 1];
  const lastDate = lastCity?.departDate || lastCity?.arriveDate;
  const endDate = lastDate ? new Date(lastDate) : null;

  if (endDate && endDate < now) return 'past';
  if (firstDate && firstDate <= now && (!endDate || endDate >= now)) return 'current';
  return 'upcoming';
}

export function TripList({ trips, onSelectTrip }: TripListProps) {
  const [filter, setFilter] = useState<Filter>('all');

  const { filteredTrips, counts } = useMemo(() => {
    let upcoming = 0;
    let past = 0;

    const filtered = trips.filter((trip) => {
      const status = getTripStatus(trip);
      
      if (status === 'past') past++;
      else upcoming++;

      if (filter === 'all') return true;
      if (filter === 'upcoming') return status !== 'past';
      return status === 'past';
    });

    filtered.sort((a, b) => {
      const statusA = getTripStatus(a);
      const statusB = getTripStatus(b);
      
      if (statusA === 'current' && statusB !== 'current') return -1;
      if (statusB === 'current' && statusA !== 'current') return 1;
      if (statusA === 'past' && statusB !== 'past') return 1;
      if (statusB === 'past' && statusA !== 'past') return -1;

      const dateA = new Date(a.cities[0]?.arriveDate || 0);
      const dateB = new Date(b.cities[0]?.arriveDate || 0);
      return dateA.getTime() - dateB.getTime();
    });

    return { filteredTrips: filtered, counts: { upcoming, past } };
  }, [trips, filter]);

  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { key: 'past', label: 'Past', count: counts.past },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Filter tabs */}
      <div className="flex gap-2 p-4 border-b border-gray-200">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
              filter === f.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
            {f.count !== undefined && (
              <span className={`text-xs ${filter === f.key ? 'text-blue-100' : 'text-gray-400'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTrips.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="font-medium text-gray-500">No trips</p>
            <p className="text-sm mt-1">Create your first trip to get started</p>
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onClick={() => onSelectTrip(trip.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
}

function TripCard({ trip, onClick }: TripCardProps) {
  const status = getTripStatus(trip);
  const isPast = status === 'past';
  const isCurrent = status === 'current';

  const cities = trip.cities.map((c) => c.name).join(' → ');
  const firstDate = trip.cities[0]?.arriveDate;
  const lastCity = trip.cities[trip.cities.length - 1];
  const lastDate = lastCity?.departDate || lastCity?.arriveDate;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const dateRange = firstDate
    ? lastDate && firstDate !== lastDate
      ? `${formatDate(firstDate)} – ${formatDate(lastDate)}`
      : formatDate(firstDate)
    : '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
        isPast 
          ? 'bg-gray-50 border-gray-100 hover:bg-gray-100' 
          : isCurrent
          ? 'bg-white border-blue-200 hover:border-blue-300 shadow-sm'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${isPast ? 'opacity-50' : ''}`}
          style={{ backgroundColor: trip.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold truncate ${isPast ? 'text-gray-400' : 'text-gray-900'}`}>
              {trip.name}
            </h3>
            {isCurrent && (
              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                Active
              </span>
            )}
          </div>
          <p className={`text-sm truncate mt-0.5 ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
            {cities}
          </p>
          <div className={`flex items-center gap-3 mt-2 text-xs ${isPast ? 'text-gray-400' : 'text-gray-400'}`}>
            <span>{dateRange}</span>
            <span>•</span>
            <span>{trip.members.length} traveler{trip.members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
