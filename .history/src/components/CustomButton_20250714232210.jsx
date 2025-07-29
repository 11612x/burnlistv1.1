import React from 'react';
import { useThemeColor } from '../ThemeContext';

const CustomButton = ({ children, onClick, type = 'button', style = {}, disabled = false, ...props }) => {
  const bg = useThemeColor(disabled ? '#444' : '#000');
  const fg = useThemeColor('#8CB9A2');
  const border = useThemeColor('#8CB9A2');
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
        padding: '6px 16px',
        fontFamily: 'Courier New',
        fontSize: 15,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        borderRadius: 2,
        margin: 2,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default CustomButton; 