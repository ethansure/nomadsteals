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
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Custom Logo Icon */}
      <div className={`${iconSizes[size]} relative`}>
        <svg viewBox="0 0 40 40" className="w-full h-full">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="planeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          
          {/* Background circle */}
          <circle cx="20" cy="20" r="18" fill="url(#logoGradient)" />
          
          {/* Stylized plane */}
          <path 
            d="M12 22L18 16L28 14L30 16L22 20L26 28L24 30L18 24L14 26L12 22Z" 
            fill="url(#planeGradient)"
          />
          
          {/* Trail/sparkle */}
          <circle cx="10" cy="26" r="2" fill="#FBBF24" opacity="0.6" />
          <circle cx="8" cy="30" r="1.5" fill="#FBBF24" opacity="0.4" />
        </svg>
      </div>
      
      {/* Wordmark */}
      <div className="flex flex-col">
        <span className={`font-bold tracking-tight ${sizeClasses[size]}`}>
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Nomad
          </span>
          <span className="text-amber-500">Steals</span>
        </span>
        {showTagline && (
          <span className="text-xs text-gray-500 -mt-1">Travel deals that score big</span>
        )}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="hover:opacity-90 transition-opacity">
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
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="planeGradientIcon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#logoGradientIcon)" />
      <path 
        d="M12 22L18 16L28 14L30 16L22 20L26 28L24 30L18 24L14 26L12 22Z" 
        fill="url(#planeGradientIcon)"
      />
      <circle cx="10" cy="26" r="2" fill="#FBBF24" opacity="0.6" />
      <circle cx="8" cy="30" r="1.5" fill="#FBBF24" opacity="0.4" />
    </svg>
  );
}
