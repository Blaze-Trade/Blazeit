import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { WalletConnector } from "@/components/wallet/WalletConnector";
import { ProfileDropdown } from "@/components/wallet/ProfileDropdown";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Flame, BarChart2, Trophy } from "lucide-react";
import { useEffect } from "react";

const navItems = [
  { href: "/", label: "Trade", icon: Flame },
  { href: "/quests", label: "Quest", icon: Trophy },
  { href: "/analysis", label: "Analysis", icon: BarChart2 },
];

export function MainLayout() {
  const navigate = useNavigate();
  const { isConnected, theme, setTheme } = usePortfolioStore();

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Persist scroll position on route changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };

    const handleLoad = () => {
      const savedScrollPosition = sessionStorage.getItem('scrollPosition');
      if (savedScrollPosition) {
        window.scrollTo(0, parseInt(savedScrollPosition, 10));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, []);


  return (
    <div className={cn(
      "min-h-screen flex flex-col font-mono transition-colors duration-200",
      theme === 'dark'
        ? "bg-blaze-black text-blaze-white"
        : "bg-blaze-white text-blaze-black"
    )}>
      <header className={cn(
        "fixed top-0 left-0 right-0 h-20 px-4 md:px-8 flex items-center justify-between z-50 border-b-2 transition-colors duration-200",
        theme === 'dark'
          ? "bg-blaze-black border-blaze-white"
          : "bg-blaze-white border-blaze-black"
      )}>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter">
          BLAZE IT
        </h1>
        <div className="flex items-center gap-4">
          {/* Create Token button - only show on desktop when connected */}
          {isConnected && (
            <Button
              onClick={() => navigate('/create-token')}
              className="hidden md:flex h-12 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black text-lg font-bold uppercase tracking-wider hover:bg-blaze-black hover:text-blaze-white active:translate-y-px active:translate-x-px"
            >
              Create Token
            </Button>
          )}
          {isConnected ? <ProfileDropdown /> : <WalletConnector />}
        </div>
      </header>

      <main className="flex-grow pt-20 pb-24">
        <Outlet />
      </main>

      <footer className={cn(
        "fixed bottom-0 left-0 right-0 h-20 z-50 border-t-2 transition-colors duration-200",
        theme === 'dark'
          ? "bg-blaze-black border-blaze-white"
          : "bg-blaze-white border-blaze-black"
      )}>
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
                      "hover:bg-blaze-orange hover:text-blaze-black",
                      "focus-visible:outline-none focus-visible:bg-blaze-orange focus-visible:text-blaze-black",
                      isActive
                        ? theme === 'dark'
                          ? "bg-blaze-white text-blaze-black"
                          : "bg-blaze-black text-blaze-white"
                        : theme === 'dark'
                          ? "bg-blaze-black text-blaze-white"
                          : "bg-blaze-white text-blaze-black",
                      index > 0 && (theme === 'dark' ? "border-l-2 border-blaze-white" : "border-l-2 border-blaze-black")
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
