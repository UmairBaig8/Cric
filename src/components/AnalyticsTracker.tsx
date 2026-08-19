import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { joinPresence, trackPageView } from '@/lib/analytics';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => joinPresence(), []);

  return null;
}
