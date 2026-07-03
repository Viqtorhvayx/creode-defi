import React from 'react';

interface P2PTabProps {
  theme: 'light' | 'dark';
}

export const P2PTab: React.FC<P2PTabProps> = ({ theme }) => {
  return (
    <div className="w-full h-full flex flex-col text-white">
      {/* Completely empty P2P tab as requested */}
    </div>
  );
};
