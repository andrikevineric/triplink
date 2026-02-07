import { create } from 'zustand';
import { Trip, CreateTripInput } from '@/types';

interface TripState {
  trips: Trip[];
  selectedTripId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchTrips: () => Promise<void>;
  selectTrip: (id: string | null) => void;
  createTrip: (input: CreateTripInput) => Promise<Trip>;
  updateTrip: (id: string, input: Partial<CreateTripInput>) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  leaveTrip: (id: string) => Promise<void>;
  revokeLink: (id: string) => Promise<string>;
  joinTrip: (code: string) => Promise<Trip>;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  selectedTripId: null,
  isLoading: false,
  error: null,

  fetchTrips: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const trips = await res.json();
        set({ trips, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  selectTrip: (id) => {
    set({ selectedTripId: id });
  },

  createTrip: async (input) => {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create trip');
    }

    const trip = await res.json();
    set((state) => ({ trips: [trip, ...state.trips] }));
    return trip;
  },

  updateTrip: async (id, input) => {
    const res = await fetch(`/api/trips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update trip');
    }

    const trip = await res.json();
    set((state) => ({
      trips: state.trips.map((t) => (t.id === id ? trip : t)),
    }));
    return trip;
  },

  deleteTrip: async (id) => {
    const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete trip');
    }

    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
      selectedTripId: state.selectedTripId === id ? null : state.selectedTripId,
    }));
  },

  leaveTrip: async (id) => {
    const res = await fetch(`/api/trips/${id}/leave`, { method: 'POST' });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to leave trip');
    }

    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
      selectedTripId: state.selectedTripId === id ? null : state.selectedTripId,
    }));
  },

  revokeLink: async (id) => {
    const res = await fetch(`/api/trips/${id}/revoke`, { method: 'POST' });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to revoke link');
    }

    const { shareCode } = await res.json();
    set((state) => ({
      trips: state.trips.map((t) =>
        t.id === id ? { ...t, shareCode } : t
      ),
    }));
    return shareCode;
  },

  joinTrip: async (code) => {
    const res = await fetch(`/api/trips/join/${code}`, { method: 'POST' });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to join trip');
    }

    const trip = await res.json();
    set((state) => {
      const exists = state.trips.some((t) => t.id === trip.id);
      return {
        trips: exists ? state.trips : [trip, ...state.trips],
      };
    });
    return trip;
  },
}));
