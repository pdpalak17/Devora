import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileDropdown from "@/app/component/ProfileDropdown";

// 🚨 FORCE DYNAMIC RENDERING
export const revalidate = 0;

export default async function StudentDashboard() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch Labs
  const { data: labs } = await supabase
    .from("lab_sections")
    .select("*, questions(id)")
    .order("created_at", { ascending: true });

  // Fetch Progress
  // 🚨 Fix: Fetch ALL statuses, not just completed, to debug if needed
  const { data: progress } = await supabase
    .from("student_progress")
    .select("question_id, status")
    .eq("student_id", user.id);

  const getLabStats = (labId: string, questions: any[]) => {
    if (!questions || questions.length === 0) return { completed: 0, total: 0 };

    // 🚨 Fix: Convert ALL IDs to strings for safe comparison
    const labQuestionIds = questions.map((q) => String(q.id));
    
    const completedCount = progress?.filter(p => 
        labQuestionIds.includes(String(p.question_id)) && 
        p.status === 'Completed'
    ).length || 0;

    return { 
        completed: Math.min(completedCount, questions.length), 
        total: questions.length 
    };
  };

  return (
    <>
    <div className="bg-[#1a1a1a] min-h-screen font-sans">
      <nav className="bg-[#2c2c2c] border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-8 h-16 flex justify-between items-center">
          <div className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-amber-500">{"</>"}</span> Devora
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/problems/leaderboard" className="text-sm font-medium text-gray-300 hover:text-amber-500 transition-colors">
              Leaderboard
            </Link>
            <div className="w-px h-6 bg-gray-700 mx-2"></div>
            <ProfileDropdown 
              email={user.email || "Student"} 
              username={user.user_metadata?.username} 
              avatarUrl={user.user_metadata?.avatar_url} 
              avatarColor={user.user_metadata?.avatar_color}
              badge={user.user_metadata?.badge}
            />
          </div>
        </div>
      </nav>

    <div className="max-w-5xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-100">My Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="text-blue-800 font-medium">Total Attempted</h3>
          <p className="text-3xl font-bold text-blue-900">{progress?.length || 0}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
          <h3 className="text-green-800 font-medium">Completed</h3>
          <p className="text-3xl font-bold text-green-900">
            {progress?.filter(p => p.status === 'Completed').length || 0}
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
          <h3 className="text-purple-800 font-medium">Available Labs</h3>
          <p className="text-3xl font-bold text-purple-900">{labs?.length || 0}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 text-white">Available Lab Sections</h2>
      <div className="grid gap-6">
        {labs?.map((lab) => {
          const stats = getLabStats(lab.id, lab.questions);
          const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          
          return (
            <Link 
              href={`/problems/${lab.id}`} 
              key={lab.id}
              className="block bg-black border rounded-xl p-6 hover:shadow-lg transition group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl text-white font-bold group-hover:text-violet-400">{lab.title}</h3>
                  <p className="text-gray-500 mt-1">{lab.description}</p>
                </div>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                  {stats.total} Questions
                </span>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                  <span>Progress</span>
                  <span>{percent}% ({stats.completed}/{stats.total})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                        percent === 100 ? 'bg-green-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
    </div>
    </>
  );
}