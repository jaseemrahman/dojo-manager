from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, 
    MonthlyFeeViewSet, 
    AttendanceViewSet, 
    BeltTestViewSet,
    UserViewSet,
    StudentEventViewSet,
    CustomAuthToken,
    register_user,
    create_superuser
)

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'fees', MonthlyFeeViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'belt-tests', BeltTestViewSet)
router.register(r'users', UserViewSet)
router.register(r'student-events', StudentEventViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomAuthToken.as_view()),
    path('auth/register/', register_user),

    path("create-admin/", create_superuser),
]
