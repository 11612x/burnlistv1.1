import React from 'react';

const CustomButton = ({ children, onClick, type = 'button', style = {}, disabled = false, ...props }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? '#444' : '#000',
      color: '#8CB9A2',
      border: '1px solid #8CB9A2',
      padding: '6px 16px',
      fontFamily: 'Courier New',
      fontSize: 16,
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

export default React.memo(CustomButton); 