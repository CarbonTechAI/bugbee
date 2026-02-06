'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { mockItems, priorityConfig, kindConfig, statusConfig, moduleConfig, type MockItem } from '../mock-data';

const TODAY = '2026-02-05';

function isOverdue(item: MockItem) { return item.due_date ? new Date(item.due_date + 'T00:00:00') < new Date(TODAY + 'T00:00:00') && item.status !== 'done' : false; }
function isDueToday(item: MockItem) { return item.due_date === TODAY; }
function fmtDate(d: string | null) { if (!d) return 'No date'; const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

function getEdgeColor(item: MockItem) {
  if (isOverdue(item)) return { bar: 'rgba(239,68,68,0.65)', glow: 'rgba(239,68,68,0.2)' };
  if (isDueToday(item)) return { bar: 'rgba(245,158,11,0.55)', glow: 'rgba(245,158,11,0.15)' };
  if (item.priority === 'urgent') return { bar: 'rgba(239,68,68,0.55)', glow: 'rgba(239,68,68,0.15)' };
  if (item.priority === 'high') return { bar: 'rgba(249,115,22,0.45)', glow: 'rgba(249,115,22,0.12)' };
  return { bar: 'rgba(56,189,248,0.3)', glow: 'rgba(56,189,248,0.08)' };
}

// Sort by urgency weight — no section headers, just visual spacing gaps
function sortByUrgency(items: MockItem[]): { items: MockItem[]; gapAfter: Set<number> } {
  const urgent: MockItem[] = [];
  const high: MockItem[] = [];
  const normal: MockItem[] = [];
  const low: MockItem[] = [];

  items.forEach((i) => {
    if (i.priority === 'urgent' || isOverdue(i)) urgent.push(i);
    else if (i.priority === 'high' || isDueToday(i)) high.push(i);
    else if (i.priority === 'normal') normal.push(i);
    else low.push(i);
  });

  const sorted = [...urgent, ...high, ...normal, ...low];
  const gapAfter = new Set<number>();
  let idx = 0;
  if (urgent.length > 0) { idx += urgent.length; gapAfter.add(idx - 1); }
  if (high.length > 0) { idx += high.length; gapAfter.add(idx - 1); }
  if (normal.length > 0) { idx += normal.length; gapAfter.add(idx - 1); }

  return { items: sorted, gapAfter };
}

export default function CurrentConcept() {
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [selected, setSelected] = useState<MockItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const openPanel = useCallback((item: MockItem) => { setSelected(item); setPanelOpen(true); }, []);
  const closePanel = useCallback(() => { setPanelOpen(false); setTimeout(() => setSelected(null), 400); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && panelOpen) closePanel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [panelOpen, closePanel]);

  const { items: sortedItems, gapAfter } = sortByUrgency(mockItems);

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
        @keyframes current-orb1 {
          0% { transform: translate(0,0) scale(1); }
          20% { transform: translate(-8vw, -12vh) scale(1.06); }
          45% { transform: translate(5vw, -6vh) scale(0.95); }
          70% { transform: translate(-3vw, 8vh) scale(1.04); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes current-orb2 {
          0% { transform: translate(0,0) scale(1); }
          30% { transform: translate(10vw, 8vh) scale(1.08); }
          55% { transform: translate(-6vw, -4vh) scale(0.94); }
          80% { transform: translate(4vw, -10vh) scale(1.03); }
          100% { transform: translate(0,0) scale(1); }
        }
        .current-row {
          transition: transform 250ms cubic-bezier(0.4,0,0.2,1), background 250ms, border-color 250ms, box-shadow 250ms;
        }
        .current-row:hover {
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.1) !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05) !important;
        }
        .current-sb { transition: all 200ms; }
        .current-sb:hover { transform: translateY(-1px); background: rgba(255,255,255,0.05) !important; }
        .current-scroll::-webkit-scrollbar { width: 4px; }
        .current-scroll::-webkit-scrollbar-track { background: transparent; }
        .current-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
      `}</style>

      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* 2 large traveling orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '0%', left: '10%', width: '70vw', height: '70vw', maxWidth: 800, maxHeight: 800,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(195,100%,55%,0.09) 0%, transparent 60%)',
            filter: 'blur(90px)', animation: 'current-orb1 65s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', right: '0%', width: '75vw', height: '75vw', maxWidth: 850, maxHeight: 850,
            borderRadius: '50%', background: 'radial-gradient(circle, hsla(210,70%,45%,0.07) 0%, transparent 60%)',
            filter: 'blur(100px)', animation: 'current-orb2 72s ease-in-out infinite',
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
              <div key={n.label} className="current-sb" style={{
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
          <div style={{ padding: sidebarHovered ? '16px' : '16px 0', display: 'flex', justifyContent: sidebarHovered ? 'flex-start' : 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <Link href="/concepts" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{sidebarHovered ? '\u2190 Back to Concepts' : '\u2190'}</Link>
          </div>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center',
          transition: 'transform 350ms cubic-bezier(0.4,0,0.2,1), filter 350ms cubic-bezier(0.4,0,0.2,1)',
          transform: panelOpen ? 'translateX(-180px) scale(0.96)' : 'translateX(0) scale(1)',
          filter: panelOpen ? 'blur(8px)' : 'blur(0px)', zIndex: 10,
        }}>
          <div className="current-scroll" style={{ width: '100%', maxWidth: 620, padding: '48px 24px 120px', overflowY: 'auto', height: '100%' }}>
            {/* Header */}
            <div style={{ marginBottom: 48 }}>
              <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.92)', margin: 0 }}>My Focus</h1>
              <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.28)', marginTop: 6 }}>Wednesday, February 5</p>
            </div>

            {/* Continuous urgency-weighted list with zigzag stagger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedItems.map((item, idx) => {
                const edge = getEdgeColor(item);
                const zigzag = idx % 2 === 0 ? 8 : -8;
                const isHovered = hoveredId === item.id;
                const kc = kindConfig[item.kind];
                const mc = item.module ? moduleConfig[item.module] : null;

                return (
                  <div key={item.id}>
                    <div
                      className="current-row"
                      onClick={() => openPanel(item)}
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        transform: `translateX(${zigzag}px)`,
                        position: 'relative', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.025)',
                        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                        padding: '12px 16px 12px 18px',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                    >
                      {/* Edge glow */}
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2.5,
                        borderRadius: '10px 0 0 10px', background: edge.bar,
                        boxShadow: isHovered ? `0 0 16px ${edge.glow}` : 'none',
                        transition: 'box-shadow 250ms',
                      }} />

                      {/* Priority dot */}
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: priorityConfig[item.priority].color,
                        boxShadow: `0 0 6px ${priorityConfig[item.priority].color}`,
                      }} />

                      {/* Kind badge */}
                      <span style={{
                        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                        color: kc.color, minWidth: 44, flexShrink: 0,
                      }}>{kc.label}</span>

                      {/* Title */}
                      <span style={{
                        flex: 1, fontSize: 13, fontWeight: 450, color: 'rgba(255,255,255,0.88)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{item.title}</span>

                      {/* Module */}
                      {mc && <span style={{ fontSize: 11, color: mc.color, opacity: 0.6, flexShrink: 0 }}>{mc.label}</span>}

                      {/* Due */}
                      {item.due_date && (
                        <span style={{
                          fontSize: 11, flexShrink: 0,
                          color: isOverdue(item) ? 'rgba(239,68,68,0.8)' : isDueToday(item) ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.3)',
                        }}>{fmtDate(item.due_date)}</span>
                      )}

                      {/* Assignee */}
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.45)',
                      }}>{item.assigned_to}</div>
                    </div>

                    {/* Gap between priority tiers */}
                    {gapAfter.has(idx) && <div style={{ height: 16 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel backdrop */}
        {panelOpen && <div onClick={closePanel} style={{ position: 'absolute', inset: 0, zIndex: 25 }} />}

        {/* Detail panel */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 500, zIndex: 30,
          transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 350ms cubic-bezier(0.16,1,0.3,1)',
          background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 2,
            background: 'linear-gradient(180deg, rgba(56,189,248,0.03) 0%, rgba(56,189,248,0.12) 30%, rgba(56,189,248,0.12) 70%, rgba(56,189,248,0.03) 100%)',
          }} />

          {selected && (
            <div className="current-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <button onClick={closePanel} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{selected.id}</span>
                <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: statusConfig[selected.status].color }}>{statusConfig[selected.status].label}</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.95)', lineHeight: 1.35, margin: '0 0 24px' }}>{selected.title}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 28, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                <MF label="Kind"><span style={{ color: kindConfig[selected.kind].color, fontSize: 13 }}>{kindConfig[selected.kind].label}</span></MF>
                <MF label="Priority"><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: priorityConfig[selected.priority].color }} /><span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{priorityConfig[selected.priority].label}</span></div></MF>
                <MF label="Due Date"><span style={{ color: selected.due_date && isOverdue(selected) ? '#ef4444' : 'rgba(255,255,255,0.8)', fontSize: 13 }}>{selected.due_date ? fmtDate(selected.due_date) : 'No date'}</span></MF>
                <MF label="Module"><span style={{ color: selected.module ? moduleConfig[selected.module]?.color : 'rgba(255,255,255,0.3)', fontSize: 13 }}>{selected.module ? moduleConfig[selected.module]?.label : 'None'}</span></MF>
                <MF label="Assigned To"><span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{selected.assignee_name}</span></MF>
                <MF label="Comments"><span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{selected.comment_count} comment{selected.comment_count !== 1 ? 's' : ''}</span></MF>
              </div>
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', margin: '0 0 10px' }}>Description</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{selected.description}</p>
              </div>
              {selected.checklist.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', margin: '0 0 12px' }}>Checklist ({selected.checklist.filter(c => c.completed).length}/{selected.checklist.length})</h3>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 14, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(selected.checklist.filter(c => c.completed).length / selected.checklist.length) * 100}%`, background: 'linear-gradient(90deg, rgba(56,189,248,0.6), rgba(56,189,248,0.3))', borderRadius: 2 }} />
                  </div>
                  {selected.checklist.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, marginBottom: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1px solid ${c.completed ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`, background: c.completed ? 'rgba(16,185,129,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(16,185,129,0.9)' }}>{c.completed && '\u2713'}</div>
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

function MF({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>{label}</div>{children}</div>);
}
