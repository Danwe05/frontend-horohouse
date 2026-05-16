import HomeWrapper from "@/components/home/HomeWrapper";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HoroHouse",
    "url": "https://www.horohouse.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.horohouse.com/properties?searchTerm={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HoroHouse",
    "url": "https://www.horohouse.com",
    "logo": "https://www.horohouse.com/logo.png",
    "sameAs": [
      "https://facebook.com/horohouse",
      "https://twitter.com/horohouse",
      "https://instagram.com/horohouse",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <HomeWrapper />
    </>
  );
}
