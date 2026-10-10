import { createClient } from "@/utils/supabase/server"; // Server client!
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = createClient();

  // 1. Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 3. If user exists, get their role from the 'profiles' table
  let { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("Profile not found, creating a new one...", error);
    
    // Check user_metadata for role (set during professor signup)
    const metadataRole = user.user_metadata?.role;
    const assignedRole = metadataRole === "professor" ? "professor" : "student";
    
    // Auto-create profile if it doesn't exist
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert([{ id: user.id, role: assignedRole }])
      .select("role")
      .single();

    if (insertError || !newProfile) {
      console.error("Error creating profile:", insertError);
      redirect("/login");
    }
    
    // Use the newly created profile
    profile = newProfile;
  }

  // 4. Redirect based on role
  if (profile.role === "professor") {
    redirect("/admin/upload");
  } else {
    redirect("/problems");
  }

  // This part is never reached, but good practice.
  return (
    <div>
      <p>Loading... redirecting you to your dashboard.</p>
    </div>
  );
}
