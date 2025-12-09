import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import BeltTest
from datetime import date

# Check specific range Dec 1 2025 to Dec 6 2025
start_date = date(2025, 12, 1)
end_date = date(2025, 12, 6)
tests_range = BeltTest.objects.filter(test_date__range=[start_date, end_date])
print(f"Tests between {start_date} and {end_date}: {tests_range.count()}")
for t in tests_range:
    print(f" - {t.student.name}: {t.test_date} ({t.result})")

print("-" * 20)

# Check all 2025
tests_2025 = BeltTest.objects.filter(test_date__year=2025)
print(f"Total Tests in 2025: {tests_2025.count()}")

# Check all statuses
statuses = BeltTest.objects.values_list('result', flat=True).distinct()
print(f"Distinct Statuses in DB: {list(statuses)}")

# Check formatting of date values
# Just print a few dates to see what they look like
print("Sample Dates:")
for t in tests_2025[:5]:
    print(f" - {t.test_date} (Type: {type(t.test_date)})")
