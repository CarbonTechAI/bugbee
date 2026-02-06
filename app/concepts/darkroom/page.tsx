'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { mockItems, priorityConfig, kindConfig, statusConfig, moduleConfig, type MockItem } from '../mock-data';

function fmtDate(d: string) { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function isOverdue(d: string | null) { return d ? new Date(d + 'T00:00:00') < new Date('2026-02-05T00:00:00') : false; }

export default function DarkroomConcept() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<MockItem | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [activeNav, setActiveNav] = useState('My Focus');
  const mainRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => { setMousePos({ x: e.clientX, y: e.clientY }); }, []);

  const handleOpen = useCallback((item: MockItem) => { setSelected(item); requestAnimationFrame(() => setPanelVisible(true)); }, []);
  const handleClose = useCallback(() => { setPanelVisible(false); setTimeout(() => setSelected(null), 350); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && selected) handleClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selected, handleClose]);

  const navItems = ['My Focus', 'All Work', 'Inbox', 'Projects', 'Team'];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden' }} onMouseMove={handleMouseMove}>
      <style>{`
        @keyframes orbD1 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(2vw,-1vh) scale(1.01); } }
        @keyframes orbD2 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(-1vw,1vh) scale(0.99); } }
        .dr-card { background:rgba(255,255,255,0.015); border:1px solid transparent; border-radius:10px; padding:16px; cursor:pointer; transition:all 200ms; position:relative; break-inside:avoid; margin-bottom:12px; }
        .dr-card:hover { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.08); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); transform:translateY(-1px); }
        .dr-card .dr-title { color:rgba(255,255,255,0.4); transition:color 200ms; font-size:14px; font-weight:500; line-height:1.45; margin:0 0 8px; }
        .dr-card:hover .dr-title { color:rgba(255,255,255,0.95); }
        .dr-card .dr-meta { color:rgba(255,255,255,0.25); transition:color 200ms; font-size:12px; display:flex; align-items:center; gap:8px; }
        .dr-card:hover .dr-meta { color:rgba(255,255,255,0.5); }
        .dr-card .dr-kind { opacity:0.4; transition:opacity 200ms; font-size:11px; padding:2px 7px; border-radius:6px; display:inline-block; margin-bottom:10px; font-weight:500; }
        .dr-card:hover .dr-kind { opacity:1; }
        .dr-card .dr-extra { max-height:0; overflow:hidden; opacity:0; transition:max-height 250ms,opacity 200ms,margin 200ms; margin-top:0; }
        .dr-card:hover .dr-extra { max-height:40px; opacity:1; margin-top:10px; }
        .dr-nav { padding:8px 14px; border-radius:8px; font-size:13px; cursor:pointer; transition:all 150ms; color:rgba(255,255,255,0.35); background:transparent; border:none; width:100%; text-align:left; font-family:inherit; box-shadow:inset 0 1px 2px rgba(0,0,0,0.2),inset 0 -1px 1px rgba(255,255,255,0.02); }
        .dr-nav:hover { color:rgba(255,255,255,0.7); background:rgba(255,255,255,0.03); transform:translateY(-2px); }
        .dr-nav.active { color:rgba(255,255,255,0.9); background:rgba(255,255,255,0.04); }
      `}</style>

      {/* Orbs */}
      <div style={{ position: 'fixed', top: '-20vh', left: '-20vw', width: '80vw', height: '80vw', borderRadius: '50%', background: 'hsla(195,100%,50%,0.06)', filter: 'blur(100px)', animation: 'orbD1 120s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-25vh', right: '-20vw', width: '80vw', height: '80vw', borderRadius: '50%', background: 'hsla(220,60%,40%,0.05)', filter: 'blur(100px)', animation: 'orbD2 120s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />

      {/* Cursor light */}
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, rgba(0,200,255,0.05), transparent)`, pointerEvents: 'none', zIndex: 10, transition: 'background 50ms' }} />

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'relative', zIndex: 5,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.02em', marginBottom: 8, padding: '0 14px' }}>BugBee</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 14px', marginBottom: 28 }}>The Darkroom</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navItems.map((item) => (
            <button key={item} className={`dr-nav ${activeNav === item ? 'active' : ''}`} onClick={() => setActiveNav(item)}>{item}</button>
          ))}
        </nav>
        <Link href="/concepts" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', padding: '8px 14px', borderRadius: 8, display: 'block', transition: 'color 150ms' }}>Back to Concepts</Link>
      </aside>

      {/* Main content */}
      <main ref={mainRef} style={{
        flex: 1, overflow: 'auto', padding: '32px 36px', position: 'relative', zIndex: 2, transformOrigin: 'center',
        transition: 'filter 350ms, transform 350ms',
        filter: selected ? 'blur(6px) brightness(0.3)' : 'none',
        transform: selected ? 'scale(0.95)' : 'none',
      }}>
        {selected && <div style={{ position: 'fixed', inset: 0, background: 'rgba(180,60,30,0.03)', pointerEvents: 'none', zIndex: 3 }} />}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0, letterSpacing: '-0.02em' }}>{activeNav}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '6px 0 0' }}>Wednesday, February 5, 2026</p>
        </div>
        <div style={{ columnCount: 3, columnGap: 16, maxWidth: 1100 }}>
          {mockItems.map((item) => {
            const kind = kindConfig[item.kind]; const pri = priorityConfig[item.priority];
            const mod = item.module ? moduleConfig[item.module] : null;
            const over = isOverdue(item.due_date);
            const prog = item.checklist.length > 0 ? { done: item.checklist.filter(c => c.completed).length, total: item.checklist.length } : null;
            return (
              <div key={item.id} className="dr-card" onClick={() => handleOpen(item)}>
                <span className="dr-kind" style={{ color: kind.color, background: kind.bg }}>{kind.label}</span>
                <div className="dr-title">{item.title}</div>
                <div className="dr-meta">
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: pri.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11 }}>{pri.label}</span>
                  {item.due_date && <><span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span><span style={{ color: over ? 'rgba(239,68,68,0.7)' : 'inherit' }}>{over ? 'Overdue' : fmtDate(item.due_date)}</span></>}
                  {prog && <><span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span><span>{prog.done}/{prog.total}</span></>}
                </div>
                <div className="dr-extra">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    {mod && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: mod.color, display: 'inline-block' }} />{mod.label}</span>}
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{item.assigned_to}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Overlay */}
      {selected && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: panelVisible ? 1 : 0, transition: 'opacity 350ms', zIndex: 50 }} onClick={handleClose} />}

      {/* Detail panel */}
      {selected && (() => {
        const item = selected; const kind = kindConfig[item.kind]; const pri = priorityConfig[item.priority];
        const st = statusConfig[item.status]; const mod = item.module ? moduleConfig[item.module] : null;
        const prog = item.checklist.length > 0 ? { done: item.checklist.filter(c => c.completed).length, total: item.checklist.length } : null;
        const over = isOverdue(item.due_date);
        return (
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, zIndex: 51,
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: '32px 28px',
            transition: 'transform 350ms cubic-bezier(0.16,1,0.3,1), opacity 300ms',
            transform: panelVisible ? 'translateX(0)' : 'translateX(100%)', opacity: panelVisible ? 1 : 0,
          }} onClick={(e) => e.stopPropagation()}>
            <button onClick={handleClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>&#x2715;</button>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 6, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{item.id}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, color: kind.color, background: kind.bg, fontWeight: 500 }}>{kind.label}</span>
              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, color: st.color, background: `${st.color}18`, fontWeight: 500 }}>{st.label}</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.95)', margin: '0 0 24px', lineHeight: 1.35, paddingRight: 40 }}>{item.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: 28, padding: 18, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
              <MF label="Priority"><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: pri.color }} />{pri.label}</div></MF>
              <MF label="Due Date"><div style={{ fontSize: 13, color: over ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.8)' }}>{item.due_date ? (over ? `Overdue (${fmtDate(item.due_date)})` : fmtDate(item.due_date)) : 'No date'}</div></MF>
              <MF label="Module"><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{mod && <span style={{ width: 6, height: 6, borderRadius: '50%', background: mod.color }} />}{mod ? mod.label : 'None'}</div></MF>
              <MF label="Assignee"><div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}><span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{item.assigned_to}</span>{item.assignee_name}</div></MF>
            </div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</div>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{item.description}</p>
            </div>
            {item.checklist.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Checklist</span>{prog && <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'none', letterSpacing: 'normal' }}>{prog.done} of {prog.total}</span>}
                </div>
                {prog && <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(prog.done / prog.total) * 100}%`, background: prog.done === prog.total ? '#10b981' : 'rgba(0,200,255,0.5)', borderRadius: 2 }} /></div>}
                {item.checklist.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${c.completed ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`, background: c.completed ? 'rgba(16,185,129,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {c.completed && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5L4.5 7.5L8 3" stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                    </div>
                    <span style={{ color: c.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)', textDecoration: c.completed ? 'line-through' : 'none' }}>{c.text}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Comments</div>
            <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              {item.comment_count} comment{item.comment_count !== 1 ? 's' : ''} on this item
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function MF({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>{children}</div>);
}
