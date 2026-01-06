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
    MetadadosAssunto,
    ProgressoAssunto,
    SessaoEstudo,
    PlanoAluno
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


class SessaoEstudoInline(admin.TabularInline):
    """Inline para exibir sessões de estudo dentro do progresso"""
    model = SessaoEstudo
    extra = 0
    readonly_fields = ['percentual_acerto', 'created_at']
    fields = ['data', 'tempo_minutos', 'questoes_feitas', 'questoes_acertadas', 'percentual_acerto', 'observacoes']


@admin.register(ProgressoAssunto)
class ProgressoAssuntoAdmin(admin.ModelAdmin):
    """Admin para Progresso dos Assuntos"""
    list_display = ['usuario', 'mapa_assunto', 'estudado', 'tempo_total_minutos', 'questoes_feitas', 'percentual_acerto', 'ultima_sessao']
    list_filter = ['estudado', 'mapa_assunto__concurso', 'ultima_sessao']
    search_fields = ['usuario__email', 'mapa_assunto__assunto__nome']
    ordering = ['-ultima_sessao', '-updated_at']
    readonly_fields = ['tempo_total_minutos', 'questoes_feitas', 'questoes_acertadas', 'percentual_acerto', 'tempo_total_horas', 'created_at', 'updated_at']
    inlines = [SessaoEstudoInline]
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('usuario', 'mapa_assunto', 'estudado')
        }),
        ('Estatísticas (calculadas automaticamente)', {
            'fields': ('tempo_total_minutos', 'tempo_total_horas', 'questoes_feitas', 'questoes_acertadas', 'percentual_acerto', 'ultima_sessao')
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SessaoEstudo)
class SessaoEstudoAdmin(admin.ModelAdmin):
    """Admin para Sessões de Estudo"""
    list_display = ['progresso', 'data', 'tempo_minutos', 'questoes_feitas', 'questoes_acertadas', 'percentual_acerto']
    list_filter = ['data', 'progresso__mapa_assunto__concurso']
    search_fields = ['progresso__usuario__email', 'progresso__mapa_assunto__assunto__nome']
    ordering = ['-data', '-created_at']
    readonly_fields = ['percentual_acerto', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('progresso', 'data')
        }),
        ('Dados da Sessão', {
            'fields': ('tempo_minutos', 'questoes_feitas', 'questoes_acertadas', 'percentual_acerto', 'observacoes')
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PlanoAluno)
class PlanoAlunoAdmin(admin.ModelAdmin):
    """Admin para Planos dos Alunos"""
    list_display = ['usuario', 'concurso', 'ativo', 'data_inicio', 'created_at']
    list_filter = ['ativo', 'concurso', 'data_inicio']
    search_fields = ['usuario__email', 'usuario__first_name', 'concurso__nome']
    ordering = ['-ativo', '-data_inicio']
    readonly_fields = ['data_inicio', 'created_at', 'updated_at']
    raw_id_fields = ['usuario', 'concurso']
