'use client';

import AppShell from '../components/AppShell';

export default function Home() {
  return (
    <AppShell>
      <div className="welcome">
        <h1>pick a tab</h1>
        <p>choose one from the rail on the left, or hit the + to start a new one.</p>
        <p className="hint">anything posted in a tab is visible to everyone who opens it.</p>
      </div>
    </AppShell>
  );
}
