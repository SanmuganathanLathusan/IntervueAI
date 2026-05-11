import { Routes, Route } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadPdf from './pages/UploadPdf';
import InterviewSession from './pages/InterviewSession';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Results from './pages/Results';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload-pdf" element={<UploadPdf />} />
      <Route path="/interview-session" element={<InterviewSession />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  );
}
