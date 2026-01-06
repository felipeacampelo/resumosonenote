import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Clock, Target, BookOpen, Filter, Medal, 
  TrendingUp, ChevronRight, Award
} from 'lucide-react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const RankingAlunos = () => {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTempo, setFiltroTempo] = useState('total');

  useEffect(() => {
    carregarRanking();
  }, [filtroTempo]);

  const carregarRanking = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/ranking/?periodo=${filtroTempo}`);
      setRanking(res.data);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (posicao) => {
    switch (posicao) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-400';
      default: return 'text-gray-300';
    }
  };

  const getMedalBg = (posicao) => {
    switch (posicao) {
      case 1: return 'bg-yellow-50 border-yellow-200';
      case 2: return 'bg-gray-50 border-gray-200';
      case 3: return 'bg-orange-50 border-orange-200';
      default: return 'bg-white border-gray-200';
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
      <div className="ml-64 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Ranking de Estudos</h1>
          </div>
          <p className="text-yellow-100">
            Veja quem está estudando mais e acompanhe o desempenho dos alunos
          </p>
        </div>
      </div>

      <main className="ml-64 px-8 py-8">
        {/* Filtros */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Período:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroTempo('7dias')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroTempo === '7dias'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => setFiltroTempo('30dias')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroTempo === '30dias'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Últimos 30 dias
            </button>
            <button
              onClick={() => setFiltroTempo('total')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroTempo === 'total'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Todo o período
            </button>
          </div>
        </div>

        {/* Top 3 */}
        {ranking.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* 2º Lugar */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 order-1 md:order-1">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Medal className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-400 mb-1">2º</p>
                <h3 className="font-semibold text-gray-900 truncate">{ranking[1]?.nome}</h3>
                <p className="text-sm text-gray-500">{ranking[1]?.plano || 'Sem plano'}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-2xl font-bold text-gray-900">{ranking[1]?.tempo_horas}h</p>
                  <p className="text-xs text-gray-500">de estudo</p>
                </div>
              </div>
            </div>

            {/* 1º Lugar */}
            <div className="bg-gradient-to-b from-yellow-50 to-white rounded-xl shadow-lg border-2 border-yellow-300 p-6 order-0 md:order-2 transform md:-translate-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-4">
                  <Trophy className="h-10 w-10 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-yellow-500 mb-1">1º</p>
                <h3 className="font-bold text-gray-900 text-lg truncate">{ranking[0]?.nome}</h3>
                <p className="text-sm text-gray-500">{ranking[0]?.plano || 'Sem plano'}</p>
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <p className="text-3xl font-bold text-gray-900">{ranking[0]?.tempo_horas}h</p>
                  <p className="text-xs text-gray-500">de estudo</p>
                </div>
              </div>
            </div>

            {/* 3º Lugar */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 p-6 order-2 md:order-3">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                  <Award className="h-8 w-8 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-orange-400 mb-1">3º</p>
                <h3 className="font-semibold text-gray-900 truncate">{ranking[2]?.nome}</h3>
                <p className="text-sm text-gray-500">{ranking[2]?.plano || 'Sem plano'}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-2xl font-bold text-gray-900">{ranking[2]?.tempo_horas}h</p>
                  <p className="text-xs text-gray-500">de estudo</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista completa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Ranking Completo</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {ranking.map((aluno) => (
              <div 
                key={aluno.id}
                onClick={() => navigate(`/admin/aluno/${aluno.id}`)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition ${getMedalBg(aluno.posicao)}`}
              >
                <div className="flex items-center gap-4">
                  {/* Posição */}
                  <div className="flex-shrink-0 w-12 text-center">
                    {aluno.posicao <= 3 ? (
                      <Medal className={`h-8 w-8 mx-auto ${getMedalColor(aluno.posicao)}`} />
                    ) : (
                      <span className="text-2xl font-bold text-gray-300">{aluno.posicao}º</span>
                    )}
                  </div>
                  
                  {/* Info do aluno */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{aluno.nome}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{aluno.plano || 'Sem plano'}</span>
                      {aluno.ultima_atividade && (
                        <span>Última atividade: {new Date(aluno.ultima_atividade).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Estatísticas */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-blue-600">
                        <Clock className="h-4 w-4" />
                        <span className="font-bold">{aluno.tempo_horas}h</span>
                      </div>
                      <p className="text-xs text-gray-400">Tempo</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-purple-600">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-bold">{aluno.assuntos_estudados}</span>
                      </div>
                      <p className="text-xs text-gray-400">Assuntos</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-green-600">
                        <Target className="h-4 w-4" />
                        <span className="font-bold">{aluno.percentual_concluido}%</span>
                      </div>
                      <p className="text-xs text-gray-400">Concluído</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-orange-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-bold">{aluno.dias_estudados}</span>
                      </div>
                      <p className="text-xs text-gray-400">Dias</p>
                    </div>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
            
            {ranking.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Nenhum aluno encontrado com atividade no período selecionado
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RankingAlunos;
