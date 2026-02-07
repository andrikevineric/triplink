import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/cities/[cityId]/activities - List activities for a city
export async function GET(
  request: NextRequest,
  { params }: { params: { cityId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const city = await prisma.city.findUnique({
    where: { id: params.cityId },
    include: {
      trip: {
        include: { members: true },
      },
      activities: {
        orderBy: [{ date: 'asc' }, { order: 'asc' }],
      },
    },
  });

  if (!city) {
    return NextResponse.json({ error: 'City not found' }, { status: 404 });
  }

  const isMember = city.trip.members.some((m) => m.userId === user.id);
  if (!isMember) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 });
  }

  return NextResponse.json(city.activities);
}

// POST /api/cities/[cityId]/activities - Create activity
export async function POST(
  request: NextRequest,
  { params }: { params: { cityId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const city = await prisma.city.findUnique({
    where: { id: params.cityId },
    include: {
      trip: {
        include: { members: true },
      },
      activities: true,
    },
  });

  if (!city) {
    return NextResponse.json({ error: 'City not found' }, { status: 404 });
  }

  const isMember = city.trip.members.some((m) => m.userId === user.id);
  if (!isMember) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 });
  }

  const body = await request.json();
  const { name, date, description } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const maxOrder = city.activities.reduce((max, a) => Math.max(max, a.order), -1);

  const activity = await prisma.activity.create({
    data: {
      name: name.trim(),
      date: date ? new Date(date) : null,
      description: description?.trim() || null,
      order: maxOrder + 1,
      cityId: params.cityId,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
