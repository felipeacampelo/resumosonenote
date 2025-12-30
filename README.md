# Plataforma de Estudo para Concurso Público

Sistema completo com autenticação (email/senha + Google OAuth) para plataforma de estudos.

## 🏗️ Arquitetura

- **Backend**: Django + Django REST Framework + SimpleJWT + django-allauth
- **Frontend**: React + TailwindCSS + shadcn/ui
- **Autenticação**: JWT (access + refresh tokens) + OAuth 2.0 (Google)

## 📁 Estrutura

```
windsurf-project/
├── backend/          # Django API
│   ├── config/       # Settings do projeto
│   ├── accounts/     # App de autenticação
│   ├── manage.py
│   └── requirements.txt
├── frontend/         # React SPA
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## 🚀 Configuração Rápida

### Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

## 🔐 Endpoints de Autenticação

- `POST /api/auth/register/` - Registro de usuário
- `POST /api/auth/login/` - Login (email/senha)
- `POST /api/auth/token/refresh/` - Refresh do access token
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Dados do usuário autenticado
- `GET /api/auth/google/` - Iniciar OAuth Google
- `GET /api/auth/google/callback/` - Callback OAuth Google

## 🔑 Configuração Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto
3. Ative a Google+ API
4. Crie credenciais OAuth 2.0
5. Adicione URIs autorizadas:
   - `http://localhost:8000`
   - `http://localhost:3000`
6. Adicione URIs de redirecionamento:
   - `http://localhost:8000/api/auth/google/callback/`
7. Copie Client ID e Client Secret para `.env`

##  Próximos Passos

- [ ] Recuperação de senha
- [ ] Verificação de email
- [ ] Perfil de usuário
- [ ] Módulos de estudo
- [ ] Sistema de questões
- [ ] Simulados
- [ ] Estatísticas de desempenho
