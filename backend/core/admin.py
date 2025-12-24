"""
Configuração do Django Admin para os modelos do sistema.
"""

from django.contrib import admin
from .models import (
    Disciplina,
    Assunto,
    Subassunto,
    Concurso,
    MapaAssunto,
    MetadadosAssunto
)


@admin.register(Disciplina)
class DisciplinaAdmin(admin.ModelAdmin):
    """Admin para Disciplinas"""
    list_display = ['nome', 'ordem', 'ativa', 'total_assuntos', 'created_at']
    list_filter = ['ativa', 'created_at']
    search_fields = ['nome']
    ordering = ['ordem', 'nome']


@admin.register(Assunto)
class AssuntoAdmin(admin.ModelAdmin):
    """Admin para Assuntos"""
    list_display = ['nome', 'disciplina', 'ordem', 'ativo', 'total_subassuntos']
    list_filter = ['disciplina', 'ativo', 'created_at']
    search_fields = ['nome', 'disciplina__nome']
    ordering = ['disciplina', 'ordem', 'nome']


@admin.register(Subassunto)
class SubassuntoAdmin(admin.ModelAdmin):
    """Admin para Subassuntos"""
    list_display = ['nome', 'assunto', 'ordem', 'ativo']
    list_filter = ['assunto__disciplina', 'ativo', 'created_at']
    search_fields = ['nome', 'assunto__nome']
    ordering = ['assunto', 'ordem', 'nome']


@admin.register(Concurso)
class ConcursoAdmin(admin.ModelAdmin):
    """Admin para Concursos"""
    list_display = ['nome', 'sigla', 'tipo', 'cursinho', 'ordem', 'ativo', 'total_assuntos_mapa', 'criado_por']
    list_filter = ['tipo', 'ativo', 'created_at']
    search_fields = ['nome', 'sigla', 'cursinho']
    ordering = ['ordem', '-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MapaAssunto)
class MapaAssuntoAdmin(admin.ModelAdmin):
    """Admin para Mapas de Assuntos"""
    list_display = ['concurso', 'nome_completo', 'item_edital', 'extra_cursinho', 'ordem']
    list_filter = ['concurso', 'extra_cursinho', 'created_at']
    search_fields = ['concurso__nome', 'assunto__nome', 'nome_extra']
    ordering = ['concurso', 'ordem']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MetadadosAssunto)
class MetadadosAssuntoAdmin(admin.ModelAdmin):
    """Admin para Metadados dos Assuntos - Formato Tutory"""
    list_display = ['mapa_assunto', 'paginas_minutos', 'peso_resumos', 'peso_questoes', 'suplementar']
    list_filter = ['suplementar', 'peso_resumos', 'peso_questoes', 'created_at']
    search_fields = ['mapa_assunto__assunto__nome', 'dica']
    readonly_fields = ['created_at', 'updated_at', 'suplementar_display']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('mapa_assunto',)
        }),
        ('Páginas/Minutos', {
            'fields': ('paginas_minutos',)
        }),
        ('Tempos (decimais)', {
            'fields': ('minutos_expresso', 'minutos_regular', 'minutos_calma')
        }),
        ('Dicas (máx. 500 caracteres cada)', {
            'fields': ('dica', 'dica_revisoes', 'dica_questoes')
        }),
        ('Referência', {
            'fields': ('referencia',)
        }),
        ('Pesos (1 a 4)', {
            'fields': ('peso_resumos', 'peso_revisoes', 'peso_questoes')
        }),
        ('Questões', {
            'fields': ('numero_questoes',)
        }),
        ('Links (máx. 500 caracteres cada)', {
            'fields': ('link_estudo', 'link_resumo', 'link_questoes')
        }),
        ('Classificação', {
            'fields': ('suplementar', 'suplementar_display')
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
