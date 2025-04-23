from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, AvailabilityViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'availabilities', AvailabilityViewSet, basename='availability')

urlpatterns = [
    path('', include(router.urls)),
]