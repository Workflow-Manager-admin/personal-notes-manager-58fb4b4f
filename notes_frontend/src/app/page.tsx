"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Note, createNote, deleteNote, getNotes, updateNote } from "@/supabase/notes";

const COLORS = {
  primary: "#4F46E5",
  secondary: "#A5B4FC",
  accent: "#F59E42",
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Fetch all notes
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNotes();
      setNotes(result);
      if (selectedId && !result.some((n) => n.id === selectedId)) {
        setSelectedId(null);
        setEditingNote(null);
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message || "Failed to fetch notes.");
      } else {
        setError("Failed to fetch notes.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // On select note
  const selectNote = (id: string) => {
    setSelectedId(id);
    const note = notes.find((n) => n.id === id) || null;
    setEditingNote(note ? { ...note } : null);
    // Focus the textarea after a tick
    setTimeout(() => {
      editorRef.current?.focus();
    }, 100);
  };

  // On create note
  const handleCreateNew = async () => {
    setSaveLoading(true);
    setError(null);
    try {
      const note = await createNote("");
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
      setEditingNote({ ...note });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message || "Failed to create note.");
      } else {
        setError("Failed to create note.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  // On delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this note?")) return;
    setSaveLoading(true);
    setError(null);
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setEditingNote(null);
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message || "Delete failed.");
      } else {
        setError("Delete failed.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  // On save
  const handleSave = async () => {
    if (!editingNote) return;
    setSaveLoading(true);
    setError(null);
    try {
      const updated = await updateNote(editingNote.id, editingNote.content);
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)),
      );
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message || "Save failed.");
      } else {
        setError("Save failed.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle editing
  const updateContent = (val: string) => {
    setEditingNote((prev) => (prev ? { ...prev, content: val } : null));
  };

  // For minimalistic feel, show first 2 lines and highlight active note
  function renderSidebar() {
    return (
      <aside
        style={{
          borderRight: `1px solid #e2e8f0`,
          minWidth: 260,
          maxWidth: 340,
          background: "#f8fafc",
          height: "100%",
        }}
        className="flex flex-col"
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "#e2e8f0", background: COLORS.primary, color: "white" }}
        >
          <span style={{ fontWeight: 600, fontSize: 18 }}>My Notes</span>
          <button
            aria-label="New note"
            title="New note"
            onClick={handleCreateNew}
            style={{
              background: COLORS.accent,
              color: "#fff",
              borderRadius: 5,
              padding: "2px 10px",
              fontWeight: 500,
              fontSize: 20,
            }}
            disabled={saveLoading}
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : notes.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No notes. Create one!</div>
          ) : (
            <ul>
              {notes.map((n) => (
                <li
                  key={n.id}
                  className={classNames(
                    "cursor-pointer select-none px-4 py-2 border-b border-gray-100 text-sm truncate",
                    selectedId === n.id
                      ? "bg-white font-semibold shadow outline outline-1 outline-primary"
                      : "hover:bg-gray-100"
                  )}
                  style={
                    selectedId === n.id
                      ? {
                          borderLeft: `3px solid ${COLORS.primary}`,
                          background: "#fff",
                        }
                      : {}
                  }
                  onClick={() => selectNote(n.id)}
                  title={n.content ? n.content.slice(0, 32) : "Empty note"}
                >
                  {(n.content || "Untitled").trim().split("\n").slice(0, 2).join(" ").slice(0, 38) || <span className="italic text-gray-400">Empty</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    );
  }

  function renderDetail() {
    if (!selectedId || !editingNote) {
      return (
        <div
          className="flex flex-col h-full items-center justify-center"
          style={{ color: "#888" }}
        >
          <span className="mb-2" style={{ fontSize: 22 }}>Select a note</span>
          <span style={{ fontSize: 15 }}>Or create a new one</span>
        </div>
      );
    }
    return (
      <section className="flex flex-col h-full" style={{ height: "100%" }}>
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-b" style={{ borderColor: "#e2e8f0" }}>
          <span style={{ color: COLORS.primary, fontWeight: 500, fontSize: 17 }}>Note</span>
          <div className="flex gap-2">
            <button
              aria-label="Save"
              onClick={handleSave}
              disabled={saveLoading}
              style={{
                background: COLORS.primary,
                color: "#fff",
                borderRadius: 6,
                fontWeight: 500,
                fontSize: 14,
                padding: "5px 18px",
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? "not-allowed" : "pointer",
              }}
            >Save</button>
            <button
              aria-label="Delete"
              onClick={() => editingNote && handleDelete(editingNote.id)}
              style={{
                background: "#fff",
                color: COLORS.accent,
                borderRadius: 6,
                fontWeight: 500,
                fontSize: 14,
                border: `1.5px solid ${COLORS.accent}`,
                padding: "5px 18px",
                marginLeft: 8,
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? "not-allowed" : "pointer",
              }}
              disabled={saveLoading}
            >Delete</button>
          </div>
        </div>
        <textarea
          ref={editorRef}
          rows={18}
          className="flex-1 p-6 font-mono text-base resize-none outline-none"
          style={{
            minHeight: "180px",
            border: "none",
            borderRadius: 0,
            background: "#fff",
            color: "#222",
            fontSize: 16,
            letterSpacing: "0.01em",
            width: "100%",
          }}
          value={editingNote.content}
          onChange={e => updateContent(e.target.value)}
          disabled={saveLoading}
          aria-label="Note content editor"
        />
      </section>
    );
  }

  return (
    <div
      className="h-screen w-screen"
      style={{
        background: "#f6f8fb",
        color: "#222",
        fontFamily: "var(--font-geist-sans), Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: COLORS.primary,
          color: "#fff",
          fontWeight: "bold",
          padding: "18px 0 18px 36px",
          fontSize: 28,
          letterSpacing: "-0.5px",
        }}
      >
        🔖 Personal Notes
      </header>
      <main
        className="flex h-[calc(100vh-62px)]"
        style={{ minHeight: "calc(100vh - 58px)" }}
      >
        {renderSidebar()}
        <div
          className="flex-1 h-full"
          style={{
            background: "#fff",
            minWidth: 320,
            height: "100%",
            overflowY: "auto",
            borderLeft: `1px solid #f3f4f6`,
          }}
        >
          {error && (
            <div
              className="px-6 py-4 bg-[#fffbe9] text-[#ab4000] border-b"
              style={{ borderColor: COLORS.accent }}
            >
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-3 text-xs text-gray-500 underline"
                style={{ background: "none", border: "none" }}
              >
                Dismiss
              </button>
            </div>
          )}
          {renderDetail()}
        </div>
      </main>
      <footer className="text-center text-xs text-gray-400 py-3 bg-transparent">
        <span>
          Minimal notes manager &middot; Powered by <a href="https://supabase.com/" style={{ color: COLORS.primary }} target="_blank" rel="noopener noreferrer">Supabase</a>
        </span>
      </footer>
    </div>
  );
}
