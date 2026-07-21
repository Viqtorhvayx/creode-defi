// Flat "circle of people" icon for "P2P" (peer-to-peer community), matching
// CustomVaultIcon/CustomEarnIcon's pattern: currentColor fill only, so it
// inherits the sidebar's active/inactive text color exactly like the other
// nav icons. Six heads joined in a ring around a hollow center.
import React from 'react';

export const CustomP2PIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="
M25.5 16
A9.5 9.5 0 1 0 6.5 16
A9.5 9.5 0 1 0 25.5 16
Z
M21.5 16
A5.5 5.5 0 1 0 10.5 16
A5.5 5.5 0 1 0 21.5 16
Z"
      />
      <path
        d="
M18.6 5
A2.6 2.6 0 1 0 13.4 5
A2.6 2.6 0 1 0 18.6 5
Z
M28.13 10.5
A2.6 2.6 0 1 0 22.93 10.5
A2.6 2.6 0 1 0 28.13 10.5
Z
M28.13 21.5
A2.6 2.6 0 1 0 22.93 21.5
A2.6 2.6 0 1 0 28.13 21.5
Z
M18.6 27
A2.6 2.6 0 1 0 13.4 27
A2.6 2.6 0 1 0 18.6 27
Z
M9.07 21.5
A2.6 2.6 0 1 0 3.87 21.5
A2.6 2.6 0 1 0 9.07 21.5
Z
M9.07 10.5
A2.6 2.6 0 1 0 3.87 10.5
A2.6 2.6 0 1 0 9.07 10.5
Z"
      />
    </svg>
  );
};
