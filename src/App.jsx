import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/* =========================
   Constants
========================= */
const LS_KEY = "content-hub";
const AUTH_KEY = "content-hub-auth";
const THEME_KEY = "content-hub-theme";
const APP_PASSWORD = "12@34"; // غيّرها
const X_LIMIT_DEFAULT = 280;

const TODAY_ID = "cat-today";
const TODAY_NAME = "حزمة اليوم";
const TODAY_TAKE = 2; // أعلى منشورين لكل مجموعة

/* =========================
   Utils
========================= */
const uid = (p = "id") =>
  `${p}-${crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

const safeParse = (s, fb) => {
  try {
    return JSON.parse(s);
  } catch {
    return fb;
  }
};

const fmt = (ts) =>
  ts
    ? new Date(ts)
        .toLocaleString("ar", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
        .replace("،", " •")
    : "—";

const canon = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const jaccard = (a, b) => {
  const A = new Set(canon(a).split(" ").filter(Boolean));
  const B = new Set(canon(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let i = 0;
  for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i);
};

const sortItems = (items, key) => {
  const a = [...items];
  const by =
    {
      newest: (x, y) => (y.createdAt ?? 0) - (x.createdAt ?? 0),
      oldest: (x, y) => (x.createdAt ?? 0) - (y.createdAt ?? 0),
      mostUsed: (x, y) =>
        (y.usedCount ?? 0) - (x.usedCount ?? 0) || (y.lastUsedAt ?? 0) - (x.lastUsedAt ?? 0),
      leastUsed: (x, y) =>
        (x.usedCount ?? 0) - (y.usedCount ?? 0) || (x.lastUsedAt ?? 0) - (y.lastUsedAt ?? 0),
      lru: (x, y) => (x.lastUsedAt ?? 0) - (y.lastUsedAt ?? 0),
    }[key] || ((x, y) => (x.lastUsedAt ?? 0) - (y.lastUsedAt ?? 0));
  return a.sort(by);
};

const sortPinnedFirst = (arr, key) => {
  const base = sortItems(arr, key);
  const pinned = [];
  const rest = [];
  for (const x of base) (x.pinned ? pinned : rest).push(x);
  return [...pinned, ...rest];
};

const copyToClipboard = async (text) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/* =========================
   Icons
========================= */
const I = {
  Spark: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8L12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Enter: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M10 17l-4-5 4-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12h10a3 3 0 0 1 3 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 8V5a2 2 0 0 0-2-2H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  Copy: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M8 8h11v11H8V8Z" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Image: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 16l-6-6-6 7-2-2-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Text: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 6h16M4 12h10M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Both: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 6h9M4 12h9M4 18h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 15l2-2 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Download: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Upload: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 21V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 14l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 3h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Pin: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M14 3l7 7-3 1-2 6-2-2-4 4v-5l4-4-2-2 6-2 1-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  Sun: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Moon: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* =========================
   Tweet preview
========================= */
const parseSegments = (t) => {
  const cleaned = (t || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
  const re = /(https?:\/\/[^\s]+)|(#(?:[\p{L}\p{M}\p{N}_]+))|(@(?:[\p{L}\p{M}\p{N}_]+))/gu;
  const out = [];
  let last = 0;
  for (const m of cleaned.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ k: "t", v: cleaned.slice(last, idx) });
    out.push(m[1] ? { k: "l", v: m[1] } : m[2] ? { k: "h", v: m[2] } : { k: "m", v: m[3] });
    last = idx + m[0].length;
  }
  if (last < cleaned.length) out.push({ k: "t", v: cleaned.slice(last) });
  return out;
};

const TweetPreview = ({ text, timeLabel }) => {
  const segs = useMemo(() => parseSegments(text), [text]);
  return (
    <div className="tweet">
      <div className="tweetAvatar" aria-hidden="true" />
      <div className="tweetBody">
        <div className="tweetHeader">
          <div className="tweetName">مخزني الإبداعي</div>
          <div className="tweetHandle">@contenthub</div>
          <div className="tweetDot">•</div>
          <div className="tweetTime">{timeLabel}</div>
        </div>
        <div className="tweetText">
          {segs.map((s, i) =>
            s.k === "t" ? (
              <span key={i}>{s.v}</span>
            ) : s.k === "l" ? (
              <span key={i} className="tweetLink">
                {s.v}
              </span>
            ) : s.k === "h" ? (
              <span key={i} className="tweetTag">
                {s.v}
              </span>
            ) : (
              <span key={i} className="tweetMention">
                {s.v}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================
   Data model + migrate
========================= */
const seedData = {
  version: 7,
  xLimit: X_LIMIT_DEFAULT,
  categories: [
    { id: TODAY_ID, name: TODAY_NAME, system: true },
    { id: "cat-morning", name: "تغريدات صباحية/مسائية" },
    { id: "cat-national", name: "محتوى وطني" },
    { id: "cat-quotes", name: "اقتباسات وحكم" },
    { id: "cat-misc", name: "محتوى منوع" },
  ],
  textsByCategory: { "cat-morning": [] },
  imagesByCategory: { "cat-morning": [] },
  trash: { texts: [], images: [] },
};

const normTexts = (m) =>
  Object.fromEntries(
    Object.entries(m || {}).map(([k, arr]) => [
      k,
      (arr || []).map((t) => ({
        id: t.id ?? uid("t"),
        text: t.text ?? "",
        createdAt: t.createdAt ?? Date.now(),
        lastUsedAt: t.lastUsedAt ?? null,
        usedCount: t.usedCount ?? 0,
        pinned: t.pinned ?? false,
      })),
    ])
  );

const normImgs = (m) =>
  Object.fromEntries(
    Object.entries(m || {}).map(([k, arr]) => [
      k,
      (arr || []).map((i) => ({
        id: i.id ?? uid("i"),
        url: i.url ?? "",
        createdAt: i.createdAt ?? Date.now(),
        lastUsedAt: i.lastUsedAt ?? null,
        usedCount: i.usedCount ?? 0,
        pinned: i.pinned ?? false,
      })),
    ])
  );

const migrate = (raw) => {
  if (!raw || !raw.textsByCategory || !raw.imagesByCategory) return seedData;

  const cats = raw.categories ?? seedData.categories;
  const hasToday = cats.some((c) => c.id === TODAY_ID);
  const categories = hasToday ? cats : [{ id: TODAY_ID, name: TODAY_NAME, system: true }, ...cats];

  return {
    version: 7,
    xLimit: raw.xLimit ?? X_LIMIT_DEFAULT,
    categories,
    textsByCategory: normTexts(raw.textsByCategory),
    imagesByCategory: normImgs(raw.imagesByCategory),
    trash: raw.trash ?? { texts: [], images: [] },
  };
};

/* =========================
   Virtual Lists
========================= */
function useElementSize(ref) {
  const [h, setH] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.clientHeight));
    ro.observe(el);
    setH(el.clientHeight);
    return () => ro.disconnect();
  }, [ref]);
  return h;
}

const VirtualList = ({ items, estimate = 240, overscan = 6, className = "", render }) => {
  const scrollerRef = useRef(null);
  const height = useElementSize(scrollerRef);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const total = items.length;
  const start = clamp(Math.floor(scrollTop / estimate) - overscan, 0, Math.max(0, total - 1));
  const visibleCount = height ? Math.ceil(height / estimate) + overscan * 2 : 20;
  const end = clamp(start + visibleCount, 0, total);

  const padTop = start * estimate;
  const padBottom = Math.max(0, (total - end) * estimate);
  const slice = items.slice(start, end);

  return (
    <div ref={scrollerRef} className={`virtScroller ${className}`}>
      <div style={{ height: padTop }} />
      {slice.map((it, idx) => render(it, start + idx))}
      <div style={{ height: padBottom }} />
    </div>
  );
};

const VirtualGrid2 = ({ items, estimateRow = 260, overscan = 4, renderCard }) => {
  const rows = useMemo(() => {
    const out = [];
    for (let i = 0; i < items.length; i += 2) out.push([items[i], items[i + 1] ?? null]);
    return out;
  }, [items]);

  return (
    <VirtualList
      items={rows}
      estimate={estimateRow}
      overscan={overscan}
      className="virtGrid2"
      render={(row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="gridRow2">
          <div className="gridCol">{row[0] ? renderCard(row[0]) : null}</div>
          <div className="gridCol">{row[1] ? renderCard(row[1]) : null}</div>
        </div>
      )}
    />
  );
};

/* =========================
   UI Bits
========================= */
const IconToggle = ({ active, title, onClick, children }) => (
  <button className={`iconBtn ${active ? "active" : ""}`} onClick={onClick} title={title} type="button">
    {children}
  </button>
);

const BulkBar = ({ count, categories, value, onChange, onCopy, onMove, onDelete, onClear }) => (
  <div className="bulkBar">
    <div className="bulkInfo">محدد: {count}</div>
    <select className="select" value={value} onChange={onChange}>
      <option value="">اختر مجموعة…</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
    <button className="btn iconOnly" onClick={onCopy} title="نسخ" type="button">
      <I.Copy />
    </button>
    <button className="btn iconOnly" onClick={onMove} title="نقل" type="button">
      <I.Enter />
    </button>
    <button className="btn danger iconOnly" onClick={onDelete} title="حذف" type="button">
      <I.Trash />
    </button>
    <button className="btn iconOnly" onClick={onClear} title="إلغاء" type="button">
      ✕
    </button>
  </div>
);

const ToastUndo = ({ show, label, onUndo, onClose }) => {
  if (!show) return null;
  return (
    <div className="toastUndo" role="status">
      <div className="toastText">{label}</div>
      <div className="toastBtns">
        <button className="btn" onClick={onUndo} type="button">
          تراجع
        </button>
        <button className="btn iconOnly" onClick={onClose} title="إغلاق" type="button">
          ✕
        </button>
      </div>
    </div>
  );
};

/* =========================
   App
========================= */
export default function App() {
  /* ---------- theme ---------- */
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  /* ---------- auth ---------- */
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === "1");
  const [pass, setPass] = useState("");
  const [passErr, setPassErr] = useState("");

  /* ---------- data ---------- */
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? migrate(safeParse(saved, null)) : seedData;
  });
  useEffect(() => localStorage.setItem(LS_KEY, JSON.stringify(data)), [data]);

  const xLimit = data.xLimit ?? X_LIMIT_DEFAULT;

  /* ---------- nav ---------- */
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  /* ---------- category mgmt ---------- */
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");

  /* ---------- add inputs ---------- */
  const [newText, setNewText] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  /* ---------- search (texts only) ---------- */
  const [searchText, setSearchText] = useState("");

  /* ---------- sorts ---------- */
  const [sortTexts, setSortTexts] = useState("lru");
  const [sortImages, setSortImages] = useState("lru");

  /* ---------- selection ---------- */
  const [selectedTextIds, setSelectedTextIds] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [targetCategoryId, setTargetCategoryId] = useState("");

  /* ---------- ux ---------- */
  const [lastCopied, setLastCopied] = useState(null);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [activeTextIndex, setActiveTextIndex] = useState(0);
  const [showMode, setShowMode] = useState("both");

  /* ---------- bulk ---------- */
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  /* ---------- inline edit ---------- */
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingTextValue, setEditingTextValue] = useState("");
  const [editingImageId, setEditingImageId] = useState(null);
  const [editingImageValue, setEditingImageValue] = useState("");

  /* ---------- Trash UI ---------- */
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashTab, setTrashTab] = useState("texts");
  const undoTimerRef = useRef(null);
  const [undoState, setUndoState] = useState(null);

  const importRef = useRef(null);

  /* =========================
     Derived
  ========================= */
  const categories = useMemo(() => data.categories ?? [], [data.categories]);

  const isToday = activeCategoryId === TODAY_ID;
  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) || null,
    [categories, activeCategoryId]
  );

  const appClass = `app ${activeCategoryId ? "inGroup" : ""}`;

  const rawTexts = useMemo(() => {
    if (!activeCategoryId || isToday) return [];
    return data.textsByCategory?.[activeCategoryId] || [];
  }, [data.textsByCategory, activeCategoryId, isToday]);

  const rawImages = useMemo(() => {
    if (!activeCategoryId || isToday) return [];
    return data.imagesByCategory?.[activeCategoryId] || [];
  }, [data.imagesByCategory, activeCategoryId, isToday]);

  const duplicateIds = useMemo(() => {
    const m = new Map();
    for (const t of rawTexts) {
      const c = canon(t.text);
      if (!m.has(c)) m.set(c, []);
      m.get(c).push(t.id);
    }
    const s = new Set();
    for (const ids of m.values()) if (ids.length > 1) ids.forEach((id) => s.add(id));
    return s;
  }, [rawTexts]);

  const texts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const filtered = rawTexts.filter((t) => (t.text || "").toLowerCase().includes(q));
    return sortPinnedFirst(filtered, sortTexts);
  }, [rawTexts, searchText, sortTexts]);

  const images = useMemo(() => sortPinnedFirst(rawImages, sortImages), [rawImages, sortImages]);

  const todaySections = useMemo(() => {
    const realCats = categories.filter((c) => c.id !== TODAY_ID);
    const out = [];
    for (const c of realCats) {
      const tArr = data.textsByCategory?.[c.id] || [];
      const iArr = data.imagesByCategory?.[c.id] || [];
      const takeT = tArr.slice(0, TODAY_TAKE);
      const takeI = iArr.slice(0, TODAY_TAKE);
      const posts = [];
      const n = Math.max(takeT.length, takeI.length, TODAY_TAKE);
      for (let k = 0; k < n; k++) {
        const tt = takeT[k] ?? null;
        const ii = takeI[k] ?? null;
        if (!tt && !ii) continue;
        posts.push({
          key: `${c.id}-${tt?.id ?? "t0"}-${ii?.id ?? "i0"}-${k}`,
          catId: c.id,
          catName: c.name,
          text: tt,
          image: ii,
        });
      }
      if (posts.length) out.push({ catId: c.id, catName: c.name, posts });
    }
    return out;
  }, [categories, data.textsByCategory, data.imagesByCategory]);

  /* =========================
     Auth
  ========================= */
  const login = () => {
    if (pass === APP_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
      setPass("");
      setPassErr("");
    } else setPassErr("كلمة المرور غير صحيحة");
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setActiveCategoryId(null);
  };

  /* =========================
     Backup
  ========================= */
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ ...data, version: 7 }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `content-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importBackup = async (file) => {
    if (!file) return;
    const raw = safeParse(await file.text(), null);
    const migrated = migrate(raw);
    if (!confirm("استبدال البيانات الحالية بالنسخة المستوردة؟")) return;
    setData(migrated);
    setActiveCategoryId(null);
    setSearchText("");
    setSelectedTextIds([]);
    setSelectedImageIds([]);
    setLastCopied(null);
    setEditingTextId(null);
    setEditingImageId(null);
    setTrashOpen(false);
  };

  const openImport = () => importRef.current?.click();

  /* =========================
     Categories
  ========================= */
  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    const c = { id: uid("cat"), name };
    setData((p) => ({
      ...p,
      categories: [...(p.categories || []), c],
      textsByCategory: { ...(p.textsByCategory || {}), [c.id]: [] },
      imagesByCategory: { ...(p.imagesByCategory || {}), [c.id]: [] },
    }));
    setNewCatName("");
  };

  const saveEditCategory = () => {
    const name = editingCatName.trim();
    if (!editingCatId || !name) return;
    if (editingCatId === TODAY_ID) return;
    setData((p) => ({
      ...p,
      categories: (p.categories || []).map((c) => (c.id === editingCatId ? { ...c, name } : c)),
    }));
    setEditingCatId(null);
    setEditingCatName("");
  };

  const deleteCategory = (id) => {
    if (id === TODAY_ID) return;
    const cat = (data.categories || []).find((c) => c.id === id);
    if (!confirm(`حذف "${cat?.name ?? ""}"؟`)) return;

    setData((p) => {
      const categories = (p.categories || []).filter((c) => c.id !== id);
      const textsByCategory = { ...(p.textsByCategory || {}) };
      const imagesByCategory = { ...(p.imagesByCategory || {}) };

      const tArr = textsByCategory[id] || [];
      const iArr = imagesByCategory[id] || [];
      const trash = {
        texts: [...(p.trash?.texts || []), ...tArr.map((t) => ({ ...t, deletedAt: Date.now(), fromCategoryId: id }))],
        images: [...(p.trash?.images || []), ...iArr.map((i) => ({ ...i, deletedAt: Date.now(), fromCategoryId: id }))],
      };

      delete textsByCategory[id];
      delete imagesByCategory[id];

      return { ...p, categories, textsByCategory, imagesByCategory, trash };
    });

    if (activeCategoryId === id) setActiveCategoryId(null);
  };

  /* =========================
     Helpers
  ========================= */
  const softDelete = (kind, id, fn) => {
    setRemovingIds((s) => new Set(s).add(`${kind}:${id}`));
    setTimeout(() => {
      fn();
      setRemovingIds((s) => {
        const n = new Set(s);
        n.delete(`${kind}:${id}`);
        return n;
      });
    }, 160);
  };

  const showUndo = ({ kind, payload, label }) => {
    setUndoState({ kind, payload, label });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoState(null), 5500);
  };

  const closeUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoState(null);
  };

  const undoLastDelete = () => {
    const u = undoState;
    if (!u) return;

    setData((p) => {
      const next = { ...p };
      if (u.kind === "text") {
        const { item, fromCategoryId } = u.payload;
        next.trash = {
          ...(next.trash || { texts: [], images: [] }),
          texts: (next.trash?.texts || []).filter((t) => t.id !== item.id),
          images: next.trash?.images || [],
        };
        const cur = next.textsByCategory?.[fromCategoryId] || [];
        next.textsByCategory = { ...(next.textsByCategory || {}), [fromCategoryId]: [item, ...cur] };
        return next;
      }
      if (u.kind === "image") {
        const { item, fromCategoryId } = u.payload;
        next.trash = {
          ...(next.trash || { texts: [], images: [] }),
          texts: next.trash?.texts || [],
          images: (next.trash?.images || []).filter((i) => i.id !== item.id),
        };
        const cur = next.imagesByCategory?.[fromCategoryId] || [];
        next.imagesByCategory = { ...(next.imagesByCategory || {}), [fromCategoryId]: [item, ...cur] };
        return next;
      }
      return p;
    });

    closeUndo();
  };

  /* =========================
     Texts CRUD
  ========================= */
  const addTextOne = (txt) => {
    const text = (txt || "").trim();
    if (!activeCategoryId || !text || isToday) return false;

    const curArr = data.textsByCategory?.[activeCategoryId] || [];
    const cNew = canon(text);
    const exact = curArr.some((t) => canon(t.text) === cNew);
    const near = curArr.slice(0, 40).some((t) => jaccard(t.text, text) >= 0.9);

    if ((exact || near) && !confirm("هناك نص مشابه/مكرر. هل تريد الإضافة على أي حال؟")) return false;

    const item = { id: uid("t"), text, createdAt: Date.now(), lastUsedAt: null, usedCount: 0, pinned: false };
    setData((p) => {
      const cur = p.textsByCategory?.[activeCategoryId] || [];
      return { ...p, textsByCategory: { ...(p.textsByCategory || {}), [activeCategoryId]: [item, ...cur] } };
    });
    return true;
  };

  const addText = () => {
    if (addTextOne(newText)) setNewText("");
  };

  const bumpTextUsage = (catId, id, toTop) => {
    const now = Date.now();
    setData((p) => {
      const cur = p.textsByCategory?.[catId] || [];
      const upd = cur.map((t) => (t.id === id ? { ...t, lastUsedAt: now, usedCount: (t.usedCount || 0) + 1 } : t));
      const picked = upd.find((t) => t.id === id);
      const rest = upd.filter((t) => t.id !== id);
      return {
        ...p,
        textsByCategory: {
          ...(p.textsByCategory || {}),
          [catId]: picked ? (toTop ? [picked, ...rest] : [...rest, picked]) : upd,
        },
      };
    });
  };

  const togglePinText = (catId, id) =>
    setData((p) => {
      const cur = p.textsByCategory?.[catId] || [];
      return {
        ...p,
        textsByCategory: {
          ...(p.textsByCategory || {}),
          [catId]: cur.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)),
        },
      };
    });

  const startEditText = (t) => {
    setEditingTextId(t.id);
    setEditingTextValue(t.text);
  };
  const cancelEditText = () => {
    setEditingTextId(null);
    setEditingTextValue("");
  };
  const saveEditText = (catId, id) => {
    const v = editingTextValue.trim();
    if (!v) return;
    setData((p) => {
      const cur = p.textsByCategory?.[catId] || [];
      return {
        ...p,
        textsByCategory: {
          ...(p.textsByCategory || {}),
          [catId]: cur.map((t) => (t.id === id ? { ...t, text: v } : t)),
        },
      };
    });
    cancelEditText();
  };

  const deleteText = (catId, t) => {
    if (!confirm("حذف النص؟")) return;
    softDelete("text", t.id, () => {
      setData((p) => {
        const cur = p.textsByCategory?.[catId] || [];
        const nextCur = cur.filter((x) => x.id !== t.id);
        const trash = {
          texts: [...(p.trash?.texts || []), { ...t, deletedAt: Date.now(), fromCategoryId: catId }],
          images: p.trash?.images || [],
        };
        return { ...p, textsByCategory: { ...(p.textsByCategory || {}), [catId]: nextCur }, trash };
      });
      setSelectedTextIds((s) => s.filter((x) => x !== t.id));
      if (editingTextId === t.id) cancelEditText();
      showUndo({ kind: "text", payload: { item: t, fromCategoryId: catId }, label: "تم حذف نص" });
    });
  };

  const copyText = async (catId, item) => {
    await copyToClipboard(item.text);
    setLastCopied({ kind: "text", id: item.id, ts: Date.now() });
    bumpTextUsage(catId, item.id, false);
  };

  const applyBulk = () => {
    const lines = bulkText.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (!lines.length) return;
    let added = 0;
    for (const l of lines) if (addTextOne(l)) added++;
    setBulkOpen(false);
    setBulkText("");
    alert(`تمت إضافة ${added} نص`);
  };

  /* =========================
     Images CRUD
  ========================= */
  const addImage = () => {
    if (!activeCategoryId || isToday) return;
    const url = newImageUrl.trim();
    if (!url) return;
    const item = { id: uid("i"), url, createdAt: Date.now(), lastUsedAt: null, usedCount: 0, pinned: false };
    setData((p) => {
      const cur = p.imagesByCategory?.[activeCategoryId] || [];
      return { ...p, imagesByCategory: { ...(p.imagesByCategory || {}), [activeCategoryId]: [item, ...cur] } };
    });
    setNewImageUrl("");
  };

  const togglePinImage = (catId, id) =>
    setData((p) => {
      const cur = p.imagesByCategory?.[catId] || [];
      return {
        ...p,
        imagesByCategory: {
          ...(p.imagesByCategory || {}),
          [catId]: cur.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i)),
        },
      };
    });

  const markImageUsed = (catId, id, toTop) => {
    const now = Date.now();
    setData((p) => {
      const cur = p.imagesByCategory?.[catId] || [];
      const upd = cur.map((i) => (i.id === id ? { ...i, lastUsedAt: now, usedCount: (i.usedCount || 0) + 1 } : i));
      const picked = upd.find((i) => i.id === id);
      const rest = upd.filter((i) => i.id !== id);
      return {
        ...p,
        imagesByCategory: {
          ...(p.imagesByCategory || {}),
          [catId]: picked ? (toTop ? [picked, ...rest] : [...rest, picked]) : upd,
        },
      };
    });
  };

  const startEditImage = (img) => {
    setEditingImageId(img.id);
    setEditingImageValue(img.url);
  };
  const cancelEditImage = () => {
    setEditingImageId(null);
    setEditingImageValue("");
  };
  const saveEditImage = (catId, id) => {
    const v = editingImageValue.trim();
    if (!v) return;
    setData((p) => {
      const cur = p.imagesByCategory?.[catId] || [];
      return {
        ...p,
        imagesByCategory: {
          ...(p.imagesByCategory || {}),
          [catId]: cur.map((i) => (i.id === id ? { ...i, url: v } : i)),
        },
      };
    });
    cancelEditImage();
  };

  const deleteImage = (catId, img) => {
    if (!confirm("حذف الصورة؟")) return;
    softDelete("image", img.id, () => {
      setData((p) => {
        const cur = p.imagesByCategory?.[catId] || [];
        const nextCur = cur.filter((x) => x.id !== img.id);
        const trash = {
          texts: p.trash?.texts || [],
          images: [...(p.trash?.images || []), { ...img, deletedAt: Date.now(), fromCategoryId: catId }],
        };
        return { ...p, imagesByCategory: { ...(p.imagesByCategory || {}), [catId]: nextCur }, trash };
      });
      setSelectedImageIds((s) => s.filter((x) => x !== img.id));
      if (editingImageId === img.id) cancelEditImage();
      showUndo({ kind: "image", payload: { item: img, fromCategoryId: catId }, label: "تم حذف صورة" });
    });
  };

  const copyImageLink = async (img) => {
    await copyToClipboard(img.url);
    setLastCopied({ kind: "image", id: img.id, ts: Date.now() });
  };

  /* =========================
     Selection / bulk move/copy
  ========================= */
  const toggleSel = (kind, id) =>
    kind === "text"
      ? setSelectedTextIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
      : setSelectedImageIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const clearSelection = () => {
    setSelectedTextIds([]);
    setSelectedImageIds([]);
    setTargetCategoryId("");
  };

  const moveCopyDeleteSelected = (kind, action) => {
    if (!activeCategoryId || isToday) return;
    const ids = kind === "text" ? selectedTextIds : selectedImageIds;
    if (!ids.length) return;

    if (action !== "delete" && !targetCategoryId) return alert("اختر المجموعة الهدف أولاً");

    if (action === "delete") {
      if (!confirm("حذف العناصر المحددة؟")) return;

      setData((p) => {
        const next = { ...p };
        if (kind === "text") {
          const src = next.textsByCategory?.[activeCategoryId] || [];
          const picked = src.filter((t) => ids.includes(t.id));
          const rest = src.filter((t) => !ids.includes(t.id));
          next.textsByCategory = { ...(next.textsByCategory || {}), [activeCategoryId]: rest };
          next.trash = {
            texts: [...(next.trash?.texts || []), ...picked.map((t) => ({ ...t, deletedAt: Date.now(), fromCategoryId: activeCategoryId }))],
            images: next.trash?.images || [],
          };
          return next;
        } else {
          const src = next.imagesByCategory?.[activeCategoryId] || [];
          const picked = src.filter((i) => ids.includes(i.id));
          const rest = src.filter((i) => !ids.includes(i.id));
          next.imagesByCategory = { ...(next.imagesByCategory || {}), [activeCategoryId]: rest };
          next.trash = {
            texts: next.trash?.texts || [],
            images: [...(next.trash?.images || []), ...picked.map((i) => ({ ...i, deletedAt: Date.now(), fromCategoryId: activeCategoryId }))],
          };
          return next;
        }
      });

      clearSelection();
      return;
    }

    setData((p) => {
      const next = { ...p };
      if (kind === "text") {
        const src = next.textsByCategory?.[activeCategoryId] || [];
        const picked = src.filter((t) => ids.includes(t.id));
        const rest = src.filter((t) => !ids.includes(t.id));
        const dst = next.textsByCategory?.[targetCategoryId] || [];
        const ins = action === "copy" ? picked.map((t) => ({ ...t, id: uid("t"), createdAt: Date.now(), pinned: false })) : picked;
        next.textsByCategory = {
          ...(next.textsByCategory || {}),
          [activeCategoryId]: action === "move" ? rest : src,
          [targetCategoryId]: [...ins, ...dst],
        };
        return next;
      } else {
        const src = next.imagesByCategory?.[activeCategoryId] || [];
        const picked = src.filter((i) => ids.includes(i.id));
        const rest = src.filter((i) => !ids.includes(i.id));
        const dst = next.imagesByCategory?.[targetCategoryId] || [];
        const ins = action === "copy" ? picked.map((i) => ({ ...i, id: uid("i"), createdAt: Date.now(), pinned: false })) : picked;
        next.imagesByCategory = {
          ...(next.imagesByCategory || {}),
          [activeCategoryId]: action === "move" ? rest : src,
          [targetCategoryId]: [...ins, ...dst],
        };
        return next;
      }
    });

    clearSelection();
  };

  /* =========================
     Keyboard shortcuts (fixed + safe)
  ========================= */
  const textsRef = useRef([]);
  const activeTextIndexRef = useRef(0);
  const selectedTextIdsRef = useRef([]);

  useEffect(() => {
    textsRef.current = texts;
  }, [texts]);
  useEffect(() => {
    activeTextIndexRef.current = activeTextIndex;
  }, [activeTextIndex]);
  useEffect(() => {
    selectedTextIdsRef.current = selectedTextIds;
  }, [selectedTextIds]);

  useEffect(() => {
    if (!activeCategoryId || isToday) return;

    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select";
      const meta = e.metaKey || e.ctrlKey;

      const sel = window.getSelection?.()?.toString?.() || "";
      if (sel.trim().length > 0) return;

      if (meta && e.key.toLowerCase() === "c" && !typing) {
        e.preventDefault();
        const curTexts = textsRef.current || [];
        const curIdx = activeTextIndexRef.current || 0;
        const curSelected = selectedTextIdsRef.current || [];
        const one = curSelected.length === 1 ? curTexts.find((t) => t.id === curSelected[0]) : curTexts[curIdx];
        if (one) copyText(activeCategoryId, one);
        return;
      }

      if (!typing && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        setActiveTextIndex((i) => {
          const curTexts = textsRef.current || [];
          const next = clamp(i + dir, 0, Math.max(0, curTexts.length - 1));
          const id = curTexts[next]?.id;
          if (id) {
            requestAnimationFrame(() => {
              document.querySelector(`[data-text="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
            });
          }
          return next;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeCategoryId, isToday]);

  /* =========================
     Trash actions (modal)
  ========================= */
  const restoreFromTrash = (kind, itemId) => {
    setData((p) => {
      const next = { ...p };
      if (kind === "texts") {
        const item = (next.trash?.texts || []).find((x) => x.id === itemId);
        if (!item) return p;
        const from = item.fromCategoryId;
        const restored = { ...item };
        delete restored.deletedAt;
        delete restored.fromCategoryId;
        next.trash = { texts: (next.trash?.texts || []).filter((x) => x.id !== itemId), images: next.trash?.images || [] };
        const cur = next.textsByCategory?.[from] || [];
        next.textsByCategory = { ...(next.textsByCategory || {}), [from]: [restored, ...cur] };
        return next;
      }
      const item = (next.trash?.images || []).find((x) => x.id === itemId);
      if (!item) return p;
      const from = item.fromCategoryId;
      const restored = { ...item };
      delete restored.deletedAt;
      delete restored.fromCategoryId;
      next.trash = { texts: next.trash?.texts || [], images: (next.trash?.images || []).filter((x) => x.id !== itemId) };
      const cur = next.imagesByCategory?.[from] || [];
      next.imagesByCategory = { ...(next.imagesByCategory || {}), [from]: [restored, ...cur] };
      return next;
    });
  };

  const deleteForever = (kind, itemId) => {
    if (!confirm("حذف نهائي؟")) return;
    setData((p) => {
      const next = { ...p };
      if (kind === "texts") {
        next.trash = { texts: (next.trash?.texts || []).filter((x) => x.id !== itemId), images: next.trash?.images || [] };
        return next;
      }
      next.trash = { texts: next.trash?.texts || [], images: (next.trash?.images || []).filter((x) => x.id !== itemId) };
      return next;
    });
  };

  const clearTrash = (kind) => {
    if (!confirm("تفريغ السلة؟")) return;
    setData((p) => {
      const next = { ...p };
      if (kind === "texts") {
        next.trash = { texts: [], images: next.trash?.images || [] };
        return next;
      }
      next.trash = { texts: next.trash?.texts || [], images: [] };
      return next;
    });
  };

  /* =========================
     Today: use post (text + image)
  ========================= */
  const useTodayPost = async (catId, t, img) => {
    if (t?.text) {
      await copyToClipboard(t.text);
      setLastCopied({ kind: "text", id: t.id, ts: Date.now() });
      bumpTextUsage(catId, t.id, false);
    }
    if (img?.id) {
      markImageUsed(catId, img.id, false);
    }
  };

  const ThemeBtn = (
    <button
      className="btn iconOnly themeBtn"
      onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      title={theme === "light" ? "الوضع الداكن" : "الوضع الفاتح"}
      type="button"
    >
      {theme === "light" ? <I.Moon /> : <I.Sun />}
    </button>
  );

  /* =========================
     Login screen
  ========================= */
  if (!authed) {
    return (
      <div className="authWrap">
        <div className="authCard">
          <div className="authBrand">
            <div className="logo">
              <I.Spark />
            </div>
            <div>
              <div className="title">مخزني الإبداعي</div>
              <div className="subtitle">أدخل كلمة المرور للدخول</div>
            </div>
          </div>

          <input
            className="input authInput"
            placeholder="كلمة المرور"
            type="password"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setPassErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && login()}
            autoFocus
          />

          {passErr && <div className="error">{passErr}</div>}

          <button className="btn primary wide" onClick={login} type="button">
            دخول <I.Enter style={{ width: 18, height: 18 }} />
          </button>

          <div className="authRow">
            <div className="hint">* هذا حاجز بسيط فقط (ليس نظام أمان قوي).</div>
            {ThemeBtn}
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     Route 1: categories
  ========================= */
  if (!activeCategoryId) {
    return (
      <div className={appClass}>
        <header className="topbar">
          <div className="brand">
            <div className="logo">
              <I.Spark />
            </div>
            <div>
              <div className="title">مخزني الإبداعي</div>
              <div className="subtitle">مجموعات المحتوى</div>
            </div>
          </div>

          <div className="actions">
            {ThemeBtn}
            <button className="btn" onClick={() => { setTrashTab("texts"); setTrashOpen(true); }} title="السلة" type="button">
              <I.Trash style={{ width: 18, height: 18 }} /> السلة
            </button>
            <button className="btn" onClick={exportBackup} title="تصدير" type="button">
              <I.Download style={{ width: 18, height: 18 }} />
            </button>
            <button className="btn" onClick={openImport} title="استيراد" type="button">
              <I.Upload style={{ width: 18, height: 18 }} />
            </button>
            <button className="btn danger" onClick={logout} title="خروج" type="button">
              خروج
            </button>
            <input ref={importRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => importBackup(e.target.files?.[0])} />
          </div>
        </header>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="row">
            <input
              className="input"
              placeholder="إضافة مجموعة…"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <button className="btn primary" onClick={addCategory} type="button">
              <I.Plus style={{ width: 18, height: 18 }} /> إضافة
            </button>
          </div>
        </div>

        <div className="grid">
          {categories.map((cat) => {
            const isSystem = !!cat.system || cat.id === TODAY_ID;
            const isEditing = editingCatId === cat.id;

            const tCount = cat.id === TODAY_ID ? "—" : (data.textsByCategory?.[cat.id] || []).length;
            const iCount = cat.id === TODAY_ID ? "—" : (data.imagesByCategory?.[cat.id] || []).length;

            return (
              <div key={cat.id} className={`card catCard ${cat.id === TODAY_ID ? "todayCard" : ""}`}>
                <div className="row space">
                  <div style={{ flex: 1 }}>
                    {!isEditing ? (
                      <>
                        <div className="cardTitle">{cat.name}</div>
                        <div className="meta">
                          {cat.id === TODAY_ID ? "تجميعة يومية من كل المجموعات" : `${tCount} نص • ${iCount} صورة`}
                        </div>
                      </>
                    ) : (
                      <div className="row">
                        <input
                          className="input"
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEditCategory()}
                        />
                        <button className="btn primary iconOnly" onClick={saveEditCategory} title="حفظ" type="button">
                          <I.Enter />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn primary iconOnly" onClick={() => setActiveCategoryId(cat.id)} title="دخول" type="button">
                      <I.Enter />
                    </button>

                    {!isEditing ? (
                      <>
                        {!isSystem && (
                          <button className="btn iconOnly" onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} title="تعديل" type="button">
                            <I.Edit />
                          </button>
                        )}
                        {!isSystem && (
                          <button className="btn danger iconOnly" onClick={() => deleteCategory(cat.id)} title="حذف" type="button">
                            <I.Trash />
                          </button>
                        )}
                      </>
                    ) : (
                      <button className="btn iconOnly" onClick={() => setEditingCatId(null)} title="إلغاء" type="button">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="footer">اختصارات داخل المجموعة: Ctrl+C للنسخ • ↑↓ للتنقل</div>

        {/* Trash Modal */}
        {trashOpen && (
          <div className="modalOverlay" onMouseDown={() => setTrashOpen(false)}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <div className="modalTitle">سلة المحذوفات</div>
                <button className="btn iconOnly" onClick={() => setTrashOpen(false)} title="إغلاق" type="button">
                  ✕
                </button>
              </div>

              <div className="trashTabs">
                <button className={`tabBtn ${trashTab === "texts" ? "active" : ""}`} onClick={() => setTrashTab("texts")} type="button">
                  نصوص
                </button>
                <button className={`tabBtn ${trashTab === "images" ? "active" : ""}`} onClick={() => setTrashTab("images")} type="button">
                  صور
                </button>
              </div>

              <div className="trashTools">
                <button className="btn danger" onClick={() => clearTrash(trashTab)} type="button">
                  تفريغ
                </button>
              </div>

              <div className="trashList">
                {trashTab === "texts" ? (
                  (data.trash?.texts || []).length === 0 ? (
                    <div className="meta">—</div>
                  ) : (
                    (data.trash?.texts || [])
                      .slice()
                      .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
                      .map((t) => (
                        <div key={t.id} className="trashItem">
                          <div className="trashMain">
                            <div className="trashTitle">
                              {(t.text || "").slice(0, 90)}
                              {(t.text || "").length > 90 ? "…" : ""}
                            </div>
                            <div className="meta">
                              حُذف: {fmt(t.deletedAt)} • من: {(categories.find((c) => c.id === t.fromCategoryId)?.name) ?? "—"}
                            </div>
                          </div>
                          <div className="trashActions">
                            <button className="btn" onClick={() => restoreFromTrash("texts", t.id)} type="button">
                              استرجاع
                            </button>
                            <button className="btn danger" onClick={() => deleteForever("texts", t.id)} type="button">
                              حذف نهائي
                            </button>
                          </div>
                        </div>
                      ))
                  )
                ) : (data.trash?.images || []).length === 0 ? (
                  <div className="meta">—</div>
                ) : (
                  (data.trash?.images || [])
                    .slice()
                    .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
                    .map((img) => (
                      <div key={img.id} className="trashItem">
                        <div className="trashMain">
                          <div className="trashTitle">{img.url}</div>
                          <div className="meta">
                            حُذفت: {fmt(img.deletedAt)} • من: {(categories.find((c) => c.id === img.fromCategoryId)?.name) ?? "—"}
                          </div>
                        </div>
                        <div className="trashActions">
                          <button className="btn" onClick={() => restoreFromTrash("images", img.id)} type="button">
                            استرجاع
                          </button>
                          <button className="btn danger" onClick={() => deleteForever("images", img.id)} type="button">
                            حذف نهائي
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        <ToastUndo show={!!undoState} label={undoState?.label} onUndo={undoLastDelete} onClose={closeUndo} />
      </div>
    );
  }

  /* =========================
     Route 2: inside category
  ========================= */
  const otherCats = categories.filter((c) => c.id !== activeCategoryId && c.id !== TODAY_ID);

  // today view
  if (isToday) {
    return (
      <div className={appClass}>
        <header className="topbar">
          <div className="brand">
            <button className="btn" onClick={() => setActiveCategoryId(null)} title="رجوع" type="button">
              ←
            </button>
            <div>
              <div className="title">{TODAY_NAME}</div>
              <div className="subtitle">منشورين من كل مجموعة (نص + صورة) — الاستخدام ينزّلها في مجموعتها</div>
            </div>
          </div>

          <div className="actions">
            {ThemeBtn}
            <button className="btn" onClick={() => { setTrashTab("texts"); setTrashOpen(true); }} title="السلة" type="button">
              <I.Trash style={{ width: 18, height: 18 }} /> السلة
            </button>
            <button className="btn" onClick={exportBackup} title="تصدير" type="button"><I.Download style={{ width: 18, height: 18 }} /></button>
            <button className="btn" onClick={openImport} title="استيراد" type="button"><I.Upload style={{ width: 18, height: 18 }} /></button>
            <button className="btn danger" onClick={logout} title="خروج" type="button">خروج</button>
            <input ref={importRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => importBackup(e.target.files?.[0])} />
          </div>
        </header>

        <div className="todayWrap card" style={{ marginTop: 14 }}>
          {todaySections.length === 0 ? (
            <div className="meta">لا توجد عناصر بعد.</div>
          ) : (
            todaySections.map((sec) => (
              <div key={sec.catId} className="todaySection">
                <div className="todayHeader">
                  <div className="todayTitle">{sec.catName}</div>
                  <div className="meta">أعلى {TODAY_TAKE} منشور</div>
                </div>

                <div className="todayGrid">
                  {sec.posts.map((p) => (
                    <div key={p.key} className="todayPost">
                      <div className="todayMedia">
                        {p.image?.url ? (
                          <img className="todayImg" src={p.image.url} alt="" onError={(e) => (e.currentTarget.style.display = "none")} loading="lazy" />
                        ) : (
                          <div className="todayImgPh">لا توجد صورة</div>
                        )}
                      </div>

                      <div className="todayBody">
                        {p.text?.text ? (
                          <TweetPreview text={p.text.text} timeLabel={p.text.lastUsedAt ? fmt(p.text.lastUsedAt) : "—"} />
                        ) : (
                          <div className="todayTextPh meta">لا يوجد نص</div>
                        )}

                        <div className="todayActions">
                          <button className="btn primary" onClick={() => useTodayPost(p.catId, p.text, p.image)} type="button">
                            <I.Copy /> نسخ + استخدام
                          </button>

                          {p.image?.url && (
                            <button className="btn" onClick={() => copyImageLink(p.image)} type="button">
                              <I.Copy /> نسخ رابط الصورة
                            </button>
                          )}

                          <button className="btn" onClick={() => setActiveCategoryId(p.catId)} type="button">
                            دخول المجموعة
                          </button>
                        </div>

                        <div className="meta" style={{ marginTop: 8 }}>
                          {p.text ? (
                            <>
                              نص: {p.text.usedCount || 0} استخدام • آخر: {fmt(p.text.lastUsedAt)}
                            </>
                          ) : null}
                          {p.text && p.image ? <span className="dot">•</span> : null}
                          {p.image ? (
                            <>
                              صورة: {p.image.usedCount || 0} استخدام • آخر: {fmt(p.image.lastUsedAt)}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Trash Modal */}
        {trashOpen && (
          <div className="modalOverlay" onMouseDown={() => setTrashOpen(false)}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <div className="modalTitle">سلة المحذوفات</div>
                <button className="btn iconOnly" onClick={() => setTrashOpen(false)} title="إغلاق" type="button">
                  ✕
                </button>
              </div>

              <div className="trashTabs">
                <button className={`tabBtn ${trashTab === "texts" ? "active" : ""}`} onClick={() => setTrashTab("texts")} type="button">
                  نصوص
                </button>
                <button className={`tabBtn ${trashTab === "images" ? "active" : ""}`} onClick={() => setTrashTab("images")} type="button">
                  صور
                </button>
              </div>

              <div className="trashTools">
                <button className="btn danger" onClick={() => clearTrash(trashTab)} type="button">
                  تفريغ
                </button>
              </div>

              <div className="trashList">
                {trashTab === "texts" ? (
                  (data.trash?.texts || []).length === 0 ? (
                    <div className="meta">—</div>
                  ) : (
                    (data.trash?.texts || [])
                      .slice()
                      .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
                      .map((t) => (
                        <div key={t.id} className="trashItem">
                          <div className="trashMain">
                            <div className="trashTitle">{(t.text || "").slice(0, 90)}{(t.text || "").length > 90 ? "…" : ""}</div>
                            <div className="meta">حُذف: {fmt(t.deletedAt)} • من: {(categories.find((c) => c.id === t.fromCategoryId)?.name) ?? "—"}</div>
                          </div>
                          <div className="trashActions">
                            <button className="btn" onClick={() => restoreFromTrash("texts", t.id)} type="button">استرجاع</button>
                            <button className="btn danger" onClick={() => deleteForever("texts", t.id)} type="button">حذف نهائي</button>
                          </div>
                        </div>
                      ))
                  )
                ) : (data.trash?.images || []).length === 0 ? (
                  <div className="meta">—</div>
                ) : (
                  (data.trash?.images || [])
                    .slice()
                    .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
                    .map((img) => (
                      <div key={img.id} className="trashItem">
                        <div className="trashMain">
                          <div className="trashTitle">{img.url}</div>
                          <div className="meta">حُذفت: {fmt(img.deletedAt)} • من: {(categories.find((c) => c.id === img.fromCategoryId)?.name) ?? "—"}</div>
                        </div>
                        <div className="trashActions">
                          <button className="btn" onClick={() => restoreFromTrash("images", img.id)} type="button">استرجاع</button>
                          <button className="btn danger" onClick={() => deleteForever("images", img.id)} type="button">حذف نهائي</button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        <ToastUndo show={!!undoState} label={undoState?.label} onUndo={undoLastDelete} onClose={closeUndo} />
      </div>
    );
  }

  /* =========================
     Normal category view
  ========================= */
  const charCount = newText.length;
  const overLimit = charCount > xLimit;

  return (
    <div className={appClass}>
      <header className="topbar">
        <div className="brand">
          <button className="btn" onClick={() => setActiveCategoryId(null)} title="رجوع" type="button">
            ←
          </button>
          <div>
            <div className="title">{activeCategory?.name}</div>
            <div className="subtitle">
              {rawTexts.length} نص • {rawImages.length} صورة
            </div>
          </div>
        </div>

        <div className="actions">
          {ThemeBtn}
          <div className="seg">
            <IconToggle active={showMode === "texts"} title="إظهار النص فقط" onClick={() => setShowMode("texts")}>
              <I.Text />
            </IconToggle>
            <IconToggle active={showMode === "images"} title="إظهار الصور فقط" onClick={() => setShowMode("images")}>
              <I.Image />
            </IconToggle>
            <IconToggle active={showMode === "both"} title="إظهار الاثنين" onClick={() => setShowMode("both")}>
              <I.Both />
            </IconToggle>
          </div>

          <button className="btn" onClick={() => { setTrashTab("texts"); setTrashOpen(true); }} title="السلة" type="button">
            <I.Trash style={{ width: 18, height: 18 }} /> السلة
          </button>

          <div className="pill">حد X: {xLimit}</div>
          <button className="btn" onClick={exportBackup} title="تصدير" type="button">
            <I.Download style={{ width: 18, height: 18 }} />
          </button>
          <button className="btn" onClick={openImport} title="استيراد" type="button">
            <I.Upload style={{ width: 18, height: 18 }} />
          </button>
          <button className="btn danger" onClick={logout} title="خروج" type="button">
            خروج
          </button>
          <input ref={importRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => importBackup(e.target.files?.[0])} />
        </div>
      </header>

      <div className={`page ${showMode !== "both" ? "single" : ""}`}>
        {/* Images */}
        {showMode !== "texts" && (
          <section className="card panel">
            <div className="panelHeader">
              <div className="panelTitle">
                <I.Image /> الصور
              </div>
              <div className="panelTools">
                <select className="select" value={sortImages} onChange={(e) => setSortImages(e.target.value)} title="فرز">
                  <option value="lru">الأقدم استخدامًا</option>
                  <option value="newest">الأحدث إضافة</option>
                  <option value="oldest">الأقدم إضافة</option>
                  <option value="leastUsed">الأقل استخدامًا</option>
                  <option value="mostUsed">الأكثر استخدامًا</option>
                </select>
              </div>
            </div>

            {selectedImageIds.length > 0 && (
              <BulkBar
                count={selectedImageIds.length}
                categories={otherCats}
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                onCopy={() => moveCopyDeleteSelected("image", "copy")}
                onMove={() => moveCopyDeleteSelected("image", "move")}
                onDelete={() => moveCopyDeleteSelected("image", "delete")}
                onClear={clearSelection}
              />
            )}

            <div className="row">
              <input className="input" placeholder="رابط صورة…" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addImage()} />
              <button className="btn primary iconOnly" onClick={addImage} disabled={!newImageUrl.trim()} title="إضافة" type="button">
                <I.Plus />
              </button>
            </div>

            {images.length === 0 ? (
              <div className="meta" style={{ marginTop: 12 }}>
                —
              </div>
            ) : (
              <VirtualGrid2
                items={images}
                estimateRow={285}
                renderCard={(img) => {
                  const isSel = selectedImageIds.includes(img.id);
                  const removing = removingIds.has(`image:${img.id}`);
                  const isEditing = editingImageId === img.id;

                  return (
                    <div key={img.id} className={`thumb ${isSel ? "selected" : ""} ${removing ? "removing" : ""}`}>
                      <div className="selectRow">
                        <label className="check">
                          <input type="checkbox" checked={isSel} onChange={() => toggleSel("image", img.id)} />
                          <span />
                        </label>

                        <button
                          className={`btn iconOnly ${img.pinned ? "pinnedBtn" : ""}`}
                          onClick={() => togglePinImage(activeCategoryId, img.id)}
                          title={img.pinned ? "إلغاء التثبيت" : "تثبيت"}
                          type="button"
                        >
                          <I.Pin />
                        </button>
                      </div>

                      <img className="thumbImg" src={img.url} alt="" onError={(e) => (e.currentTarget.style.display = "none")} loading="lazy" />

                      {img.pinned && <div className="pinBadge">مثبّت</div>}

                      {isEditing && (
                        <div className="inlineEdit">
                          <input className="input" value={editingImageValue} onChange={(e) => setEditingImageValue(e.target.value)} />
                          <div className="row" style={{ justifyContent: "flex-end" }}>
                            <button className="btn" onClick={cancelEditImage} type="button">
                              إلغاء
                            </button>
                            <button className="btn primary" onClick={() => saveEditImage(activeCategoryId, img.id)} type="button">
                              حفظ
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="metaActionRow">
                        <div className="metaLine">
                          <span>آخر: {fmt(img.lastUsedAt)}</span>
                          <span className="dot">•</span>
                          <span>مرات: {img.usedCount || 0}</span>
                        </div>
                        <div className="actionsMini">
                          <button className="btn iconOnly" onClick={() => copyImageLink(img)} title="نسخ الرابط" type="button">
                            <I.Copy />
                          </button>
                          <button className="btn iconOnly" onClick={() => markImageUsed(activeCategoryId, img.id, false)} title="تسجيل استخدام (نزول)" type="button">
                            <I.Check />
                          </button>
                          <button className="btn iconOnly" onClick={() => (isEditing ? cancelEditImage() : startEditImage(img))} title="تعديل" type="button">
                            <I.Edit />
                          </button>
                          <button className="btn danger iconOnly" onClick={() => deleteImage(activeCategoryId, img)} title="حذف" type="button">
                            <I.Trash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </section>
        )}

        {/* Texts */}
        {showMode !== "images" && (
          <section className="card panel">
            <div className="panelHeader">
              <div className="panelTitle">
                <I.Text /> النصوص
              </div>
              <div className="panelTools">
                <select className="select" value={sortTexts} onChange={(e) => setSortTexts(e.target.value)} title="فرز">
                  <option value="lru">الأقدم استخدامًا</option>
                  <option value="newest">الأحدث إضافة</option>
                  <option value="oldest">الأقدم إضافة</option>
                  <option value="leastUsed">الأقل استخدامًا</option>
                  <option value="mostUsed">الأكثر استخدامًا</option>
                </select>
                <button className="btn iconOnly" onClick={() => { setBulkText(""); setBulkOpen(true); }} title="إضافة دفعة" type="button">
                  <I.Plus />
                </button>
              </div>
            </div>

            {selectedTextIds.length > 0 && (
              <BulkBar
                count={selectedTextIds.length}
                categories={otherCats}
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                onCopy={() => moveCopyDeleteSelected("text", "copy")}
                onMove={() => moveCopyDeleteSelected("text", "move")}
                onDelete={() => moveCopyDeleteSelected("text", "delete")}
                onClear={clearSelection}
              />
            )}

            <textarea
              className="textarea"
              placeholder="اكتب نص… (Enter للإضافة • Shift+Enter لسطر جديد)"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addText();
                }
              }}
            />

            <div className="row space" style={{ marginTop: 10 }}>
              <div className={`counter ${overLimit ? "over" : ""}`}>
                {charCount}/{xLimit}
                {overLimit ? ` (+${charCount - xLimit})` : ""}
              </div>
              <button className="btn primary" onClick={addText} disabled={!newText.trim()} type="button">
                <I.Plus style={{ width: 18, height: 18 }} /> إضافة
              </button>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <input
                className="input"
                placeholder="بحث…"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setActiveTextIndex(0);
                }}
              />
              <div className="kbd">
                <I.Search style={{ width: 16, height: 16 }} />
              </div>
            </div>

            {texts.length === 0 ? (
              <div className="meta" style={{ marginTop: 12 }}>
                —
              </div>
            ) : (
              <VirtualList
                items={texts}
                estimate={310}
                overscan={6}
                className="virtTexts"
                render={(t, idx) => {
                  const isSel = selectedTextIds.includes(t.id);
                  const isDup = duplicateIds.has(t.id);
                  const isActive = idx === activeTextIndex;
                  const isCopied = lastCopied?.kind === "text" && lastCopied?.id === t.id && Date.now() - lastCopied.ts < 1200;
                  const removing = removingIds.has(`text:${t.id}`);
                  const isEditing = editingTextId === t.id;

                  return (
                    <div
                      key={t.id}
                      data-text={t.id}
                      className={`card innerCard ${isSel ? "selected" : ""} ${isDup ? "dup" : ""} ${isActive ? "activeCard" : ""} ${
                        isCopied ? "copiedFlash" : ""
                      } ${removing ? "removing" : ""}`}
                      onMouseEnter={() => setActiveTextIndex(idx)}
                    >
                      <div className="selectRow">
                        <label className="check">
                          <input type="checkbox" checked={isSel} onChange={() => toggleSel("text", t.id)} />
                          <span />
                        </label>

                        <button
                          className={`btn iconOnly ${t.pinned ? "pinnedBtn" : ""}`}
                          onClick={() => togglePinText(activeCategoryId, t.id)}
                          title={t.pinned ? "إلغاء التثبيت" : "تثبيت"}
                          type="button"
                        >
                          <I.Pin />
                        </button>
                      </div>

                      {t.pinned && <div className="pinBadge">مثبّت</div>}

                      {isEditing ? (
                        <div className="inlineEdit">
                          <textarea className="textarea" value={editingTextValue} onChange={(e) => setEditingTextValue(e.target.value)} />
                          <div className="row" style={{ justifyContent: "flex-end" }}>
                            <button className="btn" onClick={cancelEditText} type="button">
                              إلغاء
                            </button>
                            <button className="btn primary" onClick={() => saveEditText(activeCategoryId, t.id)} type="button">
                              حفظ
                            </button>
                          </div>
                        </div>
                      ) : (
                        <TweetPreview text={t.text} timeLabel={t.lastUsedAt ? fmt(t.lastUsedAt) : "—"} />
                      )}

                      <div className="metaActionRow">
                        <div className="metaLine">
                          <span>آخر: {fmt(t.lastUsedAt)}</span>
                          <span className="dot">•</span>
                          <span>مرات: {t.usedCount || 0}</span>
                          <span className="dot">•</span>
                          <span>حروف: {t.text.length}</span>
                          {isDup && (
                            <>
                              <span className="dot">•</span>
                              <span className="dupBadge">مكرر</span>
                            </>
                          )}
                        </div>

                        <div className="actionsMini">
                          <button className="btn primary iconOnly" onClick={() => copyText(activeCategoryId, t)} title="نسخ (نزول)" type="button">
                            <I.Copy />
                          </button>
                          <button className="btn iconOnly" onClick={() => bumpTextUsage(activeCategoryId, t.id, false)} title="تسجيل استخدام (نزول)" type="button">
                            <I.Check />
                          </button>
                          <button className="btn iconOnly" onClick={() => (isEditing ? cancelEditText() : startEditText(t))} title="تعديل" type="button">
                            <I.Edit />
                          </button>
                          <button className="btn danger iconOnly" onClick={() => deleteText(activeCategoryId, t)} title="حذف (سلة)" type="button">
                            <I.Trash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            )}

            <div className="footerHint">اختصارات: Ctrl+C للنسخ • ↑↓ للتنقل</div>
          </section>
        )}
      </div>

      {/* Bulk modal */}
      {bulkOpen && (
        <div className="modalOverlay" onMouseDown={() => setBulkOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">إضافة نصوص دفعة واحدة</div>
              <button className="btn iconOnly" onClick={() => setBulkOpen(false)} title="إغلاق" type="button">
                ✕
              </button>
            </div>
            <div className="meta" style={{ marginTop: 6 }}>
              ضع كل نص في سطر مستقل.
            </div>
            <textarea className="textarea" style={{ marginTop: 10, minHeight: 180 }} placeholder={"نص 1\nنص 2\nنص 3 ..."} value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
            <div className="row space" style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setBulkOpen(false)} type="button">
                إلغاء
              </button>
              <button className="btn primary" onClick={applyBulk} type="button">
                <I.Plus style={{ width: 18, height: 18 }} /> إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trash Modal */}
      {trashOpen && (
        <div className="modalOverlay" onMouseDown={() => setTrashOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">سلة المحذوفات</div>
              <button className="btn iconOnly" onClick={() => setTrashOpen(false)} title="إغلاق" type="button">
                ✕
              </button>
            </div>

            <div className="trashTabs">
              <button className={`tabBtn ${trashTab === "texts" ? "active" : ""}`} onClick={() => setTrashTab("texts")} type="button">
                نصوص
              </button>
              <button className={`tabBtn ${trashTab === "images" ? "active" : ""}`} onClick={() => setTrashTab("images")} type="button">
                صور
              </button>
            </div>

            <div className="trashTools">
              <button className="btn danger" onClick={() => clearTrash(trashTab)} type="button">
                تفريغ
              </button>
            </div>

            <div className="trashList">
              {trashTab === "texts" ? (
                (data.trash?.texts || []).length === 0 ? (
                  <div className="meta">—</div>
                ) : (
                  (data.trash?.texts || [])
                    .slice()
                    .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
                    .map((t) => (
                      <div key={t.id} className="trashItem">
                        <div className="trashMain">
                          <div className="trashTitle">{(t.text || "").slice(0, 90)}{(t.text || "").length > 90 ? "…" : ""}</div>
                          <div className="meta">حُذف: {fmt(t.deletedAt)} • من: {(categories.find((c) => c.id === t.fromCategoryId)?.name) ?? "—"}</div>
                        </div>
                        <div className="trashActions">
                          <button className="btn" onClick={() => restoreFromTrash("texts", t.id)} type="button">استرجاع</button>
                          <button className="btn danger" onClick={() => deleteForever("texts", t.id)} type="button">حذف نهائي</button>
                        </div>
                      </div>
                    ))
                )
              ) : (data.trash?.images || []).length === 0 ? (
                <div className="meta">—</div>
              ) : (
                (data.trash?.images || [])
                  .slice()
                  .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
                  .map((img) => (
                    <div key={img.id} className="trashItem">
                      <div className="trashMain">
                        <div className="trashTitle">{img.url}</div>
                        <div className="meta">حُذفت: {fmt(img.deletedAt)} • من: {(categories.find((c) => c.id === img.fromCategoryId)?.name) ?? "—"}</div>
                      </div>
                      <div className="trashActions">
                        <button className="btn" onClick={() => restoreFromTrash("images", img.id)} type="button">استرجاع</button>
                        <button className="btn danger" onClick={() => deleteForever("images", img.id)} type="button">حذف نهائي</button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      <ToastUndo show={!!undoState} label={undoState?.label} onUndo={undoLastDelete} onClose={closeUndo} />
    </div>
  );
}
