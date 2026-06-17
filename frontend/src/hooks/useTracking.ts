import { useCallback } from 'react';
import { trackingService, type TrackingEventType } from '../services/tracking';

export function useTracking() {
  const track = useCallback((eventType: TrackingEventType, metadata: Record<string, unknown> = {}) => {
    void trackingService.track(eventType, metadata);
  }, []);

  return { track };
}
