import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import CustomButton from './CustomButton';
import FinvizScreenerWindow from './FinvizScreenerWindow';

const CRT_GREEN = 'rgb(140,185,162)';

const ScreenerWindowsManager = () => {
  const { isInverted } = useTheme();
  const [screenerWindows, setScreenerWindows] = useState(() => {
    const saved = localStorage.getItem('burnlist_screener_windows');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        title: 'Breakout Screener', 
        data: [], 
        isMinimized: false, 
        isMaximized: false, 
        isOpen: true,
        finvizUrl: 'http://elite.finviz.com/export.ashx?v=111&f=sh_avgvol_o500,sh_price_o7,sh_relvol_o1.5,ta_changeopen_u,ta_highlow52w_0to5-ahx0to5-bh,ta_pattern_horizontal,ta_perf_13wup,ta_rsi_50to65&&auth=947b2097-7436-4e8d-bcd9-894fcdebb27b'
      },
      { 
        id: 2, 
        title: 'Pullback Screener', 
        data: [], 
        isMinimized: false, 
        isMaximized: false, 
        isOpen: true,
        finvizUrl: 'https://elite.finviz.com/export.ashx?v=111&f=fa_grossmargin_pos,fa_pe_profitable,fa_roe_o5,sh_avgvol_o500,sh_relvol_0.8to1.6,ta_changeopen_d,ta_rsi_35to50,ta_sma200_pa&auth=947b2097-7436-4e8d-bcd9-894fcdebb27b'
      },
      { id: 3, title: 'Screener 3', data: [], isMinimized: false, isMaximized: false, isOpen: true },
      { id: 4, title: 'Screener 4', data: [], isMinimized: false, isMaximized: false, isOpen: true }
    ];
  });

  // Save screener windows to localStorage when they change
  useEffect(() => {
    localStorage.setItem('burnlist_screener_windows', JSON.stringify(screenerWindows));
  }, [screenerWindows]);

  const handleWindowClose = (id) => {
    setScreenerWindows(prev => 
      prev.map(window => 
        window.id === id ? { ...window, isOpen: false } : window
      )
    );
  };

  const handleWindowMinimize = (id) => {
    setScreenerWindows(prev => 
      prev.map(window => 
        window.id === id ? { ...window, isMinimized: !window.isMinimized, isMaximized: false } : window
      )
    );
  };

  const handleWindowMaximize = (id) => {
    setScreenerWindows(prev => 
      prev.map(window => 
        window.id === id ? { ...window, isMaximized: !window.isMaximized, isMinimized: false } : window
      )
    );
  };

  const handleWindowRestore = (id) => {
    setScreenerWindows(prev => 
      prev.map(window => 
        window.id === id ? { ...window, isOpen: true, isMinimized: false, isMaximized: false } : window
      )
    );
  };

  const handleWindowDataUpdate = (id, data) => {
    setScreenerWindows(prev => 
      prev.map(window => 
        window.id === id ? { ...window, data } : window
      )
    );
  };

  const openAllWindows = () => {
    setScreenerWindows(prev => 
      prev.map(window => ({ ...window, isOpen: true, isMinimized: false, isMaximized: false }))
    );
  };

  const closeAllWindows = () => {
    setScreenerWindows(prev => 
      prev.map(window => ({ ...window, isOpen: false }))
    );
  };

  const minimizeAllWindows = () => {
    setScreenerWindows(prev => 
      prev.map(window => ({ ...window, isMinimized: true, isMaximized: false }))
    );
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Control Panel */}
      <div style={{
        backgroundColor: isInverted ? 'rgba(140,185,162,0.9)' : 'rgba(0,0,0,0.9)',
        border: `2px solid ${CRT_GREEN}`,
        padding: '12px',
        borderRadius: '4px',
        fontFamily: "'Courier New', monospace",
        fontSize: '12px',
        color: isInverted ? '#000000' : CRT_GREEN,
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <CustomButton
          onClick={openAllWindows}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            minWidth: 'auto'
          }}
        >
          OPEN ALL
        </CustomButton>
        <CustomButton
          onClick={closeAllWindows}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            minWidth: 'auto'
          }}
        >
          CLOSE ALL
        </CustomButton>
        <CustomButton
          onClick={minimizeAllWindows}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            minWidth: 'auto'
          }}
        >
          MIN ALL
        </CustomButton>
      </div>

      {/* Window Status */}
      <div style={{
        backgroundColor: isInverted ? 'rgba(140,185,162,0.9)' : 'rgba(0,0,0,0.9)',
        border: `2px solid ${CRT_GREEN}`,
        padding: '12px',
        borderRadius: '4px',
        fontFamily: "'Courier New', monospace",
        fontSize: '11px',
        color: isInverted ? '#000000' : CRT_GREEN,
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>SCREENER STATUS:</div>
        {screenerWindows.map(window => (
          <div key={window.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px',
            padding: '4px',
            backgroundColor: window.isOpen ? 'rgba(140,185,162,0.1)' : 'rgba(255,0,0,0.1)',
            borderRadius: '2px'
          }}>
            <span>{window.title}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ 
                fontSize: '10px',
                color: window.isOpen ? CRT_GREEN : '#e31507'
              }}>
                {window.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
              {!window.isOpen && (
                <CustomButton
                  onClick={() => handleWindowRestore(window.id)}
                  style={{
                    padding: '2px 4px',
                    fontSize: '8px',
                    minWidth: 'auto'
                  }}
                >
                  RESTORE
                </CustomButton>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Screener Windows */}
      {screenerWindows.map(window => (
        window.isOpen && (
          <FinvizScreenerWindow
            key={window.id}
            title={window.title}
            data={window.data}
            isMinimized={window.isMinimized}
            isMaximized={window.isMaximized}
            onClose={() => handleWindowClose(window.id)}
            onMinimize={() => handleWindowMinimize(window.id)}
            onMaximize={() => handleWindowMaximize(window.id)}
            onDataUpdate={(data) => handleWindowDataUpdate(window.id, data)}
            finvizUrl={window.finvizUrl}
          />
        )
      ))}
    </div>
  );
};

export default ScreenerWindowsManager; 