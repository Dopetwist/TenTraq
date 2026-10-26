import { useEffect, useState } from "react";
import ThemeContext from "./theme-context.js";
const THEME_STORAGE_KEY = "tentraq-theme";

function getInitialTheme() {
  const theme = localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  return theme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
