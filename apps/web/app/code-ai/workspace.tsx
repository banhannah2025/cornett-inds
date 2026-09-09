"use client";

import {
  Bot,
  CheckCircle2,
  Code2,
  FileCode2,
  FolderGit2,
  LoaderCircle,
  Menu,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CodeAiConversation, CodeAiMessage, CodeAiProject } from "@/lib/code-ai/store";

type WorkspaceData = { projects: CodeAiProject[]; conversations: CodeAiConversation[] };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

export function CodeAiWorkspace({ ownerEmail }: { ownerEmail: string }) {
  const [data, setData] = useState<WorkspaceData>({ projects: [], conversations: [] });
  const [projectId, setProjectId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [prompt, setPrompt] = useState("");
  const branch = "main";
  const [approveChanges, setApproveChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const workspace = await api<WorkspaceData>("/api/code-ai/workspace");
      setData(workspace);
      setProjectId((current) => current || workspace.projects[0]?._id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load Code AI.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void reload(), [reload]);

  const project = data.projects.find((item) => item._id === projectId);
  const projectConversations = useMemo(
    () => data.conversations.filter((item) => item.projectId === projectId),
    [data.conversations, projectId],
  );
  const conversation = data.conversations.find((item) => item._id === conversationId);
  const messages = conversation?.messages ?? [];

  async function ensureProject() {
    if (project) return project;
    const created = await api<CodeAiProject>("/api/code-ai/workspace", {
      method: "POST",
      body: JSON.stringify({ type: "project", name: "Blended Works", repository: "banhannah2025/cornett-inds" }),
    });
    setData((current) => ({ ...current, projects: [created, ...current.projects] }));
    setProjectId(created._id);
    return created;
  }

  async function newConversation() {
    setError("");
    try {
      const selectedProject = await ensureProject();
      const created = await api<CodeAiConversation>("/api/code-ai/workspace", {
        method: "POST",
        body: JSON.stringify({ type: "conversation", projectId: selectedProject._id, title: "New coding task" }),
      });
      setData((current) => ({ ...current, conversations: [created, ...current.conversations] }));
      setConversationId(created._id);
      setSidebarOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create a conversation.");
    }
  }

  async function sendMessage() {
    const text = prompt.trim();
    if (!text || sending) return;
    setError("");
    setSending(true);
    setPrompt("");
    try {
      const selectedProject = await ensureProject();
      let selectedConversationId = conversationId;
      if (!selectedConversationId) {
        const created = await api<CodeAiConversation>("/api/code-ai/workspace", {
          method: "POST",
          body: JSON.stringify({ type: "conversation", projectId: selectedProject._id, title: text.slice(0, 64) }),
        });
        selectedConversationId = created._id;
        setConversationId(created._id);
        setData((current) => ({ ...current, conversations: [{ ...created, messages: [] }, ...current.conversations] }));
      }
      const optimistic: CodeAiMessage = { _key: crypto.randomUUID(), role: "user", content: text, createdAt: new Date().toISOString() };
      setData((current) => ({
        ...current,
        conversations: current.conversations.map((item) => item._id === selectedConversationId ? { ...item, messages: [...(item.messages ?? []), optimistic] } : item),
      }));
      const result = await api<{ message: CodeAiMessage }>("/api/code-ai/chat", {
        method: "POST",
        body: JSON.stringify({ conversationId: selectedConversationId, message: text, repository: selectedProject.repository, branch, approveChanges }),
      });
      setData((current) => ({
        ...current,
        conversations: current.conversations.map((item) => item._id === selectedConversationId ? { ...item, messages: [...(item.messages ?? []), result.message] } : item),
      }));
      setApproveChanges(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Code AI could not complete the task.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="code-ai-shell">
      {sidebarOpen && <button aria-label="Close navigation" className="code-ai-scrim" onClick={() => setSidebarOpen(false)} />}
      <aside className={`code-ai-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="code-ai-brand"><span><Code2 size={21} /></span><div><strong>Code AI</strong><small>Blended Works</small></div><button aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><X size={19}/></button></div>
        <button className="code-ai-new" onClick={newConversation}><MessageSquarePlus size={17}/>New coding task</button>
        <div className="code-ai-project-label"><FolderGit2 size={14}/>Project</div>
        {data.projects.length ? (
          <select value={projectId} onChange={(event) => { setProjectId(event.target.value); setConversationId(""); }}>
            {data.projects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        ) : <button className="code-ai-create-project" onClick={newConversation}>Create Blended Works project</button>}
        <div className="code-ai-history">
          <p>Recent chats</p>
          {projectConversations.map((item) => (
            <button className={item._id === conversationId ? "active" : ""} key={item._id} onClick={() => { setConversationId(item._id); setSidebarOpen(false); }}>
              <FileCode2 size={15}/><span>{item.title}</span>
            </button>
          ))}
          {!loading && !projectConversations.length && <small>Your coding conversations will appear here.</small>}
        </div>
        <div className="code-ai-owner"><ShieldCheck size={17}/><div><strong>Private workspace</strong><small>{ownerEmail}</small></div></div>
      </aside>

      <section className="code-ai-main">
        <header className="code-ai-header">
          <button className="code-ai-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={21}/></button>
          <div><strong>{project?.name ?? "Code AI"}</strong><span>{project?.repository ?? "Private development workspace"}</span></div>
          <div className="code-ai-branch" aria-label="Working branch: main">
            <span>Working branch</span>
            <strong>main</strong>
          </div>
        </header>

        <div className="code-ai-thread">
          {loading ? <div className="code-ai-loading"><LoaderCircle className="animate-spin"/>Loading workspace…</div> : messages.length ? (
            messages.map((message) => <Message key={message._key} message={message}/>)
          ) : (
            <div className="code-ai-empty">
              <span><Bot size={34}/></span>
              <h1>What should we build?</h1>
              <p>Ask Code AI to inspect, explain, debug, or update the Blended Works repository. Enable file changes only when you want it to commit.</p>
              <div>
                <button onClick={() => setPrompt("Review the repository structure and tell me what needs attention.")}>Review the project</button>
                <button onClick={() => setPrompt("Find the cause of the latest build failure and propose a fix.")}>Diagnose a build</button>
                <button onClick={() => setPrompt("Inspect the current app architecture before we add a new feature.")}>Inspect architecture</button>
              </div>
            </div>
          )}
          {sending && <div className="code-ai-thinking"><span><Bot size={18}/></span><LoaderCircle className="animate-spin" size={16}/>Working in {project?.repository ?? "the repository"}…</div>}
        </div>

        <div className="code-ai-composer-wrap">
          {error && <div className="code-ai-error">{error}</div>}
          <div className="code-ai-composer">
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Message Code AI about your project…" rows={3}/>
            <div>
              <label className={approveChanges ? "approved" : ""}><input type="checkbox" checked={approveChanges} onChange={(event) => setApproveChanges(event.target.checked)}/><CheckCircle2 size={15}/>{approveChanges ? "File changes approved" : "Review only"}</label>
              <button aria-label="Send message" disabled={!prompt.trim() || sending} onClick={sendMessage}>{sending ? <LoaderCircle className="animate-spin" size={19}/> : <Send size={19}/>}</button>
            </div>
          </div>
          <small>Code AI can make mistakes. Review committed changes before deployment.</small>
        </div>
      </section>
    </main>
  );
}

function Message({ message }: { message: CodeAiMessage }) {
  return <article className={`code-ai-message ${message.role}`}><span>{message.role === "assistant" ? <Bot size={18}/> : <UserRound size={18}/>}</span><div><strong>{message.role === "assistant" ? "Code AI" : "You"}</strong><p>{message.content}</p></div></article>;
}
