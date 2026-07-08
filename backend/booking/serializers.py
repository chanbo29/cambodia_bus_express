from rest_framework import serializers
from django.contrib.auth.models import User

from .models import Booking, BusSchedule, WeeklySchedule, Promotion, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email")
    date_joined = serializers.DateTimeField(source="user.date_joined", read_only=True)
    is_staff = serializers.BooleanField(source="user.is_staff", read_only=True)
    is_superuser = serializers.BooleanField(source="user.is_superuser", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "username", "email", "date_joined",
            "full_name", "phone", "profile_image",
            "is_staff", "is_superuser",
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        if "email" in user_data:
            instance.user.email = user_data["email"]
            instance.user.save()
        return super().update(instance, validated_data)


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = [
            "booking_code",
            "qr_image",
            "is_checked_in",
            "checked_in_at",
            "checked_in_by",
            "created_at",
        ]


class BusScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusSchedule
        fields = "__all__"


class WeeklyScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = WeeklySchedule
        fields = "__all__"


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = "__all__"


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "is_superuser", "date_joined"]
        read_only_fields = ["id", "username", "date_joined"]


class CheckInSerializer(serializers.Serializer):
    # Accepts either the signed QR token (from a camera scan) or the
    # plain booking_code (manual entry) -- both get resolved in the view.
    booking_code = serializers.CharField()