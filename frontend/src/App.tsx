import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from './pages/login';
import { Register } from './pages/register';
import { Dashboard } from './pages/dashboard';
import { SessionEdit } from "./pages/SessionEdit";
import { SessionCreate } from "./pages/SessionCreate";
import { SessionPlay } from "./pages/SessionPlay";
import { Session } from "./pages/session";
import { PrivateRoute } from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />

        <Route path="/session/:id" element={
          <PrivateRoute><Session /></PrivateRoute>
        } />
        <Route path="/session/:id/edit" element={
          <PrivateRoute><SessionEdit /></PrivateRoute>
        } />
        <Route path="/session/:id/create" element={
          <PrivateRoute><SessionCreate /></PrivateRoute>
        } />
        <Route path="/session/:id/play" element={
          <PrivateRoute><SessionPlay /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App
