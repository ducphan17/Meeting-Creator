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
        print("Request data:", request.data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get the username from the request
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Look up or create the user by username
        creator, created = User.objects.get_or_create(username=username)

        # Create the Event instance directly
        event = Event.objects.create(
            title=serializer.validated_data['title'],
            passcode=serializer.validated_data.get('passcode', ''),
            creator=creator
        )

        # Serialize the created event for the response
        serializer = self.get_serializer(event)
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
            # Format the time block as a range
            start_str = avail.start_time.strftime('%Y-%m-%d %H:%M')
            end_str = avail.end_time.strftime('%H:%M')
            slot_key = f"{start_str}-{end_str}"
            if slot_key not in slots:
                slots[slot_key] = {'count': 0, 'start': avail.start_time, 'end': avail.end_time}
            slots[slot_key]['count'] += 1
        # Convert slots to list and sort by count
        sorted_slots = sorted(
            [[f"{slot['start'].strftime('%Y-%m-%d %H:%M')}-{slot['end'].strftime('%H:%M')}", slot['count']] 
             for slot in slots.values()],
            key=lambda x: x[1],
            reverse=True
        )
        return Response({'overlap': sorted_slots[:5]})

class AvailabilityViewSet(viewsets.ModelViewSet):
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer
    authentication_classes = []
    permission_classes = []

    def create(self, request):
        print("Request data:", request.data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get the username from the request
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Look up or create the user by username
        user, created = User.objects.get_or_create(username=username)

        # Create the Availability instance directly
        availability = Availability.objects.create(
            event=serializer.validated_data['event'],
            start_time=serializer.validated_data['start_time'],
            end_time=serializer.validated_data['end_time'],
            user=user
        )

        # Serialize the created availability for the response
        response_serializer = AvailabilitySerializer(availability)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)