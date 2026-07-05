import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Analyze from './pages/Analyze';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MatchResult from './pages/MatchResult';
import Register from './pages/Register';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/result/:matchId" element={<MatchResult />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/analyze" replace />} />
        <Route path="*" element={<Navigate to="/analyze" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
