'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { mockItems, priorityConfig, kindConfig, statusConfig, moduleConfig, type MockItem } from '../mock-data';

const TODAY = '2026-02-05';

function isOverdue(item: MockItem) { return item.due_date ? new Date(item.due_date + 'T00:00:00') < new Date(TODAY + 'T00:00:00') && item.status !== 'done' : false; }
function isDueToday(item: MockItem) { return item.due_date === TODAY; }
function fmtDate(d: string | null) { if (!d) return 'No date'; const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

function getEdgeGlow(item: MockItem) {
  if (isOverdue(item)) return { color: 'rgba(239,68,68,0.7)', shadow: 'rgba(239,68,68,0.3)', strip: 'rgba(239,68,68,0.5)' };
  if (isDueToday(item)) return { color: 'rgba(245,158,11,0.6)', shadow: 'rgba(245,158,11,0.25)', strip: 'rgba(245,158,11,0.4)' };
  if (item.priority === 'urgent') return { color: 'rgba(239,68,68,0.6)', shadow: 'rgba(239,68,68,0.2)', strip: 'rgba(239,68,68,0.4)' };
  if (item.priority === 'high') return { color: 'rgba(249,115,22,0.5)', shadow: 'rgba(249,115,22,0.2)', strip: 'rgba(249,115,22,0.35)' };
  return { color: 'rgba(56,189,248,0.35)', shadow: 'rgba(56,189,248,0.12)', strip: 'rgba(56,189,248,0.25)' };
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

export default function DriftV2Concept() {
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
        @keyframes dv2-orb1 {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-4vw, -6vh) scale(1.04); }
          50% { transform: translate(2vw, -3vh) scale(0.97); }
          75% { transform: translate(-2vw, 4vh) scale(1.02); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes dv2-orb2 {
          0% { transform: translate(0, 0) scale(1); }
          30% { transform: translate(5vw, -8vh) scale(1.05); }
          60% { transform: translate(-3vw, -4vh) scale(0.96); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes dv2-orb3 {
          0% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-6vw, 6vh) scale(1.03); }
          70% { transform: translate(4vw, -2vh) scale(0.97); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .dv2-card {
          transition: transform 280ms cubic-bezier(0.4,0,0.2,1),
                      border-color 280ms cubic-bezier(0.4,0,0.2,1),
                      background 280ms cubic-bezier(0.4,0,0.2,1),
                      box-shadow 400ms cubic-bezier(0.4,0,0.2,1);
        }
        .dv2-card:hover {
          transform: translateY(-3px) !important;
        }
        .dv2-scroll::-webkit-scrollbar { width: 4px; }
        .dv2-scroll::-webkit-scrollbar-track { background: transparent; }
        .dv2-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
        .dv2-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
      `}</style>

      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Drifting orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '5%', left: '20%', width: '55vw', height: '55vw', maxWidth: 650, maxHeight: 650,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(195,100%,55%,0.10) 0%, transparent 65%)',
            filter: 'blur(80px)', animation: 'dv2-orb1 54s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', top: '35%', right: '5%', width: '50vw', height: '50vw', maxWidth: 580, maxHeight: 580,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(210,80%,50%,0.07) 0%, transparent 65%)',
            filter: 'blur(90px)', animation: 'dv2-orb2 62s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '0%', left: '25%', width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(220,50%,40%,0.05) 0%, transparent 60%)',
            filter: 'blur(100px)', animation: 'dv2-orb3 58s ease-in-out infinite',
          }} />
        </div>

        {/* PERMANENTLY EXPOSED glass sidebar */}
        <div style={{
          width: 220, height: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.03), 4px 0 24px rgba(0,0,0,0.15)',
          position: 'relative', zIndex: 20, overflow: 'hidden',
        }}>
          {/* Glass sheen overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(165deg, rgba(255,255,255,0.04) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.015) 100%)',
          }} />

          {/* Logo */}
          <div style={{
            padding: '24px 20px', display: 'flex', alignItems: 'center', height: 68, flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            position: 'relative', zIndex: 1,
          }}>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.88)' }}>BugBee</span>
          </div>

          {/* Nav items — etched glass buttons */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, padding: '12px 10px', position: 'relative', zIndex: 1 }}>
            {navItems.map((n) => (
              <button
                key={n.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  border: 'none', width: '100%', textAlign: 'left',
                  // Etched glass effect — pressed INTO the glass surface
                  background: n.active
                    ? 'rgba(56,189,248,0.06)'
                    : 'rgba(255,255,255,0.018)',
                  boxShadow: n.active
                    ? `inset 0 2px 4px rgba(0,0,0,0.25),
                       inset 0 -1px 0 rgba(56,189,248,0.08),
                       inset 0 1px 0 rgba(0,0,0,0.15),
                       0 1px 0 rgba(255,255,255,0.04)`
                    : `inset 0 2px 3px rgba(0,0,0,0.2),
                       inset 0 -1px 0 rgba(255,255,255,0.04),
                       inset 0 1px 0 rgba(0,0,0,0.12),
                       0 1px 0 rgba(255,255,255,0.03)`,
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseEnter={(e) => {
                  if (!n.active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
                    e.currentTarget.style.boxShadow = `inset 0 2px 4px rgba(0,0,0,0.22), inset 0 -1px 0 rgba(255,255,255,0.06), inset 0 1px 0 rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.04)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!n.active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.018)';
                    e.currentTarget.style.boxShadow = `inset 0 2px 3px rgba(0,0,0,0.2), inset 0 -1px 0 rgba(255,255,255,0.04), inset 0 1px 0 rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.03)`;
                  }
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: n.active ? 'rgba(56,189,248,0.10)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${n.active ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.05)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
                  color: n.active ? 'rgba(56,189,248,0.9)' : 'rgba(255,255,255,0.35)',
                  // Inner etched effect on letter icon
                  boxShadow: `inset 0 1px 2px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.03)`,
                }}>{n.letter}</div>
                <span style={{
                  fontSize: 13, fontWeight: n.active ? 500 : 400,
                  color: n.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.01em',
                }}>{n.label}</span>
              </button>
            ))}
          </div>

          {/* Back link */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            position: 'relative', zIndex: 1,
          }}>
            <Link href="/concepts" style={{
              fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none',
              transition: 'color 200ms',
            }}>
              &larr; Back to Concepts
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
          <div className="dv2-scroll" style={{ width: '100%', maxWidth: 820, padding: '48px 24px 120px', overflowY: 'auto', height: '100%' }}>
            {/* Header */}
            <div style={{ marginBottom: 44 }}>
              <h1 style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.95)', margin: 0 }}>
                My Focus
              </h1>
              <p style={{ fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                Wednesday, February 5
              </p>
            </div>

            {/* Temporal groups with Prism-style wide cards */}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {section.items.map((item) => {
                    const glow = getEdgeGlow(item);
                    const isHovered = hoveredId === item.id;
                    const kc = kindConfig[item.kind];
                    const pc = priorityConfig[item.priority];
                    const mc = item.module ? moduleConfig[item.module] : null;

                    return (
                      <div
                        key={item.id}
                        className="dv2-card"
                        onClick={() => openPanel(item)}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                          position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                          padding: '20px 24px 18px 26px',
                          // Prism-style glass with warm/cool tinting based on urgency
                          background: isHovered
                            ? 'rgba(255,255,255,0.055)'
                            : 'rgba(255,255,255,0.03)',
                          backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                          border: `1px solid rgba(255,255,255,${isHovered ? 0.14 : 0.06})`,
                          // EVEN illumination on hover — uniform glow, no radial hotspot
                          boxShadow: isHovered
                            ? `0 8px 32px rgba(0,0,0,0.2),
                               0 0 1px rgba(255,255,255,0.15),
                               inset 0 0 0 1px rgba(255,255,255,0.04),
                               inset 0 1px 0 rgba(255,255,255,0.08),
                               inset 0 -1px 0 rgba(255,255,255,0.03)`
                            : `0 2px 12px rgba(0,0,0,0.12),
                               inset 0 1px 0 rgba(255,255,255,0.04)`,
                        }}
                      >
                        {/* Edge glow strip (Drift signature) */}
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                          borderRadius: '14px 0 0 14px',
                          background: glow.color,
                          boxShadow: isHovered ? `0 0 20px ${glow.shadow}, 0 0 6px ${glow.shadow}` : `0 0 10px ${glow.shadow}`,
                          transition: 'box-shadow 280ms',
                        }} />

                        {/* EVEN hover illumination — flat overlay instead of radial gradient */}
                        <div style={{
                          position: 'absolute', inset: 0, pointerEvents: 'none',
                          // Uniform wash: slight brightness increase everywhere, plus soft edge glow from left strip
                          background: `linear-gradient(90deg, ${glow.strip} 0%, rgba(255,255,255,0.02) 15%, rgba(255,255,255,0.02) 85%, rgba(255,255,255,0.01) 100%)`,
                          opacity: isHovered ? 0.6 : 0,
                          transition: 'opacity 300ms cubic-bezier(0.4,0,0.2,1)',
                        }} />

                        {/* Card content — Prism layout */}
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          {/* Top row: kind badge + priority + date */}
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

                          {/* Title — 2-line clamp like Prism */}
                          <h3 style={{
                            fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.92)',
                            margin: '0 0 10px', lineHeight: 1.4,
                            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                          }}>{item.title}</h3>

                          {/* Description preview */}
                          <p style={{
                            fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, margin: '0 0 12px',
                            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                          }}>{item.description}</p>

                          {/* Bottom row: module + checklist + assignee */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {mc && <span style={{ fontSize: 11, color: mc.color, opacity: 0.65 }}>{mc.label}</span>}
                              {item.checklist.length > 0 && (
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                                  {item.checklist.filter(c => c.completed).length}/{item.checklist.length}
                                </span>
                              )}
                            </div>
                            <div style={{
                              width: 26, height: 26, borderRadius: '50%',
                              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
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
            <div className="dv2-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
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
