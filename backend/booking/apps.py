from django.apps import AppConfig


class BookingsConfig(AppConfig):
       name = "booking"
       def ready(self):
           import booking.signals  # noqa