import type { Metadata } from "next";
import "./globals.css";

/**
 * @title RootLayout
 * @author Viqtorhvayx
 * @dev Root layout for CREODE DeFi. Removes global text color cascade to allow precise color targeting.
 */

export const metadata: Metadata = {
  title: "CREODE DEFI | Hedera Testnet",
  description: "Advanced Saving, Lending, and Borrowing platform on Hedera. Engineered by Viqtorhvayx.",
};

import { Web3Provider } from "@/context/Web3Context";
import { AppKitProvider } from "@/context/AppKitProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background transition-colors duration-500">
        <AppKitProvider>
          <Web3Provider>
            {children}
          </Web3Provider>
        </AppKitProvider>
      </body>
    </html>
  );
}
