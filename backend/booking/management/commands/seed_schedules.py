"""
Seed the BusSchedule table with varied sample data.

Usage (from your backend/ folder, where manage.py lives):
    python manage.py seed_schedules

Re-running it adds more rows on top of existing ones.
To wipe and reseed, pass --clear:
    python manage.py seed_schedules --clear
"""

import random

from django.core.management.base import BaseCommand

from booking.models import BusSchedule


ROUTES = [
    ("Phnom Penh", "Siem Reap"),
    ("Siem Reap", "Phnom Penh"),
    ("Phnom Penh", "Sihanoukville"),
    ("Sihanoukville", "Phnom Penh"),
    ("Battambang", "Phnom Penh"),
    ("Phnom Penh", "Battambang"),
    ("Siem Reap", "Battambang"),
    ("Phnom Penh", "Kampot"),
    ("Kampot", "Phnom Penh"),
]

BUS_TYPES = ["VIP Van", "Night Bus"]

BUS_NAME_PREFIXES = [
    "Golden Dragon", "Mekong Star", "Angkor Express",
    "Royal Cruiser", "Sokha Liner", "Phnom Penh Express",
]

DEPARTURE_SLOTS = [
    ("06:00 AM", "12:00 PM", "6h 00m"),
    ("07:30 AM", "01:30 PM", "6h 00m"),
    ("09:00 AM", "03:00 PM", "6h 00m"),
    ("01:00 PM", "07:00 PM", "6h 00m"),
    ("03:30 PM", "09:30 PM", "6h 00m"),
    ("10:00 PM", "04:30 AM", "6h 30m"),
]

PRICE_BY_TYPE = {
    "VIP Van": 18,
    "Night Bus": 15,
}

SEATS_BY_TYPE = {
    "VIP Van": 10,
    "Night Bus": 30,
}


class Command(BaseCommand):
    help = "Seed the BusSchedule table with varied sample data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--count", type=int, default=15,
            help="How many schedules to create (default: 15)",
        )
        parser.add_argument(
            "--clear", action="store_true",
            help="Delete all existing schedules before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = BusSchedule.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing schedules"))

        count = options["count"]
        created = 0

        for _ in range(count):
            from_city, to_city = random.choice(ROUTES)
            bus_type = random.choice(BUS_TYPES)
            departure, arrival, duration = random.choice(DEPARTURE_SLOTS)
            bus_name = f"{random.choice(BUS_NAME_PREFIXES)} {random.randint(1, 99)}"

            schedule = BusSchedule.objects.create(
                from_city=from_city,
                to_city=to_city,
                bus_name=bus_name,
                bus_type=bus_type,
                departure_time=departure,
                arrival_time=arrival,
                duration=duration,
                seats=SEATS_BY_TYPE[bus_type],
                price=PRICE_BY_TYPE[bus_type],
            )
            created += 1
            self.stdout.write(
                f"  + {schedule.bus_name}: {from_city} -> {to_city} "
                f"({bus_type}, ${schedule.price})"
            )

        self.stdout.write(self.style.SUCCESS(f"Created {created} schedules"))