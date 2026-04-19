"use client";

import { useState, useEffect, useCallback } from 'react';
import { HashConnect } from 'hashconnect';
import { LedgerId } from '@hashgraph/sdk';

/**
 * @title useHashpack
 * @author Viqtorhvayx
 * @dev Hook for managing Hashpack connection on Hedera (HashConnect v3).
 */
export const useHashpack = () => {
    const [hashconnect, setHashconnect] = useState<HashConnect | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const init = useCallback(async () => {
        // HashConnect v3 simplified initialization
        const hc = new HashConnect(LedgerId.TESTNET, "7ac375b7ac375b7ac375b7ac375b7ac3", {
            name: "CREODE DEFI",
            description: "Advanced Saving, Lending, and Borrowing platform on Hedera. Engineered by Viqtorhvayx.",
            icons: ["https://www.hashpack.app/img/logo.svg"],
            url: typeof window !== 'undefined' ? window.location.origin : ""
        }, true);
        
        setHashconnect(hc);

        hc.pairingEvent.on((data) => {
            if (data.accountIds && data.accountIds.length > 0) {
                setAccountId(data.accountIds[0]);
            }
        });

        hc.disconnectionEvent.on(() => {
            setAccountId(null);
        });

        await hc.init();
    }, []);

    const connect = async () => {
        if (!hashconnect) return;
        
        try {
            setIsConnecting(true);
            await hashconnect.openPairingModal();
        } catch (error) {
            console.error("Hashpack connection error:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = async () => {
        if (!hashconnect) return;
        await hashconnect.disconnect();
        setAccountId(null);
    };

    useEffect(() => {
        init();
    }, [init]);

    return { accountId, connect, disconnect, isConnecting, hashconnect };
};
