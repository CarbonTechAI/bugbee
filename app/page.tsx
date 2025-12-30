'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import StatusBadge from './components/StatusBadge';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'bugs' | 'features'>('bugs');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

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

  const filteredItems = items.filter(i =>
    i.title.toLowerCase().includes(filter.toLowerCase()) ||
    i.status.includes(filter.toLowerCase())
  );

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
          <div className="flex gap-4 mb-4">
            <input
              placeholder="Search..."
              className="input max-w-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3 w-32">Status</th>
                  <th className="px-6 py-3 w-32">{tab === 'bugs' ? 'Severity' : 'Priority'}</th>
                  <th className="px-6 py-3 w-32 text-right">Updated</th>
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
                      <td className="px-6 py-4 font-medium">{item.title}</td>
                      <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                      <td className="px-6 py-4"><StatusBadge severity={tab === 'bugs' ? item.severity : item.priority} /></td>
                      <td className="px-6 py-4 text-right text-slate-500">
                        {new Date(item.updated_at).toLocaleDateString()}
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
