from django.urls import path
from .views import RegisterView, user_profile, GoogleLogin

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', user_profile, name='user-profile'),
    path('google/', GoogleLogin.as_view(), name='google-login'),
]
