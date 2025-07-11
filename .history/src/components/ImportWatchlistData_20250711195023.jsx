import React, { useState } from 'react';
import { importWatchlistData } from '@data/tickerUtils';
import NotificationBanner from '@components/NotificationBanner';
import CustomButton from '@components/CustomButton';

const CRT_GREEN = 'rgb(140,185,162)';

const ImportWatchlistData = ({ watchlists, setWatchlists, currentSlug, setNotification, setNotificationType }) => {
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);

  const handleImport = async () => {
    if (!importData.trim()) {
      if (setNotification && setNotificationType) {
        setNotification('Please enter data to import.');
        setNotificationType('error');
      }
      return;
    }

    setIsImporting(true);
    
    try {
      const result = importWatchlistData(importData, currentSlug, watchlists, setWatchlists);
      
      if (result.success) {
        if (setNotification && setNotificationType) {
          setNotification(result.message);
          setNotificationType('success');
        }
        setImportData('');
        setShowImportForm(false);
      } else {
        if (setNotification && setNotificationType) {
          setNotification(result.message);
          setNotificationType('error');
        }
      }
    } catch (error) {
      console.error('❌ Import error:', error);
      if (setNotification && setNotificationType) {
        setNotification('An error occurred during import.');
        setNotificationType('error');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handlePasteExample = () => {
    const exampleData = `ACMR	29.19	28.63	-1.92%	
ANET	106.29	108.42	2.00%	
ANSS	374.52	377.08	0.68%	
APH	98.31	98.74	0.44%	
AROC	23.31	23.45	0.58%	
ATEN	18.93	18.57	-1.90%	
BGC	10.43	10.38	-0.43%	
CIVI	31.82	32.24	1.32%	
CRGY	9.29	9.29	-0.05%	
DV	15.40	14.66	-4.81%	
FOUR	103.64	101.33	-2.23%	
GNK	14.71	15.01	2.04%	
JEF	55.69	54.59	-1.98%	
MS	143.09	141.57	-1.06%	
MSFT	501.48	504.43	0.59%	
ONTO	102.87	102.38	-0.48%	
PAGS	9.05	8.85	-2.27%	
PBA	36.83	36.99	0.43%	
QCOM	159.09	157.90	-0.75%	
RYCEY	13.48	13.48	0.00%	
SF	109.60	108.04	-1.42%	
TSM	229.76	231.51	0.76%	
UBER	96.40	96.52	0.12%	
YOU	29.09	28.65	-1.51%`;
    
    setImportData(exampleData);
  };

  if (!showImportForm) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <CustomButton
          onClick={() => setShowImportForm(true)}
          style={{
            backgroundColor: CRT_GREEN,
            color: 'black',
            border: 'none',
            padding: '8px 16px',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            fontSize: '14px'
          }}
        >
          📥 Import Watchlist Data
        </CustomButton>
      </div>
    );
  }

  return (
    <div style={{ 
      border: `1px solid ${CRT_GREEN}`, 
      padding: '20px', 
      marginTop: '20px',
      backgroundColor: 'black'
    }}>
      <h3 style={{ 
        color: CRT_GREEN, 
        fontFamily: "'Courier New', monospace",
        marginBottom: '15px',
        textAlign: 'center'
      }}>
        📥 Import Watchlist Data
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <p style={{ 
          color: CRT_GREEN, 
          fontSize: '12px', 
          fontFamily: "'Courier New', monospace",
          marginBottom: '10px'
        }}>
          Format: SYMBOL BUY_PRICE CURRENT_PRICE PERCENTAGE_CHANGE%
        </p>
        <p style={{ 
          color: '#888', 
          fontSize: '11px', 
          fontFamily: "'Courier New', monospace",
          marginBottom: '15px'
        }}>
          Example: ACMR 29.19 28.63 -1.92%
        </p>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <textarea
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          placeholder="Paste your watchlist data here..."
          style={{
            width: '100%',
            height: '200px',
            backgroundColor: 'black',
            color: CRT_GREEN,
            border: `1px solid ${CRT_GREEN}`,
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            padding: '10px',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <CustomButton
          onClick={handlePasteExample}
          disabled={isImporting}
          style={{
            backgroundColor: '#333',
            color: CRT_GREEN,
            border: `1px solid ${CRT_GREEN}`,
            padding: '6px 12px',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px'
          }}
        >
          📋 Paste Example
        </CustomButton>
        
        <CustomButton
          onClick={handleImport}
          disabled={isImporting || !importData.trim()}
          style={{
            backgroundColor: CRT_GREEN,
            color: 'black',
            border: 'none',
            padding: '6px 12px',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px'
          }}
        >
          {isImporting ? '⏳ Importing...' : '✅ Import'}
        </CustomButton>
        
        <CustomButton
          onClick={() => {
            setShowImportForm(false);
            setImportData('');
          }}
          disabled={isImporting}
          style={{
            backgroundColor: '#e31507',
            color: 'black',
            border: 'none',
            padding: '6px 12px',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px'
          }}
        >
          ❌ Cancel
        </CustomButton>
      </div>
    </div>
  );
};

export default ImportWatchlistData; 