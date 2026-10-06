import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
export const metadata: Metadata = { title:"De Vilhena Bistrot | Menu & Contact | Floriana, Malta", description:"Explore the menu and contact De Vilhena Bistrot at Lion Fountain, Floriana, Malta.", openGraph:{title:"De Vilhena Bistrot",description:"A modern Mediterranean bistrot in Floriana, Malta.",type:"website"} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Script src="https://www.googletagmanager.com/gtag/js?id=G-ND8HYSLG94" strategy="afterInteractive"/><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-ND8HYSLG94');`}</Script><CartProvider><Navbar/>{children}<Footer/></CartProvider></body></html>}
