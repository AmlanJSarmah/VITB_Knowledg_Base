import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen, BookMarked, FileText, Search, Upload, LogOut, User as UserIcon,
  Download, CheckCircle2, AlertCircle, LoaderCircle, Library, GraduationCap,
  Sparkles,
} from "lucide-react";
import {
  getBooks, getNotes,
  getQuestionPapers, uploadBook, uploadNote, uploadQuestionPaper,
  formatDate, formatFileSize,
} from "@/lib/api";
import type { Book, Note, QuestionPaper, PaginatedResponse } from "@/lib/api";

type MaterialType = "question-papers" | "notes" | "books";
type Material = (Book | Note | QuestionPaper) & { type: MaterialType };

const materialOptions: { id: MaterialType; label: string; singular: string; icon: typeof FileText }[] = [
  { id: "question-papers", label: "Question papers", singular: "Question paper", icon: GraduationCap },
  { id: "notes", label: "Lecture notes", singular: "Lecture note", icon: FileText },
  { id: "books", label: "Books", singular: "Book", icon: BookMarked },
];

const fieldClass = "mt-2";

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeType, setActiveType] = useState<MaterialType>("question-papers");
  const [uploadType, setUploadType] = useState<MaterialType>("question-papers");
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [items, setItems] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [courseCode, setCourseCode] = useState("");
  const [paperYear, setPaperYear] = useState(String(new Date().getFullYear()));
  const [bookTitle, setBookTitle] = useState("");

  const loadMaterials = useCallback(async (type: MaterialType, search: string, year: string) => {
    setLoading(true);
    setSearchError("");
    try {
      let result: PaginatedResponse<Book | Note | QuestionPaper>;
      if (type === "question-papers") result = await getQuestionPapers({ courseCode: search || undefined, year: year ? Number(year) : undefined, limit: 50 });
      else if (type === "notes") result = await getNotes({ courseCode: search || undefined, limit: 50 });
      else result = await getBooks({ title: search || undefined, limit: 50 });
      setItems(result.data.map((item) => ({ ...item, type })) as Material[]);
      setTotal(result.total);
    } catch (error) {
      setItems([]);
      setTotal(0);
      setSearchError(error instanceof Error ? error.message : "Could not load materials. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadMaterials(activeType, "", ""));
  }, [activeType, loadMaterials]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    void loadMaterials(activeType, query.trim(), yearFilter);
  };

  const submitUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    setUploadError("");
    setUploadSuccess("");
    if (!selectedFile) { setUploadError("Choose a PDF file to upload."); return; }
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please choose a PDF file."); return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      setUploading(true);
      let message: string;
      if (uploadType === "question-papers") {
        formData.append("courseCode", courseCode.trim());
        formData.append("year", paperYear);
        message = (await uploadQuestionPaper(formData)).message;
      } else if (uploadType === "notes") {
        formData.append("courseCode", courseCode.trim());
        message = (await uploadNote(formData)).message;
      } else {
        formData.append("title", bookTitle.trim());
        message = (await uploadBook(formData)).message;
      }
      setUploadSuccess(message);
      setSelectedFile(null);
      setCourseCode("");
      setBookTitle("");
      const fileInput = document.getElementById("material-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      if (activeType === uploadType) void loadMaterials(activeType, query.trim(), yearFilter);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const typeLabel = materialOptions.find((option) => option.id === activeType)?.label ?? "Materials";
  const uploadLabel = materialOptions.find((option) => option.id === uploadType)?.singular ?? "Material";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3" aria-label="VIT Bhopal Knowledge Base home">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs"><BookOpen className="h-5 w-5" /></div>
            <div><span className="font-bold text-slate-900 text-base leading-none">VIT Bhopal</span><span className="text-xs text-blue-600 block font-medium">Knowledge Base</span></div>
          </a>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/tutor" className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Sparkles className="h-4 w-4" /><span>AI Tutor</span></Link>
            <Link to="/accounts" className="text-sm font-semibold text-slate-600 hover:text-blue-700">My uploads</Link>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200"><UserIcon className="h-3.5 w-3.5 text-blue-600" /><span className="font-medium text-slate-800">{user?.name || user?.username}</span>{user?.registrationNumber && <span className="text-xs text-slate-400 border-l border-slate-300 pl-2">{user.registrationNumber}</span>}</div>
            <Button variant="outline" size="sm" onClick={logout} className="text-slate-600 hover:text-red-600 hover:border-red-200"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600 mb-2">VIT BHOPAL • STUDENT RESOURCE LIBRARY</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Study resources, shared.</h1><p className="mt-2 text-slate-600 max-w-2xl">Find course materials shared by the VIT Bhopal community, or add a resource that could help someone else.</p></div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800"><Library className="h-4 w-4" /> One library, shared by students</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)] gap-6 items-start">
          <section aria-labelledby="library-title">
            <Card className="overflow-hidden">
              <CardHeader className="pb-4"><div className="flex items-center gap-2 text-blue-600 mb-1"><Search className="h-4 w-4" /><span className="text-xs font-bold tracking-wide uppercase">Explore resources</span></div><CardTitle id="library-title" className="text-xl">Browse the library</CardTitle><CardDescription>Search papers and notes by course code, or books by title.</CardDescription></CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-1 mb-4" role="tablist" aria-label="Resource type">
                  {materialOptions.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeType === id} onClick={() => { setActiveType(id); setQuery(""); setYearFilter(""); }} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${activeType === id ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}><Icon className="h-4 w-4" />{label}</button>)}
                </div>
                <form onSubmit={submitSearch} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder={activeType === "books" ? "Search by book title" : "Search by course code, e.g. CSE2001"} aria-label={activeType === "books" ? "Search books by title" : "Search by course code"} /></div>
                  {activeType === "question-papers" && <Input type="number" min="2000" max="2100" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="sm:w-28" placeholder="Year" aria-label="Filter by year" />}
                  <Button type="submit" disabled={loading} className="sm:min-w-28"><Search className="h-4 w-4" />Search</Button>
                </form>
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between mb-3"><h2 className="font-semibold text-slate-900">{typeLabel}</h2><span className="text-xs text-slate-500">{loading ? "Loading…" : `${total} ${total === 1 ? "resource" : "resources"}`}</span></div>
                  {searchError && <div role="alert" className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700 flex gap-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{searchError}</div>}
                  {loading ? <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading resources…</div> : !items.length && !searchError ? <div className="py-12 text-center"><div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center"><Library className="h-6 w-6" /></div><p className="mt-3 font-medium text-slate-800">No {typeLabel.toLowerCase()} found</p><p className="mt-1 text-sm text-slate-500">Try another search, or be the first to share one.</p></div> : <div className="divide-y divide-slate-100">
                    {items.map((item) => <article key={item.id} className="py-4 first:pt-1 flex items-start gap-3 sm:gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><FileText className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1"><h3 className="font-semibold text-slate-900 truncate">{item.type === "books" ? (item as Book).title : item.fileName}</h3><div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-500"><span>{item.type === "question-papers" ? `${(item as QuestionPaper).courseCode} · ${(item as QuestionPaper).year}` : item.type === "notes" ? (item as Note).courseCode : "Book"}</span><span aria-hidden="true">·</span><span>{formatFileSize(item.fileSize)}</span><span aria-hidden="true">·</span><span>{formatDate(item.createdAt)}</span></div><p className="text-xs text-slate-500 mt-1">Shared by {item.user.name || item.user.username}</p></div>
                      <a href={item.fileUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" aria-label={`Open ${item.type === "books" ? (item as Book).title : item.fileName}`}><Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">Open PDF</span></a>
                    </article>)}
                  </div>}
                  {!loading && items.length > 0 && items.length < total && <p className="text-center text-xs text-slate-500 pt-3">Showing the latest {items.length} of {total} results</p>}
                </div>
              </CardContent>
            </Card>
          </section>

          <aside>
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="pb-4"><div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2"><Upload className="h-5 w-5" /></div><CardTitle className="text-xl">Share a resource</CardTitle><CardDescription>Upload a PDF for other students to discover.</CardDescription></CardHeader>
              <CardContent>
                <form onSubmit={submitUpload} className="space-y-4">
                  <div><Label htmlFor="upload-type">Resource type</Label><select id="upload-type" value={uploadType} onChange={(e) => { setUploadType(e.target.value as MaterialType); setUploadError(""); setUploadSuccess(""); }} className="mt-2 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{materialOptions.map((option) => <option key={option.id} value={option.id}>{option.singular}</option>)}</select></div>
                  {uploadType !== "books" ? <div><Label htmlFor="upload-course">Course code</Label><Input id="upload-course" className={fieldClass} value={courseCode} onChange={(e) => setCourseCode(e.target.value.toUpperCase())} placeholder="e.g. CSE2001" required minLength={3} pattern="[A-Za-z]{2,4}[0-9]{3,5}[A-Za-z]?" title="Use a course code such as CSE2001" /></div> : <div><Label htmlFor="upload-title">Book title</Label><Input id="upload-title" className={fieldClass} value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="e.g. Introduction to Algorithms" required /></div>}
                  {uploadType === "question-papers" && <div><Label htmlFor="upload-year">Exam year</Label><Input id="upload-year" type="number" min="2000" max="2100" className={fieldClass} value={paperYear} onChange={(e) => setPaperYear(e.target.value)} required /></div>}
                  <div><Label htmlFor="material-file">PDF file</Label><label htmlFor="material-file" className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50"><Upload className="h-5 w-5 text-blue-600" /><span className="mt-2 text-sm font-medium text-slate-700">{selectedFile ? selectedFile.name : "Choose a PDF to upload"}</span><span className="mt-1 text-xs text-slate-500">PDF format</span><input id="material-file" type="file" accept="application/pdf,.pdf" className="sr-only" required onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} /></label>{selectedFile && <p className="mt-1.5 text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>}</div>
                  {uploadError && <p role="alert" className="flex gap-2 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{uploadError}</p>}
                  {uploadSuccess && <p role="status" className="flex gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />{uploadSuccess}</p>}
                  <Button type="submit" className="w-full" disabled={uploading}>{uploading ? <><LoaderCircle className="h-4 w-4 animate-spin" />Uploading…</> : <><Upload className="h-4 w-4" />Upload {uploadLabel.toLowerCase()}</>}</Button>
                  <p className="text-center text-xs text-slate-500">Your upload will appear in the shared library.</p>
                </form>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <footer className="py-5 border-t border-slate-200 text-center text-xs text-slate-400">VIT Bhopal University · Knowledge Base Portal</footer>
    </div>
  );
};
