import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const BASE_DOMAIN = 'personarecruit.ai';

/**
 * Detect a tenant subdomain from the current hostname.
 * Returns the subdomain slug (e.g. "acme") or null if on the main app domain.
 *
 * Recognized patterns:
 *   acme.personarecruit.ai     → "acme"
 *   www.personarecruit.ai      → null  (treated as main site)
 *   personarecruit.ai          → null
 *   localhost / *.web.app      → null  (dev / Firebase default hosting)
 */
export function detectSubdomain(): string | null {
    const hostname = window.location.hostname;

    // Dev environments — never treat as subdomain
    if (hostname === 'localhost' || hostname === '127.0.0.1') return null;
    if (hostname.endsWith('.web.app') || hostname.endsWith('.firebaseapp.com')) return null;

    // Check if hostname is a subdomain of the base domain
    if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
        const sub = hostname.replace(`.${BASE_DOMAIN}`, '');
        // Ignore www and nested subdomains
        if (sub && sub !== 'www' && !sub.includes('.')) return sub;
    }

    return null;
}

/**
 * Resolve a subdomain slug to an organization ID by querying Firestore.
 * Organizations store their subdomain in `settings.branding.domain`.
 */
export async function resolveSubdomainToOrgId(subdomain: string): Promise<string | null> {
    try {
        const orgsRef = collection(db, 'organizations');
        const q = query(orgsRef, where('settings.branding.domain', '==', subdomain));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return snapshot.docs[0].id;
        }
    } catch (err) {
        console.error('[Subdomain] Failed to resolve:', err);
    }
    return null;
}
