import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, FileText, Search } from 'lucide-react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const MeusPlanos = () => {
  const [concursos, setConcursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarConcursos();
  }, []);

  const carregarConcursos = async () => {
    try {
      const response = await api.get('/concursos/');
      setConcursos(response.data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const concursosFiltrados = concursos.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.sigla.toLowerCase().includes(busca.toLowerCase()) ||
    c.cursinho?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="ml-64 px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Meus Planos de Estudos
          </h1>
          <p className="text-gray-600">
            Escolha um plano para visualizar os assuntos e materiais de estudo
          </p>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar plano por nome, sigla ou cursinho..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Lista de Planos */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : concursosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {busca ? 'Nenhum plano encontrado' : 'Nenhum plano disponível'}
            </h3>
            <p className="text-gray-500">
              {busca 
                ? 'Tente buscar com outros termos' 
                : 'Os planos de estudos aparecerão aqui quando estiverem disponíveis'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concursosFiltrados.map((concurso) => (
              <Link
                key={concurso.id}
                to={`/plano/${concurso.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    {concurso.sigla}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition">
                  {concurso.nome}
                </h3>
                
                {concurso.cursinho && (
                  <p className="text-sm text-gray-500 mb-3">
                    {concurso.cursinho}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{concurso.total_assuntos_mapa || 0} assuntos</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MeusPlanos;
