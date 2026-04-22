import { useState, useMemo, createContext, useContext } from "react";
import html2canvas from 'html2canvas';

const TODAY = new Date(2026, 3, 22);
const UNITS = ["м³", "м²", "т", "шт"];

const THEMES = {
  light: {
    bg: "#f3f4f6", panel: "#ffffff", border: "#d1d5db",
    accent: "#d97706", accentDim: "#a06c10", accentLight: "#b45309",
    text: "#111827", muted: "#4b5563", good: "#16a34a", proj: "#2563eb",
    rateBg: "#f9fafb", gradBg: "#fffbeb", isDark: false
  },
  dark: {
    bg: "#111110", panel: "#1c1c1a", border: "#2e2e28",
    accent: "#e09418", accentDim: "#fcd34d", accentLight: "#f0b040",
    text: "#ede8d8", muted: "#787060", good: "#5aab5a", proj: "#4898d8",
    rateBg: "#18180e", gradBg: "#1e1a0e", isDark: true
  }
};

const ThemeContext = createContext(THEMES.light);

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  const setValue = value => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
}

function addDays(date, days) {
  const d = new Date(date); d.setDate(d.getDate() + Math.round(days)); return d;
}
function fmt(d) {
  if (!d) return "—";
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtMonth(d) {
  return d.toLocaleDateString("uk-UA", { month: "short", year: "2-digit" });
}

function NumField({ label, value, onChange, unit, min = 0, step = 1 }) {
  const C = useContext(ThemeContext);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 5 }}>{label}</label>
      <div style={{ display: "flex", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
        <input type="number" value={value} min={min} step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontFamily: "'DM Mono',monospace", fontSize: 19, padding: "9px 12px", width: 0 }}
        />
        {unit && <span style={{ padding: "0 12px", color: C.muted, fontSize: 14, fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "center", borderLeft: `1px solid ${C.border}` }}>{unit}</span>}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  const C = useContext(ThemeContext);
  return (
    <button onClick={onClick} style={{ padding: "5px 13px", borderRadius: 3, cursor: "pointer", transition: "all .15s", border: `1px solid ${active ? C.accent : C.border}`, background: active ? C.accentDim + "33" : "transparent", color: active ? C.accentLight : C.muted, fontFamily: "'DM Mono',monospace", fontSize: 14 }}>
      {children}
    </button>
  );
}

