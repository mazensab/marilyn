from django.db import migrations
POS_TABLES = [
    "pos_posreturnitem",
    "pos_pospayment",
    "pos_posorderitem",
    "pos_posreturn",
    "pos_posorder",
    "pos_possession",
    "pos_posregister",
]
def purge_pos_runtime_artifacts(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    connection = schema_editor.connection
    quote_name = connection.ops.quote_name
    with connection.cursor() as cursor:
        for table_name in POS_TABLES:
            cursor.execute(
                f"DROP TABLE IF EXISTS {quote_name(table_name)}"
            )
        cursor.execute(
            "DELETE FROM django_migrations WHERE app = %s",
            ["pos"],
        )
    ContentType.objects.filter(
        app_label="pos",
    ).delete()
class Migration(migrations.Migration):
    dependencies = [
        ("companies", "0007_purge_jewelry_activity_data"),
        ("contenttypes", "0002_remove_content_type_name"),
    ]
    operations = [
        migrations.RunPython(
            purge_pos_runtime_artifacts,
            migrations.RunPython.noop,
        ),
    ]