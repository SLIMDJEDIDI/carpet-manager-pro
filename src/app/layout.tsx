import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Carpet Manager PRO",
  description: "Production and Order Management for Carpets",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const user = session?.user;

  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#f8fafc] text-slate-900`}>
        <div className="flex flex-col md:flex-row min-h-screen">
          {user && <MobileNav user={user} />}
          {user && <Sidebar user={user} />}
          
          {/* Main Content */}
          <main className="flex-1 p-4 md:p-10 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
