"use client";

import { Maximize2, X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

type ExpandableImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  caption?: string;
  iconOnly?: boolean;
};

export function ExpandableImage({
  src,
  alt,
  className = "",
  imageClassName = "object-cover",
  sizes = "100vw",
  priority = false,
  caption,
  iconOnly = false,
}: ExpandableImageProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const label = alt ? `View ${alt} full screen` : "View image full screen";

  async function open() {
    const dialog = dialogRef.current;
    if (!dialog) return;

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen({
          navigationUI: "hide",
        });
      }
    } catch {
      // The viewer still fills the browser viewport when fullscreen is unavailable.
    }
    dialog.showModal();
  }

  async function close() {
    const dialog = dialogRef.current;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    dialog?.close();
  }

  return (
    <>
      {iconOnly ? (
        <button
          aria-label={label}
          className={className}
          onClick={open}
          type="button"
        >
          <Maximize2 aria-hidden="true" className="size-5" />
        </button>
      ) : (
        <button
          aria-label={label}
          className={`group/media relative block overflow-hidden ${className}`}
          onClick={open}
          type="button"
        >
          <Image
            alt={alt}
            className={imageClassName}
            fill
            priority={priority}
            sizes={sizes}
            src={src}
          />
          <span className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur transition group-hover/media:scale-105 group-focus-visible/media:ring-2 group-focus-visible/media:ring-white">
            <Maximize2 aria-hidden="true" className="size-5" />
          </span>
        </button>
      )}

      <dialog
        aria-label={alt || "Full-screen image"}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/90"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        ref={dialogRef}
      >
        <div className="relative h-dvh w-screen">
          <button
            aria-label="Close full-screen image"
            className="absolute inset-0"
            onClick={close}
            type="button"
          />
          <Image
            alt={alt}
            className="pointer-events-none object-contain"
            fill
            sizes="100vw"
            src={src}
          />
          <button
            aria-label="Close full-screen image"
            autoFocus
            className="absolute right-4 top-4 z-10 grid size-12 place-items-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={close}
            type="button"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
          {caption ? (
            <p className="pointer-events-none absolute bottom-4 left-1/2 max-w-[min(90vw,48rem)] -translate-x-1/2 rounded-full bg-black/70 px-5 py-2 text-center text-sm backdrop-blur">
              {caption}
            </p>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
