"use client";

import React from 'react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, theme }) => {
  const tabs = [
    { id: 'Home', label: 'Home' },
    { id: 'Vault', label: 'Vault' },
    { id: 'Lend', label: 'Lend' },
    { id: 'Borrow', label: 'Borrow' },
  ];

  return (
    <nav className="flex justify-center mb-16">
      <div className="flex gap-8 px-8 py-3 glass-panel !rounded-full shadow-xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm font-black uppercase tracking-[0.2em] transition-all duration-500 cursor-pointer ${
                isActive 
                  ? 'text-[#00A8E8] drop-shadow-[0_0_8px_rgba(0,168,232,0.6)] scale-110' 
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
