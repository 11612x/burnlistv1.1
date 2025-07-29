import React from 'react';
import { useThemeColor } from '../ThemeContext';

const CRT_GREEN = 'rgb(140,185,162)';

const MobileTableWrapper = ({ children, style = {} }) => {
  const green = useThemeColor(CRT_GREEN);
  const black = useThemeColor('black');

  return (
    <div style={{
      width: '100%',
      border: `1px solid ${green}`,
      background: black,
      position: 'relative',
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
      touchAction: 'pan-x', // Enable horizontal touch scrolling
      '@media (max-width: 768px)': {
        fontSize: '12px',
      },
      '@media (max-width: 480px)': {
        fontSize: '10px',
      },
      ...style
    }}>
      {children}
    </div>
  );
};

export default MobileTableWrapper; 