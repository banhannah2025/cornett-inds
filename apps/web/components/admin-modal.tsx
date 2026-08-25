"use client";

import { useRef } from "react";
import { Pencil, Plus, X } from "lucide-react";

export function AdminModal({
  title,
  triggerLabel,
  mode = "edit",
  children,
}: {
  title: string;
  triggerLabel: string;
  mode?: "edit" | "create";
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        className="inline-flex items-center gap-2 rounded-full bg-[#f4b860] px-4 py-2.5 text-sm font-bold text-[#1e2a24] shadow-lg transition hover:bg-[#ffd08a]"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        {mode === "create" ? (
          <Plus className="size-4" />
        ) : (
          <Pencil className="size-4" />
        )}
        {triggerLabel}
      </button>
      <dialog
        className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-[2rem] border border-[#1e2a24]/15 bg-[#f6f3eb] p-0 text-[#1e2a24] shadow-2xl backdrop:bg-[#0f1915]/75"
        ref={dialogRef}
      >
        <div className="flex items-center justify-between border-b border-[#1e2a24]/10 px-6 py-5 sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d2d]">
              Administrator
            </p>
            <h2 className="font-serif text-3xl">{title}</h2>
          </div>
          <button
            aria-label="Close editor"
            className="rounded-full border border-[#1e2a24]/15 p-2 hover:bg-[#ebe7dc]"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-6rem)] overflow-y-auto p-6 sm:p-8">
          {children}
        </div>
      </dialog>
    </>
  );
}
