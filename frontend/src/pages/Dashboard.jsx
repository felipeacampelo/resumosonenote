import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [concursos, setConcursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarConcursos();
  }, []);

  const carregarConcursos = async () => {
    try {
      const response = await api.get('/concursos/');
      setConcursos(response.data);
    } catch (error) {
      console.error('Erro ao carregar concursos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <main className="ml-64 px-8 py-8">
        {/* Header com botão de novo concurso */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Mapas de Assuntos
            </h2>
            <p className="text-gray-600">
              Gerencie os mapas de assuntos por concurso
            </p>
          </div>
          {user?.is_admin && (
            <button 
              onClick={() => navigate('/criar-plano')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Plus className="h-5 w-5" />
              Novo Mapa
            </button>
          )}
        </div>

        {/* Lista de Concursos */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : concursos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum mapa criado ainda
            </h3>
            <p className="text-gray-600 mb-6">
              Comece criando seu primeiro mapa de assuntos
            </p>
            {user?.is_admin && (
              <button 
                onClick={() => navigate('/criar-plano')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Plus className="h-5 w-5" />
                Criar Primeiro Mapa
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concursos.map((concurso) => (
              <div
                key={concurso.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {concurso.nome}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {concurso.sigla} • {concurso.tipo_display}
                      </p>
                      {concurso.cursinho && (
                        <p className="text-xs text-purple-600 mt-1">
                          {concurso.cursinho}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{concurso.total_assuntos_mapa} assuntos</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/concurso/${concurso.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-sm font-medium"
                    >
                      <BookOpen className="h-4 w-4" />
                      Ver Mapa
                    </Link>
                    {user?.is_admin && (
                      <>
                        <Link
                          to={`/mapa-assuntos/${concurso.id}`}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Editar Mapa"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
