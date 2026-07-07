from django.urls import path, include
from .views import routes
from .views import BookingListCreateView
from .views import BusScheduleListCreateView
from .views import  BusScheduleViewSet
from .views import  PromotionViewSet
from .views import MyBookingsView
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet
from . import views
from .views import create_admin
from .views import AdminUserViewSet
from .views import (
    AnnouncementListView,
    AnnouncementCreateView,
    AnnouncementDeleteView,
    AnnouncementAdminListView,
)
from .views import StaffViewSet, StaffWorkRecordViewSet


router = DefaultRouter()
router.register("bookings", BookingViewSet, basename="booking")
router.register("schedules", BusScheduleViewSet, basename="schedule")
router.register("promotions", PromotionViewSet, basename="promotion")
router.register("users", AdminUserViewSet, basename="user")
router.register(r"staff",         StaffViewSet,           basename="staff")
router.register(r"staff-records", StaffWorkRecordViewSet, basename="staff-records")
from .views import public_staff_list, public_staff_records, public_staff_checkin, public_staff_checkout, public_verify_pin

urlpatterns = [
    path("reset-admin/", views.reset_admin),
    path("routes/", routes),
    path("bookings/", BookingListCreateView.as_view()),
    path("my-bookings/", MyBookingsView.as_view()),
    path("schedules/", BusScheduleListCreateView.as_view()),
    path("create-admin/", views.create_admin),
    path("booked-seats/", views.booked_seats),
    path("check-promo/", views.check_promo),
    path("profile/", views.my_profile),
    path("", include(router.urls)),  # <-- this line makes router.register(...) actually work
    path("announcements/",         AnnouncementListView.as_view()),
    path("announcements/create/",  AnnouncementCreateView.as_view()),
    path("announcements/all/",     AnnouncementAdminListView.as_view()),
    path("announcements/<int:pk>/delete/", AnnouncementDeleteView.as_view()),
    path("public/staff/",                    public_staff_list),
    path("public/staff-records/",            public_staff_records),
    path("public/staff-checkin/",            public_staff_checkin),
    path("public/staff-checkout/<int:record_id>/", public_staff_checkout),
    path("public/verify-pin/", public_verify_pin),
]