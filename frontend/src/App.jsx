import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ConcursoView from './pages/ConcursoView';
import BaseAssuntos from './pages/BaseAssuntos';
import CriarPlano from './pages/CriarPlano';
import Planos from './pages/Planos';
import MapaAssuntos from './pages/MapaAssuntos';
import MeusPlanos from './pages/MeusPlanos';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/concurso/:id"
            element={
              <PrivateRoute>
                <ConcursoView />
              </PrivateRoute>
            }
          />
          <Route
            path="/base-assuntos"
            element={
              <PrivateRoute>
                <BaseAssuntos />
              </PrivateRoute>
            }
          />
          <Route
            path="/criar-plano"
            element={
              <PrivateRoute>
                <CriarPlano />
              </PrivateRoute>
            }
          />
          <Route
            path="/planos"
            element={
              <PrivateRoute>
                <Planos />
              </PrivateRoute>
            }
          />
          <Route
            path="/mapa-assuntos/:id"
            element={
              <PrivateRoute>
                <MapaAssuntos />
              </PrivateRoute>
            }
          />
          <Route
            path="/mapa-assuntos"
            element={
              <PrivateRoute>
                <Planos />
              </PrivateRoute>
            }
          />
          <Route
            path="/meus-planos"
            element={
              <PrivateRoute>
                <MeusPlanos />
              </PrivateRoute>
            }
          />
          <Route
            path="/plano/:id"
            element={
              <PrivateRoute>
                <ConcursoView />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/planos" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
