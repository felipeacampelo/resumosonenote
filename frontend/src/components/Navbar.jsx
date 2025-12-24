import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Database, FileText, User } from 'lucide-react';
import logo from '../assets/Logo ResumosON - 2.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Logo e Nome */}
      <div className="p-6 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
          <img src={logo} alt="Resumos OneNote" className="h-10 w-10 object-contain" />
          <span className="text-lg font-bold text-gray-900">Resumos OneNote</span>
        </Link>
      </div>

      {/* Menu de Navegação */}
      <nav className="flex-1 p-4 space-y-2">
        {user?.is_admin ? (
          <>
            <Link
              to="/planos"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive('/planos') || location.pathname.startsWith('/mapa-assuntos') || isActive('/criar-plano')
                  ? 'bg-purple-50 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Mapas de Assuntos</span>
            </Link>
            <Link
              to="/base-assuntos"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive('/base-assuntos')
                  ? 'bg-purple-50 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Database className="h-5 w-5" />
              <span>Matriz de Assuntos</span>
            </Link>
          </>
        ) : (
          <Link
            to="/meus-planos"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              isActive('/meus-planos') || location.pathname.startsWith('/plano/')
                ? 'bg-purple-50 text-purple-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Meus Planos</span>
          </Link>
        )}
      </nav>

      {/* User Info e Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500">
              {user?.is_admin ? 'Admin' : 'Aluno'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;
