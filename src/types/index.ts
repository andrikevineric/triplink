export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  name: string;
  date?: string;
  description?: string;
  order: number;
  cityId: string;
  createdAt: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  arriveDate: string;
  departDate?: string;
  order: number;
  notes?: string;
  activities?: Activity[];
}

export interface TripMember {
  id: string;
  role: 'creator' | 'member';
  joinedAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface Trip {
  id: string;
  name: string;
  shareCode: string;
  shareCodeActive: boolean;
  color: string;
  creatorId: string;
  cities: City[];
  members: TripMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  name: string;
  cities: {
    name: string;
    country: string;
    lat: number;
    lng: number;
    arriveDate: string;
    departDate?: string;
  }[];
}

export interface CitySearchResult {
  name: string;
  country: string;
  lat: number;
  lng: number;
  displayName: string;
}

export interface TripLog {
  id: string;
  action: string;
  details?: string;
  tripId: string;
  userId: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
}