function StatCard({ label, value, sub, small }) {
  const C = useContext(ThemeContext);
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: "12px 14px", height: "100%", boxSizing: "border-box" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: small ? 15 : 20, color: C.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function GanttChart({ works, calculations, activeWorkId }) {
  const C = useContext(ThemeContext);
  let minDate = TODAY;
  let maxDate = addDays(TODAY, 90);
  let hasValid = false;

  works.forEach(w => {
    const c = calculations[w.id];
    if (c.startDate) {
      if (!hasValid || c.startDate < minDate) minDate = new Date(c.startDate);
      hasValid = true;
    }
    if (c.endDate) {
      if (c.endDate > maxDate) maxDate = new Date(c.endDate);
    }
  });

  if (!hasValid) return <div style={{ color: C.muted, textAlign: "center", padding: 40 }}>Недостатньо даних</div>;

  const totalMs = maxDate - minDate;
  if (totalMs <= 0) return <div style={{ color: C.muted, textAlign: "center", padding: 40 }}>Некоректний період</div>;

  const ticks = [];
  const cur = new Date(minDate);
  cur.setDate(1); // align to start of month

  while (cur <= maxDate) {
    const pct1 = ((cur - minDate) / totalMs) * 100;
    if (pct1 >= 0 && pct1 <= 100) {
      ticks.push({ pct: pct1, label: fmtMonth(cur), isMonth: true });
    }

    const mid = new Date(cur);
    mid.setDate(15);
    const pct15 = ((mid - minDate) / totalMs) * 100;
    if (pct15 >= 0 && pct15 <= 100) {
      ticks.push({ pct: pct15, label: "15", isMonth: false });
    }

    cur.setMonth(cur.getMonth() + 1);
  }

  const todayGlobalPct = ((TODAY - minDate) / totalMs) * 100;

  return (
    <div style={{ padding: "4px 0 8px" }}>
      <div style={{ position: "relative", height: 26, marginBottom: 10, borderBottom: `1px solid ${C.border}` }}>
        {ticks.map((t, i) => (
          <div key={i} style={{ position: "absolute", left: `${t.pct}%`, fontSize: 12, color: t.isMonth ? C.text : C.muted, transform: "translateX(-50%)", whiteSpace: "nowrap", bottom: 4, fontWeight: t.isMonth ? 600 : 400 }}>
            {t.label}
          </div>
        ))}
        {todayGlobalPct >= 0 && todayGlobalPct <= 100 && (
          <div style={{ position: "absolute", left: `${todayGlobalPct}%`, bottom: 0, width: 2, height: 6, background: "#e05050" }} />
        )}
      </div>

      <div style={{ position: "relative", paddingBottom: 10 }}>
        {/* Grid Lines */}
        {ticks.map((t, i) => (
          <div key={`grid-${i}`} style={{ position: "absolute", left: `${t.pct}%`, top: 0, bottom: 0, width: 1, background: t.isMonth ? C.border : C.border + "33", zIndex: 0, pointerEvents: "none" }} />
        ))}
        {/* Today Line */}
        {todayGlobalPct >= 0 && todayGlobalPct <= 100 && (
          <div style={{ position: "absolute", left: `${todayGlobalPct}%`, top: 0, bottom: 0, width: 1, background: "#e05050", opacity: .5, zIndex: 0, pointerEvents: "none" }} />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 1 }}>
          {works.map(work => {
            const c = calculations[work.id];
            if (!c.startDate || !c.endDate || c.startDate >= c.endDate) return null;

            const workStartPct = ((c.startDate - minDate) / totalMs) * 100;
            const workEndPct = ((c.endDate - minDate) / totalMs) * 100;
            const workWidth = workEndPct - workStartPct;

            const workTotalMs = c.endDate - c.startDate;
            let todayPctWithinWork = 0;
            if (workTotalMs > 0) {
              const todayMs = Math.max(0, TODAY - c.startDate);
              todayPctWithinWork = (todayMs / workTotalMs) * 100;
              if (todayPctWithinWork < 0) todayPctWithinWork = 0;
              if (todayPctWithinWork > 100) todayPctWithinWork = 100;
            }

            const showDone = work.doneVol > 0;
            const isActive = activeWorkId === work.id;

            return (
              <div key={work.id} style={{ opacity: (activeWorkId && activeWorkId !== 'main' && !isActive) ? 0.6 : 1, transition: "opacity .2s", paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 15, color: isActive ? C.accentLight : C.text, fontWeight: isActive ? 700 : 500, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ background: C.panel, padding: "0 4px", borderRadius: 3, margin: "0 -4px" }}>{work.workName} <span style={{ color: C.muted, fontWeight: 600 }}>({work.totalVol} {work.unit})</span></span>
                  <span style={{ color: C.muted, fontSize: 14, fontWeight: 600, background: C.panel, padding: "0 4px", borderRadius: 3, margin: "0 -4px" }}>{fmt(c.startDate)} – {fmt(c.endDate)}</span>
                </div>
                <div style={{ position: "relative", height: 20, background: C.border + "44", borderRadius: 4 }}>
                  <div style={{ position: "absolute", left: `${workStartPct}%`, width: `${workWidth}%`, height: "100%", background: `linear-gradient(90deg,${C.accent}55,${C.accent}88)`, borderRadius: 4, overflow: "hidden", boxShadow: isActive ? `0 0 0 1px ${C.accent}` : "none" }}>
                    {showDone && (
                      <div style={{ width: `${todayPctWithinWork}%`, height: "100%", background: `linear-gradient(90deg,${C.good}80,${C.good}bb)` }} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10, fontSize: 13, color: C.muted }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 14, height: 10, background: C.good + "bb", borderRadius: 2 }} /> Виконано</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 14, height: 10, background: C.accent + "88", borderRadius: 2 }} /> Залишок / План</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 2, height: 14, background: "#e05050" }} /> Сьогодні ({fmt(TODAY)})</div>
      </div>
    </div>
  );
}

