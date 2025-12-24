from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer para dados do usuário"""
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'is_admin', 'is_staff', 'date_joined')
        read_only_fields = ('id', 'is_admin', 'is_staff', 'date_joined')


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de novos usuários"""
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer para login de usuários"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'),
                             email=email, password=password)
            
            if not user:
                msg = _('Não foi possível fazer login com as credenciais fornecidas.')
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = _('Por favor, forneça um e-mail e senha.')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs
