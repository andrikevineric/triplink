import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Helper to check membership
async function checkAccess(activityId: string, userId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      city: {
        include: {
          trip: {
            include: { members: true },
          },
        },
      },
    },
  });

  if (!activity) return { error: 'Activity not found', status: 404 };

  const isMember = activity.city.trip.members.some((m) => m.userId === userId);
  if (!isMember) return { error: 'Not a member', status: 403 };

  return { activity };
}

// PATCH /api/activities/[id] - Update activity
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await checkAccess(params.id, user.id);
  if ('error' in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json();
  const { name, date, description, order } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (date !== undefined) updateData.date = date ? new Date(date) : null;
  if (description !== undefined) updateData.description = description?.trim() || null;
  if (order !== undefined) updateData.order = order;

  const activity = await prisma.activity.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(activity);
}

// DELETE /api/activities/[id] - Delete activity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await checkAccess(params.id, user.id);
  if ('error' in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  await prisma.activity.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
