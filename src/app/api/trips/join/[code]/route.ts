import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/trips/join/[code] - Preview trip (public)
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const trip = await prisma.trip.findUnique({
    where: { shareCode: params.code },
    include: {
      cities: { orderBy: { order: 'asc' } },
      members: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!trip || !trip.shareCodeActive) {
    return NextResponse.json(
      { error: 'Trip not found or link has been revoked' },
      { status: 404 }
    );
  }

  return NextResponse.json(trip);
}

// POST /api/trips/join/[code] - Join trip
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const trip = await prisma.trip.findUnique({
    where: { shareCode: params.code },
    include: {
      members: true,
    },
  });

  if (!trip || !trip.shareCodeActive) {
    return NextResponse.json(
      { error: 'Trip not found or link has been revoked' },
      { status: 404 }
    );
  }

  // Check if already a member
  const existingMember = trip.members.find((m) => m.userId === user.id);
  if (existingMember) {
    // Already a member, just return the trip
    const fullTrip = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: {
        cities: { orderBy: { order: 'asc' } },
        members: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
    return NextResponse.json(fullTrip);
  }

  // Add as member
  await prisma.tripMember.create({
    data: {
      tripId: trip.id,
      userId: user.id,
      role: 'member',
    },
  });

  const fullTrip = await prisma.trip.findUnique({
    where: { id: trip.id },
    include: {
      cities: { orderBy: { order: 'asc' } },
      members: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(fullTrip);
}
