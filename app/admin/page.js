'use client';

import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');
  const [tabs, setTabs] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const res = await fetch('/api/admin/data');
    if (res.ok) {
      const data = await res.json();
      setTabs(data.tabs);
      setItems(data.items);
      setAuthed(true);
    } else {
      setAuthed(false);
    }
    setLoading(false);
  }

  async function login(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      setPassword('');
      loadData();
    } else {
      setError('wrong password');
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthed(false);
    setTabs([]);
    setItems([]);
  }

  async function deleteTab(tabId) {
    if (!confirm('delete this tab and everything in it?')) return;
    await fetch('/api/admin/delete-tab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tabId })
    });
    loadData();
  }

  async function deleteItem(itemId) {
    await fetch('/api/admin/delete-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId })
    });
    loadData();
  }

  if (!authed) {
    return (
      <div className="container">
        <form className="admin-login" onSubmit={login}>
          <h2>admin</h2>
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">login</button>
          {error && <div style={{ color: '#e05f5f', fontSize: 13 }}>{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>admin panel</h1>
        <button className="secondary" onClick={logout}>logout</button>
      </div>

      {loading && <div className="empty">loading...</div>}

      {tabs.map((tab) => {
        const tabItems = items.filter((i) => i.tab_id === tab.id);
        return (
          <div className="admin-tab-block" key={tab.id}>
            <div className="admin-tab-row">
              <div>
                <strong>{tab.name}</strong>
                <div className="meta">{tabItems.length} items · {new Date(tab.created_at).toLocaleString()}</div>
              </div>
              <button className="danger" onClick={() => deleteTab(tab.id)}>delete tab</button>
            </div>
            {tabItems.map((item) => (
              <div className="admin-item-row" key={item.id}>
                <div className="content">
                  <span style={{ color: '#888' }}>[{item.type}]</span>{' '}
                  {item.type === 'image' ? item.content : item.content.slice(0, 200)}
                </div>
                <button className="danger" onClick={() => deleteItem(item.id)}>delete</button>
              </div>
            ))}
          </div>
        );
      })}

      {!loading && tabs.length === 0 && <div className="empty">no tabs yet</div>}
    </div>
  );
}
