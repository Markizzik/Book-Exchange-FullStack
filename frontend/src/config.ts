const normalizeUrl = (value: string | undefined, fallback: string) => {
  const normalized = (value || fallback).trim().replace(/\/+$/, '');
  return normalized || fallback;
};

export const SITE_URL = normalizeUrl(
  import.meta.env.VITE_SITE_URL,
  window.location.origin,
);

export const COVER_FALLBACK_BASE_URL = (
  import.meta.env.VITE_COVER_FALLBACK_BASE_URL || ''
).trim().replace(/\/+$/, '');

export const buildCoverFallbackUrl = (filename: string | null | undefined) => {
  if (!filename || !COVER_FALLBACK_BASE_URL) {
    return null;
  }

  return `${COVER_FALLBACK_BASE_URL}/${filename}`;
};
