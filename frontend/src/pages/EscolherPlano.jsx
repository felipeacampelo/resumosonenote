import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const EscolherPlano = () => {
  const navigate = useNavigate();
  const [concursos, setConcursos] = useState([]);
  const [planoAtivo, setPlanoAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [concursosRes, planoRes] = await Promise.all([
        api.get('/concursos/'),
        api.get('/planos-aluno/meu_plano/').catch(() => ({ data: null }))
      ]);
      
      setConcursos(concursosRes.data.results || concursosRes.data);
      setPlanoAtivo(planoRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const escolherPlano = async (concursoId) => {
    setSalvando(true);
    try {
      await api.post('/planos-aluno/', {
        concurso: concursoId,
        ativo: true
      });
      
      // Recarregar dados
      await carregarDados();
      
      // Redirecionar para meus estudos
      navigate(`/meus-estudos/${concursoId}`);
    } catch (error) {
      console.error('Erro ao escolher plano:', error);
      
      // Se já existe, tentar ativar
      if (error.response?.status === 400) {
        try {
          const planosRes = await api.get('/planos-aluno/');
          const planoExistente = (planosRes.data.results || planosRes.data).find(
            p => p.concurso === concursoId
          );
          if (planoExistente) {
            await api.post(`/planos-aluno/${planoExistente.id}/ativar/`);
            navigate(`/meus-estudos/${concursoId}`);
          }
        } catch (e) {
          console.error('Erro ao ativar plano:', e);
        }
      }
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="ml-64 bg-white border-b">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Escolher Plano de Estudos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecione o concurso que você está estudando
          </p>
        </div>
      </div>

      <main className="ml-64 px-8 py-8">
        {/* Plano Ativo */}
        {planoAtivo && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Plano Ativo</p>
                  <h3 className="text-lg font-semibold text-gray-900">{planoAtivo.concurso_nome}</h3>
                  <p className="text-sm text-gray-500">
                    Iniciado em {new Date(planoAtivo.data_inicio).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/meus-estudos/${planoAtivo.concurso}`)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Continuar Estudando
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Lista de Concursos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {concursos.map((concurso) => {
            const isAtivo = planoAtivo?.concurso === concurso.id;
            
            return (
              <div
                key={concurso.id}
                className={`bg-white rounded-xl shadow-sm border p-6 transition ${
                  isAtivo 
                    ? 'border-green-300 ring-2 ring-green-100' 
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  {isAtivo && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Ativo
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {concurso.nome}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {concurso.sigla}
                </p>
                {concurso.cursinho && (
                  <p className="text-xs text-gray-400 mb-4">
                    {concurso.cursinho}
                  </p>
                )}
                
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">{concurso.total_assuntos}</span> assuntos
                </div>
                
                {isAtivo ? (
                  <button
                    onClick={() => navigate(`/meus-estudos/${concurso.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => escolherPlano(concurso.id)}
                    disabled={salvando}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {salvando ? 'Salvando...' : 'Escolher este Plano'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {concursos.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum plano disponível
            </h3>
            <p className="text-gray-600">
              Aguarde o administrador criar os planos de estudo
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default EscolherPlano;
