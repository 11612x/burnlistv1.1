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
    <>
      <style>
        {`
          .mobile-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: ${black};
            border-top: 1px solid ${green};
            padding: 8px 16px;
            z-index: 1000;
            display: flex;
            justify-content: space-around;
            align-items: center;
            gap: 8px;
          }
          
          @media (min-width: 769px) {
            .mobile-nav {
              display: none !important;
            }
          }
          
          .mobile-nav-item {
            text-decoration: none;
            color: inherit;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px 4px;
            min-height: 44px;
            justify-content: center;
          }
          
          .mobile-nav-icon {
            font-size: 16px;
            margin-bottom: 2px;
          }
          
          .mobile-nav-label {
            font-size: 10px;
            text-align: center;
          }
          
          @media (max-width: 480px) {
            .mobile-nav-icon {
              font-size: 14px;
            }
            .mobile-nav-label {
              font-size: 9px;
            }
          }
        `}
      </style>
      <div className="mobile-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="mobile-nav-item"
            >
              <div className="mobile-nav-icon">
                {item.icon}
              </div>
              <div 
                className="mobile-nav-label"
                style={{
                  color: isActive ? green : '#666',
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default MobileNavigation; 