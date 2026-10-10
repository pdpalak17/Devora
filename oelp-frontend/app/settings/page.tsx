"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
      else router.push("/login");
    });
  }, [router, supabase]);

  const handleDelete = async () => {
    if (!user || deleteInput !== `delete "${user.email}"`) return;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }
      
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error: any) {
      alert("Error deleting account: " + error.message);
      setIsDeleting(false);
    }
  };

  if (!user) return <div className="min-h-screen bg-black text-white p-8 flex justify-center items-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 p-8 font-sans">
      <div className="max-w-2xl mx-auto mt-10">
        <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-6 transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        {/* Profile Info */}
        <div className="bg-[#2c2c2c] p-6 rounded-xl border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Email Address</p>
              <p className="text-lg font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">User ID</p>
              <p className="text-sm font-mono mt-1 text-gray-300">{user.id}</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/10 p-6 rounded-xl border border-red-500/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
          </div>
          
          <p className="text-gray-400 mb-4 text-sm leading-relaxed">
            Permanently delete your account. This action is irreversible. All of your data, including your lab sessions, test cases, and problem-solving progress will be permanently deleted. If you sign in again, you will be treated as a brand new user.
          </p>

          <div className="bg-black/50 p-4 rounded-lg mb-6 border border-gray-800">
            <p className="text-sm text-gray-300 mb-2">
              Please type <strong className="text-white select-all">delete "{user.email}"</strong> to confirm.
            </p>
            <input 
              type="text" 
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={`delete "${user.email}"`}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <button 
            onClick={handleDelete}
            disabled={isDeleting || deleteInput !== `delete "${user.email}"`}
            className="w-full bg-red-600/80 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Permanently Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
