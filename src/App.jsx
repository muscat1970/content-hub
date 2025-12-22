import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const LS_KEY = "content-hub";
const APP_VERSION = 5;
const X_LIMIT_DEFAULT = 280;

// ---------- Icons (بدون مكتبات) ----------
const Icon = {
  Spark: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8L12 2Z" stroke="currentColor" strokeWidth="1.8" />
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
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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
      <path d="M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
  ArrowUp: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 19V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 11l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  FocusLeft: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 4h7v16H4V4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13 4h7v16h-7" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 3" />
    </svg>
  ),
  FocusRight: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M13 4h7v16h-7V4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 4h7v16H4" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 3" />
    </svg>
  ),
  Bolt: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M13 2 4 14h7l-1 8 10-14h-7l0-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  Tag: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M20 13l-7 7-11-11V2h7l11 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7.5 7.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  const date = d.toLocaleDateString("ar", { day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date} • ${time}`;
}

async function copyToClipboard(text) {
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
}

function canonicalizeArabic(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarityJaccard(a, b) {
  const A = new Set(canonicalizeArabic(a).split(" ").filter(Boolean));
  const B = new Set(canonicalizeArabic(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

function sortItems(items, sortKey) {
  const arr = [...items];
  switch (sortKey) {
    case "newest":
      return arr.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    case "oldest":
      return arr.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    case "mostUsed":
      return arr.sort(
        (a, b) => (b.usedCount ?? 0) - (a.usedCount ?? 0) || (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)
      );
    case "leastUsed":
      return arr.sort(
        (a, b) => (a.usedCount ?? 0) - (b.usedCount ?? 0) || (a.lastUsedAt ?? 0) - (b.lastUsedAt ?? 0)
      );
    case "lru":
    default:
      return arr.sort((a, b) => (a.lastUsedAt ?? 0) - (b.lastUsedAt ?? 0));
  }
}

// ---------- Tweet Preview ----------
function parseSegments(t) {
  // remove zero-width / invisible chars first
  const cleaned = (t || "").replace(/[\u200B-\u200D\uFEFF]/g, "");

  // include combining marks (\p{M}) so hashtags/mentions with diacritics stay intact
  const re = /(https?:\/\/[^\s]+)|(#(?:[\p{L}\p{M}\p{N}_]+))|(@(?:[\p{L}\p{M}\p{N}_]+))/gu;

  const out = [];
  let lastIndex = 0;
  for (const m of cleaned.matchAll(re)) {
    const idx = m.index;
    if (idx > lastIndex) out.push({ type: "text", text: cleaned.slice(lastIndex, idx) });
    if (m[1]) out.push({ type: "link", text: m[1] });
    else if (m[2]) out.push({ type: "hashtag", text: m[2] });
    else if (m[3]) out.push({ type: "mention", text: m[3] });
    lastIndex = idx + m[0].length;
  }
  if (lastIndex < cleaned.length) out.push({ type: "text", text: cleaned.slice(lastIndex) });
  return out;
}

function TweetPreview({ text, timeLabel = "الآن", quick = false }) {
  const segs = useMemo(() => parseSegments(text), [text]);

  return (
    <div className={`tweet ${quick ? "tweetQuick" : ""}`}>
      <div className="tweetAvatar" aria-hidden="true" />
      <div className="tweetBody">
        <div className="tweetHeader">
          <div className="tweetName">مخزني الإبداعي</div>
          <div className="tweetHandle">@contenthub</div>
          <div className="tweetDot">•</div>
          <div className="tweetTime">{timeLabel}</div>
        </div>
        <div className="tweetText">
          {segs.map((s, idx) => {
            if (s.type === "text") return <span key={idx}>{s.text}</span>;
            if (s.type === "link")
              return (
                <a key={idx} className="tweetLink" href={s.text} target="_blank" rel="noreferrer">
                  {s.text}
                </a>
              );
            if (s.type === "hashtag") return <span key={idx} className="tweetTag">{s.text}</span>;
            return <span key={idx} className="tweetMention">{s.text}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Seed + Migrate ----------
const seedData = {
  version: APP_VERSION,
  xLimit: X_LIMIT_DEFAULT,
  categories: [
    { id: "cat-morning", name: "تغريدات صباحية/مسائية" },
    { id: "cat-national", name: "محتوى وطني" },
    { id: "cat-quotes", name: "اقتباسات وحكم" },
    { id: "cat-misc", name: "محتوى منوع" },
  ],
  textsByCategory: { "cat-morning": [] },
  imagesByCategory: { "cat-morning": [] },
  hashtagsByCategory: { "cat-morning": "#صباح_الخير" }, // جديد
};

function normalizeTexts(map) {
  const out = {};
  for (const [catId, arr] of Object.entries(map || {})) {
    out[catId] = (arr || []).map((t) => ({
      id: t.id ?? uid("t"),
      text: t.text ?? "",
      createdAt: t.createdAt ?? Date.now(),
      lastUsedAt: t.lastUsedAt ?? null,
      usedCount: t.usedCount ?? 0,
    }));
  }
  return out;
}

function normalizeImages(map) {
  const out = {};
  for (const [catId, arr] of Object.entries(map || {})) {
    out[catId] = (arr || []).map((i) => ({
      id: i.id ?? uid("i"),
      url: i.url ?? "",
      createdAt: i.createdAt ?? Date.now(),
      lastUsedAt: i.lastUsedAt ?? null,
      usedCount: i.usedCount ?? 0,
    }));
  }
  return out;
}

function normalizeHashtags(map, categories) {
  const out = { ...(map || {}) };
  for (const c of categories || []) {
    if (typeof out[c.id] !== "string") out[c.id] = "";
  }
  return out;
}

function migrate(raw) {
  if (!raw || typeof raw !== "object") return seedData;
  if (raw.textsByCategory && raw.imagesByCategory) {
    const categories = raw.categories ?? seedData.categories;
    return {
      version: APP_VERSION,
      xLimit: raw.xLimit ?? X_LIMIT_DEFAULT,
      categories,
      textsByCategory: normalizeTexts(raw.textsByCategory),
      imagesByCategory: normalizeImages(raw.imagesByCategory),
      hashtagsByCategory: normalizeHashtags(raw.hashtagsByCategory, categories),
    };
  }
  return seedData;
}

export default function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? migrate(safeParse(saved, null)) : seedData;
  });

  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // UI
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");

  const [newText, setNewText] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  const [searchText, setSearchText] = useState("");
  const [searchImage, setSearchImage] = useState("");

  const [sortTexts, setSortTexts] = useState("lru");
  const [sortImages, setSortImages] = useState("lru");

  const [viewTexts, setViewTexts] = useState("normal"); // normal | compact
  const [viewImages, setViewImages] = useState("normal"); // normal | compact | full
  const [focusMode, setFocusMode] = useState("both"); // both | texts | images

  const [quickMode, setQuickMode] = useState(false); // (3) وضع السرعة
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  // Multi select
  const [selectedTextIds, setSelectedTextIds] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [targetCategoryId, setTargetCategoryId] = useState("");

  // Hashtags
  const [hashtagsDraft, setHashtagsDraft] = useState("");

  // (16) تمييز آخر عنصر تم نسخه
  const [lastCopied, setLastCopied] = useState(null); // { kind: "text", id, ts }

  // Micro animation delete
  const [removingIds, setRemovingIds] = useState(new Set());

  // keyboard navigation
  const [activeTextIndex, setActiveTextIndex] = useState(0);

  const importRef = useRef(null);
  const textsPanelRef = useRef(null);
  const imagesPanelRef = useRef(null);

  const lastScrollRef = useRef(0);
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, [data]);

  const xLimit = data.xLimit ?? X_LIMIT_DEFAULT;

  const activeCategory = useMemo(
    () => data.categories.find((c) => c.id === activeCategoryId) || null,
    [data.categories, activeCategoryId]
  );

  // عند تغيير المجموعة، جهّز الهاشتاقات
  useEffect(() => {
    if (!activeCategoryId) return;
    setHashtagsDraft(data.hashtagsByCategory?.[activeCategoryId] ?? "");
  }, [activeCategoryId, data.hashtagsByCategory]);

  const rawTexts = useMemo(
    () => (activeCategoryId ? data.textsByCategory?.[activeCategoryId] || [] : []),
    [data.textsByCategory, activeCategoryId]
  );

  const rawImages = useMemo(
    () => (activeCategoryId ? data.imagesByCategory?.[activeCategoryId] || [] : []),
    [data.imagesByCategory, activeCategoryId]
  );

  // كشف التكرار (Exact)
  const duplicateInfo = useMemo(() => {
    const canonMap = new Map();
    for (const t of rawTexts) {
      const c = canonicalizeArabic(t.text);
      if (!canonMap.has(c)) canonMap.set(c, []);
      canonMap.get(c).push(t.id);
    }
    const exactDupIds = new Set();
    for (const [, ids] of canonMap.entries()) {
      if (ids.length > 1) ids.forEach((id) => exactDupIds.add(id));
    }
    return { exactDupIds };
  }, [rawTexts]);

  const texts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const filtered = rawTexts.filter((t) => (t.text || "").toLowerCase().includes(q));
    return sortItems(filtered, sortTexts);
  }, [rawTexts, searchText, sortTexts]);

  const images = useMemo(() => {
    const q = searchImage.trim().toLowerCase();
    const filtered = rawImages.filter((i) => (i.url || "").toLowerCase().includes(q));
    return sortItems(filtered, sortImages);
  }, [rawImages, searchImage, sortImages]);

  // Quick mode يضبط العرض تلقائيًا (بطاقات أصغر + نسخ أسرع)
  useEffect(() => {
    if (!activeCategoryId) return;
    if (quickMode) {
      setViewTexts("compact");
      setViewImages("compact");
    }
  }, [quickMode, activeCategoryId]);

  // ---------- Header auto-hide ----------
  const onPanelScroll = (e) => {
    const top = e.currentTarget.scrollTop;
    const last = lastScrollRef.current;
    if (top > last + 10) setHeaderHidden(true);
    if (top < last - 10) setHeaderHidden(false);
    lastScrollRef.current = top;
  };

  // ---------- Backup ----------
  const exportBackup = () => {
    const payload = { ...data, version: APP_VERSION };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `content-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const triggerImport = () => importRef.current?.click();

  const importBackup = async (file) => {
    if (!file) return;
    const text = await file.text();
    const raw = safeParse(text, null);
    const migrated = migrate(raw);
    if (!confirm("استبدال البيانات الحالية بالنسخة المستوردة؟")) return;
    setData(migrated);
    setActiveCategoryId(null);
    setSearchText("");
    setSearchImage("");
    setSelectedTextIds([]);
    setSelectedImageIds([]);
    setLastCopied(null);
  };

  // ---------- Categories ----------
  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    const newCat = { id: uid("cat"), name };
    setData((prev) => ({
      ...prev,
      categories: [newCat, ...prev.categories],
      textsByCategory: { ...(prev.textsByCategory || {}), [newCat.id]: [] },
      imagesByCategory: { ...(prev.imagesByCategory || {}), [newCat.id]: [] },
      hashtagsByCategory: { ...(prev.hashtagsByCategory || {}), [newCat.id]: "" },
    }));
    setNewCatName("");
  };

  const startEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const saveEditCategory = () => {
    const name = editingCatName.trim();
    if (!editingCatId || !name) return;
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === editingCatId ? { ...c, name } : c)),
    }));
    setEditingCatId(null);
    setEditingCatName("");
  };

  const deleteCategory = (catId) => {
    const cat = data.categories.find((c) => c.id === catId);
    if (!confirm(`حذف "${cat?.name ?? ""}"؟`)) return;

    setData((prev) => {
      const nextCats = prev.categories.filter((c) => c.id !== catId);
      const nextTexts = { ...(prev.textsByCategory || {}) };
      const nextImages = { ...(prev.imagesByCategory || {}) };
      const nextTags = { ...(prev.hashtagsByCategory || {}) };
      delete nextTexts[catId];
      delete nextImages[catId];
      delete nextTags[catId];
      return { ...prev, categories: nextCats, textsByCategory: nextTexts, imagesByCategory: nextImages, hashtagsByCategory: nextTags };
    });

    if (activeCategoryId === catId) setActiveCategoryId(null);
  };

  // ---------- Texts ----------
  const addTextOne = (text) => {
    const cleaned = (text || "").trim();
    if (!activeCategoryId || !cleaned) return false;

    const canonNew = canonicalizeArabic(cleaned);
    const exactExists = rawTexts.some((t) => canonicalizeArabic(t.text) === canonNew);

    // Similarity check (خفيف)
    const sample = rawTexts.slice(0, 40);
    const simHit = sample.some((t) => similarityJaccard(t.text, cleaned) >= 0.9);

    if (exactExists || simHit) {
      const ok = confirm("هناك نص مشابه/مكرر. هل تريد الإضافة على أي حال؟");
      if (!ok) return false;
    }

    const now = Date.now();
    const item = { id: uid("t"), text: cleaned, createdAt: now, lastUsedAt: null, usedCount: 0 };

    setData((prev) => {
      const current = prev.textsByCategory?.[activeCategoryId] || [];
      return { ...prev, textsByCategory: { ...(prev.textsByCategory || {}), [activeCategoryId]: [item, ...current] } };
    });

    return true;
  };

  const addText = () => {
    const ok = addTextOne(newText);
    if (ok) setNewText("");
  };

  const softDelete = (kind, id, doDelete) => {
    setRemovingIds((prev) => new Set(prev).add(`${kind}:${id}`));
    window.setTimeout(() => {
      doDelete();
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(`${kind}:${id}`);
        return next;
      });
    }, 180);
  };

  const deleteText = (id) => {
    if (!confirm("حذف النص؟")) return;
    softDelete("text", id, () => {
      setData((prev) => {
        const current = prev.textsByCategory?.[activeCategoryId] || [];
        return { ...prev, textsByCategory: { ...(prev.textsByCategory || {}), [activeCategoryId]: current.filter((t) => t.id !== id) } };
      });
      setSelectedTextIds((prev) => prev.filter((x) => x !== id));
    });
  };

  const bumpTextUsage = (id, moveToTop = false) => {
    const now = Date.now();
    setData((prev) => {
      const current = prev.textsByCategory?.[activeCategoryId] || [];
      const updated = current.map((t) =>
        t.id === id ? { ...t, lastUsedAt: now, usedCount: (t.usedCount || 0) + 1 } : t
      );
      const picked = updated.find((t) => t.id === id);
      const rest = updated.filter((t) => t.id !== id);
      const nextList = picked ? (moveToTop ? [picked, ...rest] : [...rest, picked]) : updated;
      return { ...prev, textsByCategory: { ...(prev.textsByCategory || {}), [activeCategoryId]: nextList } };
    });
  };

  const pinTextToTop = (id) => {
    setData((prev) => {
      const current = prev.textsByCategory?.[activeCategoryId] || [];
      const picked = current.find((t) => t.id === id);
      if (!picked) return prev;
      const rest = current.filter((t) => t.id !== id);
      return { ...prev, textsByCategory: { ...(prev.textsByCategory || {}), [activeCategoryId]: [picked, ...rest] } };
    });
  };

  const copyText = async (item) => {
    await copyToClipboard(item.text);
    setLastCopied({ kind: "text", id: item.id, ts: Date.now() });
    bumpTextUsage(item.id, false);
  };

  const copyTextWithHashtags = async (item) => {
    const tags = (data.hashtagsByCategory?.[activeCategoryId] || "").trim();
    const payload = tags ? `${item.text}\n\n${tags}` : item.text;
    await copyToClipboard(payload);
    setLastCopied({ kind: "text", id: item.id, ts: Date.now() });
    bumpTextUsage(item.id, false);
  };

  // Bulk add
  const openBulk = () => {
    setBulkText("");
    setBulkOpen(true);
  };

  const applyBulk = () => {
    const lines = bulkText.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (!lines.length) return;
    let added = 0;
    for (const line of lines) if (addTextOne(line)) added++;
    setBulkOpen(false);
    setBulkText("");
    alert(`تمت إضافة ${added} نص`);
  };

  // ---------- Images ----------
  const addImage = () => {
    if (!activeCategoryId) return;
    const url = newImageUrl.trim();
    if (!url) return;

    const now = Date.now();
    const item = { id: uid("i"), url, createdAt: now, lastUsedAt: null, usedCount: 0 };

    setData((prev) => {
      const current = prev.imagesByCategory?.[activeCategoryId] || [];
      return { ...prev, imagesByCategory: { ...(prev.imagesByCategory || {}), [activeCategoryId]: [item, ...current] } };
    });
    setNewImageUrl("");
  };

  const deleteImage = (id) => {
    if (!confirm("حذف الصورة؟")) return;
    softDelete("image", id, () => {
      setData((prev) => {
        const current = prev.imagesByCategory?.[activeCategoryId] || [];
        return { ...prev, imagesByCategory: { ...(prev.imagesByCategory || {}), [activeCategoryId]: current.filter((i) => i.id !== id) } };
      });
      setSelectedImageIds((prev) => prev.filter((x) => x !== id));
    });
  };

  // زر تسجيل استخدام للصورة
  const markImageUsed = (id, moveToTop = false) => {
    const now = Date.now();
    setData((prev) => {
      const current = prev.imagesByCategory?.[activeCategoryId] || [];
      const updated = current.map((i) =>
        i.id === id ? { ...i, lastUsedAt: now, usedCount: (i.usedCount || 0) + 1 } : i
      );
      const picked = updated.find((i) => i.id === id);
      const rest = updated.filter((i) => i.id !== id);
      const nextList = picked ? (moveToTop ? [picked, ...rest] : [...rest, picked]) : updated;
      return { ...prev, imagesByCategory: { ...(prev.imagesByCategory || {}), [activeCategoryId]: nextList } };
    });
  };

  const pinImageToTop = (id) => {
    setData((prev) => {
      const current = prev.imagesByCategory?.[activeCategoryId] || [];
      const picked = current.find((i) => i.id === id);
      if (!picked) return prev;
      const rest = current.filter((i) => i.id !== id);
      return { ...prev, imagesByCategory: { ...(prev.imagesByCategory || {}), [activeCategoryId]: [picked, ...rest] } };
    });
  };

  // ---------- Multi select ----------
  const toggleSelected = (kind, id) => {
    if (kind === "text") setSelectedTextIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    else setSelectedImageIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearSelection = () => {
    setSelectedTextIds([]);
    setSelectedImageIds([]);
    setTargetCategoryId("");
  };

  const moveCopyDeleteSelected = (kind, action) => {
    if (!activeCategoryId) return;
    const ids = kind === "text" ? selectedTextIds : selectedImageIds;
    if (!ids.length) return;

    if (action !== "delete" && !targetCategoryId) {
      alert("اختر المجموعة الهدف أولاً");
      return;
    }

    if (action === "delete" && !confirm("حذف العناصر المحددة؟")) return;

    setData((prev) => {
      const next = { ...prev };

      if (kind === "text") {
        const src = next.textsByCategory?.[activeCategoryId] || [];
        const picked = src.filter((t) => ids.includes(t.id));
        const rest = src.filter((t) => !ids.includes(t.id));
        if (action === "delete") {
          next.textsByCategory = { ...(next.textsByCategory || {}), [activeCategoryId]: rest };
          return next;
        }
        const dst = next.textsByCategory?.[targetCategoryId] || [];
        const toInsert =
          action === "copy"
            ? picked.map((t) => ({ ...t, id: uid("t"), createdAt: Date.now() }))
            : picked;
        next.textsByCategory = {
          ...(next.textsByCategory || {}),
          [activeCategoryId]: action === "move" ? rest : src,
          [targetCategoryId]: [...toInsert, ...dst],
        };
        return next;
      }

      const src = next.imagesByCategory?.[activeCategoryId] || [];
      const picked = src.filter((i) => ids.includes(i.id));
      const rest = src.filter((i) => !ids.includes(i.id));
      if (action === "delete") {
        next.imagesByCategory = { ...(next.imagesByCategory || {}), [activeCategoryId]: rest };
        return next;
      }
      const dst = next.imagesByCategory?.[targetCategoryId] || [];
      const toInsert =
        action === "copy"
          ? picked.map((i) => ({ ...i, id: uid("i"), createdAt: Date.now() }))
          : picked;
      next.imagesByCategory = {
        ...(next.imagesByCategory || {}),
        [activeCategoryId]: action === "move" ? rest : src,
        [targetCategoryId]: [...toInsert, ...dst],
      };
      return next;
    });

    clearSelection();
  };

  // ---------- Hashtags save ----------
  const saveHashtags = () => {
    if (!activeCategoryId) return;
    setData((prev) => ({
      ...prev,
      hashtagsByCategory: { ...(prev.hashtagsByCategory || {}), [activeCategoryId]: hashtagsDraft },
    }));
  };

  // ---------- Keyboard shortcuts + navigation ----------
  useEffect(() => {
    if (!activeCategoryId) return;

    const onKeyDown = (e) => {
      // لا نخربط وأنت تكتب داخل input/textarea/select
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || tag === "select";
      const isMeta = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + K: Toggle Quick mode (اختصار لطيف)
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickMode((v) => !v);
        return;
      }

      // Ctrl/Cmd + C: نسخ العنصر المحدد (ليس نسخ النص المحدد بالماوس)
      if (isMeta && e.key.toLowerCase() === "c") {
        if (isTyping) return; // خليه طبيعي داخل الكتابة
        e.preventDefault();
        const one = selectedTextIds.length === 1
          ? texts.find((t) => t.id === selectedTextIds[0])
          : texts[activeTextIndex];
        if (one) copyText(one);
        return;
      }

      // الأسهم للتنقل بين العناصر (عند عدم الكتابة)
      if (!isTyping && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        setActiveTextIndex((i) => {
          const n = texts.length;
          if (!n) return 0;
          const next = Math.max(0, Math.min(n - 1, i + dir));
          // تمرير داخل لوحة النصوص إلى العنصر
          window.requestAnimationFrame(() => {
            const el = document.querySelector(`[data-text-card="${texts[next]?.id}"]`);
            el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          });
          return next;
        });
        return;
      }

      // Enter: نسخ العنصر النشط (في Quick mode) عند عدم الكتابة
      if (!isTyping && e.key === "Enter" && quickMode) {
        e.preventDefault();
        const one = texts[activeTextIndex];
        if (one) copyText(one);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeCategoryId, texts, activeTextIndex, selectedTextIds, quickMode]);

  // ---------- Counts ----------
  const charCount = newText.length;
  const overLimit = charCount > xLimit;

  const textsCount = rawTexts.length;
  const imagesCount = rawImages.length;

  // ---------- ROUTE 1 ----------
  if (!activeCategoryId) {
    return (
      <div className="app">
        <header className={`topbar ${headerHidden ? "hideTopbar" : ""}`}>
          <div className="brand">
            <div className="logo"><Icon.Spark /></div>
            <div>
              <div className="title">مخزني الإبداعي</div>
              <div className="subtitle">مجموعات المحتوى</div>
            </div>
          </div>

          <div className="actions">
            <button className="btn" onClick={exportBackup} title="تصدير"><Icon.Download style={{ width: 18, height: 18 }} /></button>
            <button className="btn" onClick={triggerImport} title="استيراد"><Icon.Upload style={{ width: 18, height: 18 }} /></button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => importBackup(e.target.files?.[0])}
            />
          </div>
        </header>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="row">
            <input
              className="input"
              placeholder="إضافة مجموعة…"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <button className="btn primary" onClick={addCategory} title="إضافة">
              <Icon.Plus style={{ width: 18, height: 18 }} /> إضافة
            </button>
          </div>
        </div>

        <div className="grid">
          {data.categories.map((cat) => {
            const isEditing = editingCatId === cat.id;
            const tCount = (data.textsByCategory?.[cat.id] || []).length;
            const iCount = (data.imagesByCategory?.[cat.id] || []).length;

            return (
              <div key={cat.id} className="card">
                <div className="row space">
                  <div style={{ flex: 1 }}>
                    {!isEditing ? (
                      <>
                        <div className="cardTitle">{cat.name}</div>
                        <div className="meta">{tCount} نص • {iCount} صورة</div>
                      </>
                    ) : (
                      <div className="row">
                        <input
                          className="input"
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEditCategory()}
                        />
                        <button className="btn primary iconOnly" onClick={saveEditCategory} title="حفظ">
                          <Icon.Enter />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn primary iconOnly" onClick={() => setActiveCategoryId(cat.id)} title="دخول">
                      <Icon.Enter />
                    </button>

                    {!isEditing ? (
                      <>
                        <button className="btn iconOnly" onClick={() => startEditCategory(cat)} title="تعديل">
                          <Icon.Edit />
                        </button>
                        <button className="btn danger iconOnly" onClick={() => deleteCategory(cat.id)} title="حذف">
                          <Icon.Trash />
                        </button>
                      </>
                    ) : (
                      <button className="btn iconOnly" onClick={() => setEditingCatId(null)} title="إلغاء">✕</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="footer">Tip: صدّر نسخة احتياطية بين فترة وفترة.</div>
      </div>
    );
  }

  // ---------- ROUTE 2 ----------
  return (
    <div className="app">
      <header className={`topbar ${headerHidden ? "hideTopbar" : ""}`}>
        <div className="brand">
          <button className="btn" onClick={() => { setActiveCategoryId(null); setHeaderHidden(false); }} title="رجوع">←</button>
          <div>
            <div className="title">{activeCategory?.name}</div>
            <div className="subtitle">{textsCount} نص • {imagesCount} صورة</div>
          </div>
        </div>

        <div className="actions">
          <div className="pill">حد X: {xLimit}</div>

          {/* Quick mode */}
          <button
            className={`btn iconOnly ${quickMode ? "btnActive" : ""}`}
            onClick={() => setQuickMode((v) => !v)}
            title="Quick mode (Ctrl+K)"
          >
            <Icon.Bolt />
          </button>

          {/* Focus mode */}
          <button
            className={`btn iconOnly ${focusMode === "images" ? "btnActive" : ""}`}
            onClick={() => setFocusMode((m) => (m === "images" ? "both" : "images"))}
            title="تركيز الصور"
          >
            <Icon.FocusLeft />
          </button>
          <button
            className={`btn iconOnly ${focusMode === "texts" ? "btnActive" : ""}`}
            onClick={() => setFocusMode((m) => (m === "texts" ? "both" : "texts"))}
            title="تركيز النصوص"
          >
            <Icon.FocusRight />
          </button>

          <button className="btn" onClick={exportBackup} title="تصدير"><Icon.Download style={{ width: 18, height: 18 }} /></button>
          <button className="btn" onClick={triggerImport} title="استيراد"><Icon.Upload style={{ width: 18, height: 18 }} /></button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => importBackup(e.target.files?.[0])}
          />
        </div>
      </header>

      <div className="page">
        <div className={`twoCol ${focusMode === "texts" ? "focusTexts" : ""} ${focusMode === "images" ? "focusImages" : ""}`}>
          {/* LEFT: Images */}
          <section
            className={`card panelScroll ${viewImages === "compact" ? "compact" : ""} ${viewImages === "full" ? "imgFull" : ""} ${quickMode ? "quick" : ""}`}
            ref={imagesPanelRef}
            onScroll={onPanelScroll}
          >
            <div className="panelHeader">
              <div className="panelTitle"><Icon.Image style={{ width: 18, height: 18 }} /> الصور</div>

              <div className="panelTools">
                <select className="select" value={sortImages} onChange={(e) => setSortImages(e.target.value)} title="فرز">
                  <option value="lru">الأقدم استخدامًا</option>
                  <option value="newest">الأحدث إضافة</option>
                  <option value="oldest">الأقدم إضافة</option>
                  <option value="leastUsed">الأقل استخدامًا</option>
                  <option value="mostUsed">الأكثر استخدامًا</option>
                </select>

                <select className="select" value={viewImages} onChange={(e) => setViewImages(e.target.value)} title="عرض">
                  <option value="normal">عادي</option>
                  <option value="compact">مضغوط</option>
                  <option value="full">صورة أكبر</option>
                </select>
              </div>
            </div>

            {selectedImageIds.length > 0 && (
              <div className="bulkBar">
                <div className="bulkInfo">محدد: {selectedImageIds.length}</div>
                <select className="select" value={targetCategoryId} onChange={(e) => setTargetCategoryId(e.target.value)}>
                  <option value="">اختر مجموعة…</option>
                  {data.categories.filter((c) => c.id !== activeCategoryId).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button className="btn iconOnly" onClick={() => moveCopyDeleteSelected("image", "copy")} title="نسخ لمجموعة"><Icon.Copy /></button>
                <button className="btn iconOnly" onClick={() => moveCopyDeleteSelected("image", "move")} title="نقل لمجموعة"><Icon.Enter /></button>
                <button className="btn danger iconOnly" onClick={() => moveCopyDeleteSelected("image", "delete")} title="حذف"><Icon.Trash /></button>
                <button className="btn iconOnly" onClick={clearSelection} title="إلغاء">✕</button>
              </div>
            )}

            <div className="row">
              <input
                className="input"
                placeholder="رابط صورة…"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addImage()}
              />
              <button className="btn primary iconOnly" onClick={addImage} disabled={!newImageUrl.trim()} title="إضافة">
                <Icon.Plus />
              </button>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <input className="input" placeholder="بحث…" value={searchImage} onChange={(e) => setSearchImage(e.target.value)} />
              <div className="kbd"><Icon.Search style={{ width: 16, height: 16 }} /></div>
            </div>

            <div style={{ marginTop: 12 }}>
              {images.length === 0 ? (
                <div className="meta">—</div>
              ) : (
                <div className="vList">
                  {images.map((img) => {
                    const isSel = selectedImageIds.includes(img.id);
                    const removing = removingIds.has(`image:${img.id}`);
                    return (
                      <div key={img.id} className={`thumb ${isSel ? "selected" : ""} ${removing ? "removing" : ""}`}>
                        <div className="selectRow">
                          <label className="check">
                            <input type="checkbox" checked={isSel} onChange={() => toggleSelected("image", img.id)} />
                            <span />
                          </label>

                          <button className="btn iconOnly" onClick={() => pinImageToTop(img.id)} title="رفع للأعلى">
                            <Icon.ArrowUp />
                          </button>
                        </div>

                        <img className="thumbImg" src={img.url} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />

                        <div className="metaActionRow">
                          <div className="metaLine">
                            <span>آخر: {formatDate(img.lastUsedAt)}</span>
                            <span className="dot">•</span>
                            <span>مرات: {img.usedCount || 0}</span>
                          </div>

                          <div className="actionsMini">
                            <button className="btn iconOnly" onClick={() => markImageUsed(img.id, false)} title="تسجيل استخدام">
                              <Icon.Check />
                            </button>
                            <button className="btn danger iconOnly" onClick={() => deleteImage(img.id)} title="حذف">
                              <Icon.Trash />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: Texts */}
          <section
            className={`card panelScroll ${viewTexts === "compact" ? "compact" : ""} ${quickMode ? "quick" : ""}`}
            ref={textsPanelRef}
            onScroll={onPanelScroll}
          >
            <div className="panelHeader">
              <div className="panelTitle"><Icon.Text style={{ width: 18, height: 18 }} /> النصوص</div>

              <div className="panelTools">
                <select className="select" value={sortTexts} onChange={(e) => setSortTexts(e.target.value)} title="فرز">
                  <option value="lru">الأقدم استخدامًا</option>
                  <option value="newest">الأحدث إضافة</option>
                  <option value="oldest">الأقدم إضافة</option>
                  <option value="leastUsed">الأقل استخدامًا</option>
                  <option value="mostUsed">الأكثر استخدامًا</option>
                </select>

                <select className="select" value={viewTexts} onChange={(e) => setViewTexts(e.target.value)} title="عرض">
                  <option value="normal">عادي</option>
                  <option value="compact">مضغوط</option>
                </select>

                <button className="btn iconOnly" onClick={openBulk} title="إضافة دفعة">
                  <Icon.Plus />
                </button>
              </div>
            </div>

            {/* Hashtags */}
            <div className="row" style={{ marginBottom: 10 }}>
              <input
                className="input"
                placeholder="هاشتاقات المجموعة… مثال: #عُمان #صباح_الخير"
                value={hashtagsDraft}
                onChange={(e) => setHashtagsDraft(e.target.value)}
                onBlur={saveHashtags}
              />
              <button className="btn iconOnly" onClick={saveHashtags} title="حفظ الهاشتاقات">
                <Icon.Tag />
              </button>
            </div>

            {selectedTextIds.length > 0 && (
              <div className="bulkBar">
                <div className="bulkInfo">محدد: {selectedTextIds.length}</div>
                <select className="select" value={targetCategoryId} onChange={(e) => setTargetCategoryId(e.target.value)}>
                  <option value="">اختر مجموعة…</option>
                  {data.categories.filter((c) => c.id !== activeCategoryId).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button className="btn iconOnly" onClick={() => moveCopyDeleteSelected("text", "copy")} title="نسخ لمجموعة"><Icon.Copy /></button>
                <button className="btn iconOnly" onClick={() => moveCopyDeleteSelected("text", "move")} title="نقل لمجموعة"><Icon.Enter /></button>
                <button className="btn danger iconOnly" onClick={() => moveCopyDeleteSelected("text", "delete")} title="حذف"><Icon.Trash /></button>
                <button className="btn iconOnly" onClick={clearSelection} title="إلغاء">✕</button>
              </div>
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
                {charCount}/{xLimit}{overLimit ? ` (+${charCount - xLimit})` : ""}
              </div>
              <button className="btn primary" onClick={addText} disabled={!newText.trim()} title="إضافة">
                <Icon.Plus style={{ width: 18, height: 18 }} /> إضافة
              </button>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <input className="input" placeholder="بحث…" value={searchText} onChange={(e) => { setSearchText(e.target.value); setActiveTextIndex(0); }} />
              <div className="kbd"><Icon.Search style={{ width: 16, height: 16 }} /></div>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {texts.length === 0 ? (
                <div className="meta">—</div>
              ) : (
                texts.map((t, idx) => {
                  const isSel = selectedTextIds.includes(t.id);
                  const isDup = duplicateInfo.exactDupIds.has(t.id);
                  const isActive = idx === activeTextIndex;
                  const isCopied = lastCopied?.kind === "text" && lastCopied?.id === t.id && (Date.now() - lastCopied.ts) < 1500;
                  const removing = removingIds.has(`text:${t.id}`);

                  return (
                    <div
                      key={t.id}
                      data-text-card={t.id}
                      className={`card innerCard ${isSel ? "selected" : ""} ${isDup ? "dup" : ""} ${isActive ? "activeCard" : ""} ${isCopied ? "copiedFlash" : ""} ${removing ? "removing" : ""}`}
                      onMouseEnter={() => setActiveTextIndex(idx)}
                      onClick={() => {
                        // Quick mode: نقرة على البطاقة = نسخ سريع
                        if (quickMode) copyText(t);
                      }}
                    >
                      <div className="selectRow">
                        <label className="check">
                          <input type="checkbox" checked={isSel} onChange={() => toggleSelected("text", t.id)} />
                          <span />
                        </label>

                        <button className="btn iconOnly" onClick={() => pinTextToTop(t.id)} title="رفع للأعلى">
                          <Icon.ArrowUp />
                        </button>
                      </div>

                      {/* Tweet preview */}
                      <TweetPreview
                        text={t.text}
                        timeLabel={t.lastUsedAt ? formatDate(t.lastUsedAt) : "الآن"}
                        quick={quickMode}
                      />

                      <div className="metaActionRow">
                        <div className="metaLine">
                          <span>آخر: {formatDate(t.lastUsedAt)}</span>
                          <span className="dot">•</span>
                          <span>مرات: {t.usedCount || 0}</span>
                          <span className="dot">•</span>
                          <span>حروف: {t.text.length}</span>
                          {isDup ? (
                            <>
                              <span className="dot">•</span>
                              <span className="dupBadge">مكرر</span>
                            </>
                          ) : null}
                        </div>

                        <div className="actionsMini">
                          <button className="btn primary iconOnly" onClick={() => copyText(t)} title="نسخ">
                            <Icon.Copy />
                          </button>
                          <button className="btn iconOnly" onClick={() => copyTextWithHashtags(t)} title="نسخ مع هاشتاقات">
                            <Icon.Tag />
                          </button>
                          <button className="btn iconOnly" onClick={() => bumpTextUsage(t.id, true)} title="تسجيل استخدام + للأعلى">
                            <Icon.Check />
                          </button>
                          <button className="btn danger iconOnly" onClick={() => deleteText(t.id)} title="حذف">
                            <Icon.Trash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="footerHint">
              اختصارات: Ctrl+K (Quick) • Ctrl+C (نسخ العنصر النشط) • ↑↓ للتنقل • Quick: Enter للنسخ
            </div>
          </section>
        </div>
      </div>

      {/* Modal: bulk add */}
      {bulkOpen && (
        <div className="modalOverlay" onMouseDown={() => setBulkOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">إضافة نصوص دفعة واحدة</div>
              <button className="btn iconOnly" onClick={() => setBulkOpen(false)} title="إغلاق">✕</button>
            </div>

            <div className="meta" style={{ marginTop: 6 }}>
              ضع كل نص في سطر مستقل.
            </div>

            <textarea
              className="textarea"
              style={{ marginTop: 10, minHeight: 180 }}
              placeholder={"نص 1\nنص 2\nنص 3 ..."}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />

            <div className="row space" style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setBulkOpen(false)}>إلغاء</button>
              <button className="btn primary" onClick={applyBulk}>
                <Icon.Plus style={{ width: 18, height: 18 }} /> إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="footer">Quick • Tweet Preview • Hashtags • Animations ✅</div>
    </div>
  );
}
