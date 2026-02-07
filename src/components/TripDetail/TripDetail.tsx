'use client';

import { useState } from 'react';
import { Trip } from '@/types';
import { useTripStore } from '@/stores/tripStore';
import { useAuthStore } from '@/stores/authStore';

interface TripDetailProps {
  trip: Trip;
  onClose: () => void;
}

function Section({ 
  title, 
  defaultOpen = true, 
  children 
}: { 
  title: string;
  defaultOpen?: boolean; 
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

function ConfirmModal({ 
  title, 
  message, 
  confirmText, 
  onConfirm, 
  onCancel 
}: {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full border border-gray-200 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TripDetail({ trip, onClose }: TripDetailProps) {
  const { user } = useAuthStore();
  const { deleteTrip, leaveTrip, revokeLink, duplicateTrip } = useTripStore();
  const [showConfirm, setShowConfirm] = useState<'delete' | 'leave' | 'revoke' | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const isCreator = user?.id === trip.creatorId;
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/j/${trip.shareCode}` 
    : '';

  const getTripStatus = () => {
    const now = new Date();
    const firstDate = trip.cities[0]?.arriveDate ? new Date(trip.cities[0].arriveDate) : null;
    const lastCity = trip.cities[trip.cities.length - 1];
    const lastDate = lastCity?.departDate || lastCity?.arriveDate;
    const endDate = lastDate ? new Date(lastDate) : null;

    if (endDate && endDate < now) return { label: 'Completed', color: 'text-gray-400 bg-gray-100' };
    if (firstDate && firstDate <= now && (!endDate || endDate >= now)) return { label: 'Active', color: 'text-green-700 bg-green-100' };
    return { label: 'Upcoming', color: 'text-blue-700 bg-blue-100' };
  };

  const status = getTripStatus();

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await duplicateTrip(trip.id);
      onClose();
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await revokeLink(trip.id);
      setShowConfirm(null);
    } finally {
      setIsRevoking(false);
    }
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: trip.color }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Trip header */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{trip.name}</h2>
          <p className="text-gray-500 text-sm">
            {trip.cities.length} destination{trip.cities.length !== 1 ? 's' : ''} · {trip.members.length} traveler{trip.members.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-4 space-y-2">
          {/* Itinerary */}
          <Section title="Itinerary" defaultOpen={true}>
            <div className="space-y-1">
              {trip.cities.map((city, index) => (
                <div key={city.id} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full border-2"
                      style={{ borderColor: trip.color, backgroundColor: index === 0 ? trip.color : 'transparent' }}
                    />
                    {index < trip.cities.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-900">{city.name}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{city.country}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(city.arriveDate)}
                      {city.departDate && ` → ${formatDate(city.departDate)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Travelers */}
          <Section title="Travelers" defaultOpen={true}>
            <div className="space-y-2">
              {trip.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white"
                    style={{ backgroundColor: trip.color }}
                  >
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{member.user.name}</p>
                    {member.role === 'creator' && (
                      <p className="text-xs text-gray-400">Organizer</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Share */}
          <Section title="Share" defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Anyone with this link can join your trip.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              {isCreator && (
                <button
                  onClick={() => setShowConfirm('revoke')}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Revoke and generate new link
                </button>
              )}
            </div>
          </Section>

          {/* Actions */}
          <Section title="Settings" defaultOpen={false}>
            <div className="space-y-3">
              {isCreator ? (
                <>
                  <p className="text-xs text-gray-400">
                    Deleting this trip will remove it for all travelers.
                  </p>
                  <button
                    onClick={() => setShowConfirm('delete')}
                    className="w-full py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  >
                    Delete Trip
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400">
                    Leaving will remove this trip from your list.
                  </p>
                  <button
                    onClick={() => setShowConfirm('leave')}
                    className="w-full py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  >
                    Leave Trip
                  </button>
                </>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {isCreator && (
          <a
            href={`/edit/${trip.id}`}
            className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-center transition-colors"
          >
            Edit Trip
          </a>
        )}
        <button
          onClick={handleDuplicate}
          disabled={isDuplicating}
          className="w-full py-3 bg-white hover:bg-gray-50 text-gray-600 rounded-lg font-medium transition-colors border border-gray-200 disabled:opacity-50"
        >
          {isDuplicating ? 'Duplicating...' : 'Duplicate Trip'}
        </button>
      </div>

      {/* Modals */}
      {showConfirm === 'delete' && (
        <ConfirmModal
          title="Delete Trip?"
          message="This will permanently delete the trip for all travelers. This cannot be undone."
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(null)}
        />
      )}

      {showConfirm === 'leave' && (
        <ConfirmModal
          title="Leave Trip?"
          message="You will no longer have access to this trip. You can rejoin if you have the link."
          confirmText="Leave"
          onConfirm={handleLeave}
          onCancel={() => setShowConfirm(null)}
        />
      )}

      {showConfirm === 'revoke' && (
        <ConfirmModal
          title="Revoke Link?"
          message="The current link will stop working. A new link will be generated. Existing members keep access."
          confirmText={isRevoking ? 'Revoking...' : 'Revoke'}
          onConfirm={handleRevoke}
          onCancel={() => setShowConfirm(null)}
        />
      )}
    </div>
  );
}
