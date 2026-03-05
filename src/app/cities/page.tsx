import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CityCard } from "@/components/CityCard";
import { NewsletterForm } from "@/components/Newsletter";
import { popularCities, dealStats } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Browse travel deals by destination. Find the best flights, hotels, and packages to your dream city.",
  openGraph: {
    title: "Explore Destinations - NomadSteals",
    description: "Browse travel deals by destination. Find the best flights, hotels, and packages to your dream city.",
  },
};

export default function CitiesPage() {
  // Group cities by region
  const regions = {
    "North America": popularCities.filter(c => ["USA", "Mexico"].includes(c.country)),
    "Europe": popularCities.filter(c => ["UK", "France", "Spain", "Italy", "Netherlands"].includes(c.country)),
    "Asia & Pacific": popularCities.filter(c => ["Japan", "Thailand", "Singapore", "Indonesia", "Australia"].includes(c.country)),
    "Middle East": popularCities.filter(c => ["UAE"].includes(c.country)),
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Destinations</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            {popularCities.length} popular destinations with {dealStats.totalDeals.toLocaleString()} active deals. 
            Find your next adventure.
          </p>
        </div>
      </section>
      
      {/* All Cities Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Featured Cities */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🔥 Trending Destinations</h2>
            <p className="text-gray-600 mb-6">Most popular cities with the best deals right now</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularCities.slice(0, 4).map(city => (
                <CityCard key={city.code} city={city} />
              ))}
            </div>
          </div>
          
          {/* Cities by Region */}
          {Object.entries(regions).map(([region, cities]) => (
            cities.length > 0 && (
              <div key={region} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{region}</h2>
                <p className="text-gray-600 mb-6">{cities.length} destinations</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {cities.map(city => (
                    <CityCard key={city.code} city={city} />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </section>
      
      {/* Newsletter */}
      <NewsletterForm variant="hero" />
      
      <Footer />
    </main>
  );
}
