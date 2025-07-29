import React from 'react';
import { useThemeColor } from '../ThemeContext';

const CRT_GREEN = 'rgb(140,185,162)';

const MobileFormWrapper = ({ children, style = {} }) => {
  const green = useThemeColor(CRT_GREEN);
  const black = useThemeColor('black');

  return (
    <div style={{
      width: '100%',
      background: black,
      border: `1px solid ${green}`,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      '@media (max-width: 768px)': {
        padding: '12px',
        gap: '12px',
      },
      '@media (max-width: 480px)': {
        padding: '8px',
        gap: '8px',
      },
      ...style
    }}>
      {children}
    </div>
  );
};

export default MobileFormWrapper; 