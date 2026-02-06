'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { mockItems, priorityConfig, kindConfig, statusConfig, moduleConfig, type MockItem } from '../mock-data';

function isOverdue(item: MockItem) { return item.due_date ? new Date(item.due_date + 'T00:00:00') < new Date('2026-02-05T00:00:00') && item.status !== 'done' : false; }
function isDueToday(item: MockItem) { return item.due_date === '2026-02-05'; }
function fmtDate(d: string | null) { if (!d) return 'No date'; const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

function getEdgeGlow(item: MockItem) {
  if (isOverdue(item)) return 'rgba(239,68,68,0.6)';
  if (isDueToday(item)) return 'rgba(245,158,11,0.5)';
  return 'rgba(59,130,246,0.3)';
}

export default function AquariumConcept() {
  const [selected, setSelected] = useState<MockItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('My Focus');
  const panelRef = useRef<HTMLDivElement>(null);

  const stackItems = mockItems.filter((i) => i.priority === 'urgent' || i.priority === 'high' || isOverdue(i)).slice(0, 4);
  const ribbonItems = mockItems.filter((i) => !stackItems.includes(i));

  const openDetail = useCallback((item: MockItem) => { setSelected(item); setPanelOpen(true); }, []);
  const closeDetail = useCallback(() => { setPanelOpen(false); setTimeout(() => setSelected(null), 400); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && panelOpen) closeDetail(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [panelOpen, closeDetail]);

  const navItems = ['My Focus', 'All Work', 'Inbox', 'Projects', 'Team'];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex' }}>
      <style>{`
        @keyframes orb1 { 0% { transform: translate(0,0) scale(1); } 25% { transform: translate(-3vw,-8vh) scale(1.03); } 50% { transform: translate(2vw,-4vh) scale(0.97); } 75% { transform: translate(-1vw,3vh) scale(1.02); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes orb2 { 0% { transform: translate(0,0) scale(1); } 30% { transform: translate(4vw,-6vh) scale(1.04); } 60% { transform: translate(-2vw,-10vh) scale(0.98); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes orb3 { 0% { transform: translate(0,0) scale(1); } 35% { transform: translate(-5vw,5vh) scale(1.02); } 70% { transform: translate(3vw,-3vh) scale(0.96); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes panelIn { from { opacity:0; transform:scale(1.05) translateX(20px); } to { opacity:1; transform:scale(1) translateX(0); } }
        .aqua-nav:hover { transform:translateY(-2px); background:rgba(255,255,255,0.04)!important; }
        .aqua-tile:hover { transform:translateY(-3px)!important; border-color:rgba(255,255,255,0.12)!important; background:rgba(255,255,255,0.055)!important; }
        .aqua-ribbon::-webkit-scrollbar { display:none; }
      `}</style>

      {/* Orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '65vw', height: '65vw', borderRadius: '50%', background: 'radial-gradient(circle, hsla(195,100%,50%,0.12) 0%, transparent 65%)', filter: 'blur(80px)', animation: 'orb1 50s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '40%', right: '5%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, hsla(210,80%,40%,0.08) 0%, transparent 65%)', filter: 'blur(90px)', animation: 'orb2 58s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '30%', width: '70vw', height: '70vw', borderRadius: '50%', background: 'radial-gradient(circle, hsla(220,40%,35%,0.06) 0%, transparent 60%)', filter: 'blur(100px)', animation: 'orb3 62s ease-in-out infinite' }} />
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
            <button key={label} className="aqua-nav" onClick={() => setActiveNav(label)} style={{
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
        <Link href="/concepts" className="aqua-nav" style={{
          display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none',
          padding: '10px 12px', borderRadius: 8, marginTop: 'auto',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02), inset 0 -1px 1px rgba(0,0,0,0.05)',
        }}>Back to Concepts</Link>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1, height: '100%', overflow: 'auto', position: 'relative', zIndex: 10,
        transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1), filter 400ms cubic-bezier(0.4,0,0.2,1)',
        transform: panelOpen ? 'scale(0.92)' : 'scale(1)',
        filter: panelOpen ? 'blur(8px)' : 'blur(0px)',
        transformOrigin: 'center', pointerEvents: panelOpen ? 'none' : 'auto',
      }}>
        <div style={{ padding: '40px 48px 60px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: 'rgba(255,255,255,0.95)', margin: 0 }}>My Focus</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: '6px 0 0' }}>Wednesday, February 5</p>
          </div>

          {/* Hero card stack */}
          {/* Hero card stack — front card on top, back cards peek out below */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 540, margin: '0 auto', marginBottom: 56 }}>
            {/* Back cards rendered first (behind), staggered below the front card */}
            <div style={{ position: 'relative' }}>
              {/* Invisible spacer matching the back cards' peek area */}
              <div style={{ height: (stackItems.length - 1) * 14 }} />

              {/* Back cards — absolutely positioned, peeking from bottom */}
              {stackItems.slice(1).map((item, i) => {
                const depth = i + 1;
                return (
                  <div key={item.id} style={{
                    position: 'absolute', bottom: -depth * 14, left: depth * 8, right: depth * 8, height: 180,
                    background: `hsl(222, ${25 + depth * 2}%, ${9 + depth}%)`,
                    border: `1px solid rgba(255,255,255,${0.06 - depth * 0.012})`,
                    borderRadius: 16, overflow: 'hidden', zIndex: stackItems.length - depth,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    {/* Edge glow only — no text */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '16px 0 0 16px', background: getEdgeGlow(item), opacity: 0.5 - depth * 0.1 }} />
                  </div>
                );
              })}

              {/* Front card — in normal flow, sits on top */}
              {stackItems.length > 0 && (() => {
                const item = stackItems[0];
                return (
                  <div onClick={() => openDetail(item)} style={{
                    position: 'relative', zIndex: stackItems.length,
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
                    cursor: 'pointer', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                    transition: 'transform 300ms, box-shadow 300ms',
                  }}>
                    {/* Edge glow line */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '16px 0 0 16px', background: getEdgeGlow(item), boxShadow: `0 0 20px ${getEdgeGlow(item)}` }} />
                    {/* Edge glow ambient */}
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${getEdgeGlow(item).replace(')', ',0.08)')}, transparent 30%)`, pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 1, padding: '22px 24px 20px 28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6, color: kindConfig[item.kind].color, background: kindConfig[item.kind].bg }}>{kindConfig[item.kind].label}</span>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6, color: priorityConfig[item.priority].color, background: priorityConfig[item.priority].bg }}>{priorityConfig[item.priority].label}</span>
                        <span style={{ flex: 1 }} />
                        <span style={{ fontSize: 12, color: isOverdue(item) ? 'rgba(239,68,68,0.9)' : isDueToday(item) ? 'rgba(245,158,11,0.9)' : 'rgba(255,255,255,0.4)', fontWeight: isOverdue(item) || isDueToday(item) ? 500 : 400 }}>
                          {isOverdue(item) ? 'Overdue \u00B7 ' : isDueToday(item) ? 'Today \u00B7 ' : ''}{fmtDate(item.due_date)}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.95)', margin: '0 0 14px', lineHeight: 1.35 }}>{item.title}</h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: '0 0 16px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{item.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {item.module && moduleConfig[item.module] && <span style={{ fontSize: 12, color: moduleConfig[item.module].color, opacity: 0.8 }}>{moduleConfig[item.module].label}</span>}
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'rgba(59,130,246,0.9)' }}>{item.assigned_to}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Ribbon label */}
          <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>Everything Else</div>

          {/* Horizontal ribbon */}
          <div className="aqua-ribbon" style={{ display: 'flex', gap: 12, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {ribbonItems.map((item) => (
              <div key={item.id} className="aqua-tile" onClick={() => openDetail(item)} style={{
                width: 160, minWidth: 160, height: 100, background: 'rgba(255,255,255,0.035)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', transition: 'all 200ms', flexShrink: 0,
              }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, borderRadius: '12px 0 0 12px', background: getEdgeGlow(item), opacity: 0.6 }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{item.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityConfig[item.priority].color, boxShadow: `0 0 6px ${priorityConfig[item.priority].color}` }} />
                  <span style={{ fontSize: 10, color: kindConfig[item.kind].color, fontWeight: 500, opacity: 0.8 }}>{kindConfig[item.kind].label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Detail panel */}
      {selected && (
        <div ref={panelRef} onClick={(e) => { if (e.target === e.currentTarget) closeDetail(); }} style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, zIndex: 50,
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)', boxShadow: '-8px 0 40px rgba(0,0,0,0.3)',
          overflowY: 'auto', animation: 'panelIn 400ms cubic-bezier(0.16,1,0.3,1) forwards',
        }}>
          <div style={{ padding: '32px 28px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button onClick={closeDetail} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>&times;</button>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: 8 }}>{selected.id}</div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.95)', margin: '0 0 24px', lineHeight: 1.35 }}>{selected.title}</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusConfig[selected.status].color, boxShadow: `0 0 6px ${statusConfig[selected.status].color}` }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{statusConfig[selected.status].label}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: 28, padding: '18px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
              <Meta label="Priority"><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityConfig[selected.priority].color }} /><span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{priorityConfig[selected.priority].label}</span></div></Meta>
              <Meta label="Due Date"><span style={{ fontSize: 14, fontWeight: 500, color: isOverdue(selected) ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.85)' }}>{fmtDate(selected.due_date)}</span></Meta>
              <Meta label="Module"><span style={{ fontSize: 14, fontWeight: 500, color: selected.module && moduleConfig[selected.module] ? moduleConfig[selected.module].color : 'rgba(255,255,255,0.6)' }}>{selected.module && moduleConfig[selected.module] ? moduleConfig[selected.module].label : 'None'}</span></Meta>
              <Meta label="Assignee"><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(59,130,246,0.9)' }}>{selected.assigned_to}</div><span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{selected.assignee_name}</span></div></Meta>
            </div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>{selected.description}</p>
            </div>
            {selected.checklist.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Checklist ({selected.checklist.filter(c => c.completed).length}/{selected.checklist.length})</div>
                <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ width: `${(selected.checklist.filter(c => c.completed).length / selected.checklist.length) * 100}%`, height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#3b82f6,#00D9FF)', transition: 'width 300ms' }} />
                </div>
                {selected.checklist.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: c.completed ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.15)', background: c.completed ? 'rgba(59,130,246,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {c.completed && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5L4 7L8 3" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                    </div>
                    <span style={{ fontSize: 13, color: c.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.7)', textDecoration: c.completed ? 'line-through' : 'none' }}>{c.text}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{selected.comment_count} comment{selected.comment_count !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>{children}</div>);
}
