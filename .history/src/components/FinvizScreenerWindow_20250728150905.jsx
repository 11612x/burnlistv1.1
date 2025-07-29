import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import CustomButton from './CustomButton';

const CRT_GREEN = 'rgb(140,185,162)';

// Sample data for testing
const SAMPLE_DATA = [
  { Symbol: 'AAPL', Price: '150.25', Change: '+2.5%', Volume: '45.2M', Market_Cap: '2.4T' },
  { Symbol: 'MSFT', Price: '320.10', Change: '+1.8%', Volume: '28.7M', Market_Cap: '2.3T' },
  { Symbol: 'GOOGL', Price: '2750.50', Change: '+3.2%', Volume: '12.1M', Market_Cap: '1.8T' },
  { Symbol: 'TSLA', Price: '850.75', Change: '+5.1%', Volume: '89.3M', Market_Cap: '850B' },
  { Symbol: 'AMZN', Price: '3200.00', Change: '+1.2%', Volume: '15.6M', Market_Cap: '1.6T' }
];

const FinvizScreenerWindow = ({ title, data, onClose, onMinimize, onMaximize, isMinimized, isMaximized, onDataUpdate }) => {
  const { isInverted } = useTheme();
  const [localData, setLocalData] = useState(data && data.length > 0 ? data : SAMPLE_DATA);

  useEffect(() => {
    setLocalData(data && data.length > 0 ? data : SAMPLE_DATA);
  }, [data]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        setLocalData(rows);
        if (onDataUpdate) {
          onDataUpdate(rows);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: isMaximized ? 0 : `${10 + (title.charCodeAt(title.length - 1) % 4) * 20}%`,
      left: isMaximized ? 0 : `${5 + (title.charCodeAt(title.length - 1) % 4) * 15}%`,
      width: isMaximized ? '100vw' : '45vw',
      height: isMaximized ? '100vh' : isMinimized ? '50px' : '60vh',
      backgroundColor: isInverted ? 'rgb(140,185,162)' : '#0a0a0a',
      color: isInverted ? '#000000' : CRT_GREEN,
      border: `2px solid ${CRT_GREEN}`,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Courier New', monospace",
      transition: 'all 0.3s ease',
      boxShadow: `0 4px 20px rgba(140,185,162,0.3)`,
      '@media (max-width: 768px)': {
        width: isMaximized ? '100vw' : '90vw',
        left: isMaximized ? 0 : '5%'
      }
    }}>
      {/* Window Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: `1px solid ${CRT_GREEN}`,
        backgroundColor: '#111',
        cursor: 'move'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{title}</span>
          <span style={{ fontSize: '12px', color: '#888' }}>({localData.length} stocks)</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id={`file-upload-${title}`}
          />
          <label htmlFor={`file-upload-${title}`}>
            <CustomButton
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                minWidth: 'auto'
              }}
            >
              UPLOAD CSV
            </CustomButton>
          </label>
          <CustomButton
            onClick={onMinimize}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              minWidth: 'auto'
            }}
          >
            {isMinimized ? 'RESTORE' : 'MIN'}
          </CustomButton>
          <CustomButton
            onClick={onMaximize}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              minWidth: 'auto'
            }}
          >
            {isMaximized ? 'RESTORE' : 'MAX'}
          </CustomButton>
          <CustomButton
            onClick={onClose}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              minWidth: 'auto',
              backgroundColor: '#e31507',
              color: 'white'
            }}
          >
            X
          </CustomButton>
        </div>
      </div>

      {/* Window Content */}
      {!isMinimized && (
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px'
        }}>
          {localData.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                color: CRT_GREEN,
                background: 'black',
                fontFamily: 'Courier New',
                border: `1px solid ${CRT_GREEN}`,
                fontSize: '12px'
              }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'black' }}>
                  <tr style={{ borderBottom: `1px solid ${CRT_GREEN}` }}>
                    {Object.keys(localData[0] || {}).map((header, index) => (
                      <th key={index} style={{
                        padding: '8px',
                        textAlign: 'left',
                        borderBottom: `1px solid ${CRT_GREEN}`,
                        background: 'black',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localData.map((row, rowIndex) => (
                    <tr key={rowIndex} style={{
                      borderBottom: `1px solid ${CRT_GREEN}`,
                      background: (rowIndex % 2 === 0 ? '#0a0a0a' : '#181818'),
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#232323'}
                    onMouseLeave={e => e.currentTarget.style.background = (rowIndex % 2 === 0 ? '#0a0a0a' : '#181818')}
                    >
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex} style={{
                          padding: '6px 8px',
                          textAlign: 'left',
                          fontSize: '11px',
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#888',
              padding: '40px',
              fontSize: '14px'
            }}>
              ⚠️ No data loaded. Upload a Finviz CSV file to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinvizScreenerWindow; 