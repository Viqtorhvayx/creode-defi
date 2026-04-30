/**
 * @title config/index.ts
 * @author Viqtorhvayx
 * @dev Re-exports from the single AppKitProvider adapter.
 *      This file no longer creates its own WagmiAdapter to prevent conflicts.
 */

export { wagmiAdapter } from '@/context/AppKitProvider';
