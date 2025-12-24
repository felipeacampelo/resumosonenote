"""
Modelos do sistema de mapas de estudos.

Este módulo contém os modelos principais para gerenciar:
- Matriz de Assuntos (base fixa importada do Excel)
- Mapas de Estudos por Concurso
- Metadados específicos de cada concurso
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings


class TimeStampedModel(models.Model):
    """
    Modelo abstrato que adiciona campos de timestamp.
    
    Attributes:
        created_at (DateTimeField): Data/hora de criação do registro
        updated_at (DateTimeField): Data/hora da última atualização
    """
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        abstract = True


class Disciplina(TimeStampedModel):
    """
    Representa uma disciplina da matriz de assuntos.
    
    Exemplo: Direito Constitucional, Direito Administrativo, etc.
    
    Attributes:
        nome (CharField): Nome da disciplina
        ordem (PositiveIntegerField): Ordem de exibição
        ativa (BooleanField): Se a disciplina está ativa no sistema
    """
    nome = models.CharField(
        'Nome',
        max_length=200,
        unique=True,
        help_text='Nome da disciplina (ex: Direito Constitucional)'
    )
    ordem = models.PositiveIntegerField(
        'Ordem',
        default=0,
        help_text='Ordem de exibição da disciplina'
    )
    ativa = models.BooleanField(
        'Ativa',
        default=True,
        help_text='Define se a disciplina está ativa no sistema'
    )
    
    class Meta:
        verbose_name = 'Disciplina'
        verbose_name_plural = 'Disciplinas'
        ordering = ['ordem', 'nome']
    
    def __str__(self):
        return self.nome
    
    @property
    def total_assuntos(self):
        """Retorna o total de assuntos desta disciplina"""
        return self.assuntos.count()


class Assunto(TimeStampedModel):
    """
    Representa um assunto dentro de uma disciplina.
    
    Exemplo: Direitos Fundamentais, Organização do Estado, etc.
    
    Attributes:
        disciplina (ForeignKey): Disciplina à qual o assunto pertence
        nome (CharField): Nome do assunto
        ordem (PositiveIntegerField): Ordem de exibição dentro da disciplina
        ativo (BooleanField): Se o assunto está ativo no sistema
    """
    disciplina = models.ForeignKey(
        Disciplina,
        on_delete=models.CASCADE,
        related_name='assuntos',
        verbose_name='Disciplina'
    )
    nome = models.CharField(
        'Nome',
        max_length=300,
        help_text='Nome do assunto'
    )
    ordem = models.PositiveIntegerField(
        'Ordem',
        default=0,
        help_text='Ordem de exibição do assunto dentro da disciplina'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        help_text='Define se o assunto está ativo no sistema'
    )
    
    # Metadados da Matriz (importados do Excel)
    link_resumos = models.CharField(
        'Aula dos Resumos OneNote',
        max_length=500,
        blank=True,
        help_text='Link para aula dos Resumos OneNote'
    )
    link_questoes_cebraspe = models.CharField(
        'Caderno TEC Concursos - Cebraspe',
        max_length=500,
        blank=True,
        help_text='Link para caderno de questões Cebraspe'
    )
    link_questoes_fgv = models.CharField(
        'Caderno de Questões FGV',
        max_length=500,
        blank=True,
        help_text='Link para caderno de questões FGV'
    )
    dica = models.TextField(
        'Dica',
        max_length=500,
        blank=True,
        help_text='Dica sobre o assunto (máx. 500 caracteres)'
    )
    
    class Meta:
        verbose_name = 'Assunto'
        verbose_name_plural = 'Assuntos'
        ordering = ['disciplina', 'ordem', 'nome']
        unique_together = ['disciplina', 'nome']
    
    def __str__(self):
        return f"{self.disciplina.nome} - {self.nome}"
    
    @property
    def total_subassuntos(self):
        """Retorna o total de subassuntos deste assunto"""
        return self.subassuntos.count()


class Subassunto(TimeStampedModel):
    """
    Representa um subassunto dentro de um assunto.
    
    Exemplo: Direitos Individuais, Direitos Coletivos, etc.
    
    Attributes:
        assunto (ForeignKey): Assunto ao qual o subassunto pertence
        nome (CharField): Nome do subassunto
        ordem (PositiveIntegerField): Ordem de exibição dentro do assunto
        ativo (BooleanField): Se o subassunto está ativo no sistema
    """
    assunto = models.ForeignKey(
        Assunto,
        on_delete=models.CASCADE,
        related_name='subassuntos',
        verbose_name='Assunto'
    )
    nome = models.CharField(
        'Nome',
        max_length=400,
        help_text='Nome do subassunto'
    )
    ordem = models.PositiveIntegerField(
        'Ordem',
        default=0,
        help_text='Ordem de exibição do subassunto dentro do assunto'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        help_text='Define se o subassunto está ativo no sistema'
    )
    
    class Meta:
        verbose_name = 'Subassunto'
        verbose_name_plural = 'Subassuntos'
        ordering = ['assunto', 'ordem', 'nome']
        unique_together = ['assunto', 'nome']
    
    def __str__(self):
        return f"{self.assunto.nome} - {self.nome}"


class Concurso(TimeStampedModel):
    """
    Representa um concurso específico para o qual será criado um mapa de estudos.
    
    Exemplo: TRF 2025, Polícia Federal 2025, etc.
    
    Attributes:
        nome (CharField): Nome do concurso
        sigla (CharField): Sigla do concurso (ex: TRF, PF)
        ordem (PositiveIntegerField): Ordem de exibição
        tipo (CharField): Tipo do concurso (Graduação ou Pós-graduação)
        cursinho (CharField): Nome do cursinho associado
        ativo (BooleanField): Se o concurso está ativo
        criado_por (ForeignKey): Usuário admin que criou o concurso
    """
    
    TIPO_CHOICES = [
        ('GRAD', 'Graduação'),
        ('POS', 'Pós-graduação'),
    ]
    
    nome = models.CharField(
        'Nome',
        max_length=200,
        help_text='Nome completo do concurso (ex: TRF 2ª Região 2025)'
    )
    sigla = models.CharField(
        'Sigla',
        max_length=50,
        help_text='Sigla do concurso (ex: TRF, PF, PCDF)'
    )
    ordem = models.PositiveIntegerField(
        'Ordem',
        default=0,
        help_text='Ordem de exibição do concurso'
    )
    tipo = models.CharField(
        'Tipo',
        max_length=4,
        choices=TIPO_CHOICES,
        default='GRAD',
        help_text='Tipo do concurso'
    )
    cursinho = models.CharField(
        'Cursinho',
        max_length=100,
        blank=True,
        help_text='Nome do cursinho associado (ex: Gran Cursos, Estratégia)'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        help_text='Define se o concurso está ativo no sistema'
    )
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='concursos_criados',
        verbose_name='Criado por'
    )
    
    class Meta:
        verbose_name = 'Concurso'
        verbose_name_plural = 'Concursos'
        ordering = ['ordem', '-created_at']
        unique_together = ['nome', 'sigla']
    
    def __str__(self):
        return f"{self.nome} ({self.sigla})"
    
    @property
    def total_assuntos_mapa(self):
        """Retorna o total de assuntos no mapa deste concurso"""
        return self.mapa_assuntos.count()
    
    @property
    def tipo_display(self):
        """Retorna o nome legível do tipo"""
        return dict(self.TIPO_CHOICES).get(self.tipo, self.tipo)


class MapaAssunto(TimeStampedModel):
    """
    Relaciona assuntos da matriz com um concurso específico.
    
    Este é o modelo central que conecta a matriz fixa aos mapas editáveis.
    
    Attributes:
        concurso (ForeignKey): Concurso ao qual o assunto pertence
        assunto (ForeignKey): Assunto da matriz selecionado
        subassunto (ForeignKey): Subassunto específico (opcional)
        ordem (PositiveIntegerField): Ordem de exibição no mapa
        item_edital (CharField): Referência ao item do edital
        extra_cursinho (BooleanField): Se é um assunto extra não presente na matriz
        nome_extra (CharField): Nome do assunto extra (se aplicável)
    """
    concurso = models.ForeignKey(
        Concurso,
        on_delete=models.CASCADE,
        related_name='mapa_assuntos',
        verbose_name='Concurso'
    )
    assunto = models.ForeignKey(
        Assunto,
        on_delete=models.CASCADE,
        related_name='mapas',
        verbose_name='Assunto',
        null=True,
        blank=True,
        help_text='Assunto da matriz (null se for assunto extra)'
    )
    subassunto = models.ForeignKey(
        Subassunto,
        on_delete=models.CASCADE,
        related_name='mapas',
        verbose_name='Subassunto',
        null=True,
        blank=True,
        help_text='Subassunto específico (opcional)'
    )
    ordem = models.PositiveIntegerField(
        'Ordem',
        default=0,
        help_text='Ordem de exibição no mapa do concurso'
    )
    item_edital = models.CharField(
        'Item do Edital',
        max_length=100,
        blank=True,
        help_text='Referência ao item do edital (ex: 3.2, 4.1.2)'
    )
    extra_cursinho = models.BooleanField(
        'Assunto Extra',
        default=False,
        help_text='Indica se é um assunto específico do cursinho, não presente na matriz'
    )
    nome_extra = models.CharField(
        'Nome do Assunto Extra',
        max_length=300,
        blank=True,
        help_text='Nome do assunto extra (apenas se extra_cursinho=True)'
    )
    
    class Meta:
        verbose_name = 'Mapa de Assunto'
        verbose_name_plural = 'Mapas de Assuntos'
        ordering = ['concurso', 'ordem']
        unique_together = ['concurso', 'assunto', 'subassunto']
    
    def __str__(self):
        if self.extra_cursinho:
            return f"{self.concurso.sigla} - {self.nome_extra} (Extra)"
        elif self.subassunto:
            return f"{self.concurso.sigla} - {self.subassunto}"
        else:
            return f"{self.concurso.sigla} - {self.assunto}"
    
    def clean(self):
        """Validação customizada"""
        from django.core.exceptions import ValidationError
        
        # Se for extra, deve ter nome_extra
        if self.extra_cursinho and not self.nome_extra:
            raise ValidationError('Assuntos extras devem ter um nome definido')
        
        # Se não for extra, deve ter assunto
        if not self.extra_cursinho and not self.assunto:
            raise ValidationError('Assuntos não-extras devem estar vinculados a um assunto da matriz')
    
    @property
    def nome_completo(self):
        """Retorna o nome completo do assunto para exibição"""
        if self.extra_cursinho:
            return self.nome_extra
        elif self.subassunto:
            return f"{self.assunto.nome} - {self.subassunto.nome}"
        else:
            return self.assunto.nome


class MetadadosAssunto(TimeStampedModel):
    """
    Metadados específicos de um assunto dentro de um mapa de concurso.
    
    Formato de exportação Tutory:
    - Disciplina, Assunto (vem do MapaAssunto)
    - Páginas ou Minutos de Vídeo
    - Minutos Expresso, Regular, Calma
    - Dica, Dica de Revisões, Dica de Questões
    - Referência, Ordenação
    - Peso de Resumos, Peso de Revisões, Peso de Questões
    - Número de Questões
    - Link de Estudo, Link de Resumo, Link de Questões
    - Suplementar
    """
    mapa_assunto = models.OneToOneField(
        MapaAssunto,
        on_delete=models.CASCADE,
        related_name='metadados',
        verbose_name='Mapa de Assunto'
    )
    
    # Páginas/Minutos de Vídeo
    paginas_minutos = models.PositiveIntegerField(
        'Páginas ou Minutos de Vídeo',
        default=0,
        help_text='Páginas ou minutos de vídeo para estudo'
    )
    
    # Tempos (decimais)
    minutos_expresso = models.DecimalField(
        'Minutos Expresso',
        max_digits=6,
        decimal_places=2,
        default=0,
        help_text='Tempo no modo expresso'
    )
    minutos_regular = models.DecimalField(
        'Minutos Regular',
        max_digits=6,
        decimal_places=2,
        default=0,
        help_text='Tempo no modo regular'
    )
    minutos_calma = models.DecimalField(
        'Minutos Calma',
        max_digits=6,
        decimal_places=2,
        default=0,
        help_text='Tempo no modo calma'
    )
    
    # Dicas (limite de 500 caracteres)
    dica = models.TextField(
        'Dica',
        max_length=500,
        blank=True,
        help_text='Dica geral sobre o assunto (máx. 500 caracteres)'
    )
    dica_revisoes = models.TextField(
        'Dica de Revisões',
        max_length=500,
        blank=True,
        help_text='Dica específica para revisões (máx. 500 caracteres)'
    )
    dica_questoes = models.TextField(
        'Dica de Questões',
        max_length=500,
        blank=True,
        help_text='Dica específica para questões (máx. 500 caracteres)'
    )
    
    # Referência
    referencia = models.TextField(
        'Referência',
        max_length=500,
        blank=True,
        help_text='Referências extras (máx. 500 caracteres)'
    )
    
    # Pesos (valores de 1 a 4)
    peso_resumos = models.PositiveSmallIntegerField(
        'Peso de Resumos',
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(4)],
        help_text='Peso de importância para resumos (1 a 4)'
    )
    peso_revisoes = models.PositiveSmallIntegerField(
        'Peso de Revisões',
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(4)],
        help_text='Peso de importância para revisões (1 a 4)'
    )
    peso_questoes = models.PositiveSmallIntegerField(
        'Peso de Questões',
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(4)],
        help_text='Peso de importância para questões (1 a 4)'
    )
    
    # Número de Questões
    numero_questoes = models.PositiveIntegerField(
        'Número de Questões',
        default=0,
        help_text='Quantidade de questões recomendadas'
    )
    
    # Links de Cursinhos (editáveis por concurso)
    link_estrategia = models.CharField(
        'Link Estratégia',
        max_length=500,
        blank=True,
        help_text='Link para material do Estratégia Concursos'
    )
    link_direcao = models.CharField(
        'Link Direção',
        max_length=500,
        blank=True,
        help_text='Link para material do Direção Concursos'
    )
    link_pdf = models.CharField(
        'Link PDF',
        max_length=500,
        blank=True,
        help_text='Link para PDF do material'
    )
    link_resumo = models.CharField(
        'Link de Resumo',
        max_length=500,
        blank=True,
        help_text='Link para resumos'
    )
    link_questoes = models.CharField(
        'Link de Questões',
        max_length=500,
        blank=True,
        help_text='Link para questões'
    )
    link_video = models.CharField(
        'Link Vídeo',
        max_length=500,
        blank=True,
        help_text='Link para vídeo-aula'
    )
    
    # Relevância do assunto para o concurso
    RELEVANCIA_CHOICES = [
        ('muito_alta', 'Muito Alta'),
        ('alta', 'Alta'),
        ('media', 'Média'),
        ('baixa', 'Baixa'),
        ('muito_baixa', 'Muito Baixa'),
    ]
    relevancia = models.CharField(
        'Relevância',
        max_length=20,
        choices=RELEVANCIA_CHOICES,
        default='media',
        help_text='Relevância do assunto para este concurso'
    )
    
    # Suplementar (0 ou 1)
    suplementar = models.BooleanField(
        'Suplementar',
        default=False,
        help_text='Define se o assunto é suplementar (0=Não, 1=Sim)'
    )
    
    class Meta:
        verbose_name = 'Metadados do Assunto'
        verbose_name_plural = 'Metadados dos Assuntos'
    
    def __str__(self):
        return f"Metadados: {self.mapa_assunto}"
    
    @property
    def suplementar_display(self):
        """Retorna 0 ou 1 para compatibilidade com Tutory"""
        return 1 if self.suplementar else 0
    
    def clean(self):
        """Validação customizada dos campos"""
        from django.core.exceptions import ValidationError
        
        errors = {}
        
        # Validar limites de 500 caracteres
        if self.dica and len(self.dica) > 500:
            errors['dica'] = 'Máximo de 500 caracteres'
        if self.dica_revisoes and len(self.dica_revisoes) > 500:
            errors['dica_revisoes'] = 'Máximo de 500 caracteres'
        if self.dica_questoes and len(self.dica_questoes) > 500:
            errors['dica_questoes'] = 'Máximo de 500 caracteres'
        if self.referencia and len(self.referencia) > 500:
            errors['referencia'] = 'Máximo de 500 caracteres'
        if self.link_estrategia and len(self.link_estrategia) > 500:
            errors['link_estrategia'] = 'Máximo de 500 caracteres'
        if self.link_direcao and len(self.link_direcao) > 500:
            errors['link_direcao'] = 'Máximo de 500 caracteres'
        if self.link_pdf and len(self.link_pdf) > 500:
            errors['link_pdf'] = 'Máximo de 500 caracteres'
        if self.link_resumo and len(self.link_resumo) > 500:
            errors['link_resumo'] = 'Máximo de 500 caracteres'
        if self.link_questoes and len(self.link_questoes) > 500:
            errors['link_questoes'] = 'Máximo de 500 caracteres'
        if self.link_video and len(self.link_video) > 500:
            errors['link_video'] = 'Máximo de 500 caracteres'
        
        # Validar pesos (1 a 4)
        if self.peso_resumos not in [1, 2, 3, 4]:
            errors['peso_resumos'] = 'Peso deve ser 1, 2, 3 ou 4'
        if self.peso_revisoes not in [1, 2, 3, 4]:
            errors['peso_revisoes'] = 'Peso deve ser 1, 2, 3 ou 4'
        if self.peso_questoes not in [1, 2, 3, 4]:
            errors['peso_questoes'] = 'Peso deve ser 1, 2, 3 ou 4'
        
        if errors:
            raise ValidationError(errors)
