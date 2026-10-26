import { Moon, Sun } from "lucide-react";
import { useContext } from "react";
import ThemeContext from "../context/theme-context.js";

function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const label = `Switch to ${isDark ? "light" : "dark"} theme`;

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  );
}

export default ThemeToggle;
