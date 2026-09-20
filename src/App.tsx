import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { applyTheme } from './lib/themes';
import Auth from './pages/Auth';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';

function Shell() {
  const { session, profile, loading } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(profile?.theme);
  }, [profile?.theme]);

  let content;
  if (loading) {
    content = <div className="loading-center">Caricamento…</div>;
  } else if (!session) {
    content = <Auth />;
  } else if (selectedGroupId) {
    content = <GroupDetail groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />;
  } else {
    content = <Groups onSelectGroup={setSelectedGroupId} />;
  }

  return (
    <div className="app-shell">
      <div className="frame">{content}</div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
