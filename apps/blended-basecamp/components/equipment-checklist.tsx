"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Filter,
  PackageCheck,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
type Category = "work" | "camp" | "safety" | "food" | "tools" | "vehicle";
type Item = {
  id: number;
  name: string;
  category: Category;
  quantity: string;
  ready: boolean;
  low: boolean;
};
const labels: Record<Category, string> = {
  work: "Work gear",
  camp: "Camp systems",
  safety: "Safety",
  food: "Food & water",
  tools: "Tools & repair",
  vehicle: "Vehicle",
};
const starter: Item[] = [
  {
    id: 1,
    name: "Laptop chargers",
    category: "work",
    quantity: "2",
    ready: false,
    low: false,
  },
  {
    id: 2,
    name: "Starlink cables and mount",
    category: "work",
    quantity: "1 set",
    ready: false,
    low: false,
  },
  {
    id: 3,
    name: "First-aid kit",
    category: "safety",
    quantity: "1",
    ready: true,
    low: false,
  },
  {
    id: 4,
    name: "Drinking water",
    category: "food",
    quantity: "7 gallons",
    ready: false,
    low: true,
  },
  {
    id: 5,
    name: "Tire repair kit",
    category: "vehicle",
    quantity: "1",
    ready: true,
    low: false,
  },
];
export function EquipmentChecklist() {
  const [items, setItems] = useState<Item[]>(starter),
    [name, setName] = useState(""),
    [quantity, setQuantity] = useState("1"),
    [category, setCategory] = useState<Category>("camp"),
    [filter, setFilter] = useState<Category | "all" | "low">("all"),
    [search, setSearch] = useState(""),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("blended-basecamp-equipment");
      if (raw) setItems(JSON.parse(raw));
    } catch {
      localStorage.removeItem("blended-basecamp-equipment");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem("blended-basecamp-equipment", JSON.stringify(items));
  }, [items, loaded]);
  const shown = useMemo(
      () =>
        items.filter(
          (i) =>
            (filter === "all" ||
              (filter === "low" && i.low) ||
              i.category === filter) &&
            i.name.toLowerCase().includes(search.toLowerCase()),
        ),
      [items, filter, search],
    ),
    ready = items.filter((i) => i.ready).length,
    low = items.filter((i) => i.low).length;
  const add = () => {
    if (!name.trim()) return;
    setItems((v) => [
      ...v,
      {
        id: Date.now(),
        name: name.trim(),
        quantity: quantity || "1",
        category,
        ready: false,
        low: false,
      },
    ]);
    setName("");
  };
  return (
    <section id="equipment-checklist" className="mb-10">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Equipment & supplies</p>
          <h2 className="basecamp-serif text-3xl font-bold sm:text-4xl">
            Pack what keeps the whole operation moving.
          </h2>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-[#e2eee7] px-3 py-2 text-xs font-bold text-[#315b4c]">
            {ready}/{items.length} ready
          </span>
          {low > 0 && (
            <span className="rounded-full bg-[#f5e4dc] px-3 py-2 text-xs font-bold text-[#884936]">
              {low} low stock
            </span>
          )}
        </div>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[.65fr_1.35fr]">
        <aside className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Add an item</p>
              <h3 className="basecamp-serif text-2xl font-bold">
                Build your checklist.
              </h3>
            </div>
            <PackageCheck className="text-[#527568]" />
          </div>
          <label className="mt-5 block text-[10px] font-extrabold uppercase tracking-wider">
            Item
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Equipment or supply"
              className="mt-2 w-full rounded-xl border border-black/10 px-3 py-3 text-sm"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-[10px] font-extrabold uppercase tracking-wider">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-2 py-3 text-sm"
              >
                {Object.entries(labels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-extrabold uppercase tracking-wider">
              Quantity
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-2 w-full rounded-xl border border-black/10 px-3 py-3 text-sm"
              />
            </label>
          </div>
          <button
            onClick={add}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#244a40] px-4 py-3 text-sm font-bold text-white"
          >
            <Plus size={18} />
            Add to checklist
          </button>
          <div className="mt-6">
            <p className="text-[10px] font-extrabold uppercase tracking-wider">
              Readiness
            </p>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e8e1d5]">
              <i
                className="block h-full bg-[#527568]"
                style={{
                  width: `${items.length ? (ready / items.length) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-[#68746f]">
              {items.length ? Math.round((ready / items.length) * 100) : 0}%
              packed and ready
            </p>
          </div>
        </aside>
        <div className="panel overflow-hidden">
          <div className="border-b border-black/10 p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <Search
                  className="absolute left-3 top-3 text-[#7a847f]"
                  size={17}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search equipment and supplies"
                  className="w-full rounded-xl border border-black/10 py-3 pl-10 pr-3 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3">
                <Filter size={16} />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="bg-transparent py-3 text-xs font-bold outline-none"
                >
                  <option value="all">All categories</option>
                  <option value="low">Low stock</option>
                  {Object.entries(labels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#68746f]">
              No checklist items match this view.
            </p>
          ) : (
            shown.map((i) => (
              <article
                key={i.id}
                className="flex items-center gap-3 border-b border-black/10 p-4 last:border-0"
              >
                <button
                  aria-label="Toggle ready"
                  onClick={() =>
                    setItems((v) =>
                      v.map((x) =>
                        x.id === i.id ? { ...x, ready: !x.ready } : x,
                      ),
                    )
                  }
                  className={`grid size-7 shrink-0 place-items-center rounded-full border ${i.ready ? "border-[#527568] bg-[#527568] text-white" : "border-[#aaa397]"}`}
                >
                  {i.ready && <Check size={15} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b
                      className={`text-sm ${i.ready ? "text-[#7c8581] line-through" : ""}`}
                    >
                      {i.name}
                    </b>
                    {i.low && (
                      <span className="flex items-center gap-1 rounded-full bg-[#f5e4dc] px-2 py-0.5 text-[9px] font-bold text-[#884936]">
                        <AlertTriangle size={10} />
                        LOW
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-[#78827e]">
                    {labels[i.category]} · Qty {i.quantity}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setItems((v) =>
                      v.map((x) => (x.id === i.id ? { ...x, low: !x.low } : x)),
                    )
                  }
                  className={`rounded-lg px-2 py-1 text-[9px] font-bold ${i.low ? "bg-[#f5e4dc] text-[#884936]" : "bg-[#eee9df]"}`}
                >
                  Low stock
                </button>
                <button
                  aria-label="Delete item"
                  onClick={() =>
                    setItems((v) => v.filter((x) => x.id !== i.id))
                  }
                  className="text-[#9a5845]"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
