import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const CriarPlano = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    cursinho: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const response = await api.post('/concursos/', formData);
      navigate(`/mapa-assuntos/${response.data.id}`);
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      setErro(error.response?.data?.detail || 'Erro ao criar mapa de assuntos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="ml-64 px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Criar Mapa de Assuntos
            </h1>
            <p className="text-gray-600">
              Preencha as informações básicas do novo mapa
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {erro && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {erro}
              </div>
            )}

            <div className="space-y-6">
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Mapa *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Auditor Fiscal da Receita Federal 2025"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                />
              </div>

              {/* Sigla */}
              <div>
                <label htmlFor="sigla" className="block text-sm font-medium text-gray-700 mb-2">
                  Sigla *
                </label>
                <input
                  type="text"
                  id="sigla"
                  name="sigla"
                  value={formData.sigla}
                  onChange={handleChange}
                  required
                  placeholder="Ex: AFRFB"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                />
              </div>

              {/* Cursinho */}
              <div>
                <label htmlFor="cursinho" className="block text-sm font-medium text-gray-700 mb-2">
                  Cursinho (opcional)
                </label>
                <input
                  type="text"
                  id="cursinho"
                  name="cursinho"
                  value={formData.cursinho}
                  onChange={handleChange}
                  placeholder="Ex: Estratégia Concursos"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/planos')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <X className="h-5 w-5" />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Criar Mapa
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CriarPlano;
