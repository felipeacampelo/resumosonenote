from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Manager customizado para modelo de usuário sem username"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('O email é obrigatório')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser deve ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser deve ter is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Modelo de usuário customizado que usa email ao invés de username.
    
    Attributes:
        email (EmailField): Email único do usuário (usado para login)
        is_admin (BooleanField): Define se o usuário tem permissões de administrador
    
    Permissions:
        - Admins: Podem criar, editar e exportar mapas de estudos
        - Alunos: Podem apenas visualizar mapas de estudos
    """
    username = None
    email = models.EmailField('Email', unique=True)
    is_admin = models.BooleanField(
        'Administrador',
        default=False,
        help_text='Define se o usuário tem permissões de administrador do sistema'
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = UserManager()
    
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        permissions = [
            ('can_create_maps', 'Pode criar mapas de estudos'),
            ('can_edit_maps', 'Pode editar mapas de estudos'),
            ('can_export_maps', 'Pode exportar mapas de estudos'),
        ]
    
    def __str__(self):
        return self.email
    
    @property
    def is_student(self):
        """Retorna True se o usuário é um aluno (não admin)"""
        return not self.is_admin
