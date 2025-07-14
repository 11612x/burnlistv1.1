import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

const CRT_GREEN = 'rgb(140,185,162)';
const CRT_GREEN_HEX = '#8CB9A2';
const RED = '#e31507';
const WHITE = '#fff';
const WHITE2 = '#ffffff';
const BLACK = '#000';
const BLACK2 = '#000000';

function mapColor(color, isInverted) {
  if (!isInverted) return color;
  // Normalize color string
  const c = color.trim().toLowerCase();
  if (c === BLACK || c === BLACK2) return CRT_GREEN;
  if (c === CRT_GREEN || c === CRT_GREEN_HEX) return BLACK;
  if (c === RED) return BLACK;
  if (c === WHITE || c === WHITE2) return BLACK;
  // If color is close to CRT_GREEN (rgb)
  if (c.startsWith('rgb(140,185,162)')) return BLACK;
  // If color is close to black (rgb)
  if (c.startsWith('rgb(0,0,0)')) return CRT_GREEN;
  return color;
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