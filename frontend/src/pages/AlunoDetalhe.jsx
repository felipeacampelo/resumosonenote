import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Target, FileText, BookOpen, Calendar,
  Flame, Award, BarChart3, TrendingUp, Filter
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

const AlunoDetalhe = () => {
  const { alunoId } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroTempo, setFiltroTempo] = useState('total');

  useEffect(() => {
    carregarDados();
  }, [alunoId]);

  const carregarDados = async () => {
    try {
      const res = await api.get(`/alunos/${alunoId}/`);
      setDados(res.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tooltip customizado para o gráfico de pizza
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.nome}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              <strong>{data.tempo_horas}h</strong> estudadas
            </p>
            <p className="text-gray-600">
              <strong>{data.assuntos_estudados}/{data.total_assuntos}</strong> assuntos
            </p>
            <p className="text-gray-600">
              <strong>{data.percentual_concluido}%</strong> concluído
            </p>
            {data.questoes_feitas > 0 && (
              <p className="text-gray-600">
                <strong>{data.percentual_acerto}%</strong> de acerto
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Aluno não encontrado</h2>
          <button
            onClick={() => navigate('/admin/alunos')}
            className="text-purple-600 hover:text-purple-700"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  const { 
    aluno, 
    plano, 
    estatisticas_gerais, 
    sequencia, 
    datas,
    disciplina_mais_estudada,
    por_disciplina,
    top_assuntos,
    assuntos_recentes,
    historico_diario
  } = dados;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="ml-64 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="px-8 py-6">
          <button
            onClick={() => navigate('/admin/alunos')}
            className="flex items-center gap-2 text-purple-200 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para lista
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{aluno.nome}</h1>
              <p className="text-purple-200 mt-1">{aluno.email}</p>
            </div>
            {plano?.nome && (
              <div className="text-right">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {plano.sigla || plano.nome}
                </span>
                <p className="text-xs text-purple-200 mt-1">
                  Desde {plano.data_inicio ? new Date(plano.data_inicio).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
            )}
          </div>

          {/* Cards de Destaque */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-400 rounded-lg flex items-center justify-center">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sequencia?.streak_atual || 0}</p>
                  <p className="text-purple-200 text-sm">Dias seguidos</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-400 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{estatisticas_gerais?.percentual_concluido || 0}%</p>
                  <p className="text-purple-200 text-sm">Concluído</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-400 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{estatisticas_gerais?.tempo_total_horas || 0}h</p>
                  <p className="text-purple-200 text-sm">Estudadas</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{estatisticas_gerais?.percentual_acerto || 0}%</p>
                  <p className="text-purple-200 text-sm">Acerto</p>
                </div>
              </div>
            </div>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gráfico de Pizza das Disciplinas */}
            {por_disciplina && por_disciplina.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Tempo por Disciplina</h2>
                <p className="text-sm text-gray-500 mb-4">Passe o mouse sobre cada fatia para ver detalhes</p>
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Gráfico */}
                  <div className="h-72 w-full lg:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={por_disciplina}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="tempo_minutos"
                        >
                          {por_disciplina.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legenda customizada */}
                  <div className="w-full lg:w-1/2">
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {por_disciplina.map((disc, index) => (
                        <div key={disc.nome} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{disc.nome}</p>
                            <p className="text-xs text-gray-500">
                              {disc.tempo_horas}h • {disc.assuntos_estudados}/{disc.total_assuntos} assuntos • {disc.percentual_concluido}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estatísticas Detalhadas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas Gerais</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">
                    {estatisticas_gerais?.assuntos_estudados || 0}
                  </p>
                  <p className="text-sm text-gray-600">Assuntos Estudados</p>
                  <p className="text-xs text-gray-400">de {estatisticas_gerais?.total_assuntos || 0}</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {sequencia?.total_dias_estudados || 0}
                  </p>
                  <p className="text-sm text-gray-600">Dias Estudados</p>
                  <p className="text-xs text-gray-400">desde o início</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {estatisticas_gerais?.questoes_feitas || 0}
                  </p>
                  <p className="text-sm text-gray-600">Questões Feitas</p>
                  <p className="text-xs text-gray-400">{estatisticas_gerais?.questoes_acertadas || 0} acertadas</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-orange-600">
                    {sequencia?.streak_maximo || 0}
                  </p>
                  <p className="text-sm text-gray-600">Maior Sequência</p>
                  <p className="text-xs text-gray-400">dias consecutivos</p>
                </div>
              </div>

              {/* Médias */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Médias Diárias</h3>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      <strong>{Math.round(sequencia?.media_tempo_diario || 0)}</strong> min/dia
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      <strong>{Math.round(sequencia?.media_questoes_diario || 0)}</strong> questões/dia
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progresso por Disciplina */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Progresso por Disciplina</h2>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              
              {por_disciplina && por_disciplina.length > 0 ? (
                <div className="space-y-4">
                  {por_disciplina.map((disc, idx) => (
                    <div key={disc.nome}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {idx === 0 && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              🏆 Mais estudada
                            </span>
                          )}
                          <span className="text-sm font-medium text-gray-700">{disc.nome}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{disc.tempo_horas}h</span>
                          <span>{disc.assuntos_estudados}/{disc.total_assuntos}</span>
                        </div>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            idx === 0 ? 'bg-yellow-500' : 'bg-purple-600'
                          }`}
                          style={{ width: `${disc.percentual_concluido}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span>{disc.percentual_concluido}% concluído</span>
                        {disc.questoes_feitas > 0 && (
                          <span>{disc.percentual_acerto}% acerto em questões</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Nenhum progresso registrado ainda
                </p>
              )}
            </div>

            {/* Histórico de Atividades */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Atividade nos Últimos 30 Dias
              </h2>
              
              {historico_diario && historico_diario.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 30 }, (_, i) => {
                    const data = new Date();
                    data.setDate(data.getDate() - (29 - i));
                    const dataStr = data.toISOString().split('T')[0];
                    const atividade = historico_diario.find(h => h.data === dataStr);
                    const tempoMinutos = atividade?.tempo_minutos || 0;
                    
                    let bgColor = 'bg-gray-100';
                    if (tempoMinutos > 0 && tempoMinutos < 30) bgColor = 'bg-green-200';
                    else if (tempoMinutos >= 30 && tempoMinutos < 60) bgColor = 'bg-green-400';
                    else if (tempoMinutos >= 60 && tempoMinutos < 120) bgColor = 'bg-green-500';
                    else if (tempoMinutos >= 120) bgColor = 'bg-green-600';
                    
                    return (
                      <div
                        key={dataStr}
                        className={`w-6 h-6 rounded ${bgColor}`}
                        title={`${data.toLocaleDateString('pt-BR')}: ${tempoMinutos} min`}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma atividade registrada
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <span>Menos</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-gray-100" />
                  <div className="w-4 h-4 rounded bg-green-200" />
                  <div className="w-4 h-4 rounded bg-green-400" />
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <div className="w-4 h-4 rounded bg-green-600" />
                </div>
                <span>Mais</span>
              </div>
            </div>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Informações do Aluno */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{aluno.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cadastro</p>
                  <p className="font-medium">
                    {aluno.data_cadastro 
                      ? new Date(aluno.data_cadastro).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plano Atual</p>
                  <p className="font-medium">{plano?.nome || 'Sem plano'}</p>
                </div>
              </div>
            </div>

            {/* Datas Importantes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Linha do Tempo</h2>
              
              <div className="space-y-4">
                {plano?.data_inicio && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Início do Plano</p>
                      <p className="text-xs text-gray-500">
                        {new Date(plano.data_inicio).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {datas?.primeira_sessao && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Primeira Sessão</p>
                      <p className="text-xs text-gray-500">
                        {new Date(datas.primeira_sessao).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {datas?.ultima_sessao && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Última Sessão</p>
                      <p className="text-xs text-gray-500">
                        {new Date(datas.ultima_sessao).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Assuntos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Top 5 Assuntos Mais Estudados
              </h2>
              
              {top_assuntos && top_assuntos.length > 0 ? (
                <div className="space-y-3">
                  {top_assuntos.map((assunto, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className={`text-lg font-bold ${
                        idx === 0 ? 'text-yellow-500' :
                        idx === 1 ? 'text-gray-400' :
                        idx === 2 ? 'text-orange-400' :
                        'text-gray-300'
                      }`}>
                        {idx + 1}º
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {assunto.nome}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assunto.tempo_horas}h • {assunto.questoes_feitas} questões
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">
                  Nenhum assunto estudado ainda
                </p>
              )}
            </div>

            {/* Assuntos Recentes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Estudados Recentemente</h2>
              
              {assuntos_recentes && assuntos_recentes.length > 0 ? (
                <div className="space-y-3">
                  {assuntos_recentes.map((assunto, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-2 ${
                        assunto.estudado ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {assunto.nome}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assunto.disciplina} • {new Date(assunto.ultima_sessao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AlunoDetalhe;
