import React from 'react';
import { useThemeColor } from '../ThemeContext';
import backButton from '../assets/backbutton.png';
import { useTheme } from '../ThemeContext';

const CustomButton = ({ onClick, type = 'button', style = {}, disabled = false, ...props }) => {
  const { isInverted } = useTheme();
  const bg = useThemeColor(disabled ? '#444' : '#000');
  const border = useThemeColor('#8CB9A2');
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg,
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
      <img src={backButton} alt="icon" style={{ width: 18, height: 18, filter: isInverted ? 'invert(1)' : 'none', verticalAlign: 'middle', display: 'inline-block' }} />
    </button>
  );
};

export default CustomButton; 