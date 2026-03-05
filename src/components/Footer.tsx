"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "./Logo";
import { LanguageSwitcherCompact } from "./LanguageSwitcher";
import { popularCities } from "@/lib/sample-data";
import { Plane, Building2, Package, Flame, Heart, Sun, Palmtree } from "lucide-react";

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');

  return (
    <footer className="bg-[#2D3436] text-white/70 relative">
      {/* Wave Border Top */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none transform -translate-y-[99%]">
        <svg 
          className="relative block w-full h-[50px]" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            className="fill-[#2D3436]"
          />
        </svg>
      </div>

      {/* Tropical Decoration */}
      <div className="absolute top-8 right-8 opacity-5 text-6xl hidden lg:block">
        🌴
      </div>
      <div className="absolute bottom-32 left-8 opacity-5 text-4xl hidden lg:block">
        🌺
      </div>
      
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16 pt-20">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 text-white mb-5">
              <Logo size="md" linkToHome={false} />
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              {t('description')}
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              <a 
                href="#" 
                className="w-10 h-10 bg-white/10 hover:bg-[#FF6B6B] rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1" 
                aria-label="Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white/10 hover:bg-gradient-to-br hover:from-[#FF6B6B] hover:to-[#FFA07A] rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1" 
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white/10 hover:bg-[#20B2AA] rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1" 
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
            
            {/* Language Switcher in Footer */}
            <div className="mt-6">
              <LanguageSwitcherCompact />
            </div>
          </div>
          
          {/* Deal Types */}
          <div>
            <h4 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#FFD93D]" />
              {t('dealTypes')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/deals?type=flight" className="hover:text-[#FF6B6B] transition-colors duration-300 flex items-center gap-2.5 group">
                  <Plane className="w-4 h-4 text-white/40 group-hover:text-[#FF6B6B] transition-colors" />
                  {t('flightDeals')}
                </Link>
              </li>
              <li>
                <Link href="/deals?type=hotel" className="hover:text-[#FFA07A] transition-colors duration-300 flex items-center gap-2.5 group">
                  <Building2 className="w-4 h-4 text-white/40 group-hover:text-[#FFA07A] transition-colors" />
                  {t('hotelDeals')}
                </Link>
              </li>
              <li>
                <Link href="/deals?type=package" className="hover:text-[#20B2AA] transition-colors duration-300 flex items-center gap-2.5 group">
                  <Package className="w-4 h-4 text-white/40 group-hover:text-[#20B2AA] transition-colors" />
                  {t('vacationPackages')}
                </Link>
              </li>
              <li>
                <Link href="/deals?hot=true" className="hover:text-[#FFD93D] transition-colors duration-300 flex items-center gap-2.5 group">
                  <Flame className="w-4 h-4 text-white/40 group-hover:text-[#FFD93D] transition-colors" />
                  {t('hotDeals')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Popular Cities */}
          <div>
            <h4 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Palmtree className="w-4 h-4 text-[#20B2AA]" />
              {t('popularDestinations')}
            </h4>
            <ul className="space-y-3 text-sm">
              {popularCities.slice(0, 5).map(city => (
                <li key={city.code}>
                  <Link 
                    href={`/cities/${city.code.toLowerCase()}`} 
                    className="hover:text-[#48D1CC] transition-colors duration-300 flex items-center gap-2"
                  >
                    <span className="text-base">{city.name === 'Tokyo' ? '🗼' : city.name === 'Paris' ? '🗼' : city.name === 'Bali' ? '🏝️' : city.name === 'New York' ? '🗽' : '✈️'}</span>
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#FF6B6B]" />
              {t('company')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="hover:text-[#FF6B6B] transition-colors duration-300">{t('aboutUs')}</Link></li>
              <li><Link href="/newsletter" className="hover:text-[#FFA07A] transition-colors duration-300">{tNav('newsletter')}</Link></li>
              <li><Link href="/about#value-score" className="hover:text-[#20B2AA] transition-colors duration-300">{t('valueScoreExplained')}</Link></li>
              <li><Link href="/about#contact" className="hover:text-[#48D1CC] transition-colors duration-300">{t('contact')}</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/50 flex items-center gap-2">
            Made with <span className="text-[#FF6B6B]">♥</span> for wanderlusters • {t('copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors duration-300">{t('privacy')}</Link>
            <Link href="/terms" className="hover:text-white transition-colors duration-300">{t('terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
