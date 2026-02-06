'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { mockItems, priorityConfig, kindConfig, statusConfig, moduleConfig, type MockItem } from '../mock-data';

function isOverdue(item: MockItem) { return item.due_date ? new Date(item.due_date + 'T00:00:00') < new Date('2026-02-05T00:00:00') && item.status !== 'done' : false; }
function isDueToday(item: MockItem) { return item.due_date === '2026-02-05'; }
function fmtDate(d: string | null) { if (!d) return 'No date'; const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

type Stratum = 'surface' | 'inflight' | 'backlog';

function classifyItem(item: MockItem): Stratum {
  if (item.priority === 'urgent' || isOverdue(item) || isDueToday(item)) return 'surface';
  if (item.status === 'in_progress' || item.status === 'in_review') return 'inflight';
  return 'backlog';
}

const strataConfig: Record<Stratum, {
  label: string; subtitle: string;
  glassOpacity: number; borderOpacity: number; blurPx: number; depth: number;
  accentColor: string; accentGlow: string;
  edgeColor: string;
}> = {
  surface: {
    label: 'Surface', subtitle: 'Urgent & overdue',
    glassOpacity: 0.04, borderOpacity: 0.10, blurPx: 20, depth: 0,
    accentColor: 'hsla(195,100%,60%,0.25)', accentGlow: 'hsla(195,100%,60%,0.08)',
    edgeColor: 'rgba(56,189,248,0.35)',
  },
  inflight: {
    label: 'In Flight', subtitle: 'Active work',
    glassOpacity: 0.03, borderOpacity: 0.07, blurPx: 16, depth: 1,
    accentColor: 'hsla(210,80%,55%,0.20)', accentGlow: 'hsla(210,80%,55%,0.06)',
    edgeColor: 'rgba(56,189,248,0.25)',
  },
  backlog: {
    label: 'Backlog', subtitle: 'Future work',
    glassOpacity: 0.02, borderOpacity: 0.04, blurPx: 12, depth: 2,
    accentColor: 'hsla(220,60%,50%,0.15)', accentGlow: 'hsla(220,60%,50%,0.04)',
    edgeColor: 'rgba(56,189,248,0.15)',
  },
};

const allKinds = ['bug', 'feature', 'task', 'idea'] as const;
const allPriorities = ['urgent', 'high', 'normal', 'low', 'none'] as const;

export default function GeodeV2Concept() {
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [selected, setSelected] = useState<MockItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Stratum>>({});
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterKinds, setFilterKinds] = useState<Set<string>>(new Set(allKinds));
  const [filterPriorities, setFilterPriorities] = useState<Set<string>>(new Set(allPriorities));

  const getStratum = useCallback((item: MockItem): Stratum => overrides[item.id] || classifyItem(item), [overrides]);

  const filteredItems = mockItems.filter((item) =>
    filterKinds.has(item.kind) && filterPriorities.has(item.priority)
  );

  const surfaceItems = filteredItems.filter((i) => getStratum(i) === 'surface');
  const inflightItems = filteredItems.filter((i) => getStratum(i) === 'inflight');
  const backlogItems = filteredItems.filter((i) => getStratum(i) === 'backlog');

  const openPanel = useCallback((item: MockItem) => { setSelected(item); setPanelOpen(true); }, []);
  const closePanel = useCallback(() => { setPanelOpen(false); setTimeout(() => setSelected(null), 400); }, []);

  const promote = useCallback((item: MockItem) => {
    const current = getStratum(item);
    const next: Stratum = current === 'backlog' ? 'inflight' : current === 'inflight' ? 'surface' : 'surface';
    if (next === current) return;
    setPromotingId(item.id);
    setTimeout(() => { setOverrides((prev) => ({ ...prev, [item.id]: next })); setPromotingId(null); }, 450);
  }, [getStratum]);

  const demote = useCallback((item: MockItem) => {
    const current = getStratum(item);
    const next: Stratum = current === 'surface' ? 'inflight' : current === 'inflight' ? 'backlog' : 'backlog';
    if (next === current) return;
    setOverrides((prev) => ({ ...prev, [item.id]: next }));
  }, [getStratum]);

  const toggleKind = (k: string) => {
    setFilterKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };
  const togglePriority = (p: string) => {
    setFilterPriorities((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (panelOpen) closePanel(); else if (filterOpen) setFilterOpen(false); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [panelOpen, closePanel, filterOpen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', h, { passive: true });
    return () => el.removeEventListener('scroll', h);
  }, []);

  const navItems = [
    { label: 'My Focus', letter: 'F', active: true },
    { label: 'All Work', letter: 'W', active: false },
    { label: 'Inbox', letter: 'I', active: false },
    { label: 'Projects', letter: 'P', active: false },
    { label: 'Team', letter: 'T', active: false },
  ];

  const activeFilterCount = (allKinds.length - filterKinds.size) + (allPriorities.length - filterPriorities.size);

  return (
    <>
      <style>{`
        @keyframes gv2-orb1 {
          0% { transform: translate(0,0) scale(1); }
          40% { transform: translate(-3vw,5vh) scale(1.03); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes gv2-orb2 {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(4vw,-4vh) scale(1.04); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes gv2-orb3 {
          0% { transform: translate(0,0) scale(1); }
          45% { transform: translate(-2vw,-6vh) scale(0.97); }
          100% { transform: translate(0,0) scale(1); }
        }
        /* Slow-moving ambient light that drifts BEHIND cards */
        @keyframes gv2-ambient1 {
          0% { transform: translate(0, 0); opacity: 0.6; }
          25% { transform: translate(60px, -40px); opacity: 0.9; }
          50% { transform: translate(120px, 20px); opacity: 0.5; }
          75% { transform: translate(40px, 60px); opacity: 0.8; }
          100% { transform: translate(0, 0); opacity: 0.6; }
        }
        @keyframes gv2-ambient2 {
          0% { transform: translate(0, 0); opacity: 0.5; }
          30% { transform: translate(-80px, 50px); opacity: 0.8; }
          60% { transform: translate(-40px, -30px); opacity: 0.4; }
          100% { transform: translate(0, 0); opacity: 0.5; }
        }
        @keyframes gv2-ambient3 {
          0% { transform: translate(0, 0); opacity: 0.4; }
          35% { transform: translate(50px, 70px); opacity: 0.7; }
          70% { transform: translate(-60px, 30px); opacity: 0.5; }
          100% { transform: translate(0, 0); opacity: 0.4; }
        }
        @keyframes gv2-promote {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-35px) scale(1.04); opacity: 0.6; }
          100% { transform: translateY(-65px) scale(1); opacity: 0; }
        }
        @keyframes gv2-filter-in {
          0% { transform: translateY(-10px) scaleY(0.95); opacity: 0; }
          100% { transform: translateY(0) scaleY(1); opacity: 1; }
        }
        @keyframes gv2-filter-out {
          0% { transform: translateY(0) scaleY(1); opacity: 1; }
          100% { transform: translateY(-10px) scaleY(0.95); opacity: 0; }
        }
        .gv2-card {
          transition: transform 300ms cubic-bezier(0.4,0,0.2,1), border-color 300ms, box-shadow 400ms;
        }
        .gv2-card:hover {
          transform: translateY(-3px) !important;
        }
        .gv2-promote:hover { background: rgba(56,189,248,0.12) !important; color: rgba(255,255,255,0.9) !important; }
        .gv2-demote:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.6) !important; }
        .gv2-sb { transition: all 200ms; }
        .gv2-sb:hover { transform: translateY(-1px); background: rgba(255,255,255,0.05) !important; }
        .gv2-scroll::-webkit-scrollbar { width: 5px; }
        .gv2-scroll::-webkit-scrollbar-track { background: transparent; }
        .gv2-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
        .gv2-filter-chip {
          transition: all 180ms cubic-bezier(0.4,0,0.2,1);
          cursor: pointer;
          user-select: none;
        }
        .gv2-filter-chip:hover {
          transform: translateY(-1px);
        }
      `}</style>

      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Parallax orbs at different depths */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '5%', left: '20%', width: '55vw', height: '55vw', maxWidth: 650, maxHeight: 650,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(195,100%,55%,0.10) 0%, transparent 65%)',
            filter: 'blur(75px)', animation: 'gv2-orb1 55s ease-in-out infinite',
            transform: `translateY(${scrollY * -0.04}px)`,
          }} />
          <div style={{
            position: 'absolute', top: '40%', right: '8%', width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(210,70%,50%,0.07) 0%, transparent 65%)',
            filter: 'blur(90px)', animation: 'gv2-orb2 68s ease-in-out infinite',
            transform: `translateY(${scrollY * -0.02}px)`,
          }} />
          <div style={{
            position: 'absolute', bottom: '5%', left: '10%', width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(220,50%,38%,0.04) 0%, transparent 60%)',
            filter: 'blur(110px)', animation: 'gv2-orb3 80s ease-in-out infinite',
          }} />
        </div>

        {/* Hiding sidebar */}
        <div
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          style={{
            width: sidebarHovered ? 220 : 56, transition: 'width 250ms cubic-bezier(0.4,0,0.2,1)',
            height: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column',
            background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 20, overflow: 'hidden',
          }}
        >
          <div style={{ padding: sidebarHovered ? '24px 16px' : '24px 0', display: 'flex', alignItems: 'center', justifyContent: sidebarHovered ? 'flex-start' : 'center', height: 64, flexShrink: 0, transition: 'padding 250ms' }}>
            {sidebarHovered
              ? <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' }}>BugBee</span>
              : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>B</div>
            }
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: sidebarHovered ? '8px' : '8px 12px' }}>
            {navItems.map((n) => (
              <div key={n.label} className="gv2-sb" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: sidebarHovered ? '8px 10px' : '0',
                borderRadius: 8, cursor: 'pointer', justifyContent: sidebarHovered ? 'flex-start' : 'center',
                background: n.active ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.02)',
                boxShadow: n.active ? 'inset 0 1px 0 rgba(56,189,248,0.1), inset 0 -1px 0 rgba(0,0,0,0.15)' : 'inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.1)',
                height: sidebarHovered ? 'auto' : 34, minHeight: 34,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: n.active ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${n.active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 500, color: n.active ? 'rgba(56,189,248,0.9)' : 'rgba(255,255,255,0.4)', flexShrink: 0,
                }}>{n.letter}</div>
                {sidebarHovered && <span style={{ fontSize: 13, fontWeight: n.active ? 500 : 400, color: n.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{n.label}</span>}
              </div>
            ))}
          </div>

          {/* Depth legend */}
          {sidebarHovered && (
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', marginBottom: 10 }}>Depth</div>
              {(['surface', 'inflight', 'backlog'] as Stratum[]).map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s === 'surface' ? 'rgba(56,189,248,0.6)' : s === 'inflight' ? 'rgba(56,189,248,0.3)' : 'rgba(56,189,248,0.12)' }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{strataConfig[s].label}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: sidebarHovered ? '12px 16px' : '16px 0', display: 'flex', justifyContent: sidebarHovered ? 'flex-start' : 'center', borderTop: sidebarHovered ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
            <Link href="/concepts" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{sidebarHovered ? '\u2190 Back to Concepts' : '\u2190'}</Link>
          </div>
        </div>

        {/* Main content */}
        <main ref={scrollRef} className="gv2-scroll" style={{
          flex: 1, height: '100%', overflow: 'auto', position: 'relative', zIndex: 10,
          transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1), filter 400ms cubic-bezier(0.4,0,0.2,1)',
          transform: panelOpen ? 'translateX(-180px) scale(0.95)' : 'translateX(0) scale(1)',
          filter: panelOpen ? 'blur(6px)' : 'none',
        }}>
          <div style={{ padding: '40px 48px 80px', maxWidth: 900, margin: '0 auto', position: 'relative' }}>
            {/* Header with filter toggle */}
            <div style={{ marginBottom: 48, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em' }}>My Focus</h1>
                  <p style={{ fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>True glass, lit from within</p>
                </div>

                {/* Filter toggle button */}
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${filterOpen ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    background: filterOpen ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: filterOpen
                      ? 'inset 0 1px 0 rgba(56,189,248,0.08), 0 4px 12px rgba(0,0,0,0.15)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    transition: 'all 250ms cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.6 }}>
                    <path d="M1 3h12M3 7h8M5 11h4" stroke={filterOpen ? 'rgba(56,189,248,0.9)' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span style={{
                    fontSize: 12, fontWeight: 500,
                    color: filterOpen ? 'rgba(56,189,248,0.9)' : 'rgba(255,255,255,0.5)',
                  }}>Filter</span>
                  {activeFilterCount > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 6,
                      background: 'rgba(56,189,248,0.15)', color: 'rgba(56,189,248,0.9)',
                    }}>{activeFilterCount}</span>
                  )}
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{
                    transform: filterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
                  }}>
                    <path d="M1 1l4 4 4-4" stroke={filterOpen ? 'rgba(56,189,248,0.6)' : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* GLASS PULL-DOWN FILTER PANEL */}
              {filterOpen && (
                <div style={{
                  marginTop: 16,
                  padding: '20px 24px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: `0 8px 32px rgba(0,0,0,0.2),
                              inset 0 1px 0 rgba(255,255,255,0.06),
                              inset 0 -1px 0 rgba(255,255,255,0.02)`,
                  animation: 'gv2-filter-in 300ms cubic-bezier(0.16,1,0.3,1) forwards',
                  transformOrigin: 'top center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Glass sheen */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.02) 100%)',
                    borderRadius: 16,
                  }} />

                  {/* Subtle cyan edge line at top */}
                  <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.2), transparent)',
                  }} />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Kind filters */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', marginBottom: 10 }}>Type</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {allKinds.map((k) => {
                          const active = filterKinds.has(k);
                          const kc = kindConfig[k];
                          return (
                            <div
                              key={k}
                              className="gv2-filter-chip"
                              onClick={() => toggleKind(k)}
                              style={{
                                padding: '5px 14px', borderRadius: 8,
                                fontSize: 12, fontWeight: 500,
                                background: active ? `${kc.bg}` : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${active ? `${kc.color}33` : 'rgba(255,255,255,0.06)'}`,
                                color: active ? kc.color : 'rgba(255,255,255,0.25)',
                                boxShadow: active
                                  ? `inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 3px rgba(0,0,0,0.1)`
                                  : `inset 0 1px 2px rgba(0,0,0,0.1)`,
                              }}
                            >{kc.label}</div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Priority filters */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', marginBottom: 10 }}>Priority</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {allPriorities.map((p) => {
                          const active = filterPriorities.has(p);
                          const pc = priorityConfig[p];
                          return (
                            <div
                              key={p}
                              className="gv2-filter-chip"
                              onClick={() => togglePriority(p)}
                              style={{
                                padding: '5px 14px', borderRadius: 8,
                                fontSize: 12, fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: active ? pc.bg : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${active ? `${pc.color}33` : 'rgba(255,255,255,0.06)'}`,
                                color: active ? pc.color : 'rgba(255,255,255,0.25)',
                                boxShadow: active
                                  ? `inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 3px rgba(0,0,0,0.1)`
                                  : `inset 0 1px 2px rgba(0,0,0,0.1)`,
                              }}
                            >
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: active ? pc.color : 'rgba(255,255,255,0.15)' }} />
                              {pc.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Clear filters */}
                    {activeFilterCount > 0 && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <button
                          onClick={() => { setFilterKinds(new Set(allKinds)); setFilterPriorities(new Set(allPriorities)); }}
                          style={{
                            fontSize: 11, color: 'rgba(56,189,248,0.6)', background: 'none',
                            border: 'none', cursor: 'pointer', padding: 0,
                          }}
                        >Clear all filters</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Three strata */}
            {([
              { key: 'surface' as Stratum, items: surfaceItems },
              { key: 'inflight' as Stratum, items: inflightItems },
              { key: 'backlog' as Stratum, items: backlogItems },
            ]).map(({ key: stratum, items }) => {
              const config = strataConfig[stratum];
              const parallaxOffset = scrollY * (0.015 * config.depth);

              return (
                <div key={stratum} style={{
                  marginBottom: 52, position: 'relative',
                  transform: `translateY(${parallaxOffset}px)`,
                  transition: 'transform 50ms linear',
                }}>
                  {/* SLOW-MOVING AMBIENT LIGHT behind cards — visible through the glass */}
                  <div style={{ position: 'absolute', inset: '-40px -60px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute', top: '10%', left: '5%',
                      width: 280, height: 180, borderRadius: '50%',
                      background: `radial-gradient(ellipse, ${config.accentColor.replace(')', ',0.35)')}, transparent 70%)`,
                      filter: 'blur(60px)',
                      animation: `gv2-ambient1 ${40 + config.depth * 15}s ease-in-out infinite`,
                    }} />
                    <div style={{
                      position: 'absolute', top: '40%', right: '10%',
                      width: 220, height: 220, borderRadius: '50%',
                      background: `radial-gradient(circle, hsla(210,80%,55%,${0.12 - config.depth * 0.03}) 0%, transparent 70%)`,
                      filter: 'blur(50px)',
                      animation: `gv2-ambient2 ${48 + config.depth * 12}s ease-in-out infinite`,
                    }} />
                    <div style={{
                      position: 'absolute', bottom: '5%', left: '30%',
                      width: 260, height: 160, borderRadius: '50%',
                      background: `radial-gradient(ellipse, hsla(195,100%,55%,${0.08 - config.depth * 0.02}) 0%, transparent 70%)`,
                      filter: 'blur(55px)',
                      animation: `gv2-ambient3 ${55 + config.depth * 10}s ease-in-out infinite`,
                    }} />
                  </div>

                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18, paddingBottom: 12, position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 500, color: `rgba(255,255,255,${0.85 - config.depth * 0.18})`, letterSpacing: '-0.01em' }}>{config.label}</h2>
                    <span style={{ fontSize: 12, fontWeight: 300, color: `rgba(255,255,255,${0.3 - config.depth * 0.06})` }}>{config.subtitle}</span>
                    <span style={{ fontSize: 11, color: `rgba(255,255,255,${0.18 - config.depth * 0.04})`, marginLeft: 'auto' }}>{items.length}</span>
                  </div>

                  {/* Glow separator */}
                  {stratum === 'surface' && (
                    <div style={{ height: 1, marginTop: -14, marginBottom: 18, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.25) 20%, rgba(56,189,248,0.25) 80%, transparent)', position: 'relative', zIndex: 1 }} />
                  )}
                  {stratum === 'inflight' && (
                    <div style={{ height: 1, marginTop: -14, marginBottom: 18, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.12) 20%, rgba(56,189,248,0.12) 80%, transparent)', position: 'relative', zIndex: 1 }} />
                  )}

                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
                    {items.map((item) => {
                      const isHovered = hoveredId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="gv2-card"
                          onClick={() => openPanel(item)}
                          onMouseEnter={() => setHoveredId(item.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          style={{
                            position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                            background: `rgba(255,255,255,${isHovered ? config.glassOpacity + 0.015 : config.glassOpacity})`,
                            backdropFilter: `blur(${config.blurPx}px)`,
                            WebkitBackdropFilter: `blur(${config.blurPx}px)`,
                            // Edge highlight on hover — light traces the inner border, convex/raised feel
                            border: `1px solid rgba(255,255,255,${isHovered ? config.borderOpacity + 0.06 : config.borderOpacity})`,
                            boxShadow: isHovered
                              ? `0 8px 32px rgba(0,0,0,0.2),
                                 inset 0 1px 0 rgba(255,255,255,0.06)`
                              : `inset 0 1px 0 rgba(255,255,255,${0.04 - config.depth * 0.01})`,
                            animation: promotingId === item.id ? 'gv2-promote 450ms ease-out forwards' : undefined,
                          }}
                        >
                          {/* EDGE HIGHLIGHT — soft rounded glow, bright at edges tapering inward */}
                          <div style={{
                            position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 14,
                            // Layered inset shadows: tight bright edge + medium spread + wide soft taper
                            boxShadow: `
                              inset 0 0 4px 1px ${config.edgeColor},
                              inset 0 0 12px 2px ${config.edgeColor.replace(')', ',0.25)')},
                              inset 0 0 28px 4px ${config.edgeColor.replace(')', ',0.10)')},
                              inset 0 0 48px 0px ${config.edgeColor.replace(')', ',0.04)')}
                            `,
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 400ms cubic-bezier(0.4,0,0.2,1)',
                          }} />

                          {/* Priority bar */}
                          <div style={{
                            width: 4, height: 28, borderRadius: 2, flexShrink: 0, position: 'relative', zIndex: 1,
                            background: priorityConfig[item.priority].color,
                            opacity: 0.9 - config.depth * 0.2,
                          }} />

                          {/* Kind */}
                          <span style={{
                            fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                            color: kindConfig[item.kind].color, minWidth: 48, flexShrink: 0, position: 'relative', zIndex: 1,
                            opacity: 1 - config.depth * 0.15,
                          }}>{kindConfig[item.kind].label}</span>

                          {/* Title */}
                          <span style={{
                            flex: 1, fontSize: 14, fontWeight: 400, position: 'relative', zIndex: 1,
                            color: `rgba(255,255,255,${0.88 - config.depth * 0.14})`,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>{item.title}</span>

                          {/* Module */}
                          {item.module && moduleConfig[item.module] && (
                            <span style={{
                              fontSize: 11, color: moduleConfig[item.module].color, position: 'relative', zIndex: 1,
                              opacity: 0.55 - config.depth * 0.12,
                            }}>{moduleConfig[item.module].label}</span>
                          )}

                          {/* Date */}
                          <span style={{
                            fontSize: 11, flexShrink: 0, position: 'relative', zIndex: 1,
                            color: isOverdue(item) ? 'rgba(239,68,68,0.8)' : isDueToday(item) ? 'rgba(245,158,11,0.7)' : `rgba(255,255,255,${0.32 - config.depth * 0.08})`,
                          }}>{fmtDate(item.due_date)}</span>

                          {/* Assignee */}
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%', flexShrink: 0, position: 'relative', zIndex: 1,
                            background: `rgba(255,255,255,${0.06 - config.depth * 0.015})`,
                            border: `1px solid rgba(255,255,255,${0.08 - config.depth * 0.02})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 500, color: `rgba(255,255,255,${0.55 - config.depth * 0.12})`,
                          }}>{item.assigned_to}</div>

                          {/* Promote/Demote */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0, position: 'relative', zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
                            {stratum !== 'surface' && (
                              <button className="gv2-promote" onClick={() => promote(item)} style={{
                                width: 22, height: 16, border: 'none', borderRadius: 4, cursor: 'pointer',
                                background: 'rgba(56,189,248,0.08)', color: 'rgba(255,255,255,0.4)',
                                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms',
                              }} title="Promote">&#9650;</button>
                            )}
                            {stratum !== 'backlog' && (
                              <button className="gv2-demote" onClick={() => demote(item)} style={{
                                width: 22, height: 16, border: 'none', borderRadius: 4, cursor: 'pointer',
                                background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)',
                                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms',
                              }} title="Demote">&#9660;</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div style={{ padding: '28px 0', textAlign: 'center', fontSize: 13, fontWeight: 300, color: `rgba(255,255,255,${0.18 - config.depth * 0.04})` }}>
                        No items at this depth
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Panel backdrop */}
        {panelOpen && <div onClick={closePanel} style={{ position: 'absolute', inset: 0, zIndex: 25 }} />}

        {/* Side pullout detail panel */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 520, zIndex: 30,
          transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)',
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 2,
            background: 'linear-gradient(180deg, rgba(56,189,248,0.04) 0%, rgba(56,189,248,0.15) 25%, rgba(56,189,248,0.15) 75%, rgba(56,189,248,0.04) 100%)',
          }} />

          {selected && (
            <div className="gv2-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <button onClick={closePanel} style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', fontSize: 16,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>&times;</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: kindConfig[selected.kind].color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kindConfig[selected.kind].label}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{selected.id}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: `rgba(${selected.priority === 'urgent' ? '239,68,68' : selected.priority === 'high' ? '249,115,22' : '59,130,246'},0.12)`, color: priorityConfig[selected.priority].color }}>{priorityConfig[selected.priority].label}</span>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.95)', lineHeight: 1.3, marginBottom: 20, letterSpacing: '-0.01em' }}>{selected.title}</h2>

              <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
                <MF label="Status"><span style={{ fontSize: 13, color: statusConfig[selected.status].color }}>{statusConfig[selected.status].label}</span></MF>
                <MF label="Due"><span style={{ fontSize: 13, color: isOverdue(selected) ? '#ef4444' : isDueToday(selected) ? '#f59e0b' : 'rgba(255,255,255,0.6)' }}>{fmtDate(selected.due_date)}</span></MF>
                <MF label="Assignee"><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{selected.assignee_name}</span></MF>
                {selected.module && moduleConfig[selected.module] && (
                  <MF label="Module"><span style={{ fontSize: 13, color: moduleConfig[selected.module].color }}>{moduleConfig[selected.module].label}</span></MF>
                )}
                <MF label="Layer"><span style={{ fontSize: 13, color: 'rgba(56,189,248,0.8)' }}>{strataConfig[getStratum(selected)].label}</span></MF>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.22)', marginBottom: 8 }}>Description</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', fontWeight: 300 }}>{selected.description}</p>
              </div>

              {selected.checklist.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.22)', marginBottom: 10 }}>
                    Checklist ({selected.checklist.filter((c) => c.completed).length}/{selected.checklist.length})
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(selected.checklist.filter(c => c.completed).length / selected.checklist.length) * 100}%`, background: 'linear-gradient(90deg, rgba(56,189,248,0.5), rgba(56,189,248,0.25))', borderRadius: 2 }} />
                  </div>
                  {selected.checklist.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', marginBottom: 4 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: c.completed ? 'none' : '1px solid rgba(255,255,255,0.12)', background: c.completed ? 'rgba(16,185,129,0.18)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#10b981' }}>{c.completed ? '\u2713' : ''}</div>
                      <span style={{ fontSize: 13, color: c.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)', textDecoration: c.completed ? 'line-through' : 'none' }}>{c.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {selected.comment_count > 0 && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {selected.comment_count} comment{selected.comment_count !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MF({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>{label}</div>{children}</div>);
}
