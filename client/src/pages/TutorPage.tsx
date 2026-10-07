import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Bot, Send, UserRound, LoaderCircle,
  AlertCircle, Sparkles, FileText, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { askTutor } from "@/lib/api";
import type { TutorMessage, TutorSource } from "@/lib/api";

interface ConversationTurn extends TutorMessage {
  sources?: TutorSource[];
}

const suggestions = [
  "Explain a topic from my course materials",
  "What should I focus on for the next exam?",
  "Help me understand a question paper problem",
];

function sourceCategoryLabel(category: string): string {
  if (category === "question-papers") return "Question paper";
  if (category === "notes") return "Lecture note";
  if (category === "books") return "Book";
  return category;
}

export const TutorPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ConversationTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const sendMessage = async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;
    const history = messages.map(({ role, content }) => ({ role, content })).slice(-30);
    setMessages((current) => [...current, { role: "user", content: question }]);
    setDraft("");
    setError("");
    setSending(true);
    try {
      const response = await askTutor({ question, history });
      setMessages((current) => [...current, {
        role: "assistant",
        content: response.answer,
        sources: response.sources,
      }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not reach the AI Tutor. Please try again.");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-xs">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 hover:text-blue-700 flex items-center justify-center" aria-label="Back to library"><ArrowLeft className="h-4 w-4" /></Link>
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs"><Bot className="h-5 w-5" /></div>
            <div><span className="font-bold text-slate-900 text-base leading-none">AI Tutor</span><span className="text-xs text-emerald-600 block font-medium">VIT Bhopal Knowledge Base</span></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-blue-700"><span className="hidden sm:inline">Library</span><span className="sm:hidden">Home</span></Link>
            <Link to="/accounts" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-blue-700">My uploads</Link>
            <span className="hidden md:inline text-sm text-slate-500">{user?.name || user?.username}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col px-4 sm:px-6 py-5 sm:py-7 min-h-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Your study companion</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Ask your AI Tutor</h1></div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500" />Answers grounded in shared course resources</div>
        </div>

        <section aria-label="Chat conversation" className="flex-1 min-h-[360px] rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-7 py-6 space-y-6">
            {messages.length === 0 ? <div className="min-h-full flex flex-col items-center justify-center text-center py-8">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Sparkles className="h-7 w-7" /></div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">What are you studying today?</h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">Ask a question about your courses. The tutor searches uploaded notes, books, and question papers to help answer.</p>
              <div className="mt-6 grid sm:grid-cols-3 gap-2 w-full max-w-3xl">
                {suggestions.map((suggestion, index) => <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} className="rounded-xl border border-slate-200 p-3 text-left text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-800 transition-colors"><span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">{index === 0 ? <BookOpen className="h-4 w-4" /> : index === 1 ? <GraduationCap className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span>{suggestion}</button>)}
              </div>
            </div> : messages.map((message, index) => <div key={`${index}-${message.role}`} className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${message.role === "assistant" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>{message.role === "assistant" ? <Bot className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}</div>
              <div className={`max-w-[88%] sm:max-w-[78%] ${message.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-left ${message.role === "assistant" ? "bg-slate-100 text-slate-800 rounded-tl-sm" : "bg-blue-600 text-white rounded-tr-sm"}`}>{message.content}</div>
                {message.role === "assistant" && !!message.sources?.length && <div className="mt-2 text-left"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sources</p><div className="flex flex-wrap gap-1.5">{message.sources.map((source, sourceIndex) => <span key={`${source.source}-${source.page}-${sourceIndex}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"><FileText className="h-3 w-3 text-blue-600" /><span>{sourceCategoryLabel(source.category)} · {source.source} · p. {source.page}</span></span>)}</div></div>}
              </div>
            </div>)}
            {sending && <div className="flex items-start gap-3"><div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center"><Bot className="h-4 w-4" /></div><div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm text-slate-500 flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />Searching your study resources…</div></div>}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-100 bg-white p-3 sm:p-4">
            {error && <div role="alert" className="mb-3 mx-auto max-w-3xl flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
            <form onSubmit={submit} className="mx-auto max-w-3xl flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-xs focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <label className="sr-only" htmlFor="tutor-message">Message your AI Tutor</label>
              <textarea ref={textareaRef} id="tutor-message" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(draft); } }} placeholder="Ask a study question…" rows={1} maxLength={2000} className="max-h-36 min-h-10 flex-1 resize-y border-0 bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none" disabled={sending} />
              <Button type="submit" disabled={sending || !draft.trim()} size="icon" className="h-10 w-10 shrink-0 rounded-xl" aria-label="Send message">{sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
            </form>
            <p className="mt-2 text-center text-[11px] text-slate-400">AI Tutor answers from the documents in the VIT Bhopal Knowledge Base. Press Enter to send · Shift + Enter for a new line.</p>
          </div>
        </section>
      </main>
      <footer className="py-4 border-t border-slate-200 text-center text-xs text-slate-400"><Link to="/" className="inline-flex items-center gap-1 hover:text-blue-700"><ArrowLeft className="h-3 w-3" />Return to Knowledge Base</Link></footer>
    </div>
  );
};
