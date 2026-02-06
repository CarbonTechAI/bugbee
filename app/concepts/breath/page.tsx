'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { mockItems, priorityConfig, kindConfig, statusConfig, moduleConfig, type MockItem } from '../mock-data';

type Group = 'overdue' | 'today' | 'this_week' | 'later';

function getGroup(item: MockItem): Group {
  if (item.status === 'done') return 'later';
  if (!item.due_date) return 'later';
  const today = new Date('2026-02-05T00:00:00');
  const due = new Date(item.due_date + 'T00:00:00');
  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  const endOfWeek = new Date('2026-02-08T23:59:59');
  if (due <= endOfWeek) return 'this_week';
  return 'later';
}

const groupOrder: Group[] = ['overdue', 'today', 'this_week', 'later'];
const groupLabels: Record<Group, string> = { overdue: 'overdue', today: 'today', this_week: 'this week', later: 'later' };

function groupItems(items: MockItem[]) {
  const g: Record<Group, MockItem[]> = { overdue: [], today: [], this_week: [], later: [] };
  items.forEach((i) => g[getGroup(i)].push(i));
  return groupOrder.filter((k) => g[k].length > 0).map((k) => ({ group: k, items: g[k] }));
}

function fmtDate(d: string | null) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function BreathConcept() {
  const [selected, setSelected] = useState<MockItem | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [nearEdge, setNearEdge] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeNav, setActiveNav] = useState('My Focus');

  useEffect(() => {
    const h = (e: MouseEvent) => setNearEdge(e.clientX < 20);
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  useEffect(() => {
    const h = () => {
      setIsTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTyping(false), 3000);
    };
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); if (typingTimer.current) clearTimeout(typingTimer.current); };
  }, []);

  const open = useCallback((i: MockItem) => setSelected(i), []);
  const close = useCallback(() => setSelected(null), []);
  const sidebar = nearEdge || sidebarOpen;
  const groups = groupItems(mockItems);
  const navItems = ['My Focus', 'All Work', 'Inbox', 'Projects', 'Team'];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, hsl(225,30%,9%) 0%, hsl(220,25%,7%) 100%)', zIndex: 0 }} />

      {/* The Breath orb */}
      <div className="breath-orb" style={{
        position: 'fixed', top: '50%', left: '50%', width: '70vw', maxWidth: 800, aspectRatio: '1',
        borderRadius: '50%', background: 'radial-gradient(circle, hsla(210,70%,50%,0.18) 0%, hsla(210,70%,50%,0.04) 50%, transparent 70%)',
        filter: 'blur(100px)', pointerEvents: 'none', zIndex: 1,
        transform: `translate(-50%, -50%) ${selected ? 'translateX(10%)' : ''}`,
        opacity: isTyping ? 0.08 : 0.12,
        transition: 'opacity 2s ease, transform 800ms cubic-bezier(0.4,0,0.2,1)',
      }} />

      {/* Sidebar edge indicator */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 3,
        background: 'rgba(255,255,255,0.06)', zIndex: 30, pointerEvents: 'none',
        opacity: sidebar ? 0 : 1, transition: 'opacity 250ms',
      }} />

      {/* Expanded sidebar */}
      <div
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0,
          width: sidebar ? 220 : 0, opacity: sidebar ? 1 : 0,
          background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255,255,255,0.05)', zIndex: 30, overflow: 'hidden',
          transition: 'width 250ms cubic-bezier(0.4,0,0.2,1), opacity 250ms',
          display: 'flex', flexDirection: 'column', padding: sidebar ? '32px 20px' : '32px 0',
        }}
      >
        <div style={{ marginBottom: 32, whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>BugBee</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navItems.map((item) => (
            <button key={item} onClick={() => setActiveNav(item)} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 10,
              fontSize: 13, fontWeight: 400, whiteSpace: 'nowrap', cursor: 'pointer', outline: 'none',
              color: activeNav === item ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
              background: activeNav === item ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: activeNav === item ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02), inset 0 -1px 1px rgba(0,0,0,0.05)',
              transition: 'all 200ms',
            }}>{item}</button>
          ))}
        </nav>
        <Link href="/concepts" style={{
          display: 'block', marginTop: 'auto', fontSize: 11, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', textDecoration: 'none',
          whiteSpace: 'nowrap', padding: '8px 0', transition: 'color 200ms',
        }}>Back to Concepts</Link>
      </div>

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 10, width: '100%', height: '100%', overflow: 'auto',
        transform: selected ? 'scale(0.94) translateX(-100px)' : 'scale(1) translateX(0)',
        filter: selected ? 'blur(10px)' : 'blur(0px)', opacity: selected ? 0.6 : 1,
        transition: 'all 500ms cubic-bezier(0.4,0,0.2,1)', pointerEvents: selected ? 'none' : 'auto',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 32px 96px' }}>
          {groups.map((group, gi) => (
            <div key={group.group} style={{ marginTop: gi === 0 ? 0 : 48 }}>
              <div style={{
                fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3em',
                color: 'rgba(255,255,255,0.2)', marginBottom: 16, paddingLeft: 20,
              }}>{groupLabels[group.group]}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {group.items.map((item) => {
                  const isH = hovered === item.id;
                  const kc = kindConfig[item.kind];
                  const pc = priorityConfig[item.priority];
                  return (
                    <div key={item.id} onClick={() => open(item)}
                      onMouseEnter={() => setHovered(item.id)} onMouseLeave={() => setHovered(null)}
                      style={{
                        display: 'flex', alignItems: 'center', padding: '14px 20px', borderRadius: 12, cursor: 'pointer',
                        background: isH ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                        border: isH ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                        transform: isH ? 'translateY(-1px)' : 'none', transition: 'all 200ms',
                      }}>
                      <span style={{
                        fontSize: 15, fontWeight: 450,
                        color: item.status === 'done' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
                        textDecoration: item.status === 'done' ? 'line-through' : 'none',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '55%', flexShrink: 0,
                      }}>{item.title}</span>
                      <div style={{ flex: 1, margin: '0 16px', borderBottom: '1px dotted rgba(255,255,255,0.06)', minWidth: 20 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase',
                          padding: '3px 8px', borderRadius: 6, color: kc.color, background: kc.bg, whiteSpace: 'nowrap',
                        }}>{kc.label}</span>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: pc.color, flexShrink: 0 }} />
                        {item.due_date && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{fmtDate(item.due_date)}</span>}
                        <span style={{
                          fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)',
                          background: 'rgba(255,255,255,0.06)', padding: '3px 7px', borderRadius: 6,
                        }}>{item.assigned_to}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail backdrop */}
      {selected && <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />}

      {/* Detail panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, zIndex: 50,
        transform: selected ? 'translateX(0)' : 'translateX(100%)',
        opacity: selected ? 1 : 0,
        transition: 'transform 500ms cubic-bezier(0.4,0,0.2,1), opacity 400ms',
        background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto',
      }}>
        {selected && <DetailPanel item={selected} onClose={close} />}
      </div>

      <style>{`
        @keyframes breathe { 0%,100% { transform: translate(-50%,-50%) scale(0.97); } 50% { transform: translate(-50%,-50%) scale(1.03); } }
        .breath-orb { animation: breathe 8s ease-in-out infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>
    </div>
  );
}

function DetailPanel({ item, onClose }: { item: MockItem; onClose: () => void }) {
  const kc = kindConfig[item.kind]; const pc = priorityConfig[item.priority];
  const sc = statusConfig[item.status]; const mc = item.module ? moduleConfig[item.module] : null;
  const meta = [
    { label: 'Status', value: sc.label, color: sc.color },
    { label: 'Priority', value: pc.label, color: pc.color },
    { label: 'Kind', value: kc.label, color: kc.color },
    ...(mc ? [{ label: 'Module', value: mc.label, color: mc.color }] : []),
    { label: 'Assignee', value: item.assignee_name },
    ...(item.due_date ? [{ label: 'Due', value: fmtDate(item.due_date) }] : []),
  ];
  return (
    <div style={{ padding: 40 }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 24, right: 24, width: 32, height: 32, display: 'flex',
        alignItems: 'center', justifyContent: 'center', borderRadius: 8,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.4)', fontSize: 16, cursor: 'pointer', outline: 'none',
      }}>&times;</button>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 12, textTransform: 'uppercase' }}>{item.id}</div>
      <h2 style={{ fontSize: 24, fontWeight: 300, color: 'rgba(255,255,255,0.9)', lineHeight: 1.35, marginBottom: 32, paddingRight: 32 }}>{item.title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36 }}>
        {meta.map((m) => (
          <div key={m.label}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 14, color: m.color || 'rgba(255,255,255,0.7)' }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 28 }} />
      {item.description && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 10 }}>Description</div>
          <p style={{ fontSize: 14, fontWeight: 350, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)' }}>{item.description}</p>
        </div>
      )}
      {item.checklist.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 14 }}>Checklist</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {item.checklist.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                  border: c.completed ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.12)',
                  background: c.completed ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: 'rgba(16,185,129,0.7)',
                }}>{c.completed && '\u2713'}</div>
                <span style={{ fontSize: 13, color: c.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)', textDecoration: c.completed ? 'line-through' : 'none' }}>{c.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {item.comment_count > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Comments</div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{item.comment_count} comment{item.comment_count !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
