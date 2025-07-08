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
    console.log(`⏱ Selected timeframe: ${timeframe}`);

    if (!Array.isArray(items) || items.length === 0) {
      if (hasMounted.current) {
        console.warn('⚠️ useAverageReturn received invalid or empty items');
      }
      return 0;
    }

    const avgReturn = getReturnInTimeframe(items, timeframe);
    console.log(`✅ Return from getReturnInTimeframe for ${items.length} items: ${avgReturn.toFixed(2)}%`);
    return avgReturn;
  }, [items, timeframe]);
}