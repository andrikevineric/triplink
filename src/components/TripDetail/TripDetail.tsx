'use client';

import { useState } from 'react';
import { Trip } from '@/types';
import { useTripStore } from '@/stores/tripStore';
import { useAuthStore } from '@/stores/authStore';

interface TripDetailProps {
  trip: Trip;
  onClose: () => void;
}

export function TripDetail({ trip, onClose }: TripDetailProps) {
  const { user } = useAuthStore();
  const { deleteTrip, leaveTrip, revokeLink } = useTripStore();
  const [showConfirm, setShowConfirm] = useState<'delete' | 'leave' | null>(null);
  const [copied, setCopied] = useState(false);

  const isCreator = user?.id === trip.creatorId;
  const shareUrl = `${window.location.origin}/j/${trip.shareCode}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    await revokeLink(trip.id);
  };

  const handleDelete = async () => {
    await deleteTrip(trip.id);
    onClose();
  };

  const handleLeave = async () => {
    await leaveTrip(trip.id);
    onClose();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white"
        >
          ← Back
        </button>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: trip.color }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Trip name */}
        <div>
          <h2 className="text-2xl font-bold">{trip.name}</h2>
          <p className="text-slate-400 text-sm mt-1">
            {trip.members.length} traveler{trip.members.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Cities */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">ITINERARY</h3>
          <div className="space-y-3">
            {trip.cities.map((city, index) => (
              <div key={city.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: trip.color }}
                  />
                  {index < trip.cities.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-700 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">{city.name}</p>
                  <p className="text-sm text-slate-400">{city.country}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {formatDate(city.arriveDate)}
                    {city.departDate && ` - ${formatDate(city.departDate)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Travelers */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">TRAVELERS</h3>
          <div className="space-y-2">
            {trip.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg"
              >
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm">
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{member.user.name}</p>
                  {member.role === 'creator' && (
                    <p className="text-xs text-slate-500">Organizer</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">SHARE</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-400"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-primary hover:bg-blue-600 rounded-lg text-sm"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {isCreator && (
            <button
              onClick={handleRevoke}
              className="mt-2 text-sm text-slate-500 hover:text-slate-300"
            >
              Revoke link & generate new
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          {isCreator ? (
            <button
              onClick={() => setShowConfirm('delete')}
              className="w-full py-3 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg"
            >
              Delete Trip
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm('leave')}
              className="w-full py-3 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg"
            >
              Leave Trip
            </button>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl p-6 max-w-sm w-full border border-slate-700">
            <h3 className="text-lg font-semibold mb-2">
              {showConfirm === 'delete' ? 'Delete Trip?' : 'Leave Trip?'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {showConfirm === 'delete'
                ? 'This will permanently delete the trip for all members.'
                : 'You will no longer have access to this trip.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={showConfirm === 'delete' ? handleDelete : handleLeave}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
              >
                {showConfirm === 'delete' ? 'Delete' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
