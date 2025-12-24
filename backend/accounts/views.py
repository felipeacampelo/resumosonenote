from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()


class GoogleLogin(SocialLoginView):
    """View para login com Google OAuth2"""
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:5173"  # URL do frontend
    client_class = OAuth2Client


class RegisterView(generics.CreateAPIView):
    """View para registro de novos usuários"""
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Retorna os dados do usuário autenticado"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
