"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.intersectionRatio !== 1),
      { threshold: [1] },
    );

    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  function scrollToTop() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <button
      aria-label="Back to top"
      className={`fixed bottom-5 left-1/2 z-[70] flex size-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-[#1e2a24] text-[#f4b860] shadow-xl shadow-black/20 transition duration-200 hover:-translate-y-1 hover:bg-[#2b3d34] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8703d] sm:bottom-7 ${isVisible ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
      onClick={scrollToTop}
      title="Back to top"
      type="button"
    >
      <ArrowUp aria-hidden="true" className="size-5" />
    </button>
  );
}
