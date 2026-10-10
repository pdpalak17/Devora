"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus, Trash2, Save } from "lucide-react";

type Note = {
  id: string;
  title: string;
  content: string;
  date: string;
};

export default function NotebookPage() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Load notes from Supabase user metadata
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        const userNotes = user.user_metadata?.notebook || [];
        setNotes(userNotes);
        if (userNotes.length > 0) {
          setActiveNote(userNotes[0]);
        }
      } else {
        router.push("/login");
      }
    });
  }, [router, supabase]);

  const setActiveNote = (note: Note) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const createNewNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      date: new Date().toLocaleDateString()
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNote(newNote);
    saveNotesToDatabase(updatedNotes);
  };

  const saveCurrentNote = async () => {
    if (!activeNoteId) return;
    setIsSaving(true);
    
    const updatedNotes = notes.map(n => 
      n.id === activeNoteId ? { ...n, title: title || "Untitled Note", content } : n
    );
    
    setNotes(updatedNotes);
    await saveNotesToDatabase(updatedNotes);
    setIsSaving(false);
  };

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    if (activeNoteId === id) {
      if (updatedNotes.length > 0) setActiveNote(updatedNotes[0]);
      else {
        setActiveNoteId(null);
        setTitle("");
        setContent("");
      }
    }
    await saveNotesToDatabase(updatedNotes);
  };

  const saveNotesToDatabase = async (updatedNotes: Note[]) => {
    try {
      await supabase.auth.updateUser({
        data: { notebook: updatedNotes }
      });
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  };

  if (!user) return <div className="min-h-screen bg-[#1a1a1a] text-white p-8 flex justify-center items-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 font-sans flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#2c2c2c] px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/problems" className="text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <BookOpen className="w-6 h-6 text-blue-500" />
            My Notebook
          </div>
        </div>
        <button 
          onClick={createNewNote}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 max-w-sm border-r border-gray-800 bg-[#1e1e1e] overflow-y-auto flex flex-col p-4 gap-2">
          {notes.length === 0 ? (
            <p className="text-gray-500 text-center mt-10 text-sm">No notes yet. Create one!</p>
          ) : (
            notes.map(note => (
              <div 
                key={note.id}
                onClick={() => setActiveNote(note)}
                className={`p-4 rounded-xl cursor-pointer border transition-colors group ${activeNoteId === note.id ? "bg-[#2c2c2c] border-blue-500/50" : "bg-[#1a1a1a] border-gray-800 hover:border-gray-600"}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-white truncate pr-4">{note.title}</h3>
                  <button 
                    onClick={(e) => deleteNote(note.id, e)}
                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 truncate">{note.content || "Empty note..."}</p>
                <p className="text-[10px] text-gray-600 mt-3">{note.date}</p>
              </div>
            ))
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 bg-[#1a1a1a] flex flex-col">
          {activeNoteId ? (
            <>
              <div className="px-8 py-6 border-b border-gray-800 flex justify-between items-center">
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title"
                  className="bg-transparent text-2xl font-bold text-white focus:outline-none w-full mr-4"
                />
                <button 
                  onClick={saveCurrentNote}
                  disabled={isSaving}
                  className="bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border border-gray-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your notes, algorithms, or code snippets here..."
                className="flex-1 bg-transparent text-gray-300 p-8 focus:outline-none resize-none font-mono text-sm leading-relaxed"
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <BookOpen className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a note or create a new one to start writing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
