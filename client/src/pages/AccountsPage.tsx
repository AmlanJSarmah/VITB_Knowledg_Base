import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen, ArrowLeft, Trash2, FileText, BookMarked, GraduationCap,
  LoaderCircle, AlertCircle, CheckCircle2, Library, ExternalLink,
} from "lucide-react";
import {
  getBooks, getNotes, getQuestionPapers,
  deleteBook, deleteNote, deleteQuestionPaper,
  formatDate, formatFileSize,
} from "@/lib/api";
import type { Book, Note, QuestionPaper, PaginatedResponse } from "@/lib/api";

type OwnedResource =
  | (Book & { kind: "books" })
  | (Note & { kind: "notes" })
  | (QuestionPaper & { kind: "question-papers" });

async function getAllPages<T>(fetchPage: (page: number) => Promise<PaginatedResponse<T>>): Promise<T[]> {
  const first = await fetchPage(1);
  const remaining = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) => fetchPage(index + 2)),
  );
  return [
    ...first.data,
    ...remaining.flatMap((page) => page.data),
  ];
}

export const AccountsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [resources, setResources] = useState<OwnedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const userId = user.id;
      const [papers, notes, books] = await Promise.all([
        getAllPages((page) => getQuestionPapers({ userId, page, limit: 100 })),
        getAllPages((page) => getNotes({ userId, page, limit: 100 })),
        getAllPages((page) => getBooks({ userId, page, limit: 100 })),
      ]);
      const combined: OwnedResource[] = [
        ...papers.map((item) => ({ ...item, kind: "question-papers" as const })),
        ...notes.map((item) => ({ ...item, kind: "notes" as const })),
        ...books.map((item) => ({ ...item, kind: "books" as const })),
      ];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setResources(combined);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your uploads.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(loadResources);
  }, [loadResources]);

  const removeResource = async (resource: OwnedResource) => {
    const name = resource.kind === "books" ? resource.title : resource.fileName;
    if (!window.confirm(`Delete “${name}” from your uploads? This cannot be undone.`)) return;
    setDeletingId(resource.id);
    setError("");
    setNotice("");
    try {
      if (resource.kind === "books") await deleteBook(resource.id);
      else if (resource.kind === "notes") await deleteNote(resource.id);
      else await deleteQuestionPaper(resource.id);
      setResources((current) => current.filter((item) => item.id !== resource.id));
      setNotice("Resource deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete this resource.");
    } finally {
      setDeletingId(null);
    }
  };

  const kindLabel = (resource: OwnedResource) => resource.kind === "books"
    ? "Book"
    : resource.kind === "notes" ? "Lecture note" : "Question paper";
  const resourceName = (resource: OwnedResource) => resource.kind === "books" ? resource.title : resource.fileName;
  const metadata = (resource: OwnedResource) => resource.kind === "books"
    ? "Book"
    : resource.kind === "notes" ? resource.courseCode : `${resource.courseCode} · ${resource.year}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="VIT Bhopal Knowledge Base home">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs"><BookOpen className="h-5 w-5" /></div>
            <div><span className="font-bold text-slate-900 text-base leading-none">VIT Bhopal</span><span className="text-xs text-blue-600 block font-medium">Knowledge Base</span></div>
          </Link>
          <div className="flex items-center gap-3"><span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name || user?.username}</span><Button variant="outline" size="sm" onClick={logout}>Sign out</Button></div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-700 mb-5"><ArrowLeft className="h-4 w-4" />Back to library</Link>
        <div className="mb-7"><p className="text-sm font-semibold text-blue-600 mb-2">YOUR ACCOUNT</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My uploads</h1><p className="mt-2 text-slate-600">Manage the resources you’ve shared with the community.</p></div>

        <Card>
          <CardHeader className="pb-4"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-xl">Uploaded resources</CardTitle><CardDescription className="mt-1">{loading ? "Loading your uploads…" : `${resources.length} ${resources.length === 1 ? "resource" : "resources"}`}</CardDescription></div><div className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Library className="h-5 w-5" /></div></div></CardHeader>
          <CardContent>
            {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700 flex gap-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
            {notice && <div role="status" className="mb-4 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-700 flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />{notice}</div>}
            {loading ? <div className="py-14 flex items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading your uploads…</div> : resources.length === 0 && !error ? <div className="py-14 text-center"><div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center"><Library className="h-6 w-6" /></div><h2 className="mt-3 font-semibold text-slate-800">No uploads yet</h2><p className="mt-1 text-sm text-slate-500">Resources you share will appear here.</p><Link to="/" className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700">Browse the library</Link></div> : <div className="divide-y divide-slate-100">
              {resources.map((resource) => <article key={resource.id} className="py-4 first:pt-1 flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">{resource.kind === "books" ? <BookMarked className="h-5 w-5" /> : resource.kind === "notes" ? <FileText className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}</div>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] uppercase tracking-wide font-bold text-blue-700 bg-blue-50 rounded px-1.5 py-0.5">{kindLabel(resource)}</span><span className="text-xs text-slate-500">{metadata(resource)}</span></div><h2 className="mt-1 font-semibold text-slate-900 truncate">{resourceName(resource)}</h2><p className="mt-1 text-xs text-slate-500">{formatFileSize(resource.fileSize)} · Uploaded {formatDate(resource.createdAt)}</p></div>
                <a href={resource.fileUrl} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"><ExternalLink className="h-3.5 w-3.5" />Open</a>
                <Button type="button" variant="outline" size="sm" disabled={deletingId === resource.id} onClick={() => void removeResource(resource)} aria-label={`Delete ${resourceName(resource)}`} className="text-slate-500 hover:text-red-600 hover:border-red-200">{deletingId === resource.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}<span className="hidden sm:inline">Delete</span></Button>
              </article>)}
            </div>}
            {!loading && resources.length > 0 && <div className="mt-4 border-t border-slate-100 pt-4 flex justify-between items-center"><span className="text-xs text-slate-500">{resources.length} total</span><Link to="/" className="text-sm font-semibold text-blue-700 hover:text-blue-800">Find more resources</Link></div>}
          </CardContent>
        </Card>
      </main>
      <footer className="py-5 border-t border-slate-200 text-center text-xs text-slate-400">VIT Bhopal University · Knowledge Base Portal</footer>
    </div>
  );
};
