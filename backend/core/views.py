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
    MetadadosAssunto,
    ProgressoAssunto,
    SessaoEstudo,
    PlanoAluno
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
    MatrizImportSerializer,
    ProgressoAssuntoSerializer,
    ProgressoAssuntoListSerializer,
    SessaoEstudoSerializer,
    PlanoAlunoSerializer,
    AlunoEstatisticasSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()
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


class ProgressoAssuntoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Progresso dos Assuntos do estudante.
    
    Endpoints:
    - list: Lista progressos do usuário autenticado
    - retrieve: Detalhes de um progresso (com sessões)
    - create: Criar novo progresso
    - update: Atualizar progresso
    - marcar_estudado: Marca/desmarca assunto como estudado
    - estatisticas: Estatísticas gerais do usuário
    """
    serializer_class = ProgressoAssuntoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['ultima_sessao', 'tempo_total_minutos', 'questoes_feitas', 'percentual_acerto']
    ordering = ['-ultima_sessao', '-updated_at']
    filterset_fields = ['estudado', 'mapa_assunto__concurso']
    
    def get_queryset(self):
        """Retorna apenas progressos do usuário autenticado"""
        return ProgressoAssunto.objects.filter(
            usuario=self.request.user
        ).select_related(
            'mapa_assunto',
            'mapa_assunto__assunto',
            'mapa_assunto__assunto__disciplina',
            'mapa_assunto__concurso'
        )
    
    def get_serializer_class(self):
        """Usa serializer simplificado para listagem"""
        if self.action == 'list':
            return ProgressoAssuntoListSerializer
        return ProgressoAssuntoSerializer
    
    def perform_create(self, serializer):
        """Salva o usuário autenticado ao criar progresso"""
        serializer.save(usuario=self.request.user)
    
    @action(detail=True, methods=['post'])
    def marcar_estudado(self, request, pk=None):
        """
        Marca ou desmarca um assunto como estudado.
        
        POST /api/progressos/{id}/marcar_estudado/
        Body: { "estudado": true/false }
        """
        progresso = self.get_object()
        estudado = request.data.get('estudado', True)
        
        progresso.estudado = estudado
        progresso.save()
        
        serializer = self.get_serializer(progresso)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """
        Retorna estatísticas gerais do usuário.
        
        GET /api/progressos/estatisticas/
        """
        progressos = self.get_queryset()
        
        total_assuntos = progressos.count()
        assuntos_estudados = progressos.filter(estudado=True).count()
        tempo_total = sum(p.tempo_total_minutos for p in progressos)
        questoes_total = sum(p.questoes_feitas for p in progressos)
        questoes_acertadas = sum(p.questoes_acertadas for p in progressos)
        
        percentual_acerto_geral = 0
        if questoes_total > 0:
            percentual_acerto_geral = round((questoes_acertadas / questoes_total) * 100, 2)
        
        return Response({
            'total_assuntos': total_assuntos,
            'assuntos_estudados': assuntos_estudados,
            'percentual_concluido': round((assuntos_estudados / total_assuntos * 100), 2) if total_assuntos > 0 else 0,
            'tempo_total_minutos': tempo_total,
            'tempo_total_horas': round(tempo_total / 60, 2),
            'questoes_feitas': questoes_total,
            'questoes_acertadas': questoes_acertadas,
            'percentual_acerto_geral': percentual_acerto_geral
        })


class SessaoEstudoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Sessões de Estudo.
    
    Permite criar e visualizar sessões de estudo individuais.
    """
    serializer_class = SessaoEstudoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['data', 'tempo_minutos', 'questoes_feitas']
    ordering = ['-data', '-created_at']
    filterset_fields = ['progresso', 'data']
    
    def get_queryset(self):
        """Retorna apenas sessões do usuário autenticado"""
        return SessaoEstudo.objects.filter(
            progresso__usuario=self.request.user
        ).select_related(
            'progresso',
            'progresso__mapa_assunto',
            'progresso__mapa_assunto__assunto'
        )
    
    def perform_create(self, serializer):
        """Valida que o progresso pertence ao usuário"""
        progresso = serializer.validated_data['progresso']
        if progresso.usuario != self.request.user:
            raise permissions.PermissionDenied('Você não tem permissão para adicionar sessões a este progresso')
        serializer.save()


class PlanoAlunoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Planos dos Alunos.
    
    Alunos podem escolher e gerenciar seus planos.
    Admins podem ver todos os planos.
    """
    serializer_class = PlanoAlunoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering = ['-ativo', '-data_inicio']
    filterset_fields = ['ativo', 'concurso']
    
    def get_queryset(self):
        """Alunos veem apenas seus planos, admins veem todos"""
        if self.request.user.is_admin:
            return PlanoAluno.objects.all().select_related('usuario', 'concurso')
        return PlanoAluno.objects.filter(usuario=self.request.user).select_related('concurso')
    
    def perform_create(self, serializer):
        """Salva o usuário autenticado ao criar plano"""
        serializer.save(usuario=self.request.user)
    
    @action(detail=False, methods=['get'])
    def meu_plano(self, request):
        """
        Retorna o plano ativo do usuário.
        
        GET /api/planos-aluno/meu_plano/
        """
        plano = PlanoAluno.objects.filter(
            usuario=request.user,
            ativo=True
        ).select_related('concurso').first()
        
        if not plano:
            return Response({'detail': 'Nenhum plano ativo'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(plano)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ativar(self, request, pk=None):
        """
        Ativa um plano (desativa os outros).
        
        POST /api/planos-aluno/{id}/ativar/
        """
        plano = self.get_object()
        
        # Verificar se o plano pertence ao usuário
        if not request.user.is_admin and plano.usuario != request.user:
            return Response(
                {'detail': 'Você não tem permissão para ativar este plano'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        plano.ativo = True
        plano.save()  # O save() já desativa os outros
        
        serializer = self.get_serializer(plano)
        return Response(serializer.data)


class AlunosListView(APIView):
    """
    View para listar todos os alunos com suas estatísticas.
    
    Apenas admins podem acessar.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Lista todos os alunos com estatísticas resumidas"""
        if not request.user.is_admin:
            return Response(
                {'detail': 'Apenas administradores podem acessar esta lista'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Buscar todos os alunos (não admins)
        alunos = User.objects.filter(is_admin=False).order_by('first_name', 'email')
        
        resultado = []
        for aluno in alunos:
            # Buscar plano ativo
            plano_ativo = PlanoAluno.objects.filter(
                usuario=aluno,
                ativo=True
            ).select_related('concurso').first()
            
            # Buscar progressos do aluno
            progressos = ProgressoAssunto.objects.filter(usuario=aluno)
            
            # Calcular estatísticas
            total_assuntos = 0
            if plano_ativo:
                total_assuntos = MapaAssunto.objects.filter(
                    concurso=plano_ativo.concurso
                ).count()
            
            assuntos_estudados = progressos.filter(estudado=True).count()
            tempo_total = sum(p.tempo_total_minutos for p in progressos)
            questoes_feitas = sum(p.questoes_feitas for p in progressos)
            questoes_acertadas = sum(p.questoes_acertadas for p in progressos)
            
            ultima_atividade = progressos.order_by('-ultima_sessao').values_list(
                'ultima_sessao', flat=True
            ).first()
            
            resultado.append({
                'usuario_id': aluno.id,
                'usuario_nome': f"{aluno.first_name} {aluno.last_name}".strip() or aluno.email,
                'usuario_email': aluno.email,
                'plano_nome': plano_ativo.concurso.nome if plano_ativo else None,
                'plano_sigla': plano_ativo.concurso.sigla if plano_ativo else None,
                'total_assuntos': total_assuntos,
                'assuntos_estudados': assuntos_estudados,
                'percentual_concluido': round((assuntos_estudados / total_assuntos * 100), 2) if total_assuntos > 0 else 0,
                'tempo_total_horas': round(tempo_total / 60, 2),
                'questoes_feitas': questoes_feitas,
                'questoes_acertadas': questoes_acertadas,
                'percentual_acerto': round((questoes_acertadas / questoes_feitas * 100), 2) if questoes_feitas > 0 else 0,
                'ultima_atividade': ultima_atividade
            })
        
        serializer = AlunoEstatisticasSerializer(resultado, many=True)
        return Response(serializer.data)


class RankingAlunosView(APIView):
    """
    View para ranking de alunos que mais estudam.
    
    Apenas admins podem acessar.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Retorna ranking de alunos ordenado por tempo de estudo"""
        from django.db.models import Sum
        from datetime import datetime, timedelta
        
        if not request.user.is_admin:
            return Response(
                {'detail': 'Apenas administradores podem acessar esta informação'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Parâmetro de período (7dias, 30dias, total)
        periodo = request.query_params.get('periodo', 'total')
        
        alunos = User.objects.filter(is_admin=False)
        
        resultado = []
        for aluno in alunos:
            # Buscar plano ativo
            plano_ativo = PlanoAluno.objects.filter(
                usuario=aluno,
                ativo=True
            ).select_related('concurso').first()
            
            # Buscar sessões do aluno
            sessoes = SessaoEstudo.objects.filter(progresso__usuario=aluno)
            
            # Filtrar por período
            if periodo == '7dias':
                data_inicio = datetime.now().date() - timedelta(days=7)
                sessoes = sessoes.filter(data__gte=data_inicio)
            elif periodo == '30dias':
                data_inicio = datetime.now().date() - timedelta(days=30)
                sessoes = sessoes.filter(data__gte=data_inicio)
            
            # Calcular estatísticas
            stats = sessoes.aggregate(
                tempo_total=Sum('tempo_minutos'),
                questoes_total=Sum('questoes_feitas'),
                acertos_total=Sum('questoes_acertadas')
            )
            
            tempo_total = stats['tempo_total'] or 0
            questoes_feitas = stats['questoes_total'] or 0
            questoes_acertadas = stats['acertos_total'] or 0
            
            # Dias estudados no período
            dias_estudados = sessoes.values('data').distinct().count()
            
            # Total de assuntos estudados
            progressos = ProgressoAssunto.objects.filter(usuario=aluno)
            assuntos_estudados = progressos.filter(estudado=True).count()
            
            # Total de assuntos do plano
            total_assuntos = 0
            if plano_ativo:
                total_assuntos = MapaAssunto.objects.filter(
                    concurso=plano_ativo.concurso
                ).count()
            
            # Última atividade
            ultima_sessao = sessoes.order_by('-data').first()
            
            resultado.append({
                'id': aluno.id,
                'nome': f"{aluno.first_name} {aluno.last_name}".strip() or aluno.email,
                'email': aluno.email,
                'plano': plano_ativo.concurso.sigla if plano_ativo else None,
                'tempo_minutos': tempo_total,
                'tempo_horas': round(tempo_total / 60, 2),
                'dias_estudados': dias_estudados,
                'assuntos_estudados': assuntos_estudados,
                'total_assuntos': total_assuntos,
                'percentual_concluido': round((assuntos_estudados / total_assuntos * 100), 2) if total_assuntos > 0 else 0,
                'questoes_feitas': questoes_feitas,
                'questoes_acertadas': questoes_acertadas,
                'percentual_acerto': round((questoes_acertadas / questoes_feitas * 100), 2) if questoes_feitas > 0 else 0,
                'ultima_atividade': ultima_sessao.data if ultima_sessao else None
            })
        
        # Ordenar por tempo de estudo (decrescente)
        resultado.sort(key=lambda x: x['tempo_minutos'], reverse=True)
        
        # Adicionar posição no ranking
        for i, aluno in enumerate(resultado):
            aluno['posicao'] = i + 1
        
        return Response(resultado)


class AlunoDetalheView(APIView):
    """
    View para ver detalhes de um aluno específico.
    
    Apenas admins podem acessar.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, aluno_id):
        """Retorna estatísticas detalhadas de um aluno"""
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncWeek
        from datetime import datetime, timedelta
        
        if not request.user.is_admin:
            return Response(
                {'detail': 'Apenas administradores podem acessar esta informação'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            aluno = User.objects.get(id=aluno_id, is_admin=False)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Aluno não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Buscar plano ativo
        plano_ativo = PlanoAluno.objects.filter(
            usuario=aluno,
            ativo=True
        ).select_related('concurso').first()
        
        # Buscar progressos do aluno
        progressos = ProgressoAssunto.objects.filter(
            usuario=aluno
        ).select_related(
            'mapa_assunto',
            'mapa_assunto__assunto',
            'mapa_assunto__assunto__disciplina'
        )
        
        # Buscar todas as sessões do aluno
        sessoes = SessaoEstudo.objects.filter(
            progresso__usuario=aluno
        ).select_related('progresso', 'progresso__mapa_assunto')
        
        # Estatísticas gerais
        total_assuntos = 0
        if plano_ativo:
            total_assuntos = MapaAssunto.objects.filter(
                concurso=plano_ativo.concurso
            ).count()
        
        assuntos_estudados = progressos.filter(estudado=True).count()
        tempo_total_minutos = progressos.aggregate(total=Sum('tempo_total_minutos'))['total'] or 0
        questoes_feitas = progressos.aggregate(total=Sum('questoes_feitas'))['total'] or 0
        questoes_acertadas = progressos.aggregate(total=Sum('questoes_acertadas'))['total'] or 0
        
        # === ESTATÍSTICAS POR DISCIPLINA ===
        # Primeiro, buscar o total de assuntos por disciplina do mapa do concurso
        stats_disciplina = {}
        if plano_ativo:
            mapas_concurso = MapaAssunto.objects.filter(
                concurso=plano_ativo.concurso
            ).select_related('assunto', 'assunto__disciplina')
            
            for mapa in mapas_concurso:
                if mapa.assunto and mapa.assunto.disciplina:
                    disc = mapa.assunto.disciplina.nome
                    if disc not in stats_disciplina:
                        stats_disciplina[disc] = {
                            'nome': disc,
                            'total_assuntos': 0,
                            'assuntos_estudados': 0,
                            'tempo_minutos': 0,
                            'questoes_feitas': 0,
                            'questoes_acertadas': 0,
                            'ultima_sessao': None
                        }
                    stats_disciplina[disc]['total_assuntos'] += 1
        
        # Agora adicionar os dados dos progressos
        for p in progressos:
            if p.mapa_assunto and p.mapa_assunto.assunto:
                disc = p.mapa_assunto.assunto.disciplina.nome
                if disc not in stats_disciplina:
                    stats_disciplina[disc] = {
                        'nome': disc,
                        'total_assuntos': 1,
                        'assuntos_estudados': 0,
                        'tempo_minutos': 0,
                        'questoes_feitas': 0,
                        'questoes_acertadas': 0,
                        'ultima_sessao': None
                    }
                if p.estudado:
                    stats_disciplina[disc]['assuntos_estudados'] += 1
                stats_disciplina[disc]['tempo_minutos'] += p.tempo_total_minutos
                stats_disciplina[disc]['questoes_feitas'] += p.questoes_feitas
                stats_disciplina[disc]['questoes_acertadas'] += p.questoes_acertadas
                
                if p.ultima_sessao:
                    if not stats_disciplina[disc]['ultima_sessao'] or p.ultima_sessao > stats_disciplina[disc]['ultima_sessao']:
                        stats_disciplina[disc]['ultima_sessao'] = p.ultima_sessao
        
        # Calcular percentuais e ordenar por tempo estudado
        disciplinas_lista = []
        for disc, stats in stats_disciplina.items():
            stats['percentual_concluido'] = round(
                (stats['assuntos_estudados'] / stats['total_assuntos'] * 100), 2
            ) if stats['total_assuntos'] > 0 else 0
            stats['percentual_acerto'] = round(
                (stats['questoes_acertadas'] / stats['questoes_feitas'] * 100), 2
            ) if stats['questoes_feitas'] > 0 else 0
            stats['tempo_horas'] = round(stats['tempo_minutos'] / 60, 2)
            disciplinas_lista.append(stats)
        
        disciplinas_lista.sort(key=lambda x: x['tempo_minutos'], reverse=True)
        disciplina_mais_estudada = disciplinas_lista[0] if disciplinas_lista else None
        
        # === HISTÓRICO DE SESSÕES (últimos 30 dias) ===
        hoje = datetime.now().date()
        trinta_dias_atras = hoje - timedelta(days=30)
        
        sessoes_por_dia = sessoes.filter(
            data__gte=trinta_dias_atras
        ).values('data').annotate(
            tempo=Sum('tempo_minutos'),
            questoes=Sum('questoes_feitas'),
            acertos=Sum('questoes_acertadas')
        ).order_by('data')
        
        historico_diario = []
        for s in sessoes_por_dia:
            historico_diario.append({
                'data': s['data'],
                'tempo_minutos': s['tempo'] or 0,
                'questoes_feitas': s['questoes'] or 0,
                'questoes_acertadas': s['acertos'] or 0
            })
        
        # === PRIMEIRA E ÚLTIMA SESSÃO ===
        primeira_sessao = sessoes.order_by('data').first()
        ultima_sessao = sessoes.order_by('-data').first()
        
        # === DIAS ESTUDADOS E STREAK ===
        total_dias_estudados = sessoes.values('data').distinct().count()
        dias_com_estudo = set(sessoes.values_list('data', flat=True))
        
        streak_atual = 0
        streak_maximo = 0
        
        # Calcular streak atual
        dia_atual = hoje
        while dia_atual in dias_com_estudo:
            streak_atual += 1
            dia_atual -= timedelta(days=1)
        
        if streak_atual == 0 and (hoje - timedelta(days=1)) in dias_com_estudo:
            dia_atual = hoje - timedelta(days=1)
            while dia_atual in dias_com_estudo:
                streak_atual += 1
                dia_atual -= timedelta(days=1)
        
        # Calcular streak máximo
        if dias_com_estudo:
            dias_ordenados = sorted(dias_com_estudo)
            temp_streak = 1
            streak_maximo = 1
            for i in range(1, len(dias_ordenados)):
                if (dias_ordenados[i] - dias_ordenados[i-1]).days == 1:
                    temp_streak += 1
                    streak_maximo = max(streak_maximo, temp_streak)
                else:
                    temp_streak = 1
        
        # === MÉDIAS ===
        media_tempo_diario = round(tempo_total_minutos / total_dias_estudados, 2) if total_dias_estudados > 0 else 0
        media_questoes_diario = round(questoes_feitas / total_dias_estudados, 2) if total_dias_estudados > 0 else 0
        
        # === TOP 5 ASSUNTOS ===
        top_assuntos = progressos.filter(
            tempo_total_minutos__gt=0
        ).order_by('-tempo_total_minutos')[:5]
        
        top_assuntos_lista = []
        for p in top_assuntos:
            top_assuntos_lista.append({
                'nome': p.mapa_assunto.nome_completo if p.mapa_assunto else 'N/A',
                'disciplina': p.mapa_assunto.assunto.disciplina.nome if p.mapa_assunto and p.mapa_assunto.assunto else 'N/A',
                'tempo_minutos': p.tempo_total_minutos,
                'tempo_horas': round(p.tempo_total_minutos / 60, 2),
                'questoes_feitas': p.questoes_feitas,
                'percentual_acerto': round((p.questoes_acertadas / p.questoes_feitas * 100), 2) if p.questoes_feitas > 0 else 0
            })
        
        # === ASSUNTOS RECENTES ===
        assuntos_recentes = progressos.filter(
            ultima_sessao__isnull=False
        ).order_by('-ultima_sessao')[:5]
        
        assuntos_recentes_lista = []
        for p in assuntos_recentes:
            assuntos_recentes_lista.append({
                'nome': p.mapa_assunto.nome_completo if p.mapa_assunto else 'N/A',
                'disciplina': p.mapa_assunto.assunto.disciplina.nome if p.mapa_assunto and p.mapa_assunto.assunto else 'N/A',
                'ultima_sessao': p.ultima_sessao,
                'estudado': p.estudado
            })
        
        return Response({
            'aluno': {
                'id': aluno.id,
                'nome': f"{aluno.first_name} {aluno.last_name}".strip() or aluno.email,
                'email': aluno.email,
                'data_cadastro': aluno.date_joined
            },
            'plano': {
                'id': plano_ativo.concurso.id if plano_ativo else None,
                'nome': plano_ativo.concurso.nome if plano_ativo else None,
                'sigla': plano_ativo.concurso.sigla if plano_ativo else None,
                'data_inicio': plano_ativo.data_inicio if plano_ativo else None
            },
            'estatisticas_gerais': {
                'total_assuntos': total_assuntos,
                'assuntos_estudados': assuntos_estudados,
                'percentual_concluido': round((assuntos_estudados / total_assuntos * 100), 2) if total_assuntos > 0 else 0,
                'tempo_total_minutos': tempo_total_minutos,
                'tempo_total_horas': round(tempo_total_minutos / 60, 2),
                'questoes_feitas': questoes_feitas,
                'questoes_acertadas': questoes_acertadas,
                'percentual_acerto': round((questoes_acertadas / questoes_feitas * 100), 2) if questoes_feitas > 0 else 0
            },
            'sequencia': {
                'streak_atual': streak_atual,
                'streak_maximo': streak_maximo,
                'total_dias_estudados': total_dias_estudados,
                'media_tempo_diario': media_tempo_diario,
                'media_questoes_diario': media_questoes_diario
            },
            'datas': {
                'primeira_sessao': primeira_sessao.data if primeira_sessao else None,
                'ultima_sessao': ultima_sessao.data if ultima_sessao else None
            },
            'disciplina_mais_estudada': disciplina_mais_estudada,
            'por_disciplina': disciplinas_lista,
            'top_assuntos': top_assuntos_lista,
            'assuntos_recentes': assuntos_recentes_lista,
            'historico_diario': historico_diario
        })


class DashboardAlunoView(APIView):
    """
    View para dashboard completo do aluno com estatísticas detalhadas.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Retorna estatísticas completas do aluno"""
        from django.db.models import Sum, Count, Min, Max, Avg
        from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
        from datetime import datetime, timedelta
        
        usuario = request.user
        
        # Buscar plano ativo
        plano_ativo = PlanoAluno.objects.filter(
            usuario=usuario,
            ativo=True
        ).select_related('concurso').first()
        
        # Buscar todos os progressos do usuário
        progressos = ProgressoAssunto.objects.filter(
            usuario=usuario
        ).select_related(
            'mapa_assunto',
            'mapa_assunto__assunto',
            'mapa_assunto__assunto__disciplina',
            'mapa_assunto__concurso'
        )
        
        # Buscar todas as sessões do usuário
        sessoes = SessaoEstudo.objects.filter(
            progresso__usuario=usuario
        ).select_related('progresso', 'progresso__mapa_assunto')
        
        # === ESTATÍSTICAS GERAIS ===
        total_assuntos = 0
        if plano_ativo:
            total_assuntos = MapaAssunto.objects.filter(
                concurso=plano_ativo.concurso
            ).count()
        
        assuntos_estudados = progressos.filter(estudado=True).count()
        tempo_total_minutos = progressos.aggregate(total=Sum('tempo_total_minutos'))['total'] or 0
        questoes_feitas = progressos.aggregate(total=Sum('questoes_feitas'))['total'] or 0
        questoes_acertadas = progressos.aggregate(total=Sum('questoes_acertadas'))['total'] or 0
        
        # === ESTATÍSTICAS POR DISCIPLINA ===
        # Primeiro, buscar o total de assuntos por disciplina do mapa do concurso
        stats_disciplina = {}
        if plano_ativo:
            mapas_concurso = MapaAssunto.objects.filter(
                concurso=plano_ativo.concurso
            ).select_related('assunto', 'assunto__disciplina')
            
            for mapa in mapas_concurso:
                if mapa.assunto and mapa.assunto.disciplina:
                    disc = mapa.assunto.disciplina.nome
                    if disc not in stats_disciplina:
                        stats_disciplina[disc] = {
                            'nome': disc,
                            'total_assuntos': 0,
                            'assuntos_estudados': 0,
                            'tempo_minutos': 0,
                            'questoes_feitas': 0,
                            'questoes_acertadas': 0,
                            'primeira_sessao': None,
                            'ultima_sessao': None
                        }
                    stats_disciplina[disc]['total_assuntos'] += 1
        
        # Agora adicionar os dados dos progressos
        for p in progressos:
            if p.mapa_assunto and p.mapa_assunto.assunto:
                disc = p.mapa_assunto.assunto.disciplina.nome
                if disc not in stats_disciplina:
                    stats_disciplina[disc] = {
                        'nome': disc,
                        'total_assuntos': 1,
                        'assuntos_estudados': 0,
                        'tempo_minutos': 0,
                        'questoes_feitas': 0,
                        'questoes_acertadas': 0,
                        'primeira_sessao': None,
                        'ultima_sessao': None
                    }
                if p.estudado:
                    stats_disciplina[disc]['assuntos_estudados'] += 1
                stats_disciplina[disc]['tempo_minutos'] += p.tempo_total_minutos
                stats_disciplina[disc]['questoes_feitas'] += p.questoes_feitas
                stats_disciplina[disc]['questoes_acertadas'] += p.questoes_acertadas
                
                if p.ultima_sessao:
                    if not stats_disciplina[disc]['ultima_sessao'] or p.ultima_sessao > stats_disciplina[disc]['ultima_sessao']:
                        stats_disciplina[disc]['ultima_sessao'] = p.ultima_sessao
        
        # Calcular percentuais e ordenar por tempo estudado
        disciplinas_lista = []
        for disc, stats in stats_disciplina.items():
            stats['percentual_concluido'] = round(
                (stats['assuntos_estudados'] / stats['total_assuntos'] * 100), 2
            ) if stats['total_assuntos'] > 0 else 0
            stats['percentual_acerto'] = round(
                (stats['questoes_acertadas'] / stats['questoes_feitas'] * 100), 2
            ) if stats['questoes_feitas'] > 0 else 0
            stats['tempo_horas'] = round(stats['tempo_minutos'] / 60, 2)
            disciplinas_lista.append(stats)
        
        # Ordenar por tempo estudado (mais estudada primeiro)
        disciplinas_lista.sort(key=lambda x: x['tempo_minutos'], reverse=True)
        
        # === DISCIPLINA MAIS ESTUDADA ===
        disciplina_mais_estudada = disciplinas_lista[0] if disciplinas_lista else None
        
        # === HISTÓRICO DE SESSÕES ===
        # Sessões por dia (últimos 30 dias)
        hoje = datetime.now().date()
        trinta_dias_atras = hoje - timedelta(days=30)
        
        sessoes_por_dia = sessoes.filter(
            data__gte=trinta_dias_atras
        ).values('data').annotate(
            tempo=Sum('tempo_minutos'),
            questoes=Sum('questoes_feitas'),
            acertos=Sum('questoes_acertadas')
        ).order_by('data')
        
        historico_diario = []
        for s in sessoes_por_dia:
            historico_diario.append({
                'data': s['data'],
                'tempo_minutos': s['tempo'] or 0,
                'questoes_feitas': s['questoes'] or 0,
                'questoes_acertadas': s['acertos'] or 0
            })
        
        # === SESSÕES POR SEMANA (últimas 12 semanas) ===
        doze_semanas_atras = hoje - timedelta(weeks=12)
        sessoes_por_semana = sessoes.filter(
            data__gte=doze_semanas_atras
        ).annotate(
            semana=TruncWeek('data')
        ).values('semana').annotate(
            tempo=Sum('tempo_minutos'),
            questoes=Sum('questoes_feitas'),
            acertos=Sum('questoes_acertadas'),
            dias_estudados=Count('data', distinct=True)
        ).order_by('semana')
        
        historico_semanal = []
        for s in sessoes_por_semana:
            historico_semanal.append({
                'semana': s['semana'],
                'tempo_minutos': s['tempo'] or 0,
                'questoes_feitas': s['questoes'] or 0,
                'questoes_acertadas': s['acertos'] or 0,
                'dias_estudados': s['dias_estudados']
            })
        
        # === PRIMEIRA E ÚLTIMA SESSÃO ===
        primeira_sessao = sessoes.order_by('data').first()
        ultima_sessao = sessoes.order_by('-data').first()
        
        # === DIAS ESTUDADOS ===
        total_dias_estudados = sessoes.values('data').distinct().count()
        
        # === SEQUÊNCIA DE DIAS (streak) ===
        dias_com_estudo = set(sessoes.values_list('data', flat=True))
        streak_atual = 0
        streak_maximo = 0
        temp_streak = 0
        
        # Calcular streak atual (dias consecutivos até hoje)
        dia_atual = hoje
        while dia_atual in dias_com_estudo:
            streak_atual += 1
            dia_atual -= timedelta(days=1)
        
        # Se não estudou hoje, verificar se estudou ontem
        if streak_atual == 0 and (hoje - timedelta(days=1)) in dias_com_estudo:
            dia_atual = hoje - timedelta(days=1)
            while dia_atual in dias_com_estudo:
                streak_atual += 1
                dia_atual -= timedelta(days=1)
        
        # Calcular streak máximo
        if dias_com_estudo:
            dias_ordenados = sorted(dias_com_estudo)
            temp_streak = 1
            streak_maximo = 1
            for i in range(1, len(dias_ordenados)):
                if (dias_ordenados[i] - dias_ordenados[i-1]).days == 1:
                    temp_streak += 1
                    streak_maximo = max(streak_maximo, temp_streak)
                else:
                    temp_streak = 1
        
        # === MÉDIA DIÁRIA ===
        if total_dias_estudados > 0:
            media_tempo_diario = round(tempo_total_minutos / total_dias_estudados, 2)
            media_questoes_diario = round(questoes_feitas / total_dias_estudados, 2)
        else:
            media_tempo_diario = 0
            media_questoes_diario = 0
        
        # === TOP 5 ASSUNTOS MAIS ESTUDADOS ===
        top_assuntos = progressos.filter(
            tempo_total_minutos__gt=0
        ).order_by('-tempo_total_minutos')[:5]
        
        top_assuntos_lista = []
        for p in top_assuntos:
            top_assuntos_lista.append({
                'nome': p.mapa_assunto.nome_completo if p.mapa_assunto else 'N/A',
                'disciplina': p.mapa_assunto.assunto.disciplina.nome if p.mapa_assunto and p.mapa_assunto.assunto else 'N/A',
                'tempo_minutos': p.tempo_total_minutos,
                'tempo_horas': round(p.tempo_total_minutos / 60, 2),
                'questoes_feitas': p.questoes_feitas,
                'percentual_acerto': round((p.questoes_acertadas / p.questoes_feitas * 100), 2) if p.questoes_feitas > 0 else 0
            })
        
        # === ASSUNTOS RECENTES ===
        assuntos_recentes = progressos.filter(
            ultima_sessao__isnull=False
        ).order_by('-ultima_sessao')[:5]
        
        assuntos_recentes_lista = []
        for p in assuntos_recentes:
            assuntos_recentes_lista.append({
                'nome': p.mapa_assunto.nome_completo if p.mapa_assunto else 'N/A',
                'disciplina': p.mapa_assunto.assunto.disciplina.nome if p.mapa_assunto and p.mapa_assunto.assunto else 'N/A',
                'ultima_sessao': p.ultima_sessao,
                'estudado': p.estudado
            })
        
        return Response({
            'plano': {
                'id': plano_ativo.concurso.id if plano_ativo else None,
                'nome': plano_ativo.concurso.nome if plano_ativo else None,
                'sigla': plano_ativo.concurso.sigla if plano_ativo else None,
                'data_inicio': plano_ativo.data_inicio if plano_ativo else None
            },
            'estatisticas_gerais': {
                'total_assuntos': total_assuntos,
                'assuntos_estudados': assuntos_estudados,
                'percentual_concluido': round((assuntos_estudados / total_assuntos * 100), 2) if total_assuntos > 0 else 0,
                'tempo_total_minutos': tempo_total_minutos,
                'tempo_total_horas': round(tempo_total_minutos / 60, 2),
                'questoes_feitas': questoes_feitas,
                'questoes_acertadas': questoes_acertadas,
                'percentual_acerto': round((questoes_acertadas / questoes_feitas * 100), 2) if questoes_feitas > 0 else 0
            },
            'sequencia': {
                'streak_atual': streak_atual,
                'streak_maximo': streak_maximo,
                'total_dias_estudados': total_dias_estudados,
                'media_tempo_diario': media_tempo_diario,
                'media_questoes_diario': media_questoes_diario
            },
            'datas': {
                'primeira_sessao': primeira_sessao.data if primeira_sessao else None,
                'ultima_sessao': ultima_sessao.data if ultima_sessao else None
            },
            'disciplina_mais_estudada': disciplina_mais_estudada,
            'por_disciplina': disciplinas_lista,
            'top_assuntos': top_assuntos_lista,
            'assuntos_recentes': assuntos_recentes_lista,
            'historico_diario': historico_diario,
            'historico_semanal': historico_semanal
        })
