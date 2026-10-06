import { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, LineChart, User, LogOut } from 'lucide-react';
import api from './api';
import { Home, AuthForm } from './pages/Public.jsx';
import DashboardHome from './pages/DashboardHome.jsx';
import Workouts from './pages/Workouts.jsx';
import Progress from './pages/Progress.jsx';
import Profile from './pages/Profile.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

function Shell() {
  const { user, logout } = useAuth();
  const links = [['/dashboard', 'Dashboard', LayoutDashboard], ['/dashboard/workouts', 'Workouts', Dumbbell],
    ['/dashboard/progress', 'Progress', LineChart], ['/dashboard/profile', 'Profile', User]];
  return (
    <div className="shell">
      <aside>
        <div className="logo">FitTrack</div>
        <nav>{links.map(([to, label, Icon]) =>
          <NavLink key={to} to={to} end={to === '/dashboard'}><Icon size={18} />{label}</NavLink>)}</nav>
        <ThemeToggle />
        <button className="ghost" onClick={logout}><LogOut size={18} />Log out</button>
      </aside>
      <main><h1>Hi, {user.name.split(' ')[0]}</h1><Outlet /></main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true);
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setReady(true));
  }, []);

  const login = ({ token, user }) => { localStorage.setItem('token', token); setUser(user); nav('/dashboard'); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); nav('/'); };
  if (!ready) return null;

  return (
    <Ctx.Provider value={{ user, setUser, login, logout }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <AuthForm mode="signup" />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthForm mode="login" />} />
        <Route path="/dashboard" element={user ? <Shell /> : <Navigate to="/login" />}>
          <Route index element={<DashboardHome />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="progress" element={<Progress />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Ctx.Provider>
  );
}
