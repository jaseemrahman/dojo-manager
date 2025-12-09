from django.contrib import admin
from .models import Student, MonthlyFee, Attendance, BeltTest, UserRole

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'current_belt', 'phone_number', 'state', 'is_active', 'created_at')
    search_fields = ('name', 'phone_number', 'guardian_name')
    list_filter = ('current_belt', 'is_active', 'gender', 'state')

@admin.register(MonthlyFee)
class MonthlyFeeAdmin(admin.ModelAdmin):
    list_display = ('student', 'month', 'year', 'amount', 'status', 'paid_date')
    list_filter = ('status', 'month', 'year')
    search_fields = ('student__name',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'status')
    list_filter = ('status', 'date')
    search_fields = ('student__name',)

@admin.register(BeltTest)
class BeltTestAdmin(admin.ModelAdmin):
    list_display = ('student', 'tested_for_belt', 'result', 'test_date')
    list_filter = ('result', 'tested_for_belt')
    search_fields = ('student__name',)

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')

from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

# Unregister the default User admin
admin.site.unregister(User)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Add is_active and get_plain_password to list_display
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'get_plain_password')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'profile__academy_name', 'profile__phone_number')
    list_editable = ('is_active',) # Allow toggling active status directly from list

    def get_plain_password(self, obj):
        return obj.profile.plain_password if hasattr(obj, 'profile') else None
    get_plain_password.short_description = 'Password (Text)'

