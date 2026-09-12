from datetime import date, timedelta

from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Availability, Event


class EventJoinTests(APITestCase):
    """Regression tests for the join endpoint, which used to add a
    hardcoded 'user1' account as the participant instead of whoever
    actually submitted the join request."""

    def setUp(self):
        self.creator = User.objects.create(username="alice")
        self.event = Event.objects.create(
            title="Team Sync",
            creator=self.creator,
            passcode="secret123",
        )

    def test_join_registers_the_actual_requesting_user(self):
        response = self.client.post(
            f"/events/{self.event.id}/join/",
            {"username": "bob", "passcode": "secret123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        usernames = set(self.event.participants.values_list("username", flat=True))
        self.assertIn("bob", usernames)
        self.assertNotIn("user1", usernames)

    def test_join_rejects_wrong_passcode(self):
        response = self.client.post(
            f"/events/{self.event.id}/join/",
            {"username": "bob", "passcode": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertNotIn("bob", self.event.participants.values_list("username", flat=True))

    def test_join_requires_username(self):
        response = self.client.post(
            f"/events/{self.event.id}/join/",
            {"passcode": "secret123"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class EventCreateTests(APITestCase):
    def test_create_adds_creator_as_participant_and_defaults_window(self):
        response = self.client.post(
            "/events/",
            {"title": "Planning", "passcode": "pw", "username": "carol"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        event = Event.objects.get(id=response.data["id"])
        self.assertIn("carol", event.participants.values_list("username", flat=True))
        self.assertEqual(event.start_date, date.today())
        self.assertEqual(event.end_date, date.today() + timedelta(days=56))


class OverlapTests(APITestCase):
    """Regression tests for overlap(), which used to only group
    availabilities that had an *identical* start and end time, so two
    people with different-but-overlapping ranges never counted as
    overlapping at all."""

    def setUp(self):
        self.creator = User.objects.create(username="alice")
        self.bob = User.objects.create(username="bob")
        self.event = Event.objects.create(title="Team Sync", creator=self.creator)
        self.day = date(2026, 9, 14)

    def test_partially_overlapping_ranges_are_detected(self):
        Availability.objects.create(
            user=self.creator,
            event=self.event,
            start_time=f"{self.day}T07:00:00",
            end_time=f"{self.day}T09:00:00",
        )
        Availability.objects.create(
            user=self.bob,
            event=self.event,
            start_time=f"{self.day}T08:00:00",
            end_time=f"{self.day}T10:00:00",
        )

        response = self.client.get(f"/events/{self.event.id}/overlap/")
        self.assertEqual(response.status_code, 200)
        overlap = dict(response.data["overlap"])

        self.assertEqual(overlap[f"{self.day}|07:00-08:00"], 1)
        self.assertEqual(overlap[f"{self.day}|08:00-09:00"], 2)
        self.assertEqual(overlap[f"{self.day}|09:00-10:00"], 1)

    def test_identical_ranges_still_merge_into_one_slot(self):
        Availability.objects.create(
            user=self.creator,
            event=self.event,
            start_time=f"{self.day}T07:00:00",
            end_time=f"{self.day}T08:00:00",
        )
        Availability.objects.create(
            user=self.bob,
            event=self.event,
            start_time=f"{self.day}T07:00:00",
            end_time=f"{self.day}T08:00:00",
        )

        response = self.client.get(f"/events/{self.event.id}/overlap/")
        overlap = response.data["overlap"]
        self.assertEqual(overlap, [[f"{self.day}|07:00-08:00", 2]])
