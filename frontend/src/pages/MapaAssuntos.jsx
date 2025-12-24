import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Plus, Trash2, Save, ArrowLeft, Search, Edit, X } from 'lucide-react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

// Componente Modal de Metadados
const MetadadosModal = ({ mapa, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    paginas_minutos: 0,
    minutos_expresso: 0,
    minutos_regular: 0,
    minutos_calma: 0,
    dica: '',
    dica_revisoes: '',
    dica_questoes: '',
    referencia: '',
    peso_resumos: 1,
    peso_revisoes: 1,
    peso_questoes: 1,
    numero_questoes: 0,
    link_estrategia: '',
    link_direcao: '',
    link_pdf: '',
    link_resumo: '',
    link_questoes: '',
    link_video: '',
    relevancia: 'media',
    suplementar: false,
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarMetadados();
  }, [mapa.id]);

  const carregarMetadados = async () => {
    try {
      const response = await api.get(`/metadados/?mapa_assunto=${mapa.id}`);
      if (response.data.length > 0) {
        const meta = response.data[0];
        setFormData({
          id: meta.id,
          paginas_minutos: meta.paginas_minutos || 0,
          minutos_expresso: meta.minutos_expresso || 0,
          minutos_regular: meta.minutos_regular || 0,
          minutos_calma: meta.minutos_calma || 0,
          dica: meta.dica || '',
          dica_revisoes: meta.dica_revisoes || '',
          dica_questoes: meta.dica_questoes || '',
          referencia: meta.referencia || '',
          peso_resumos: meta.peso_resumos || 1,
          peso_revisoes: meta.peso_revisoes || 1,
          peso_questoes: meta.peso_questoes || 1,
          numero_questoes: meta.numero_questoes || 0,
          link_estrategia: meta.link_estrategia || '',
          link_direcao: meta.link_direcao || '',
          link_pdf: meta.link_pdf || '',
          link_resumo: meta.link_resumo || '',
          link_questoes: meta.link_questoes || '',
          link_video: meta.link_video || '',
          relevancia: meta.relevancia || 'media',
          suplementar: meta.suplementar || false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar metadados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload = {
        ...formData,
        mapa_assunto: mapa.id,
      };
      
      if (formData.id) {
        await api.put(`/metadados/${formData.id}/`, payload);
      } else {
        await api.post('/metadados/', payload);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar metadados:', error);
      alert('Erro ao salvar metadados');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-purple-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Editar Metadados</h2>
            <p className="text-sm text-gray-600">{mapa.nome_completo || mapa.assunto_nome}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Relevância */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Relevância para o Concurso</label>
              <select
                name="relevancia"
                value={formData.relevancia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="muito_alta">Muito Alta</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
                <option value="muito_baixa">Muito Baixa</option>
              </select>
            </div>

            {/* Dicas */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Dicas (máx. 500 caracteres)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Dica Geral <span className="text-gray-400">({formData.dica.length}/500)</span>
                  </label>
                  <textarea
                    name="dica"
                    value={formData.dica}
                    onChange={handleChange}
                    maxLength={500}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Dica de Revisões <span className="text-gray-400">({formData.dica_revisoes.length}/500)</span>
                    </label>
                    <textarea
                      name="dica_revisoes"
                      value={formData.dica_revisoes}
                      onChange={handleChange}
                      maxLength={500}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Dica de Questões <span className="text-gray-400">({formData.dica_questoes.length}/500)</span>
                    </label>
                    <textarea
                      name="dica_questoes"
                      value={formData.dica_questoes}
                      onChange={handleChange}
                      maxLength={500}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Referência */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Referência <span className="text-gray-400">({formData.referencia.length}/500)</span>
              </label>
              <textarea
                name="referencia"
                value={formData.referencia}
                onChange={handleChange}
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
              />
            </div>

            {/* Links de Cursinhos */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Links de Estudo (editáveis por concurso)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link Estratégia</label>
                  <input
                    type="text"
                    name="link_estrategia"
                    value={formData.link_estrategia}
                    onChange={handleChange}
                    maxLength={500}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link Direção</label>
                  <input
                    type="text"
                    name="link_direcao"
                    value={formData.link_direcao}
                    onChange={handleChange}
                    maxLength={500}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link PDF</label>
                  <input
                    type="text"
                    name="link_pdf"
                    value={formData.link_pdf}
                    onChange={handleChange}
                    maxLength={500}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link Vídeo</label>
                  <input
                    type="text"
                    name="link_video"
                    value={formData.link_video}
                    onChange={handleChange}
                    maxLength={500}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link Resumo</label>
                  <input
                    type="text"
                    name="link_resumo"
                    value={formData.link_resumo}
                    onChange={handleChange}
                    maxLength={500}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link Questões</label>
                  <input
                    type="text"
                    name="link_questoes"
                    value={formData.link_questoes}
                    onChange={handleChange}
                    maxLength={500}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={salvando}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {salvando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const MapaAssuntos = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [concurso, setConcurso] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [mapas, setMapas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [expandedDisciplinas, setExpandedDisciplinas] = useState({});
  const [expandedAssuntos, setExpandedAssuntos] = useState({});
  const [mapaParaEditar, setMapaParaEditar] = useState(null);
  const [buscaEsquerda, setBuscaEsquerda] = useState('');
  const [buscaDireita, setBuscaDireita] = useState('');

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      const [concursoRes, disciplinasRes, mapasRes] = await Promise.all([
        api.get(`/concursos/${id}/`),
        api.get('/disciplinas/'),
        api.get(`/mapas/?concurso=${id}`)
      ]);
      
      setConcurso(concursoRes.data);
      setDisciplinas(disciplinasRes.data);
      setMapas(mapasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDisciplina = (disciplinaId) => {
    setExpandedDisciplinas(prev => ({
      ...prev,
      [disciplinaId]: !prev[disciplinaId]
    }));
  };

  const toggleAssunto = (assuntoId) => {
    setExpandedAssuntos(prev => ({
      ...prev,
      [assuntoId]: !prev[assuntoId]
    }));
  };

  const isAssuntoNoMapa = (assuntoId, subassuntoId = null) => {
    return mapas.some(m => 
      m.assunto === assuntoId && 
      (subassuntoId === null || m.subassunto === subassuntoId)
    );
  };

  const isDisciplinaNoMapa = (disciplina) => {
    // Verifica se todos os assuntos/subassuntos da disciplina estão no mapa
    if (!disciplina.assuntos?.length) return false;
    
    return disciplina.assuntos.every(assunto => {
      if (assunto.subassuntos?.length > 0) {
        return assunto.subassuntos.every(sub => isAssuntoNoMapa(assunto.id, sub.id));
      }
      return isAssuntoNoMapa(assunto.id);
    });
  };

  const isDisciplinaParcialNoMapa = (disciplina) => {
    // Verifica se pelo menos um assunto/subassunto da disciplina está no mapa
    if (!disciplina.assuntos?.length) return false;
    
    return disciplina.assuntos.some(assunto => {
      if (assunto.subassuntos?.length > 0) {
        return assunto.subassuntos.some(sub => isAssuntoNoMapa(assunto.id, sub.id));
      }
      return isAssuntoNoMapa(assunto.id);
    });
  };

  const adicionarAoMapa = async (assunto, subassunto = null) => {
    try {
      // Se está adicionando um assunto (não subassunto) que tem subassuntos,
      // adiciona todos os subassuntos automaticamente
      if (!subassunto && assunto.subassuntos?.length > 0) {
        const novosMapas = [];
        let ordemAtual = mapas.length + 1;
        
        for (const sub of assunto.subassuntos) {
          // Verifica se já não está no mapa
          if (!isAssuntoNoMapa(assunto.id, sub.id)) {
            const novoMapa = {
              concurso: parseInt(id),
              assunto: assunto.id,
              subassunto: sub.id,
              ordem: ordemAtual++,
            };
            const response = await api.post('/mapas/', novoMapa);
            novosMapas.push(response.data);
          }
        }
        
        setMapas(prev => [...prev, ...novosMapas]);
      } else {
        // Lógica original para subassunto individual ou assunto sem subassuntos
        const novoMapa = {
          concurso: parseInt(id),
          assunto: assunto.id,
          subassunto: subassunto?.id || null,
          ordem: mapas.length + 1,
        };
        
        const response = await api.post('/mapas/', novoMapa);
        setMapas(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Erro ao adicionar ao mapa:', error);
      alert('Erro ao adicionar assunto ao mapa');
    }
  };

  const removerDoMapa = async (mapaId) => {
    try {
      await api.delete(`/mapas/${mapaId}/`);
      setMapas(prev => prev.filter(m => m.id !== mapaId));
    } catch (error) {
      console.error('Erro ao remover do mapa:', error);
      alert('Erro ao remover assunto do mapa');
    }
  };

  const removerAssuntoCompletoDoMapa = async (assuntoId) => {
    try {
      // Encontra todos os mapas desse assunto (incluindo subassuntos)
      const mapasDoAssunto = mapas.filter(m => m.assunto === assuntoId);
      
      // Remove todos
      for (const mapa of mapasDoAssunto) {
        await api.delete(`/mapas/${mapa.id}/`);
      }
      
      setMapas(prev => prev.filter(m => m.assunto !== assuntoId));
    } catch (error) {
      console.error('Erro ao remover assuntos do mapa:', error);
      alert('Erro ao remover assuntos do mapa');
    }
  };

  const adicionarDisciplinaAoMapa = async (disciplina) => {
    try {
      const novosMapas = [];
      let ordemAtual = mapas.length + 1;
      
      for (const assunto of disciplina.assuntos || []) {
        if (assunto.subassuntos?.length > 0) {
          // Adiciona todos os subassuntos
          for (const sub of assunto.subassuntos) {
            if (!isAssuntoNoMapa(assunto.id, sub.id)) {
              const novoMapa = {
                concurso: parseInt(id),
                assunto: assunto.id,
                subassunto: sub.id,
                ordem: ordemAtual++,
              };
              const response = await api.post('/mapas/', novoMapa);
              novosMapas.push(response.data);
            }
          }
        } else {
          // Adiciona o assunto sem subassuntos
          if (!isAssuntoNoMapa(assunto.id)) {
            const novoMapa = {
              concurso: parseInt(id),
              assunto: assunto.id,
              subassunto: null,
              ordem: ordemAtual++,
            };
            const response = await api.post('/mapas/', novoMapa);
            novosMapas.push(response.data);
          }
        }
      }
      
      setMapas(prev => [...prev, ...novosMapas]);
    } catch (error) {
      console.error('Erro ao adicionar disciplina ao mapa:', error);
      alert('Erro ao adicionar disciplina ao mapa');
    }
  };

  const removerDisciplinaDoMapa = async (disciplina) => {
    try {
      // Encontra todos os IDs de assuntos da disciplina
      const assuntoIds = disciplina.assuntos?.map(a => a.id) || [];
      
      // Encontra todos os mapas dessa disciplina
      const mapasDaDisciplina = mapas.filter(m => assuntoIds.includes(m.assunto));
      
      // Remove todos
      for (const mapa of mapasDaDisciplina) {
        await api.delete(`/mapas/${mapa.id}/`);
      }
      
      setMapas(prev => prev.filter(m => !assuntoIds.includes(m.assunto)));
    } catch (error) {
      console.error('Erro ao remover disciplina do mapa:', error);
      alert('Erro ao remover disciplina do mapa');
    }
  };

  const filtrarDisciplinas = (disciplinas, busca) => {
    if (!busca) return disciplinas;
    
    return disciplinas.filter(d => {
      const matchDisciplina = d.nome.toLowerCase().includes(busca.toLowerCase());
      const matchAssuntos = d.assuntos?.some(a => 
        a.nome.toLowerCase().includes(busca.toLowerCase()) ||
        a.subassuntos?.some(s => s.nome.toLowerCase().includes(busca.toLowerCase()))
      );
      return matchDisciplina || matchAssuntos;
    });
  };

  const filtrarMapas = (mapas, busca) => {
    if (!busca) return mapas;
    
    return mapas.filter(m => 
      m.assunto_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      m.subassunto_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      m.disciplina_nome?.toLowerCase().includes(busca.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!concurso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Plano não encontrado</h2>
          <button
            onClick={() => navigate('/planos')}
            className="text-purple-600 hover:text-purple-700"
          >
            Voltar aos Planos
          </button>
        </div>
      </div>
    );
  }

  const disciplinasFiltradas = filtrarDisciplinas(disciplinas, buscaEsquerda);
  const mapasFiltrados = filtrarMapas(mapas, buscaDireita);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="ml-64 bg-white border-b sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/planos')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Mapa de Assuntos: {concurso.nome}
              </h1>
              <p className="text-sm text-gray-500">
                {concurso.sigla} • {mapas.length} assuntos selecionados
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/concurso/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Save className="h-4 w-4" />
            Ver Plano Final
          </button>
        </div>
      </div>

      {/* Conteúdo - Dois Boxes */}
      <main className="ml-64 p-6">
        <div className="grid grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          
          {/* Box Esquerda - Base de Assuntos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Base de Assuntos
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar assuntos..."
                  value={buscaEsquerda}
                  onChange={(e) => setBuscaEsquerda(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {disciplinasFiltradas.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum assunto encontrado</p>
              ) : (
                <div className="space-y-1">
                  {disciplinasFiltradas.map((disciplina) => (
                    <div key={disciplina.id}>
                      {/* Disciplina */}
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <div 
                          className="flex items-center gap-2 flex-1"
                          onClick={() => toggleDisciplina(disciplina.id)}
                        >
                          {expandedDisciplinas[disciplina.id] ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-900">{disciplina.nome}</span>
                          <span className="text-xs text-gray-500 ml-auto mr-2">
                            {disciplina.total_assuntos || 0}
                          </span>
                        </div>
                        {!isDisciplinaNoMapa(disciplina) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              adicionarDisciplinaAoMapa(disciplina);
                            }}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded transition"
                            title="Adicionar toda a disciplina"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removerDisciplinaDoMapa(disciplina);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            title="Remover toda a disciplina"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Assuntos */}
                      {expandedDisciplinas[disciplina.id] && disciplina.assuntos?.map((assunto) => (
                        <div key={assunto.id} className="ml-4">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                            {assunto.subassuntos?.length > 0 ? (
                              <button onClick={() => toggleAssunto(assunto.id)}>
                                {expandedAssuntos[assunto.id] ? (
                                  <ChevronDown className="h-3 w-3 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-gray-400" />
                                )}
                              </button>
                            ) : (
                              <span className="w-3"></span>
                            )}
                            <span className="flex-1 text-sm text-gray-700">{assunto.nome}</span>
                            {!isAssuntoNoMapa(assunto.id) ? (
                              <button
                                onClick={() => adicionarAoMapa(assunto)}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded transition"
                                title={assunto.subassuntos?.length > 0 ? "Adicionar todos os subassuntos" : "Adicionar ao mapa"}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => removerAssuntoCompletoDoMapa(assunto.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                title={assunto.subassuntos?.length > 0 ? "Remover todos os subassuntos" : "Remover do mapa"}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          
                          {/* Subassuntos */}
                          {expandedAssuntos[assunto.id] && assunto.subassuntos?.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center gap-2 ml-6 px-3 py-1 rounded-lg hover:bg-gray-50"
                            >
                              <span className="flex-1 text-xs text-gray-600">{sub.nome}</span>
                              {!isAssuntoNoMapa(assunto.id, sub.id) ? (
                                <button
                                  onClick={() => adicionarAoMapa(assunto, sub)}
                                  className="p-0.5 text-purple-600 hover:bg-purple-50 rounded transition"
                                  title="Adicionar ao mapa"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const mapa = mapas.find(m => m.assunto === assunto.id && m.subassunto === sub.id);
                                    if (mapa) removerDoMapa(mapa.id);
                                  }}
                                  className="p-0.5 text-red-600 hover:bg-red-50 rounded transition"
                                  title="Remover do mapa"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Box Direita - Assuntos Selecionados */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-purple-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Assuntos do Plano ({mapas.length})
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar no plano..."
                  value={buscaDireita}
                  onChange={(e) => setBuscaDireita(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {mapasFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">Nenhum assunto selecionado</p>
                  <p className="text-sm text-gray-400">
                    Clique no + ao lado dos assuntos à esquerda para adicioná-los
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mapasFiltrados.map((mapa, index) => (
                    <div
                      key={mapa.id}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                    >
                      <span className="text-xs text-gray-400 font-medium w-6">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {mapa.assunto_nome || mapa.nome_completo}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {mapa.disciplina_nome}
                          {mapa.subassunto_nome && ` → ${mapa.subassunto_nome}`}
                        </p>
                      </div>
                      <button
                        onClick={() => setMapaParaEditar(mapa)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition opacity-0 group-hover:opacity-100"
                        title="Editar metadados"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removerDoMapa(mapa.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                        title="Remover do mapa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Metadados */}
      {mapaParaEditar && (
        <MetadadosModal
          mapa={mapaParaEditar}
          onClose={() => setMapaParaEditar(null)}
          onSave={() => carregarDados()}
        />
      )}
    </div>
  );
};

export default MapaAssuntos;
