"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";

const ThemeContext = createContext({ theme: "light", toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // useLayoutEffect runs synchronously before the browser paints —
  // no flash, theme is applied immediately on the client.
  useLayoutEffect(() => {
    const saved = localStorage.getItem("theme") ?? "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
