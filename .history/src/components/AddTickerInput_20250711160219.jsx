import React, { useState, useEffect, useRef } from "react";
import { createTicker } from '@data/createTicker';
import { isValidTicker, normalizeSymbol } from '@data/tickerUtils';
import NotificationBanner from '@components/NotificationBanner';
import CustomButton from '@components/CustomButton';

const CRT_GREEN = 'rgb(140,185,162)';

const AddTickerInput = ({ bulkSymbols, setBulkSymbols, handleBulkAdd, buyDate, setBuyDate, buyPrice, setBuyPrice, setWatchlists, editMode, watchlists }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [touched, setTouched] = useState(false);
  const debounceRef = useRef();

  const validateInputs = () => {
    if (!bulkSymbols.trim()) {
      setValidationError(''); // Do not show any message for empty input
      return false;
    }
    // Accept comma, space, or both as delimiters
    const symbols = bulkSymbols
      .split(/[,	\s]+/)
      .map(sym => sym.trim().toUpperCase())
      .filter(Boolean);
    if (symbols.length === 0) {
      setValidationError('Please enter valid ticker symbols.');
      return false;
    }
    const invalidSymbols = symbols.filter(sym => !isValidTicker(sym));
    if (invalidSymbols.length > 0) {
      setValidationError(`Invalid symbols: ${invalidSymbols.join(', ')}`);
      return false;
    }
    if (editMode) {
      if (buyPrice !== null && (isNaN(buyPrice) || buyPrice <= 0)) {
        setValidationError('Buy price must be a positive number.');
        return false;
      }
      if (buyDate && isNaN(Date.parse(buyDate))) {
        setValidationError('Please enter a valid buy date.');
        return false;
      }
    }
    setValidationError('');
    return true;
  };

  // Debounce validation on bulkSymbols change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      validateInputs();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkSymbols, buyPrice, buyDate, editMode, touched]);

  const handleAddTickers = async () => {
    setTouched(true);
    if (!validateInputs()) return;

    setIsLoading(true);
    setError('');

    try {
      console.log("📦 Adding Tickers:", bulkSymbols);
      console.log("📅 With Buy Date:", buyDate);
      console.log("💵 With Buy Price:", buyPrice);

      // Accept comma, space, or both as delimiters
      const rawSymbols = bulkSymbols.split(/[,\s]+/).map((sym) => sym.trim().toUpperCase()).filter(Boolean);
      const validSymbols = rawSymbols.filter(isValidTicker);

      const slugMatch = window.location.pathname.split("/").pop();
      const existingItems = watchlists && Object.values(watchlists).find(w => w.slug === slugMatch)?.items || [];
      const existingSymbols = new Set(existingItems.map(i => i.symbol));

      const newItems = [];
      for (const rawSymbol of validSymbols) {
        const symbol = normalizeSymbol(rawSymbol);
        if (existingSymbols.has(symbol)) {
          console.warn(`⚠️ Skipping duplicate symbol: ${symbol}`);
          continue;
        }
        
        // Use buyPrice and buyDate only in editMode, otherwise let API assign defaults
        const price = editMode && typeof buyPrice === 'number' && !isNaN(buyPrice) ? buyPrice : undefined;
        const fallbackFromApi = !editMode && !price;
        const date = editMode && buyDate ? buyDate : undefined;

        const item = await createTicker(
          symbol,
          symbol.startsWith("#") ? "mock" : "real",
          price,
          date
        );
        
        if (!item) {
          console.warn(`❌ createTicker returned null for symbol: ${symbol}`);
          continue;
        }
        
        if (fallbackFromApi && item?.historicalData?.[0]?.price) {
          item.buyPrice = Number(item.historicalData[0].price);
        }
        
        // Skip tickers with invalid buyPrice
        if (typeof item.buyPrice !== 'number' || item.buyPrice === 0) {
          console.warn(`❌ Skipping ${symbol}: buyPrice is still 0 after fetch.`);
          continue;
        }
        
        if (item) {
          console.log("🔍 Created item buyPrice check:", item.symbol, item.buyPrice);
          newItems.push(item);
        } else {
          console.warn("❌ Failed to create ticker:", symbol);
        }
      }

      if (newItems.length === 0) {
        setError('No valid tickers were created. Please check your input');
        return;
        
      }

      if (typeof setWatchlists === 'function') {
        const updatedObject = { ...watchlists };
        for (const id in updatedObject) {
          if (updatedObject[id].slug === slugMatch) {
            updatedObject[id] = {
              ...updatedObject[id],
              items: [...(updatedObject[id].items || []), ...newItems.map(i => ({
                ...i,
                buyPrice: typeof i.buyPrice === 'number' ? i.buyPrice : 0
              }))]
            };
            console.log("🔍 Pre-setWatchlists buyPrices:", updatedObject[id].items.map(i => ({ symbol: i.symbol, buyPrice: i.buyPrice })));
          }
        }

        try {
          localStorage.setItem("burnlist_watchlists", JSON.stringify(updatedObject));
        } catch (e) {
          console.error("❌ Failed to save to localStorage:", e);
          setError('Failed to save to storage. Please try again.');
          return;
        }

        if (!updatedObject || typeof updatedObject !== "object") {
          console.error("❌ updatedObject is invalid before calling setWatchlists");
          setError('Failed to update watchlists. Please try again.');
          return;
        } else {
          console.log("✅ Final watchlist structure before setWatchlists:", updatedObject);
          setWatchlists(updatedObject);
        }
      }

      for (const item of newItems) {
        if (!item.buyDate || isNaN(new Date(item.buyDate))) {
          console.error("❌ Invalid buyDate in item:", item);
        }
      }

      // Ensure the newItems are reflected in UI by calling optional handler
      if (typeof handleBulkAdd === "function") {
        console.log("🧪 Calling handleBulkAdd with:", newItems);
        handleBulkAdd(newItems);
      } else {
        console.warn("⚠️ handleBulkAdd is not a function");
      }

      // Clear inputs on success
      setBulkSymbols('');
      setBuyPrice(null);
      setBuyDate(null);

    } catch (error) {
      console.error('❌ Error adding tickers:', error);
      setError('Failed to add tickers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      {/* Error and validation notifications */}
      {(error || validationError) && (
        <div style={{ width: '100%', display: 'block' }}>
          <NotificationBanner
            message={error || validationError}
            type="error"
            onClose={() => {
              setError('');
              setValidationError('');
            }}
          />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", width: '100%' }}>
        <textarea
          value={bulkSymbols}
          onChange={(e) => setBulkSymbols(e.target.value)}
          placeholder="e.g. SPY, QQQ"
          rows={1}
          style={{
            flex: 1,
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "1rem",
            backgroundColor: "#000000",
            border: `1px solid ${CRT_GREEN}`,
            color: CRT_GREEN,
            padding: 8,
            resize: "none",
            boxSizing: "border-box",
            cursor: "pointer",
            minWidth: 0,
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAddTickers();
            }
          }}
          onBlur={() => setTouched(true)}
        />
        {editMode && (
          <input
            type="number"
            placeholder="Buy Price"
            step="0.01"
            value={buyPrice || ''}
            onChange={(e) => {
              const price = parseFloat(e.target.value);
              setBuyPrice(price);
            }}
            style={{
              marginLeft: 8,
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "1rem",
              backgroundColor: "#000000",
              border: `1px solid ${CRT_GREEN}`,
              color: CRT_GREEN,
              padding: 8,
              cursor: "pointer",
              minWidth: 0,
            }}
          />
        )}
        {editMode && (
          <input
            type="date"
            value={buyDate || ''}
            onChange={(e) => {
              const selectedDate = e.target.value;
              setBuyDate(selectedDate);
            }}
            style={{
              marginLeft: 8,
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "1rem",
              backgroundColor: "#000000",
              border: `1px solid ${CRT_GREEN}`,
              color: CRT_GREEN,
              padding: 8,
              cursor: "pointer",
              minWidth: 0,
            }}
          />
        )}
        <CustomButton
          onClick={handleAddTickers}
          disabled={isLoading}
          title="Add ticker(s)"
          style={{
            marginLeft: 8,
            backgroundColor: isLoading ? "#666666" : CRT_GREEN,
            color: "black",
            opacity: isLoading ? 0.6 : 1,
            minWidth: 0,
          }}
        >
          {isLoading ? "..." : "+++"}
        </CustomButton>
      </div>
    </div>
  );
};

export default AddTickerInput;
