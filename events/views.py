from rest_framework import viewsets, status
from rest_framework.decorators import action, authentication_classes, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Event, Availability
from .serializers import EventSerializer, AvailabilitySerializer
from datetime import date, timedelta

# Default window used when the frontend doesn't specify a date range for an
# event: today through 8 weeks out.
DEFAULT_EVENT_WINDOW_DAYS = 56

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    authentication_classes = []
    permission_classes = []

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get the username from the request
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Look up or create the user by username
        creator, created = User.objects.get_or_create(username=username)

        validated = serializer.validated_data
        start_date = validated.get('start_date') or date.today()
        end_date = validated.get('end_date') or (start_date + timedelta(days=DEFAULT_EVENT_WINDOW_DAYS))

        # Create the Event instance directly
        event = Event.objects.create(
            title=validated['title'],
            passcode=validated.get('passcode', ''),
            creator=creator,
            selected_days=validated.get('selected_days') or [],
            start_date=start_date,
            end_date=end_date,
            from_time=validated.get('from_time'),
            to_time=validated.get('to_time'),
        )
        # The creator should count as a participant of their own event.
        event.participants.add(creator)

        # Serialize the created event for the response
        serializer = self.get_serializer(event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        event = self.get_object()
        if event.passcode and event.passcode != request.data.get('passcode'):
            return Response({'error': 'Invalid passcode'}, status=status.HTTP_403_FORBIDDEN)

        # Register the *actual* user who is joining, not a hardcoded
        # placeholder account.
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

        user, _ = User.objects.get_or_create(username=username)
        event.participants.add(user)

        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def overlap(self, request, pk=None):
        event = self.get_object()
        availabilities = list(Availability.objects.filter(event=event))

        # Group availabilities by calendar date, then sweep across each
        # date's start/end boundaries to find how many people are actually
        # available during each sub-interval. Grouping by exact (start, end)
        # string equality (the old approach) missed every overlap between
        # people whose ranges partially, rather than exactly, matched -
        # e.g. 7-9am and 8-10am never counted as overlapping at all.
        by_date = {}
        for avail in availabilities:
            by_date.setdefault(avail.start_time.date(), []).append(avail)

        segments = []
        for date_key, avails in by_date.items():
            boundaries = sorted({a.start_time for a in avails} | {a.end_time for a in avails})
            for t1, t2 in zip(boundaries, boundaries[1:]):
                if t1 >= t2:
                    continue
                count = sum(1 for a in avails if a.start_time <= t1 and a.end_time >= t2)
                if count > 0:
                    segments.append({'date': date_key, 'start': t1, 'end': t2, 'count': count})

        segments.sort(key=lambda s: (s['date'], s['start']))

        # Merge back-to-back segments on the same date that have the same
        # overlap count so the UI shows one continuous block instead of a
        # pile of tiny slivers.
        merged = []
        for seg in segments:
            if (merged and merged[-1]['date'] == seg['date']
                    and merged[-1]['count'] == seg['count']
                    and merged[-1]['end'] == seg['start']):
                merged[-1]['end'] = seg['end']
            else:
                merged.append(dict(seg))

        # Use an unambiguous delimiter between the date and the time range -
        # the previous "YYYY-MM-DD HH:MM-HH:MM" format was parsed on the
        # frontend with a naive split('-') that broke on the date's own
        # dashes.
        overlap_list = [
            [
                f"{seg['date'].strftime('%Y-%m-%d')}|{seg['start'].strftime('%H:%M')}-{seg['end'].strftime('%H:%M')}",
                seg['count'],
            ]
            for seg in merged
        ]
        return Response({'overlap': overlap_list})

class AvailabilityViewSet(viewsets.ModelViewSet):
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer
    authentication_classes = []
    permission_classes = []

    def create(self, request):
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