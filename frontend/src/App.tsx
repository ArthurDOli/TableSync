import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from './pages/login';
import { Register } from './pages/register';
import { Dashboard } from './pages/dashboard';
import { SessionEdit } from "./pages/SessionEdit";
import { SessionCreate } from "./pages/SessionCreate";
import { SessionPlay } from "./pages/SessionPlay";
import { Session } from "./pages/session";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/session/:id" element={<Session />} />
        <Route path="/session/:id/edit" element={<SessionEdit />} />
        <Route path="/session/:id/create" element={<SessionCreate />} />
        <Route path="/session/:id/play" element={<SessionPlay />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
