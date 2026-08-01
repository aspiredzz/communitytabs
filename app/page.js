'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [tabs, setTabs] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTabs();

    const channel = supabase
      .channel('tabs-changes')
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
    setLoading(false);
  }

  async function createTab(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setName('');
    await supabase.from('tabs').insert({ name: trimmed });
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Tabs</h1>
          <div className="sub">create a tab, write on it, share it</div>
        </div>
      </div>

      <form className="new-tab-form" onSubmit={createTab}>
        <input
          type="text"
          placeholder="new tab name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
        <button type="submit">create</button>
      </form>

      <div className="tab-list">
        {loading && <div className="empty">loading...</div>}
        {!loading && tabs.length === 0 && <div className="empty">no tabs yet, make the first one</div>}
        {tabs.map((tab) => (
          <Link key={tab.id} href={`/tab/${tab.id}`} className="tab-card">
            <div className="name">{tab.name}</div>
            <div className="meta">{new Date(tab.created_at).toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
