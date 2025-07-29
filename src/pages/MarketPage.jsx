import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme, useThemeColor } from '../ThemeContext';
import CustomButton from '@components/CustomButton';
import NotificationBanner from '@components/NotificationBanner';
import useNotification from '../hooks/useNotification';
import logo from '../assets/logo.png';
import logoblack from '../assets/logoblack.png';

const CRT_GREEN = 'rgb(140,185,162)';

const MarketPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isInverted, toggleTheme } = useTheme();
  const green = useThemeColor(CRT_GREEN);
  const black = useThemeColor('black');
  const red = useThemeColor('#e31507');
  const { notification, notificationType, setNotification, setNotificationType } = useNotification();

  return (
    <div style={{ 
      fontFamily: 'Courier New', 
      color: green, 
      backgroundColor: black, 
      minHeight: '100vh', 
      padding: '0' 
    }}>
      {/* Main Content */}
      <div style={{ 
        padding: '32px',
        '@media (max-width: 768px)': {
          padding: '16px',
          paddingBottom: '80px', // Account for mobile navigation
        },
        '@media (max-width: 480px)': {
          padding: '12px',
          paddingBottom: '80px', // Account for mobile navigation
        }
      }}>
        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: '12px',
          '@media (max-width: 768px)': {
            flexDirection: 'column',
            alignItems: 'flex-start',
            marginBottom: 16,
          }
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            '@media (max-width: 480px)': {
              gap: 8,
            }
          }}>
            <button
              onClick={toggleTheme}
              style={{
                border: 'none',
                background: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                minHeight: '44px', // Touch-friendly
              }}
              aria-label="Toggle theme"
            >
              <img 
                src={isInverted ? logoblack : logo} 
                alt="Burnlist Logo" 
                style={{ 
                  width: 40, 
                  height: 40, 
                  marginRight: 10, 
                  transition: 'filter 0.3s',
                  '@media (max-width: 480px)': {
                    width: 32,
                    height: 32,
                    marginRight: 8,
                  }
                }} 
              />
            </button>
            <strong style={{ 
              fontSize: '170%', 
              lineHeight: '40px', 
              display: 'inline-block', 
              color: green,
              '@media (max-width: 768px)': {
                fontSize: '140%',
                lineHeight: '32px',
              },
              '@media (max-width: 480px)': {
                fontSize: '120%',
                lineHeight: '28px',
              }
            }}>BURNLIST v1.1</strong>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            '@media (max-width: 768px)': {
              alignSelf: 'flex-end',
            }
          }}>
            <span style={{ color: red, fontWeight: 'bold', fontSize: 12 }}>19</span>
            <span style={{ color: green, fontWeight: 'bold', fontSize: 12 }}>6</span>
            <span style={{ color: green }}>
              ACCOUNT: local
            </span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10px 20px',
          borderBottom: `1px solid ${CRT_GREEN}`,
          background: 'rgba(0,0,0,0.3)',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <CustomButton
            onClick={() => navigate('/universes')}
            style={{
              background: location.pathname === '/universes' || location.pathname.startsWith('/universe/') ? CRT_GREEN : 'transparent',
              color: location.pathname === '/universes' || location.pathname.startsWith('/universe/') ? '#000000' : CRT_GREEN,
              border: `1px solid ${CRT_GREEN}`,
              padding: '9px 18px',
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '80px',
              textAlign: 'center'
            }}
          >
            UNIVERSE
          </CustomButton>
          
          <CustomButton
            onClick={() => navigate('/journal')}
            style={{
              background: location.pathname === '/journal' ? CRT_GREEN : 'transparent',
              color: location.pathname === '/journal' ? '#000000' : CRT_GREEN,
              border: `1px solid ${CRT_GREEN}`,
              padding: '9px 18px',
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '80px',
              textAlign: 'center'
            }}
          >
            JOURNAL
          </CustomButton>
          
          <CustomButton
            onClick={() => navigate('/market')}
            style={{
              background: location.pathname === '/market' ? CRT_GREEN : 'transparent',
              color: location.pathname === '/market' ? '#000000' : CRT_GREEN,
              border: `1px solid ${CRT_GREEN}`,
              padding: '9px 18px',
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '80px',
              textAlign: 'center'
            }}
          >
            MARKET
          </CustomButton>
        </div>

        {/* Page Content */}
        <div style={{
          textAlign: 'center',
          marginTop: '50px',
          color: green
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>
            MARKET DATA
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '30px' }}>
            Market analysis and data will be displayed here.
          </p>
        </div>

        {/* Centralized Notification Banner */}
        {notification && (
          <div style={{ 
            position: 'fixed', 
            top: 24, 
            left: 0, 
            right: 0, 
            zIndex: 10001, 
            display: 'flex', 
            justifyContent: 'center', 
            pointerEvents: 'none',
            '@media (max-width: 768px)': {
              top: 16,
            }
          }}>
            <div style={{ 
              minWidth: 320, 
              maxWidth: 480, 
              pointerEvents: 'auto',
              '@media (max-width: 768px)': {
                minWidth: 280,
                maxWidth: 'calc(100vw - 32px)',
              }
            }}>
              <NotificationBanner
                message={notification}
                type={notificationType}
                onClose={() => setNotification('')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPage;