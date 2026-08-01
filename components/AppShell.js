'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function AppShell({ activeTabId, children }) {
  const [tabs, setTabs] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadTabs();

    const channel = supabase
      .channel('sidebar-tabs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tabs' }, (payload) => {
        setTabs((prev) => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tabs' }, (payload) => {
        setTabs((prev) => prev.filter((t) => t.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadTabs() {
    const { data } = await supabase.from('tabs').select('*').order('created_at', { ascending: false });
    setTabs(data || []);
  }

  async function submitNewTab(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const { data } = await supabase.from('tabs').insert({ name: trimmed }).select().single();
    setNewName('');
    setCreating(false);
    if (data) router.push(`/tab/${data.id}`);
  }

  function initials(name) {
    return name.trim().slice(0, 2).toUpperCase();
  }

  return (
    <div className="shell">
      <aside className="rail">
        <Link href="/" className="rail-home">
          <span>tabs</span>
        </Link>

        <div className="rail-list">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/tab/${tab.id}`}
              className={`rail-item ${tab.id === activeTabId ? 'active' : ''}`}
              title={tab.name}
            >
              <span className="bubble">{initials(tab.name)}</span>
              <span className="rail-item-label">{tab.name}</span>
            </Link>
          ))}
        </div>

        <div className="rail-add">
          {!creating && (
            <button className="add-btn" onClick={() => setCreating(true)} aria-label="new tab">
              +
            </button>
          )}
          {creating && (
            <form onSubmit={submitNewTab} className="add-form">
              <input
                autoFocus
                type="text"
                placeholder="tab name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => {
                  if (!newName.trim()) setCreating(false);
                }}
                maxLength={40}
              />
            </form>
          )}
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
