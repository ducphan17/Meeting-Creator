from rest_framework import serializers
from .models import Event, Availability
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class AvailabilitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(write_only=True)

    class Meta:
        model = Availability
        fields = ['id', 'user', 'event', 'start_time', 'end_time', 'username']
        read_only_fields = ['id', 'user']

class EventSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)
    availabilities = AvailabilitySerializer(many=True, read_only=True)
    username = serializers.CharField(write_only=True)
    selected_days = serializers.JSONField(required=False)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    from_time = serializers.TimeField(required=False, allow_null=True)
    to_time = serializers.TimeField(required=False, allow_null=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'creator', 'passcode', 'created_at', 'participants',
            'availabilities', 'username',
            'selected_days', 'start_date', 'end_date', 'from_time', 'to_time',
        ]
        read_only_fields = ['id', 'creator', 'created_at', 'participants', 'availabilities']