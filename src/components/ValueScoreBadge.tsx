"use client";

import { Sparkles, TrendingUp, Star } from "lucide-react";

interface ValueScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ValueScoreBadge({ score, size = "md", showLabel = false }: ValueScoreBadgeProps) {
  const getStyle = () => {
    if (score >= 90) return {
      bg: "bg-gradient-to-r from-[#20B2AA] to-[#48D1CC]",
      shadow: "shadow-[#20B2AA]/30",
      label: "Incredible",
      emoji: "🤩"
    };
    if (score >= 70) return {
      bg: "bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A]",
      shadow: "shadow-[#FF6B6B]/30",
      label: "Great Value",
      emoji: "😎"
    };
    if (score >= 50) return {
      bg: "bg-gradient-to-r from-[#FFA07A] to-[#FFD93D]",
      shadow: "shadow-[#FFA07A]/30",
      label: "Good",
      emoji: "👍"
    };
    return {
      bg: "bg-gradient-to-r from-[#DEB887] to-[#F5DEB3]",
      shadow: "",
      label: "Fair",
      emoji: "👌",
      textDark: true
    };
  };
  
  const style = getStyle();
  
  const sizeClasses = {
    sm: "text-xs px-2.5 py-1",
    md: "text-sm px-3.5 py-1.5",
    lg: "text-base px-4 py-2"
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };
  
  return (
    <div className={`${style.bg} ${style.shadow} ${sizeClasses[size]} ${style.textDark ? 'text-[#2D3436]' : 'text-white'} font-bold rounded-full flex items-center gap-1.5 shadow-lg`}>
      <Sparkles className={iconSizes[size]} />
      <span>{score}</span>
      {showLabel && <span className="font-medium opacity-90">{style.label}</span>}
    </div>
  );
}

export function ValueScoreExplainer({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-[#2D3436] to-[#4A5154] rounded-3xl p-7 text-white ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 text-[#FFD93D]" />
        </div>
        <h3 className="font-bold text-lg">Value Score</h3>
      </div>
      
      <p className="text-white/70 text-sm mb-6 leading-relaxed">
        Our proprietary score (0-100) identifies truly exceptional deals by comparing prices to historical data.
      </p>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#20B2AA] to-[#48D1CC] rounded-lg flex items-center justify-center text-xs font-bold">
              90+
            </div>
            <span className="text-sm font-medium">Incredible 🤩</span>
          </div>
          <span className="text-xs text-white/50">Book now!</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] rounded-lg flex items-center justify-center text-xs font-bold">
              70+
            </div>
            <span className="text-sm font-medium">Great Value 😎</span>
          </div>
          <span className="text-xs text-white/50">Worth it</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#FFA07A] to-[#FFD93D] rounded-lg flex items-center justify-center text-xs font-bold text-[#2D3436]">
              50+
            </div>
            <span className="text-sm font-medium">Good 👍</span>
          </div>
          <span className="text-xs text-white/50">Solid savings</span>
        </div>
      </div>
      
      <a 
        href="/about#value-score" 
        className="mt-6 text-sm text-[#20B2AA] hover:text-[#48D1CC] font-medium flex items-center gap-1.5 transition-colors"
      >
        Learn more
        <TrendingUp className="w-4 h-4" />
      </a>
    </div>
  );
}
