import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, TrendingUp, FileText, ExternalLink } from 'lucide-react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const ConcursoView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [concurso, setConcurso] = useState(null);
  const [mapas, setMapas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState('todas');

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      const [concursoRes, mapasRes] = await Promise.all([
        api.get(`/concursos/${id}/`),
        api.get(`/mapas/?concurso=${id}`)
      ]);
      
      setConcurso(concursoRes.data);
      setMapas(mapasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
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

  const mapasFiltrados = disciplinaSelecionada === 'todas' 
    ? mapas 
    : mapasPorDisciplina[disciplinaSelecionada] || [];

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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Concurso não encontrado</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-purple-600 hover:text-purple-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="ml-64 bg-white border-b">
        <div className="px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{concurso.nome}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {concurso.sigla} • {concurso.tipo_display}
              {concurso.cursinho && ` • ${concurso.cursinho}`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="ml-64 px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mapas.length}</p>
                <p className="text-sm text-gray-600">Assuntos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{disciplinas.length}</p>
                <p className="text-sm text-gray-600">Disciplinas</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(mapas.reduce((acc, m) => acc + (m.metadados?.tempo_estimado || 0), 0) / 60)}h
                </p>
                <p className="text-sm text-gray-600">Tempo Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro por Disciplina */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setDisciplinaSelecionada('todas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                disciplinaSelecionada === 'todas'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({mapas.length})
            </button>
            {disciplinas.map((disciplina) => (
              <button
                key={disciplina}
                onClick={() => setDisciplinaSelecionada(disciplina)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  disciplinaSelecionada === disciplina
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {disciplina} ({mapasPorDisciplina[disciplina].length})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Assuntos */}
        {mapasFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum assunto encontrado
            </h3>
            <p className="text-gray-600">
              Este concurso ainda não possui assuntos cadastrados
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mapasFiltrados.map((mapa) => (
              <div
                key={mapa.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                        {mapa.disciplina_nome}
                      </span>
                      {mapa.item_edital && (
                        <span className="text-xs text-gray-500">
                          Item {mapa.item_edital}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {mapa.nome_completo}
                    </h3>
                    {mapa.subassunto_nome && (
                      <p className="text-sm text-gray-600">
                        {mapa.subassunto_nome}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadados */}
                <div className="space-y-3">
                  {/* Aula dos Resumos OneNote (texto, não link) */}
                  {mapa.link_resumos && (
                    <div className="flex items-start gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">
                      <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Resumos OneNote:</strong> {mapa.link_resumos}</span>
                    </div>
                  )}

                  {/* Links de Questões TEC Concursos */}
                  <div className="flex flex-wrap gap-2">
                    {mapa.link_questoes_cebraspe && (
                      (() => {
                        // Extrair links do formato "Nome: https://..."
                        const links = mapa.link_questoes_cebraspe.match(/https?:\/\/[^\s]+/g) || [];
                        return links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm"
                          >
                            <TrendingUp className="h-4 w-4" />
                            TEC Concursos - Cebraspe {links.length > 1 ? `(${idx + 1})` : ''}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ));
                      })()
                    )}
                    {mapa.link_questoes_fgv && (
                      (() => {
                        const links = mapa.link_questoes_fgv.match(/https?:\/\/[^\s]+/g) || [];
                        return links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-sm"
                          >
                            <TrendingUp className="h-4 w-4" />
                            TEC Concursos - FGV {links.length > 1 ? `(${idx + 1})` : ''}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ));
                      })()
                    )}
                  </div>

                  {/* Dica */}
                  {mapa.dica && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        💡 <strong>Dica:</strong> {mapa.dica}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ConcursoView;
