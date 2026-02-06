'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { mockItems, priorityConfig, kindConfig, statusConfig, moduleConfig, type MockItem } from '../mock-data';

const TODAY = '2026-02-05';

function isOverdue(item: MockItem) { return item.due_date ? new Date(item.due_date + 'T00:00:00') < new Date(TODAY + 'T00:00:00') && item.status !== 'done' : false; }
function isDueToday(item: MockItem) { return item.due_date === TODAY; }
function fmtDate(d: string | null) { if (!d) return 'No date'; const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

function getEdgeGlow(item: MockItem) {
  if (isOverdue(item)) return { color: 'rgba(239,68,68,0.7)', shadow: 'rgba(239,68,68,0.3)', ambient: 'rgba(239,68,68,0.06)' };
  if (isDueToday(item)) return { color: 'rgba(245,158,11,0.6)', shadow: 'rgba(245,158,11,0.25)', ambient: 'rgba(245,158,11,0.04)' };
  if (item.priority === 'urgent') return { color: 'rgba(239,68,68,0.6)', shadow: 'rgba(239,68,68,0.2)', ambient: 'rgba(239,68,68,0.04)' };
  if (item.priority === 'high') return { color: 'rgba(249,115,22,0.5)', shadow: 'rgba(249,115,22,0.2)', ambient: 'rgba(249,115,22,0.03)' };
  return { color: 'rgba(56,189,248,0.35)', shadow: 'rgba(56,189,248,0.12)', ambient: 'rgba(56,189,248,0.02)' };
}

function groupItems(items: MockItem[]) {
  const now: MockItem[] = [], today: MockItem[] = [], week: MockItem[] = [], later: MockItem[] = [];
  items.forEach((i) => {
    if (i.priority === 'urgent' || i.priority === 'high' || isOverdue(i)) { now.push(i); return; }
    if (i.due_date === TODAY) { today.push(i); return; }
    if (i.due_date && i.due_date > TODAY && i.due_date <= '2026-02-08') { week.push(i); return; }
    later.push(i);
  });
  return [
    { key: 'now', label: 'right now', items: now },
    { key: 'today', label: 'today', items: today },
    { key: 'week', label: 'this week', items: week },
    { key: 'later', label: 'later', items: later },
  ].filter((g) => g.items.length > 0);
}

export default function DriftConcept() {
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [selected, setSelected] = useState<MockItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const openPanel = useCallback((item: MockItem) => { setSelected(item); setPanelOpen(true); }, []);
  const closePanel = useCallback(() => { setPanelOpen(false); setTimeout(() => setSelected(null), 400); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && panelOpen) closePanel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [panelOpen, closePanel]);

  const groups = groupItems(mockItems);
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
        @keyframes drift-orb1 {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-4vw, -6vh) scale(1.04); }
          50% { transform: translate(2vw, -3vh) scale(0.97); }
          75% { transform: translate(-2vw, 4vh) scale(1.02); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes drift-orb2 {
          0% { transform: translate(0, 0) scale(1); }
          30% { transform: translate(5vw, -8vh) scale(1.05); }
          60% { transform: translate(-3vw, -4vh) scale(0.96); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes drift-orb3 {
          0% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-6vw, 6vh) scale(1.03); }
          70% { transform: translate(4vw, -2vh) scale(0.97); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .drift-card {
          transition: transform 280ms cubic-bezier(0.4,0,0.2,1), border-color 280ms, background 280ms, box-shadow 280ms;
        }
        .drift-card:hover {
          transform: translateY(-3px) !important;
          border-color: rgba(255,255,255,0.12) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06) !important;
        }
        .drift-sb-item { transition: all 200ms; }
        .drift-sb-item:hover { transform: translateY(-1px); background: rgba(255,255,255,0.05) !important; }
        .drift-scroll::-webkit-scrollbar { width: 4px; }
        .drift-scroll::-webkit-scrollbar-track { background: transparent; }
        .drift-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
        .drift-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
      `}</style>

      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Drifting orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '5%', left: '20%', width: '55vw', height: '55vw', maxWidth: 650, maxHeight: 650,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(195,100%,55%,0.10) 0%, transparent 65%)',
            filter: 'blur(80px)', animation: 'drift-orb1 54s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', top: '35%', right: '5%', width: '50vw', height: '50vw', maxWidth: 580, maxHeight: 580,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(210,80%,50%,0.07) 0%, transparent 65%)',
            filter: 'blur(90px)', animation: 'drift-orb2 62s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '0%', left: '25%', width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(220,50%,40%,0.05) 0%, transparent 60%)',
            filter: 'blur(100px)', animation: 'drift-orb3 58s ease-in-out infinite',
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
          {/* Logo */}
          <div style={{
            padding: sidebarHovered ? '24px 16px' : '24px 0', display: 'flex', alignItems: 'center',
            justifyContent: sidebarHovered ? 'flex-start' : 'center', height: 64, flexShrink: 0,
            transition: 'padding 250ms',
          }}>
            {sidebarHovered
              ? <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' }}>BugBee</span>
              : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>B</div>
            }
          </div>

          {/* Nav */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: sidebarHovered ? '8px' : '8px 12px' }}>
            {navItems.map((n) => (
              <div key={n.label} className="drift-sb-item" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: sidebarHovered ? '8px 10px' : '0',
                borderRadius: 8, cursor: 'pointer',
                justifyContent: sidebarHovered ? 'flex-start' : 'center',
                background: n.active ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.02)',
                boxShadow: n.active
                  ? 'inset 0 1px 0 rgba(56,189,248,0.1), inset 0 -1px 0 rgba(0,0,0,0.15)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.1)',
                height: sidebarHovered ? 'auto' : 34, minHeight: 34,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: n.active ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${n.active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 500,
                  color: n.active ? 'rgba(56,189,248,0.9)' : 'rgba(255,255,255,0.4)',
                  flexShrink: 0,
                }}>{n.letter}</div>
                {sidebarHovered && (
                  <span style={{
                    fontSize: 13, fontWeight: n.active ? 500 : 400,
                    color: n.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                    whiteSpace: 'nowrap',
                  }}>{n.label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Back link */}
          <div style={{
            padding: sidebarHovered ? '16px' : '16px 0', display: 'flex',
            justifyContent: sidebarHovered ? 'flex-start' : 'center',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <Link href="/concepts" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {sidebarHovered ? '\u2190 Back to Concepts' : '\u2190'}
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div
          ref={contentRef}
          style={{
            flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center',
            transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1), filter 400ms cubic-bezier(0.4,0,0.2,1)',
            transform: panelOpen ? 'translateX(-200px) scale(0.95)' : 'translateX(0) scale(1)',
            filter: panelOpen ? 'blur(6px)' : 'blur(0px)',
            zIndex: 10,
          }}
        >
          <div className="drift-scroll" style={{ width: '100%', maxWidth: 640, padding: '48px 24px 120px', overflowY: 'auto', height: '100%' }}>
            {/* Header */}
            <div style={{ marginBottom: 44 }}>
              <h1 style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.95)', margin: 0 }}>
                My Focus
              </h1>
              <p style={{ fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                Wednesday, February 5
              </p>
            </div>

            {/* Temporal groups with Aquarium-style cards */}
            {groups.map((section) => (
              <div key={section.key} style={{ marginBottom: 40 }}>
                {/* Section divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.06), transparent)' }} />
                  <span style={{
                    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.25em',
                    color: section.key === 'now' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)',
                    fontWeight: 500, flexShrink: 0,
                  }}>{section.label}</span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06))' }} />
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {section.items.map((item) => {
                    const glow = getEdgeGlow(item);
                    const isHovered = hoveredId === item.id;
                    const kc = kindConfig[item.kind];
                    const pc = priorityConfig[item.priority];
                    const mc = item.module ? moduleConfig[item.module] : null;

                    return (
                      <div
                        key={item.id}
                        className="drift-card"
                        onClick={() => openPanel(item)}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                          position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                          background: isHovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
                        }}
                      >
                        {/* Edge glow strip */}
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                          borderRadius: '14px 0 0 14px',
                          background: glow.color,
                          boxShadow: isHovered ? `0 0 24px ${glow.shadow}, 0 0 8px ${glow.shadow}` : `0 0 12px ${glow.shadow}`,
                          transition: 'box-shadow 280ms',
                        }} />

                        {/* Ambient edge glow on hover */}
                        <div style={{
                          position: 'absolute', inset: 0, pointerEvents: 'none',
                          background: `linear-gradient(90deg, ${glow.ambient}, transparent 40%)`,
                          opacity: isHovered ? 1.5 : 0.6,
                          transition: 'opacity 280ms',
                        }} />

                        {/* Card content */}
                        <div style={{ position: 'relative', zIndex: 1, padding: '18px 20px 16px 22px' }}>
                          {/* Top row: badges + date */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                              padding: '2px 7px', borderRadius: 5,
                              color: kc.color, background: kc.bg,
                            }}>{kc.label}</span>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: pc.color, boxShadow: `0 0 6px ${pc.color}` }} />
                            <span style={{ flex: 1 }} />
                            {item.due_date && (
                              <span style={{
                                fontSize: 11, fontWeight: 400,
                                color: isOverdue(item) ? 'rgba(239,68,68,0.85)' : isDueToday(item) ? 'rgba(245,158,11,0.85)' : 'rgba(255,255,255,0.35)',
                              }}>
                                {isOverdue(item) ? 'Overdue \u00B7 ' : isDueToday(item) ? 'Due today \u00B7 ' : ''}
                                {fmtDate(item.due_date)}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 style={{
                            fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.92)',
                            margin: '0 0 10px', lineHeight: 1.4,
                          }}>{item.title}</h3>

                          {/* Description preview */}
                          <p style={{
                            fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, margin: '0 0 12px',
                            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                          }}>{item.description}</p>

                          {/* Bottom row: module + assignee */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {mc && <span style={{ fontSize: 11, color: mc.color, opacity: 0.7 }}>{mc.label}</span>}
                              {item.checklist.length > 0 && (
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                                  {item.checklist.filter(c => c.completed).length}/{item.checklist.length}
                                </span>
                              )}
                            </div>
                            <div style={{
                              width: 26, height: 26, borderRadius: '50%',
                              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.5)',
                            }}>{item.assigned_to}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel backdrop */}
        {panelOpen && <div onClick={closePanel} style={{ position: 'absolute', inset: 0, zIndex: 25 }} />}

        {/* Detail panel */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 500, zIndex: 30,
          transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)',
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Cyan edge glow line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 2,
            background: 'linear-gradient(180deg, rgba(56,189,248,0.04) 0%, rgba(56,189,248,0.15) 20%, rgba(56,189,248,0.15) 80%, rgba(56,189,248,0.04) 100%)',
          }} />

          {selected && (
            <div className="drift-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
              {/* Close */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <button onClick={closePanel} style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>&times;</button>
              </div>

              {/* ID + Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{selected.id}</span>
                <span style={{
                  fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)',
                  color: statusConfig[selected.status].color,
                }}>{statusConfig[selected.status].label}</span>
              </div>

              {/* Title */}
              <h2 style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.95)', lineHeight: 1.35, margin: '0 0 24px' }}>
                {selected.title}
              </h2>

              {/* Meta grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px',
                marginBottom: 28, padding: 20, background: 'rgba(255,255,255,0.02)',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <MetaField label="Kind"><span style={{ color: kindConfig[selected.kind].color, fontSize: 13 }}>{kindConfig[selected.kind].label}</span></MetaField>
                <MetaField label="Priority">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: priorityConfig[selected.priority].color }} />
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{priorityConfig[selected.priority].label}</span>
                  </div>
                </MetaField>
                <MetaField label="Due Date">
                  <span style={{
                    color: selected.due_date && isOverdue(selected) ? '#ef4444' : 'rgba(255,255,255,0.8)', fontSize: 13,
                  }}>{selected.due_date ? fmtDate(selected.due_date) : 'No date'}</span>
                </MetaField>
                <MetaField label="Module">
                  <span style={{
                    color: selected.module ? moduleConfig[selected.module]?.color : 'rgba(255,255,255,0.3)', fontSize: 13,
                  }}>{selected.module ? moduleConfig[selected.module]?.label : 'None'}</span>
                </MetaField>
                <MetaField label="Assigned To">
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{selected.assignee_name}</span>
                </MetaField>
                <MetaField label="Comments">
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{selected.comment_count} comment{selected.comment_count !== 1 ? 's' : ''}</span>
                </MetaField>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', margin: '0 0 10px' }}>Description</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{selected.description}</p>
              </div>

              {/* Checklist */}
              {selected.checklist.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', margin: '0 0 12px' }}>
                    Checklist ({selected.checklist.filter(c => c.completed).length}/{selected.checklist.length})
                  </h3>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 14, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(selected.checklist.filter(c => c.completed).length / selected.checklist.length) * 100}%`, background: 'linear-gradient(90deg, rgba(56,189,248,0.6), rgba(56,189,248,0.3))', borderRadius: 2 }} />
                  </div>
                  {selected.checklist.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, marginBottom: 8 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `1px solid ${c.completed ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`,
                        background: c.completed ? 'rgba(16,185,129,0.15)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: 'rgba(16,185,129,0.9)',
                      }}>{c.completed && '\u2713'}</div>
                      <span style={{ color: c.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)', textDecoration: c.completed ? 'line-through' : 'none' }}>{c.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}
