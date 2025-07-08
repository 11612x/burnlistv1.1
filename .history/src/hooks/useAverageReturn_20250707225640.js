

import { useMemo, useRef, useEffect } from 'react';
import { getAverageReturn } from '@logic/portfolioUtils';

// Hook to calculate the average return (%) across a list of normalized ticker items
export function useAverageReturn(items, timeframe = 'MAX') {
  const hasMounted = useRef(false);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  return useMemo(() => {
    console.log('🔍 useAverageReturn called with items:', items);

    if (!Array.isArray(items) || items.length === 0) {
      if (hasMounted.current) {
        console.warn('⚠️ useAverageReturn received invalid or empty items');
      }
      return 0;
    }

    const avg = getAverageReturn(items, timeframe);
    console.log(`✅ Final average return across ${items.length} items: ${avg.toFixed(2)}%`);
    return avg;
  }, [items, timeframe]);
}