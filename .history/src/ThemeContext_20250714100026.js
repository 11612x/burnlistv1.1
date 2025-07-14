import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isInverted, setIsInverted] = useState(false);
  const toggleTheme = () => setIsInverted((prev) => !prev);
  return (
    <ThemeContext.Provider value={{ isInverted, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 