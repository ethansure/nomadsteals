import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DealCard } from "@/components/DealCard";
import { NewsletterForm } from "@/components/Newsletter";
import { getCityBySlug, popularCities } from "@/lib/sample-data";
import { getServerCityDeals } from "@/lib/api/server";
import { Deal } from "@/lib/types";

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300; // Revalidate every 5 minutes

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  
  if (!city) {
    return { title: "City Not Found" };
  }
  
  return {
    title: `${city.name} Travel Deals`,
    description: `Find the best travel deals to ${city.name}, ${city.country}. ${city.dealCount} deals with average savings of ${city.avgSavings}%.`,
    openGraph: {
      title: `${city.name} Travel Deals - NomadSteals`,
      description: `${city.dealCount} deals to ${city.name} with ${city.avgSavings}% average savings`,
      images: [{ url: city.imageUrl, width: 800, height: 600 }],
    },
  };
}

export async function generateStaticParams() {
  return popularCities.map((city) => ({
    slug: city.slug || city.code.toLowerCase(),
  }));
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  
  if (!city) {
    notFound();
  }
  
  // Get deals for this city from data store
  const response = await getServerCityDeals(slug);
  const cityDeals: Deal[] = response.deals;
  const dealCount = response.total > 0 ? response.total : city.dealCount;
  
  // Get related cities (same region)
  const relatedCities = popularCities
    .filter(c => c.code !== city.code)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-80 md:h-96 overflow-hidden">
        <img 
          src={city.imageUrl} 
          alt={city.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-6 pb-12 w-full">
            <Link 
              href="/cities"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
            >
              ← All Destinations
            </Link>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{city.name}</h1>
            <p className="text-xl text-white/80 mb-6">{city.country}</p>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 bg-white/10 backdrop-blur rounded-xl text-white">
                <span className="font-bold text-2xl">{dealCount}</span>
                <span className="text-white/80 ml-2">active deals</span>
              </div>
              <div className="px-4 py-2 bg-green-500/80 backdrop-blur rounded-xl text-white">
                <span className="font-bold text-2xl">{city.avgSavings}%</span>
                <span className="text-white/80 ml-2">avg savings</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Deals Section */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Deals to {city.name}</h2>
              <p className="text-gray-600">Best flights, hotels and packages</p>
            </div>
            <Link 
              href={`/deals?destination=${city.name.toLowerCase()}`}
              className="text-blue-600 font-medium hover:text-blue-700 transition"
            >
              View all →
            </Link>
          </div>
          
          {cityDeals.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cityDeals.map(deal => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No deals available yet</h3>
              <p className="text-gray-600 mb-6">
                We don't have any current deals to {city.name}, but subscribe to get notified when new deals appear!
              </p>
              <Link
                href="/newsletter"
                className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
              >
                Get Deal Alerts
              </Link>
            </div>
          )}
        </div>
      </section>
      
      {/* City Info */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">About {city.name}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="prose prose-gray max-w-none">
              <p>
                {city.name} is one of the most popular travel destinations with amazing deals available year-round. 
                Whether you're looking for cultural experiences, culinary adventures, or just relaxation, 
                {city.name} has something for everyone.
              </p>
              <p>
                Our curated deals to {city.name} include flights from major US cities, luxury hotel stays, 
                and all-inclusive vacation packages. With average savings of {city.avgSavings}%, 
                you can experience this incredible destination without breaking the bank.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-gray-900 mb-4">Quick Facts</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-3">
                  <span className="text-xl">🌍</span>
                  <span><strong>Country:</strong> {city.country}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-xl">✈️</span>
                  <span><strong>Airport Code:</strong> {city.code}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-xl">🎯</span>
                  <span><strong>Active Deals:</strong> {dealCount}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-xl">💰</span>
                  <span><strong>Avg Savings:</strong> {city.avgSavings}%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Related Cities */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Other Destinations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedCities.map(relatedCity => (
              <Link
                key={relatedCity.code}
                href={`/cities/${relatedCity.slug || relatedCity.code.toLowerCase()}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3]"
              >
                <img 
                  src={relatedCity.imageUrl} 
                  alt={relatedCity.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl font-bold text-white">{relatedCity.name}</h3>
                  <p className="text-white/70 text-sm">{relatedCity.dealCount} deals</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Newsletter */}
      <NewsletterForm variant="hero" />
      
      <Footer />
    </main>
  );
}
