"use client";
import { cloneElement, useEffect, useMemo, useState } from "react";
import {
  Car,
  Download,
  Plus,
  ReceiptText,
  Trash2,
  WalletCards,
} from "lucide-react";
type Expense = {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  deductible: boolean;
};
type Trip = {
  id: number;
  date: string;
  purpose: string;
  miles: number;
  business: boolean;
};
const today = () => new Date().toISOString().slice(0, 10),
  categories = [
    "Fuel",
    "Lodging",
    "Campground",
    "Meals",
    "Repairs",
    "Equipment",
    "Connectivity",
    "Other",
  ];
export function ExpenseMileageTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]),
    [trips, setTrips] = useState<Trip[]>([]),
    [rate, setRate] = useState(0.7),
    [tab, setTab] = useState<"expense" | "mileage">("expense"),
    [loaded, setLoaded] = useState(false);
  const [ed, setEd] = useState(today()),
    [ec, setEc] = useState("Fuel"),
    [desc, setDesc] = useState(""),
    [amount, setAmount] = useState(0),
    [deductible, setDeductible] = useState(true),
    [td, setTd] = useState(today()),
    [purpose, setPurpose] = useState(""),
    [miles, setMiles] = useState(0),
    [business, setBusiness] = useState(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("blended-basecamp-finance");
      if (raw) {
        const d = JSON.parse(raw);
        setExpenses(d.expenses ?? []);
        setTrips(d.trips ?? []);
        setRate(d.rate ?? 0.7);
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem(
        "blended-basecamp-finance",
        JSON.stringify({ expenses, trips, rate }),
      );
  }, [expenses, trips, rate, loaded]);
  const totals = useMemo(
    () => ({
      expenses: expenses.reduce((t, e) => t + e.amount, 0),
      deductible: expenses
        .filter((e) => e.deductible)
        .reduce((t, e) => t + e.amount, 0),
      miles: trips.reduce((t, x) => t + x.miles, 0),
      businessMiles: trips
        .filter((x) => x.business)
        .reduce((t, x) => t + x.miles, 0),
    }),
    [expenses, trips],
  );
  const addExpense = () => {
    if (!desc.trim() || amount <= 0) return;
    setExpenses((v) => [
      {
        id: Date.now(),
        date: ed,
        category: ec,
        description: desc.trim(),
        amount,
        deductible,
      },
      ...v,
    ]);
    setDesc("");
    setAmount(0);
  };
  const addTrip = () => {
    if (!purpose.trim() || miles <= 0) return;
    setTrips((v) => [
      { id: Date.now(), date: td, purpose: purpose.trim(), miles, business },
      ...v,
    ]);
    setPurpose("");
    setMiles(0);
  };
  const exportCsv = () => {
    const rows = [
      [
        "Type",
        "Date",
        "Category/Purpose",
        "Amount/Miles",
        "Business/Deductible",
      ],
      ...expenses.map((e) => [
        "Expense",
        e.date,
        e.category + " - " + e.description,
        e.amount.toFixed(2),
        e.deductible ? "Yes" : "No",
      ]),
      ...trips.map((t) => [
        "Mileage",
        t.date,
        t.purpose,
        t.miles.toFixed(1),
        t.business ? "Yes" : "No",
      ]),
    ];
    const blob = new Blob(
        [
          rows
            .map((r) =>
              r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(","),
            )
            .join("\n"),
        ],
        { type: "text/csv" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "blended-basecamp-expenses-mileage.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section id="expense-mileage" className="mb-10">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Expense & mileage tracker</p>
          <h2 className="basecamp-serif text-3xl font-bold sm:text-4xl">
            Know what the road and business really cost.
          </h2>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-xs font-bold"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={WalletCards}
          value={money(totals.expenses)}
          label="Total expenses"
        />
        <Metric
          icon={ReceiptText}
          value={money(totals.deductible)}
          label="Marked deductible"
        />
        <Metric
          icon={Car}
          value={totals.miles.toFixed(1)}
          label="Total miles"
        />
        <Metric
          icon={Car}
          value={money(totals.businessMiles * rate)}
          label="Mileage value"
        />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[.7fr_1.3fr]">
        <aside className="panel p-5 sm:p-6">
          <div className="grid grid-cols-2 rounded-xl bg-[#e8e1d5] p-1">
            <button
              onClick={() => setTab("expense")}
              className={`rounded-lg py-2 text-xs font-bold ${tab === "expense" ? "bg-white shadow" : ""}`}
            >
              Expense
            </button>
            <button
              onClick={() => setTab("mileage")}
              className={`rounded-lg py-2 text-xs font-bold ${tab === "mileage" ? "bg-white shadow" : ""}`}
            >
              Mileage
            </button>
          </div>
          {tab === "expense" ? (
            <div className="mt-4">
              <Field label="Date">
                <input
                  type="date"
                  value={ed}
                  onChange={(e) => setEd(e.target.value)}
                />
              </Field>
              <Field label="Category">
                <select value={ec} onChange={(e) => setEc(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Description">
                <input
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What was purchased?"
                />
              </Field>
              <Field label="Amount">
                <input
                  type="number"
                  min="0"
                  step=".01"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                />
              </Field>
              <label className="mt-4 flex items-center gap-3 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={deductible}
                  onChange={(e) => setDeductible(e.target.checked)}
                  className="size-4 accent-[#527568]"
                />
                Mark as potentially deductible
              </label>
              <button
                onClick={addExpense}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#244a40] py-3 text-sm font-bold text-white"
              >
                <Plus size={17} />
                Add expense
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <Field label="Date">
                <input
                  type="date"
                  value={td}
                  onChange={(e) => setTd(e.target.value)}
                />
              </Field>
              <Field label="Trip purpose">
                <input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Client visit, supply run..."
                />
              </Field>
              <Field label="Miles driven">
                <input
                  type="number"
                  min="0"
                  step=".1"
                  value={miles || ""}
                  onChange={(e) => setMiles(Number(e.target.value))}
                />
              </Field>
              <Field label="Rate per business mile">
                <input
                  type="number"
                  min="0"
                  step=".01"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </Field>
              <label className="mt-4 flex items-center gap-3 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={business}
                  onChange={(e) => setBusiness(e.target.checked)}
                  className="size-4 accent-[#527568]"
                />
                Business mileage
              </label>
              <button
                onClick={addTrip}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#244a40] py-3 text-sm font-bold text-white"
              >
                <Plus size={17} />
                Add mileage
              </button>
            </div>
          )}
          <p className="mt-5 text-[10px] leading-4 text-[#777f7b]">
            Tax treatment varies. Keep receipts and verify deductions and
            mileage rates with current IRS guidance or a tax professional.
          </p>
        </aside>
        <div className="panel overflow-hidden">
          <div className="border-b border-black/10 p-5">
            <p className="eyebrow">Recent activity</p>
            <h3 className="basecamp-serif text-2xl font-bold">
              Your road ledger
            </h3>
          </div>
          {expenses.length + trips.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#68746f]">
              No expenses or mileage recorded yet.
            </p>
          ) : (
            [
              ...expenses.map((e) => ({
                ...e,
                kind: "expense" as const,
                sort: e.id,
              })),
              ...trips.map((t) => ({
                ...t,
                kind: "trip" as const,
                sort: t.id,
              })),
            ]
              .sort((a, b) => b.sort - a.sort)
              .map((x) =>
                x.kind === "expense" ? (
                  <article
                    key={"e" + x.id}
                    className="flex items-center gap-3 border-b border-black/10 p-4"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-[#eee9df]">
                      <ReceiptText size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-sm">{x.description}</b>
                      <p className="text-[10px] uppercase tracking-wider">
                        {x.date} · {x.category}
                        {x.deductible ? " · deductible" : ""}
                      </p>
                    </div>
                    <b>{money(x.amount)}</b>
                    <button
                      onClick={() =>
                        setExpenses((v) => v.filter((e) => e.id !== x.id))
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ) : (
                  <article
                    key={"t" + x.id}
                    className="flex items-center gap-3 border-b border-black/10 p-4"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-[#e2eee7]">
                      <Car size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-sm">{x.purpose}</b>
                      <p className="text-[10px] uppercase tracking-wider">
                        {x.date}
                        {x.business ? " · business" : ""}
                      </p>
                    </div>
                    <b>{x.miles.toFixed(1)} mi</b>
                    <button
                      onClick={() =>
                        setTrips((v) => v.filter((t) => t.id !== x.id))
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ),
              )
          )}
        </div>
      </div>
    </section>
  );
}
const control =
  "mt-2 w-full rounded-xl border border-black/10 bg-[#fffdf8] px-3 py-3 text-sm outline-[#527568]";
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const child = children as React.ReactElement<{ className?: string }>;
  return (
    <label className="mt-3 block text-[10px] font-extrabold uppercase tracking-wider">
      {label}
      {cloneElement(child, { className: control })}
    </label>
  );
}
function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Car;
  value: string;
  label: string;
}) {
  return (
    <div className="panel p-4 text-center">
      <Icon className="mx-auto text-[#527568]" size={18} />
      <b className="mt-2 block text-xl">{value}</b>
      <small className="text-[9px] uppercase tracking-wider">{label}</small>
    </div>
  );
}
function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
