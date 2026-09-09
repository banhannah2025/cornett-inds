"use client";

import {
  Archive,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  Code2,
  ExternalLink,
  FileCode2,
  FileSearch,
  FolderGit2,
  Download,
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
import type { CodeAiAttachment, CodeAiAudit, CodeAiChangeSet, CodeAiConversation, CodeAiMessage, CodeAiProject } from "@/lib/code-ai/store";

type WorkspaceData = { projects: CodeAiProject[]; conversations: CodeAiConversation[]; files: CodeAiAttachment[]; audit: CodeAiAudit[]; changeSets: CodeAiChangeSet[] };
type RepoFile = { path: string; size?: number };
type RepoBranch = { name: string; commit: { sha: string } };
type RepoActivity = {
  commits: Array<{ sha: string; url: string; message: string; author: string; createdAt: string }>;
  pullRequests: Array<{ number: number; title: string; state: string; url: string; createdAt: string; head: string; base: string }>;
  deployment?: { state: string; statuses: Array<{ context: string; state: string; target_url?: string; description?: string }> } | null;
};
type ProposedChange = CodeAiChangeSet["changes"][number];
type ValidationRun = { id: number; name: string; status: string; conclusion: string | null; url: string; createdAt: string; branch: string; sha: string };
type Connection = { id: string; name: string; description: string; connected: boolean; note?: string };

type DiffLine = { kind: "same" | "add" | "remove"; text: string; oldLine?: number; newLine?: number };

function buildLineDiff(before: string, after: string): DiffLine[] {
  const left = before.split("\n");
  const right = after.split("\n");
  if (left.length * right.length > 250_000) return [];
  const table = Array.from({ length: left.length + 1 }, () => new Uint16Array(right.length + 1));
  for (let i = left.length - 1; i >= 0; i--) for (let j = right.length - 1; j >= 0; j--) table[i]![j] = left[i] === right[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
  const rows: DiffLine[] = []; let i = 0; let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) { rows.push({ kind: "same", text: left[i]!, oldLine: ++i, newLine: ++j }); }
    else if (j < right.length && (i === left.length || table[i]![j + 1]! >= table[i + 1]![j]!)) { rows.push({ kind: "add", text: right[j]!, newLine: ++j }); }
    else { rows.push({ kind: "remove", text: left[i]!, oldLine: ++i }); }
  }
  return rows;
}

