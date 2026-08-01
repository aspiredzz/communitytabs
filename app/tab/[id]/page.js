'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { supabase } from '../../../lib/supabase';

export default function TabPage() {
  const { id } = useParams();
  const [tab, setTab] = useState(null);
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    loadTab();
    loadItems();

    const channel = supabase
      .channel(`items-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'items', filter: `tab_id=eq.${id}` },
        (payload) => {
          setItems((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function loadTab() {
    const { data } = await supabase.from('tabs').select('*').eq('id', id).single();
    setTab(data);
  }

  async function loadItems() {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('tab_id', id)
      .order('created_at', { ascending: true });
    setItems(data || []);
  }

  async function postText(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    await supabase.from('items').insert({ tab_id: id, type: 'text', content: trimmed });
  }

  async function postLink(e) {
    e.preventDefault();
    let trimmed = linkUrl.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    setLinkUrl('');
    setLinkOpen(false);
    await supabase.from('items').insert({ tab_id: id, type: 'link', content: trimmed });
  }

  async function uploadImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('uploads').upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);
      await supabase.from('items').insert({ tab_id: id, type: 'image', content: urlData.publicUrl });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <AppShell activeTabId={id}>
      <div className="channel">
        <div className="channel-header">
          <span className="hash">#</span>
          <span className="channel-name">{tab ? tab.name : '...'}</span>
        </div>

        <div className="feed">
          {items.length === 0 && (
            <div className="feed-empty">
              <div className="feed-empty-hash">#</div>
              <div>this is the start of {tab ? tab.name : 'this tab'}</div>
            </div>
          )}
          {items.map((item) => (
            <div className="post" key={item.id}>
              <div className="post-meta">{new Date(item.created_at).toLocaleString()}</div>
              {item.type === 'text' && <div className="post-text">{item.content}</div>}
              {item.type === 'link' && (
                <a className="post-link" href={item.content} target="_blank" rel="noreferrer">
                  {item.content}
                </a>
              )}
              {item.type === 'image' && <img className="post-image" src={item.content} alt="" />}
            </div>
          ))}
        </div>

        <div className="composer">
          {linkOpen && (
            <form onSubmit={postLink} className="composer-link-row">
              <input
                autoFocus
                type="text"
                placeholder="paste a link and press enter"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <button type="button" className="ghost" onClick={() => setLinkOpen(false)}>
                cancel
              </button>
            </form>
          )}

          <form onSubmit={postText} className="composer-row">
            <button
              type="button"
              className="composer-icon-btn"
              onClick={() => fileRef.current && fileRef.current.click()}
              title="add an image"
              disabled={uploading}
            >
              +
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadImage} hidden />

            <input
              type="text"
              placeholder={`message #${tab ? tab.name : ''}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="composer-text"
            />

            <button
              type="button"
              className="composer-icon-btn"
              onClick={() => setLinkOpen((v) => !v)}
              title="add a link"
            >
              🔗
            </button>

            <button type="submit" className="composer-send">
              send
            </button>
          </form>
          {uploading && <div className="uploading-note">uploading image...</div>}
        </div>
      </div>
    </AppShell>
  );
}
