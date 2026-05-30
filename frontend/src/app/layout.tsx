import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-poppins' });
import { AppKitProvider } from "@/context/AppKitProvider";
import { WalletProvider } from "@/context/WalletContext";
import { ToastProvider } from "@/context/ToastContext";

/**
 * @title RootLayout (Advanced Wallet Architecture)
 * @author Viqtorhvayx
 * @dev Root layout for CREODE DeFi. Integrated with AppKit and the Advanced Identity Engine.
 */

export const metadata: Metadata = {
  title: "CREODE DEFI | Hedera Testnet",
  description: "Advanced Saving, Lending, and Borrowing platform on Hedera. Engineered by Viqtorhvayx.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.variable} antialiased bg-background transition-colors duration-500 min-h-screen flex flex-col`}>
        <AppKitProvider>
          <WalletProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </WalletProvider>
        </AppKitProvider>
      </body>
    </html>
  );
}
