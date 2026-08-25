import { NewsHeader } from "@/components/news-header";

export default function DevotionalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6f3eb] text-[#1e2a24]">
      <NewsHeader />
      {children}
      <footer className="border-t border-[#1e2a24]/10 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-[#657169] sm:flex-row sm:justify-between">
          <p className="font-serif text-lg font-semibold text-[#1e2a24]">Daily Devotionals</p>
          <p>Faith and encouragement from the mission.</p>
        </div>
      </footer>
    </div>
  );
}
