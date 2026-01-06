import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  BookOpen, Clock, Target, CheckCircle, 
  Plus, Calendar, FileText, ChevronDown, ChevronUp, History, X 
} from 'lucide-react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const MeusEstudos = () => {
  const { concursoId } = useParams();
  const [concurso, setConcurso] = useState(null);
  const [mapas, setMapas] = useState([]);
  const [progressos, setProgressos] = useState({});
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [expandedDisciplina, setExpandedDisciplina] = useState(null);
  const [expandedAssunto, setExpandedAssunto] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState('');
  const [assuntoSelecionado, setAssuntoSelecionado] = useState(null);
  const [novaSessao, setNovaSessao] = useState({
    data: new Date().toISOString().split('T')[0],
    tempo_minutos: 0,
    questoes_feitas: 0,
    questoes_acertadas: 0,
    observacoes: ''
  });

  useEffect(() => {
    carregarDados();
  }, [concursoId]);

  const carregarDados = async () => {
    try {
      const [concursoRes, mapasRes, progressosRes] = await Promise.all([
        api.get(`/concursos/${concursoId}/`),
        api.get(`/mapas/?concurso=${concursoId}`),
        api.get(`/progressos/`)
      ]);
      
      setConcurso(concursoRes.data);
      const mapasData = mapasRes.data.results || mapasRes.data;
      setMapas(mapasData);
      
      // Criar mapa de progressos por mapa_assunto
      const progressosData = progressosRes.data.results || progressosRes.data;
      const progressosMap = {};
      progressosData.forEach(p => {
        progressosMap[p.mapa_assunto] = p;
      });
      setProgressos(progressosMap);
      
      // IDs dos mapas deste concurso
      const mapasIds = mapasData.map(m => m.id);
      
      // Filtrar progressos apenas deste concurso
      const progressosDoConcurso = progressosData.filter(p => mapasIds.includes(p.mapa_assunto));
      
      // Calcular estatísticas localmente
      const totalAssuntos = mapasData.length;
      const assuntosEstudados = progressosDoConcurso.filter(p => p.estudado).length;
      const tempoTotal = progressosDoConcurso.reduce((acc, p) => acc + (p.tempo_total_minutos || 0), 0);
      const questoesFeitas = progressosDoConcurso.reduce((acc, p) => acc + (p.questoes_feitas || 0), 0);
      const questoesAcertadas = progressosDoConcurso.reduce((acc, p) => acc + (p.questoes_acertadas || 0), 0);
      
      setEstatisticas({
        total_assuntos: totalAssuntos,
        assuntos_estudados: assuntosEstudados,
        percentual_concluido: totalAssuntos > 0 ? Math.round((assuntosEstudados / totalAssuntos) * 100) : 0,
        tempo_total_minutos: tempoTotal,
        tempo_total_horas: Math.round(tempoTotal / 60 * 10) / 10,
        questoes_feitas: questoesFeitas,
        questoes_acertadas: questoesAcertadas,
        percentual_acerto_geral: questoesFeitas > 0 ? Math.round((questoesAcertadas / questoesFeitas) * 100) : 0
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarEstudado = async (mapaId, estudado) => {
    setSalvando(true);
    try {
      let progresso = progressos[mapaId];
      
      if (!progresso) {
        // Criar progresso se não existir
        const res = await api.post('/progressos/', {
          mapa_assunto: mapaId,
          estudado: estudado
        });
        progresso = res.data;
      } else {
        // Atualizar progresso existente
        const res = await api.post(`/progressos/${progresso.id}/marcar_estudado/`, {
          estudado: estudado
        });
        progresso = res.data;
      }
      
      setProgressos(prev => ({
        ...prev,
        [mapaId]: progresso
      }));
      
      // Recarregar dados para atualizar estatísticas
      await carregarDados();
    } catch (error) {
      console.error('Erro ao marcar estudado:', error);
      alert('Erro ao salvar. Verifique o console.');
    } finally {
      setSalvando(false);
    }
  };

  const abrirModalSessao = () => {
    setDisciplinaSelecionada('');
    setAssuntoSelecionado(null);
    setNovaSessao({
      data: new Date().toISOString().split('T')[0],
      tempo_minutos: 0,
      questoes_feitas: 0,
      questoes_acertadas: 0,
      observacoes: ''
    });
    setModalAberto(true);
  };

  const handleDisciplinaChange = (disciplina) => {
    setDisciplinaSelecionada(disciplina);
    setAssuntoSelecionado(null);
  };

  const salvarSessao = async () => {
    setSalvando(true);
    try {
      let progresso = progressos[assuntoSelecionado.id];
      let progressoId;
      
      // Criar progresso se não existir
      if (!progresso || !progresso.id) {
        const res = await api.post('/progressos/', {
          mapa_assunto: assuntoSelecionado.id,
          estudado: false
        });
        progresso = res.data;
        progressoId = progresso.id;
        
        // Atualizar o estado local
        setProgressos(prev => ({
          ...prev,
          [assuntoSelecionado.id]: progresso
        }));
      } else {
        progressoId = progresso.id;
      }
      
      // Criar sessão (converter strings vazias para 0)
      await api.post('/sessoes/', {
        progresso: progressoId,
        data: novaSessao.data,
        tempo_minutos: novaSessao.tempo_minutos === '' ? 0 : (novaSessao.tempo_minutos || 0),
        questoes_feitas: novaSessao.questoes_feitas === '' ? 0 : (novaSessao.questoes_feitas || 0),
        questoes_acertadas: novaSessao.questoes_acertadas === '' ? 0 : (novaSessao.questoes_acertadas || 0),
        observacoes: novaSessao.observacoes || ''
      });
      
      // Recarregar dados
      await carregarDados();
      setModalAberto(false);
      setExpandedAssunto(assuntoSelecionado.id); // Expandir para mostrar a nova sessão
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
      console.error('Detalhes:', error.response?.data);
      alert(`Erro ao salvar sessão: ${JSON.stringify(error.response?.data) || error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  // Agrupar mapas por disciplina
  const mapasPorDisciplina = mapas.reduce((acc, mapa) => {
    const disciplina = mapa.disciplina_nome || 'Outros';
    if (!acc[disciplina]) {
      acc[disciplina] = [];
    }
    acc[disciplina].push(mapa);
    return acc;
  }, {});

  const disciplinas = Object.keys(mapasPorDisciplina).sort();

  // Assuntos da disciplina selecionada no modal
  const assuntosDaDisciplina = disciplinaSelecionada ? mapasPorDisciplina[disciplinaSelecionada] || [] : [];

  // Calcular progresso por disciplina
  const getProgressoDisciplina = (disciplina) => {
    const assuntos = mapasPorDisciplina[disciplina];
    const estudados = assuntos.filter(m => progressos[m.id]?.estudado).length;
    return { total: assuntos.length, estudados };
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
        <div className="px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Estudos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {concurso?.nome} • Acompanhe seu progresso
            </p>
          </div>
          <button
            onClick={abrirModalSessao}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            <Plus className="h-5 w-5" />
            Registrar Estudo
          </button>
        </div>
      </div>

      <main className="ml-64 px-8 py-8">
        {/* Estatísticas Gerais */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {estatisticas.assuntos_estudados}/{estatisticas.total_assuntos}
                  </p>
                  <p className="text-sm text-gray-600">Assuntos Estudados</p>
                </div>
              </div>
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${estatisticas.percentual_concluido}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{estatisticas.percentual_concluido}% concluído</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.tempo_total_horas}h</p>
                  <p className="text-sm text-gray-600">Tempo Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.questoes_feitas}</p>
                  <p className="text-sm text-gray-600">Questões Feitas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.percentual_acerto_geral}%</p>
                  <p className="text-sm text-gray-600">Taxa de Acerto</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Disciplinas */}
        <div className="space-y-4">
          {disciplinas.map((disciplina) => {
            const isExpanded = expandedDisciplina === disciplina;
            const progressoDisciplina = getProgressoDisciplina(disciplina);
            const assuntosDisciplina = mapasPorDisciplina[disciplina];
            
            return (
              <div key={disciplina} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header da Disciplina */}
                <button
                  onClick={() => setExpandedDisciplina(isExpanded ? null : disciplina)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{disciplina}</h3>
                      <p className="text-sm text-gray-500">
                        {progressoDisciplina.estudados}/{progressoDisciplina.total} assuntos estudados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${(progressoDisciplina.estudados / progressoDisciplina.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-12">
                      {Math.round((progressoDisciplina.estudados / progressoDisciplina.total) * 100)}%
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {/* Lista de Assuntos da Disciplina */}
                {isExpanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {assuntosDisciplina.map((mapa) => {
                      const progresso = progressos[mapa.id];
                      const isAssuntoExpanded = expandedAssunto === mapa.id;
                      const totalSessoes = progresso?.total_sessoes || progresso?.sessoes?.length || 0;
                      
                      return (
                        <div key={mapa.id} className="hover:bg-gray-50">
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                {/* Checkbox de estudado */}
                                <button
                                  onClick={() => marcarEstudado(mapa.id, !progresso?.estudado)}
                                  disabled={salvando}
                                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition ${
                                    progresso?.estudado 
                                      ? 'bg-green-500 border-green-500 text-white' 
                                      : 'border-gray-300 hover:border-green-400'
                                  } ${salvando ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {progresso?.estudado && <CheckCircle className="h-4 w-4" />}
                                </button>
                                
                                <div className="flex-1">
                                  <h4 className={`font-medium ${progresso?.estudado ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                    {mapa.nome_completo}
                                  </h4>
                                  
                                  {/* Mini estatísticas */}
                                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                    {progresso && progresso.tempo_total_minutos > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {Math.floor(progresso.tempo_total_minutos / 60)}h {progresso.tempo_total_minutos % 60}min
                                      </span>
                                    )}
                                    {progresso && progresso.questoes_feitas > 0 && (
                                      <span className="flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {progresso.questoes_acertadas}/{progresso.questoes_feitas} ({progresso.percentual_acerto}%)
                                      </span>
                                    )}
                                    {totalSessoes > 0 && (
                                      <button
                                        onClick={() => setExpandedAssunto(isAssuntoExpanded ? null : mapa.id)}
                                        className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                                      >
                                        <History className="h-3 w-3" />
                                        {totalSessoes} {totalSessoes === 1 ? 'sessão' : 'sessões'}
                                      </button>
                                    )}
                                    {progresso?.ultima_sessao && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(progresso.ultima_sessao).toLocaleDateString('pt-BR')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                            </div>
                          </div>
                          
                          {/* Histórico de Sessões */}
                          {isAssuntoExpanded && progresso?.sessoes && progresso.sessoes.length > 0 && (
                            <div className="px-4 pb-4 pt-0">
                              <div className="bg-gray-50 rounded-lg p-3 ml-10">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-sm font-medium text-gray-700">Histórico de Sessões</h5>
                                  <button
                                    onClick={() => setExpandedAssunto(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {progresso.sessoes.map((sessao, idx) => (
                                    <div key={sessao.id || idx} className="flex items-center justify-between text-xs bg-white rounded p-2">
                                      <div className="flex items-center gap-3">
                                        <span className="text-gray-500">
                                          {new Date(sessao.data).toLocaleDateString('pt-BR')}
                                        </span>
                                        {sessao.tempo_minutos > 0 && (
                                          <span className="text-blue-600">
                                            {sessao.tempo_minutos} min
                                          </span>
                                        )}
                                        {sessao.questoes_feitas > 0 && (
                                          <span className="text-green-600">
                                            {sessao.questoes_acertadas}/{sessao.questoes_feitas} questões
                                          </span>
                                        )}
                                      </div>
                                      {sessao.observacoes && (
                                        <span className="text-gray-400 truncate max-w-32" title={sessao.observacoes}>
                                          {sessao.observacoes}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal de Nova Sessão */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Registrar Sessão de Estudo
            </h3>
            
            <div className="space-y-4">
              {/* Seletor de Disciplina */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disciplina *
                </label>
                <select
                  value={disciplinaSelecionada}
                  onChange={(e) => handleDisciplinaChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecione uma disciplina</option>
                  {disciplinas.map((disc) => (
                    <option key={disc} value={disc}>{disc}</option>
                  ))}
                </select>
              </div>
              
              {/* Seletor de Assunto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assunto *
                </label>
                <select
                  value={assuntoSelecionado?.id || ''}
                  onChange={(e) => {
                    const mapa = assuntosDaDisciplina.find(m => m.id === parseInt(e.target.value));
                    setAssuntoSelecionado(mapa || null);
                  }}
                  disabled={!disciplinaSelecionada}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {disciplinaSelecionada ? 'Selecione um assunto' : 'Selecione uma disciplina primeiro'}
                  </option>
                  {assuntosDaDisciplina.map((mapa) => (
                    <option key={mapa.id} value={mapa.id}>{mapa.nome_completo}</option>
                  ))}
                </select>
              </div>

              <hr className="border-gray-200" />
              
              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={novaSessao.data}
                  onChange={(e) => setNovaSessao({ ...novaSessao, data: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Tempo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempo de Estudo (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  value={novaSessao.tempo_minutos}
                  onChange={(e) => setNovaSessao({ ...novaSessao, tempo_minutos: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: 60"
                />
              </div>
              
              {/* Questões */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Questões Feitas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={novaSessao.questoes_feitas}
                    onChange={(e) => setNovaSessao({ ...novaSessao, questoes_feitas: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Questões Acertadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={novaSessao.questoes_feitas}
                    value={novaSessao.questoes_acertadas}
                    onChange={(e) => setNovaSessao({ ...novaSessao, questoes_acertadas: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={novaSessao.observacoes}
                  onChange={(e) => setNovaSessao({ ...novaSessao, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Anotações sobre o estudo..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalAberto(false)}
                disabled={salvando}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={salvarSessao}
                disabled={salvando || !assuntoSelecionado}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeusEstudos;
