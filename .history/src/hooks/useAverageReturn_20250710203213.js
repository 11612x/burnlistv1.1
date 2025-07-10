import { useMemo, useRef, useEffect } from 'react';
import { getReturnInTimeframe } from '@logic/portfolioUtils';

// Hook to calculate the average return (%) across a list of normalized ticker items
export function useAverageReturn(items, timeframe = 'MAX') {
  const hasMounted = useRef(false);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  return useMemo(() => {
    console.log('🔍 useAverageReturn called with items:', items);
    items.forEach((item, index) => {
      const hasHist = Array.isArray(item.historicalData) && item.historicalData.length > 0;
      const hasPrice = !isNaN(Number(item.buyPrice));
      if (!hasHist || !hasPrice) {
        console.warn(`⚠️ Item ${index} is malformed:`, {
          symbol: item.symbol,
          buyPrice: item.buyPrice,
          historicalData: item.historicalData,
        });
      }
    });
    console.log(`⏱ Selected timeframe: ${timeframe}`);

    if (!Array.isArray(items) || items.length === 0) {
      if (hasMounted.current) {
        console.warn('⚠️ useAverageReturn received invalid or empty items');
      }
      return 0;
    }

    const hasMissingBuyDates = items.some(item => !item.buyDate);
    if (hasMissingBuyDates) {
      console.warn('⚠️ Some items are missing buyDate. This may cause invalid return calculations.');
    }

    const validItems = items.filter((item, index) => {
      const hasHist = Array.isArray(item.historicalData) && item.historicalData.length > 0;
      const hasPrice = !isNaN(Number(item.buyPrice));
      if (!hasHist || !hasPrice) {
        console.warn(`⚠️ Skipping invalid item ${index}:`, {
          symbol: item.symbol,
          buyPrice: item.buyPrice,
          historicalData: item.historicalData,
        });
        return false;
      }
      return true;
    });

    const historicalSnapshots = validItems.map(item => item.historicalData);
    console.log(`📊 Proceeding with ${validItems.length} valid items (filtered ${items.length - validItems.length})`);

    const avgReturn = getReturnInTimeframe(historicalSnapshots, timeframe);
    console.log(`✅ Return from getReturnInTimeframe for ${historicalSnapshots.length} items: ${avgReturn.toFixed(2)}%`);
    return avgReturn;
  }, [items, timeframe]);
}