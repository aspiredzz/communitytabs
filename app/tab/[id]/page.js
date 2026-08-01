'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function TabPage() {
  const { id } = useParams();
  const [tab, setTab] = useState(null);
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
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
          setItems((prev) => [payload.new, ...prev]);
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
      .order('created_at', { ascending: false });
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
    <div className="container">
      <Link href="/" className="back-link">&larr; all tabs</Link>
      <div className="header">
        <div>
          <h1>{tab ? tab.name : '...'}</h1>
        </div>
      </div>

      <div className="post-form">
        <form onSubmit={postText}>
          <textarea
            placeholder="write something..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="post-form-row">
            <button type="submit">post text</button>
          </div>
        </form>

        <form onSubmit={postLink} className="post-form-row">
          <input
            type="text"
            placeholder="paste a link"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <button type="submit">post link</button>
        </form>

        <div className="post-form-row">
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadImage} disabled={uploading} />
          {uploading && <span>uploading...</span>}
        </div>
      </div>

      {items.length === 0 && <div className="empty">nothing here yet</div>}

      {items.map((item) => (
        <div className="item" key={item.id}>
          <div className="meta">{new Date(item.created_at).toLocaleString()}</div>
          {item.type === 'text' && <div className="text">{item.content}</div>}
          {item.type === 'link' && (
            <a className="link" href={item.content} target="_blank" rel="noreferrer">
              {item.content}
            </a>
          )}
          {item.type === 'image' && <img src={item.content} alt="" />}
        </div>
      ))}
    </div>
  );
}
