
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import RegexValidator

class GenderType(models.TextChoices):
    MALE = 'male', 'Male'
    FEMALE = 'female', 'Female'
    OTHER = 'other', 'Other'

class BeltLevel(models.TextChoices):
    WHITE = 'white', 'White'
    YELLOW_STRIPE = 'yellow_stripe', 'Yellow Stripe'
    YELLOW = 'yellow', 'Yellow'
    GREEN_STRIPE = 'green_stripe', 'Green Stripe'
    GREEN = 'green', 'Green'
    BLUE_STRIPE = 'blue_stripe', 'Blue Stripe'
    BLUE = 'blue', 'Blue'
    RED_STRIPE = 'red_stripe', 'Red Stripe'
    RED = 'red', 'Red'
    RED_BLACK = 'red_black', 'Red Black'
    BLACK_1ST_DAN = 'black_1st_dan', 'Black 1st Dan'
    BLACK_2ND_DAN = 'black_2nd_dan', 'Black 2nd Dan'
    BLACK_3RD_DAN = 'black_3rd_dan', 'Black 3rd Dan'
    BLACK_4TH_DAN = 'black_4th_dan', 'Black 4th Dan'
    BLACK_5TH_DAN = 'black_5th_dan', 'Black 5th Dan'

class PaymentStatus(models.TextChoices):
    PAID = 'paid', 'Paid'
    UNPAID = 'unpaid', 'Unpaid'
    PARTIAL = 'partial', 'Partial'

class AttendanceStatus(models.TextChoices):
    PRESENT = 'present', 'Present'
    ABSENT = 'absent', 'Absent'
    LATE = 'late', 'Late'

class TestResult(models.TextChoices):
    PASSED = 'passed', 'Passed'
    FAILED = 'failed', 'Failed'
    PENDING = 'pending', 'Pending'

class AppRole(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    INSTRUCTOR = 'instructor', 'Instructor'
    VIEWER = 'viewer', 'Viewer'

class UserRole(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_role')
    role = models.CharField(max_length=20, choices=AppRole.choices, default=AppRole.VIEWER)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    academy_name = models.CharField(max_length=255, blank=True, null=True)
    plain_password = models.CharField(max_length=255, blank=True, null=True) # Unsafe but requested by user

    def __str__(self):
        return f"{self.user.username}'s Profile"

class Student(models.Model):
    name = models.CharField(max_length=255)
    age = models.IntegerField()
    # default=timezone.now was temporary. Now removing it to enforce explicit date or allow null if needed used during migration
    # but user wants to fix "why this like this".
    # We will remove the default. Since it's already created, we might need a default for existing rows if we don't make it null.
    # But user asked to fix it. We'll make it a required field without default in form, but in DB we can leave it.
    date_of_birth = models.DateField() 
    gender = models.CharField(max_length=10, choices=GenderType.choices)
    guardian_name = models.CharField(max_length=255)
    phone_number = models.CharField(
        max_length=15, 
        validators=[RegexValidator(r'^\d{10}$', message="Phone number must be exactly 10 digits")]
    )
    address = models.TextField(blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    national_id = models.CharField(max_length=50, blank=True, null=True)
    admission_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    admission_date = models.DateField(default=timezone.now)
    current_belt = models.CharField(max_length=20, choices=BeltLevel.choices, default=BeltLevel.WHITE)
    instructor_name = models.CharField(max_length=100, blank=True, null=True)
    tai_certification_number = models.CharField(max_length=50, blank=True, null=True)
    fee_structure = models.CharField(max_length=20, default='2_classes_700')
    profile_photo = models.ImageField(upload_to='student_photos/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class MonthlyFee(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fees')
    month = models.IntegerField()  # 1-12
    year = models.IntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    partial_amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=[
        ('paid', 'Paid'),
        ('unpaid', 'Unpaid'),
        ('partial', 'Partial')
    ], default='unpaid')
    paid_date = models.DateField(null=True, blank=True)
    payment_history = models.JSONField(default=list, blank=True)  # Store payment history [{date: "2025-12-06", amount: 100}, ...]
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'month', 'year')
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.student.name} - {self.month}/{self.year} - {self.status}"

class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=AttendanceStatus.choices)
    remarks = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'date')

    def __str__(self):
        return f"{self.student.name} - {self.date}"

class BeltTest(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='belt_tests')
    test_date = models.DateField()
    tested_for_belt = models.CharField(max_length=20, choices=BeltLevel.choices, default=BeltLevel.WHITE)
    test_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    result = models.CharField(max_length=10, choices=TestResult.choices, default=TestResult.PENDING)
    certification_no = models.CharField(max_length=50, blank=True, null=True)
    examiner_name = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.name} - {self.tested_for_belt} ({self.test_date})"

class StudentEvent(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='events')
    event_name = models.CharField(max_length=255)
    date = models.DateField()
    location = models.CharField(max_length=255, blank=True, null=True)
    participation_type = models.CharField(max_length=20, choices=[('participated', 'Participated'), ('winner', 'Winner')])
    result = models.CharField(max_length=100, blank=True, null=True) # e.g. Gold, 1st Place
    event_photo = models.ImageField(upload_to='event_photos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.name} - {self.event_name}"
