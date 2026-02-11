
import React, { useEffect, useState } from 'react';
import { store } from '../services/store';

export const DynamicBranding = () => {
    const [branding, setBranding] = useState(store.getState().branding);

    useEffect(() => {
        const updateStyles = () => {
            const current = store.getState().branding;
            setBranding(current);

            // Inject CSS variables
            const root = document.documentElement;
            root.style.setProperty('--brand-600', current.brandColor);

            // Generate lighter/darker shades if needed (optional)
            // For now, let's just do the primary color

            // Update Font
            if (current.fontStyle === 'serif') {
                root.style.setProperty('--font-family', '"Outfit", serif');
            } else if (current.fontStyle === 'mono') {
                root.style.setProperty('--font-family', 'monospace');
            } else {
                root.style.setProperty('--font-family', '"Inter", sans-serif');
            }

            // Update Corner Radius
            if (current.cornerStyle === 'sharp') {
                root.style.setProperty('--radius-lg', '0px');
            } else if (current.cornerStyle === 'round') {
                root.style.setProperty('--radius-lg', '24px');
            } else {
                root.style.setProperty('--radius-lg', '12px');
            }
        };

        updateStyles();
        return store.subscribe(updateStyles);
    }, []);

    return null; // This component just manages side effects
};
