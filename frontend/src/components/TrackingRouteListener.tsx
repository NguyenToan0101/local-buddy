import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackingService } from '../services/tracking';

const PAGE_VIEW_DEBOUNCE_MS = 500;

const TrackingRouteListener = () => {
  const location = useLocation();
  const lastTrackedPathRef = useRef('');
  const timerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    const pageUrl = `${location.pathname}${location.search}`;
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') return;
    if (pageUrl.startsWith('/admin')) return;
    if (lastTrackedPathRef.current === pageUrl) return;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      if (lastTrackedPathRef.current === pageUrl) return;
      lastTrackedPathRef.current = pageUrl;
      void trackingService.track('PAGE_VIEW', {}, pageUrl);
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