function ChangePreview({ change }: { change: ProposedChange }) {
  const rows = useMemo(() => buildLineDiff(change.previousContent, change.content), [change.previousContent, change.content]);
  if (!rows.length) return <div className="code-ai-split-diff"><section><b>Before</b><pre>{change.previousContent || "New file"}</pre></section><section><b>After</b><pre>{change.content}</pre></section></div>;
  return <pre className="code-ai-line-diff">{rows.map((row, index) => <span className={row.kind} key={`${index}-${row.kind}`}><i>{row.oldLine ?? ""}</i><i>{row.newLine ?? ""}</i><b>{row.kind === "add" ? "+" : row.kind === "remove" ? "−" : " "}</b><code>{row.text || " "}</code></span>)}</pre>;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

export function CodeAiWorkspace({ ownerEmail }: { ownerEmail: string }) {
  const [data, setData] = useState<WorkspaceData>({ projects: [], conversations: [], files: [], audit: [], changeSets: [] });
  const [projectId, setProjectId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [branch, setBranch] = useState("main");
  const [repoPanel, setRepoPanel] = useState<"files" | "activity" | "changes" | "connections" | null>(null);
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [branches, setBranches] = useState<RepoBranch[]>([]);
  const [activity, setActivity] = useState<RepoActivity>({ commits: [], pullRequests: [], deployment: null });
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[]>([]);
  const [currentChangeSetId, setCurrentChangeSetId] = useState("");
  const [validationRuns, setValidationRuns] = useState<ValidationRun[]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [approveChanges, setApproveChanges] = useState(false);
  const [model, setModel] = useState("gpt-5.6-terra");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

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
  useEffect(() => { setNotificationsEnabled(typeof Notification !== "undefined" && Notification.permission === "granted"); }, []);

  const project = data.projects.find((item) => item._id === projectId);
  const projectConversations = useMemo(
    () => data.conversations.filter((item) => item.projectId === projectId && !item.archived && item.title.toLowerCase().includes(chatSearch.toLowerCase())),
    [data.conversations, projectId, chatSearch],
  );
  const conversation = data.conversations.find((item) => item._id === conversationId);
  const messages = conversation?.messages ?? [];
  const projectFiles = data.files.filter((file) => file.projectId === projectId);
  const visibleFiles = files.filter((file) => file.path.toLowerCase().includes(repoSearch.trim().toLowerCase())).slice(0, 300);

  useEffect(() => {
    const candidates = data.changeSets.filter((item) => item.projectId === projectId && item.branch === branch);
    const selected = candidates.find((item) => item.conversationId === conversationId) ?? candidates[0];
    setCurrentChangeSetId(selected?._id ?? "");
    setProposedChanges(selected?.changes ?? []);
  }, [data.changeSets, projectId, conversationId, branch]);

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

  async function runValidation(scope: "web" | "visual" = "web") {
    if (!project || !window.confirm(scope === "visual" ? `Run desktop and mobile browser checks for ${branch}?` : `Run web type checks and a production build for ${branch}?`)) return;
    setRepoLoading(true); setError("");
    try {
      await api("/api/code-ai/runner", { method: "POST", body: JSON.stringify({ repository: project.repository, branch, scope, approved: true }) });
      setRepoPanel("activity");
      window.setTimeout(() => void openRepoPanel("activity"), 1800);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to start validation."); }
    finally { setRepoLoading(false); }
  }

  async function controlRun(run: ValidationRun, action: "cancel" | "rerun") {
    if (!project || !window.confirm(`${action === "cancel" ? "Cancel" : "Rerun"} validation ${run.id}?`)) return;
    setRepoLoading(true); setError("");
    try {
      await api("/api/code-ai/runner", { method: "POST", body: JSON.stringify({ action, repository: project.repository, runId: run.id, approved: true }) });
      window.setTimeout(async () => setValidationRuns(await api<ValidationRun[]>(`/api/code-ai/runner?repository=${encodeURIComponent(project.repository)}&branch=${encodeURIComponent(branch)}`)), 1200);
    } catch (caught) { setError(caught instanceof Error ? caught.message : `Unable to ${action} validation.`); }
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

  async function archiveConversation(item: CodeAiConversation) {
    try {
      await api("/api/code-ai/workspace", { method: "PATCH", body: JSON.stringify({ id: item._id, archived: true }) });
      setData((current) => ({ ...current, conversations: current.conversations.map((chat) => chat._id === item._id ? { ...chat, archived: true } : chat) }));
      if (conversationId === item._id) setConversationId("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to archive conversation."); }
  }

  function exportWorkspace() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), project, conversations: data.conversations.filter((item) => item.projectId === projectId), files: projectFiles }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `${project?.name ?? "code-ai"}-export.json`; link.click(); URL.revokeObjectURL(url);
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
      const result = await api<{ message: CodeAiMessage; proposedChanges?: ProposedChange[]; changeSet?: CodeAiChangeSet | null }>("/api/code-ai/chat", {
        method: "POST",
        body: JSON.stringify({ conversationId: selectedConversationId, projectId: selectedProject._id, message: text, repository: selectedProject.repository, branch, model, attachmentIds, approveChanges }),
      });
      setData((current) => ({
        ...current,
        conversations: current.conversations.map((item) => item._id === selectedConversationId ? { ...item, messages: [...(item.messages ?? []), result.message] } : item),
      }));
      if (result.changeSet) {
        setData((current) => ({ ...current, changeSets: [result.changeSet!, ...current.changeSets.filter((item) => item._id !== result.changeSet!._id)] }));
        setCurrentChangeSetId(result.changeSet._id); setProposedChanges(result.changeSet.changes); setRepoPanel("changes");
      }
      if (notificationsEnabled && document.visibilityState !== "visible") new Notification("Code AI finished", { body: result.proposedChanges?.length ? `${result.proposedChanges.length} changes are ready for review.` : "Your coding response is ready." });
      setApproveChanges(false);
      setAttachmentIds([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Code AI could not complete the task.");
    } finally {
      setSending(false);
    }
  }

  async function toggleNotifications() {
    if (!("Notification" in window)) { setError("This browser does not support notifications."); return; }
    const permission = await Notification.requestPermission(); setNotificationsEnabled(permission === "granted");
    if (permission !== "granted") setError("Browser notifications were not enabled.");
  }

  async function applyProposedChange(change: ProposedChange) {
    if (!project || !window.confirm(`Commit the proposed change to ${change.path} on ${branch}?`)) return;
    setRepoLoading(true);
    try {
      await api("/api/code-ai/repository", { method: "POST", body: JSON.stringify({ repository: project.repository, branch, path: change.path, content: change.content, message: change.message, changeSetId: currentChangeSetId, changeKey: change._key, approved: true }) });
      setProposedChanges((current) => current.filter((item) => item !== change));
      setData((current) => ({ ...current, changeSets: current.changeSets.flatMap((item) => {
        if (item._id !== currentChangeSetId) return [item];
        const changes = item.changes.filter((candidate) => candidate._key !== change._key);
        return changes.length ? [{ ...item, changes }] : [];
      }) }));
      setFiles([]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to commit change."); }
    finally { setRepoLoading(false); }
  }

  async function commitAllChanges() {
    if (!project || !proposedChanges.length) return;
    const message = window.prompt("Commit message", `Apply ${proposedChanges.length} Code AI changes`);
    if (!message?.trim() || !window.confirm(`Commit ${proposedChanges.length} files to ${branch} as one atomic commit?`)) return;
    setRepoLoading(true); setError("");
    try {
      await api("/api/code-ai/repository", { method: "POST", body: JSON.stringify({ action: "commit", repository: project.repository, branch, message, changeSetId: currentChangeSetId, changes: proposedChanges.map(({ path, content }) => ({ path, content })), approved: true }) });
      setData((current) => ({ ...current, changeSets: current.changeSets.filter((item) => item._id !== currentChangeSetId) }));
      setCurrentChangeSetId(""); setProposedChanges([]); setFiles([]); setRepoPanel("activity");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to commit change set."); }
    finally { setRepoLoading(false); }
  }

  async function createBranch() {
    if (!project) return;
    const name = window.prompt("New branch name", "feature/");
    if (!name?.trim() || !window.confirm(`Create ${name} from ${branch}?`)) return;
    setRepoLoading(true); setError("");
    try {
      await api("/api/code-ai/repository", { method: "POST", body: JSON.stringify({ action: "branch", repository: project.repository, branch: name.trim(), from: branch, approved: true }) });
      const next = await repositoryApi<RepoBranch[]>("branches"); setBranches(next); setBranch(name.trim()); setFiles([]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create branch."); }
    finally { setRepoLoading(false); }
  }

  async function createPullRequest() {
    if (!project || branch === "main") { setError("Choose or create a feature branch before opening a pull request."); return; }
    const title = window.prompt("Pull request title");
    if (!title?.trim()) return;
    const description = window.prompt("Pull request description", "Created from Code AI.") ?? "";
    if (!window.confirm(`Open a pull request from ${branch} into main?`)) return;
    setRepoLoading(true); setError("");
    try {
      const result = await api<{ html_url: string }>("/api/code-ai/repository", { method: "POST", body: JSON.stringify({ action: "pullRequest", repository: project.repository, head: branch, base: "main", title, description, approved: true }) });
      window.open(result.html_url, "_blank", "noopener,noreferrer"); setRepoPanel("activity");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create pull request."); }
    finally { setRepoLoading(false); }
  }

  async function undoLatestCommit(item: RepoActivity["commits"][number]) {
    if (!project || !window.confirm(`Create a revert commit for “${item.message.split("\n")[0]}” on ${branch}?`)) return;
    setRepoLoading(true); setError("");
    try {
      await api("/api/code-ai/repository", { method: "POST", body: JSON.stringify({ action: "revert", repository: project.repository, branch, expectedSha: item.sha, approved: true }) });
      setActivity(await repositoryApi<RepoActivity>("activity")); setFiles([]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to undo latest commit."); }
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
        <div className="code-ai-attachments">{projectFiles.slice(0, 6).map((file) => <button className={attachmentIds.includes(file._id) ? "selected" : ""} key={file._id} onClick={() => setAttachmentIds((current) => current.includes(file._id) ? current.filter((id) => id !== file._id) : [...current, file._id].slice(-5))}><Paperclip size={12}/><span>{file.name}</span></button>)}{!projectFiles.length && <small>No uploaded files</small>}</div>
        <div className="code-ai-history">
          <div className="code-ai-history-head"><p>Recent chats</p><button aria-label="Export project" onClick={exportWorkspace}><Download size={13}/></button></div>
          <div className="code-ai-chat-search"><FileSearch size={13}/><input value={chatSearch} onChange={(event) => setChatSearch(event.target.value)} placeholder="Search chats"/></div>
          {projectConversations.map((item) => (
            <div className={`code-ai-chat-row ${item._id === conversationId ? "active" : ""}`} key={item._id}>
              <button onClick={() => { setConversationId(item._id); setSidebarOpen(false); }}><FileCode2 size={15}/><span>{item.title}</span></button>
              <button aria-label={`Rename ${item.title}`} onClick={() => renameConversation(item)}><Pencil size={13}/></button>
              <button aria-label={`Archive ${item.title}`} onClick={() => archiveConversation(item)}><Archive size={13}/></button>
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
          <button onClick={createBranch} title="Create branch"><Plus size={16}/><span>Branch</span></button>
          <button onClick={createPullRequest} title="Open pull request"><GitPullRequest size={16}/><span>PR</span></button>
          <button className={repoPanel === "files" ? "active" : ""} onClick={() => openRepoPanel("files")}><FileSearch size={17}/><span>Files</span></button>
          <button className={repoPanel === "activity" ? "active" : ""} onClick={() => openRepoPanel("activity")}><History size={17}/><span>Activity</span></button>
          <button className={repoPanel === "changes" ? "active" : ""} onClick={() => openRepoPanel("changes")}><GitCompareArrows size={17}/><span>Changes{proposedChanges.length ? ` (${proposedChanges.length})` : ""}</span></button>
          <button onClick={() => runValidation()}><Play size={16}/><span>Run checks</span></button>
          <button className={repoPanel === "connections" ? "active" : ""} onClick={() => openRepoPanel("connections")}><Plug size={16}/><span>Connections</span></button>
          <button className={notificationsEnabled ? "active" : ""} onClick={toggleNotifications} title="Browser notifications"><Bell size={16}/><span>Alerts</span></button>
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
            <h3><ExternalLink size={15}/>Latest deployment</h3>
            {activity.deployment?.statuses?.length ? activity.deployment.statuses.map((status) => status.target_url ? <a key={status.context} href={status.target_url} target="_blank" rel="noreferrer"><span><strong>{status.context} · {status.state}</strong><small>{status.description ?? "Open deployment details and logs"}</small></span><ExternalLink size={13}/></a> : <div className="code-ai-audit" key={status.context}><strong>{status.context}</strong><span>{status.state}</span></div>) : <p>No deployment status is attached to the latest commit.</p>}
            <h3><RefreshCw size={15}/>Validation runs</h3>
            <div className="code-ai-validation-actions"><button onClick={() => runValidation("visual")}><Play size={13}/>Run browser checks</button></div>
            {validationRuns.length ? validationRuns.map((run) => <div className="code-ai-run-row" key={run.id}><a href={run.url} target="_blank" rel="noreferrer"><span><strong>{run.status === "completed" ? run.conclusion ?? "completed" : run.status} · {run.branch}</strong><small>{run.sha.slice(0, 7)} · {new Date(run.createdAt).toLocaleString()}</small></span><ExternalLink size={13}/></a><button onClick={() => controlRun(run, run.status === "completed" ? "rerun" : "cancel")}>{run.status === "completed" ? "Retry" : "Cancel"}</button></div>) : <p>No Code AI validation runs yet.</p>}
            <h3><ShieldCheck size={15}/>Audit history</h3>
            {data.audit.slice(0, 15).map((item) => <div className="code-ai-audit" key={item._id}><strong>{item.action}</strong><span>{item.summary}</span><small>{new Date(item.createdAt).toLocaleString()}</small></div>)}
            <h3><GitCommitHorizontal size={15}/>Recent commits</h3>
            {activity.commits.map((item, index) => <div className="code-ai-activity-row" key={item.sha}><a href={item.url} target="_blank" rel="noreferrer"><span><strong>{item.message.split("\n")[0]}</strong><small>{item.sha.slice(0, 7)} · {item.author}</small></span><ExternalLink size={13}/></a>{index === 0 && <button onClick={() => undoLatestCommit(item)}>Undo</button>}</div>)}
            <h3><GitPullRequest size={15}/>Pull requests</h3>
            {activity.pullRequests.map((item) => <a key={item.number} href={item.url} target="_blank" rel="noreferrer"><span><strong>#{item.number} {item.title}</strong><small>{item.state} · {item.head} → {item.base}</small></span><ExternalLink size={13}/></a>)}
          </div> : repoPanel === "changes" ? <div className="code-ai-changes">{proposedChanges.length ? <><div className="code-ai-change-actions"><small>Saved for review</small><button onClick={commitAllChanges}><CheckCircle2 size={14}/>Commit all atomically</button></div>{proposedChanges.map((change) => <article key={change._key}><header><div><strong>{change.path}</strong><small>{change.message}</small></div><button disabled={repoLoading} onClick={() => applyProposedChange(change)}><CheckCircle2 size={14}/>Commit</button></header><ChangePreview change={change}/></article>)}</> : <p>No changes are waiting for review. Enable “File changes approved” when you want Code AI to prepare edits.</p>}</div> : <div className="code-ai-connections">{connections.map((connection) => <article key={connection.id}><span className={connection.connected ? "connected" : ""}/><div><strong>{connection.name}</strong><p>{connection.description}</p>{connection.note && <small>{connection.note}</small>}</div><b>{connection.connected ? "Connected" : "Needs setup"}</b></article>)}</div>}
        </aside> : null}
        </div>

        <div className="code-ai-composer-wrap">
          {error && <div className="code-ai-error">{error}</div>}
          <div className="code-ai-composer">
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Message Code AI about your project…" rows={3}/>
            <div>
              <div className="code-ai-composer-options"><select aria-label="AI model" value={model} onChange={(event) => setModel(event.target.value)}><option value="gpt-5.6-luna">Luna · lowest cost</option><option value="gpt-5.6-terra">Terra · balanced</option><option value="gpt-5.6-sol">Sol · strongest</option></select>{attachmentIds.length > 0 && <span className="code-ai-attached-count"><Paperclip size={12}/>{attachmentIds.length}</span>}<label className={approveChanges ? "approved" : ""}><input type="checkbox" checked={approveChanges} onChange={(event) => setApproveChanges(event.target.checked)}/><CheckCircle2 size={15}/>{approveChanges ? "File changes approved" : "Review only"}</label></div>
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
  return <article className={`code-ai-message ${message.role}`}><span>{message.role === "assistant" ? <Bot size={18}/> : <UserRound size={18}/>}</span><div><strong>{message.role === "assistant" ? "Code AI" : "You"}</strong><p>{message.content}</p>{message.role === "assistant" && message.model && <small>{message.model} · {(message.inputTokens ?? 0).toLocaleString()} input · {(message.outputTokens ?? 0).toLocaleString()} output tokens</small>}</div></article>;
}
