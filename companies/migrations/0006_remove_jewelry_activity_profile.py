from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('companies', '0005_seed_activity_profiles'),
    ]

    operations = [
        migrations.AlterField(
            model_name='company',
            name='activity_profile',
            field=models.CharField(choices=[('GENERAL', 'General'), ('RETAIL', 'Retail'), ('WHOLESALE', 'Wholesale'), ('PETROL_STATION', 'Petrol Station')], db_index=True, default='GENERAL', max_length=40, verbose_name='Activity profile'),
        ),
    ]
