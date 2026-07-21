import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Load every weight used across the dapp (including bold headings) so the
// browser never falls back to a different font for heavier text.
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
import { AppKitProvider } from "@/context/AppKitProvider";
import { WalletProvider } from "@/context/WalletContext";
import { ToastProvider } from "@/context/ToastContext";
import { CurrencyProvider } from "@/context/CurrencyContext";

/**
 * @title RootLayout (Advanced Wallet Architecture)
 * @author Viqtorhvayx
 * @dev Root layout for CREODE DeFi. Integrated with AppKit and the Advanced Identity Engine.
 */

export const metadata: Metadata = {
  title: "CREODE DEFI | Hedera Testnet",
  description: "Advanced Saving and Peer-to-Peer Trading platform on Hedera. Engineered by Viqtorhvayx.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-background transition-colors duration-500 min-h-screen flex flex-col`}>
        <AppKitProvider>
          <WalletProvider>
            <CurrencyProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </CurrencyProvider>
          </WalletProvider>
        </AppKitProvider>
      </body>
    </html>
  );
}
