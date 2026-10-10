"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Lock, Medal, Crown, Star, Flame, Shield, Gem, Rocket, Trophy, Zap, Ban, Upload, Palette } from "lucide-react";

const BADGE_OPTIONS = [
  { id: "crown", icon: <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" /> },
  { id: "star", icon: <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" /> },
  { id: "flame", icon: <Flame className="w-6 h-6 text-orange-500 fill-orange-500" /> },
  { id: "shield", icon: <Shield className="w-6 h-6 text-blue-500 fill-blue-500" /> },
  { id: "gem", icon: <Gem className="w-6 h-6 text-cyan-400 fill-cyan-400" /> },
  { id: "rocket", icon: <Rocket className="w-6 h-6 text-red-500 fill-red-500" /> },
  { id: "trophy", icon: <Trophy className="w-6 h-6 text-amber-500 fill-amber-500" /> },
  { id: "zap", icon: <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" /> }
];

const AVATAR_COLORS = [
  { id: "indigo", hex: "#6366f1" },
  { id: "rose", hex: "#f43f5e" },
  { id: "emerald", hex: "#10b981" },
  { id: "amber", hex: "#f59e0b" },
  { id: "cyan", hex: "#06b6d4" },
  { id: "violet", hex: "#8b5cf6" },
  { id: "pink", hex: "#ec4899" },
  { id: "sky", hex: "#0ea5e9" },
  { id: "orange", hex: "#f97316" },
  { id: "teal", hex: "#14b8a6" },
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarColor, setAvatarColor] = useState("indigo");
  const [badge, setBadge] = useState("");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setUsername(user.user_metadata?.username || "");
        setAvatarUrl(user.user_metadata?.avatar_url || "");
        setAvatarColor(user.user_metadata?.avatar_color || "indigo");
        setBadge(user.user_metadata?.badge || "");
      } else {
        router.push("/login");
      }
    });
  }, [router, supabase]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500_000) {
      setMessage("Error: Image must be under 500KB. Please use a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setMessage("");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    
    try {
      const updates: any = { data: { username, avatar_url: avatarUrl, avatar_color: avatarColor, badge } };
      
      if (password) {
        const { error: pwdError } = await supabase.auth.updateUser({ password });
        if (pwdError) throw pwdError;
      }
      
      const { error: metaError } = await supabase.auth.updateUser(updates);
      if (metaError) throw metaError;
      
      setMessage("Profile updated successfully!");
      setPassword("");
      
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      
    } catch (error: any) {
      setMessage("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const currentColor = AVATAR_COLORS.find(c => c.id === avatarColor) || AVATAR_COLORS[0];

  if (!user) return <div className="min-h-screen bg-[#1a1a1a] text-white p-8 flex justify-center items-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 p-6 md:p-10 font-sans">
      <div className="max-w-2xl mx-auto space-y-8 mt-10">
        <Link href="/problems" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        
        <h1 className="text-3xl font-bold text-white">Edit Profile</h1>

        {message && (
          <div className={`p-4 rounded-lg ${message.includes("Error") ? "bg-red-900/50 text-red-400 border border-red-500/50" : "bg-emerald-900/50 text-emerald-400 border border-emerald-500/50"}`}>
            {message}
          </div>
        )}

        <div className="bg-[#2c2c2c] p-6 rounded-2xl border border-gray-800 shadow-xl space-y-6">
          
          {/* Avatar Preview */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden shadow-lg border-4 border-[#1a1a1a]"
                style={{ backgroundColor: avatarUrl ? undefined : currentColor.hex }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (username || user.email)[0].toUpperCase()
                )}
              </div>
              {badge && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 drop-shadow-lg z-10 bg-[#2c2c2c] rounded-full flex items-center justify-center border border-gray-700">
                  {BADGE_OPTIONS.find(b => b.id === badge)?.icon}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{username || user.email.split("@")[0]}</h3>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="space-y-5 pt-6 border-t border-gray-700">
            {/* Username */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4" /> Username
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a cool username..."
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Profile Picture */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <Palette className="w-4 h-4" /> Profile Picture
              </label>

              {/* Solid Color Swatches */}
              <p className="text-xs text-gray-500 mb-2">Pick a solid color</p>
              <div className="flex flex-wrap gap-3 mb-4">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => { setAvatarColor(color.id); setAvatarUrl(""); }}
                    className={`w-10 h-10 rounded-full transition-all ${!avatarUrl && avatarColor === color.id ? "ring-2 ring-white scale-110" : "hover:scale-105 ring-1 ring-gray-700"}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.id}
                  />
                ))}
              </div>

              {/* File Upload */}
              <p className="text-xs text-gray-500 mb-2">Or upload an image (max 500KB)</p>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-[#1a1a1a] border border-gray-700 hover:border-gray-500 rounded-lg px-4 py-3 text-sm text-gray-300 hover:text-white transition w-full"
              >
                <Upload className="w-4 h-4" />
                {avatarUrl ? "Change uploaded picture" : "Upload a picture"}
              </button>
              {avatarUrl && (
                <button
                  onClick={() => setAvatarUrl("")}
                  className="text-xs text-red-400 hover:text-red-300 mt-2 transition"
                >
                  Remove uploaded picture (use solid color instead)
                </button>
              )}
            </div>

            {/* Profile Badge */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <Medal className="w-4 h-4" /> Profile Badge
              </label>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setBadge("")}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${badge === "" ? "bg-indigo-600 ring-2 ring-indigo-400" : "bg-[#1a1a1a] border border-gray-700 hover:border-gray-500"}`}
                  title="No Badge"
                >
                  <Ban className="w-6 h-6 text-gray-400" />
                </button>
                {BADGE_OPTIONS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBadge(b.id)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${badge === b.id ? "bg-indigo-600 ring-2 ring-indigo-400 scale-110" : "bg-[#1a1a1a] border border-gray-700 hover:border-gray-500 hover:scale-105"}`}
                    title={b.id}
                  >
                    {b.icon}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Select a badge to overlay on your profile picture!</p>
            </div>

            {/* Password */}
            <div className="pt-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Lock className="w-4 h-4" /> Change Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="pt-6">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
