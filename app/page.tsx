'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import StatusBadge from './components/StatusBadge';
import { useRouter } from 'next/navigation';
import { Filter, ArrowUpDown } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'bugs' | 'features'>('bugs');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    fetchItems();
  }, [tab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${tab}`, {
        headers: { 'x-bugbee-token': localStorage.getItem('bugbee_token') || '' }
      });
      if (res.status === 401) {
        localStorage.removeItem('bugbee_token');
        window.location.reload();
        return;
      }
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items
    .filter(i => {
      const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || (tab === 'bugs' ? i.severity === severityFilter : i.priority === severityFilter);
      return matchesSearch && matchesStatus && matchesSeverity;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const uniqueStatuses = Array.from(new Set(items.map(i => i.status)));
  const severities = ['low', 'medium', 'high', 'critical'];
  const priorities = ['nice', 'important', 'critical'];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setTab('bugs')}
            className={clsx("px-4 py-1.5 text-sm font-medium rounded transition-all", tab === 'bugs' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white")}
          >
            Bugs
          </button>
          <button
            onClick={() => setTab('features')}
            className={clsx("px-4 py-1.5 text-sm font-medium rounded transition-all", tab === 'features' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white")}
          >
            Features
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-4">
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <input
              placeholder="Search..."
              className="input max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

            <select
              className="input max-w-[150px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {uniqueStatuses.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</option>
              ))}
            </select>

            <select
              className="input max-w-[150px]"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All {tab === 'bugs' ? 'Severities' : 'Priorities'}</option>
              {(tab === 'bugs' ? severities : priorities).map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="btn btn-secondary flex items-center gap-2"
              title="Sort by Creation Date"
            >
              <ArrowUpDown size={14} />
              {sortOrder === 'desc' ? 'Newest Logged' : 'Oldest Logged'}
            </button>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 w-40">{tab === 'bugs' ? 'Severity' : 'Priority'}</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 w-40 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No items found</td></tr>
                ) : (
                  filteredItems.map(item => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/item/${item.id}?type=${tab === 'bugs' ? 'bug' : 'feature'}`)}
                      className="hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4"><StatusBadge severity={tab === 'bugs' ? item.severity : item.priority} muted={item.status?.toLowerCase() === 'closed'} /></td>
                      <td className={clsx("px-6 py-4 font-medium", item.status?.toLowerCase() === 'closed' && "line-through text-slate-500")}>{item.title}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.status} />
                          {item.last_comment_at && (
                            (!localStorage.getItem(`bugbee_viewed_${item.id}`) ||
                              new Date(item.last_comment_at) > new Date(localStorage.getItem(`bugbee_viewed_${item.id}`)!))
                          ) && (
                              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-red-500/20 whitespace-nowrap">
                                New Comment
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
