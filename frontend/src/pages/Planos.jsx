import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Plus, Edit, Copy, Trash2, Search, Filter, Download } from 'lucide-react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const Planos = () => {
  const { user } = useAuth();
  const [concursos, setConcursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [concursoParaDeletar, setConcursoParaDeletar] = useState(null);
  const [duplicando, setDuplicando] = useState(null);

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

  const handleDuplicar = async (concurso) => {
    setDuplicando(concurso.id);
    try {
      const novoNome = `${concurso.nome} (Cópia)`;
      await api.post(`/concursos/${concurso.id}/duplicate/`, { novo_nome: novoNome });
      await carregarConcursos();
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      alert('Erro ao duplicar o plano');
    } finally {
      setDuplicando(null);
    }
  };

  const handleExportar = async (concurso) => {
    try {
      const response = await api.get(`/concursos/${concurso.id}/exportar/`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${concurso.sigla}_tutory.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar o plano');
    }
  };

  const handleDeletar = async () => {
    if (!concursoParaDeletar) return;
    
    try {
      await api.delete(`/concursos/${concursoParaDeletar.id}/`);
      await carregarConcursos();
      setShowDeleteModal(false);
      setConcursoParaDeletar(null);
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar o plano');
    }
  };

  const concursosFiltrados = concursos.filter(c => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       c.sigla.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  const tiposUnicos = [...new Set(concursos.map(c => c.tipo))];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="ml-64 px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mapas de Assuntos
            </h1>
            <p className="text-gray-600">
              Gerencie os mapas de assuntos por concurso
            </p>
          </div>
          {user?.is_admin && (
            <Link
              to="/criar-plano"
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              <Plus className="h-5 w-5" />
              Novo Mapa
            </Link>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou sigla..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            </div>
            
            {/* Filtro por tipo */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              >
                <option value="todos">Todos os tipos</option>
                {tiposUnicos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : concursosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {busca || filtroTipo !== 'todos' ? 'Nenhum mapa encontrado' : 'Nenhum mapa criado ainda'}
            </h3>
            <p className="text-gray-600 mb-6">
              {busca || filtroTipo !== 'todos' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro mapa de assuntos'}
            </p>
            {user?.is_admin && !busca && filtroTipo === 'todos' && (
              <Link
                to="/criar-plano"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Plus className="h-5 w-5" />
                Criar Primeiro Mapa
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concursosFiltrados.map((concurso) => (
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
                        {concurso.sigla} • {concurso.tipo_display || concurso.tipo}
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
                      <span>{concurso.total_assuntos_mapa || 0} assuntos</span>
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
                        <button 
                          onClick={() => handleDuplicar(concurso)}
                          disabled={duplicando === concurso.id}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                          title="Duplicar"
                        >
                          {duplicando === concurso.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleExportar(concurso)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Exportar Tutory"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setConcursoParaDeletar(concurso);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o mapa <strong>{concursoParaDeletar?.nome}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConcursoParaDeletar(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletar}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planos;
