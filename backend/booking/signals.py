"""
Add to your app's signals.py, and register it once at startup in apps.py:

    class BookingsConfig(AppConfig):
        name = "bookings"
        def ready(self):
            import bookings.signals  # noqa
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Booking


@receiver(post_save, sender=Booking)
def create_qr_on_booking(sender, instance, created, **kwargs):
    if created and not instance.qr_image:
        instance.generate_qr(save=True)