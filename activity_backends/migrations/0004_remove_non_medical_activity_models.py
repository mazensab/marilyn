from django.db import migrations
REMOVED_CONTENT_TYPE_MODELS = (
    "restaurantmenucategory",
    "restaurantmenuitem",
    "restauranttable",
    "restaurantkitchenorder",
    "restaurantkitchenorderitem",
    "project",
    "projectworkorder",
    "projectcostline",
)
def purge_non_medical_activity_content_types(
    apps,
    schema_editor,
):
    ContentType = apps.get_model(
        "contenttypes",
        "ContentType",
    )
    ContentType.objects.using(
        schema_editor.connection.alias
    ).filter(
        app_label="activity_backends",
        model__in=REMOVED_CONTENT_TYPE_MODELS,
    ).delete()
class Migration(migrations.Migration):
    dependencies = [
        (
            "activity_backends",
            "0003_link_appointments_to_medical_patients",
        ),
        (
            "contenttypes",
            "0002_remove_content_type_name",
        ),
    ]
    operations = [
        migrations.DeleteModel(
            name="RestaurantKitchenOrderItem",
        ),
        migrations.DeleteModel(
            name="RestaurantKitchenOrder",
        ),
        migrations.DeleteModel(
            name="RestaurantMenuItem",
        ),
        migrations.DeleteModel(
            name="RestaurantMenuCategory",
        ),
        migrations.DeleteModel(
            name="RestaurantTable",
        ),
        migrations.DeleteModel(
            name="ProjectCostLine",
        ),
        migrations.DeleteModel(
            name="ProjectWorkOrder",
        ),
        migrations.DeleteModel(
            name="Project",
        ),
        migrations.RunPython(
            purge_non_medical_activity_content_types,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
