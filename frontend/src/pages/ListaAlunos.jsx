import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Target, FileText, Search, ChevronRight } from 'lucide-react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const ListaAlunos = () => {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    try {
      const res = await api.get('/alunos/');
      setAlunos(res.data);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const alunosFiltrados = alunos.filter(aluno => 
    aluno.usuario_nome.toLowerCase().includes(busca.toLowerCase()) ||
    aluno.usuario_email.toLowerCase().includes(busca.toLowerCase()) ||
    (aluno.plano_nome && aluno.plano_nome.toLowerCase().includes(busca.toLowerCase()))
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhe o progresso dos alunos
          </p>
        </div>
      </div>

      <main className="ml-64 px-8 py-8">
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{alunos.length}</p>
                <p className="text-sm text-gray-600">Total de Alunos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {alunos.filter(a => a.plano_nome).length}
                </p>
                <p className="text-sm text-gray-600">Com Plano Ativo</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(alunos.reduce((acc, a) => acc + a.tempo_total_horas, 0))}h
                </p>
                <p className="text-sm text-gray-600">Tempo Total Estudado</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {alunos.reduce((acc, a) => acc + a.questoes_feitas, 0)}
                </p>
                <p className="text-sm text-gray-600">Questões Feitas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou plano..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de Alunos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aluno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progresso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questões
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Atividade
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alunosFiltrados.map((aluno) => (
                <tr 
                  key={aluno.usuario_id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/aluno/${aluno.usuario_id}`)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{aluno.usuario_nome}</p>
                      <p className="text-sm text-gray-500">{aluno.usuario_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {aluno.plano_nome ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                        {aluno.plano_sigla || aluno.plano_nome}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Sem plano</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${aluno.percentual_concluido}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{aluno.percentual_concluido}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {aluno.tempo_total_horas}h
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="text-gray-900">{aluno.questoes_feitas}</span>
                      {aluno.questoes_feitas > 0 && (
                        <span className="text-gray-500 ml-1">
                          ({aluno.percentual_acerto}% acerto)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {aluno.ultima_atividade 
                      ? new Date(aluno.ultima_atividade).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4">
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {alunosFiltrados.length === 0 && (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {busca ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ListaAlunos;
