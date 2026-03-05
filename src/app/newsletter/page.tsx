import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscriptionForm } from "@/components/SubscriptionForm";

export const metadata: Metadata = {
  title: "Newsletter - Subscribe to Travel Deals",
  description: "Join 50,000+ travelers who get daily deal alerts from NomadSteals. Free forever, unsubscribe anytime.",
  openGraph: {
    title: "Get Daily Travel Deals - NomadSteals Newsletter",
    description: "Join 50,000+ travelers who get daily deal alerts. Free forever, unsubscribe anytime.",
  },
};

function ErrorBanner({ error }: { error?: string }) {
  if (!error) return null;
  
  const messages: Record<string, string> = {
    "missing-token": "Missing verification token. Please use the link from your email.",
    "invalid-token": "Invalid or expired token. Please subscribe again.",
    "verification-failed": "Verification failed. Please try again or contact support.",
    "already-unsubscribed": "This email has already been unsubscribed.",
    "server-error": "Something went wrong. Please try again later.",
  };
  
  return (
    <div className="max-w-3xl mx-auto px-6 pt-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
        ⚠️ {messages[error] || error}
      </div>
    </div>
  );
}

export default function NewsletterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const benefits = [
    {
      emoji: "🔥",
      title: "Hot Deals First",
      desc: "Be the first to know about error fares and flash sales before they sell out",
    },
    {
      emoji: "⚡",
      title: "Value Score Picks",
      desc: "We only send deals with exceptional Value Scores — no mediocre discounts",
    },
    {
      emoji: "📍",
      title: "Personalized",
      desc: "Set your home airport and dream destinations for tailored alerts",
    },
    {
      emoji: "📱",
      title: "Mobile Friendly",
      desc: "Clean, easy-to-read emails optimized for booking on the go",
    },
  ];

  const testimonials = [
    {
      quote: "I booked a $500 RT flight to Tokyo that normally costs $1,400. NomadSteals pays for itself!",
      author: "Sarah M.",
      location: "San Francisco",
    },
    {
      quote: "Finally, a deal newsletter that doesn't waste my time with fake 'sales'.",
      author: "James K.",
      location: "Chicago",
    },
    {
      quote: "The Value Score feature is genius. I actually trust these deals now.",
      author: "Emily R.",
      location: "New York",
    },
  ];

  const faqs = [
    {
      q: "How often will I receive emails?",
      a: "You choose! Get instant alerts for hot deals, a daily digest, or a weekly roundup. Customize it in your preferences.",
    },
    {
      q: "Is it really free?",
      a: "Yes! Our newsletter is 100% free, forever. We make money through affiliate commissions when you book, at no extra cost to you.",
    },
    {
      q: "Can I unsubscribe anytime?",
      a: "Absolutely. Every email has a one-click unsubscribe link. No questions asked, no guilt trips.",
    },
    {
      q: "Will you sell my email?",
      a: "Never. We hate spam as much as you do. Your email stays with us, period.",
    },
    {
      q: "Can I filter deals by destination?",
      a: "Yes! Set your preferred origins and destinations, max price, deal types, and more. Only get deals you actually care about.",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <ErrorBanner error={searchParams.error} />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">✈️</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Get the Best Deals<br />
            <span className="text-yellow-300">Before Everyone Else</span>
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto">
            Join 50,000+ savvy travelers who wake up to incredible deals in their inbox. 
            Error fares, flash sales, and exclusive finds — delivered on your schedule.
          </p>
          
          {/* Signup Form */}
          <div className="max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <SubscriptionForm />
          </div>
          
          <p className="text-sm text-blue-200 mt-4">
            🔒 Free forever • No spam • Unsubscribe anytime
          </p>
        </div>
      </section>
      
      {/* Social Proof */}
      <section className="py-8 px-6 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
            <div>
              <span className="text-3xl font-bold text-gray-900">50,000+</span>
              <span className="ml-2">subscribers</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <span className="text-3xl font-bold text-gray-900">4.9/5</span>
              <span className="ml-2">reader rating</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <span className="text-3xl font-bold text-gray-900">$1.2M+</span>
              <span className="ml-2">saved by readers</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Subscribe?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-4xl mb-4">{benefit.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Sample Email */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">What You'll Get</h2>
          <p className="text-gray-600 text-center mb-8">A preview of our daily deal digest</p>
          
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 shadow-inner">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-lg mx-auto">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 text-center">
                <div className="text-xl font-bold">🔥 Today's Top Deal</div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                    ⚡ 96 Value Score
                  </span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                    🔥 Error Fare
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  NYC → Tokyo Business Class — $1,289 RT
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  ANA business class mistake fare. Usually $4,500+. Book before it's fixed!
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-gray-900">$1,289</span>
                    <span className="text-gray-400 line-through ml-2">$4,500</span>
                  </div>
                  <span className="text-green-600 font-bold">Save 71%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What Readers Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-blue-600 text-4xl mb-4">"</div>
                <p className="text-gray-700 mb-4">{t.quote}</p>
                <div>
                  <div className="font-semibold text-gray-900">{t.author}</div>
                  <div className="text-gray-500 text-sm">{t.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Common Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-4">✈️</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Save on Travel?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join 50,000+ savvy travelers who get our personalized deal alerts.
          </p>
          <div className="max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <SubscriptionForm />
          </div>
          <p className="text-sm text-blue-200 mt-4">
            🔒 No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
