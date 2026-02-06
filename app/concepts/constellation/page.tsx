'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { mockItems, priorityConfig, kindConfig, statusConfig, moduleConfig, type MockItem } from '../mock-data';

const TODAY = '2026-02-05';

function fmtDate(d: string) { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

function groupItems(items: MockItem[]) {
  const now: MockItem[] = [], today: MockItem[] = [], week: MockItem[] = [], later: MockItem[] = [];
  items.forEach((i) => {
    if ((i.status === 'in_progress' && (i.priority === 'urgent' || i.priority === 'high'))) { now.push(i); return; }
    if (i.due_date === TODAY) { today.push(i); return; }
    if (i.due_date && i.due_date > TODAY && i.due_date <= '2026-02-08') { week.push(i); return; }
    later.push(i);
  });
  return [
    { key: 'now', label: 'now', items: now },
    { key: 'today', label: 'today', items: today },
    { key: 'week', label: 'this week', items: week },
    { key: 'later', label: 'later', items: later },
  ].filter((g) => g.items.length > 0);
}

export default function ConstellationConcept() {
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [selected, setSelected] = useState<MockItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const contentRef = useRef<HTMLDivElement>(null);

  const openPanel = useCallback((item: MockItem) => { setSelected(item); setPanelOpen(true); }, []);
  const closePanel = useCallback(() => { setPanelOpen(false); setTimeout(() => setSelected(null), 350); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && panelOpen) closePanel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [panelOpen, closePanel]);

  const groups = groupItems(mockItems);
  const navItems = [
    { label: 'My Focus', letter: 'F', active: false },
    { label: 'All Work', letter: 'W', active: true },
    { label: 'Inbox', letter: 'I', active: false },
    { label: 'Projects', letter: 'P', active: false },
    { label: 'Team', letter: 'T', active: false },
  ];

  // Connection lines: find items in same module as hovered item
  const connections: { from: string; to: string }[] = [];
  if (hoveredId) {
    const hItem = mockItems.find((i) => i.id === hoveredId);
    if (hItem?.module) {
      mockItems.forEach((i) => {
        if (i.id !== hoveredId && i.module === hItem.module) connections.push({ from: hoveredId, to: i.id });
      });
    }
  }

  let runIdx = 0;

  return (
    <>
      <style>{`
        @keyframes orb-breathe { 0%,100% { transform:scale(0.95); } 50% { transform:scale(1.05); } }
        @keyframes fade-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .const-card { transition: border-color 200ms, transform 200ms, background 200ms; }
        .const-card:hover { border-color:rgba(255,255,255,0.1)!important; transform:translateY(-1px)!important; background:rgba(255,255,255,0.04)!important; }
        .const-sb-item { transition: all 200ms; }
        .const-sb-item:hover { transform:translateY(-2px); background:rgba(255,255,255,0.05)!important; }
        .const-scroll::-webkit-scrollbar { width:4px; }
        .const-scroll::-webkit-scrollbar-track { background:transparent; }
        .const-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
      `}</style>

      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Vignette orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-15%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, hsla(195,100%,50%,0.12) 0%, transparent 70%)', animation: 'orb-breathe 40s ease-in-out infinite', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', top: '-18%', right: '-12%', width: '48%', height: '48%', borderRadius: '50%', background: 'radial-gradient(circle, hsla(210,80%,45%,0.10) 0%, transparent 70%)', animation: 'orb-breathe 40s ease-in-out infinite 10s', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '-22%', left: '-10%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, hsla(220,60%,40%,0.08) 0%, transparent 70%)', animation: 'orb-breathe 40s ease-in-out infinite 20s', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '-20%', right: '-14%', width: '52%', height: '52%', borderRadius: '50%', background: 'radial-gradient(circle, hsla(190,90%,55%,0.10) 0%, transparent 70%)', animation: 'orb-breathe 40s ease-in-out infinite 30s', filter: 'blur(80px)' }} />
        </div>

        {/* Sidebar */}
        <div onMouseEnter={() => setSidebarHovered(true)} onMouseLeave={() => setSidebarHovered(false)} style={{
          width: sidebarHovered ? 220 : 56, transition: 'width 200ms', height: '100%', flexShrink: 0,
          display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 20, overflow: 'hidden',
        }}>
          <div style={{ padding: sidebarHovered ? '20px 16px' : '20px 0', display: 'flex', alignItems: 'center', justifyContent: sidebarHovered ? 'flex-start' : 'center', height: 60, flexShrink: 0 }}>
            {sidebarHovered ? <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap' }}>BugBee</span>
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>B</div>}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: sidebarHovered ? '8px' : '8px 12px' }}>
            {navItems.map((n) => (
              <div key={n.label} className="const-sb-item" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: sidebarHovered ? '8px 10px' : '0',
                borderRadius: 8, cursor: 'pointer', justifyContent: sidebarHovered ? 'flex-start' : 'center',
                background: n.active ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.2)',
                height: sidebarHovered ? 'auto' : 32, minHeight: 32,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: n.active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: n.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{n.letter}</div>
                {sidebarHovered && <span style={{ fontSize: 13, fontWeight: n.active ? 500 : 400, color: n.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{n.label}</span>}
              </div>
            ))}
          </div>
          <div style={{ padding: sidebarHovered ? '16px' : '16px 0', display: 'flex', justifyContent: sidebarHovered ? 'flex-start' : 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Link href="/concepts" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{sidebarHovered ? '\u2190 Back to Concepts' : '\u2190'}</Link>
          </div>
        </div>

        {/* Main content */}
        <div ref={contentRef} style={{
          flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center',
          transition: 'transform 350ms ease, filter 350ms ease',
          transform: panelOpen ? 'translateX(-200px) scale(0.95)' : 'translateX(0) scale(1)',
          filter: panelOpen ? 'blur(6px)' : 'blur(0px)', zIndex: 10,
        }}>
          <div className="const-scroll" style={{ width: '100%', maxWidth: 680, padding: '48px 24px 120px', overflowY: 'auto', height: '100%' }}>
            <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.95)', margin: '0 0 48px' }}>Wednesday, February 5</h1>
            {groups.map((section, si) => {
              const startIdx = runIdx;
              return (
                <div key={section.key} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', fontWeight: 500, flexShrink: 0 }}>{section.label}</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {section.items.map((item, ii) => {
                      const gi = startIdx + ii; runIdx = gi + 1;
                      const zigzag = gi % 2 === 0 ? 12 : -12;
                      const kc = kindConfig[item.kind]; const pc = priorityConfig[item.priority];
                      const mc = item.module ? moduleConfig[item.module] : null;
                      return (
                        <div key={item.id} ref={(el) => { if (el) cardRefs.current.set(item.id, el); }}
                          className="const-card" onClick={() => openPanel(item)}
                          onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)}
                          style={{
                            transform: `translateX(${zigzag}px)`, background: 'rgba(255,255,255,0.03)',
                            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 20px',
                            cursor: 'pointer', position: 'relative',
                          }}>
                          <div style={{ position: 'absolute', bottom: 0, left: 12, right: 12, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)' }} />
                          <div style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.95)', marginBottom: 10, lineHeight: 1.4 }}>{item.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: kc.bg, color: kc.color }}>{kc.label}</span>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: pc.color }} />
                            {item.due_date && <span style={{ fontSize: 12, color: item.due_date < TODAY ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>{fmtDate(item.due_date)}</span>}
                            {mc && <span style={{ fontSize: 12, color: mc.color, opacity: 0.7 }}>{mc.label}</span>}
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 6 }}>{item.assigned_to}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel backdrop */}
        {panelOpen && <div onClick={closePanel} style={{ position: 'absolute', inset: 0, zIndex: 25 }} />}

        {/* Detail panel */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 520, zIndex: 30,
          transform: panelOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 350ms ease',
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, rgba(0,180,255,0.06) 0%, rgba(0,180,255,0.12) 30%, rgba(0,180,255,0.06) 70%, transparent)' }} />
          {selected && (
            <div className="const-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                <button onClick={closePanel} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{selected.id}</span>
                <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: statusConfig[selected.status].color }}>{statusConfig[selected.status].label}</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.95)', lineHeight: 1.35, margin: '0 0 28px' }}>{selected.title}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 28, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                <MF label="Kind"><span style={{ color: kindConfig[selected.kind].color, fontSize: 13 }}>{kindConfig[selected.kind].label}</span></MF>
                <MF label="Priority"><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: priorityConfig[selected.priority].color }} /><span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{priorityConfig[selected.priority].label}</span></div></MF>
                <MF label="Due Date"><span style={{ color: selected.due_date && selected.due_date < TODAY ? '#ef4444' : 'rgba(255,255,255,0.8)', fontSize: 13 }}>{selected.due_date ? fmtDate(selected.due_date) : 'No date'}</span></MF>
                <MF label="Module"><span style={{ color: selected.module ? moduleConfig[selected.module]?.color : 'rgba(255,255,255,0.3)', fontSize: 13 }}>{selected.module ? moduleConfig[selected.module]?.label : 'None'}</span></MF>
                <MF label="Assigned To"><span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{selected.assignee_name}</span></MF>
                <MF label="Comments"><span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{selected.comment_count} comment{selected.comment_count !== 1 ? 's' : ''}</span></MF>
              </div>
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', margin: '0 0 10px' }}>Description</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{selected.description}</p>
              </div>
              {selected.checklist.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', margin: '0 0 12px' }}>Checklist ({selected.checklist.filter(c => c.completed).length}/{selected.checklist.length})</h3>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 14, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(selected.checklist.filter(c => c.completed).length / selected.checklist.length) * 100}%`, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
                  </div>
                  {selected.checklist.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, marginBottom: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${c.completed ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`, background: c.completed ? 'rgba(16,185,129,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(16,185,129,0.9)', flexShrink: 0 }}>{c.completed && '\u2713'}</div>
                      <span style={{ color: c.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)', textDecoration: c.completed ? 'line-through' : 'none' }}>{c.text}</span>
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
  return (<div><div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>{label}</div>{children}</div>);
}
