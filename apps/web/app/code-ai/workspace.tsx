"use client";

import {
  Bot,
  CheckCircle2,
  ChevronRight,
  Code2,
  ExternalLink,
  FileCode2,
  FileSearch,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  GitCompareArrows,
  GitPullRequest,
  History,
  LoaderCircle,
  Menu,
  MessageSquarePlus,
  Pencil,
  Paperclip,
  Play,
  Plus,
  Plug,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CodeAiAttachment, CodeAiConversation, CodeAiMessage, CodeAiProject } from "@/lib/code-ai/store";

type WorkspaceData = { projects: CodeAiProject[]; conversations: CodeAiConversation[]; files: CodeAiAttachment[] };
type RepoFile = { path: string; size?: number };
type RepoBranch = { name: string; commit: { sha: string } };
type RepoActivity = {
  commits: Array<{ sha: string; url: string; message: string; author: string; createdAt: string }>;
  pullRequests: Array<{ number: number; title: string; state: string; url: string; createdAt: string; head: string; base: string }>;
};
type ProposedChange = { path: string; previousContent: string; content: string; message: string };
type ValidationRun = { id: number; name: string; status: string; conclusion: string | null; url: string; createdAt: string; branch: string; sha: string };
type Connection = { id: string; name: string; description: string; connected: boolean; note?: string };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

