import { TAB_CONFIG } from '../config/tabs';

interface TabBarProps {
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex gap-1.5 flex-wrap mb-6">
      {TAB_CONFIG.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-3 py-1.5 font-pixel text-[7px] cursor-pointer transition-colors ${
            activeTab === tab.key
              ? 'bg-pixel-black text-card-bg border-2 border-pixel-black'
              : 'bg-transparent text-text-muted border-2 border-[#706858]/40 hover:border-text-main/60'
          }`}
          style={activeTab === tab.key ? { boxShadow: '2px 2px 0 #2a2a2a' } : undefined}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
