/**
 * @title AppKitProvider (Clean Reset)
 * @author Viqtorhvayx
 * @dev Stripped provider wrappers for a fresh architectural start.
 */

'use client'

import React, { ReactNode } from 'react'

export function AppKitProvider({ children }: { children: ReactNode }) {
  // All Web3 Providers removed during architectural reset
  return <>{children}</>;
}
