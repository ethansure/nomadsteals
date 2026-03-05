"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MapPin, Compass, Info, Search, X, Menu, History } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const t = useTranslations('nav');

  return (
    <header className="bg-[#FFFAF5] border-b border-[#FF6B6B]/10 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo size="md" />
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link 
              href="/deals" 
              className="text-[#2D3436]/70 hover:text-[#FF6B6B] transition-colors duration-300 font-medium flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              {t('allDeals')}
            </Link>
            <Link 
              href="/cities" 
              className="text-[#2D3436]/70 hover:text-[#FF6B6B] transition-colors duration-300 font-medium flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              {t('destinations')}
            </Link>
            <Link 
              href="/deals/history" 
              className="text-[#2D3436]/70 hover:text-[#FF6B6B] transition-colors duration-300 font-medium flex items-center gap-1.5"
            >
              <History className="w-4 h-4" />
              History
            </Link>
            <Link 
              href="/about" 
              className="text-[#2D3436]/70 hover:text-[#FF6B6B] transition-colors duration-300 font-medium flex items-center gap-1.5"
            >
              <Info className="w-4 h-4" />
              {t('about')}
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 text-[#2D3436]/60 hover:text-[#20B2AA] hover:bg-[#20B2AA]/10 rounded-full transition-all duration-300"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <LanguageSwitcher />
            
            <Link 
              href="/newsletter"
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-[#FF6B6B]/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              {t('subscribeFree')} ✨
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-[#2D3436]/70 hover:text-[#FF6B6B] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Search Bar (expandable) */}
        {searchOpen && (
          <div className="mt-4 pb-2 animate-in slide-in-from-top-2 duration-300">
            <div className="relative">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                className="w-full px-5 py-3.5 pl-12 bg-white border border-[#FF6B6B]/20 rounded-2xl outline-none focus:ring-2 focus:ring-[#20B2AA]/50 focus:border-[#20B2AA] transition-all duration-300 placeholder:text-[#2D3436]/40"
                autoFocus
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF6B6B]/50" />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pt-4 pb-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
            <Link 
              href="/deals" 
              className="flex items-center gap-3 px-4 py-3.5 text-[#2D3436] hover:bg-[#FF6B6B]/5 rounded-2xl font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-xl flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <div>{t('allDeals')}</div>
                <div className="text-xs text-[#2D3436]/50">Browse all travel deals</div>
              </div>
            </Link>
            <Link 
              href="/cities" 
              className="flex items-center gap-3 px-4 py-3.5 text-[#2D3436] hover:bg-[#20B2AA]/5 rounded-2xl font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#20B2AA] to-[#48D1CC] rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <div>{t('destinations')}</div>
                <div className="text-xs text-[#2D3436]/50">Explore by city</div>
              </div>
            </Link>
            <Link 
              href="/deals/history" 
              className="flex items-center gap-3 px-4 py-3.5 text-[#2D3436] hover:bg-[#6B5B95]/5 rounded-2xl font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#6B5B95] to-[#8B78A9] rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <div>Deal History</div>
                <div className="text-xs text-[#2D3436]/50">Browse past deals</div>
              </div>
            </Link>
            <Link 
              href="/about" 
              className="flex items-center gap-3 px-4 py-3.5 text-[#2D3436] hover:bg-[#F5DEB3]/30 rounded-2xl font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#F5DEB3] to-[#DEB887] rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-[#2D3436]" />
              </div>
              <div>
                <div>{t('about')}</div>
                <div className="text-xs text-[#2D3436]/50">Learn about us</div>
              </div>
            </Link>
            
            {/* Language Switcher for Mobile */}
            <div className="px-4 py-3">
              <LanguageSwitcher />
            </div>
            
            <Link 
              href="/newsletter" 
              className="block mx-4 px-4 py-4 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-2xl font-semibold text-center mt-4 shadow-lg shadow-[#FF6B6B]/20"
              onClick={() => setMobileMenuOpen(false)}
            >
              Join the Adventure ✈️
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
