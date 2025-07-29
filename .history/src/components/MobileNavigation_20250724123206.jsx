import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import CustomButton from './CustomButton';
import { useThemeColor } from '../ThemeContext';

const CRT_GREEN = 'rgb(140,185,162)';

const MobileNavigation = () => {
  const location = useLocation();
  const green = useThemeColor(CRT_GREEN);
  const black = useThemeColor('black');

  const navItems = [
    { path: '/', label: 'HOME', icon: '🏠' },
    { path: '/universes', label: 'UNIVERSE', icon: '🌌' },
    { path: '/trade', label: 'TRADE', icon: '📈' },
    { path: '/journal', label: 'DASHBOARD', icon: '📊' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: black,
      borderTop: `1px solid ${green}`,
      padding: '8px 16px',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      gap: '8px',
      '@media (min-width: 769px)': {
        display: 'none',
      }
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 4px',
              minHeight: '44px',
              justifyContent: 'center',
            }}
          >
            <div style={{
              fontSize: '16px',
              marginBottom: '2px',
              '@media (max-width: 480px)': {
                fontSize: '14px',
              }
            }}>
              {item.icon}
            </div>
            <div style={{
              fontSize: '10px',
              color: isActive ? green : '#666',
              fontWeight: isActive ? 'bold' : 'normal',
              textAlign: 'center',
              '@media (max-width: 480px)': {
                fontSize: '9px',
              }
            }}>
              {item.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default MobileNavigation; 