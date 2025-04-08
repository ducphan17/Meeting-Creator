from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from .models import Event, Availability
from .serializers import EventSerializer, AvailabilitySerializer
from datetime import timedelta

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save(creator=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        event = self.get_object()
        if event.passcode and event.passcode != request.data.get('passcode'):
            return Response({'error': 'Invalid passcode'}, status=status.HTTP_403_FORBIDDEN)
        event.participants.add(request.user)
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

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({'status': 'logged in'})
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)