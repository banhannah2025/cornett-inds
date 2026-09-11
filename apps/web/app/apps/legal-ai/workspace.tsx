"use client";

import {
  Archive,
  Bell,
  Bot,  Scale,
  Copy,  FileSearch,  Download,  LoaderCircle,
  Menu,
  MessageSquarePlus,
  Pencil,
  Paperclip,  Plus,  RotateCcw,
  Send,
  Settings,
  ShieldCheck,
  Square,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { LegalAiAttachment, LegalAiConversation, LegalAiMessage, LegalAiProject } from "@/lib/legal-ai/store";

type WorkspaceData = { projects: LegalAiProject[]; conversations: LegalAiConversation[]; files: LegalAiAttachment[] };
// Provider pricing estimates used only for the administrator usage display.\nconst MODEL_PRICES: Record<string, { input: number; output: number }> = { "gpt-5.6-luna": { input: .2, output: 1.2 }, "gpt-5.6-terra": { input: 2, output: 12 }, "gpt-5.6-sol": { input: 4, output: 20 } };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

export function LegalAiWorkspace({ userEmail, isAdmin }: { userEmail: string; isAdmin: boolean }) {
  const [data, setData] = useState<WorkspaceData>({ projects: [], conversations: [], files: [] });
  const [projectId, setProjectId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [matterPanel, setMatterPanel] = useState<"settings" | null>(null);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [model, setModel] = useState("gpt-5.6-terra");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const requestController = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    try {
      const workspace = await api<WorkspaceData>("/api/legal-ai/workspace");
      setData(workspace);
      setProjectId((current) => current || workspace.projects[0]?._id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load Legal AI.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void reload(), [reload]);
  useEffect(() => { setNotificationsEnabled(typeof Notification !== "undefined" && Notification.permission === "granted"); }, []);

  const project = data.projects.find((item) => item._id === projectId);
  const projectConversations = useMemo(
    () => data.conversations.filter((item) => item.projectId === projectId && (showArchived ? item.archived : !item.archived) && item.title.toLowerCase().includes(chatSearch.toLowerCase())),
    [data.conversations, projectId, chatSearch, showArchived],
  );
  const conversation = data.conversations.find((item) => item._id === conversationId);
  const messages = conversation?.messages ?? [];
  const projectFiles = data.files.filter((file) => file.projectId === projectId);
  const projectUsage = useMemo(() => data.conversations.filter((item) => item.projectId === projectId).flatMap((item) => item.messages ?? []).filter((message) => message.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()).reduce((usage, message) => {
    const price = message.model ? MODEL_PRICES[message.model] : undefined;
    usage.input += message.inputTokens ?? 0; usage.output += message.outputTokens ?? 0;
    if (price) usage.cost += ((message.inputTokens ?? 0) * price.input + (message.outputTokens ?? 0) * price.output) / 1_000_000;
    return usage;
  }, { input: 0, output: 0, cost: 0 }), [data.conversations, projectId]);

  useEffect(() => { if (project?.defaultModel) setModel(project.defaultModel); }, [project?.defaultModel]);


  async function ensureProject() {
    if (project) return project;
    const created = await api<LegalAiProject>("/api/legal-ai/workspace", {
      method: "POST",
      body: JSON.stringify({ type: "project", name: "My Legal Matter" }),
    });
    setData((current) => ({ ...current, projects: [created, ...current.projects] }));
    setProjectId(created._id);
    return created;
  }

  async function newConversation() {
    setError("");
    try {
      const selectedProject = await ensureProject();
      const created = await api<LegalAiConversation>("/api/legal-ai/workspace", {
        method: "POST",
        body: JSON.stringify({ type: "conversation", projectId: selectedProject._id, title: "New legal matter" }),
      });
      setData((current) => ({ ...current, conversations: [created, ...current.conversations] }));
      setConversationId(created._id);
      setSidebarOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create a conversation.");
    }
  }

  async function newProject() {
    const name = window.prompt("Matter name", "My Legal Matter");
    if (!name?.trim()) return;
    try {
      const created = await api<LegalAiProject>("/api/legal-ai/workspace", { method: "POST", body: JSON.stringify({ type: "project", name }) });
      setData((current) => ({ ...current, projects: [created, ...current.projects] }));
      setProjectId(created._id);
      setConversationId("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create matter."); }
  }

  async function renameConversation(item: LegalAiConversation) {
    const title = window.prompt("Rename conversation", item.title);
    if (!title?.trim() || title.trim() === item.title) return;
    try {
      await api("/api/legal-ai/workspace", { method: "PATCH", body: JSON.stringify({ id: item._id, title }) });
      setData((current) => ({ ...current, conversations: current.conversations.map((chat) => chat._id === item._id ? { ...chat, title: title.trim() } : chat) }));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to rename conversation."); }
  }

  async function deleteConversation(item: LegalAiConversation) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try {
      await api(`/api/legal-ai/workspace?id=${encodeURIComponent(item._id)}`, { method: "DELETE" });
      setData((current) => ({ ...current, conversations: current.conversations.filter((chat) => chat._id !== item._id) }));
      if (conversationId === item._id) setConversationId("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to delete conversation."); }
  }

  async function archiveConversation(item: LegalAiConversation) {
    try {
      await api("/api/legal-ai/workspace", { method: "PATCH", body: JSON.stringify({ id: item._id, archived: true }) });
      setData((current) => ({ ...current, conversations: current.conversations.map((chat) => chat._id === item._id ? { ...chat, archived: true } : chat) }));
      if (conversationId === item._id) setConversationId("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to archive conversation."); }
  }

  async function restoreConversation(item: LegalAiConversation) {
    try {
      await api("/api/legal-ai/workspace", { method: "PATCH", body: JSON.stringify({ id: item._id, archived: false }) });
      setData((current) => ({ ...current, conversations: current.conversations.map((chat) => chat._id === item._id ? { ...chat, archived: false } : chat) }));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to restore conversation."); }
  }

  async function moveConversation(item: LegalAiConversation) {
    const targets = data.projects.filter((candidate) => candidate._id !== item.projectId && !candidate.archived);
    if (!targets.length) { setError("Create another matter before moving a chat."); return; }
    const name = window.prompt(`Move to matter: ${targets.map((candidate) => candidate.name).join(", ")}`, targets[0]?.name);
    const target = targets.find((candidate) => candidate.name.toLowerCase() === name?.trim().toLowerCase());
    if (!target) return;
    try {
      await api("/api/legal-ai/workspace", { method: "PATCH", body: JSON.stringify({ id: item._id, projectId: target._id }) });
      setData((current) => ({ ...current, conversations: current.conversations.map((chat) => chat._id === item._id ? { ...chat, projectId: target._id } : chat) }));
      if (conversationId === item._id) setConversationId("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to move conversation."); }
  }

  async function renameProject() {
    if (!project) return;
    const name = window.prompt("Rename matter", project.name);
    if (!name?.trim() || name.trim() === project.name) return;
    try { await api("/api/legal-ai/workspace", { method: "PATCH", body: JSON.stringify({ id: project._id, name: name.trim() }) }); setData((current) => ({ ...current, projects: current.projects.map((item) => item._id === project._id ? { ...item, name: name.trim() } : item) })); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to rename matter."); }
  }

  async function archiveProject() {
    if (!project || !window.confirm(`Archive ${project.name}? Its chats and files will remain saved.`)) return;
    try { await api("/api/legal-ai/workspace", { method: "PATCH", body: JSON.stringify({ id: project._id, archived: true }) }); setData((current) => ({ ...current, projects: current.projects.map((item) => item._id === project._id ? { ...item, archived: true } : item) })); setProjectId(data.projects.find((item) => item._id !== project._id && !item.archived)?._id ?? ""); setConversationId(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to archive matter."); }
  }

  async function restoreProject() {
    if (!project) return;
    try {
      await api("/api/legal-ai/workspace", { method: "PATCH", body: JSON.stringify({ id: project._id, archived: false }) });
      setData((current) => ({ ...current, projects: current.projects.map((item) => item._id === project._id ? { ...item, archived: false } : item) }));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to restore matter."); }
  }

  async function saveProjectSettings() {
    if (!project) return;
    const raw = window.prompt("Monthly OpenAI budget in dollars (0 disables the limit)", String(project.monthlyBudgetUsd ?? 5));
    if (raw === null) return;
    const monthlyBudgetUsd = Number(raw);
    if (!Number.isFinite(monthlyBudgetUsd) || monthlyBudgetUsd < 0) { setError("Enter a valid budget."); return; }
    try { await api("/api/legal-ai/workspace", { method: "PATCH", body: JSON.stringify({ id: project._id, monthlyBudgetUsd, defaultModel: model }) }); setData((current) => ({ ...current, projects: current.projects.map((item) => item._id === project._id ? { ...item, monthlyBudgetUsd, defaultModel: model } : item) })); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save matter settings."); }
  }

  async function deleteAttachment(file: LegalAiAttachment) {
    if (!window.confirm(`Delete ${file.name}?`)) return;
    try { await api(`/api/legal-ai/files?id=${encodeURIComponent(file._id)}`, { method: "DELETE" }); setData((current) => ({ ...current, files: current.files.filter((item) => item._id !== file._id) })); setAttachmentIds((current) => current.filter((id) => id !== file._id)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to delete file."); }
  }

  function exportWorkspace() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), project, conversations: data.conversations.filter((item) => item.projectId === projectId), files: projectFiles }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `${project?.name ?? "legal-ai"}-export.json`; link.click(); URL.revokeObjectURL(url);
  }

  async function uploadFile(file?: File) {
    if (!file) return;
    setError("");
    try {
      const selectedProject = await ensureProject();
      const form = new FormData(); form.set("file", file); form.set("projectId", selectedProject._id);
      const response = await fetch("/api/legal-ai/files", { method: "POST", body: form });
      const result = await response.json() as LegalAiAttachment & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Upload failed.");
      setData((current) => ({ ...current, files: [result, ...current.files] }));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to upload file."); }
    finally { if (uploadRef.current) uploadRef.current.value = ""; }
  }

  async function sendMessage(retryText?: string) {
    const text = (retryText ?? prompt).trim();
    if (!text || sending) return;
    setError("");
    setSending(true);
    setPrompt("");
    try {
      const selectedProject = await ensureProject();
      let selectedConversationId = conversationId;
      if (!selectedConversationId) {
        const created = await api<LegalAiConversation>("/api/legal-ai/workspace", {
          method: "POST",
          body: JSON.stringify({ type: "conversation", projectId: selectedProject._id, title: text.slice(0, 64) }),
        });
        selectedConversationId = created._id;
        setConversationId(created._id);
        setData((current) => ({ ...current, conversations: [{ ...created, messages: [] }, ...current.conversations] }));
      }
      const optimistic: LegalAiMessage = { _key: crypto.randomUUID(), role: "user", content: text, createdAt: new Date().toISOString() };
      setData((current) => ({
        ...current,
        conversations: current.conversations.map((item) => item._id === selectedConversationId ? { ...item, messages: [...(item.messages ?? []), optimistic] } : item),
      }));
      const streamingKey = crypto.randomUUID();
      const streamingMessage: LegalAiMessage = { _key: streamingKey, role: "assistant", content: "", createdAt: new Date().toISOString(), model };
      setData((current) => ({ ...current, conversations: current.conversations.map((item) => item._id === selectedConversationId ? { ...item, messages: [...(item.messages ?? []), streamingMessage] } : item) }));
      const controller = new AbortController(); requestController.current = controller;
      const response = await fetch("/api/legal-ai/chat", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConversationId, projectId: selectedProject._id, message: text, model, attachmentIds }),
      });
      if (!response.ok || !response.body) { const failure = await response.json().catch(() => ({})) as { error?: string }; throw new Error(failure.error ?? "Legal AI could not start."); }
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      let result: { message: LegalAiMessage } | null = null;
      while (true) {
        const { value, done } = await reader.read(); buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line) as { type: "delta" | "done" | "error"; delta?: string; error?: string; message?: LegalAiMessage };
          if (event.type === "error") throw new Error(event.error ?? "Legal AI failed.");
          if (event.type === "delta" && event.delta) setData((current) => ({ ...current, conversations: current.conversations.map((item) => item._id === selectedConversationId ? { ...item, messages: (item.messages ?? []).map((entry) => entry._key === streamingKey ? { ...entry, content: entry.content + event.delta } : entry) } : item) }));
          if (event.type === "done" && event.message) result = { message: event.message };
        }
        if (done) break;
      }
      if (!result) throw new Error("Legal AI stream ended unexpectedly.");
      setData((current) => ({ ...current, conversations: current.conversations.map((item) => item._id === selectedConversationId ? { ...item, messages: (item.messages ?? []).map((entry) => entry._key === streamingKey ? result!.message : entry) } : item) }));
      if (notificationsEnabled && document.visibilityState !== "visible") new Notification("Legal AI finished", { body: "Your Legal AI response is ready." });
      setAttachmentIds([]);
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught instanceof Error ? caught.message : "Legal AI could not complete the task.");
    } finally {
      requestController.current = null; setSending(false);
    }
  }

  async function toggleNotifications() {
    if (!("Notification" in window)) { setError("This browser does not support notifications."); return; }
    const permission = await Notification.requestPermission(); setNotificationsEnabled(permission === "granted");
    if (permission !== "granted") setError("Browser notifications were not enabled.");
  }

  return (
    <main className="code-ai-shell">
      {sidebarOpen && <button aria-label="Close navigation" className="code-ai-scrim" onClick={() => setSidebarOpen(false)} />}
      <aside className={`code-ai-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="code-ai-brand"><span><Scale size={21} /></span><div><strong>Legal AI</strong><small>Blended Works</small></div><button aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><X size={19}/></button></div>
        <button className="code-ai-new" onClick={newConversation}><MessageSquarePlus size={17}/>New legal matter</button>
        <div className="code-ai-project-label"><span><Scale size={14}/>Matter</span><div><button aria-label="Matter settings" onClick={() => setMatterPanel(matterPanel === "settings" ? null : "settings")}><Settings size={14}/></button><button aria-label="Rename matter" onClick={renameProject}><Pencil size={14}/></button><button aria-label={project?.archived ? "Restore matter" : "Archive matter"} onClick={project?.archived ? restoreProject : archiveProject}>{project?.archived ? <RotateCcw size={14}/> : <Archive size={14}/>}</button><button aria-label="Create matter" onClick={newProject}><Plus size={15}/></button></div></div>
        {data.projects.length ? (
          <select value={projectId} onChange={(event) => { setProjectId(event.target.value); setConversationId(""); }}>
            {data.projects.map((item) => <option key={item._id} value={item._id}>{item.archived ? "Archived · " : ""}{item.name}</option>)}
          </select>
        ) : <button className="code-ai-create-project" onClick={newConversation}>Create legal matter</button>}
        <div className="code-ai-project-label"><span><Paperclip size={14}/>Matter files</span><button aria-label="Upload file" onClick={() => uploadRef.current?.click()}><Plus size={15}/></button></div>
        <input ref={uploadRef} hidden type="file" onChange={(event) => uploadFile(event.target.files?.[0])}/>
        <div className="code-ai-attachments">{projectFiles.slice(0, 12).map((file) => <div key={file._id}><button className={attachmentIds.includes(file._id) ? "selected" : ""} onClick={() => setAttachmentIds((current) => current.includes(file._id) ? current.filter((id) => id !== file._id) : [...current, file._id].slice(-5))}><Paperclip size={12}/><span>{file.name}</span></button><button aria-label={`Delete ${file.name}`} onClick={() => deleteAttachment(file)}><Trash2 size={11}/></button></div>)}{!projectFiles.length && <small>No uploaded files</small>}</div>
        <div className="code-ai-history">
          <div className="code-ai-history-head"><p>{showArchived ? "Archived chats" : "Recent chats"}</p><div><button aria-label={showArchived ? "Show recent chats" : "Show archived chats"} onClick={() => setShowArchived((current) => !current)}><Archive size={13}/></button><button aria-label="Export matter" onClick={exportWorkspace}><Download size={13}/></button></div></div>
          <div className="code-ai-chat-search"><FileSearch size={13}/><input value={chatSearch} onChange={(event) => setChatSearch(event.target.value)} placeholder="Search chats"/></div>
          {projectConversations.map((item) => (
            <div className={`code-ai-chat-row ${item._id === conversationId ? "active" : ""}`} key={item._id}>
              <button onClick={() => { setConversationId(item._id); setSidebarOpen(false); }}><Scale size={15}/><span>{item.title}</span></button>
              <button aria-label={`Rename ${item.title}`} onClick={() => renameConversation(item)}><Pencil size={13}/></button>
              <button aria-label={`Move ${item.title}`} onClick={() => moveConversation(item)}><Scale size={13}/></button>
              <button aria-label={`${item.archived ? "Restore" : "Archive"} ${item.title}`} onClick={() => item.archived ? restoreConversation(item) : archiveConversation(item)}>{item.archived ? <RotateCcw size={13}/> : <Archive size={13}/>}</button>
              <button aria-label={`Delete ${item.title}`} onClick={() => deleteConversation(item)}><Trash2 size={13}/></button>
            </div>
          ))}
          {!loading && !projectConversations.length && <small>Your legal conversations will appear here.</small>}
        </div>
        <div className="code-ai-owner"><ShieldCheck size={17}/><div><strong>{isAdmin ? "Legal AI administrator" : "Legal AI account"}</strong><small>{userEmail}</small></div></div>
      </aside>

      <section className="code-ai-main">
        <header className="code-ai-header">
          <button className="code-ai-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={21}/></button>
          <div><strong>{project?.name ?? "Legal AI"}</strong><span>Legal research workspace</span></div>

          <button className={notificationsEnabled ? "active" : ""} onClick={toggleNotifications} title="Browser notifications"><Bell size={16}/><span>Alerts</span></button>
        </header>

        <div className="code-ai-work-area">
        <div className="code-ai-thread">
          {loading ? <div className="code-ai-loading"><LoaderCircle className="animate-spin"/>Loading workspace…</div> : messages.length ? (
            messages.map((message, index) => <Message key={message._key} message={message} onEdit={(content) => setPrompt(content)} onRetry={() => { const previous = messages.slice(0, index).reverse().find((item) => item.role === "user"); if (previous) void sendMessage(previous.content); }}/>)
          ) : (
            <div className="code-ai-empty">
              <span><Bot size={34}/></span>
              <h1>How can Legal AI help?</h1>
              <p>Ask a legal question, review a document, organize a matter, research an issue, or prepare legal writing.</p>
              <div>
                <button onClick={() => setPrompt("Review my legal matter and identify the key issues, missing facts, and next steps.")}>Review a matter</button>
                <button onClick={() => setPrompt("Review an uploaded legal document and summarize the important terms, risks, and deadlines.")}>Review a document</button>
                <button onClick={() => setPrompt("Research the legal issues in this matter and identify authorities I should verify.")}>Research an issue</button>
              </div>
            </div>
          )}
          {sending && <div className="code-ai-thinking"><span><Bot size={18}/></span><LoaderCircle className="animate-spin" size={16}/>Working on your legal request…</div>}
        </div>
        {matterPanel === "settings" ? <aside className="code-ai-matter-panel"><div className="code-ai-matter-title"><div><Settings size={17}/><strong>Matter settings</strong></div><button aria-label="Close matter settings" onClick={() => setMatterPanel(null)}><X size={18}/></button></div><div className="code-ai-settings"><h3>{project?.name}</h3><dl><div><dt>Estimated this month</dt><dd>${projectUsage.cost.toFixed(4)}</dd></div><div><dt>Monthly budget</dt><dd>${(project?.monthlyBudgetUsd ?? 5).toFixed(2)}</dd></div><div><dt>Tokens</dt><dd>{(projectUsage.input + projectUsage.output).toLocaleString()}</dd></div></dl><label>Default model<select value={model} onChange={(event) => setModel(event.target.value)}><option value="gpt-5.6-luna">Luna · lowest cost</option><option value="gpt-5.6-terra">Terra · balanced</option><option value="gpt-5.6-sol">Sol · strongest</option></select></label><button onClick={saveProjectSettings}>Save model and budget</button><small>Usage estimates are approximate. Provider billing remains the final source of truth.</small></div></aside> : null}
        </div>

        <div className="code-ai-composer-wrap">
          {error && <div className="code-ai-error">{error}</div>}
          <div className="code-ai-composer">
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Ask Legal AI about your matter…" rows={3}/>
            <div>
              <div className="code-ai-composer-options"><select aria-label="AI model" value={model} onChange={(event) => setModel(event.target.value)}><option value="gpt-5.6-luna">Luna · lowest cost</option><option value="gpt-5.6-terra">Terra · balanced</option><option value="gpt-5.6-sol">Sol · strongest</option></select>{attachmentIds.length > 0 && <span className="code-ai-attached-count"><Paperclip size={12}/>{attachmentIds.length}</span>}</div>
              {sending ? <button className="code-ai-stop" aria-label="Stop generating" onClick={() => requestController.current?.abort()}><Square size={16}/></button> : <button aria-label="Send message" disabled={!prompt.trim()} onClick={() => sendMessage()}><Send size={19}/></button>}
            </div>
          </div>
          <small>Legal AI can make mistakes. Verify important legal information, citations, deadlines, and decisions.</small>
        </div>
      </section>
    </main>
  );
}

function Message({ message, onEdit, onRetry }: { message: LegalAiMessage; onEdit: (content: string) => void; onRetry: () => void }) {
  return <article className={`code-ai-message ${message.role}`}><span>{message.role === "assistant" ? <Bot size={18}/> : <UserRound size={18}/>}</span><div><header><strong>{message.role === "assistant" ? "Legal AI" : "You"}</strong><div><button aria-label="Copy message" onClick={() => navigator.clipboard.writeText(message.content)}><Copy size={12}/></button>{message.role === "user" ? <button aria-label="Edit message" onClick={() => onEdit(message.content)}><Pencil size={12}/></button> : <button aria-label="Retry response" onClick={onRetry}><RotateCcw size={12}/></button>}</div></header><div className="code-ai-markdown"><ReactMarkdown components={{ pre: ({ children }) => <div className="code-ai-code-block"><button onClick={(event) => navigator.clipboard.writeText(event.currentTarget.nextElementSibling?.textContent ?? "")}><Copy size={11}/>Copy</button><pre>{children}</pre></div> }}>{message.content}</ReactMarkdown></div>{message.role === "assistant" && message.model && <small>{message.model} · {(message.inputTokens ?? 0).toLocaleString()} input · {(message.outputTokens ?? 0).toLocaleString()} output tokens</small>}</div></article>;
}
