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
    MatrizImportView
)

# Router para registrar os ViewSets
router = DefaultRouter()
router.register(r'disciplinas', DisciplinaViewSet, basename='disciplina')
router.register(r'assuntos', AssuntoViewSet, basename='assunto')
router.register(r'subassuntos', SubassuntoViewSet, basename='subassunto')
router.register(r'concursos', ConcursoViewSet, basename='concurso')
router.register(r'mapas', MapaAssuntoViewSet, basename='mapa')
router.register(r'metadados', MetadadosAssuntoViewSet, basename='metadados')

urlpatterns = [
    path('', include(router.urls)),
    path('matriz/importar/', MatrizImportView.as_view(), name='matriz-importar'),
]