function calculateWork(work) {
  const { totalVol, doneVol, mode, weeksWorked, manualRate, brigades, plannedStartDate } = work;
  const remaining = Math.max(0, totalVol - doneVol);
  const ratePerWeek = mode === "history"
    ? (weeksWorked > 0 ? doneVol / weeksWorked : 0)
    : manualRate * brigades;

  const weeksLeft = ratePerWeek > 0 ? remaining / ratePerWeek : null;

  let baseDate = TODAY;
  if (doneVol === 0 && plannedStartDate) {
    baseDate = new Date(plannedStartDate);
  }

  const endDate = weeksLeft !== null ? addDays(baseDate, Math.round(weeksLeft * 7)) : null;

  let startDate;
  if (doneVol === 0 && plannedStartDate) {
    startDate = new Date(plannedStartDate);
  } else {
    startDate = mode === "history" ? addDays(TODAY, -Math.round(weeksWorked * 7)) : TODAY;
  }

  const progress = totalVol > 0 ? Math.min(100, (doneVol / totalVol) * 100) : 0;
  const totalWeeks = weeksLeft !== null ? (mode === "history" ? weeksWorked : 0) + weeksLeft : null;

  return { remaining, ratePerWeek, weeksLeft, endDate, startDate, progress, totalWeeks };
}