export function CodeAiWorkspace({ ownerEmail }: { ownerEmail: string }) {
  const [data, setData] = useState<WorkspaceData>({ projects: [], conversations: [], files: [] });
  const [projectId, setProjectId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [branch, setBranch] = useState("main");
  const [repoPanel, setRepoPanel] = useState<"files" | "activity" | "changes" | "connections" | null>(null);
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [branches, setBranches] = useState<RepoBranch[]>([]);
  const [activity, setActivity] = useState<RepoActivity>({ commits: [], pullRequests: [] });
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[]>([]);
  const [validationRuns, setValidationRuns] = useState<ValidationRun[]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
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
  const projectFiles = data.files.filter((file) => file.projectId === projectId);
  const visibleFiles = files.filter((file) => file.path.toLowerCase().includes(repoSearch.trim().toLowerCase())).slice(0, 300);

  const repositoryApi = useCallback(async <T,>(action: string, extra = "") => {
    if (!project?.repository) throw new Error("Choose a project first.");
    return api<T>(`/api/code-ai/repository?repository=${encodeURIComponent(project.repository)}&branch=${encodeURIComponent(branch)}&action=${action}${extra}`);
  }, [project?.repository, branch]);

  useEffect(() => {
    if (!project?.repository) return;
    void repositoryApi<RepoBranch[]>("branches").then(setBranches).catch(() => undefined);
  }, [project?.repository, repositoryApi]);

  async function openRepoPanel(panel: "files" | "activity" | "changes" | "connections") {
    setRepoPanel((current) => current === panel ? null : panel);
    if (repoPanel === panel || !project?.repository) return;
    setRepoLoading(true);
    setError("");
    try {
      if (panel === "files" && !files.length) setFiles(await repositoryApi<RepoFile[]>("tree"));
      if (panel === "activity") {
        const [repoActivity, runs] = await Promise.all([
          repositoryApi<RepoActivity>("activity"),
          api<ValidationRun[]>(`/api/code-ai/runner?repository=${encodeURIComponent(project.repository)}&branch=${encodeURIComponent(branch)}`).catch(() => []),
        ]);
        setActivity(repoActivity); setValidationRuns(runs);
      }
      if (panel === "connections") setConnections(await api<Connection[]>("/api/code-ai/connections"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load repository data.");
    } finally {
      setRepoLoading(false);
    }
  }

  async function runValidation() {
    if (!project || !window.confirm(`Run web type checks and a production build for ${branch}?`)) return;
    setRepoLoading(true); setError("");
    try {
      await api("/api/code-ai/runner", { method: "POST", body: JSON.stringify({ repository: project.repository, branch, scope: "web", approved: true }) });
      setRepoPanel("activity");
      window.setTimeout(() => void openRepoPanel("activity"), 1800);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to start validation."); }
    finally { setRepoLoading(false); }
  }

  async function openFile(path: string) {
    setRepoLoading(true);
    setError("");
    try {
      const file = await repositoryApi<{ content: string }>("file", `&path=${encodeURIComponent(path)}`);
      setSelectedFile({ path, content: file.content });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to read file.");
    } finally {
      setRepoLoading(false);
    }
  }

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

  async function newProject() {
    const name = window.prompt("Project name", "Blended Works");
    if (!name?.trim()) return;
    const repository = window.prompt("GitHub repository (owner/name)", "banhannah2025/cornett-inds");
    if (!repository?.trim()) return;
    try {
      const created = await api<CodeAiProject>("/api/code-ai/workspace", { method: "POST", body: JSON.stringify({ type: "project", name, repository }) });
      setData((current) => ({ ...current, projects: [created, ...current.projects] }));
      setProjectId(created._id);
      setConversationId("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create project."); }
  }

  async function renameConversation(item: CodeAiConversation) {
    const title = window.prompt("Rename conversation", item.title);
    if (!title?.trim() || title.trim() === item.title) return;
    try {
      await api("/api/code-ai/workspace", { method: "PATCH", body: JSON.stringify({ id: item._id, title }) });
      setData((current) => ({ ...current, conversations: current.conversations.map((chat) => chat._id === item._id ? { ...chat, title: title.trim() } : chat) }));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to rename conversation."); }
  }

  async function deleteConversation(item: CodeAiConversation) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try {
      await api(`/api/code-ai/workspace?id=${encodeURIComponent(item._id)}`, { method: "DELETE" });
      setData((current) => ({ ...current, conversations: current.conversations.filter((chat) => chat._id !== item._id) }));
      if (conversationId === item._id) setConversationId("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to delete conversation."); }
  }

  async function uploadFile(file?: File) {
    if (!file) return;
    setRepoLoading(true); setError("");
    try {
      const selectedProject = await ensureProject();
      const form = new FormData(); form.set("file", file); form.set("projectId", selectedProject._id);
      const response = await fetch("/api/code-ai/files", { method: "POST", body: form });
      const result = await response.json() as CodeAiAttachment & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Upload failed.");
      setData((current) => ({ ...current, files: [result, ...current.files] }));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to upload file."); }
    finally { setRepoLoading(false); if (uploadRef.current) uploadRef.current.value = ""; }
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
      const result = await api<{ message: CodeAiMessage; proposedChanges?: ProposedChange[] }>("/api/code-ai/chat", {
        method: "POST",
        body: JSON.stringify({ conversationId: selectedConversationId, message: text, repository: selectedProject.repository, branch, approveChanges }),
      });
      setData((current) => ({
        ...current,
        conversations: current.conversations.map((item) => item._id === selectedConversationId ? { ...item, messages: [...(item.messages ?? []), result.message] } : item),
      }));
      if (result.proposedChanges?.length) { setProposedChanges(result.proposedChanges); setRepoPanel("changes"); }
      setApproveChanges(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Code AI could not complete the task.");
    } finally {
      setSending(false);
    }
  }

  async function applyProposedChange(change: ProposedChange) {
    if (!project || !window.confirm(`Commit the proposed change to ${change.path} on ${branch}?`)) return;
    setRepoLoading(true);
    try {
      await api("/api/code-ai/repository", { method: "POST", body: JSON.stringify({ repository: project.repository, branch, path: change.path, content: change.content, message: change.message, approved: true }) });
      setProposedChanges((current) => current.filter((item) => item !== change));
      setFiles([]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to commit change."); }
    finally { setRepoLoading(false); }
  }

  return (
    <main className="code-ai-shell">
      {sidebarOpen && <button aria-label="Close navigation" className="code-ai-scrim" onClick={() => setSidebarOpen(false)} />}
      <aside className={`code-ai-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="code-ai-brand"><span><Code2 size={21} /></span><div><strong>Code AI</strong><small>Blended Works</small></div><button aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><X size={19}/></button></div>
        <button className="code-ai-new" onClick={newConversation}><MessageSquarePlus size={17}/>New coding task</button>
        <div className="code-ai-project-label"><span><FolderGit2 size={14}/>Project</span><button aria-label="Create project" onClick={newProject}><Plus size={15}/></button></div>
        {data.projects.length ? (
          <select value={projectId} onChange={(event) => { setProjectId(event.target.value); setConversationId(""); }}>
            {data.projects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        ) : <button className="code-ai-create-project" onClick={newConversation}>Create Blended Works project</button>}
        <div className="code-ai-project-label"><span><Paperclip size={14}/>Project files</span><button aria-label="Upload file" onClick={() => uploadRef.current?.click()}><Plus size={15}/></button></div>
        <input ref={uploadRef} hidden type="file" onChange={(event) => uploadFile(event.target.files?.[0])}/>
        <div className="code-ai-attachments">{projectFiles.slice(0, 4).map((file) => <a key={file._id} href={file.url} target="_blank" rel="noreferrer"><Paperclip size={12}/><span>{file.name}</span></a>)}{!projectFiles.length && <small>No uploaded files</small>}</div>
        <div className="code-ai-history">
          <p>Recent chats</p>
          {projectConversations.map((item) => (
            <div className={`code-ai-chat-row ${item._id === conversationId ? "active" : ""}`} key={item._id}>
              <button onClick={() => { setConversationId(item._id); setSidebarOpen(false); }}><FileCode2 size={15}/><span>{item.title}</span></button>
              <button aria-label={`Rename ${item.title}`} onClick={() => renameConversation(item)}><Pencil size={13}/></button>
              <button aria-label={`Delete ${item.title}`} onClick={() => deleteConversation(item)}><Trash2 size={13}/></button>
            </div>
          ))}
          {!loading && !projectConversations.length && <small>Your coding conversations will appear here.</small>}
        </div>
        <div className="code-ai-owner"><ShieldCheck size={17}/><div><strong>Private workspace</strong><small>{ownerEmail}</small></div></div>
      </aside>

      <section className="code-ai-main">
        <header className="code-ai-header">
          <button className="code-ai-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={21}/></button>
          <div><strong>{project?.name ?? "Code AI"}</strong><span>{project?.repository ?? "Private development workspace"}</span></div>
          <label className="code-ai-branch"><GitBranch size={14}/><span>Branch</span><select value={branch} onChange={(event) => { setBranch(event.target.value); setFiles([]); setSelectedFile(null); }}>{branches.length ? branches.map((item) => <option key={item.name} value={item.name}>{item.name}</option>) : <option value="main">main</option>}</select></label>
          <button className={repoPanel === "files" ? "active" : ""} onClick={() => openRepoPanel("files")}><FileSearch size={17}/><span>Files</span></button>
          <button className={repoPanel === "activity" ? "active" : ""} onClick={() => openRepoPanel("activity")}><History size={17}/><span>Activity</span></button>
          <button className={repoPanel === "changes" ? "active" : ""} onClick={() => openRepoPanel("changes")}><GitCompareArrows size={17}/><span>Changes{proposedChanges.length ? ` (${proposedChanges.length})` : ""}</span></button>
          <button onClick={runValidation}><Play size={16}/><span>Run checks</span></button>
          <button className={repoPanel === "connections" ? "active" : ""} onClick={() => openRepoPanel("connections")}><Plug size={16}/><span>Connections</span></button>
        </header>

        <div className="code-ai-work-area">
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
        {repoPanel ? <aside className="code-ai-repo-panel">
          <div className="code-ai-repo-title"><div>{repoPanel === "files" ? <FileSearch size={17}/> : repoPanel === "activity" ? <History size={17}/> : repoPanel === "changes" ? <GitCompareArrows size={17}/> : <Plug size={17}/>}<strong>{repoPanel === "files" ? "Repository files" : repoPanel === "activity" ? "Repository activity" : repoPanel === "changes" ? "Proposed changes" : "Tools and connections"}</strong></div><button aria-label="Close repository panel" onClick={() => setRepoPanel(null)}><X size={18}/></button></div>
          {repoLoading && <div className="code-ai-repo-loading"><LoaderCircle className="animate-spin" size={17}/>Loading from GitHub…</div>}
          {repoPanel === "files" ? <>
            <div className="code-ai-file-search"><FileSearch size={15}/><input value={repoSearch} onChange={(event) => setRepoSearch(event.target.value)} placeholder="Filter files by path"/></div>
            {selectedFile ? <div className="code-ai-file-view"><button onClick={() => setSelectedFile(null)}><ChevronRight size={15}/>All files</button><strong>{selectedFile.path}</strong><pre>{selectedFile.content}</pre></div> : <div className="code-ai-file-list">{visibleFiles.map((file) => <button key={file.path} onClick={() => openFile(file.path)}><FileCode2 size={14}/><span>{file.path}</span><small>{file.size ? `${Math.ceil(file.size / 1024)} KB` : ""}</small></button>)}</div>}
          </> : repoPanel === "activity" ? <div className="code-ai-activity">
            <h3><RefreshCw size={15}/>Validation runs</h3>
            {validationRuns.length ? validationRuns.map((run) => <a key={run.id} href={run.url} target="_blank" rel="noreferrer"><span><strong>{run.status === "completed" ? run.conclusion ?? "completed" : run.status} · {run.branch}</strong><small>{run.sha.slice(0, 7)} · {new Date(run.createdAt).toLocaleString()}</small></span><ExternalLink size={13}/></a>) : <p>No Code AI validation runs yet.</p>}
            <h3><GitCommitHorizontal size={15}/>Recent commits</h3>
            {activity.commits.map((item) => <a key={item.sha} href={item.url} target="_blank" rel="noreferrer"><span><strong>{item.message.split("\n")[0]}</strong><small>{item.sha.slice(0, 7)} · {item.author}</small></span><ExternalLink size={13}/></a>)}
            <h3><GitPullRequest size={15}/>Pull requests</h3>
            {activity.pullRequests.map((item) => <a key={item.number} href={item.url} target="_blank" rel="noreferrer"><span><strong>#{item.number} {item.title}</strong><small>{item.state} · {item.head} → {item.base}</small></span><ExternalLink size={13}/></a>)}
          </div> : repoPanel === "changes" ? <div className="code-ai-changes">{proposedChanges.length ? proposedChanges.map((change) => <article key={change.path}><header><div><strong>{change.path}</strong><small>{change.message}</small></div><button disabled={repoLoading} onClick={() => applyProposedChange(change)}><CheckCircle2 size={14}/>Commit</button></header><div><section><b>Before</b><pre>{change.previousContent || "New file"}</pre></section><section><b>After</b><pre>{change.content}</pre></section></div></article>) : <p>No changes are waiting for review. Keep “Review only” selected when asking Code AI to edit files.</p>}</div> : <div className="code-ai-connections">{connections.map((connection) => <article key={connection.id}><span className={connection.connected ? "connected" : ""}/><div><strong>{connection.name}</strong><p>{connection.description}</p>{connection.note && <small>{connection.note}</small>}</div><b>{connection.connected ? "Connected" : "Needs setup"}</b></article>)}</div>}
        </aside> : null}
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
