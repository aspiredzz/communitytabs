'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function AppShell({ activeTabId, children }) {
  const [tabs, setTabs] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
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
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    setSaving(true);
    const { data } = await supabase
      .from('tabs')
      .insert({ name: trimmedName, description: newDesc.trim() || null })
      .select()
      .single();
    setSaving(false);
    setNewName('');
    setNewDesc('');
    setModalOpen(false);
    if (data) {
      setTabs((prev) => (prev.find((t) => t.id === data.id) ? prev : [data, ...prev]));
      router.push(`/tab/${data.id}`);
    }
  }

  function initials(name) {
    return name.trim().slice(0, 2).toUpperCase();
  }

  const filteredTabs = tabs.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="shell">
      <aside className="rail">
        <Link href="/" className="rail-home">
          <span>tabs</span>
        </Link>

        <div className="rail-search">
          <input
            type="text"
            placeholder="search tabs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rail-list">
          {filteredTabs.map((tab, i) => (
            <Link
              key={tab.id}
              href={`/tab/${tab.id}`}
              className={`rail-item ${tab.id === activeTabId ? 'active' : ''}`}
              title={tab.name}
              style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
            >
              <span className="bubble">{initials(tab.name)}</span>
              <span className="rail-item-label">{tab.name}</span>
            </Link>
          ))}
          {filteredTabs.length === 0 && (
            <div className="rail-empty">{tabs.length === 0 ? 'no tabs yet' : 'no matches'}</div>
          )}
        </div>

        <div className="rail-footer">
          <Link href="/admin" className="admin-link">
            <span className="admin-dot" />
            admin
          </Link>
          <button className="add-btn" onClick={() => setModalOpen(true)} aria-label="new tab">
            + new tab
          </button>
        </div>
      </aside>

      <main className="content" key={activeTabId || 'home'}>
        {children}
      </main>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>new tab</h2>
            <form onSubmit={submitNewTab}>
              <label>name</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. announcements"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={40}
              />

              <label>description (optional)</label>
              <textarea
                placeholder="what's this tab for?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                maxLength={200}
              />

              <div className="modal-actions">
                <button type="button" className="ghost" onClick={() => setModalOpen(false)}>
                  cancel
                </button>
                <button type="submit" disabled={saving || !newName.trim()}>
                  {saving ? 'creating...' : 'create tab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
