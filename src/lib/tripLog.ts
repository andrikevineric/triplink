import { prisma } from './prisma';

export type TripLogAction = 
  | 'created'
  | 'updated'
  | 'joined'
  | 'left'
  | 'link_revoked'
  | 'activity_added'
  | 'activity_removed';

export async function logTripAction(
  tripId: string,
  userId: string,
  action: TripLogAction,
  details?: Record<string, unknown>
) {
  try {
    await prisma.tripLog.create({
      data: {
        tripId,
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    // Don't throw - logging should not break the main flow
    console.error('Failed to log trip action:', error);
  }
}
