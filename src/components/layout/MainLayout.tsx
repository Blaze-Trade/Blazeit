import { NavLink, Outlet } from "react-router-dom";
import { WalletConnector } from "@/components/wallet/WalletConnector";
import { ProfileDropdown } from "@/components/wallet/ProfileDropdown";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { cn } from "@/lib/utils";
import { Flame, BarChart2, Trophy } from "lucide-react";
const navItems = [
  { href: "/", label: "Trade", icon: Flame },
  { href: "/analysis", label: "Analysis", icon: BarChart2 },
  { href: "/quests", label: "Quest", icon: Trophy },
];
export function MainLayout() {
  const isConnected = usePortfolioStore((state) => state.isConnected);
  return (
    <div className="bg-blaze-white text-blaze-black min-h-screen flex flex-col font-mono">
      <header className="fixed top-0 left-0 right-0 h-20 px-4 md:px-8 flex items-center justify-between bg-blaze-white z-50 border-b-2 border-blaze-black">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter">
          BLAZE IT
        </h1>
        {isConnected ? <ProfileDropdown /> : <WalletConnector />}
      </header>
      <main className="flex-grow pt-20 pb-24">
        <Outlet />
      </main>
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-blaze-white z-50 border-t-2 border-blaze-black">
        <nav className="h-full">
          <ul className="h-full grid grid-cols-3">
            {navItems.map((item, index) => (
              <li key={item.href} className="h-full">
                <NavLink
                  to={item.href}
                  end={item.href === "/"}
                  className={({ isActive }) =>
                    cn(
                      "w-full h-full flex flex-col items-center justify-center text-sm uppercase tracking-widest font-bold transition-colors duration-100",
                      "hover:bg-blaze-orange hover:text-blaze-white",
                      "focus-visible:outline-none focus-visible:bg-blaze-orange focus-visible:text-blaze-white",
                      isActive ? "bg-blaze-black text-blaze-white" : "bg-blaze-white text-blaze-black",
                      index > 0 && "border-l-2 border-blaze-black"
                    )
                  }
                >
                  <item.icon className="w-6 h-6 mb-1" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </footer>
    </div>
  );
}