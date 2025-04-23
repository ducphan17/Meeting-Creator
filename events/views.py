from rest_framework import viewsets, status
from rest_framework.decorators import action, authentication_classes, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Event, Availability
from .serializers import EventSerializer, AvailabilitySerializer
from datetime import timedelta

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    authentication_classes = []
    permission_classes = []

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        admin_user = User.objects.get(username='admin')
        event = serializer.save(creator=admin_user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        event = self.get_object()
        if event.passcode and event.passcode != request.data.get('passcode'):
            return Response({'error': 'Invalid passcode'}, status=status.HTTP_403_FORBIDDEN)
        user1 = User.objects.get(username='user1')
        event.participants.add(user1)
        return Response({'status': 'joined successfully'})

    @action(detail=True, methods=['get'])
    def overlap(self, request, pk=None):
        event = self.get_object()
        availabilities = Availability.objects.filter(event=event)
        slots = {}
        for avail in availabilities:
            current = avail.start_time
            while current < avail.end_time:
                slot_key = current.strftime('%Y-%m-%d %H:%M')
                slots[slot_key] = slots.get(slot_key, 0) + 1
                current += timedelta(minutes=30)
        sorted_slots = sorted(slots.items(), key=lambda x: x[1], reverse=True)
        return Response({'overlap': sorted_slots[:5]})

class AvailabilityViewSet(viewsets.ModelViewSet):
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer
    authentication_classes = []
    permission_classes = []

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user1 = User.objects.get(username='user1')
        serializer.save(user=user1)
        return Response(serializer.data, status=status.HTTP_201_CREATED)