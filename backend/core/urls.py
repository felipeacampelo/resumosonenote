"""
URLs da API REST do sistema de mapas de estudos.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DisciplinaViewSet,
    AssuntoViewSet,
    SubassuntoViewSet,
    ConcursoViewSet,
    MapaAssuntoViewSet,
    MetadadosAssuntoViewSet,
    MatrizImportView,
    ProgressoAssuntoViewSet,
    SessaoEstudoViewSet,
    PlanoAlunoViewSet,
    AlunosListView,
    AlunoDetalheView,
    DashboardAlunoView,
    RankingAlunosView
)

# Router para registrar os ViewSets
router = DefaultRouter()
router.register(r'disciplinas', DisciplinaViewSet, basename='disciplina')
router.register(r'assuntos', AssuntoViewSet, basename='assunto')
router.register(r'subassuntos', SubassuntoViewSet, basename='subassunto')
router.register(r'concursos', ConcursoViewSet, basename='concurso')
router.register(r'mapas', MapaAssuntoViewSet, basename='mapa')
router.register(r'metadados', MetadadosAssuntoViewSet, basename='metadados')
router.register(r'progressos', ProgressoAssuntoViewSet, basename='progresso')
router.register(r'sessoes', SessaoEstudoViewSet, basename='sessao')
router.register(r'planos-aluno', PlanoAlunoViewSet, basename='plano-aluno')

urlpatterns = [
    path('', include(router.urls)),
    path('matriz/importar/', MatrizImportView.as_view(), name='matriz-importar'),
    path('alunos/', AlunosListView.as_view(), name='alunos-lista'),
    path('alunos/<int:aluno_id>/', AlunoDetalheView.as_view(), name='aluno-detalhe'),
    path('dashboard/', DashboardAlunoView.as_view(), name='dashboard-aluno'),
    path('ranking/', RankingAlunosView.as_view(), name='ranking-alunos'),
]
