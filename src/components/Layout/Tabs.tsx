'use client';

interface TabsProps {
  activeTab: 'trips' | 'me';
  onTabChange: (tab: 'trips' | 'me') => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onTabChange('trips')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'trips'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Trips
      </button>
      <button
        onClick={() => onTabChange('me')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'me'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Account
      </button>
    </div>
  );
}
