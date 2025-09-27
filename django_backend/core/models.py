from django.db import models


class Health(models.Model):
    checked_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=32, default='healthy')

    def __str__(self):
        return f"{self.checked_at.isoformat()} - {self.status}"
