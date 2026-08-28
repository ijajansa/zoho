<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Module;
use App\Models\ModuleField;
use App\Models\User;
use App\Models\Workspace;
use App\Services\ModuleFieldService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DynamicSchemaApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_initial_publish_creates_a_safe_physical_table_with_columns_indexes_defaults_and_state(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule('Products');
        $this->field($module, ['label' => 'Product Name', 'field_type' => 'text', 'is_required' => true]);
        $sku = $this->field($module, ['label' => 'SKU', 'field_type' => 'text', 'is_unique' => true]);
        $this->field($module, ['label' => 'Price', 'field_type' => 'currency']);
        $this->field($module, ['label' => 'Status', 'field_type' => 'select', 'default_value' => 'active', 'options' => [['label' => 'Active'], ['label' => 'Inactive']]]);
        Sanctum::actingAs($user);

        $this->postJson($this->schemaUrl($workspace, $application, $module).'/publish')
            ->assertOk()
            ->assertJsonPath('data.schema_status', 'published')
            ->assertJsonPath('data.schema_version', 1)
            ->assertJsonPath('data.changes.0.type', 'create_table');

        $this->assertTrue(Schema::hasTable($module->table_name));
        foreach (['id', 'product_name', 'sku', 'price', 'field_status', 'created_at', 'updated_at'] as $column) {
            $this->assertTrue(Schema::hasColumn($module->table_name, $column));
        }
        $this->assertTrue(collect(Schema::getIndexes($module->table_name))->contains(fn (array $index) => ($index['name'] ?? null) === "uq_m{$module->id}_f{$sku->id}" && ($index['unique'] ?? false)));
        DB::table($module->table_name)->insert(['product_name' => 'Example', 'sku' => 'SKU-1']);
        $this->assertSame('active', DB::table($module->table_name)->value('field_status'));
        $this->assertDatabaseHas('modules', ['id' => $module->id, 'schema_status' => 'published', 'schema_version' => 1]);
        $this->assertDatabaseCount('module_schema_changes', 1);
        $this->assertSame(4, $module->fields()->where('is_published', true)->count());
        $this->getJson($this->schemaUrl($workspace, $application, $module))
            ->assertOk()->assertJsonPath('data.physical_table_exists', true)->assertJsonPath('data.pending_changes', 0);
        $this->getJson($this->schemaUrl($workspace, $application, $module).'/history')
            ->assertOk()->assertJsonPath('data.changes.0.change_type', 'create_table');
    }

    public function test_new_field_marks_schema_out_of_sync_and_publish_adds_column_and_increments_version(): void
    {
        [$user, $workspace, $application, $module] = $this->publishedModule();
        $this->field($module, ['label' => 'Description', 'field_type' => 'textarea']);
        $this->assertSame('out_of_sync', $module->refresh()->schema_status);
        Sanctum::actingAs($user);

        $this->postJson($this->schemaUrl($workspace, $application, $module).'/publish')
            ->assertOk()->assertJsonPath('data.schema_version', 2)->assertJsonPath('data.changes.0.type', 'add_column');

        $this->assertTrue(Schema::hasColumn($module->table_name, 'description'));
        $this->assertSame('published', $module->refresh()->schema_status);
    }

    public function test_presentation_only_update_and_reorder_do_not_change_schema_state_or_version(): void
    {
        [$user, $workspace, $application, $module, $field] = $this->publishedModule();
        Sanctum::actingAs($user);

        $this->putJson($this->fieldsUrl($workspace, $application, $module)."/{$field->id}", [
            'label' => 'Item Name', 'placeholder' => 'Shown only in forms', 'width' => 6, 'status' => 'active',
        ])->assertOk();
        $this->putJson($this->fieldsUrl($workspace, $application, $module).'/reorder', [
            'fields' => [['id' => $field->id, 'sort_order' => 9]],
        ])->assertOk();

        $this->assertSame('published', $module->refresh()->schema_status);
        $this->assertSame(1, $module->schema_version);
        $this->assertTrue(Schema::hasColumn($module->table_name, 'product_name'));
    }

    public function test_published_field_deletion_archives_metadata_and_never_drops_the_column(): void
    {
        [$user, $workspace, $application, $module, $field] = $this->publishedModule();
        Sanctum::actingAs($user);

        $this->deleteJson($this->fieldsUrl($workspace, $application, $module)."/{$field->id}")->assertOk();

        $this->assertDatabaseHas('module_fields', ['id' => $field->id, 'is_archived' => true, 'is_published' => true]);
        $this->assertTrue(Schema::hasColumn($module->table_name, 'product_name'));
        $this->assertSame(0, $module->fields()->count());
        $this->postJson($this->schemaUrl($workspace, $application, $module).'/publish')->assertOk()->assertJsonPath('data.schema_version', 1);
        $this->assertTrue(Schema::hasColumn($module->table_name, 'product_name'));
        $this->assertDatabaseHas('module_schema_changes', ['module_id' => $module->id, 'change_type' => 'drop_column', 'status' => 'blocked']);
    }

    public function test_safe_required_default_and_unique_changes_are_synchronized(): void
    {
        [$user, $workspace, $application, $module, $field] = $this->publishedModule();
        Sanctum::actingAs($user);

        $this->putJson($this->fieldsUrl($workspace, $application, $module)."/{$field->id}", [
            'label' => $field->label,
            'default_value' => 'Unknown',
            'is_required' => true,
            'is_unique' => true,
            'width' => 12,
            'status' => 'active',
        ])->assertOk();
        $this->assertSame('out_of_sync', $module->refresh()->schema_status);

        $this->postJson($this->schemaUrl($workspace, $application, $module).'/publish')
            ->assertOk()->assertJsonPath('data.schema_version', 2)->assertJsonPath('data.changes.0.type', 'modify_column');

        $indexName = "uq_m{$module->id}_f{$field->id}";
        $this->assertTrue(collect(Schema::getIndexes($module->table_name))->contains(fn (array $index) => ($index['name'] ?? null) === $indexName && ($index['unique'] ?? false)));
        DB::table($module->table_name)->insert(['created_at' => now(), 'updated_at' => now()]);
        $this->assertSame('Unknown', DB::table($module->table_name)->value('product_name'));
        $this->assertSame(2, $module->refresh()->schema_version);

        $this->putJson($this->fieldsUrl($workspace, $application, $module)."/{$field->id}", [
            'label' => $field->label,
            'default_value' => 'Unknown',
            'is_required' => true,
            'is_unique' => false,
            'width' => 12,
            'status' => 'active',
        ])->assertOk();
        $this->postJson($this->schemaUrl($workspace, $application, $module).'/publish')
            ->assertOk()->assertJsonPath('data.schema_version', 3);
        $this->assertFalse(collect(Schema::getIndexes($module->table_name))->contains(fn (array $index) => ($index['name'] ?? null) === $indexName));
    }

    public function test_unpublished_field_can_be_deleted_without_leaving_archived_metadata(): void
    {
        [$user, $workspace, $application, $module] = $this->publishedModule();
        $field = $this->field($module, ['label' => 'Temporary', 'field_type' => 'text']);
        Sanctum::actingAs($user);

        $this->deleteJson($this->fieldsUrl($workspace, $application, $module)."/{$field->id}")->assertOk();

        $this->assertDatabaseMissing('module_fields', ['id' => $field->id]);
        $this->assertFalse(Schema::hasColumn($module->table_name, 'temporary'));
        $this->assertSame('published', $module->refresh()->schema_status);
    }

    public function test_bulk_save_can_remove_all_fields_and_archives_published_metadata(): void
    {
        [$user, $workspace, $application, $module, $field] = $this->publishedModule();
        Sanctum::actingAs($user);

        $this->putJson("/api/workspaces/{$workspace->id}/applications/{$application->id}/modules/{$module->id}/form", ['fields' => []])
            ->assertOk()->assertJsonCount(0, 'data.fields');

        $this->assertDatabaseHas('module_fields', ['id' => $field->id, 'is_archived' => true]);
        $this->assertTrue(Schema::hasColumn($module->table_name, 'product_name'));
    }

    public function test_required_field_without_default_is_rejected_for_a_populated_table(): void
    {
        [$user, $workspace, $application, $module] = $this->publishedModule();
        DB::table($module->table_name)->insert(['product_name' => 'Existing']);
        $this->field($module, ['label' => 'Quantity', 'field_type' => 'number', 'is_required' => true]);
        Sanctum::actingAs($user);

        $this->postJson($this->schemaUrl($workspace, $application, $module).'/publish')
            ->assertUnprocessable()->assertJsonValidationErrors('schema');

        $this->assertFalse(Schema::hasColumn($module->table_name, 'quantity'));
        $this->assertSame('error', $module->refresh()->schema_status);
        $this->assertSame(1, $module->schema_version);
    }

    public function test_corrupt_field_metadata_is_rejected_before_table_creation(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        ModuleField::factory()->for($module)->create(['field_type' => 'raw_sql', 'database_type' => 'text']);
        Sanctum::actingAs($user);

        $this->postJson($this->schemaUrl($workspace, $application, $module).'/publish')
            ->assertUnprocessable()->assertJsonValidationErrors('schema');

        $this->assertFalse(Schema::hasTable($module->table_name));
        $this->assertSame(0, $module->refresh()->schema_version);
    }

    public function test_schema_routes_enforce_full_ownership_and_module_scoping(): void
    {
        [$owner, $workspace, $application, $module] = $this->ownedModule();
        $attacker = User::factory()->create();
        Sanctum::actingAs($attacker);
        $this->getJson($this->schemaUrl($workspace, $application, $module))->assertForbidden();
        $this->postJson($this->schemaUrl($workspace, $application, $module).'/publish')->assertForbidden();

        Sanctum::actingAs($owner);
        $otherApplication = Application::factory()->for($workspace)->create();
        $this->getJson($this->schemaUrl($workspace, $otherApplication, $module))->assertNotFound();
        $this->assertFalse(Schema::hasTable($module->table_name));
    }

    public function test_concurrent_publish_is_rejected_cleanly(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        $lock = Cache::lock("module-schema:{$module->id}", 30);
        $this->assertTrue($lock->get());
        Sanctum::actingAs($user);

        try {
            $this->postJson($this->schemaUrl($workspace, $application, $module).'/publish')
                ->assertUnprocessable()->assertJsonValidationErrors('schema');
        } finally {
            $lock->release();
        }
    }

    public function test_published_module_application_and_workspace_deletion_are_blocked(): void
    {
        [$user, $workspace, $application, $module] = $this->publishedModule();
        Sanctum::actingAs($user);

        $this->deleteJson("/api/workspaces/{$workspace->id}/applications/{$application->id}/modules/{$module->id}")->assertUnprocessable();
        $this->deleteJson("/api/workspaces/{$workspace->id}/applications/{$application->id}")->assertUnprocessable();
        $this->deleteJson("/api/workspaces/{$workspace->id}")->assertUnprocessable();
        $this->assertTrue(Schema::hasTable($module->table_name));
    }

    private function publishedModule(): array
    {
        [$user, $workspace, $application, $module] = $this->ownedModule('Products');
        $field = $this->field($module, ['label' => 'Product Name', 'field_type' => 'text']);
        Sanctum::actingAs($user);
        $this->postJson($this->schemaUrl($workspace, $application, $module).'/publish')->assertOk();

        return [$user, $workspace, $application, $module, $field];
    }

    private function field(Module $module, array $attributes): ModuleField
    {
        return app(ModuleFieldService::class)->create($module, array_merge([
            'label' => 'Field', 'field_type' => 'text', 'default_value' => null, 'is_required' => false,
            'is_unique' => false, 'validation_rules' => [], 'options' => [], 'width' => 12, 'status' => 'active',
        ], $attributes));
    }

    private function ownedModule(string $name = 'Module'): array
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->for($user, 'owner')->create();
        $application = Application::factory()->for($workspace)->create();
        $module = Module::factory()->for($application)->create([
            'name' => $name,
            'table_name' => "app_{$application->id}_".strtolower($name),
        ]);

        return [$user, $workspace, $application, $module];
    }

    private function schemaUrl(Workspace $workspace, Application $application, Module $module): string
    {
        return "/api/workspaces/{$workspace->id}/applications/{$application->id}/modules/{$module->id}/schema";
    }

    private function fieldsUrl(Workspace $workspace, Application $application, Module $module): string
    {
        return "/api/workspaces/{$workspace->id}/applications/{$application->id}/modules/{$module->id}/fields";
    }
}
