import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '../config';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'book';
  jsonLd?: object;
}

export const SEO = ({ title, description, image, type = 'website', jsonLd }: SEOProps) => {
  const currentUrl = window.location.href;
  const resolvedImage = image
    ? new URL(image, SITE_URL).toString()
    : undefined;

  return (
    <Helmet>
      <title>{title} | Book Exchange</title>
      <meta name="description" content={description} />
    
      <link rel="canonical" href={currentUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {resolvedImage && <meta property="og:image" content={resolvedImage} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {resolvedImage && <meta name="twitter:image" content={resolvedImage} />}

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
