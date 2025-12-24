import React, { useState, useEffect, useRef } from 'react';
import { Upload, ChevronRight, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const BaseAssuntos = () => {
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDisciplinas, setExpandedDisciplinas] = useState({});
  const [expandedAssuntos, setExpandedAssuntos] = useState({});
  const [importando, setImportando] = useState(false);
  const [resultadoImportacao, setResultadoImportacao] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [limparExistente, setLimparExistente] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    carregarDisciplinas();
  }, []);

  const carregarDisciplinas = async () => {
    try {
      const response = await api.get('/disciplinas/');
      setDisciplinas(response.data);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
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

  const handleImportarClick = () => {
    setShowImportModal(true);
    setResultadoImportacao(null);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportando(true);
    setResultadoImportacao(null);

    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('limpar_existente', limparExistente);

    try {
      const response = await api.post('/matriz/importar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setResultadoImportacao({
        sucesso: true,
        mensagem: response.data.mensagem,
        estatisticas: response.data.estatisticas,
        avisos: response.data.avisos || [],
      });
      
      // Recarregar disciplinas
      await carregarDisciplinas();
    } catch (error) {
      console.error('Erro ao importar:', error);
      setResultadoImportacao({
        sucesso: false,
        mensagem: error.response?.data?.erro || 'Erro ao importar arquivo',
        erros: error.response?.data?.erros || [],
      });
    } finally {
      setImportando(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="ml-64 px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              BASE DE ASSUNTOS
            </h1>
            <p className="text-gray-600">
              Gerencie a matriz de assuntos do sistema
            </p>
          </div>
          <button 
            onClick={handleImportarClick}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            <Upload className="h-5 w-5" />
            Importar Excel
          </button>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    DISCIPLINA / ASSUNTO
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    SUBASSUNTO 1
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    SUBASSUNTO 2
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {disciplinas.map((disciplina) => (
                  <React.Fragment key={disciplina.id}>
                    {/* Linha da Disciplina */}
                    <tr 
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => toggleDisciplina(disciplina.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {expandedDisciplinas[disciplina.id] ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-900">
                            {disciplina.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {disciplina.total_assuntos || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500">
                        —
                      </td>
                    </tr>

                    {/* Assuntos expandidos (Subassunto 1) */}
                    {expandedDisciplinas[disciplina.id] && disciplina.assuntos?.map((assunto) => (
                      <React.Fragment key={`assunto-${assunto.id}`}>
                        <tr 
                          className="bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
                          onClick={() => assunto.subassuntos?.length > 0 && toggleAssunto(assunto.id)}
                        >
                          <td className="px-6 py-3 pl-12">
                            <div className="flex items-center gap-2">
                              {assunto.subassuntos?.length > 0 ? (
                                expandedAssuntos[assunto.id] ? (
                                  <ChevronDown className="h-3 w-3 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-gray-400" />
                                )
                              ) : (
                                <span className="w-3"></span>
                              )}
                              <span className="text-gray-900 text-sm">
                                {assunto.nome}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center text-gray-500">
                            —
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {assunto.total_subassuntos || 0}
                            </span>
                          </td>
                        </tr>
                        
                        {/* Subassuntos expandidos (Subassunto 2) */}
                        {expandedAssuntos[assunto.id] && assunto.subassuntos?.map((subassunto) => (
                          <tr key={`subassunto-${subassunto.id}`} className="bg-blue-50">
                            <td className="px-6 py-2 pl-20">
                              <span className="text-gray-700 text-xs">
                                {subassunto.nome}
                              </span>
                            </td>
                            <td className="px-6 py-2 text-center text-gray-500">
                              —
                            </td>
                            <td className="px-6 py-2 text-center text-gray-500">
                              —
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {disciplinas.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhuma disciplina cadastrada</p>
                <p className="text-sm text-gray-400 mt-2">
                  Importe a matriz de assuntos usando o botão acima
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Importar Matriz de Assuntos
            </h3>
            
            <p className="text-gray-600 mb-4">
              Selecione um arquivo Excel (.xlsx) com a matriz de assuntos. 
              Cada aba será importada como uma disciplina.
            </p>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={limparExistente}
                  onChange={(e) => setLimparExistente(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  Limpar matriz existente antes de importar
                </span>
              </label>
              {limparExistente && (
                <p className="text-xs text-red-600 mt-1 ml-6">
                  ⚠️ Isso irá remover todos os assuntos existentes!
                </p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Resultado da importação */}
            {resultadoImportacao && (
              <div className={`mb-4 p-4 rounded-lg ${
                resultadoImportacao.sucesso 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  {resultadoImportacao.sucesso ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      resultadoImportacao.sucesso ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {resultadoImportacao.mensagem}
                    </p>
                    {resultadoImportacao.estatisticas && (
                      <ul className="text-sm text-green-700 mt-2 space-y-1">
                        <li>• {resultadoImportacao.estatisticas.disciplinas_criadas} disciplinas criadas</li>
                        <li>• {resultadoImportacao.estatisticas.assuntos_criados} assuntos criados</li>
                        <li>• {resultadoImportacao.estatisticas.subassuntos_criados} subassuntos criados</li>
                      </ul>
                    )}
                    {resultadoImportacao.avisos?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-yellow-700 font-medium">Avisos:</p>
                        <ul className="text-xs text-yellow-600 mt-1">
                          {resultadoImportacao.avisos.slice(0, 5).map((aviso, i) => (
                            <li key={i}>• {aviso}</li>
                          ))}
                          {resultadoImportacao.avisos.length > 5 && (
                            <li>... e mais {resultadoImportacao.avisos.length - 5} avisos</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                {resultadoImportacao?.sucesso ? 'Fechar' : 'Cancelar'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importando}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {importando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Selecionar Arquivo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseAssuntos;
