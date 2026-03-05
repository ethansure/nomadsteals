"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PartyPopper, Palmtree, Mail, Lock, Sparkles, Send, Sun } from "lucide-react";

interface NewsletterFormProps {
  variant?: "inline" | "card" | "hero";
  className?: string;
}

export function NewsletterForm({ variant = "inline", className = "" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const t = useTranslations('newsletter');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus("loading");
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would call your newsletter API
    setStatus("success");
    setEmail("");
  };

  if (status === "success") {
    return (
      <div className={`text-center p-8 bg-gradient-to-br from-[#20B2AA]/10 to-[#48D1CC]/10 rounded-3xl border border-[#20B2AA]/20 ${className}`}>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#20B2AA] to-[#48D1CC] rounded-2xl flex items-center justify-center shadow-lg shadow-[#20B2AA]/30">
            <PartyPopper className="w-8 h-8 text-white" />
          </div>
        </div>
        <h3 className="font-bold text-[#178F89] text-xl mb-2">{t('subscribed')} 🎉</h3>
        <p className="text-[#20B2AA] text-sm">{t('subscribedSubtitle')}</p>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <section className={`py-20 px-6 bg-gradient-to-br from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D] text-white relative ${className}`}>
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl opacity-10">🌴</div>
          <div className="absolute bottom-10 right-10 text-6xl opacity-10">✈️</div>
          <div className="absolute top-1/2 right-1/4 text-4xl opacity-5">🌺</div>
        </div>
        
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
              <Palmtree className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-5">{t('title')}</h2>
          <p className="text-white/90 mb-10 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            {t('subtitle', { count: '50,000' })}
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <div className="relative flex-1">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="px-6 py-4 pl-12 rounded-2xl text-[#2D3436] w-full outline-none focus:ring-4 focus:ring-white/30 shadow-lg placeholder:text-[#2D3436]/40"
                required
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF6B6B]/50" />
            </div>
            <button 
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-4 bg-[#2D3436] text-white font-bold rounded-2xl hover:bg-[#4A5154] transition-all duration-300 whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5"
            >
              {status === "loading" ? (
                t('subscribing')
              ) : (
                <>
                  {t('subscribe')}
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          <p className="text-sm text-white/80 mt-6 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            {t('noSpam')}
          </p>
        </div>
      </section>
    );
  }

  if (variant === "card") {
    return (
      <div className={`bg-gradient-to-br from-[#FFF8F0] to-[#FFFAF5] rounded-3xl p-8 border border-[#FF6B6B]/10 shadow-soft ${className}`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FF6B6B]/20">
            <Sun className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#2D3436] mb-2">{t('dailyAlerts')} ☀️</h3>
          <p className="text-[#2D3436]/60 text-sm leading-relaxed">
            {t('dailyAlertsDesc')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-5 py-4 pl-12 bg-white border border-[#FF6B6B]/10 rounded-2xl outline-none focus:ring-2 focus:ring-[#20B2AA]/30 focus:border-[#20B2AA] transition-all duration-300"
              required
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF6B6B]/40" />
          </div>
          <button 
            type="submit"
            disabled={status === "loading"}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-[#FF6B6B]/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {status === "loading" ? t('subscribing') : t('getDailyDeals')}
          </button>
        </form>
        <p className="text-xs text-[#2D3436]/40 text-center mt-4">
          {t('freeForever')} 🌴
        </p>
      </div>
    );
  }

  // Inline variant (default)
  return (
    <form onSubmit={handleSubmit} className={`flex gap-3 ${className}`}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('emailPlaceholder')}
        className="flex-1 px-5 py-3 bg-white border border-[#FF6B6B]/10 rounded-2xl outline-none focus:ring-2 focus:ring-[#20B2AA]/30 focus:border-[#20B2AA] transition-all duration-300"
        required
      />
      <button 
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-[#FF6B6B]/20 transition-all duration-300 disabled:opacity-50"
      >
        {status === "loading" ? "..." : t('subscribe')}
      </button>
    </form>
  );
}
