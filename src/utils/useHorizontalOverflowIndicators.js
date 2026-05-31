import { useEffect, useState } from 'react';

const SCROLL_THRESHOLD = 2;

const useHorizontalOverflowIndicators = (getScroller, deps = []) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const scroller = getScroller?.();
    if (!scroller) return;

    const updateOverflowState = () => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      setCanScrollLeft(scroller.scrollLeft > SCROLL_THRESHOLD);
      setCanScrollRight(scroller.scrollLeft < maxScrollLeft - SCROLL_THRESHOLD);
    };

    updateOverflowState();

    scroller.addEventListener('scroll', updateOverflowState, { passive: true });
    window.addEventListener('resize', updateOverflowState);

    return () => {
      scroller.removeEventListener('scroll', updateOverflowState);
      window.removeEventListener('resize', updateOverflowState);
    };
  }, [getScroller, ...deps]);

  return { canScrollLeft, canScrollRight };
};

export default useHorizontalOverflowIndicators;
