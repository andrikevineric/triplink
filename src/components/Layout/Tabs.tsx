'use client';

interface TabsProps {
  activeTab: 'trips' | 'me';
  onTabChange: (tab: 'trips' | 'me') => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
      <button
        onClick={() => onTabChange('trips')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'trips'
            ? 'bg-primary text-white'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        🌍 Trips
      </button>
      <button
        onClick={() => onTabChange('me')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'me'
            ? 'bg-primary text-white'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        👤 Me
      </button>
    </div>
  );
}
