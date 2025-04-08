from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, AvailabilityViewSet, login_view

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'availabilities', AvailabilityViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', login_view, name='login'),
]