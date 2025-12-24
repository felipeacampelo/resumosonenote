"""
Views (ViewSets) para a API REST do sistema de mapas de estudos.

Implementa endpoints CRUD com permissões diferenciadas:
- Admins: Podem criar, editar e deletar
- Alunos: Podem apenas visualizar (read-only)
"""

from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
import tempfile
import os

from .models import (
    Disciplina,
    Assunto,
    Subassunto,
    Concurso,
    MapaAssunto,
    MetadadosAssunto
)
from .serializers import (
    DisciplinaSerializer,
    DisciplinaListSerializer,
    AssuntoSerializer,
    SubassuntoSerializer,
    ConcursoSerializer,
    ConcursoListSerializer,
    MapaAssuntoSerializer,
    MetadadosAssuntoSerializer,
    MatrizImportSerializer
)
from .services import MatrizImportService


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permissão customizada:
    - Admins (is_admin=True): Acesso total
    - Alunos: Apenas leitura (GET, HEAD, OPTIONS)
    - DESENVOLVIMENTO: Leitura sem autenticação (remover em produção)
    """
    def has_permission(self, request, view):
        # TEMPORÁRIO: Permitir leitura sem autenticação para testes
        if request.method in permissions.SAFE_METHODS:
            return True  # Qualquer um pode ler
        
        # Escrita apenas para admins autenticados
        return request.user and request.user.is_authenticated and request.user.is_admin


class DisciplinaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Disciplinas da Matriz.
    
    list: Lista todas as disciplinas
    retrieve: Detalhes de uma disciplina (com assuntos aninhados)
    create: Criar nova disciplina (apenas admin)
    update: Atualizar disciplina (apenas admin)
    delete: Deletar disciplina (apenas admin)
    """
    queryset = Disciplina.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['nome']
    ordering_fields = ['ordem', 'nome', 'created_at']
    ordering = ['ordem', 'nome']
    filterset_fields = ['ativa']
    
    def get_serializer_class(self):
        """Usa serializer completo para incluir assuntos aninhados"""
        return DisciplinaSerializer


class AssuntoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Assuntos da Matriz.
    
    Permite filtrar por disciplina.
    """
    queryset = Assunto.objects.select_related('disciplina').all()
    serializer_class = AssuntoSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['nome', 'disciplina__nome']
    ordering_fields = ['ordem', 'nome', 'created_at']
    ordering = ['disciplina', 'ordem', 'nome']
    filterset_fields = ['disciplina', 'ativo']


class SubassuntoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Subassuntos da Matriz.
    
    Permite filtrar por assunto e disciplina.
    """
    queryset = Subassunto.objects.select_related('assunto', 'assunto__disciplina').all()
    serializer_class = SubassuntoSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['nome', 'assunto__nome']
    ordering_fields = ['ordem', 'nome', 'created_at']
    ordering = ['assunto', 'ordem', 'nome']
    filterset_fields = ['assunto', 'assunto__disciplina', 'ativo']


class ConcursoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Concursos.
    
    Endpoints adicionais:
    - duplicate: Duplica um concurso existente
    """
    queryset = Concurso.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['nome', 'sigla', 'cursinho']
    ordering_fields = ['ordem', 'nome', 'created_at']
    ordering = ['ordem', '-created_at']
    filterset_fields = ['tipo', 'ativo']
    
    def get_serializer_class(self):
        """Usa serializer simplificado para listagem"""
        if self.action == 'list':
            return ConcursoListSerializer
        return ConcursoSerializer
    
    def perform_create(self, serializer):
        """Salva o usuário que criou o concurso"""
        serializer.save(criado_por=self.request.user)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Duplica um concurso existente.
        
        POST /api/concursos/{id}/duplicate/
        Body: { "novo_nome": "Nome do novo concurso" }
        """
        concurso_original = self.get_object()
        novo_nome = request.data.get('novo_nome', f"{concurso_original.nome} (Cópia)")
        
        # Criar novo concurso
        novo_concurso = Concurso.objects.create(
            nome=novo_nome,
            sigla=concurso_original.sigla,
            tipo=concurso_original.tipo,
            cursinho=concurso_original.cursinho,
            ordem=concurso_original.ordem,
            criado_por=request.user
        )
        
        # Copiar mapas de assuntos
        mapas_originais = MapaAssunto.objects.filter(concurso=concurso_original)
        for mapa in mapas_originais:
            novo_mapa = MapaAssunto.objects.create(
                concurso=novo_concurso,
                assunto=mapa.assunto,
                subassunto=mapa.subassunto,
                ordem=mapa.ordem,
                item_edital=mapa.item_edital,
                extra_cursinho=mapa.extra_cursinho,
                nome_extra=mapa.nome_extra
            )
            
            # Copiar metadados se existirem (formato Tutory)
            if hasattr(mapa, 'metadados'):
                MetadadosAssunto.objects.create(
                    mapa_assunto=novo_mapa,
                    paginas_minutos=mapa.metadados.paginas_minutos,
                    minutos_expresso=mapa.metadados.minutos_expresso,
                    minutos_regular=mapa.metadados.minutos_regular,
                    minutos_calma=mapa.metadados.minutos_calma,
                    dica=mapa.metadados.dica,
                    dica_revisoes=mapa.metadados.dica_revisoes,
                    dica_questoes=mapa.metadados.dica_questoes,
                    referencia=mapa.metadados.referencia,
                    peso_resumos=mapa.metadados.peso_resumos,
                    peso_revisoes=mapa.metadados.peso_revisoes,
                    peso_questoes=mapa.metadados.peso_questoes,
                    numero_questoes=mapa.metadados.numero_questoes,
                    link_estudo=mapa.metadados.link_estudo,
                    link_resumo=mapa.metadados.link_resumo,
                    link_questoes=mapa.metadados.link_questoes,
                    suplementar=mapa.metadados.suplementar
                )
        
        serializer = self.get_serializer(novo_concurso)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def exportar(self, request, pk=None):
        """
        Exporta um concurso para o formato Tutory (Excel).
        
        GET /api/concursos/{id}/exportar/
        """
        from django.http import HttpResponse
        from .services import ExportacaoTutoryService
        
        concurso = self.get_object()
        
        service = ExportacaoTutoryService()
        output = service.exportar_concurso(concurso)
        
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{concurso.sigla}_tutory.xlsx"'
        
        return response


class MapaAssuntoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Mapas de Assuntos.
    
    Permite filtrar por concurso.
    """
    queryset = MapaAssunto.objects.select_related(
        'concurso', 'assunto', 'subassunto', 'assunto__disciplina'
    ).all()
    serializer_class = MapaAssuntoSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['assunto__nome', 'nome_extra', 'item_edital']
    ordering_fields = ['ordem', 'created_at']
    ordering = ['concurso', 'ordem']
    filterset_fields = ['concurso', 'extra_cursinho']


class MetadadosAssuntoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Metadados dos Assuntos.
    
    Permite filtrar por mapa de assunto e concurso.
    """
    queryset = MetadadosAssunto.objects.select_related('mapa_assunto', 'mapa_assunto__concurso').all()
    serializer_class = MetadadosAssuntoSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['paginas_minutos', 'peso_resumos', 'peso_questoes']
    filterset_fields = ['mapa_assunto', 'mapa_assunto__concurso', 'suplementar']


class MatrizImportView(APIView):
    """
    View para importação da matriz de assuntos via upload de Excel.
    
    POST /api/matriz/importar/
    
    Apenas admins podem importar.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Importa matriz de assuntos de um arquivo Excel.
        
        Body (multipart/form-data):
        - arquivo: Arquivo Excel (.xlsx)
        - limpar_existente: Boolean (opcional, default=False)
        """
        # Verificar se é admin
        if not request.user.is_admin:
            return Response(
                {'erro': 'Apenas administradores podem importar a matriz'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validar dados
        serializer = MatrizImportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        arquivo = serializer.validated_data['arquivo']
        limpar_existente = serializer.validated_data.get('limpar_existente', False)
        
        # Salvar arquivo temporariamente
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            for chunk in arquivo.chunks():
                tmp_file.write(chunk)
            tmp_path = tmp_file.name
        
        try:
            # Executar importação
            service = MatrizImportService()
            
            if limpar_existente:
                service.limpar_matriz_existente()
            
            resultado = service.importar_arquivo(tmp_path)
            
            # Retornar resultado
            if resultado['sucesso']:
                return Response({
                    'mensagem': 'Matriz importada com sucesso!',
                    'estatisticas': resultado['estatisticas'],
                    'avisos': resultado['avisos']
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'mensagem': 'Importação concluída com erros',
                    'estatisticas': resultado['estatisticas'],
                    'erros': resultado['erros'],
                    'avisos': resultado['avisos']
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except ValueError as e:
            return Response(
                {'erro': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'erro': f'Erro inesperado: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            # Remover arquivo temporário
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
