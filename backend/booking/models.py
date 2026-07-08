from django.db import models
import uuid
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone       = models.CharField(max_length=20, blank=True)
    full_name   = models.CharField(max_length=100, blank=True)
    profile_image = models.TextField(blank=True)  # ← ADD THIS LINE (stores base64 or URL)
 
    def __str__(self):
        return self.user.username
    
class Booking(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="bookings",
        null=True,
        blank=True
    )

    booking_code = models.CharField(max_length=20, unique=True, blank=True)

    passenger_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)

    from_city = models.CharField(max_length=100)
    to_city = models.CharField(max_length=100)

    travel_date = models.DateField()
    departure_time = models.CharField(max_length=50)

    seat_numbers = models.CharField(max_length=100)
    vehicle_type = models.CharField(max_length=50, default="Bus")

    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)

    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.booking_code:
            self.booking_code = "CBE-" + str(uuid.uuid4())[:6].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.booking_code


class BusSchedule(models.Model):
    from_city = models.CharField(max_length=100)
    to_city = models.CharField(max_length=100)
    bus_name = models.CharField(max_length=100, blank=True)
    bus_type = models.CharField(max_length=50)
    departure_time = models.CharField(max_length=50)
    arrival_time = models.CharField(max_length=50)
    duration = models.CharField(max_length=50, blank=True)
    seats = models.IntegerField(default=35)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    # Changed from ImageField to URLField — images are stored as
    # external https:// links (Facebook CDN, etc.), not uploaded files.
    image = models.URLField(max_length=500, blank=True, null=True)

    max_uses = models.PositiveIntegerField(null=True, blank=True)
    days_of_week = models.CharField(max_length=20, blank=True)

    def save(self, *args, **kwargs):
        if not self.bus_name:
            self.bus_name = f"{self.bus_type} Bus" if self.bus_type else "Bus"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.from_city} → {self.to_city} - {self.departure_time}"


class WeeklySchedule(models.Model):
    DAYS = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    from_city = models.CharField(max_length=100)
    to_city = models.CharField(max_length=100)
    day_of_week = models.IntegerField(choices=DAYS)

    bus_count = models.IntegerField(default=1)
    vehicle_type = models.CharField(max_length=50, default="Bus")
    departure_time = models.CharField(max_length=50, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        unique_together = ("from_city", "to_city", "day_of_week", "departure_time")
        ordering = ["from_city", "to_city", "day_of_week"]

    def __str__(self):
        day_name = dict(self.DAYS).get(self.day_of_week, "")
        return f"{self.from_city} -> {self.to_city} ({day_name}): {self.bus_count} bus(es)"


class Promotion(models.Model):
    code = models.CharField(max_length=30, unique=True)
    description = models.CharField(max_length=200, blank=True)
    discount_percent = models.PositiveIntegerField(default=10)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.code


class PromoRedemption(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE)
    redeemed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "promotion")

    def __str__(self):
        return f"{self.user.username} used {self.promotion.code}"
    

# Add this to booking/models.py

from django.utils import timezone
from datetime import timedelta

class Announcement(models.Model):
    title   = models.CharField(max_length=200)
    message = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    expires_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        # Auto-set expiry to 30 days from now if not set
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)

    def is_expired(self):
        return self.expires_at and timezone.now() > self.expires_at

    def __str__(self):
        return self.title
    

class Staff(models.Model):
    ROLE_CHOICES = [
        ("Staff",    "Staff"),
        ("Driver",   "Driver"),
        ("Cashier",  "Cashier"),
        ("Manager",  "Manager"),
        ("Security", "Security"),
        ("Cleaner",  "Cleaner"),
    ]
    name    = models.CharField(max_length=100)
    barcode = models.CharField(max_length=50, unique=True)
    role    = models.CharField(max_length=50, choices=ROLE_CHOICES, default="Staff")
    pin     = models.CharField(max_length=4, default="0000")   # ← 4-digit PIN
    created_at = models.DateTimeField(auto_now_add=True)
 
    def __str__(self):
        return f"{self.name} ({self.barcode})"
 
 
class StaffWorkRecord(models.Model):
    staff          = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="records")
    date           = models.DateField()
    check_in_time  = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        unique_together = ("staff", "date")
        ordering        = ["-date", "check_in_time"]
 
    def __str__(self):
        return f"{self.staff.name} — {self.date}"
    
import uuid
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.core import signing
from django.db import models

import qrcode


def generate_booking_code():
    return "CBE-" + uuid.uuid4().hex[:8].upper()


class Booking(models.Model):
    # Payment status -- separate from check-in status below.
    STATUS_PENDING = "pending"
    STATUS_PAID = "paid"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings"
    )

    # Human-typeable code, also used for manual check-in entry.
    booking_code = models.CharField(
        max_length=20, unique=True, default=generate_booking_code, editable=False
    )

    passenger_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30, blank=True, null=True)

    from_city = models.CharField(max_length=100)
    to_city = models.CharField(max_length=100)
    travel_date = models.DateField()
    departure_time = models.CharField(max_length=20)  # e.g. "6:00 AM" -- kept as text to match your existing format
    vehicle_type = models.CharField(max_length=50)  # e.g. "VIP Van", "Night Bus"
    seat_numbers = models.CharField(max_length=100)  # comma-separated, e.g. "A3, A4"

    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Payment status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)

    # Check-in status -- independent of payment status
    is_checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(blank=True, null=True)
    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="checkins_performed",
    )

    qr_image = models.ImageField(upload_to="ticket_qr/", blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.booking_code

    def get_signed_token(self):
        """A tamper-proof token embedded in the QR code (not just the raw code)."""
        return signing.dumps({"booking_code": self.booking_code}, salt="ticket-qr")

    def generate_qr(self, save=True):
        token = self.get_signed_token()
        img = qrcode.make(token)
        buf = BytesIO()
        img.save(buf, format="PNG")
        filename = f"{self.booking_code}.png"
        self.qr_image.save(filename, ContentFile(buf.getvalue()), save=save)