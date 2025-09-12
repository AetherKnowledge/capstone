import NotificationProvider from "@/lib/NotificationProvider";
import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import AuthProvider from "../lib/auth/AuthProvider";
import SocketProvider from "../lib/socket/SocketProvider";
import CallPopupProvider from "./components/Chats/Chatbox/CallPopupProvider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Safehub",
  description: "A safe space for your conversations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <div className="flex flex-col min-h-screen">
          <AuthProvider>
            <SocketProvider>
              <CallPopupProvider>
                <NotificationProvider>
                  <main>{children}</main>
                </NotificationProvider>
              </CallPopupProvider>
            </SocketProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
