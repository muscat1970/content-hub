import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const LS_KEY = "content-hub";
const AUTH_KEY = "content-hub-auth";
const APP_PASSWORD = "1234"; // ← غيّرها
const X_LIMIT_DEFAULT = 280;

// ---------- utils ----------
const uid = (p = "id") => `${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const safeParse = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };
const fmt = (ts) => ts ? new Date(ts).toLocaleString("ar", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace("،", " •") : "—";
const canon = (s) => (s || "").toLowerCase().replace(/[\u064B-\u0652\u0670\u0640]/g, "").replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();
const jaccard = (a, b) => {
  const A = new Set(canon(a).split(" ").filter(Boolean)), B = new Set(canon(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let i = 0; for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i);
};
const sortItems = (items, key) => {
  const a = [...items];
  const by = {
    newest: (x, y) => (y.createdAt ?? 0) - (x.createdAt ?? 0),
    oldest: (x, y) => (x.createdAt ?? 0) - (y.createdAt ?? 0),
    mostUsed: (x, y) => (y.usedCount ?? 0) - (x.usedCount ?? 0) || (y.lastUsedAt ?? 0) - (x.lastUsedAt ?? 0),
    leastUsed: (x, y) => (x.usedCount ?? 0) - (y.usedCount ?? 0) || (x.lastUsedAt ?? 0) - (y.lastUsedAt ?? 0),
    lru: (x, y) => (x.lastUsedAt ?? 0) - (y.lastUsedAt ?? 0),
  }[key] || ((x, y) => (x.lastUsedAt ?? 0) - (y.lastUsedAt ?? 0));
  return a.sort(by);
};
const copyToClipboard = async (text) => {
  if (!text) return;
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta);
  }
};

// ---------- Icons ----------
const I = {
  Spark: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8L12 2Z" stroke="currentColor" strokeWidth="1.8"/></svg>),
  Plus: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Enter: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M10 17l-4-5 4-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12h10a3 3 0 0 1 3 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 8V5a2 2 0 0 0-2-2H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Edit: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>),
  Trash: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>),
  Copy: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M8 8h11v11H8V8Z" stroke="currentColor" strokeWidth="1.8"/><path d="M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Image: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.8"/><path d="M21 16l-6-6-6 7-2-2-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Text: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 6h16M4 12h10M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Both: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 6h9M4 12h9M4 18h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.8"/><path d="M15 15l2-2 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Search: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.8"/><path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Download: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Upload: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 21V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 14l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 3h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Check: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  ArrowUp: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 19V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M7 11l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
};

// ---------- Tweet Preview ----------
const parseSegments = (t) => {
  const cleaned = (t || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
  const re = /(https?:\/\/[^\s]+)|(#(?:[\p{L}\p{M}\p{N}_]+))|(@(?:[\p{L}\p{M}\p{N}_]+))/gu;
  const out = []; let last = 0;
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
          {segs.map((s, i) => (
            s.k === "t" ? <span key={i}>{s.v}</span> :
            s.k === "l" ? <span key={i} className="tweetLink">{s.v}</span> :
            s.k === "h" ? <span key={i} className="tweetTag">{s.v}</span> :
            <span key={i} className="tweetMention">{s.v}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------- data ----------
const seedData = {
  version: 5,
  xLimit: X_LIMIT_DEFAULT,
  categories: [
    { id: "cat-morning", name: "تغريدات صباحية/مسائية" },
    { id: "cat-national", name: "محتوى وطني" },
    { id: "cat-quotes", name: "اقتباسات وحكم" },
    { id: "cat-misc", name: "محتوى منوع" },
  ],
  textsByCategory: { "cat-morning": [] },
  imagesByCategory: { "cat-morning": [] },
};
const normTexts = (m) => Object.fromEntries(Object.entries(m || {}).map(([k, arr]) => [k, (arr || []).map(t => ({
  id: t.id ?? uid("t"), text: t.text ?? "", createdAt: t.createdAt ?? Date.now(), lastUsedAt: t.lastUsedAt ?? null, usedCount: t.usedCount ?? 0,
}))]));
const normImgs = (m) => Object.fromEntries(Object.entries(m || {}).map(([k, arr]) => [k, (arr || []).map(i => ({
  id: i.id ?? uid("i"), url: i.url ?? "", createdAt: i.createdAt ?? Date.now(), lastUsedAt: i.lastUsedAt ?? null, usedCount: i.usedCount ?? 0,
}))]));
const migrate = (raw) => (raw && raw.textsByCategory && raw.imagesByCategory)
  ? { version: 5, xLimit: raw.xLimit ?? X_LIMIT_DEFAULT, categories: raw.categories ?? seedData.categories, textsByCategory: normTexts(raw.textsByCategory), imagesByCategory: normImgs(raw.imagesByCategory) }
  : seedData;

// ---------- UI bits ----------
const IconToggle = ({ active, title, onClick, children }) => (
  <button className={`iconBtn ${active ? "active" : ""}`} onClick={onClick} title={title} type="button">
    {children}
  </button>
);

export default function App() {
  // auth (حاجز بسيط)
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === "1");
  const [pass, setPass] = useState("");
  const [passErr, setPassErr] = useState("");

  // data
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? migrate(safeParse(saved, null)) : seedData;
  });
  useEffect(() => localStorage.setItem(LS_KEY, JSON.stringify(data)), [data]);

  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");

  const [newText, setNewText] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchImage, setSearchImage] = useState("");
  const [sortTexts, setSortTexts] = useState("lru");
  const [sortImages, setSortImages] = useState("lru");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const [selectedTextIds, setSelectedTextIds] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [targetCategoryId, setTargetCategoryId] = useState("");

  const [lastCopied, setLastCopied] = useState(null);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [activeTextIndex, setActiveTextIndex] = useState(0);

  const importRef = useRef(null);

  // عرض: نص/صور/كلاهما (أيقونات أعلى المجموعة)
  const [showMode, setShowMode] = useState("both"); // texts | images | both

  const xLimit = data.xLimit ?? X_LIMIT_DEFAULT;
  const activeCategory = useMemo(() => data.categories.find(c => c.id === activeCategoryId) || null, [data.categories, activeCategoryId]);
  const rawTexts = useMemo(() => activeCategoryId ? (data.textsByCategory?.[activeCategoryId] || []) : [], [data.textsByCategory, activeCategoryId]);
  const rawImages = useMemo(() => activeCategoryId ? (data.imagesByCategory?.[activeCategoryId] || []) : [], [data.imagesByCategory, activeCategoryId]);

  const duplicateIds = useMemo(() => {
    const m = new Map(); for (const t of rawTexts) { const c = canon(t.text); if (!m.has(c)) m.set(c, []); m.get(c).push(t.id); }
    const s = new Set(); for (const ids of m.values()) if (ids.length > 1) ids.forEach(id => s.add(id));
    return s;
  }, [rawTexts]);

  const texts = useMemo(() => sortItems(rawTexts.filter(t => (t.text || "").toLowerCase().includes(searchText.trim().toLowerCase())), sortTexts), [rawTexts, searchText, sortTexts]);
  const images = useMemo(() => sortItems(rawImages.filter(i => (i.url || "").toLowerCase().includes(searchImage.trim().toLowerCase())), sortImages), [rawImages, searchImage, sortImages]);

  // ---------- auth screen ----------
  const login = () => {
    if (pass === APP_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
      setPass(""); setPassErr("");
    } else setPassErr("كلمة المرور غير صحيحة");
  };
  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setActiveCategoryId(null);
  };

  // ---------- backup ----------
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ ...data, version: 5 }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `content-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  };
  const importBackup = async (file) => {
    if (!file) return;
    const raw = safeParse(await file.text(), null);
    const migrated = migrate(raw);
    if (!confirm("استبدال البيانات الحالية بالنسخة المستوردة؟")) return;
    setData(migrated);
    setActiveCategoryId(null);
    setSearchText(""); setSearchImage("");
    setSelectedTextIds([]); setSelectedImageIds([]);
    setLastCopied(null);
  };

  // ---------- categories ----------
  const addCategory = () => {
    const name = newCatName.trim(); if (!name) return;
    const c = { id: uid("cat"), name };
    setData(p => ({
      ...p,
      categories: [c, ...p.categories],
      textsByCategory: { ...(p.textsByCategory || {}), [c.id]: [] },
      imagesByCategory: { ...(p.imagesByCategory || {}), [c.id]: [] },
    }));
    setNewCatName("");
  };
  const saveEditCategory = () => {
    const name = editingCatName.trim(); if (!editingCatId || !name) return;
    setData(p => ({ ...p, categories: p.categories.map(c => c.id === editingCatId ? { ...c, name } : c) }));
    setEditingCatId(null); setEditingCatName("");
  };
  const deleteCategory = (id) => {
    const cat = data.categories.find(c => c.id === id);
    if (!confirm(`حذف "${cat?.name ?? ""}"؟`)) return;
    setData(p => {
      const categories = p.categories.filter(c => c.id !== id);
      const textsByCategory = { ...(p.textsByCategory || {}) }; delete textsByCategory[id];
      const imagesByCategory = { ...(p.imagesByCategory || {}) }; delete imagesByCategory[id];
      return { ...p, categories, textsByCategory, imagesByCategory };
    });
    if (activeCategoryId === id) setActiveCategoryId(null);
  };

  // ---------- helpers ----------
  const softDelete = (kind, id, fn) => {
    setRemovingIds(s => new Set(s).add(`${kind}:${id}`));
    setTimeout(() => {
      fn();
      setRemovingIds(s => { const n = new Set(s); n.delete(`${kind}:${id}`); return n; });
    }, 160);
  };

  // ---------- texts ----------
  const addTextOne = (txt) => {
    const text = (txt || "").trim();
    if (!activeCategoryId || !text) return false;

    const cNew = canon(text);
    const exact = rawTexts.some(t => canon(t.text) === cNew);
    const near = rawTexts.slice(0, 40).some(t => jaccard(t.text, text) >= 0.9);

    if ((exact || near) && !confirm("هناك نص مشابه/مكرر. هل تريد الإضافة على أي حال؟")) return false;

    const item = { id: uid("t"), text, createdAt: Date.now(), lastUsedAt: null, usedCount: 0 };
    setData(p => {
      const cur = p.textsByCategory?.[activeCategoryId] || [];
      return { ...p, textsByCategory: { ...(p.textsByCategory || {}), [activeCategoryId]: [item, ...cur] } };
    });
    return true;
  };
  const addText = () => { if (addTextOne(newText)) setNewText(""); };

  const bumpTextUsage = (id, toTop) => {
    const now = Date.now();
    setData(p => {
      const cur = p.textsByCategory?.[activeCategoryId] || [];
      const upd = cur.map(t => t.id === id ? { ...t, lastUsedAt: now, usedCount: (t.usedCount || 0) + 1 } : t);
      const picked = upd.find(t => t.id === id), rest = upd.filter(t => t.id !== id);
      return { ...p, textsByCategory: { ...(p.textsByCategory || {}), [activeCategoryId]: picked ? (toTop ? [picked, ...rest] : [...rest, picked]) : upd } };
    });
  };
  const pinTextToTop = (id) => setData(p => {
    const cur = p.textsByCategory?.[activeCategoryId] || [];
    const picked = cur.find(t => t.id === id); if (!picked) return p;
    return { ...p, textsByCategory: { ...(p.textsByCategory || {}), [activeCategoryId]: [picked, ...cur.filter(t => t.id !== id)] } };
  });
  const deleteText = (id) => {
    if (!confirm("حذف النص؟")) return;
    softDelete("text", id, () => {
      setData(p => {
        const cur = p.textsByCategory?.[activeCategoryId] || [];
        return { ...p, textsByCategory: { ...(p.textsByCategory || {}), [activeCategoryId]: cur.filter(t => t.id !== id) } };
      });
      setSelectedTextIds(s => s.filter(x => x !== id));
    });
  };
  const copyText = async (item) => {
    await copyToClipboard(item.text);
    setLastCopied({ kind: "text", id: item.id, ts: Date.now() });
    bumpTextUsage(item.id, false);
  };

  // bulk add
  const applyBulk = () => {
    const lines = bulkText.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    if (!lines.length) return;
    let added = 0; for (const l of lines) if (addTextOne(l)) added++;
    setBulkOpen(false); setBulkText("");
    alert(`تمت إضافة ${added} نص`);
  };

  // ---------- images ----------
  const addImage = () => {
    if (!activeCategoryId) return;
    const url = newImageUrl.trim(); if (!url) return;
    const item = { id: uid("i"), url, createdAt: Date.now(), lastUsedAt: null, usedCount: 0 };
    setData(p => {
      const cur = p.imagesByCategory?.[activeCategoryId] || [];
      return { ...p, imagesByCategory: { ...(p.imagesByCategory || {}), [activeCategoryId]: [item, ...cur] } };
    });
    setNewImageUrl("");
  };
  const pinImageToTop = (id) => setData(p => {
    const cur = p.imagesByCategory?.[activeCategoryId] || [];
    const picked = cur.find(i => i.id === id); if (!picked) return p;
    return { ...p, imagesByCategory: { ...(p.imagesByCategory || {}), [activeCategoryId]: [picked, ...cur.filter(i => i.id !== id)] } };
  });
  const markImageUsed = (id, toTop) => {
    const now = Date.now();
    setData(p => {
      const cur = p.imagesByCategory?.[activeCategoryId] || [];
      const upd = cur.map(i => i.id === id ? { ...i, lastUsedAt: now, usedCount: (i.usedCount || 0) + 1 } : i);
      const picked = upd.find(i => i.id === id), rest = upd.filter(i => i.id !== id);
      return { ...p, imagesByCategory: { ...(p.imagesByCategory || {}), [activeCategoryId]: picked ? (toTop ? [picked, ...rest] : [...rest, picked]) : upd } };
    });
  };
  const deleteImage = (id) => {
    if (!confirm("حذف الصورة؟")) return;
    softDelete("image", id, () => {
      setData(p => {
        const cur = p.imagesByCategory?.[activeCategoryId] || [];
        return { ...p, imagesByCategory: { ...(p.imagesByCategory || {}), [activeCategoryId]: cur.filter(i => i.id !== id) } };
      });
      setSelectedImageIds(s => s.filter(x => x !== id));
    });
  };

  // ---------- selection ----------
  const toggleSel = (kind, id) => kind === "text"
    ? setSelectedTextIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
    : setSelectedImageIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const clearSelection = () => { setSelectedTextIds([]); setSelectedImageIds([]); setTargetCategoryId(""); };

  const moveCopyDeleteSelected = (kind, action) => {
    if (!activeCategoryId) return;
    const ids = kind === "text" ? selectedTextIds : selectedImageIds;
    if (!ids.length) return;

    if (action !== "delete" && !targetCategoryId) return alert("اختر المجموعة الهدف أولاً");
    if (action === "delete" && !confirm("حذف العناصر المحددة؟")) return;

    setData(p => {
      const next = { ...p };
      if (kind === "text") {
        const src = next.textsByCategory?.[activeCategoryId] || [];
        const picked = src.filter(t => ids.includes(t.id));
        const rest = src.filter(t => !ids.includes(t.id));
        if (action === "delete") { next.textsByCategory = { ...(next.textsByCategory || {}), [activeCategoryId]: rest }; return next; }
        const dst = next.textsByCategory?.[targetCategoryId] || [];
        const ins = action === "copy" ? picked.map(t => ({ ...t, id: uid("t"), createdAt: Date.now() })) : picked;
        next.textsByCategory = { ...(next.textsByCategory || {}), [activeCategoryId]: action === "move" ? rest : src, [targetCategoryId]: [...ins, ...dst] };
        return next;
      } else {
        const src = next.imagesByCategory?.[activeCategoryId] || [];
        const picked = src.filter(i => ids.includes(i.id));
        const rest = src.filter(i => !ids.includes(i.id));
        if (action === "delete") { next.imagesByCategory = { ...(next.imagesByCategory || {}), [activeCategoryId]: rest }; return next; }
        const dst = next.imagesByCategory?.[targetCategoryId] || [];
        const ins = action === "copy" ? picked.map(i => ({ ...i, id: uid("i"), createdAt: Date.now() })) : picked;
        next.imagesByCategory = { ...(next.imagesByCategory || {}), [activeCategoryId]: action === "move" ? rest : src, [targetCategoryId]: [...ins, ...dst] };
        return next;
      }
    });
    clearSelection();
  };

  // ---------- shortcuts (Enter/Shift+Enter محفوظ) ----------
  useEffect(() => {
    if (!activeCategoryId) return;
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select";
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "c" && !typing) {
        e.preventDefault();
        const one = selectedTextIds.length === 1 ? texts.find(t => t.id === selectedTextIds[0]) : texts[activeTextIndex];
        if (one) copyText(one);
      }

      if (!typing && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        setActiveTextIndex(i => Math.max(0, Math.min((texts.length || 1) - 1, i + dir)));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeCategoryId, texts, activeTextIndex, selectedTextIds]);

  // ---------- login UI ----------
  if (!authed) {
    return (
      <div className="authWrap">
        <div className="authCard">
          <div className="authBrand">
            <div className="logo"><I.Spark /></div>
            <div>
              <div className="title">مخزني الإبداعي</div>
              <div className="subtitle">أدخل كلمة المرور للمتابعة</div>
            </div>
          </div>

          <input
            className="input authInput"
            placeholder="كلمة المرور"
            type="password"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setPassErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && login()}
            autoFocus
          />

          {passErr && <div className="error">{passErr}</div>}

          <button className="btn primary wide" onClick={login}>
            دخول <span className="spacer" />
            <I.Enter style={{ width: 18, height: 18 }} />
          </button>

          <div className="hint">ملاحظة: هذه حماية شكلية وليست أمانًا حقيقيًا على GitHub Pages.</div>
        </div>
      </div>
    );
  }

  // ---------- common ----------
  const charCount = newText.length, overLimit = charCount > xLimit;
  const openImport = () => importRef.current?.click();

  // ---------- route 1: categories ----------
  if (!activeCategoryId) {
    return (
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <div className="logo"><I.Spark /></div>
            <div>
              <div className="title">مخزني الإبداعي</div>
              <div className="subtitle">مجموعات المحتوى</div>
            </div>
          </div>

          <div className="actions">
            <button className="btn" onClick={exportBackup} title="تصدير"><I.Download style={{ width: 18, height: 18 }} /></button>
            <button className="btn" onClick={openImport} title="استيراد"><I.Upload style={{ width: 18, height: 18 }} /></button>
            <button className="btn danger" onClick={logout} title="خروج">خروج</button>
            <input ref={importRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => importBackup(e.target.files?.[0])} />
          </div>
        </header>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="row">
            <input className="input" placeholder="إضافة مجموعة…" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
            <button className="btn primary" onClick={addCategory}><I.Plus style={{ width: 18, height: 18 }} /> إضافة</button>
          </div>
        </div>

        <div className="grid">
          {data.categories.map((cat) => {
            const isEditing = editingCatId === cat.id;
            const tCount = (data.textsByCategory?.[cat.id] || []).length;
            const iCount = (data.imagesByCategory?.[cat.id] || []).length;

            return (
              <div key={cat.id} className="card catCard">
                <div className="row space">
                  <div style={{ flex: 1 }}>
                    {!isEditing ? (
                      <>
                        <div className="cardTitle">{cat.name}</div>
                        <div className="meta">{tCount} نص • {iCount} صورة</div>
                      </>
                    ) : (
                      <div className="row">
                        <input className="input" value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEditCategory()} />
                        <button className="btn primary iconOnly" onClick={saveEditCategory} title="حفظ"><I.Enter /></button>
                      </div>
                    )}
                  </div>

                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn primary iconOnly" onClick={() => setActiveCategoryId(cat.id)} title="دخول"><I.Enter /></button>
                    {!isEditing ? (
                      <>
                        <button className="btn iconOnly" onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} title="تعديل"><I.Edit /></button>
                        <button className="btn danger iconOnly" onClick={() => deleteCategory(cat.id)} title="حذف"><I.Trash /></button>
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

        <div className="footer">اختصارات داخل المجموعة: Ctrl+C للنسخ • ↑↓ للتنقل</div>
      </div>
    );
  }

  // ---------- route 2: category page ----------
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <button className="btn" onClick={() => setActiveCategoryId(null)} title="رجوع">←</button>
          <div>
            <div className="title">{activeCategory?.name}</div>
            <div className="subtitle">{rawTexts.length} نص • {rawImages.length} صورة</div>
          </div>
        </div>

        <div className="actions">
          {/* 3 أيقونات العرض */}
          <div className="seg">
            <IconToggle active={showMode === "texts"} title="إظهار النص فقط" onClick={() => setShowMode("texts")}><I.Text style={{ width: 18, height: 18 }} /></IconToggle>
            <IconToggle active={showMode === "images"} title="إظهار الصور فقط" onClick={() => setShowMode("images")}><I.Image style={{ width: 18, height: 18 }} /></IconToggle>
            <IconToggle active={showMode === "both"} title="إظهار الاثنين" onClick={() => setShowMode("both")}><I.Both style={{ width: 18, height: 18 }} /></IconToggle>
          </div>

          <div className="pill">حد X: {xLimit}</div>
          <button className="btn" onClick={exportBackup} title="تصدير"><I.Download style={{ width: 18, height: 18 }} /></button>
          <button className="btn" onClick={openImport} title="استيراد"><I.Upload style={{ width: 18, height: 18 }} /></button>
          <button className="btn danger" onClick={logout} title="خروج">خروج</button>
          <input ref={importRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => importBackup(e.target.files?.[0])} />
        </div>
      </header>

      <div className={`page ${showMode !== "both" ? "single" : ""}`}>
        {/* Images */}
        {showMode !== "texts" && (
          <section className="card panel">
            <div className="panelHeader">
              <div className="panelTitle"><I.Image style={{ width: 18, height: 18 }} /> الصور</div>
              <div className="panelTools">
                <select className="select" value={sortImages} onChange={(e) => setSortImages(e.target.value)} title="فرز">
                  <option value="lru">الأقدم استخدامًا</option><option value="newest">الأحدث إضافة</option><option value="oldest">الأقدم إضافة</option>
                  <option value="leastUsed">الأقل استخدامًا</option><option value="mostUsed">الأكثر استخدامًا</option>
                </select>
              </div>
            </div>

            {selectedImageIds.length > 0 && (
              <div className="bulkBar">
                <div className="bulkInfo">محدد: {selectedImageIds.length}</div>
                <select className="select" value={targetCategoryId} onChange={(e) => setTargetCategoryId(e.target.value)}>
                  <option value="">اختر مجموعة…</option>
                  {data.categories.filter(c => c.id !== activeCategoryId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn iconOnly" onClick={() => moveCopyDeleteSelected("image", "copy")} title="نسخ"><I.Copy /></button>
                <button className="btn iconOnly" onClick={() => moveCopyDeleteSelected("image", "move")} title="نقل"><I.Enter /></button>
                <button className="btn danger iconOnly" onClick={() => moveCopyDeleteSelected("image", "delete")} title="حذف"><I.Trash /></button>
                <button className="btn iconOnly" onClick={clearSelection} title="إلغاء">✕</button>
              </div>
            )}

            <div className="row">
              <input className="input" placeholder="رابط صورة…" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addImage()} />
              <button className="btn primary iconOnly" onClick={addImage} disabled={!newImageUrl.trim()} title="إضافة"><I.Plus /></button>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <input className="input" placeholder="بحث…" value={searchImage} onChange={(e) => setSearchImage(e.target.value)} />
              <div className="kbd"><I.Search style={{ width: 16, height: 16 }} /></div>
            </div>

            <div className="vList" style={{ marginTop: 12 }}>
              {images.length === 0 ? <div className="meta">—</div> : images.map((img) => {
                const isSel = selectedImageIds.includes(img.id);
                const removing = removingIds.has(`image:${img.id}`);
                return (
                  <div key={img.id} className={`thumb ${isSel ? "selected" : ""} ${removing ? "removing" : ""}`}>
                    <div className="selectRow">
                      <label className="check"><input type="checkbox" checked={isSel} onChange={() => toggleSel("image", img.id)} /><span /></label>
                      <button className="btn iconOnly" onClick={() => pinImageToTop(img.id)} title="رفع للأعلى"><I.ArrowUp /></button>
                    </div>

                    <img className="thumbImg" src={img.url} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />

                    <div className="metaActionRow">
                      <div className="metaLine">
                        <span>آخر: {fmt(img.lastUsedAt)}</span><span className="dot">•</span><span>مرات: {img.usedCount || 0}</span>
                      </div>
                      <div className="actionsMini">
                        <button className="btn iconOnly" onClick={() => markImageUsed(img.id, false)} title="تسجيل استخدام"><I.Check /></button>
                        <button className="btn danger iconOnly" onClick={() => deleteImage(img.id)} title="حذف"><I.Trash /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Texts */}
        {showMode !== "images" && (
          <section className="card panel">
            <div className="panelHeader">
              <div className="panelTitle"><I.Text style={{ width: 18, height: 18 }} /> النصوص</div>
              <div className="panelTools">
                <select className="select" value={sortTexts} onChange={(e) => setSortTexts(e.target.value)} title="فرز">
                  <option value="lru">الأقدم استخدامًا</option><option value="newest">الأحدث إضافة</option><option value="oldest">الأقدم إضافة</option>
                  <option value="leastUsed">الأقل استخدامًا</option><option value="mostUsed">الأكثر استخدامًا</option>
                </select>
                <button className="btn iconOnly" onClick={() => { setBulkText(""); setBulkOpen(true); }} title="إضافة دفعة"><I.Plus /></button>
              </div>
            </div>

            {selectedTextIds.length > 0 && (
              <div className="bulkBar">
                <div className="bulkInfo">محدد: {selectedTextIds.length}</div>
                <select className="select" value={targetCategoryId} onChange={(e) => setTargetCategoryId(e.target.value)}>
                  <option value="">اختر مجموعة…</option>
                  {data.categories.filter(c => c.id !== activeCategoryId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn iconOnly" onClick={() => moveCopyDeleteSelected("text", "copy")} title="نسخ"><I.Copy /></button>
                <button className="btn iconOnly" onClick={() => moveCopyDeleteSelected("text", "move")} title="نقل"><I.Enter /></button>
                <button className="btn danger iconOnly" onClick={() => moveCopyDeleteSelected("text", "delete")} title="حذف"><I.Trash /></button>
                <button className="btn iconOnly" onClick={clearSelection} title="إلغاء">✕</button>
              </div>
            )}

            <textarea
              className="textarea"
              placeholder="اكتب نص… (Enter للإضافة • Shift+Enter لسطر جديد)"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addText(); } }}
            />

            <div className="row space" style={{ marginTop: 10 }}>
              <div className={`counter ${overLimit ? "over" : ""}`}>{charCount}/{xLimit}{overLimit ? ` (+${charCount - xLimit})` : ""}</div>
              <button className="btn primary" onClick={addText} disabled={!newText.trim()}><I.Plus style={{ width: 18, height: 18 }} /> إضافة</button>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <input className="input" placeholder="بحث…" value={searchText} onChange={(e) => { setSearchText(e.target.value); setActiveTextIndex(0); }} />
              <div className="kbd"><I.Search style={{ width: 16, height: 16 }} /></div>
            </div>

            <div className="tList" style={{ marginTop: 12 }}>
              {texts.length === 0 ? <div className="meta">—</div> : texts.map((t, idx) => {
                const isSel = selectedTextIds.includes(t.id);
                const isDup = duplicateIds.has(t.id);
                const isActive = idx === activeTextIndex;
                const isCopied = lastCopied?.kind === "text" && lastCopied?.id === t.id && (Date.now() - lastCopied.ts) < 1200;
                const removing = removingIds.has(`text:${t.id}`);

                return (
                  <div
                    key={t.id}
                    className={`card innerCard ${isSel ? "selected" : ""} ${isDup ? "dup" : ""} ${isActive ? "activeCard" : ""} ${isCopied ? "copiedFlash" : ""} ${removing ? "removing" : ""}`}
                    onMouseEnter={() => setActiveTextIndex(idx)}
                  >
                    <div className="selectRow">
                      <label className="check"><input type="checkbox" checked={isSel} onChange={() => toggleSel("text", t.id)} /><span /></label>
                      <button className="btn iconOnly" onClick={() => pinTextToTop(t.id)} title="رفع للأعلى"><I.ArrowUp /></button>
                    </div>

                    <TweetPreview text={t.text} timeLabel={t.lastUsedAt ? fmt(t.lastUsedAt) : "الآن"} />

                    <div className="metaActionRow">
                      <div className="metaLine">
                        <span>آخر: {fmt(t.lastUsedAt)}</span><span className="dot">•</span><span>مرات: {t.usedCount || 0}</span><span className="dot">•</span><span>حروف: {t.text.length}</span>
                        {isDup && (<><span className="dot">•</span><span className="dupBadge">مكرر</span></>)}
                      </div>
                      <div className="actionsMini">
                        <button className="btn primary iconOnly" onClick={() => copyText(t)} title="نسخ"><I.Copy /></button>
                        <button className="btn iconOnly" onClick={() => bumpTextUsage(t.id, true)} title="تسجيل استخدام + للأعلى"><I.Check /></button>
                        <button className="btn danger iconOnly" onClick={() => deleteText(t.id)} title="حذف"><I.Trash /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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
              <button className="btn iconOnly" onClick={() => setBulkOpen(false)} title="إغلاق">✕</button>
            </div>
            <div className="meta" style={{ marginTop: 6 }}>ضع كل نص في سطر مستقل.</div>
            <textarea className="textarea" style={{ marginTop: 10, minHeight: 180 }} placeholder={"نص 1\nنص 2\nنص 3 ..."} value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
            <div className="row space" style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setBulkOpen(false)}>إلغاء</button>
              <button className="btn primary" onClick={applyBulk}><I.Plus style={{ width: 18, height: 18 }} /> إضافة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
