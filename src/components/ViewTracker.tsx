"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  dealId: string;
}

export function ViewTracker({ dealId }: ViewTrackerProps) {
  useEffect(() => {
    // Track view on mount (client-side only)
    const trackView = async () => {
      try {
        // Use sessionStorage to prevent duplicate views in same session
        const viewedKey = `viewed_${dealId}`;
        if (sessionStorage.getItem(viewedKey)) {
          return; // Already viewed in this session
        }

        const response = await fetch(`/api/deals/${dealId}/view`, {
          method: 'POST',
        });

        if (response.ok) {
          sessionStorage.setItem(viewedKey, '1');
        }
      } catch (error) {
        // Silently fail - view tracking is not critical
        console.debug('View tracking failed:', error);
      }
    };

    trackView();
  }, [dealId]);

  // This component renders nothing
  return null;
}
