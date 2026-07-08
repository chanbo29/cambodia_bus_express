from django.apps import AppConfig


class BookingsConfig(AppConfig):
       name = "booking"
       def ready(self):
           import bookings.signals  # noqa