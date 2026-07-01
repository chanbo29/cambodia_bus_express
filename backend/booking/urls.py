from django.urls import path, include
from .views import routes
from .views import BookingListCreateView
from .views import BusScheduleListCreateView
from .views import  BusScheduleViewSet
from .views import  PromotionViewSet
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet
from . import views
from .views import create_admin
from .views import AdminUserViewSet



router = DefaultRouter()
router.register("bookings", BookingViewSet, basename="booking")
router.register("schedules", BusScheduleViewSet, basename="schedule")
router.register("promotions", PromotionViewSet, basename="promotion")
router.register("users", AdminUserViewSet, basename="user")

urlpatterns = [
    path("create-admin/", views.create_admin),
    path("routes/", routes),
    path("bookings/", BookingListCreateView.as_view()),
    path("schedules/", BusScheduleListCreateView.as_view()),
    path("create-admin/", views.create_admin),
    path("booked-seats/", views.booked_seats),
    path("check-promo/", views.check_promo),
    path("profile/", views.my_profile),
    path("", include(router.urls)),  # <-- this line makes router.register(...) actually work
]