'use client';

import { useState, useMemo } from 'react';
import { Trip } from '@/types';

interface TripListProps {
  trips: Trip[];
  onSelectTrip: (id: string) => void;
}

type Filter = 'all' | 'upcoming' | 'past';

export function TripList({ trips, onSelectTrip }: TripListProps) {
  const [filter, setFilter] = useState<Filter>('all');

  const filteredTrips = useMemo(() => {
    const now = new Date();
    
    return trips.filter((trip) => {
      if (filter === 'all') return true;
      
      const lastCity = trip.cities[trip.cities.length - 1];
      const endDate = lastCity?.departDate || lastCity?.arriveDate;
      const tripEnd = endDate ? new Date(endDate) : null;
      
      if (filter === 'upcoming') {
        return !tripEnd || tripEnd >= now;
      } else {
        return tripEnd && tripEnd < now;
      }
    });
  }, [trips, filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Filter chips */}
      <div className="flex gap-2 p-4 border-b border-slate-800">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === f.key
                ? 'bg-primary text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTrips.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <p>No trips yet</p>
            <p className="text-sm mt-1">Click + to create your first trip</p>
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
      ? `${formatDate(firstDate)} - ${formatDate(lastDate)}`
      : formatDate(firstDate)
    : '';

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
          style={{ backgroundColor: trip.color }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{trip.name}</h3>
          <p className="text-sm text-slate-400 truncate">{cities}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span>{dateRange}</span>
            <span>•</span>
            <span>{trip.members.length} traveler{trip.members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
