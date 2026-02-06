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
  label: string; subtitle: string; depth: number;
  glassOpacity: number; borderOpacity: number; blurPx: number;
  glassTint: string; hoverGlow: string;
}> = {
  surface: {
    label: 'Surface', subtitle: 'Urgent & overdue', depth: 0,
    glassOpacity: 0.045, borderOpacity: 0.10, blurPx: 20,
    glassTint: 'rgba(255,240,220,0.008)', // warm tint
    hoverGlow: 'hsla(195,100%,60%,0.20)',
  },
  inflight: {
    label: 'In Flight', subtitle: 'Active work', depth: 1,
    glassOpacity: 0.03, borderOpacity: 0.07, blurPx: 16,
    glassTint: 'rgba(220,235,255,0.005)', // neutral
    hoverGlow: 'hsla(210,80%,55%,0.18)',
  },
  backlog: {
    label: 'Backlog', subtitle: 'Future work', depth: 2,
    glassOpacity: 0.02, borderOpacity: 0.04, blurPx: 12,
    glassTint: 'rgba(200,220,255,0.008)', // cool tint
    hoverGlow: 'hsla(220,60%,50%,0.15)',
  },
};

export default function PrismConcept() {
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [selected, setSelected] = useState<MockItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Stratum>>({});
  const [dissolvingId, setDissolvingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getStratum = useCallback((item: MockItem): Stratum => overrides[item.id] || classifyItem(item), [overrides]);

  const surfaceItems = mockItems.filter((i) => getStratum(i) === 'surface');
  const inflightItems = mockItems.filter((i) => getStratum(i) === 'inflight');
  const backlogItems = mockItems.filter((i) => getStratum(i) === 'backlog');

  const openPanel = useCallback((item: MockItem) => { setSelected(item); setPanelOpen(true); }, []);
  const closePanel = useCallback(() => { setPanelOpen(false); setTimeout(() => setSelected(null), 400); }, []);

  const promote = useCallback((item: MockItem) => {
    const current = getStratum(item);
    const next: Stratum = current === 'backlog' ? 'inflight' : current === 'inflight' ? 'surface' : 'surface';
    if (next === current) return;
    setDissolvingId(item.id);
    setTimeout(() => { setOverrides((prev) => ({ ...prev, [item.id]: next })); setDissolvingId(null); }, 500);
  }, [getStratum]);

  const demote = useCallback((item: MockItem) => {
    const current = getStratum(item);
    const next: Stratum = current === 'surface' ? 'inflight' : current === 'inflight' ? 'backlog' : 'backlog';
    if (next === current) return;
    setDissolvingId(item.id);
    setTimeout(() => { setOverrides((prev) => ({ ...prev, [item.id]: next })); setDissolvingId(null); }, 500);
  }, [getStratum]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && panelOpen) closePanel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [panelOpen, closePanel]);

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

  return (
    <>
      <style>{`
        @keyframes prism-orb1 {
          0% { transform: translate(0,0) scale(1); }
          35% { transform: translate(-4vw,6vh) scale(1.04); }
          65% { transform: translate(3vw,-3vh) scale(0.97); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes prism-orb2 {
          0% { transform: translate(0,0) scale(1); }
          45% { transform: translate(5vw,-5vh) scale(1.05); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes prism-orb3 {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-3vw,-4vh) scale(0.98); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes prism-dissolve {
          0% { opacity: 1; filter: blur(0px) brightness(1); transform: scale(1); }
          40% { opacity: 0.7; filter: blur(2px) brightness(1.3); transform: scale(1.02); }
          100% { opacity: 0; filter: blur(6px) brightness(1.8); transform: scale(0.96); }
        }
        .prism-card {
          transition: transform 280ms cubic-bezier(0.4,0,0.2,1), border-color 280ms, box-shadow 280ms;
        }
        .prism-card:hover {
          transform: translateY(-3px) !important;
        }
        .prism-promote:hover { background: rgba(56,189,248,0.12) !important; color: rgba(255,255,255,0.9) !important; }
        .prism-demote:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.6) !important; }
        .prism-sb { transition: all 200ms; }
        .prism-sb:hover { transform: translateY(-1px); background: rgba(255,255,255,0.05) !important; }
        .prism-scroll::-webkit-scrollbar { width: 5px; }
        .prism-scroll::-webkit-scrollbar-track { background: transparent; }
        .prism-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
      `}</style>

      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '8%', left: '15%', width: '55vw', height: '55vw', maxWidth: 650, maxHeight: 650,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(195,100%,55%,0.09) 0%, transparent 65%)',
            filter: 'blur(80px)', animation: 'prism-orb1 58s ease-in-out infinite',
            transform: `translateY(${scrollY * -0.03}px)`,
          }} />
          <div style={{
            position: 'absolute', top: '45%', right: '5%', width: '48vw', height: '48vw', maxWidth: 580, maxHeight: 580,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(210,70%,48%,0.06) 0%, transparent 65%)',
            filter: 'blur(90px)', animation: 'prism-orb2 70s ease-in-out infinite',
            transform: `translateY(${scrollY * -0.015}px)`,
          }} />
          <div style={{
            position: 'absolute', bottom: '5%', left: '8%', width: '55vw', height: '55vw', maxWidth: 680, maxHeight: 680,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(220,50%,35%,0.04) 0%, transparent 60%)',
            filter: 'blur(100px)', animation: 'prism-orb3 80s ease-in-out infinite',
          }} />
        </div>

        {/* Hiding sidebar */}
        <div
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          style={{
            width: sidebarHovered ? 220 : 56, transition: 'width 250ms cubic-bezier(0.4,0,0.2,1)',
            height: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column',
            background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
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
              <div key={n.label} className="prism-sb" style={{
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

          {/* Depth legend when expanded */}
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
        <main ref={scrollRef} className="prism-scroll" style={{
          flex: 1, height: '100%', overflow: 'auto', position: 'relative', zIndex: 10,
          transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1), filter 400ms cubic-bezier(0.4,0,0.2,1)',
          transform: panelOpen ? 'translateX(-180px) scale(0.95)' : 'translateX(0) scale(1)',
          filter: panelOpen ? 'blur(6px)' : 'none',
        }}>
          <div style={{ padding: '40px 48px 80px', maxWidth: 980, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 48 }}>
              <h1 style={{ fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em' }}>My Focus</h1>
              <p style={{ fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Depth through layers</p>
            </div>

            {/* Three strata — 2-column card grid */}
            {([
              { key: 'surface' as Stratum, items: surfaceItems },
              { key: 'inflight' as Stratum, items: inflightItems },
              { key: 'backlog' as Stratum, items: backlogItems },
            ]).map(({ key: stratum, items }) => {
              const config = strataConfig[stratum];
              const parallaxOffset = scrollY * (0.015 * config.depth);

              return (
                <div key={stratum} style={{
                  marginBottom: 52,
                  transform: `translateY(${parallaxOffset}px)`,
                  transition: 'transform 50ms linear',
                }}>
                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 500, color: `rgba(255,255,255,${0.85 - config.depth * 0.18})` }}>{config.label}</h2>
                    <span style={{ fontSize: 12, fontWeight: 300, color: `rgba(255,255,255,${0.3 - config.depth * 0.06})` }}>{config.subtitle}</span>
                    <span style={{ fontSize: 11, color: `rgba(255,255,255,${0.18 - config.depth * 0.04})`, marginLeft: 'auto' }}>{items.length}</span>
                  </div>

                  {/* Separator glow */}
                  {stratum === 'surface' && (
                    <div style={{ height: 1, marginBottom: 18, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.25) 20%, rgba(56,189,248,0.25) 80%, transparent)' }} />
                  )}

                  {/* 2-column grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {items.map((item) => {
                      const isHovered = hoveredId === item.id;
                      const kc = kindConfig[item.kind];
                      const mc = item.module ? moduleConfig[item.module] : null;
                      const isDissolving = dissolvingId === item.id;

                      return (
                        <div
                          key={item.id}
                          className="prism-card"
                          onClick={() => openPanel(item)}
                          onMouseEnter={() => setHoveredId(item.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          style={{
                            position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                            padding: '18px 20px',
                            // True glass with warm/cool tint per stratum
                            background: `linear-gradient(180deg, ${config.glassTint}, rgba(255,255,255,${isHovered ? config.glassOpacity + 0.02 : config.glassOpacity}))`,
                            backdropFilter: `blur(${config.blurPx}px)`,
                            WebkitBackdropFilter: `blur(${config.blurPx}px)`,
                            border: `1px solid rgba(255,255,255,${isHovered ? config.borderOpacity + 0.06 : config.borderOpacity})`,
                            boxShadow: isHovered
                              ? `0 8px 28px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`
                              : `inset 0 1px 0 rgba(255,255,255,${0.04 - config.depth * 0.01})`,
                            animation: isDissolving ? 'prism-dissolve 500ms ease-out forwards' : undefined,
                          }}
                        >
                          {/* BOTTOM-CENTER GLOW on hover */}
                          <div style={{
                            position: 'absolute', inset: 0, pointerEvents: 'none',
                            background: `radial-gradient(ellipse at 50% 100%, ${config.hoverGlow}, transparent 60%)`,
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 300ms cubic-bezier(0.4,0,0.2,1)',
                          }} />

                          {/* Card content */}
                          <div style={{ position: 'relative', zIndex: 1 }}>
                            {/* Top: kind + priority + date */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                                color: kc.color, opacity: 1 - config.depth * 0.15,
                              }}>{kc.label}</span>
                              <div style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: priorityConfig[item.priority].color,
                                boxShadow: `0 0 5px ${priorityConfig[item.priority].color}`,
                              }} />
                              <span style={{ flex: 1 }} />
                              {item.due_date && (
                                <span style={{
                                  fontSize: 11,
                                  color: isOverdue(item) ? 'rgba(239,68,68,0.8)' : isDueToday(item) ? 'rgba(245,158,11,0.7)' : `rgba(255,255,255,${0.3 - config.depth * 0.06})`,
                                }}>{fmtDate(item.due_date)}</span>
                              )}
                            </div>

                            {/* Title */}
                            <h3 style={{
                              fontSize: 14, fontWeight: 500, margin: '0 0 12px', lineHeight: 1.4,
                              color: `rgba(255,255,255,${0.9 - config.depth * 0.15})`,
                              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                            }}>{item.title}</h3>

                            {/* Bottom: module + assignee + promote/demote */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {mc && <span style={{ fontSize: 11, color: mc.color, opacity: 0.5 - config.depth * 0.1 }}>{mc.label}</span>}
                              <span style={{ flex: 1 }} />

                              <div style={{
                                width: 24, height: 24, borderRadius: '50%',
                                background: `rgba(255,255,255,${0.05 - config.depth * 0.01})`,
                                border: `1px solid rgba(255,255,255,${0.07 - config.depth * 0.02})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 500, color: `rgba(255,255,255,${0.5 - config.depth * 0.1})`,
                              }}>{item.assigned_to}</div>

                              <div style={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                                {stratum !== 'surface' && (
                                  <button className="prism-promote" onClick={() => promote(item)} style={{
                                    width: 20, height: 18, border: 'none', borderRadius: 4, cursor: 'pointer',
                                    background: 'rgba(56,189,248,0.08)', color: 'rgba(255,255,255,0.35)',
                                    fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms',
                                  }}>&#9650;</button>
                                )}
                                {stratum !== 'backlog' && (
                                  <button className="prism-demote" onClick={() => demote(item)} style={{
                                    width: 20, height: 18, border: 'none', borderRadius: 4, cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)',
                                    fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms',
                                  }}>&#9660;</button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {items.length === 0 && (
                    <div style={{ padding: '28px 0', textAlign: 'center', fontSize: 13, fontWeight: 300, color: `rgba(255,255,255,${0.18 - config.depth * 0.04})` }}>
                      No items at this depth
                    </div>
                  )}
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
            <div className="prism-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
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

              <h2 style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.95)', lineHeight: 1.3, marginBottom: 20 }}>{selected.title}</h2>

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
