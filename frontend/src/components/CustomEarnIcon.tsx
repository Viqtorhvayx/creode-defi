// Flat droplet icon for "Earn" (growth/yield), matching CustomVaultIcon's
// pattern: a single currentColor path so it inherits the sidebar's active /
// inactive text color exactly like the other nav icons.
import React from 'react';

export const CustomEarnIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 32 34"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="
M16.6 1.2
C16.9 3.4 16.2 5.4 14.6 7.6
C10.9 12.6 8.6 17.1 8.6 21.4
C8.6 27.2 12.7 31.6 18.1 31.6
C23.5 31.6 27.6 27.2 27.6 21.4
C27.6 15.9 23.4 9.4 17.4 2.4
C17.15 2.1 16.9 1.7 16.6 1.2
Z
M16.1 6.2
C16.85 5.15 17.35 4.05 17.55 2.9
C22.7 9.15 26 14.9 26 19.7
C26 24.9 22.35 28.9 17.6 28.9
C15.9 28.9 14.35 28.4 13.05 27.55
C15.4 26.5 17 24.15 17 21.4
C17 18.35 15.15 15.15 12 11.1
C13.5 9.5 14.95 7.85 16.1 6.2
Z"
      />
    </svg>
  );
};
