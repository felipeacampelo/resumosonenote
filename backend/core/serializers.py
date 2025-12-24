"""
Serializers para a API REST do sistema de mapas de estudos.

Converte os modelos Django em JSON e vice-versa, com validações.
"""

from rest_framework import serializers
from .models import (
    Disciplina,
    Assunto,
    Subassunto,
    Concurso,
    MapaAssunto,
    MetadadosAssunto
)


class SubassuntoSerializer(serializers.ModelSerializer):
    """
    Serializer para Subassuntos.
    
    Usado para exibir subassuntos dentro de assuntos.
    """
    class Meta:
        model = Subassunto
        fields = ['id', 'nome', 'ordem', 'ativo']
        read_only_fields = ['id']


class AssuntoSerializer(serializers.ModelSerializer):
    """
    Serializer para Assuntos.
    
    Inclui subassuntos aninhados para visualização em árvore.
    """
    subassuntos = SubassuntoSerializer(many=True, read_only=True)
    total_subassuntos = serializers.IntegerField(read_only=True)
    disciplina_nome = serializers.CharField(source='disciplina.nome', read_only=True)
    
    class Meta:
        model = Assunto
        fields = [
            'id', 'nome', 'ordem', 'ativo',
            'disciplina', 'disciplina_nome',
            'subassuntos', 'total_subassuntos',
            'link_resumos', 'link_questoes_cebraspe', 
            'link_questoes_fgv', 'dica'
        ]
        read_only_fields = ['id', 'total_subassuntos']


