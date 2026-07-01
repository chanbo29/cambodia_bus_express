from django.db import models
import uuid
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return f"Profile of {self.user.username}"
    
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
    bus_name = models.CharField(max_length=100, blank=True)  # auto-derived if left blank
    bus_type = models.CharField(max_length=50)
    departure_time = models.CharField(max_length=50)
    arrival_time = models.CharField(max_length=50)
    duration = models.CharField(max_length=50, blank=True)  # auto-calculated by frontend
    seats = models.IntegerField(default=35)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to="buses/", blank=True, null=True)

    max_uses = models.PositiveIntegerField(null=True, blank=True)
    days_of_week = models.CharField(max_length=20, blank=True)
    # Comma-separated day numbers, e.g. "1,2,3,4,5" for Mon-Fri.
    # Convention matches JS Date.getDay(): 0=Sunday, 1=Monday, ... 6=Saturday.
    # Empty string means "runs every day" (kept for backward compatibility
    # with routes created before this field existed).

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

    bus_count = models.IntegerField(default=1)  # how many buses depart this day
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
    max_uses = models.PositiveIntegerField(null=True, blank=True)  # ← is this here?
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.code


class PromoRedemption(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE)
    redeemed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # This is what actually enforces "1 user can use only 1 time"
        unique_together = ("user", "promotion")

    def __str__(self):
        return f"{self.user.username} used {self.promotion.code}"