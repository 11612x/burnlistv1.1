import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { formatDateEuropean } from '../utils/dateUtils';

const CRT_GREEN = 'rgb(140,185,162)';

const WatchlistBlock = ({ watchlist, averageReturn, etfPriceData }) => {
  const { isInverted } = useTheme();
  
  const realStockCount = Array.isArray(watchlist?.items)
    ? watchlist.items.filter(item => item.type === 'real' && !item.isMock).length
    : 0;

  const totalStocks = Array.isArray(watchlist?.items) ? watchlist.items.length : 0;

  return (
    <Link 
      to={`/watchlist/${watchlist.slug}`}
      style={{ 
        textDecoration: 'none',
        color: 'inherit'
      }}
    >
      <div style={{
        backgroundColor: isInverted ? 'rgba(140,185,162,0.1)' : '#0a0a0a',
        border: `2px solid ${CRT_GREEN}`,
        borderRadius: '4px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: "'Courier New', monospace",
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = isInverted ? 'rgba(140,185,162,0.2)' : '#181818';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 12px rgba(140,185,162,0.3)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = isInverted ? 'rgba(140,185,162,0.1)' : '#0a0a0a';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px'
        }}>
          <div>
            <h3 style={{
              color: CRT_GREEN,
              margin: 0,
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              {watchlist.name}
            </h3>
            <p style={{
              color: '#888',
              margin: 0,
              fontSize: '12px'
            }}>
              Created: {formatDateEuropean(new Date(watchlist.createdAt))}
            </p>
          </div>
          <div style={{
            textAlign: 'right',
            fontSize: '12px',
            color: '#888'
          }}>
            <div>{realStockCount} real stocks</div>
            <div>{totalStocks} total</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
          gap: '8px',
          marginBottom: '12px'
        }}>
          {etfPriceData && etfPriceData.averagePrice > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>ETF Price</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: CRT_GREEN }}>
                ${etfPriceData.averagePrice.toFixed(2)}
              </div>
            </div>
          )}
          
          {Number.isFinite(averageReturn) && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Return</div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: averageReturn >= 0 ? CRT_GREEN : '#e31507'
              }}>
                {averageReturn.toFixed(2)}%
              </div>
            </div>
          )}

          {etfPriceData && etfPriceData.totalGainLoss !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>P&L</div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold',
                color: etfPriceData.totalGainLoss >= 0 ? CRT_GREEN : '#e31507'
              }}>
                ${etfPriceData.totalGainLoss.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#888'
        }}>
          <span>{watchlist.reason || 'No description'}</span>
          <span style={{ color: CRT_GREEN }}>→ VIEW</span>
        </div>
      </div>
    </Link>
  );
};

export default WatchlistBlock; 