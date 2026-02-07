/**
 * useSEO Hook
 * 
 * Dynamically updates document meta tags based on current tenant context.
 * Should be called once at app root level (App.tsx) after tenant bootstrap.
 * 
 * Updates:
 * - document.title
 * - meta description
 * - Open Graph tags
 * - Twitter Card tags
 * - PWA application name
 */

import { useEffect } from 'react';
import { useTenantStore } from '@/store/useTenantStore';

interface SEOConfig {
    /** Page-specific title suffix (optional) */
    pageTitle?: string;
    /** Custom description override */
    description?: string;
    /** OG image URL override */
    image?: string;
}

/**
 * Update a meta tag by name or property
 */
function updateMetaTag(
    attribute: 'name' | 'property',
    key: string,
    content: string
) {
    let tag = document.querySelector(`meta[${attribute}="${key}"]`);

    if (tag) {
        tag.setAttribute('content', content);
    } else {
        // Create if doesn't exist
        tag = document.createElement('meta');
        tag.setAttribute(attribute, key);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
    }
}

/**
 * Hook to update SEO meta tags based on tenant context
 */
export function useSEO(config?: SEOConfig) {
    const city = useTenantStore((s) => s.city);
    const brand = useTenantStore((s) => s.brand);
    const isBootstrapped = useTenantStore((s) => s.isBootstrapped);

    useEffect(() => {
        if (!isBootstrapped || !city) return;

        const appName = brand?.appName || `e${city.name}`;
        const cityName = city.name;
        const fullName = city.fullName;

        // Build title
        const baseTitle = config?.pageTitle
            ? `${config.pageTitle} | ${appName}`
            : `${appName} - ${cityName} em tempo real`;

        // Build description
        const description = config?.description ||
            `${appName} - Seu app do dia a dia. Reporte problemas, participe do fórum, confira eventos e serviços de ${fullName}.`;

        // OG image
        const ogImage = config?.image || '/icon-512.png';

        // Update document title
        document.title = baseTitle;

        // Update meta tags
        updateMetaTag('name', 'description', description);
        updateMetaTag('name', 'application-name', appName);
        updateMetaTag('name', 'apple-mobile-web-app-title', appName);
        updateMetaTag('name', 'keywords', `${cityName}, ${city.uf}, comunidade, eventos, fórum, reportar, cidade`);
        updateMetaTag('name', 'author', appName);

        // Open Graph
        updateMetaTag('property', 'og:title', baseTitle);
        updateMetaTag('property', 'og:description', description);
        updateMetaTag('property', 'og:site_name', appName);
        updateMetaTag('property', 'og:image', ogImage);

        // Twitter Card
        updateMetaTag('name', 'twitter:title', appName);
        updateMetaTag('name', 'twitter:description', `${cityName} em tempo real`);

        // Update theme color if brand has it
        if (brand?.primaryColor) {
            updateMetaTag('name', 'theme-color', brand.primaryColor);
            updateMetaTag('name', 'msapplication-TileColor', brand.primaryColor);
        }

    }, [isBootstrapped, city, brand, config?.pageTitle, config?.description, config?.image]);
}

/**
 * Hook for page-specific SEO (use in individual pages)
 */
export function usePageSEO(pageTitle: string, description?: string) {
    useSEO({ pageTitle, description });
}

export default useSEO;
