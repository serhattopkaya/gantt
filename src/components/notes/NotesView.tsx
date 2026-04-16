import { useMemo, useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, ArrowDownUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';
import { fromISODate, localDayKey, shiftISO, todayISO } from '../../lib/dates';
import type { Project, ProjectNote } from '../../types';

interface NotesViewProps {
  project: Project;
}

type SortDir = 'desc' | 'asc';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDayLabel(dayKey: string): string {
  const today = todayISO();
  if (dayKey === today) return 'Today';
  if (dayKey === shiftISO(today, -1)) return 'Yesterday';
  const target = fromISODate(dayKey);
  const thisYear = fromISODate(today).getFullYear();
  return target.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: target.getFullYear() === thisYear ? undefined : 'numeric',
  });
}

export function NotesView({ project }: NotesViewProps) {
  const notes = useAppStore(s => s.notes);
  const addNote = useAppStore(s => s.addNote);
  const updateNote = useAppStore(s => s.updateNote);
  const deleteNote = useAppStore(s => s.deleteNote);
  const restoreNote = useAppStore(s => s.restoreNote);
  const pushToast = useToastStore(s => s.push);

  const [draft, setDraft] = useState('');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<ProjectNote | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingId && editTextareaRef.current) {
      const el = editTextareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editingId]);

  const projectNotes = useMemo(
    () => notes.filter(n => n.projectId === project.id),
    [notes, project.id]
  );

  const groups = useMemo(() => {
    const sorted = [...projectNotes].sort((a, b) => {
      const cmp = a.createdAt.localeCompare(b.createdAt);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    const byDay = new Map<string, ProjectNote[]>();
    for (const note of sorted) {
      const key = localDayKey(note.createdAt);
      const list = byDay.get(key);
      if (list) list.push(note);
      else byDay.set(key, [note]);
    }
    return Array.from(byDay.entries());
  }, [projectNotes, sortDir]);

  function handlePost() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    addNote({ projectId: project.id, body: trimmed });
    setDraft('');
  }

  function handleDraftKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePost();
    }
  }

  function startEdit(note: ProjectNote) {
    setEditingId(note.id);
    setEditDraft(note.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft('');
  }

  function saveEdit() {
    if (!editingId) return;
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    updateNote(editingId, trimmed);
    setEditingId(null);
    setEditDraft('');
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return;
    const removed = confirmDelete;
    deleteNote(removed.id);
    setConfirmDelete(null);
    pushToast({
      message: 'Note deleted.',
      action: {
        label: 'Undo',
        run: () => restoreNote(removed),
      },
    });
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <div className="bg-surface border border-border rounded-xl p-4 mb-6">
          <label htmlFor="note-draft" className="block text-xs font-medium text-text-muted mb-2">
            Add a note
          </label>
          <textarea
            id="note-draft"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleDraftKeyDown}
            placeholder={`What happened on ${project.name}? Decisions, progress, blockers…`}
            rows={3}
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-text-muted">⌘/Ctrl + Enter to post</span>
            <Button size="sm" onClick={handlePost} disabled={!draft.trim()}>
              Post
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Timeline
            <span className="ml-2 text-xs font-normal text-text-muted">
              {projectNotes.length} {projectNotes.length === 1 ? 'note' : 'notes'}
            </span>
          </h2>
          {projectNotes.length > 0 && (
            <button
              onClick={() => setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))}
              className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
              title="Toggle sort order"
            >
              <ArrowDownUp size={12} />
              {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
            </button>
          )}
        </div>

        {projectNotes.length === 0 ? (
          <EmptyState
            variant="no-tasks"
            description="Notes you add will appear here as a timeline of project activity."
          />
        ) : (
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border"
            />
            <div className="space-y-6">
              {groups.map(([dayKey, dayNotes]) => (
                <section key={dayKey}>
                  <div className="relative flex items-center mb-3 pl-6">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface border-2 border-border" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      {formatDayLabel(dayKey)}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {dayNotes.map(note => {
                      const isEditing = editingId === note.id;
                      const edited = note.updatedAt !== note.createdAt;
                      return (
                        <li key={note.id} className="relative pl-6">
                          <span
                            aria-hidden="true"
                            className="absolute left-[3px] top-3 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-surface"
                          />
                          <article className="group bg-surface border border-border rounded-lg p-3 hover:border-border-strong transition-colors">
                            <header className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs text-text-muted">
                                {formatTime(note.createdAt)}
                                {edited && !isEditing && (
                                  <span className="ml-2 text-text-muted" title={`Edited ${new Date(note.updatedAt).toLocaleString()}`}>
                                    · edited
                                  </span>
                                )}
                              </span>
                              {!isEditing && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEdit(note)}
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface-muted"
                                    title="Edit note"
                                    aria-label="Edit note"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(note)}
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="Delete note"
                                    aria-label="Delete note"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </header>
                            {isEditing ? (
                              <div>
                                <textarea
                                  ref={editTextareaRef}
                                  value={editDraft}
                                  onChange={e => setEditDraft(e.target.value)}
                                  onKeyDown={handleEditKeyDown}
                                  rows={3}
                                  className="w-full resize-y rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <div className="flex items-center justify-end gap-2 mt-2">
                                  <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                                  <Button size="sm" onClick={saveEdit} disabled={!editDraft.trim()}>Save</Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
                                {note.body}
                              </p>
                            )}
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this note?"
          description="This will remove the note from the timeline. You can undo from the toast."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
