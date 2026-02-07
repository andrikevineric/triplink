import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logTripAction } from '@/lib/tripLog';

// GET /api/trips/[id] - Get trip details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const trip = await prisma.trip.findUnique({
    where: { id: params.id },
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
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Check if user is a member
  const isMember = trip.members.some((m) => m.userId === user.id);
  if (!isMember) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return NextResponse.json(trip);
}

// PATCH /api/trips/[id] - Update trip (creator only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const trip = await prisma.trip.findUnique({
    where: { id: params.id },
  });

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  if (trip.creatorId !== user.id) {
    return NextResponse.json(
      { error: 'Only the creator can edit this trip' },
      { status: 403 }
    );
  }

  try {
    const { name, cities } = await request.json();

    // Update trip and replace cities
    const updated = await prisma.$transaction(async (tx) => {
      // Delete existing cities
      await tx.city.deleteMany({ where: { tripId: params.id } });

      // Update trip with new cities
      return tx.trip.update({
        where: { id: params.id },
        data: {
          name: name || trip.name,
          cities: cities
            ? {
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
              }
            : undefined,
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
              user: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    // Log the update action
    await logTripAction(params.id, user.id, 'updated', {
      name: updated.name,
      citiesCount: updated.cities.length,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update trip error:', error);
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[id] - Delete trip (creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const trip = await prisma.trip.findUnique({
    where: { id: params.id },
  });

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  if (trip.creatorId !== user.id) {
    return NextResponse.json(
      { error: 'Only the creator can delete this trip' },
      { status: 403 }
    );
  }

  await prisma.trip.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
