import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { Palmtree, Sparkles, Star, Lock, Check, Mail, Sun } from "lucide-react";

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
      <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-2xl p-4 text-[#E85555] text-sm flex items-center gap-3">
        <span className="text-lg">⚠️</span>
        {messages[error] || error}
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
      emoji: "✨",
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
      emoji: "🌸",
    },
    {
      quote: "Finally, a deal newsletter that doesn't waste my time with fake 'sales'.",
      author: "James K.",
      location: "Chicago",
      emoji: "✈️",
    },
    {
      quote: "The Value Score feature is genius. I actually trust these deals now.",
      author: "Emily R.",
      location: "New York",
      emoji: "⭐",
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
    <main className="min-h-screen bg-[#FFFAF5]">
      <Header />
      
      <ErrorBanner error={searchParams.error} />
      
      {/* Hero - Sunset Gradient */}
      <section className="bg-gradient-to-br from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D] text-white py-24 px-6 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-10 left-10 text-7xl opacity-10">🌴</div>
        <div className="absolute bottom-20 right-20 text-6xl opacity-10">✈️</div>
        <div className="absolute top-1/2 right-1/4 text-4xl opacity-5">🌺</div>
        
        {/* Wave at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 fill-[#FFFAF5]">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" />
          </svg>
        </div>
        
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Palmtree className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Get the Best Deals<br />
            <span className="text-[#2D3436]">Before Everyone Else</span>
          </h1>
          <p className="text-xl text-white/90 mb-12 max-w-xl mx-auto leading-relaxed">
            Join 50,000+ savvy travelers who wake up to incredible deals in their inbox. 
            Error fares, flash sales, and exclusive finds — delivered on your schedule.
          </p>
          
          {/* Signup Form */}
          <div className="max-w-md mx-auto bg-white/15 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <SubscriptionForm />
          </div>
          
          <p className="text-sm text-white/80 mt-6 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Free forever • No spam • Unsubscribe anytime
          </p>
        </div>
      </section>
      
      {/* Social Proof */}
      <section className="py-10 px-6 bg-white border-b border-[#FF6B6B]/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 text-[#2D3436]/60">
            <div className="text-center">
              <span className="text-4xl font-bold text-[#FF6B6B]">50,000+</span>
              <span className="block text-sm mt-1">subscribers</span>
            </div>
            <div className="h-10 w-px bg-[#FF6B6B]/10 hidden md:block" />
            <div className="text-center">
              <span className="text-4xl font-bold text-[#20B2AA]">4.9/5</span>
              <span className="block text-sm mt-1">reader rating</span>
            </div>
            <div className="h-10 w-px bg-[#FF6B6B]/10 hidden md:block" />
            <div className="text-center">
              <span className="text-4xl font-bold text-[#FFA07A]">$1.2M+</span>
              <span className="block text-sm mt-1">saved by readers</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits */}
      <section className="py-20 px-6 bg-[#FFFAF5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3436] mb-4">Why Subscribe? 🌟</h2>
            <p className="text-[#2D3436]/60 text-lg">Here's what makes us different</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <div 
                key={i} 
                className="bg-white rounded-3xl p-8 shadow-soft border border-[#FF6B6B]/5 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-5xl mb-5">{benefit.emoji}</div>
                <h3 className="text-xl font-bold text-[#2D3436] mb-3">{benefit.title}</h3>
                <p className="text-[#2D3436]/60 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Sample Email */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3436] mb-4">What You'll Get 📬</h2>
            <p className="text-[#2D3436]/60 text-lg">A preview of our daily deal digest</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#FFF8F0] to-[#FFFAF5] rounded-3xl p-8 md:p-12 border border-[#FF6B6B]/10">
            <div className="bg-white rounded-3xl shadow-soft-lg overflow-hidden max-w-lg mx-auto border border-[#FF6B6B]/5">
              <div className="bg-gradient-to-r from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D] text-white p-5 text-center">
                <div className="text-xl font-bold flex items-center justify-center gap-2">
                  🔥 Today's Top Deal
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-[#20B2AA] to-[#48D1CC] text-white text-sm font-bold rounded-full shadow-lg shadow-[#20B2AA]/20">
                    ⚡ 96 Value Score
                  </span>
                  <span className="px-4 py-1.5 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white text-sm font-bold rounded-full shadow-lg shadow-[#FF6B6B]/20">
                    🔥 Error Fare
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#2D3436] mb-3">
                  NYC → Tokyo Business Class — $1,289 RT
                </h3>
                <p className="text-[#2D3436]/60 text-sm mb-5 leading-relaxed">
                  ANA business class mistake fare. Usually $4,500+. Book before it's fixed!
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-[#2D3436]">$1,289</span>
                    <span className="text-[#2D3436]/40 line-through ml-2">$4,500</span>
                  </div>
                  <span className="text-[#20B2AA] font-bold text-lg">Save 71% 🎉</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 px-6 bg-[#FFFAF5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3436] mb-4">What Readers Say 💬</h2>
            <p className="text-[#2D3436]/60 text-lg">Real feedback from real travelers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div 
                key={i} 
                className="bg-white rounded-3xl p-8 shadow-soft border border-[#FF6B6B]/5 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{t.emoji}</div>
                <p className="text-[#2D3436]/80 mb-5 leading-relaxed italic">"{t.quote}"</p>
                <div>
                  <div className="font-bold text-[#2D3436]">{t.author}</div>
                  <div className="text-[#2D3436]/50 text-sm">{t.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3436] mb-4">Common Questions 🤔</h2>
            <p className="text-[#2D3436]/60 text-lg">Everything you need to know</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className="bg-[#FFF8F0] rounded-2xl p-6 hover:bg-[#FFEFE5] transition-colors duration-300"
              >
                <h3 className="font-bold text-[#2D3436] mb-2 flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#20B2AA]" />
                  {faq.q}
                </h3>
                <p className="text-[#2D3436]/60 leading-relaxed pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D] text-white relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-10 right-20 text-6xl opacity-10">🌴</div>
        <div className="absolute bottom-10 left-20 text-5xl opacity-10">✈️</div>
        
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="text-6xl mb-6">✨</div>
          <h2 className="text-3xl md:text-5xl font-bold mb-5">Ready to Save on Travel?</h2>
          <p className="text-white/90 mb-10 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Join 50,000+ savvy travelers who get our personalized deal alerts.
          </p>
          <div className="max-w-md mx-auto bg-white/15 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <SubscriptionForm />
          </div>
          <p className="text-sm text-white/80 mt-6 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
