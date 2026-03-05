import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  linkToHome?: boolean;
}

export function Logo({ className = "", size = "md", showTagline = false, linkToHome = true }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };
  
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-14 h-14",
  };

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Custom Logo Icon - Sunset/Tropical Theme */}
      <div className={`${iconSizes[size]} relative`}>
        <svg viewBox="0 0 40 40" className="w-full h-full">
          {/* Gradient definitions - Warm Sunset Colors */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="50%" stopColor="#FFA07A" />
              <stop offset="100%" stopColor="#FFD93D" />
            </linearGradient>
            <linearGradient id="planeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#20B2AA" />
              <stop offset="100%" stopColor="#48D1CC" />
            </linearGradient>
            <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FFD93D" />
            </linearGradient>
          </defs>
          
          {/* Background circle - Sunset gradient */}
          <circle cx="20" cy="20" r="18" fill="url(#logoGradient)" />
          
          {/* Stylized plane - Ocean teal */}
          <path 
            d="M12 22L18 16L28 14L30 16L22 20L26 28L24 30L18 24L14 26L12 22Z" 
            fill="url(#planeGradient)"
          />
          
          {/* Trail/sparkle - White/Gold */}
          <circle cx="10" cy="26" r="2" fill="url(#sparkleGradient)" opacity="0.9" />
          <circle cx="8" cy="30" r="1.5" fill="#FFD93D" opacity="0.6" />
          <circle cx="6" cy="28" r="1" fill="#FFFFFF" opacity="0.5" />
        </svg>
      </div>
      
      {/* Wordmark */}
      <div className="flex flex-col">
        <span className={`font-bold tracking-tight ${sizeClasses[size]}`}>
          <span className="bg-gradient-to-r from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D] bg-clip-text text-transparent">
            Nomad
          </span>
          <span className="text-[#20B2AA]">Steals</span>
        </span>
        {showTagline && (
          <span className="text-xs text-[#2D3436]/60 -mt-0.5 tracking-wide">Find your next escape</span>
        )}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="hover:opacity-90 transition-opacity duration-300">
        {content}
      </Link>
    );
  }
  
  return content;
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`w-8 h-8 ${className}`}>
      <defs>
        <linearGradient id="logoGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="50%" stopColor="#FFA07A" />
          <stop offset="100%" stopColor="#FFD93D" />
        </linearGradient>
        <linearGradient id="planeGradientIcon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#20B2AA" />
          <stop offset="100%" stopColor="#48D1CC" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#logoGradientIcon)" />
      <path 
        d="M12 22L18 16L28 14L30 16L22 20L26 28L24 30L18 24L14 26L12 22Z" 
        fill="url(#planeGradientIcon)"
      />
      <circle cx="10" cy="26" r="2" fill="#FFFFFF" opacity="0.8" />
      <circle cx="8" cy="30" r="1.5" fill="#FFD93D" opacity="0.6" />
    </svg>
  );
}
