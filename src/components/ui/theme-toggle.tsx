import { Button } from "@/components/ui/button";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = usePortfolioStore();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-none text-blaze-black hover:bg-blaze-orange/10 dark:text-blaze-white dark:hover:bg-blaze-orange/10"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
