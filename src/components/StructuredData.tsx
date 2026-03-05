// JSON-LD Structured Data Component for SEO

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NomadSteals",
    url: "https://nomadsteals.com",
    logo: "https://nomadsteals.com/logo.png",
    description: "Daily travel deals with Value Scores. Find the best flights, hotels, and vacation packages at incredible prices.",
    sameAs: [
      "https://twitter.com/nomadsteals",
      "https://facebook.com/nomadsteals",
      "https://instagram.com/nomadsteals",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "hello@nomadsteals.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NomadSteals",
    url: "https://nomadsteals.com",
    description: "Daily travel deals with Value Scores to help you find the best bang for your buck.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://nomadsteals.com/deals?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema() {
  const faqs = [
    {
      question: "What is a Value Score?",
      answer: "Value Score is our proprietary rating from 0-100 that measures how good a deal really is compared to historical pricing data. A score of 90+ indicates exceptional deals that you should book immediately.",
    },
    {
      question: "What are error fares?",
      answer: "Error fares (or mistake fares) occur when an airline accidentally prices a flight far below its intended cost. These can save you 50-90% on flights but often disappear within hours.",
    },
    {
      question: "How do I find cheap flights?",
      answer: "Sign up for our daily deal alerts, be flexible with your travel dates, check prices on Tuesdays and Wednesdays, and book 1-3 months ahead for domestic flights or 2-6 months for international flights.",
    },
    {
      question: "Are the deals on NomadSteals verified?",
      answer: "Yes! Our team verifies every deal before posting and calculates Value Scores based on historical pricing data to ensure you're getting genuine savings.",
    },
    {
      question: "How do I set up deal alerts?",
      answer: "Subscribe to our free newsletter to receive daily deal digests. Premium subscribers get instant push notifications for error fares and Value Score 90+ deals.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Combined schema for the main layout
export function GlobalStructuredData() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <FAQSchema />
    </>
  );
}
