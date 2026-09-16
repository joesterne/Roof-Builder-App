import React, { useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import Sidebar from "./components/Sidebar";
import Visualizer from "./components/Visualizer";
import BOMExport from "./components/BOMExport";
import CodeAnalysis from "./components/CodeAnalysis";
import Header from "./components/Header";
import LoadProjectModal from "./components/modals/LoadProjectModal";
import ResetConfirmModal from "./components/modals/ResetConfirmModal";
import AuthModal from "./components/modals/AuthModal";
import QRCodeModal from "./components/modals/QRCodeModal";
import { auth, firebaseConfigured } from "./lib/firebase";
import {
  DEFAULT_PARAMS,
  parseProject,
  encodeProject,
  decodeProject,
} from "./lib/project";
import { diagramDataUri } from "./lib/diagram";
import { useProjectSync } from "./hooks/useProjectSync";
import { areaUnit, displayArea, formatNumber } from "./utils";
import type { RoofParams, Layer, SavedProject } from "./types";

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      className="m-auto w-[min(92vw,600px)] rounded-xl border border-border-main bg-bg-panel p-6 text-text-main shadow-2xl backdrop:bg-black/50"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <button onClick={onClose} aria-label="Close dialog">
          ✕
        </button>
      </div>
      {children}
    </dialog>
  );
}
export default function App() {
  const [params, setParams] = useState<RoofParams>({ ...DEFAULT_PARAMS });
  const [layers, setLayers] = useState<Layer[]>([]);
  const [tab, setTab] = useState<"visualizer" | "bom" | "code">("visualizer");
  const [modal, setModal] = useState<
    "" | "save" | "load" | "reset" | "share" | "auth" | "qr"
  >("");
  const [name, setName] = useState("My roof project");
  const [shareUrl, setShareUrl] = useState("");
  const [sort, setSort] = useState("newest");
  const [sidebar, setSidebar] = useState(false);
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);
  const preserveAutosave = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('soprema_dark_mode') === 'true'; }
    catch { return false; }
  });
  const { savedProjects, saveProject, deleteProject, fetchProjects } =
    useProjectSync(user);
  useEffect(() => {
    if (auth) return onAuthStateChanged(auth, setUser);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem('soprema_dark_mode', String(dark)); } catch { /* Preference storage is optional. */ }
  }, [dark]);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const hash = new URLSearchParams(location.hash.slice(1)).get("project");
      const old = new URLSearchParams(location.search).get("state");
      const saved = localStorage.getItem("soprema_autosave");
      const project = hash
        ? decodeProject(hash)
        : old
          ? parseProject(JSON.parse(atob(old)))
          : saved
            ? parseProject(JSON.parse(saved))
            : null;
      if (project) {
        setParams(project.params);
        setLayers(project.layers);
        if (hash || old) toast.success("Shared project loaded");
      }
      if (new URLSearchParams(location.search).get("export") === "pdf")
        setTab("bom");
      if (hash || old) history.replaceState({}, '', location.pathname);
    } catch (e) {
      preserveAutosave.current = true;
      toast.error(
        `Could not restore project: ${e instanceof Error ? e.message : "Invalid data"}`,
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    // Leave a failed recovery untouched until the user starts or loads another project.
    if (preserveAutosave.current && layers.length === 0 && JSON.stringify(params) === JSON.stringify(DEFAULT_PARAMS)) return;
    preserveAutosave.current = false;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          "soprema_autosave",
          JSON.stringify({ schemaVersion: 2, params, layers }),
        );
      } catch {
        toast.error("Autosave unavailable. Export JSON to keep a backup.");
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [params, layers, ready]);
  const error = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : "Operation failed");
  const load = (p: SavedProject) => {
    try {
      const safe = parseProject(p);
      setParams({ ...safe.params, name: p.name });
      setLayers(safe.layers);
      setModal("");
      toast.success("Project loaded");
    } catch (e) {
      error(e);
    }
  };
  const share = (qr = false) => {
    try {
      const url = `${location.origin}${location.pathname}#project=${encodeProject(params, layers)}`;
      if (qr && url.length > 1800) throw new Error('This project is too large for a readable QR code. Use Share to copy the link or export JSON.');
      setShareUrl(url);
      setModal(qr ? "qr" : "share");
    } catch (e) {
      error(e);
    }
  };
  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ schemaVersion: 2, params, layers }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roof-project.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const pdfUrl = shareUrl.replace("#project=", "?export=pdf#project=");
  const summary = `${params.name || "Roof project"}\nArea: ${formatNumber(displayArea(params.area, params.unitSystem))} ${areaUnit(params.unitSystem)} (${params.areaBasis || "plan"})\nPitch: ${params.pitch}:12\nLocation: ${params.location || "Unspecified"}\nLayers, bottom to top:\n${[
    ...layers,
  ]
    .sort((a, b) => a.order - b.order)
    .map((l, i) => `${i + 1}. ${l.material.name}`)
    .join(
      "\n",
    )}\n\nOpen project: ${shareUrl}\nOpen bill of materials and download PDF: ${pdfUrl}`;
  const sorted = [...savedProjects].sort((a, b) =>
    sort === "name-asc"
      ? a.name.localeCompare(b.name)
      : sort === "name-desc"
        ? b.name.localeCompare(a.name)
        : sort === "oldest"
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date),
  );
  return (
    <div className="flex h-dvh flex-col bg-bg-page text-text-main font-sans">
      <Toaster richColors position="bottom-right" />
      <Header
        isDarkMode={dark}
        setIsDarkMode={setDark}
        params={params}
        toggleUnitSystem={() =>
          setParams((p) => ({
            ...p,
            unitSystem: p.unitSystem === "metric" ? "imperial" : "metric",
          }))
        }
        handleExport={exportJson}
        openNotesModal={() => { setSidebar(true); requestAnimationFrame(() => document.getElementById("project-notes")?.focus()); }}
        handleShare={() => share()}
        handleShareQR={() => share(true)}
        handleSave={() => {
          setName(params.name || "My roof project");
          setModal("save");
        }}
        handleLoadClick={() => {
          void fetchProjects();
          setModal("load");
        }}
        openResetConfirm={() => setModal("reset")}
        statusMessage=""
        user={user}
        onAuthClick={() =>
          firebaseConfigured
            ? setModal("auth")
            : toast.info(
                "Cloud sign-in is not configured. Save and Load work on this device.",
              )
        }
        onSignOut={() => {
          if (auth) void signOut(auth);
        }}
      />
      <div className="flex min-h-0 flex-1">
        <div
          className={`${sidebar ? "fixed inset-0 z-40 flex bg-bg-panel" : "hidden"} w-full lg:static lg:flex lg:w-[360px] lg:shrink-0`}
        >
          <Sidebar
            params={params}
            setParams={setParams}
            layers={layers}
            setLayers={setLayers}
          />
          {sidebar && (
            <button
              className="absolute right-2 top-2 rounded bg-soprema-blue p-2 text-white lg:hidden"
              onClick={() => setSidebar(false)}
            >
              Done
            </button>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <nav
            aria-label="Workspace views"
            className="flex flex-wrap gap-2 border-b border-border-main bg-bg-panel px-5 py-3"
          >
            <button
              className="rounded border p-2 text-sm lg:hidden"
              onClick={() => setSidebar(!sidebar)}
            >
              Materials & parameters
            </button>
            {(["visualizer", "bom", "code"] as const).map((t) => (
              <button
                key={t}
                aria-current={tab === t ? "page" : undefined}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === t ? "bg-soprema-blue text-white" : "text-text-muted hover:bg-bg-panel-hover"}`}
              >
                {t === "visualizer"
                  ? "Assembly studio"
                  : t === "bom"
                    ? "Bill of materials"
                    : "Location & requirements"}
              </button>
            ))}
            <label className="ml-auto cursor-pointer rounded border border-border-main px-3 py-2 text-sm">
              Import JSON
              <input
                aria-label="Import project JSON"
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.size > 2_000_000)
                      throw Error("Project file is too large");
                    const p = parseProject(JSON.parse(await file.text()));
                    setParams(p.params);
                    setLayers(p.layers);
                    toast.success("Project imported");
                  } catch (err) {
                    error(err);
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </nav>
          <main className="relative min-h-0 flex-1 overflow-auto">
            {tab === "visualizer" ? (
              <Visualizer
                params={params}
                setParams={setParams}
                layers={layers}
                setLayers={setLayers}
              />
            ) : tab === "bom" ? (
              <BOMExport
                params={params}
                setParams={setParams}
                layers={layers}
                setLayers={setLayers}
              />
            ) : (
              <CodeAnalysis
                params={params}
                setParams={setParams}
                layers={layers}
              />
            )}
          </main>
        </div>
      </div>
      {modal === "save" && (
        <Dialog title="Save project" onClose={() => setModal("")}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const named = { ...params, name: name.trim() };
              const project: SavedProject = {
                schemaVersion: 2,
                id: crypto.randomUUID(),
                name: name.trim(),
                date: new Date().toISOString(),
                params: named,
                layers,
                thumbnail: diagramDataUri(named, layers),
              };
              if (await saveProject(project)) {
                setParams(named);
                setModal("");
              }
            }}
          >
            <label className="block text-sm">
              Project name
              <input
                autoFocus
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="my-2 w-full rounded border border-border-main bg-bg-panel p-3"
              />
            </label>
            <p className="mb-4 text-sm text-text-muted">
              Saves materials, notes, parameters, and a preview of this assembly
              on this device.
            </p>
            <button className="rounded bg-soprema-blue px-5 py-2 text-white">
              Save project
            </button>
          </form>
        </Dialog>
      )}
      {modal === "share" && (
        <Dialog title="Share project" onClose={() => setModal("")}>
          <p className="mb-3 text-sm text-text-muted">
            The link includes your project notes and client details. Anyone with
            it can open a copy and download its PDF.
          </p>
          <label className="text-sm">
            Project link
            <textarea
              readOnly
              value={shareUrl}
              className="my-2 h-24 w-full rounded border border-border-main bg-bg-page p-3"
              onFocus={(e) => e.target.select()}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded bg-soprema-blue px-4 py-2 text-white"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copied");
                } catch {
                  toast.info("Select and copy the link above.");
                }
              }}
            >
              Copy link
            </button>
            <a
              className="rounded border px-4 py-2"
              href={`mailto:?subject=${encodeURIComponent(params.name || "Roof project")}&body=${encodeURIComponent(summary)}`}
            >
              Prepare email
            </a>
            <a
              className="rounded border px-4 py-2"
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open PDF export
            </a>
          </div>
        </Dialog>
      )}
      {modal === "load" && (
        <LoadProjectModal
          sortOrder={sort}
          setSortOrder={setSort}
          sortedProjects={sorted}
          onClose={() => setModal("")}
          onLoad={load}
          onDelete={(id) => {
            if (confirm("Delete this saved project?")) void deleteProject(id);
          }}
          onDuplicate={(p) => {
            void saveProject({
              ...p,
              id: crypto.randomUUID(),
              name: `${p.name} (Copy)`,
              date: new Date().toISOString(),
            });
          }}
        />
      )}
      {modal === "reset" && (
        <ResetConfirmModal
          onClose={() => setModal("")}
          onConfirm={() => {
            setParams({ ...DEFAULT_PARAMS });
            setLayers([]);
            setTab("visualizer");
            setModal("");
            history.replaceState({}, "", location.pathname);
            toast.success("Workspace reset. Saved projects are retained.");
          }}
        />
      )}
      {modal === "auth" && (
        <AuthModal
          onClose={() => setModal("")}
          onSuccess={() => setModal("")}
        />
      )}
      {modal === "qr" && (
        <QRCodeModal url={shareUrl} onClose={() => setModal("")} />
      )}
    </div>
  );
}
