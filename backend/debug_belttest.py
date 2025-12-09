import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import BeltTest
from datetime import date

start_date = date(2024, 12, 1)
end_date = date(2024, 12, 6)

tests = BeltTest.objects.filter(test_date__range=[start_date, end_date])
print(f"Total BeltTests between {start_date} and {end_date}: {tests.count()}")

for t in tests:
    print(f" - {t.student.name}: {t.test_date} ({t.result})")

print("-" * 20)
# Check if there are ANY tests in Dec 2024
all_dec = BeltTest.objects.filter(test_date__year=2024, test_date__month=12)
print(f"Total BeltTests in Dec 2024: {all_dec.count()}")
for t in all_dec:
    print(f" - {t.student.name}: {t.test_date} ({t.result})")
