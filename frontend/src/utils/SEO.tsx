import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'book';
  jsonLd?: object;
}

export const SEO = ({ title, description, image, type = 'website', jsonLd }: SEOProps) => {
  const siteUrl = 'http://localhost:3000'; // В проде заменить на реальный домен
  const currentUrl = window.location.href;

  return (
    <Helmet>
      <title>{title} | Book Exchange</title>
      <meta name="description" content={description} />
    
      <link rel="canonical" href={currentUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};