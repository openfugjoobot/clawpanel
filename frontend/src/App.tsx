import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Sessions } from './pages/Sessions';
import { Agents } from './pages/Agents';
import { Cron } from './pages/Cron';
import { GitHub } from './pages/GitHub';
import { Workspace } from './pages/Workspace';
import { Settings } from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login route - accessible without auth */}
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard route - protected */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Sessions route - protected */}
          <Route 
            path="/sessions" 
            element={
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            } 
          />

          {/* Agents route - protected */}
          <Route 
            path="/agents" 
            element={
              <ProtectedRoute>
                <Agents />
              </ProtectedRoute>
            } 
          />

          {/* Cron Jobs route - protected */}
          <Route 
            path="/cron" 
            element={
              <ProtectedRoute>
                <Cron />
              </ProtectedRoute>
            } 
          />

          {/* GitHub route - protected */}
          <Route 
            path="/github" 
            element={
              <ProtectedRoute>
                <GitHub />
              </ProtectedRoute>
            } 
          />

          {/* Workspace route - protected */}
          <Route 
            path="/workspace" 
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            } 
          />

          {/* Settings route - protected */}
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          {/* Root redirect - goes to dashboard if auth, login if not */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;