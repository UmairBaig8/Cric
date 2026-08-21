import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { joinPresence, startSessionHeartbeat, trackPageView } from '@/lib/analytics';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const stopPresence = joinPresence();
    const stopHeartbeat = startSessionHeartbeat();
    return () => {
      stopPresence();
      stopHeartbeat();
    };
  }, []);

  return null;
}
