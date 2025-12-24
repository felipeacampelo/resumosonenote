import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import logo from '../assets/Logo ResumosON - 2.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Iniciando tentativa de login...');
      await login(email, password);
      console.log('Login bem-sucedido, redirecionando...');
      navigate('/dashboard');
    } catch (err) {
      console.error('Erro no handleSubmit:', err);
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (err.response) {
        // Erro da API
        if (err.response.status === 400) {
          errorMessage = 'Dados inválidos. Verifique os campos preenchidos.';
        } else if (err.response.status === 401) {
          errorMessage = 'E-mail ou senha incorretos. Tente novamente.';
        } else if (err.response.status >= 500) {
          errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
        }
        
        // Tenta obter mensagem de erro do backend
        if (err.response.data) {
          if (typeof err.response.data === 'object' && err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          }
        }
      } else if (err.request) {
        // A requisição foi feita mas não houve resposta
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-violet-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto w-32 h-32 mb-4">
            <img src={logo} alt="Resumos OneNote" className="w-full h-full object-contain" />
          </div>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Resumos OneNote
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça seu login ou cadastro para continuar
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continue com</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  setLoading(true);
                  setError('');
                  await loginWithGoogle(credentialResponse.credential);
                  navigate('/dashboard');
                } catch (err) {
                  console.error('Erro no login com Google:', err);
                  setError('Erro ao fazer login com Google. Tente novamente.');
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => {
                setError('Erro ao fazer login com Google. Tente novamente.');
              }}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="100%"
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="font-medium text-purple-600 hover:text-purple-500">
                Cadastre-se
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