class DisciplinaSerializer(serializers.ModelSerializer):
    """
    Serializer para Disciplinas.
    
    Inclui assuntos aninhados para visualização completa da matriz.
    """
    assuntos = AssuntoSerializer(many=True, read_only=True)
    total_assuntos = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Disciplina
        fields = [
            'id', 'nome', 'ordem', 'ativa',
            'assuntos', 'total_assuntos',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_assuntos', 'created_at', 'updated_at']


class DisciplinaListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listagem de Disciplinas.
    
    Sem assuntos aninhados para melhor performance.
    """
    total_assuntos = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Disciplina
        fields = ['id', 'nome', 'ordem', 'ativa', 'total_assuntos']
        read_only_fields = ['id', 'total_assuntos']


class MetadadosAssuntoSerializer(serializers.ModelSerializer):
    """
    Serializer para Metadados dos Assuntos - Formato Tutory.
    
    Campos:
    - paginas_minutos: Páginas ou Minutos de Vídeo
    - minutos_expresso, minutos_regular, minutos_calma: Tempos decimais
    - dica, dica_revisoes, dica_questoes: Dicas (max 500 chars)
    - referencia: Referência (max 500 chars)
    - peso_resumos, peso_revisoes, peso_questoes: Pesos (1-4)
    - numero_questoes: Número de questões
    - link_estrategia, link_direcao, link_pdf, link_resumo, link_questoes, link_video: Links (max 500 chars)
    - suplementar: 0 ou 1
    """
    suplementar_display = serializers.IntegerField(read_only=True)
    
    # Contadores de caracteres (para o frontend)
    dica_length = serializers.SerializerMethodField()
    dica_revisoes_length = serializers.SerializerMethodField()
    dica_questoes_length = serializers.SerializerMethodField()
    referencia_length = serializers.SerializerMethodField()
    
    class Meta:
        model = MetadadosAssunto
        fields = [
            'id', 'mapa_assunto',
            'paginas_minutos',
            'minutos_expresso', 'minutos_regular', 'minutos_calma',
            'dica', 'dica_length',
            'dica_revisoes', 'dica_revisoes_length',
            'dica_questoes', 'dica_questoes_length',
            'referencia', 'referencia_length',
            'peso_resumos', 'peso_revisoes', 'peso_questoes',
            'numero_questoes',
            'link_estrategia', 'link_direcao', 'link_pdf',
            'link_resumo', 'link_questoes', 'link_video',
            'relevancia',
            'suplementar', 'suplementar_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'suplementar_display',
            'created_at', 'updated_at'
        ]
    
    def get_dica_length(self, obj):
        return len(obj.dica) if obj.dica else 0
    
    def get_dica_revisoes_length(self, obj):
        return len(obj.dica_revisoes) if obj.dica_revisoes else 0
    
    def get_dica_questoes_length(self, obj):
        return len(obj.dica_questoes) if obj.dica_questoes else 0
    
    def get_referencia_length(self, obj):
        return len(obj.referencia) if obj.referencia else 0
    
    def validate_peso_resumos(self, value):
        if value not in [1, 2, 3, 4]:
            raise serializers.ValidationError("Peso deve ser 1, 2, 3 ou 4")
        return value
    
    def validate_peso_revisoes(self, value):
        if value not in [1, 2, 3, 4]:
            raise serializers.ValidationError("Peso deve ser 1, 2, 3 ou 4")
        return value
    
    def validate_peso_questoes(self, value):
        if value not in [1, 2, 3, 4]:
            raise serializers.ValidationError("Peso deve ser 1, 2, 3 ou 4")
        return value


class MapaAssuntoSerializer(serializers.ModelSerializer):
    """
    Serializer para Mapas de Assuntos.
    
    Inclui metadados aninhados e informações do assunto.
    """
    metadados = MetadadosAssuntoSerializer(read_only=True)
    nome_completo = serializers.CharField(read_only=True)
    assunto_nome = serializers.CharField(source='assunto.nome', read_only=True)
    subassunto_nome = serializers.CharField(source='subassunto.nome', read_only=True)
    disciplina_nome = serializers.CharField(source='assunto.disciplina.nome', read_only=True)
    
    # Metadados do assunto base (da matriz)
    link_resumos = serializers.CharField(source='assunto.link_resumos', read_only=True)
    link_questoes_cebraspe = serializers.CharField(source='assunto.link_questoes_cebraspe', read_only=True)
    link_questoes_fgv = serializers.CharField(source='assunto.link_questoes_fgv', read_only=True)
    dica = serializers.CharField(source='assunto.dica', read_only=True)
    
    class Meta:
        model = MapaAssunto
        fields = [
            'id', 'concurso', 'assunto', 'assunto_nome',
            'subassunto', 'subassunto_nome', 'disciplina_nome',
            'ordem', 'item_edital',
            'extra_cursinho', 'nome_extra', 'nome_completo',
            'metadados',
            'link_resumos', 'link_questoes_cebraspe', 
            'link_questoes_fgv', 'dica',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'nome_completo', 'created_at', 'updated_at']
    
    def validate(self, data):
        """
        Validação customizada do MapaAssunto.
        
        - Se extra_cursinho=True, deve ter nome_extra
        - Se extra_cursinho=False, deve ter assunto
        """
        extra_cursinho = data.get('extra_cursinho', False)
        nome_extra = data.get('nome_extra', '')
        assunto = data.get('assunto')
        
        if extra_cursinho and not nome_extra:
            raise serializers.ValidationError({
                'nome_extra': 'Assuntos extras devem ter um nome definido'
            })
        
        if not extra_cursinho and not assunto:
            raise serializers.ValidationError({
                'assunto': 'Assuntos não-extras devem estar vinculados a um assunto da matriz'
            })
        
        return data


class ConcursoSerializer(serializers.ModelSerializer):
    """
    Serializer para Concursos.
    
    Inclui mapas de assuntos aninhados.
    """
    mapa_assuntos = MapaAssuntoSerializer(many=True, read_only=True)
    total_assuntos_mapa = serializers.IntegerField(read_only=True)
    tipo_display = serializers.CharField(read_only=True)
    criado_por_email = serializers.CharField(source='criado_por.email', read_only=True)
    
    class Meta:
        model = Concurso
        fields = [
            'id', 'nome', 'sigla', 'ordem', 'tipo', 'tipo_display',
            'cursinho', 'ativo',
            'criado_por', 'criado_por_email',
            'mapa_assuntos', 'total_assuntos_mapa',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tipo_display', 'total_assuntos_mapa',
            'criado_por', 'criado_por_email',
            'created_at', 'updated_at'
        ]


class ConcursoListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listagem de Concursos.
    
    Sem mapas aninhados para melhor performance.
    """
    total_assuntos_mapa = serializers.IntegerField(read_only=True)
    tipo_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = Concurso
        fields = [
            'id', 'nome', 'sigla', 'tipo', 'tipo_display',
            'cursinho', 'ordem', 'ativo',
            'total_assuntos_mapa', 'created_at'
        ]
        read_only_fields = ['id', 'tipo_display', 'total_assuntos_mapa', 'created_at']


class MatrizImportSerializer(serializers.Serializer):
    """
    Serializer para upload de arquivo Excel da matriz de assuntos.
    """
    arquivo = serializers.FileField(
        help_text='Arquivo Excel (.xlsx) com a matriz de assuntos'
    )
    limpar_existente = serializers.BooleanField(
        default=False,
        help_text='Se True, remove a matriz existente antes de importar'
    )
    
    def validate_arquivo(self, value):
        """Valida que o arquivo é um Excel válido"""
        if not value.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError(
                'Arquivo deve ser um Excel (.xlsx ou .xls)'
            )
        
        # Validar tamanho (máximo 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                'Arquivo muito grande. Máximo: 10MB'
            )
        
        return value
