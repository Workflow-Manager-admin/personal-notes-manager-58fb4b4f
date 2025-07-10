export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

/**
 * PUBLIC_INTERFACE
 * Get the list of all notes from Supabase.
 */
export async function getNotes(): Promise<Note[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notes?select=*`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY!}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Failed to fetch notes");
  const data = await res.json();
  // Most recent first
  return data.sort?.((a: Note, b: Note) => b.created_at.localeCompare(a.created_at)) || [];
}

/**
 * PUBLIC_INTERFACE
 * Create a new note with given title and content.
 */
export async function createNote(
  content: string,
  title?: string
): Promise<Note> {
  const nonNullTitle =
    (typeof title === "string" && title.trim() !== "" ? title : "Untitled Note");
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notes`,
    {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({ title: nonNullTitle, content }),
    }
  );
  // Surface more information about API errors
  const data = await res.json().catch(() => undefined);
  if (!res.ok) {
    // Supabase REST responses usually look like { error: "...", ... }
    const errMsg =
      (data && data.message) ||
      (data && data.error) ||
      JSON.stringify(data) ||
      "Failed to create note (no response details)";
    throw new Error(`Failed to create note: ${errMsg}`);
  }
  if (!Array.isArray(data) || !data[0]) {
    throw new Error(
      `Supabase response did not return the new note as expected. Raw response: ${JSON.stringify(data)}`
    );
  }
  return data[0];
}

/**
 * PUBLIC_INTERFACE
 * Update note content by note id.
 */
export async function updateNote(id: string, content: string): Promise<Note> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notes?id=eq.${id}`,
    {
      method: "PATCH",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ content }),
    }
  );
  if (!res.ok) throw new Error("Failed to update note");
  const data = await res.json();
  return data[0];
}

/**
 * PUBLIC_INTERFACE
 * Delete a note by id.
 */
export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notes?id=eq.${id}`,
    {
      method: "DELETE",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY!}`,
      },
    }
  );
  if (!res.ok) throw new Error("Failed to delete note");
}
