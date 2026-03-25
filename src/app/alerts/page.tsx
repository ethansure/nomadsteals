import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PriceAlertForm } from "@/components/PriceAlertForm";
import { Bell, Zap, Shield, Clock, Sparkles, Mail, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Price Alerts - Get Notified When Flight Prices Drop | NomadSteals",
  description: "Set up free flight price alerts and get instant notifications when prices drop on your favorite routes. Never miss a cheap flight deal again.",
  keywords: ["flight price alerts", "cheap flight notifications", "price drop alerts", "flight deals", "travel alerts"],
  openGraph: {
    title: "Free Flight Price Alerts | NomadSteals",
    description: "Get instant notifications when prices drop on your favorite routes. Free forever.",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Notifications",
    description: "Get notified within minutes when we find a deal matching your criteria.",
  },
  {
    icon: Shield,
    title: "Only Quality Deals",
    description: "We verify every deal with our Value Score system—no fake discounts.",
  },
  {
    icon: Clock,
    title: "Real-Time Monitoring",
    description: "Our system checks prices 24/7 across multiple sources.",
  },
  {
    icon: Sparkles,
    title: "Error Fare Alerts",
    description: "Be first to know about mistake fares and flash sales.",
  },
];

const TESTIMONIALS = [
  {
    quote: "Saved $400 on flights to Japan! The alert came in at 2am and the deal was gone by morning.",
    author: "Sarah M.",
    route: "SFO → Tokyo",
  },
  {
    quote: "Finally booked that Paris trip for under $300 roundtrip. Best alert service I've used.",
    author: "Mike T.",
    route: "NYC → Paris",
  },
  {
    quote: "The instant alerts are a game changer. I've booked 3 trips this year at historic lows.",
    author: "Jessica L.",
    route: "Multiple routes",
  },
];

export default function AlertsPage() {
  return (
    <main className="min-h-screen bg-[#FFFAF5]">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D] text-white py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-8xl opacity-10">🔔</div>
          <div className="absolute bottom-20 right-20 text-7xl opacity-10">✈️</div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-6">
                <Bell className="w-4 h-4" />
                Free Price Alerts
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Never Miss a <br />
                <span className="text-[#2D3436]">Cheap Flight</span> Again
              </h1>
              
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Set up personalized alerts for your dream destinations. 
                We'll notify you instantly when prices drop—even at 2am.
              </p>

              <div className="flex flex-wrap gap-4">
                {["✓ 100% Free", "✓ No Spam", "✓ Instant Alerts", "✓ Error Fares"].map((item) => (
                  <span key={item} className="flex items-center gap-1 text-white/90">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-white/10 backdrop-blur-sm rounded-3xl" />
              <div className="relative">
                <PriceAlertForm variant="card" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3436] mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Set up your alert in 30 seconds and let us do the rest
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Set Your Route",
                description: "Tell us where you want to go and your maximum budget.",
                emoji: "🎯",
              },
              {
                step: "2",
                title: "We Monitor 24/7",
                description: "Our system continuously checks prices across all major sources.",
                emoji: "👀",
              },
              {
                step: "3",
                title: "Get Notified",
                description: "Receive an instant email when we find a deal matching your criteria.",
                emoji: "🔔",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">
                  {item.emoji}
                </div>
                <div className="text-sm text-[#FF6B6B] font-semibold mb-2">Step {item.step}</div>
                <h3 className="text-xl font-bold text-[#2D3436] mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3436] mb-4">
              Why Our Alerts Are Different
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="p-6 bg-[#FFFAF5] rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#2D3436] mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3436] mb-4">
              Travelers Love Our Alerts
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#2D3436]">{testimonial.author}</span>
                  <span className="text-sm text-gray-500">{testimonial.route}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A]">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Save on Your Next Trip?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join 50,000+ travelers who never overpay for flights.
          </p>
          <a
            href="#top"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#FF6B6B] font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Bell className="w-5 h-5" />
            Create Your Free Alert
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#2D3436] text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Is this really free?",
                a: "Yes! Price alerts are 100% free, forever. We make money through affiliate commissions when you book—you pay the same price either way.",
              },
              {
                q: "How quickly will I get notified?",
                a: "For instant alerts, you'll receive an email within minutes of us finding a matching deal. Daily digests are sent each morning.",
              },
              {
                q: "What's a Value Score?",
                a: "Our proprietary 0-100 score that measures how good a deal really is compared to historical pricing. A score of 85+ means it's an exceptional deal.",
              },
              {
                q: "Can I set multiple alerts?",
                a: "Currently each email can have one set of preferences. We're working on multiple alert profiles for power users.",
              },
              {
                q: "How do I unsubscribe?",
                a: "Every email has an unsubscribe link. One click and you're done—no questions asked.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl">
                <h3 className="font-bold text-[#2D3436] mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
