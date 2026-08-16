import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Reusable SEO component for dynamic head metadata updates.
 * Handles canonicalization, social cards, search indexability directives, and titles.
 */
export default function SEO({ title, description, image, type = 'website', noindex = false }) {
  const location = useLocation();
  
  // Enforce cohortnow.online as the preferred canonical domain
  const canonicalUrl = `https://www.cohortnow.online${location.pathname}`;

  useEffect(() => {
    // Helper utility to safely manage meta elements
    const updateMetaTag = (attribute, value, content) => {
      let element = document.querySelector(`meta[${attribute}="${value}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, value);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper utility to safely manage link elements
    const updateLinkTag = (rel, href) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 1. Update document title (only when provided or on homepage)
    if (title || location.pathname === '/') {
      const defaultTitle = 'Cohort - Your Campus Social Media';
      const formattedTitle = title ? `${title} | Cohort` : defaultTitle;
      const finalTitle = location.pathname === '/' ? defaultTitle : formattedTitle;
      document.title = finalTitle;

      updateMetaTag('property', 'og:title', finalTitle);
      updateMetaTag('name', 'twitter:title', finalTitle);
    }

    // 2. Robots Indexing (Noindex private routes to protect sensitive student dashboard spaces)
    if (noindex) {
      updateMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      updateMetaTag('name', 'robots', 'index, follow');
    }

    // 3. Update description (only when provided or on homepage)
    if (description || location.pathname === '/') {
      const defaultDesc = 'Cohort is the social media for campus. A student community platform connecting college students with their campus communities, events, confessions, gossip, making friends, anonymous talks, and unfiltered takes.';
      const finalDesc = description || defaultDesc;
      updateMetaTag('name', 'description', finalDesc);
      updateMetaTag('property', 'og:description', finalDesc);
      updateMetaTag('name', 'twitter:description', finalDesc);
    }

    // 4. Update Canonical Link
    updateLinkTag('canonical', canonicalUrl);

    // 5. Open Graph Meta Tags
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'og:type', type);
    updateMetaTag('property', 'og:site_name', 'Cohort');
    
    const defaultImage = 'https://cohortnow.online/og-image.png';
    const finalImage = image || defaultImage;
    updateMetaTag('property', 'og:image', finalImage);

    // 6. Twitter Card Meta Tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:image', finalImage);

  }, [title, description, image, type, noindex, location.pathname, canonicalUrl]);

  return null;
}
