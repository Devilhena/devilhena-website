import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export function OrderButton({dark=false}:{dark?:boolean}){return <Link href="/contact" className={`focus-ring inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold tracking-[.16em] transition hover:-translate-y-0.5 ${dark?"bg-cream text-forest hover:bg-beige":"bg-forest text-cream hover:bg-earth"}`}>ORDER NOW <ArrowUpRight size={15}/></Link>}
