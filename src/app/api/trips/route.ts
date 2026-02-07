import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { nanoid } from 'nanoid';
import { generateTripColor } from '@/lib/geo';

// GET /api/trips - List user's trips
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const trips = await prisma.trip.findMany({
    where: {
      members: {
        some: { userId: user.id },
      },
    },
    include: {
      cities: {
        orderBy: { order: 'asc' },
        include: {
          activities: {
            orderBy: [{ date: 'asc' }, { order: 'asc' }],
          },
        },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(trips);
}

// POST /api/trips - Create a trip
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { name, cities } = await request.json();

    if (!cities || cities.length === 0) {
      return NextResponse.json(
        { error: 'At least one city is required' },
        { status: 400 }
      );
    }

    const tripName = name || `Trip to ${cities[0].name}`;

    const trip = await prisma.trip.create({
      data: {
        name: tripName,
        shareCode: nanoid(8),
        color: generateTripColor(),
        creatorId: user.id,
        cities: {
          create: cities.map((city: any, index: number) => ({
            name: city.name,
            country: city.country,
            lat: city.lat,
            lng: city.lng,
            arriveDate: new Date(city.arriveDate),
            departDate: city.departDate ? new Date(city.departDate) : null,
            order: index,
            notes: city.notes || null,
          })),
        },
        members: {
          create: {
            userId: user.id,
            role: 'creator',
          },
        },
      },
      include: {
        cities: {
          orderBy: { order: 'asc' },
          include: {
            activities: {
              orderBy: [{ date: 'asc' }, { order: 'asc' }],
            },
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}
