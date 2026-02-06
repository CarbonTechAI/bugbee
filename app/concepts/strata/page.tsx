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

const strataConfig: Record<Stratum, { label: string; subtitle: string; glassOpacity: number; borderOpacity: number; depth: number }> = {
  surface: { label: 'Surface', subtitle: 'Urgent & overdue', glassOpacity: 0.06, borderOpacity: 0.14, depth: 0 },
  inflight: { label: 'In Flight', subtitle: 'Active work', glassOpacity: 0.04, borderOpacity: 0.09, depth: 1 },
  backlog: { label: 'Backlog', subtitle: 'Future work', glassOpacity: 0.02, borderOpacity: 0.05, depth: 2 },
};

export default function StrataConcept() {
  const [selected, setSelected] = useState<MockItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('My Focus');
  const [overrides, setOverrides] = useState<Record<string, Stratum>>({});
  const [scrollY, setScrollY] = useState(0);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Classify items with overrides
  const getStratum = useCallback((item: MockItem): Stratum => {
    return overrides[item.id] || classifyItem(item);
  }, [overrides]);

  const surfaceItems = mockItems.filter((i) => getStratum(i) === 'surface');
  const inflightItems = mockItems.filter((i) => getStratum(i) === 'inflight');
  const backlogItems = mockItems.filter((i) => getStratum(i) === 'backlog');

  const openDetail = useCallback((item: MockItem) => { setSelected(item); setPanelOpen(true); }, []);
  const closeDetail = useCallback(() => { setPanelOpen(false); setTimeout(() => setSelected(null), 400); }, []);

  const promote = useCallback((item: MockItem) => {
    const current = getStratum(item);
    const next: Stratum = current === 'backlog' ? 'inflight' : current === 'inflight' ? 'surface' : 'surface';
    if (next === current) return;
    setPromotingId(item.id);
    setTimeout(() => {
      setOverrides((prev) => ({ ...prev, [item.id]: next }));
      setPromotingId(null);
    }, 400);
  }, [getStratum]);

  const demote = useCallback((item: MockItem) => {
    const current = getStratum(item);
    const next: Stratum = current === 'surface' ? 'inflight' : current === 'inflight' ? 'backlog' : 'backlog';
    if (next === current) return;
    setOverrides((prev) => ({ ...prev, [item.id]: next }));
  }, [getStratum]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && panelOpen) closeDetail(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [panelOpen, closeDetail]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', h, { passive: true });
    return () => el.removeEventListener('scroll', h);
  }, []);

  const navItems = ['My Focus', 'All Work', 'Inbox', 'Projects', 'Team'];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex' }}>
      <style>{`
        @keyframes strata-orb1 { 0% { transform: translate(0,0) scale(1); } 40% { transform: translate(-2vw,4vh) scale(1.02); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes strata-orb2 { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(3vw,-3vh) scale(1.03); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes strata-orb3 { 0% { transform: translate(0,0) scale(1); } 45% { transform: translate(-1vw,-5vh) scale(0.98); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes promote-rise { 0% { transform: translateY(0) scale(1); opacity:1; } 50% { transform: translateY(-30px) scale(1.04); opacity:0.7; } 100% { transform: translateY(-60px) scale(1); opacity:0; } }
        @keyframes modal-in { from { opacity:0; transform: translate(-50%,-50%) scale(0.92); } to { opacity:1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes modal-bg-in { from { opacity:0; } to { opacity:1; } }
        .strata-nav:hover { transform:translateY(-2px); background:rgba(255,255,255,0.04)!important; }
        .strata-card { transition: all 250ms ease; }
        .strata-card:hover { transform:translateY(-3px)!important; border-color:rgba(255,255,255,0.15)!important; background:rgba(255,255,255,0.07)!important; }
        .strata-promote:hover { background:rgba(59,130,246,0.15)!important; color:rgba(255,255,255,0.9)!important; }
        .strata-demote:hover { background:rgba(255,255,255,0.06)!important; color:rgba(255,255,255,0.6)!important; }
        .strata-content::-webkit-scrollbar { width:6px; }
        .strata-content::-webkit-scrollbar-track { background:transparent; }
        .strata-content::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:3px; }
      `}</style>

      {/* Orbs at different "depths" */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {/* Shallow orb — brightest, moves most */}
        <div style={{ position: 'absolute', top: '5%', left: '25%', width: '55vw', height: '55vw', maxWidth: 650, maxHeight: 650, borderRadius: '50%', background: 'radial-gradient(circle, hsla(195,100%,55%,0.09) 0%, transparent 65%)', filter: 'blur(70px)', animation: 'strata-orb1 55s ease-in-out infinite', transform: `translateY(${scrollY * -0.04}px)` }} />
        {/* Mid orb */}
        <div style={{ position: 'absolute', top: '45%', right: '10%', width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600, borderRadius: '50%', background: 'radial-gradient(circle, hsla(210,70%,45%,0.06) 0%, transparent 65%)', filter: 'blur(90px)', animation: 'strata-orb2 68s ease-in-out infinite', transform: `translateY(${scrollY * -0.02}px)` }} />
        {/* Deep orb — faintest, nearly still */}
        <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700, borderRadius: '50%', background: 'radial-gradient(circle, hsla(220,50%,35%,0.04) 0%, transparent 60%)', filter: 'blur(110px)', animation: 'strata-orb3 80s ease-in-out infinite' }} />
      </div>

      {/* Sidebar */}
      <aside style={{
        width: 220, minWidth: 220, height: '100%', display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 20, padding: '28px 16px 20px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', padding: '0 12px', marginBottom: 32 }}>BugBee</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {navItems.map((label) => (
            <button key={label} className="strata-nav" onClick={() => setActiveNav(label)} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, fontSize: 14,
              fontWeight: activeNav === label ? 500 : 400, border: 'none', cursor: 'pointer', transition: 'all 200ms',
              color: activeNav === label ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
              background: activeNav === label ? 'rgba(59,130,246,0.1)' : 'transparent',
              boxShadow: activeNav === label
                ? 'inset 0 1px 2px rgba(59,130,246,0.15), inset 0 -1px 1px rgba(0,0,0,0.1)'
                : 'inset 0 1px 1px rgba(255,255,255,0.02), inset 0 -1px 1px rgba(0,0,0,0.05)',
            }}>{label}</button>
          ))}
        </nav>

        {/* Strata legend */}
        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', padding: '0 12px', marginBottom: 10 }}>Depth</div>
          {(['surface', 'inflight', 'backlog'] as Stratum[]).map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s === 'surface' ? 'rgba(56,189,248,0.6)' : s === 'inflight' ? 'rgba(56,189,248,0.3)' : 'rgba(56,189,248,0.12)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{strataConfig[s].label}</span>
            </div>
          ))}
        </div>

        <Link href="/concepts" className="strata-nav" style={{
          display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none',
          padding: '10px 12px', borderRadius: 8, marginTop: 16,
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02), inset 0 -1px 1px rgba(0,0,0,0.05)',
        }}>Back to Concepts</Link>
      </aside>

      {/* Main content — strata layers */}
      <main ref={scrollRef} className="strata-content" style={{
        flex: 1, height: '100%', overflow: 'auto', position: 'relative', zIndex: 10,
        transition: panelOpen ? 'filter 400ms, transform 400ms, opacity 400ms' : 'filter 400ms, transform 400ms, opacity 400ms',
        filter: panelOpen ? 'blur(8px)' : 'none',
        transform: panelOpen ? 'scale(0.96)' : 'scale(1)',
        opacity: panelOpen ? 0.4 : 1,
        transformOrigin: 'center center',
      }}>
        <div style={{ padding: '40px 48px 80px', maxWidth: 960, margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.02em' }}>Strata</h1>
            <p style={{ fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Depth through layers — promote items to bring them to the surface</p>
          </div>

          {/* Three strata */}
          {([
            { key: 'surface' as Stratum, items: surfaceItems },
            { key: 'inflight' as Stratum, items: inflightItems },
            { key: 'backlog' as Stratum, items: backlogItems },
          ]).map(({ key: stratum, items }, stratumIdx) => {
            const config = strataConfig[stratum];
            const parallaxOffset = scrollY * (0.02 * config.depth);

            return (
              <div key={stratum} style={{
                marginBottom: 56,
                transform: `translateY(${parallaxOffset}px)`,
                transition: 'transform 50ms linear',
              }}>
                {/* Stratum header */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid rgba(255,255,255,${config.borderOpacity * 0.6})` }}>
                  <h2 style={{ fontSize: 16, fontWeight: 500, color: `rgba(255,255,255,${0.9 - config.depth * 0.2})`, letterSpacing: '-0.01em' }}>{config.label}</h2>
                  <span style={{ fontSize: 12, fontWeight: 300, color: `rgba(255,255,255,${0.35 - config.depth * 0.08})` }}>{config.subtitle}</span>
                  <span style={{ fontSize: 11, color: `rgba(255,255,255,${0.2 - config.depth * 0.04})`, marginLeft: 'auto' }}>{items.length} items</span>
                </div>

                {/* Separator line glow for Surface */}
                {stratum === 'surface' && (
                  <div style={{ position: 'relative', marginTop: -13, marginBottom: 20, height: 1 }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.3) 30%, rgba(56,189,248,0.3) 70%, transparent)' }} />
                  </div>
                )}

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="strata-card"
                      onClick={() => openDetail(item)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12,
                        cursor: 'pointer', position: 'relative',
                        background: `rgba(255,255,255,${config.glassOpacity})`,
                        backdropFilter: `blur(${12 - config.depth * 3}px)`,
                        WebkitBackdropFilter: `blur(${12 - config.depth * 3}px)`,
                        border: `1px solid rgba(255,255,255,${config.borderOpacity})`,
                        boxShadow: stratum === 'surface'
                          ? '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                        animation: promotingId === item.id ? 'promote-rise 400ms ease-out forwards' : undefined,
                      }}
                    >
                      {/* Priority indicator */}
                      <div style={{
                        width: 4, height: 28, borderRadius: 2, flexShrink: 0,
                        background: priorityConfig[item.priority].color,
                        opacity: stratum === 'backlog' ? 0.35 : stratum === 'inflight' ? 0.6 : 0.85,
                      }} />

                      {/* Kind badge */}
                      <span style={{
                        fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: kindConfig[item.kind].color,
                        opacity: 1 - config.depth * 0.2,
                        minWidth: 48,
                      }}>{kindConfig[item.kind].label}</span>

                      {/* Title */}
                      <span style={{
                        flex: 1, fontSize: 14, fontWeight: 400,
                        color: `rgba(255,255,255,${0.85 - config.depth * 0.15})`,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{item.title}</span>

                      {/* Module */}
                      {item.module && moduleConfig[item.module] && (
                        <span style={{
                          fontSize: 11, color: moduleConfig[item.module].color,
                          opacity: 0.6 - config.depth * 0.15,
                        }}>{moduleConfig[item.module].label}</span>
                      )}

                      {/* Date */}
                      <span style={{
                        fontSize: 11, fontWeight: 400, flexShrink: 0,
                        color: isOverdue(item) ? 'rgba(239,68,68,0.8)' : isDueToday(item) ? 'rgba(245,158,11,0.7)' : `rgba(255,255,255,${0.35 - config.depth * 0.08})`,
                      }}>{fmtDate(item.due_date)}</span>

                      {/* Assignee */}
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `rgba(255,255,255,${0.06 - config.depth * 0.015})`,
                        border: `1px solid rgba(255,255,255,${0.08 - config.depth * 0.02})`,
                        fontSize: 10, fontWeight: 500,
                        color: `rgba(255,255,255,${0.6 - config.depth * 0.12})`,
                      }}>{item.assigned_to}</div>

                      {/* Promote / Demote buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        {stratum !== 'surface' && (
                          <button className="strata-promote" onClick={() => promote(item)} style={{
                            width: 22, height: 16, border: 'none', borderRadius: 4, cursor: 'pointer',
                            background: 'rgba(59,130,246,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 150ms',
                          }} title="Promote">&#9650;</button>
                        )}
                        {stratum !== 'backlog' && (
                          <button className="strata-demote" onClick={() => demote(item)} style={{
                            width: 22, height: 16, border: 'none', borderRadius: 4, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 150ms',
                          }} title="Demote">&#9660;</button>
                        )}
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div style={{
                      padding: '32px 0', textAlign: 'center', fontSize: 13, fontWeight: 300,
                      color: `rgba(255,255,255,${0.2 - config.depth * 0.04})`,
                    }}>No items at this depth</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Detail modal — centered, rises from the strata */}
      {selected && (
        <>
          {/* Overlay backdrop */}
          <div onClick={closeDetail} style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(8,12,24,0.6)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            animation: panelOpen ? 'modal-bg-in 350ms ease-out forwards' : undefined,
            opacity: panelOpen ? 1 : 0,
            transition: panelOpen ? 'none' : 'opacity 300ms',
          }} />

          {/* Modal card */}
          <div style={{
            position: 'fixed', top: '50%', left: '50%', zIndex: 60,
            width: 600, maxHeight: '80vh', overflow: 'auto',
            transform: panelOpen ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.92)',
            opacity: panelOpen ? 1 : 0,
            animation: panelOpen ? 'modal-in 400ms cubic-bezier(0.16,1,0.3,1) forwards' : undefined,
            transition: panelOpen ? 'none' : 'all 300ms ease-in',
            background: 'rgba(255,255,255,0.045)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: '36px 40px 32px',
          }}>
            {/* Close button */}
            <button onClick={closeDetail} style={{
              position: 'absolute', top: 16, right: 16, width: 32, height: 32, border: 'none', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: 16,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 150ms',
            }}>&times;</button>

            {/* Item header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: kindConfig[selected.kind].color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kindConfig[selected.kind].label}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{selected.id}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: `rgba(${selected.priority === 'urgent' ? '239,68,68' : selected.priority === 'high' ? '249,115,22' : '59,130,246'},0.12)`, color: priorityConfig[selected.priority].color }}>{priorityConfig[selected.priority].label}</span>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.95)', lineHeight: 1.3, marginBottom: 20, letterSpacing: '-0.01em' }}>{selected.title}</h2>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Status</div>
                <span style={{ fontSize: 13, color: statusConfig[selected.status].color }}>{statusConfig[selected.status].label}</span>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Due</div>
                <span style={{ fontSize: 13, color: isOverdue(selected) ? '#ef4444' : isDueToday(selected) ? '#f59e0b' : 'rgba(255,255,255,0.6)' }}>{fmtDate(selected.due_date)}</span>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Assignee</div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{selected.assignee_name}</span>
              </div>
              {selected.module && moduleConfig[selected.module] && (
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Module</div>
                  <span style={{ fontSize: 13, color: moduleConfig[selected.module].color }}>{moduleConfig[selected.module].label}</span>
                </div>
              )}
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Layer</div>
                <span style={{ fontSize: 13, color: 'rgba(56,189,248,0.8)' }}>{strataConfig[getStratum(selected)].label}</span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Description</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', fontWeight: 300 }}>{selected.description}</p>
            </div>

            {/* Checklist */}
            {selected.checklist.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 10 }}>
                  Checklist ({selected.checklist.filter((c) => c.completed).length}/{selected.checklist.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selected.checklist.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: c.completed ? 'none' : '1px solid rgba(255,255,255,0.15)',
                        background: c.completed ? 'rgba(16,185,129,0.2)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#10b981',
                      }}>{c.completed ? '✓' : ''}</div>
                      <span style={{ fontSize: 13, color: c.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)', textDecoration: c.completed ? 'line-through' : 'none' }}>{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {selected.comment_count > 0 && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {selected.comment_count} comment{selected.comment_count !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
