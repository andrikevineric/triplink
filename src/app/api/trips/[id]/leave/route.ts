import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST /api/trips/[id]/leave - Leave a trip
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
    include: {
      members: true,
    },
  });

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const membership = trip.members.find((m) => m.userId === user.id);
  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a member of this trip' },
      { status: 400 }
    );
  }

  // If creator is leaving, transfer ownership
  if (trip.creatorId === user.id) {
    const otherMembers = trip.members.filter((m) => m.userId !== user.id);

    if (otherMembers.length > 0) {
      // Transfer to oldest member
      const newCreator = otherMembers.sort(
        (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
      )[0];

      await prisma.$transaction([
        prisma.trip.update({
          where: { id: params.id },
          data: { creatorId: newCreator.userId },
        }),
        prisma.tripMember.update({
          where: { id: newCreator.id },
          data: { role: 'creator' },
        }),
        prisma.tripMember.delete({
          where: { id: membership.id },
        }),
      ]);
    } else {
      // Last person leaving - delete trip
      await prisma.trip.delete({ where: { id: params.id } });
    }
  } else {
    // Regular member leaving
    await prisma.tripMember.delete({
      where: { id: membership.id },
    });
  }

  return NextResponse.json({ success: true });
}
