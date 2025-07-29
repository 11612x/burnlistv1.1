import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import CustomButton from './CustomButton';

const CRT_GREEN = 'rgb(140,185,162)';

const FinvizScreenerWindow = ({ title, data, onClose, onMinimize, onMaximize, isMinimized, isMaximized, onDataUpdate, finvizUrl }) => {
  const { isInverted } = useTheme();
  const [localData, setLocalData] = useState(data || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLocalData(data || []);
  }, [data]);

  // Auto-fetch data from Finviz URL if provided
  useEffect(() => {
    if (finvizUrl && !localData.length) {
      fetchFinvizData();
    }
  }, [finvizUrl]);

  const fetchFinvizData = async () => {
    if (!finvizUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(finvizUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
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
    } catch (err) {
      console.error('Error fetching Finviz data:', err);
      setError('Failed to fetch data from Finviz');
    } finally {
      setIsLoading(false);
    }
  };

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
          {isLoading && <span style={{ fontSize: '10px', color: CRT_GREEN }}>LOADING...</span>}
          {error && <span style={{ fontSize: '10px', color: '#e31507' }}>ERROR</span>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {finvizUrl && (
            <CustomButton
              onClick={fetchFinvizData}
              disabled={isLoading}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                minWidth: 'auto',
                backgroundColor: isLoading ? '#666' : CRT_GREEN,
                color: isLoading ? '#999' : 'black'
              }}
            >
              {isLoading ? 'LOADING' : 'REFRESH'}
            </CustomButton>
          )}
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
          {error && (
            <div style={{
              textAlign: 'center',
              color: '#e31507',
              padding: '20px',
              fontSize: '14px',
              border: `1px solid ${CRT_GREEN}`,
              marginBottom: '16px'
            }}>
              ⚠️ {error}
            </div>
          )}
          
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
              {finvizUrl ? 'Click REFRESH to load data from Finviz' : 'Upload a Finviz CSV file to get started'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinvizScreenerWindow; 