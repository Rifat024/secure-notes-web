import { useCallback, useEffect, useState } from 'react';
import { api, tokenStore, SESSION_EXPIRED_EVENT } from './api';
import type { AuthSession, User } from './types';
import type { ExpireReason } from './session';
import { ModeToggle } from './appearance';
import { useSessionGuard } from './session';
import { Avatar, RoleBadge } from './ui';
import { AuthPage } from './pages/AuthPage';
import { NotesPage } from './pages/NotesPage';
import { PostsPage } from './pages/PostsPage';
import { UserPostsPage } from './pages/UserPostsPage';
import { InterestsPage } from './pages/InterestsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminNotesPage } from './pages/AdminNotesPage';

type SectionName = 'notes' | 'posts' | 'interests' | 'profile' | 'adminUsers' | 'adminNotes';
type View = { name: SectionName } | { name: 'userPosts'; id: string };

interface NavItem {
  name: SectionName;
  label: string;
  icon: string;
}

const WORKSPACE: NavItem[] = [
  { name: 'notes', label: 'My notes', icon: '✎' },
  { name: 'posts', label: 'Community posts', icon: '◈' },
  { name: 'interests', label: 'Interests', icon: '✦' },
  { name: 'profile', label: 'Profile', icon: '◉' },
];

const ADMIN: NavItem[] = [
  { name: 'adminUsers', label: 'Users', icon: '⚑' },
  { name: 'adminNotes', label: 'All notes', icon: '▤' },
];

const SIGN_OUT_NOTICES: Record<ExpireReason, string> = {
  idle: 'You were signed out after 30 minutes of inactivity.',
  expired: 'Your session expired. Please sign in again.',
  revoked: 'Your session ended. Please sign in again.',
};

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const [view, setView] = useState<View>({ name: 'notes' });
  const [notice, setNotice] = useState('');

  const endSession = useCallback((reason?: ExpireReason) => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
    setNotice(reason ? SIGN_OUT_NOTICES[reason] : '');
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => endSession('revoked');
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [endSession]);

  const { secondsLeft, stayActive } = useSessionGuard({ token: user ? token : null, onExpire: endSession });

  const onAuth = ({ token: issued, user: authed }: AuthSession) => {
    tokenStore.set(issued);
    setToken(issued);
    setUser(authed);
    setNotice('');
    setView({ name: 'notes' });
  };

  const onTokenRefreshed = (issued: string) => {
    tokenStore.set(issued);
    setToken(issued);
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // The local session is cleared regardless; the server token expires on its own.
    }
    endSession();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <AuthPage onAuth={onAuth} notice={notice} />;

  const isAdmin = user.role === 'admin';
  const openUserPosts = (id: string) => setView({ name: 'userPosts', id });

  const navButton = (item: NavItem) => (
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
        <div className="sidebar-footer">
          <ModeToggle compact />
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
        </div>
      </aside>

      <main className="main">
        {view.name === 'notes' && <NotesPage />}
        {view.name === 'posts' && <PostsPage currentUser={user} onOpenUser={openUserPosts} />}
        {view.name === 'userPosts' && <UserPostsPage key={view.id} userId={view.id} onBack={() => setView({ name: 'posts' })} />}
        {view.name === 'interests' && <InterestsPage onOpenUser={openUserPosts} />}
        {view.name === 'profile' && <ProfilePage user={user} onUpdated={setUser} onTokenRefreshed={onTokenRefreshed} onSignOutEverywhere={logout} />}
        {view.name === 'adminUsers' && isAdmin && <AdminUsersPage currentUser={user} onOpenUser={openUserPosts} />}
        {view.name === 'adminNotes' && isAdmin && <AdminNotesPage />}
      </main>

      {secondsLeft !== null && (
        <div className="session-banner" role="alertdialog" aria-live="assertive">
          <span>
            You'll be signed out in <b>{secondsLeft}s</b> due to inactivity.
          </span>
          <button className="btn btn-primary btn-sm" onClick={stayActive}>
            Stay signed in
          </button>
        </div>
      )}
    </div>
  );
}
