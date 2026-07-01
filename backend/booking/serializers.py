from rest_framework import serializers
from .models import Booking
from .models import BusSchedule
from .models import WeeklySchedule
from .models import Promotion
from django.contrib.auth.models import User

from .models import UserProfile


class UserProfileSerializer(serializers.Serializer):
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    date_joined = serializers.DateTimeField(read_only=True)
    
class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = "__all__"

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

from django.contrib.auth.models import User
 
 
class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "is_superuser", "date_joined"]
        read_only_fields = ["id", "username", "date_joined"]
 