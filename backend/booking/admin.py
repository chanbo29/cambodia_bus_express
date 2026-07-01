from django.contrib import admin
from .models import (
    Booking,
    BusSchedule,
    WeeklySchedule,
    Promotion,
    PromoRedemption,
)

# If you added the UserProfile model from earlier in the conversation,
# uncomment this import and the registration block below.
# from .models import UserProfile


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "booking_code",
        "passenger_name",
        "phone",
        "from_city",
        "to_city",
        "travel_date",
        "departure_time",
        "vehicle_type",
        "seat_numbers",
        "total_price",
        "checked_in",
        "created_at",
    )
    list_filter = ("vehicle_type", "checked_in", "travel_date")
    search_fields = ("booking_code", "passenger_name", "phone", "from_city", "to_city")
    ordering = ("-created_at",)
    readonly_fields = ("booking_code", "created_at")


@admin.register(BusSchedule)
class BusScheduleAdmin(admin.ModelAdmin):
    list_display = (
        "from_city",
        "to_city",
        "bus_type",
        "bus_name",
        "departure_time",
        "arrival_time",
        "duration",
        "seats",
        "price",
        "days_of_week",
    )
    list_filter = ("bus_type", "from_city", "to_city")
    search_fields = ("from_city", "to_city", "bus_name", "bus_type")


@admin.register(WeeklySchedule)
class WeeklyScheduleAdmin(admin.ModelAdmin):
    list_display = (
        "from_city",
        "to_city",
        "day_of_week",
        "bus_count",
        "vehicle_type",
        "departure_time",
        "price",
    )
    list_filter = ("day_of_week", "vehicle_type")
    search_fields = ("from_city", "to_city")


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ("code", "description", "discount_percent", "active")
    list_filter = ("active",)
    search_fields = ("code", "description")


@admin.register(PromoRedemption)
class PromoRedemptionAdmin(admin.ModelAdmin):
    list_display = ("user", "promotion", "redeemed_at")
    list_filter = ("promotion",)
    search_fields = ("user__username", "promotion__code")
    readonly_fields = ("redeemed_at",)


# Uncomment if you added the UserProfile model:
# @admin.register(UserProfile)
# class UserProfileAdmin(admin.ModelAdmin):
#     list_display = ("user", "full_name", "phone")
#     search_fields = ("user__username", "full_name", "phone")