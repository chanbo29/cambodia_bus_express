from django.shortcuts import render

# Create your views here.
from .models import UserProfile
from .serializers import UserProfileSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from rest_framework import viewsets
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.http import HttpResponse

from .models import Booking, BusSchedule, WeeklySchedule
from .serializers import BookingSerializer, BusScheduleSerializer, WeeklyScheduleSerializer

from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Promotion, PromoRedemption
from .serializers import PromotionSerializer

from django.contrib.auth.models import User
from rest_framework.permissions import IsAdminUser
from .serializers import AdminUserSerializer

def reset_admin(request):
    from django.contrib.auth.models import User
    from django.http import HttpResponse
    try:
        user = User.objects.get(username="admin")
        user.set_password("Admin12345")
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return HttpResponse("Admin password reset successfully!")
    except User.DoesNotExist:
        return HttpResponse("Admin not found.")
@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def my_profile(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
 
    if request.method == "GET":
        data = {
            "username": user.username,
            "email": user.email,
            "full_name": profile.full_name,
            "phone": profile.phone,
            "date_joined": user.date_joined,
        }
        return Response(data)
 
    # PUT — update email (on User) and full_name/phone (on UserProfile)
    serializer = UserProfileSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
 
    if "email" in serializer.validated_data:
        user.email = serializer.validated_data["email"]
        user.save()
 
    if "full_name" in serializer.validated_data:
        profile.full_name = serializer.validated_data["full_name"]
 
    if "phone" in serializer.validated_data:
        profile.phone = serializer.validated_data["phone"]
 
    profile.save()
 
    return Response({
        "username": user.username,
        "email": user.email,
        "full_name": profile.full_name,
        "phone": profile.phone,
        "date_joined": user.date_joined,
    })
class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            return Booking.objects.all().order_by("-created_at")
        return Booking.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        promo_code = self.request.data.get("promo_code")

        with transaction.atomic():
            if promo_code:
                redeem_promo_or_raise(self.request.user, promo_code)
            serializer.save(user=self.request.user)


class BusScheduleListCreateView(generics.ListCreateAPIView):
    queryset = BusSchedule.objects.all()
    serializer_class = BusScheduleSerializer


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Admins/staff see every booking; regular users see only their own
        if self.request.user.is_staff or self.request.user.is_superuser:
            return Booking.objects.all().order_by("-created_at")
        return Booking.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        promo_code = self.request.data.get("promo_code")

        with transaction.atomic():
            if promo_code:
                redeem_promo_or_raise(self.request.user, promo_code)
            serializer.save(user=self.request.user)

class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)
    
    
@api_view(["GET"])
def routes(request):
    return Response([
        {
            "id": 1,
            "from_city": "Phnom Penh",
            "to_city": "Siem Reap",
            "price": 12
        }
    ])


def create_admin(request):
    if not User.objects.filter(username="admin").exists():
        User.objects.create_superuser(
            username="admin",
            email="admin@gmail.com",
            password="admin12345"
        )
        return HttpResponse("Admin created")

    return HttpResponse("Admin already exists")


@api_view(["POST"])
def login_api(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is None:
        return Response(
            {"error": "Invalid username or password"},
            status=status.HTTP_400_BAD_REQUEST
        )

    refresh = RefreshToken.for_user(user)

    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "username": user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    })


class WeeklyScheduleViewSet(viewsets.ModelViewSet):
    queryset = WeeklySchedule.objects.all()
    serializer_class = WeeklyScheduleSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [AllowAny()]
        return [IsAdminUser()]


class BusScheduleViewSet(viewsets.ModelViewSet):
    queryset = BusSchedule.objects.all().order_by("from_city", "to_city")
    serializer_class = BusScheduleSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [AllowAny()]
        return [IsAdminUser()]


@api_view(["GET"])
def booked_seats(request):
    from_city = request.GET.get("from_city")
    to_city = request.GET.get("to_city")
    date = request.GET.get("date")
    time = request.GET.get("time")

    qs = Booking.objects.all()
    if from_city:
        qs = qs.filter(from_city=from_city)
    if to_city:
        qs = qs.filter(to_city=to_city)
    if date:
        qs = qs.filter(travel_date=date)
    if time:
        qs = qs.filter(departure_time=time)

    seats = []
    for b in qs:
        seats += [s.strip() for s in b.seat_numbers.split(",") if s.strip()]

    return Response({"booked_seats": seats})

@api_view(["POST"])
def check_promo(request):
    """Preview a promo code's discount without redeeming it yet."""
    code = (request.data.get("code") or "").strip().upper()
 
    if not code:
        return Response({"error": "Enter a promo code"}, status=status.HTTP_400_BAD_REQUEST)
 
    try:
        promo = Promotion.objects.get(code=code, active=True)
    except Promotion.DoesNotExist:
        return Response({"error": "Invalid or inactive promo code"}, status=status.HTTP_400_BAD_REQUEST)
 
    if PromoRedemption.objects.filter(user=request.user, promotion=promo).exists():
        return Response(
            {"error": "You have already used this promo code"},
            status=status.HTTP_400_BAD_REQUEST,
        )
 
    if promo.max_uses is not None:
        total_used = PromoRedemption.objects.filter(promotion=promo).count()
        if total_used >= promo.max_uses:
            return Response(
                {"error": "This promo code has reached its usage limit"},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
    return Response({
        "code": promo.code,
        "discount_percent": promo.discount_percent,
        "description": promo.description,
    })
 
 
def redeem_promo_or_raise(user, promo_code):
    """
    Validates the promo and creates the redemption record atomically.
    Call this from inside a booking creation transaction.
    Raises ValidationError if invalid, inactive, already used by this
    user, or the code's total usage limit has been reached.
    """
    try:
        promo = Promotion.objects.select_for_update().get(
            code=promo_code.strip().upper(), active=True
        )
    except Promotion.DoesNotExist:
        raise ValidationError({"promo_code": "Invalid or inactive promo code."})
 
    if PromoRedemption.objects.filter(user=user, promotion=promo).exists():
        raise ValidationError({"promo_code": "You have already used this promo code."})
 
    if promo.max_uses is not None:
        total_used = PromoRedemption.objects.filter(promotion=promo).count()
        if total_used >= promo.max_uses:
            raise ValidationError({"promo_code": "This promo code has reached its usage limit."})
 
    PromoRedemption.objects.create(user=user, promotion=promo)
    return promo
 


class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all().order_by("-id")
    serializer_class = PromotionSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [AllowAny()]
        return [IsAdminUser()]


class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all().order_by("-id")
    serializer_class = PromotionSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [AllowAny()]
        return [IsAdminUser()]
    
 
 
class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["get", "patch", "delete"]



# Add these to booking/views.py

from django.utils import timezone
from .models import Announcement
from rest_framework import serializers, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["id", "title", "message", "created_at", "expires_at", "is_active"]
        read_only_fields = ["id", "created_at"]


class AnnouncementListView(generics.ListAPIView):
    """
    GET /api/announcements/
    Returns all active, non-expired announcements for logged-in users.
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Announcement.objects.filter(
            is_active=True,
            expires_at__gt=timezone.now()   # only non-expired
        )


class AnnouncementCreateView(generics.CreateAPIView):
    """
    POST /api/announcements/create/
    Admin only — create a new announcement.
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        serializer.save()


class AnnouncementDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/announcements/<id>/delete/
    Admin only — remove an announcement early.
    """
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAdminUser]


class AnnouncementAdminListView(generics.ListAPIView):
    """
    GET /api/announcements/all/
    Admin only — see all announcements including expired ones.
    """
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAdminUser]