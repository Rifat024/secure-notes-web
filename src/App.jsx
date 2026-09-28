import { useEffect, useState } from 'react';
import { api, tokenStore } from './api.js';
import { AuthPage } from './pages/AuthPage.jsx';
import { NotesPage } from './pages/NotesPage.jsx';
import { PostsPage } from './pages/PostsPage.jsx';
import { UserPostsPage } from './pages/UserPostsPage.jsx';
import { InterestsPage } from './pages/InterestsPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { AdminUsersPage } from './pages/AdminUsersPage.jsx';
import { AdminNotesPage } from './pages/AdminNotesPage.jsx';

const USER_VIEWS = { notes: 'My notes', posts: 'Posts', interests: 'Users by interest', profile: 'Profile' };
const ADMIN_VIEWS = { adminUsers: 'Admin: users', adminNotes: "Admin: everyone's notes" };

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

  if (loading) return <p>Loading…</p>;
  if (!user) return <AuthPage onAuth={onAuth} />;

  const views = user.role === 'admin' ? { ...USER_VIEWS, ...ADMIN_VIEWS } : USER_VIEWS;
  const openUserPosts = (id) => setView({ name: 'userPosts', id });

  return (
    <>
      <nav>
        <strong>Secure Notes</strong>
        {Object.entries(views).map(([name, label]) => (
          <button key={name} disabled={view.name === name} onClick={() => setView({ name })}>
            {label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto' }}>
          {user.name} ({user.role}) <button onClick={logout}>Log out</button>
        </span>
      </nav>
      {view.name === 'notes' && <NotesPage />}
      {view.name === 'posts' && <PostsPage currentUser={user} onOpenUser={openUserPosts} />}
      {view.name === 'userPosts' && <UserPostsPage userId={view.id} />}
      {view.name === 'interests' && <InterestsPage onOpenUser={openUserPosts} />}
      {view.name === 'profile' && <ProfilePage user={user} onUpdated={setUser} />}
      {view.name === 'adminUsers' && user.role === 'admin' && <AdminUsersPage currentUser={user} onOpenUser={openUserPosts} />}
      {view.name === 'adminNotes' && user.role === 'admin' && <AdminNotesPage />}
    </>
  );
}
