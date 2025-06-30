from rest_framework import serializers
from .models import ScheduledJob

class ScheduledJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledJob
        fields = '__all__'
