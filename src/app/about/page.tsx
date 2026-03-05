import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ValueScoreExplainer } from "@/components/ValueScoreBadge";
import { NewsletterForm } from "@/components/Newsletter";
import { dealStats } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about NomadSteals and how we find the best travel deals. Our Value Score algorithm helps you identify truly exceptional deals.",
  openGraph: {
    title: "About NomadSteals - How We Find the Best Deals",
    description: "Learn about our mission to help travelers find incredible deals with our proprietary Value Score system.",
  },
};

export default function AboutPage() {
  const teamMembers = [
    { name: "Deal Hunters", emoji: "🔍", desc: "Our team scours the web 24/7 for the best deals" },
    { name: "Data Nerds", emoji: "📊", desc: "We analyze historical pricing to calculate Value Scores" },
    { name: "Travel Lovers", emoji: "✈️", desc: "We're travelers too — we get it" },
  ];

  const stats = [
    { value: `${dealStats.totalDeals.toLocaleString()}+`, label: "Deals Tracked" },
    { value: "50K+", label: "Subscribers" },
    { value: `${dealStats.avgSavings}%`, label: "Avg Savings" },
    { value: "24/7", label: "Deal Monitoring" },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            We Help You Travel <span className="text-yellow-300">Smarter</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            NomadSteals is your daily source for hand-picked travel deals. 
            We use data and experience to find deals that are actually worth your time.
          </p>
        </div>
      </section>
      
      {/* Stats */}
      <section className="py-12 px-6 -mt-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Our Story */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="prose prose-lg prose-gray max-w-none">
            <p>
              NomadSteals started with a simple frustration: finding good travel deals was too hard. 
              There were too many mediocre "deals" out there, and too much noise to sift through.
            </p>
            <p>
              We built NomadSteals to be the travel deals site we always wanted. Every deal on our site 
              is hand-reviewed by our team. We analyze pricing data to calculate our proprietary 
              <strong> Value Score</strong> — so you know when a deal is actually exceptional, not just "on sale."
            </p>
            <p>
              We're travelers ourselves. We've booked error fares to Asia, scored luxury hotels at budget 
              prices, and found hidden gem destinations. Now we share that knowledge with you.
            </p>
          </div>
        </div>
      </section>
      
      {/* Value Score Section */}
      <section id="value-score" className="py-16 px-6 bg-white scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                The Value Score Difference
              </h2>
              <p className="text-gray-600 mb-6">
                Not all "deals" are created equal. A 30% discount on an already-inflated price isn't really a deal. 
                That's why we created the Value Score.
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span><strong>Historical Comparison:</strong> We compare current prices to 12+ months of historical data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span><strong>Seasonal Adjustment:</strong> We account for peak vs. off-peak pricing</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span><strong>Route Analysis:</strong> We know what's typical for each route and destination</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span><strong>Quality Factor:</strong> We consider the airline/hotel reputation in our scoring</span>
                </li>
              </ul>
            </div>
            <div>
              <ValueScoreExplainer />
            </div>
          </div>
        </div>
      </section>
      
      {/* Team */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What We Do</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {teamMembers.map((member, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                <div className="text-5xl mb-4">{member.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-gray-600">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How We Make Money */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How We Make Money</h2>
          <div className="prose prose-lg prose-gray max-w-none">
            <p>
              Transparency matters to us. Here's how NomadSteals stays free:
            </p>
            <ul>
              <li>
                <strong>Affiliate Links:</strong> When you book through our links, we may earn a small commission 
                at no extra cost to you. This doesn't affect our deal selection — we feature deals based on 
                Value Score, not commission rates.
              </li>
              <li>
                <strong>Premium Newsletter (Coming Soon):</strong> We're building a premium tier with exclusive 
                deals and features. Our free newsletter will always exist.
              </li>
            </ul>
            <p>
              We will never feature a deal just because it pays us more. Our reputation depends on finding 
              you genuinely great deals.
            </p>
          </div>
        </div>
      </section>
      
      {/* Contact */}
      <section id="contact" className="py-16 px-6 scroll-mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Get in Touch</h2>
          <p className="text-gray-600 mb-8">
            Have a deal tip? Spotted an error? Want to partner with us? We'd love to hear from you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="mailto:hello@nomadsteals.com"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
            >
              📧 Email Us
            </a>
            <a 
              href="https://twitter.com/nomadsteals"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              𝕏 Follow on X
            </a>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Amazing Deals?</h2>
          <p className="text-blue-100 mb-8">
            Join 50,000+ travelers who get our daily deal digest.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/deals"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition"
            >
              Browse Deals
            </Link>
            <Link 
              href="/newsletter"
              className="px-8 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-300 transition"
            >
              Subscribe Free →
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
