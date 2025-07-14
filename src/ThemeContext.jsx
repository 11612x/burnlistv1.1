import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

const CRT_GREEN = 'rgb(140,185,162)';
const CRT_GREEN_HEX = '#8CB9A2';
const RED = '#e31507';
const BLACK = '#000';
const BLACK2 = '#000000';

function mapColor(color, isInverted) {
  if (!isInverted) return color;
  // Normalize color string
  const c = color.trim().toLowerCase();
  // All black to CRT green
  if (c === BLACK || c === BLACK2 || c === 'black' || c.startsWith('rgb(0,0,0)')) return CRT_GREEN;
  // All CRT green to black
  if (c === CRT_GREEN || c === CRT_GREEN_HEX || c.startsWith('rgb(140,185,162)')) return BLACK;
  // All red stays red
  if (c === RED) return RED;
  // All other accents (gray, orange, white, etc.) go black
  return BLACK;
}

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

export function useThemeColor(color) {
  const { isInverted } = useTheme();
  return mapColor(color, isInverted);
} 