"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Settings, LogOut, ChevronDown, User, Crown, Star, Flame, Shield, Gem, Rocket, Trophy, Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const BADGE_ICONS: Record<string, JSX.Element> = {
  crown: <Crown className="w-full h-full text-yellow-400 fill-yellow-400" />,
  star: <Star className="w-full h-full text-yellow-400 fill-yellow-400" />,
  flame: <Flame className="w-full h-full text-orange-500 fill-orange-500" />,
  shield: <Shield className="w-full h-full text-blue-500 fill-blue-500" />,
  gem: <Gem className="w-full h-full text-cyan-400 fill-cyan-400" />,
  rocket: <Rocket className="w-full h-full text-red-500 fill-red-500" />,
  trophy: <Trophy className="w-full h-full text-amber-500 fill-amber-500" />,
  zap: <Zap className="w-full h-full text-yellow-300 fill-yellow-300" />
};

const AVATAR_COLORS: Record<string, string> = {
  indigo: "#6366f1", rose: "#f43f5e", emerald: "#10b981", amber: "#f59e0b",
  cyan: "#06b6d4", violet: "#8b5cf6", pink: "#ec4899", sky: "#0ea5e9",
  orange: "#f97316", teal: "#14b8a6"
};

export default function ProfileDropdown({ email, username, avatarUrl, avatarColor, badge }: { email: string, username?: string, avatarUrl?: string, avatarColor?: string, badge?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const displayName = username || email.split("@")[0];
  const avatarBg = AVATAR_COLORS[avatarColor || "indigo"] || AVATAR_COLORS.indigo;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white px-3 py-1.5 rounded-full transition-colors border border-gray-700"
      >
        <div className="relative">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ring-1 ring-gray-700" style={{ backgroundColor: avatarUrl ? undefined : avatarBg }}>
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : email[0].toUpperCase()}
          </div>
          {badge && BADGE_ICONS[badge] && (
            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 drop-shadow-md z-10 bg-[#2c2c2c] rounded-full flex items-center justify-center p-[2px] border border-gray-600">
              {BADGE_ICONS[badge]}
            </div>
          )}
        </div>
        <span className="text-sm font-medium hidden md:inline-block max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-[#2c2c2c] rounded-xl shadow-2xl border border-gray-700 py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 pb-4 border-b border-gray-700 flex items-center gap-3">
             <div className="relative">
               <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm ring-2 ring-indigo-400 overflow-hidden" style={{ backgroundColor: avatarUrl ? undefined : avatarBg }}>
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : email[0].toUpperCase()}
              </div>
              {badge && BADGE_ICONS[badge] && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 drop-shadow-md z-10 bg-[#2c2c2c] rounded-full flex items-center justify-center p-[3px] border border-gray-600">
                  {BADGE_ICONS[badge]}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white truncate max-w-[150px]">{displayName}</p>
              <p className="text-xs text-amber-500 font-medium cursor-pointer hover:text-amber-400">Access all features with our Premium subscription!</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 px-4 py-4 border-b border-gray-700">
            <Link href="/lists" className="flex flex-col items-center justify-center bg-[#3c3c3c] hover:bg-[#4c4c4c] p-3 rounded-xl transition-colors cursor-pointer group">
              <div className="w-8 h-8 bg-blue-100 rounded text-blue-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">📋</div>
              <span className="text-[11px] text-gray-300 font-medium">My Lists</span>
            </Link>
            <Link href="/notebook" className="flex flex-col items-center justify-center bg-[#3c3c3c] hover:bg-[#4c4c4c] p-3 rounded-xl transition-colors cursor-pointer group">
              <div className="w-8 h-8 bg-blue-500 rounded text-white flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">📘</div>
              <span className="text-[11px] text-gray-300 font-medium">Notebook</span>
            </Link>
            <Link href="/progress" className="flex flex-col items-center justify-center bg-[#3c3c3c] hover:bg-[#4c4c4c] p-3 rounded-xl transition-colors cursor-pointer group border border-emerald-500/30">
              <div className="w-8 h-8 bg-emerald-100 rounded-full text-emerald-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">🥧</div>
              <span className="text-[11px] text-emerald-400 font-medium">Progress</span>
            </Link>
          </div>

          <div className="py-2">
            <Link href="/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#3c3c3c] transition-colors">
              <User className="w-4 h-4 text-gray-400" /> My Profile
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#3c3c3c] transition-colors">
              <Settings className="w-4 h-4 text-gray-400" /> Settings
            </Link>
          </div>

          <div className="border-t border-gray-700 pt-2 mt-1">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-gray-300 hover:text-red-400 hover:bg-[#3c3c3c] transition-colors"
            >
              <LogOut className="w-4 h-4 text-gray-400" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
