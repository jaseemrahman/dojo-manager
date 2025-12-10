from rest_framework import serializers
from .models import Student, MonthlyFee, Attendance, BeltTest, UserRole, StudentEvent, UserProfile
from django.contrib.auth.models import User

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone_number', 'state', 'district', 'profile_photo', 'academy_name']

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source='profile.phone_number', required=False)
    state = serializers.CharField(source='profile.state', required=False)
    district = serializers.CharField(source='profile.district', required=False)
    address = serializers.CharField(source='profile.address', required=False)
    academy_name = serializers.CharField(source='profile.academy_name', required=False)
    # Remove source for profile_photo to handle upload manually/cleanly
    profile_photo = serializers.ImageField(required=False, allow_null=True)
    plain_password = serializers.CharField(source='profile.plain_password', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 
                  'phone_number', 'state', 'district', 'address', 'academy_name', 'profile_photo', 'plain_password']

    def get_role(self, obj):
        if obj.is_superuser:
            return 'admin'
        try:
            return obj.user_role.role
        except UserRole.DoesNotExist:
            return 'viewer'
            
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Manually populate profile_photo from related profile
        try:
            if instance.profile.profile_photo:
                request = self.context.get('request')
                photo_url = instance.profile.profile_photo.url
                if request:
                    photo_url = request.build_absolute_uri(photo_url)
                ret['profile_photo'] = photo_url
            else:
                ret['profile_photo'] = None
        except UserProfile.DoesNotExist:
            ret['profile_photo'] = None
        return ret

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        # Extract profile_photo if present (it won't be in profile dict anymore since we removed source)
        profile_photo = validated_data.pop('profile_photo', None)
        
        instance = super().update(instance, validated_data)

        # Update profile fields
        defaults = profile_data
        if profile_photo is not None:
             defaults['profile_photo'] = profile_photo

        if defaults:
            UserProfile.objects.update_or_create(user=instance, defaults=defaults)
        
        return instance

class StudentSerializer(serializers.ModelSerializer):
    latest_tai_certification = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'
        extra_fields = ['latest_tai_certification']

    def get_latest_tai_certification(self, obj):
        # Return the certification_no from the latest belt test
        # Ordering by test_date descending (recent first)
        latest_test = BeltTest.objects.filter(student=obj).order_by('-test_date').first()
        if latest_test and latest_test.certification_no:
            return latest_test.certification_no
        # Fallback to the manual field if no belt test cert exists
        return obj.tai_certification_number or None

class MonthlyFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    
    class Meta:
        model = MonthlyFee
        fields = ['id', 'student', 'student_name', 'month', 'year', 'amount', 
                  'status', 'payment_method', 'paid_date', 'partial_amount_paid', 'payment_history', 
                  'notes', 'created_at', 'updated_at']

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.name')

    class Meta:
        model = Attendance
        fields = '__all__'

class BeltTestSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.name')

    class Meta:
        model = BeltTest
        fields = '__all__'

class StudentEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentEvent
        fields = '__all__'

class PasswordChangeSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=True, min_length=8)
