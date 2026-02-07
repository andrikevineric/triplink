'use client';

import { useState } from 'react';
import { Trip } from '@/types';
import { useTripStore } from '@/stores/tripStore';
import { useAuthStore } from '@/stores/authStore';

interface TripDetailProps {
  trip: Trip;
  onClose: () => void;
}

// Collapsible section component
function Section({ 
  title, 
  icon, 
  defaultOpen = true, 
  children 
}: { 
  title: string; 
  icon: string;
  defaultOpen?: boolean; 
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left hover:bg-slate-800/30 transition-colors"
      >
        <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </span>
        <span className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

// Confirmation modal
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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
  const { deleteTrip, leaveTrip, revokeLink } = useTripStore();
  const [showConfirm, setShowConfirm] = useState<'delete' | 'leave' | 'revoke' | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const isCreator = user?.id === trip.creatorId;
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/j/${trip.shareCode}` 
    : '';

  // Get trip status
  const getTripStatus = () => {
    const now = new Date();
    const firstDate = trip.cities[0]?.arriveDate ? new Date(trip.cities[0].arriveDate) : null;
    const lastCity = trip.cities[trip.cities.length - 1];
    const lastDate = lastCity?.departDate || lastCity?.arriveDate;
    const endDate = lastDate ? new Date(lastDate) : null;

    if (endDate && endDate < now) return { label: 'Past', color: 'text-slate-500' };
    if (firstDate && firstDate <= now && (!endDate || endDate >= now)) return { label: 'In Progress', color: 'text-green-400' };
    return { label: 'Upcoming', color: 'text-blue-400' };
  };

  const status = getTripStatus();

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <span>←</span>
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${status.color}`}>{status.label}</span>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: trip.color }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Trip header */}
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-2xl font-bold mb-1">{trip.name}</h2>
          <p className="text-slate-500 text-sm">
            {trip.cities.length} destination{trip.cities.length !== 1 ? 's' : ''} • {trip.members.length} traveler{trip.members.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-4 space-y-2">
          {/* Itinerary Section */}
          <Section title="ITINERARY" icon="📍" defaultOpen={true}>
            <div className="space-y-1">
              {trip.cities.map((city, index) => (
                <div key={city.id} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full border-2"
                      style={{ borderColor: trip.color, backgroundColor: index === 0 ? trip.color : 'transparent' }}
                    />
                    {index < trip.cities.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-700 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-semibold text-white">{city.name}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{city.country}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {formatDate(city.arriveDate)}
                      {city.departDate && ` → ${formatDate(city.departDate)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Travelers Section */}
          <Section title="TRAVELERS" icon="👥" defaultOpen={true}>
            <div className="space-y-2">
              {trip.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: trip.color + '30', color: trip.color }}
                  >
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{member.user.name}</p>
                    {member.role === 'creator' && (
                      <p className="text-xs text-amber-500">✦ Organizer</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Share Section */}
          <Section title="SHARE" icon="🔗" defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Anyone with this link can join your trip.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400 font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-primary hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              {isCreator && (
                <button
                  onClick={() => setShowConfirm('revoke')}
                  className="text-sm text-slate-500 hover:text-amber-400 transition-colors"
                >
                  🔄 Revoke link & generate new
                </button>
              )}
            </div>
          </Section>

          {/* Danger Zone */}
          <Section title="DANGER ZONE" icon="⚠️" defaultOpen={false}>
            <div className="space-y-3">
              {isCreator ? (
                <>
                  <p className="text-xs text-slate-500">
                    Deleting this trip will remove it for all travelers.
                  </p>
                  <button
                    onClick={() => setShowConfirm('delete')}
                    className="w-full py-2.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors border border-red-900/50"
                  >
                    Delete Trip
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-500">
                    Leaving will remove this trip from your list.
                  </p>
                  <button
                    onClick={() => setShowConfirm('leave')}
                    className="w-full py-2.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors border border-red-900/50"
                  >
                    Leave Trip
                  </button>
                </>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Edit button for creator */}
      {isCreator && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <a
            href={`/edit/${trip.id}`}
            className="block w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium text-center transition-colors"
          >
            ✏️ Edit Trip
          </a>
        </div>
      )}

      {/* Confirmation modals */}
      {showConfirm === 'delete' && (
        <ConfirmModal
          title="Delete Trip?"
          message="This will permanently delete the trip for all travelers. This action cannot be undone."
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
          title="Revoke Share Link?"
          message="The current link will stop working. A new link will be generated. Existing members will keep access."
          confirmText={isRevoking ? 'Revoking...' : 'Revoke'}
          onConfirm={handleRevoke}
          onCancel={() => setShowConfirm(null)}
        />
      )}
    </div>
  );
}
