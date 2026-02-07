import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { nanoid } from 'nanoid';

// POST /api/trips/[id]/revoke - Revoke link and generate new one
export async function POST(
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
      { error: 'Only the creator can revoke the link' },
      { status: 403 }
    );
  }

  const newCode = nanoid(8);

  await prisma.trip.update({
    where: { id: params.id },
    data: { shareCode: newCode },
  });

  return NextResponse.json({ shareCode: newCode });
}
