"use client";

import { useState, useEffect, useCallback } from 'react';
import { HashConnect, HashConnectTypes, MessageTypes } from 'hashconnect';

/**
 * @title useHashpack
 * @author Viqtorhvayx
 * @dev Hook for managing Hashpack connection on Hedera.
 */
export const useHashpack = () => {
    const [hashconnect, setHashconnect] = useState<HashConnect | null>(null);
    const [pairingData, setPairingData] = useState<HashConnectTypes.SavedPairingData | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const appMetadata: HashConnectTypes.AppMetadata = {
        name: "CREODE DEFI",
        description: "Advanced Saving, Lending, and Borrowing platform on Hedera. Engineered by Viqtorhvayx.",
        icon: "https://www.hashpack.app/img/logo.svg",
    };

    const init = useCallback(async () => {
        const hc = new HashConnect(true); // true for debug mode
        setHashconnect(hc);

        hc.pairingEvent.on((data) => {
            setPairingData(data);
            setAccountId(data.accountIds[0]);
        });

        // Initialize and check for existing pairing
        const initData = await hc.init(appMetadata, "testnet", false);
        
        if (initData.savedPairings.length > 0) {
            setPairingData(initData.savedPairings[0]);
            setAccountId(initData.savedPairings[0].accountIds[0]);
        }
    }, []);

    const connect = async () => {
        if (!hashconnect) return;
        
        try {
            setIsConnecting(true);
            hashconnect.connectToLocalWallet();
        } catch (error) {
            console.error("Hashpack connection error:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = async () => {
        if (!hashconnect || !pairingData) return;
        
        await hashconnect.disconnect(pairingData.topic);
        setPairingData(null);
        setAccountId(null);
    };

    useEffect(() => {
        init();
    }, [init]);

    return { accountId, connect, disconnect, isConnecting, hashconnect, pairingData };
};
