import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackingService } from '../services/tracking';
import { getPageTrackingMeta } from '../utils/pageTracking';

const PAGE_VIEW_DEBOUNCE_MS = 500;

const TrackingRouteListener = () => {
  const location = useLocation();
  const lastTrackedPathRef = useRef('');
  const timerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    const pageUrl = `${location.pathname}${location.search}`;
    if (pageUrl.startsWith('/admin')) return;
    if (lastTrackedPathRef.current === pageUrl) return;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      if (lastTrackedPathRef.current === pageUrl) return;
      lastTrackedPathRef.current = pageUrl;
      void trackingService.track('PAGE_VIEW', getPageTrackingMeta(location.pathname), pageUrl);
    }, PAGE_VIEW_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [location.pathname, location.search]);

  return null;
};

export default TrackingRouteListener;
