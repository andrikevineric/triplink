import { NextRequest, NextResponse } from 'next/server';

// Using OpenStreetMap Nominatim for city search (free, no API key)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: query,
          format: 'json',
          limit: '5',
          featuretype: 'city',
          addressdetails: '1',
        }),
      {
        headers: {
          'User-Agent': 'TripLink/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Nominatim API error');
    }

    const data = await response.json();

    const results = data.map((item: any) => ({
      name: item.address?.city || item.address?.town || item.address?.village || item.name,
      country: item.address?.country || '',
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('City search error:', error);
    return NextResponse.json([]);
  }
}