function MainObjectTab({ objectName, setObjectName, works, calculations, activeWorkId }) {
  const C = useContext(ThemeContext);
  let maxDate = null;
  let totalDurationMs = 0;
  let doneDurationMs = 0;

  works.forEach(w => {
    const c = calculations[w.id];
    if (c.endDate) {
      if (!maxDate || c.endDate > maxDate) maxDate = new Date(c.endDate);
    }
    if (c.startDate && c.endDate) {
      const duration = c.endDate - c.startDate;
      totalDurationMs += duration;
      doneDurationMs += duration * (c.progress / 100);
    }
  });

  const overallProgress = totalDurationMs > 0 ? (doneDurationMs / totalDurationMs) * 100 : 0;
  const pColor = overallProgress < 30 ? "#e05050" : overallProgress < 65 ? C.accent : C.good;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveImage = () => {
    const el = document.getElementById("main-print-area");
    if (!el) return;
    html2canvas(el, { backgroundColor: C.bg }).then(canvas => {
      const link = document.createElement('a');
      link.download = `${objectName}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div id="main-print-area" style={{ padding: "24px 40px", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <input className="object-name-input" value={objectName} onChange={e => setObjectName(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 30, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "0.04em", width: "100%", borderBottom: `1px solid transparent`, transition: "all .2s" }}
            placeholder="Введіть назву об'єкта..."
          />
        </div>
        <div className="no-print" style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSaveImage} style={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, padding: "8px 14px", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>💾 Зберегти PNG</button>
          <button onClick={handlePrint} style={{ background: C.accentDim + "33", border: `1px solid ${C.accent}`, color: C.accentLight, padding: "8px 14px", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>🖨 Друк</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Всього робіт" value={works.length} small />
        <div style={{ background: `linear-gradient(135deg,${C.panel},${C.gradBg})`, border: `1px solid ${C.accentDim}`, borderRadius: 6, padding: "14px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.12em", color: C.accentDim, textTransform: "uppercase", marginBottom: 6 }}>🏗 Фініш об'єкта</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.accent, lineHeight: 1, letterSpacing: "0.04em" }}>
            {maxDate ? fmt(maxDate) : "—"}
          </div>
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>Загальна готовність</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: pColor, fontWeight: 700 }}>{overallProgress.toFixed(1)}%</span>
          </div>
          <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${overallProgress}%`, background: `linear-gradient(90deg,${pColor}88,${pColor})`, borderRadius: 4 }} />
          </div>
        </div>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: "20px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: C.text }}>Загальний графік виконання</div>
        <GanttChart works={works} calculations={calculations} activeWorkId={activeWorkId} />
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useLocalStorage("ctc_theme", "light");
  const C = THEMES[theme] || THEMES.light;

  const [objectName, setObjectName] = useLocalStorage("ctc_objectName", "Новий об'єкт");
  const [works, setWorks] = useLocalStorage("ctc_works", [
    {
      id: 1,
      workName: "Монолітні роботи",
      unit: "м³",
      totalVol: 4000,
      doneVol: 1400,
      mode: "history",
      weeksWorked: 18,
      manualRate: 7.8,
      brigades: 2,
      plannedStartDate: ""
    }
  ]);
  const [activeWorkId, setActiveWorkId] = useState('main');

  const updateWork = (id, fields) => {
    setWorks(ws => ws.map(w => w.id === id ? { ...w, ...fields } : w));
  };

  const addWork = () => {
    const newId = works.length > 0 ? Math.max(...works.map(w => w.id)) + 1 : 1;
    setWorks([...works, {
      id: newId, workName: `Нова робота ${newId}`, unit: "м³", totalVol: 1000, doneVol: 0,
      mode: "manual", weeksWorked: 0, manualRate: 10, brigades: 1, plannedStartDate: ""
    }]);
    setActiveWorkId(newId);
  };

  const removeWork = (id) => {
    const newWorks = works.filter(w => w.id !== id);
    setWorks(newWorks);
    setActiveWorkId('main');
  };

  const handleExport = () => {
    const data = { objectName, works };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${objectName || "project"}.json`;
    link.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.works && Array.isArray(data.works)) {
          setObjectName(data.objectName || "Новий об'єкт");
          setWorks(data.works);
          setActiveWorkId('main');
        } else {
          alert("Невірний формат файлу!");
        }
      } catch (err) {
        alert("Помилка при читанні файлу!");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const calculations = useMemo(() => {
    const calcMap = {};
    works.forEach(w => {
      calcMap[w.id] = calculateWork(w);
    });
    return calcMap;
  }, [works]);

  const currentWork = activeWorkId !== 'main' ? works.find(w => w.id === activeWorkId) : null;
  const calc = currentWork ? calculations[currentWork.id] : null;

  const pColor = calc ? (calc.progress < 30 ? "#e05050" : calc.progress < 65 ? C.accent : C.good) : C.good;

  return (
    <ThemeContext.Provider value={C}>
      <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans',sans-serif", overflow: "hidden", transition: "background 0.3s, color 0.3s" }}>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: #ffffff !important; -webkit-print-color-adjust: exact; color-adjust: exact; margin: 0; padding: 0; }
            .object-name-input { border-bottom: none !important; }
            #main-print-area { max-width: 100% !important; padding: 0 !important; }
          }
          .object-name-input:focus { border-bottom: 1px solid ${C.accent} !important; }
          
          /* Custom Scrollbar */
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${C.isDark ? '#333' : '#d1d5db'}; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: ${C.isDark ? '#555' : '#9ca3af'}; }
          input[type="date"] { color-scheme: ${C.isDark ? 'dark' : 'light'}; }
        `}</style>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&family=Bebas+Neue&display=swap" rel="stylesheet" />

        {/* Sidebar */}
        <div className="no-print" style={{ width: 260, minWidth: 260, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", background: C.panel, transition: "background 0.3s, border-color 0.3s" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: "0.06em", color: C.accent }}>ПРОГНОЗ ВИКОНАННЯ</span>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Mono',monospace", marginTop: 4 }}>{fmt(TODAY)}</div>
            </div>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            <button onClick={() => setActiveWorkId('main')} style={{
              padding: "10px 14px", borderRadius: 6, border: "none", cursor: "pointer", textAlign: "left",
              background: activeWorkId === 'main' ? C.accentDim + "44" : "transparent",
              color: activeWorkId === 'main' ? C.accentLight : C.text,
              fontWeight: activeWorkId === 'main' ? 600 : 400,
              fontSize: 16, fontFamily: "'DM Sans',sans-serif", transition: "all .2s",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}>
              🏠 Об'єкт: {objectName || "Новий"}
            </button>

            <div style={{ height: 1, background: C.border, margin: "8px 4px" }} />
            <div style={{ fontSize: 12, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", padding: "0 14px", marginBottom: 6 }}>Роботи</div>

            {works.map(w => (
              <button key={w.id} onClick={() => setActiveWorkId(w.id)} style={{
                padding: "10px 14px", borderRadius: 6, border: "none", cursor: "pointer", textAlign: "left",
                background: activeWorkId === w.id ? C.border : "transparent",
                color: activeWorkId === w.id ? C.text : C.muted,
                fontSize: 16, fontFamily: "'DM Sans',sans-serif", transition: "all .2s",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
              }}>
                {w.workName}
              </button>
            ))}
          </div>
          <div style={{ padding: "16px", borderTop: `1px solid ${C.border}` }}>
            <button onClick={addWork} style={{
              width: "100%", padding: "10px 0", borderRadius: 6, border: `1px dashed ${C.border}`, background: "transparent", cursor: "pointer",
              color: C.good, fontFamily: "'DM Sans',sans-serif", fontSize: 16, transition: "all .2s", marginBottom: 12
            }}>
              + Додати роботу
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleExport} style={{ flex: 1, padding: "8px 0", borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 14, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "all .2s" }}>Експорт</button>
              <label style={{ flex: 1, padding: "8px 0", borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 14, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
                Імпорт
                <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
              </label>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {activeWorkId === 'main' ? (
            <MainObjectTab objectName={objectName} setObjectName={setObjectName} works={works} calculations={calculations} activeWorkId={activeWorkId} />
          ) : currentWork && calc ? (
            <div className="no-print" style={{ padding: "24px 40px", width: "100%", boxSizing: "border-box" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 26, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "0.04em", color: C.text }}>{currentWork.workName}</div>
                <button onClick={() => removeWork(currentWork.id)} style={{ background: "transparent", border: "none", color: "#e05050", fontSize: 14, cursor: "pointer", textDecoration: "underline" }}>Видалити роботу</button>
              </div>

              {/* Main 2-col grid */}
              <div style={{ display: "grid", gridTemplateColumns: "minmax(250px,1fr) minmax(270px,1.3fr)", gap: 18, marginBottom: 24 }}>

                {/* Inputs */}
                <div style={{ background: C.panel, borderRadius: 6, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
                  <div style={{ fontSize: 12, letterSpacing: "0.12em", color: C.accentDim, textTransform: "uppercase", marginBottom: 16 }}>Вхідні дані</div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 5 }}>Назва роботи</label>
                    <input value={currentWork.workName} onChange={e => updateWork(currentWork.id, { workName: e.target.value })}
                      style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, fontFamily: "'DM Sans',sans-serif", fontSize: 16, padding: "9px 12px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Одиниці виміру</div>
                    <div style={{ display: "flex", gap: 6 }}>{UNITS.map(u => <Chip key={u} active={currentWork.unit === u} onClick={() => updateWork(currentWork.id, { unit: u })}>{u}</Chip>)}</div>
                  </div>

                  <NumField label="Загальний проектний обсяг" value={currentWork.totalVol} onChange={v => updateWork(currentWork.id, { totalVol: v })} unit={currentWork.unit} min={1} />
                  <NumField label={`Виконано (на ${fmt(TODAY)})`} value={currentWork.doneVol} onChange={v => updateWork(currentWork.id, { doneVol: v })} unit={currentWork.unit} min={0} />

                  {currentWork.doneVol === 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontSize: 12, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 5 }}>Запланована дата початку</label>
                      <input type="date" value={currentWork.plannedStartDate} onChange={e => updateWork(currentWork.id, { plannedStartDate: e.target.value })}
                        style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, fontFamily: "'DM Mono',monospace", fontSize: 16, padding: "8px 12px", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  )}

                  <div style={{ fontSize: 12, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", margin: "14px 0 8px" }}>Швидкість виконання</div>
                  <div style={{ display: "flex", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
                    {["history", "manual"].map((m, i) => (
                      <button key={m} onClick={() => updateWork(currentWork.id, { mode: m })} style={{ flex: 1, padding: "8px 0", cursor: "pointer", transition: "all .15s", background: currentWork.mode === m ? C.accentDim + "44" : "transparent", border: "none", borderRight: i === 0 ? `1px solid ${C.border}` : "none", color: currentWork.mode === m ? C.accentLight : C.muted, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
                        {m === "history" ? "З історії" : "Вручну"}
                      </button>
                    ))}
                  </div>

                  {currentWork.mode === "history" ? (
                    <>
                      <NumField label="Відпрацьовано тижнів" value={currentWork.weeksWorked} onChange={v => updateWork(currentWork.id, { weeksWorked: v })} unit="тиж." min={0.5} step={0.5} />
                      <div style={{ fontSize: 13, color: C.muted, padding: "7px 10px", background: C.rateBg, borderRadius: 3, border: `1px solid ${C.border}` }}>
                        Розрахунковий темп: <span style={{ color: C.text, fontFamily: "'DM Mono',monospace" }}>{currentWork.weeksWorked > 0 ? (currentWork.doneVol / currentWork.weeksWorked).toFixed(1) : "—"}</span> {currentWork.unit}/тиж.
                      </div>
                    </>
                  ) : (
                    <>
                      <NumField label="Темп на бригаду" value={currentWork.manualRate} onChange={v => updateWork(currentWork.id, { manualRate: v })} unit={`${currentWork.unit}/тиж.`} min={0.1} step={0.5} />
                      <NumField label="Кількість бригад" value={currentWork.brigades} onChange={v => updateWork(currentWork.id, { brigades: v })} unit="бр." min={1} />
                      <div style={{ fontSize: 13, color: C.muted, padding: "7px 10px", background: C.rateBg, borderRadius: 3, border: `1px solid ${C.border}` }}>
                        Загальний темп: <span style={{ color: C.text, fontFamily: "'DM Mono',monospace" }}>{(currentWork.manualRate * currentWork.brigades).toFixed(1)}</span> {currentWork.unit}/тиж.
                      </div>
                    </>
                  )}
                </div>

                {/* Results */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>Готовність поточної роботи</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: pColor, fontWeight: 700 }}>{calc.progress.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${calc.progress}%`, background: `linear-gradient(90deg,${pColor}88,${pColor})`, borderRadius: 4, transition: "width .4s" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 12, color: C.muted, fontFamily: "'DM Mono',monospace" }}>
                      <span>{currentWork.doneVol.toLocaleString()} {currentWork.unit}</span>
                      <span>{currentWork.totalVol.toLocaleString()} {currentWork.unit}</span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <StatCard label="Залишок" value={`${calc.remaining.toLocaleString()} ${currentWork.unit}`} />
                    <StatCard label="Темп" value={`${calc.ratePerWeek > 0 ? calc.ratePerWeek.toFixed(1) : "—"} ${currentWork.unit}`} sub="на тиждень" />
                    <StatCard label="Тижнів залишилось" value={calc.weeksLeft !== null ? calc.weeksLeft.toFixed(1) : "—"} sub={calc.weeksLeft !== null ? `≈ ${(calc.weeksLeft / 4.33).toFixed(1)} міс.` : ""} />
                    <StatCard label={currentWork.doneVol === 0 ? "Запланований початок" : "Дата відліку / старту"} value={fmt(calc.startDate)} small />
                  </div>

                  <div style={{ background: `linear-gradient(135deg,${C.panel},${C.gradBg})`, border: `1px solid ${C.accentDim}`, borderRadius: 6, padding: "14px 18px", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 12, letterSpacing: "0.12em", color: C.accentDim, textTransform: "uppercase", marginBottom: 6 }}>🏗 Прогнозована дата завершення</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: C.accent, lineHeight: 1, letterSpacing: "0.04em" }}>
                      {calc.endDate ? fmt(calc.endDate) : "—"}
                    </div>
                    {calc.endDate && (
                      <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
                        темп {calc.ratePerWeek.toFixed(1)} {currentWork.unit}/тиж · залишок {calc.remaining.toLocaleString()} {currentWork.unit}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gantt Chart (Full Width) */}
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: "20px" }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: C.text }}>Графік роботи</div>
                <GanttChart works={[currentWork]} calculations={calculations} activeWorkId={activeWorkId} />
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
