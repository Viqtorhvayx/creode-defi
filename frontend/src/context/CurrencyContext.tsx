"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
  rate: number; // units of this currency per 1 USD (fixed reference rate)
}

// Fixed reference rates (not a live feed) — good enough for a testnet dapp's
// display preference. USD stays the source of truth for every underlying
// on-chain USD value; this only changes how it's presented.
export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$', rate: 1 },
  { code: 'EUR', label: 'Euro', symbol: '€', rate: 0.92 },
  { code: 'GBP', label: 'British Pound', symbol: '£', rate: 0.79 },
  { code: 'NGN', label: 'Nigerian Naira', symbol: '₦', rate: 1600 },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹', rate: 83 },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥', rate: 157 },
];

interface CurrencyContextValue {
  currency: CurrencyOption;
  setCurrencyCode: (code: string) => void;
  convert: (usd: number) => number;
  format: (usd: number, opts?: { maximumFractionDigits?: number }) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'creode-currency';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [code, setCode] = useState('USD');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && CURRENCIES.some((c) => c.code === saved)) setCode(saved);
  }, []);

  const setCurrencyCode = (next: string) => {
    setCode(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const currency = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
  const convert = (usd: number) => usd * currency.rate;
  const format = (usd: number, opts?: { maximumFractionDigits?: number }) => {
    const val = convert(usd);
    const maxDp = opts?.maximumFractionDigits ?? (currency.code === 'JPY' ? 0 : 2);
    return `${currency.symbol}${val.toLocaleString(undefined, { minimumFractionDigits: Math.min(2, maxDp), maximumFractionDigits: maxDp })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrencyCode, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
