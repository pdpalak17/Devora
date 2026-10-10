"use client";

import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/app/component/LogoutButton";
import ProfileDropdown from "@/app/component/ProfileDropdown";
import ConfirmationModal from "@/app/component/ConfirmationModal";
// Icons
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;


export default function ProfessorDashboard() {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userMetadata, setUserMetadata] = useState<any>(null);
  
  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [labToDelete, setLabToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserEmail(user.email || "");
    setUserMetadata(user.user_metadata || {});

    const { data } = await supabase
      .from("lab_sections")
      .select("*, questions(count)")
      .eq("professor_id", user.id)
      .order("created_at", { ascending: false });
    
    setLabs(data || []);
    setLoading(false);
  };

  const handleCreateLab = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("lab_sections").insert({
      title: formData.get("title"),
      description: formData.get("description"),
      professor_id: user?.id,
    });
    
    if (error) {
      console.error("Error creating lab:", error);
      alert("Failed to create lab: " + error.message);
      return;
    }

    // Reset form and refetch
    (e.target as HTMLFormElement).reset();
    fetchLabs();
  };

  const openDeleteModal = (lab: any) => {
    setLabToDelete(lab);
    setIsDeleteOpen(true);
  };

  const handleDeleteLab = async () => {
    if (!labToDelete) return;
    setDeleteLoading(true);
    
    try {
      // Cascading delete handled by DB constraints
      const { error } = await supabase
        .from("lab_sections")
        .delete()
        .eq("id", labToDelete.id);

      if (error) throw error;
      
      setIsDeleteOpen(false);
      fetchLabs(); // Refresh list
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="font-bold text-xl text-gray-900 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
            LabAdmin
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/Analytics" 
              className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-amber-200"
            >
              <ChartIcon /> Global Analytics
            </Link>
            <ProfileDropdown 
              email={userEmail || "Professor"} 
              username={userMetadata?.username}
              avatarUrl={userMetadata?.avatar_url}
              avatarColor={userMetadata?.avatar_color}
              badge={userMetadata?.badge}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PlusIcon /> New Lab Section
              </h2>
              <form onSubmit={handleCreateLab} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input name="title" required placeholder="e.g. Week 1: Python Basics" className="text-black w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea name="description" rows={3} placeholder="Topics covered..." className="text-black w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  Create Section
                </button>
              </form>
            </div>
          </div>

          {/* Lab List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Active Sections</h2>
            {labs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                No labs created yet. Start by adding one on the left.
              </div>
            ) : (
              <div className="grid gap-4">
                {labs.map((lab) => (
                  <div key={lab.id} className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between gap-4 relative overflow-hidden">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-gray-900">{lab.title}</h3>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {lab.questions[0].count} Questions
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{lab.description}</p>
                      <div className="text-xs text-gray-400 mt-3 font-mono">
                        Created: {new Date(lab.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:self-center">
                      <button 
                        onClick={() => openDeleteModal(lab)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Lab"
                      >
                        <TrashIcon />
                      </button>
                      <Link 
                        href={`/admin/labs/${lab.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                      >
                        Manage <ArrowRightIcon />
                      </Link>
                      <Link
                        href={`/admin/Analytics?labId=${lab.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <ChartIcon /> Analytics
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isDeleteOpen}
        title={`Delete ${labToDelete?.title}?`}
        message={
          <div className="space-y-2">
            <p>This action cannot be undone. This will permanently delete:</p>
            <ul className="list-disc list-inside ml-2 space-y-1 font-medium">
              <li>The lab section itself</li>
              <li>All {labToDelete?.questions[0].count} associated questions</li>
              <li>All test cases and student submissions</li>
            </ul>
          </div>
        }
        confirmText={labToDelete?.title}
        onConfirm={handleDeleteLab}
        onCancel={() => setIsDeleteOpen(false)}
        isLoading={deleteLoading}
      />
    </div>
  );
}
