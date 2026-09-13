import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
export const metadata: Metadata = { title:"De Vilhena Bistrot | Menu & Contact | Floriana, Malta", description:"Explore the menu and contact De Vilhena Bistrot at Lion Fountain, Floriana, Malta.", openGraph:{title:"De Vilhena Bistrot",description:"A modern Mediterranean bistrot in Floriana, Malta.",type:"website"} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><CartProvider><Navbar/>{children}<Footer/></CartProvider></body></html>}
