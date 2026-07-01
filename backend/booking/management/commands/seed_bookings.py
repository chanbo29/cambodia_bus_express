"""
Seed the Booking table with varied sample data.

Usage (from your backend/ folder, where manage.py lives):
    python manage.py seed_bookings

Re-running it adds more rows on top of existing ones.
To wipe and reseed, pass --clear:
    python manage.py seed_bookings --clear
"""

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from booking.models import Booking


ROUTES = [
    ("Phnom Penh", "Siem Reap"),
    ("Siem Reap", "Phnom Penh"),
    ("Phnom Penh", "Sihanoukville"),
    ("Sihanoukville", "Phnom Penh"),
    ("Battambang", "Phnom Penh"),
    ("Phnom Penh", "Battambang"),
    ("Siem Reap", "Battambang"),
]

VEHICLES = ["VIP Van", "Night Bus"]

DEPARTURE_TIMES = [
    "06:00 AM", "07:30 AM", "09:00 AM", "01:00 PM", "03:30 PM", "10:00 PM",
]

PASSENGER_NAMES = [
    "Sok Chanbopha", "Heng Dara", "Lim Sreyleak", "Chan Vibol",
    "Kim Sopheak", "Prum Maly", "Ros Pisey", "Tep Sokha",
    "Oun Channary", "Vong Rithy",
]

PRICE_BY_VEHICLE = {
    "VIP Van": 18,
    "Night Bus": 15,
}


class Command(BaseCommand):
    help = "Seed the Booking table with varied sample data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--count", type=int, default=12,
            help="How many bookings to create (default: 12)",
        )
        parser.add_argument(
            "--clear", action="store_true",
            help="Delete all existing bookings before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = Booking.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing bookings"))

        count = options["count"]
        today = timezone.now().date()

        created = 0
        for _ in range(count):
            from_city, to_city = random.choice(ROUTES)
            vehicle = random.choice(VEHICLES)
            passengers = random.randint(1, 3)
            seats = ", ".join(str(random.randint(1, 32)) for _ in range(passengers))
            price_per_seat = PRICE_BY_VEHICLE[vehicle]
            total = round(price_per_seat * passengers, 2)

            # spread travel dates across the past 2 weeks and next 3 weeks
            travel_date = today + timedelta(days=random.randint(-14, 21))

            booking = Booking.objects.create(
                passenger_name=random.choice(PASSENGER_NAMES),
                phone=f"0{random.randint(10, 99)} {random.randint(100,999)} {random.randint(100,999)}",
                from_city=from_city,
                to_city=to_city,
                travel_date=travel_date,
                departure_time=random.choice(DEPARTURE_TIMES),
                seat_numbers=seats,
                vehicle_type=vehicle,
                total_price=total,
            )
            created += 1
            self.stdout.write(f"  + {booking.booking_code}: {from_city} -> {to_city} (${total})")

        self.stdout.write(self.style.SUCCESS(f"Created {created} bookings"))