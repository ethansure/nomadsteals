import Link from "next/link";
import Image from "next/image";

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
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 56, height: 56 },
  };

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo Image */}
      <Image
        src="/images/logo-192.png"
        alt="NomadSteals"
        width={iconSizes[size].width}
        height={iconSizes[size].height}
        className="rounded-lg"
        priority
      />
      
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
    <Image
      src="/images/logo-192.png"
      alt="NomadSteals"
      width={32}
      height={32}
      className={`rounded-lg ${className}`}
    />
  );
}
