import { useEffect, useState } from 'react';
import { api, tokenStore } from './api.js';
import { Avatar, RoleBadge } from './ui.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { NotesPage } from './pages/NotesPage.jsx';
import { PostsPage } from './pages/PostsPage.jsx';
import { UserPostsPage } from './pages/UserPostsPage.jsx';
import { InterestsPage } from './pages/InterestsPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { AdminUsersPage } from './pages/AdminUsersPage.jsx';
import { AdminNotesPage } from './pages/AdminNotesPage.jsx';

const WORKSPACE = [
  { name: 'notes', label: 'My notes', icon: '✎' },
  { name: 'posts', label: 'Community posts', icon: '◈' },
  { name: 'interests', label: 'Interests', icon: '✦' },
  { name: 'profile', label: 'Profile', icon: '◉' },
];

const ADMIN = [
  { name: 'adminUsers', label: 'Users', icon: '⚑' },
  { name: 'adminNotes', label: 'All notes', icon: '▤' },
];

export function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const [view, setView] = useState({ name: 'notes' });

  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const onAuth = ({ token, user: authed }) => {
    tokenStore.set(token);
    setUser(authed);
    setView({ name: 'notes' });
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <AuthPage onAuth={onAuth} />;

  const isAdmin = user.role === 'admin';
  const openUserPosts = (id) => setView({ name: 'userPosts', id });

  const navButton = (item) => (
    <button
      key={item.name}
      className={`nav-item ${view.name === item.name ? 'active' : ''}`}
      onClick={() => setView({ name: item.name })}
      title={item.label}
    >
      <span className="nav-icon">{item.icon}</span>
      <span className="nav-text">{item.label}</span>
    </button>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">🔐</span>
          <span>Secure Notes</span>
        </div>
        <nav className="nav">
          <div className="nav-label">Workspace</div>
          {WORKSPACE.map(navButton)}
          {isAdmin && (
            <>
              <div className="nav-label">Administration</div>
              {ADMIN.map(navButton)}
            </>
          )}
        </nav>
        <div className="user-chip">
          <Avatar name={user.name} seed={user._id} />
          <div className="user-chip-info">
            <div className="user-chip-name">{user.name}</div>
            <RoleBadge role={user.role} />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} title="Log out">
            ⎋
          </button>
        </div>
      </aside>

      <main className="main">
        {view.name === 'notes' && <NotesPage />}
        {view.name === 'posts' && <PostsPage currentUser={user} onOpenUser={openUserPosts} />}
        {view.name === 'userPosts' && <UserPostsPage key={view.id} userId={view.id} onBack={() => setView({ name: 'posts' })} />}
        {view.name === 'interests' && <InterestsPage onOpenUser={openUserPosts} />}
        {view.name === 'profile' && <ProfilePage user={user} onUpdated={setUser} />}
        {view.name === 'adminUsers' && isAdmin && <AdminUsersPage currentUser={user} onOpenUser={openUserPosts} />}
        {view.name === 'adminNotes' && isAdmin && <AdminNotesPage />}
      </main>
    </div>
  );
}
