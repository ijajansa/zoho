<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Module;
use App\Models\ModuleField;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ModuleFieldApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_a_field_with_safe_generated_metadata(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        Sanctum::actingAs($user);

        $response = $this->postJson($this->fieldsUrl($workspace, $application, $module), [
            'label' => 'Product Name',
            'field_type' => 'text',
            'placeholder' => 'Enter product name',
            'is_required' => true,
            'validation_rules' => ['min_length' => 2, 'max_length' => 100],
            'width' => 6,
        ])->assertCreated()
            ->assertJsonPath('data.field.name', 'product_name')
            ->assertJsonPath('data.field.field_type', 'text')
            ->assertJsonPath('data.field.is_required', true)
            ->assertJsonMissingPath('data.field.database_type');

        $this->assertDatabaseHas('module_fields', [
            'id' => $response->json('data.field.id'),
            'module_id' => $module->id,
            'name' => 'product_name',
            'database_type' => 'string',
            'width' => 6,
        ]);
    }

    public function test_duplicate_labels_receive_unique_internal_names_and_reserved_names_are_prefixed(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        Sanctum::actingAs($user);

        $first = $this->postJson($this->fieldsUrl($workspace, $application, $module), ['label' => 'Product Name', 'field_type' => 'text']);
        $second = $this->postJson($this->fieldsUrl($workspace, $application, $module), ['label' => 'Product Name', 'field_type' => 'text']);
        $reserved = $this->postJson($this->fieldsUrl($workspace, $application, $module), ['label' => 'ID', 'field_type' => 'number']);

        $first->assertJsonPath('data.field.name', 'product_name');
        $second->assertJsonPath('data.field.name', 'product_name_2');
        $reserved->assertJsonPath('data.field.name', 'field_id');
    }

    public function test_field_name_type_and_database_type_are_immutable_and_server_controlled(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        $field = ModuleField::factory()->for($module)->create([
            'name' => 'product_name',
            'label' => 'Product Name',
            'field_type' => 'text',
            'database_type' => 'string',
        ]);
        Sanctum::actingAs($user);

        $this->putJson($this->fieldUrl($workspace, $application, $module, $field), [
            'label' => 'Item Name',
            'field_type' => 'number',
            'database_type' => 'integer',
            'name' => 'hacked',
        ])->assertUnprocessable()->assertJsonValidationErrors(['field_type', 'database_type', 'name']);

        $this->putJson($this->fieldUrl($workspace, $application, $module, $field), [
            'label' => 'Item Name',
            'width' => 12,
            'status' => 'active',
        ])->assertOk()->assertJsonPath('data.field.name', 'product_name');

        $field->refresh();
        $this->assertSame('product_name', $field->name);
        $this->assertSame('text', $field->field_type);
        $this->assertSame('string', $field->database_type);
    }

    public function test_unsupported_types_invalid_widths_and_unsafe_validation_rules_are_rejected(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        Sanctum::actingAs($user);
        $url = $this->fieldsUrl($workspace, $application, $module);

        $this->postJson($url, ['label' => 'Bad', 'field_type' => 'mysql_json'])->assertUnprocessable()->assertJsonValidationErrors('field_type');
        $this->postJson($url, ['label' => 'Bad Width', 'field_type' => 'text', 'width' => 5])->assertUnprocessable()->assertJsonValidationErrors('width');
        $this->postJson($url, ['label' => 'Bad Rule', 'field_type' => 'email', 'validation_rules' => ['regex' => '/.*/']])->assertUnprocessable()->assertJsonValidationErrors('field_type');
        $this->postJson($url, ['label' => 'Injected', 'field_type' => 'text', 'database_type' => 'longText'])->assertUnprocessable()->assertJsonValidationErrors('database_type');
    }

    public function test_dropdown_options_are_normalized_and_persisted(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        Sanctum::actingAs($user);

        $response = $this->postJson($this->fieldsUrl($workspace, $application, $module), [
            'label' => 'Status',
            'field_type' => 'select',
            'options' => [
                ['label' => 'In Progress'],
                ['label' => 'In Progress'],
                ['label' => 'Completed', 'value' => 'done'],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.field.options.0.value', 'in_progress')
            ->assertJsonPath('data.field.options.1.value', 'in_progress_2')
            ->assertJsonPath('data.field.options.2.value', 'done');

        $this->assertSame('in_progress', ModuleField::query()->find($response->json('data.field.id'))->options[0]['value']);
    }

    public function test_user_cannot_create_or_manage_fields_in_another_users_module(): void
    {
        [$owner, $workspace, $application, $module] = $this->ownedModule();
        $attacker = User::factory()->create();
        $field = ModuleField::factory()->for($module)->create();
        Sanctum::actingAs($attacker);

        $this->postJson($this->fieldsUrl($workspace, $application, $module), ['label' => 'Stolen', 'field_type' => 'text'])->assertForbidden();
        $this->getJson($this->fieldUrl($workspace, $application, $module, $field))->assertForbidden();
        $this->putJson($this->fieldUrl($workspace, $application, $module, $field), ['label' => 'Stolen'])->assertForbidden();
        $this->deleteJson($this->fieldUrl($workspace, $application, $module, $field))->assertForbidden();
        $this->assertDatabaseHas('module_fields', ['id' => $field->id, 'module_id' => $module->id]);
    }

    public function test_field_cannot_escape_its_module_through_nested_routes(): void
    {
        [$user, $workspace, $application, $moduleA] = $this->ownedModule();
        $moduleB = Module::factory()->for($application)->create();
        $fieldB = ModuleField::factory()->for($moduleB)->create();
        Sanctum::actingAs($user);
        $wrongUrl = $this->fieldUrl($workspace, $application, $moduleA, $fieldB);

        $this->getJson($wrongUrl)->assertNotFound();
        $this->putJson($wrongUrl, ['label' => 'Moved'])->assertNotFound();
        $this->deleteJson($wrongUrl)->assertNotFound();
    }

    public function test_owner_can_list_update_reorder_and_delete_fields(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        $first = ModuleField::factory()->for($module)->create(['sort_order' => 1]);
        $second = ModuleField::factory()->for($module)->create(['sort_order' => 2]);
        Sanctum::actingAs($user);

        $this->getJson($this->fieldsUrl($workspace, $application, $module))->assertOk()->assertJsonCount(2, 'data.fields');
        $this->putJson($this->fieldsUrl($workspace, $application, $module).'/reorder', ['fields' => [
            ['id' => $first->id, 'sort_order' => 2],
            ['id' => $second->id, 'sort_order' => 1],
        ]])->assertOk()->assertJsonPath('data.fields.0.id', $second->id);
        $this->deleteJson($this->fieldUrl($workspace, $application, $module, $first))->assertOk();
        $this->assertDatabaseMissing('module_fields', ['id' => $first->id]);
    }

    public function test_field_reordering_rejects_cross_module_ids(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        $field = ModuleField::factory()->for($module)->create();
        $otherModule = Module::factory()->for($application)->create();
        $outsider = ModuleField::factory()->for($otherModule)->create();
        Sanctum::actingAs($user);

        $this->putJson($this->fieldsUrl($workspace, $application, $module).'/reorder', ['fields' => [
            ['id' => $field->id, 'sort_order' => 2],
            ['id' => $outsider->id, 'sort_order' => 1],
        ]])->assertUnprocessable()->assertJsonValidationErrors('fields');
    }

    public function test_bulk_save_creates_updates_deletes_and_orders_fields(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        $kept = ModuleField::factory()->for($module)->create(['label' => 'Old Name', 'name' => 'old_name', 'sort_order' => 1]);
        $removed = ModuleField::factory()->for($module)->create(['sort_order' => 2]);
        Sanctum::actingAs($user);

        $response = $this->putJson($this->formUrl($workspace, $application, $module), ['fields' => [
            $this->fieldPayload(['client_id' => 'temp_price', 'label' => 'Price', 'field_type' => 'currency', 'width' => 6, 'sort_order' => 1]),
            $this->fieldPayload(['id' => $kept->id, 'label' => 'Product Name', 'field_type' => $kept->field_type, 'width' => 6, 'sort_order' => 2]),
            $this->fieldPayload(['client_id' => 'temp_status', 'label' => 'Status', 'field_type' => 'select', 'options' => [['label' => 'Active'], ['label' => 'Inactive']], 'sort_order' => 3]),
        ]])->assertOk()->assertJsonCount(3, 'data.fields');

        $this->assertDatabaseMissing('module_fields', ['id' => $removed->id]);
        $this->assertDatabaseHas('module_fields', ['id' => $kept->id, 'label' => 'Product Name', 'name' => 'old_name', 'sort_order' => 2]);
        $this->assertDatabaseHas('module_fields', ['module_id' => $module->id, 'name' => 'price', 'database_type' => 'decimal', 'sort_order' => 1]);
        $this->assertSame(['active', 'inactive'], collect($response->json('data.fields.2.options'))->pluck('value')->all());
    }

    public function test_bulk_save_rejects_cross_module_ids_transactionally(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        $local = ModuleField::factory()->for($module)->create(['label' => 'Original']);
        $otherModule = Module::factory()->for($application)->create();
        $foreign = ModuleField::factory()->for($otherModule)->create();
        Sanctum::actingAs($user);

        $this->putJson($this->formUrl($workspace, $application, $module), ['fields' => [
            $this->fieldPayload(['id' => $local->id, 'label' => 'Should Roll Back', 'field_type' => $local->field_type, 'sort_order' => 1]),
            $this->fieldPayload(['id' => $foreign->id, 'label' => 'Foreign', 'field_type' => $foreign->field_type, 'sort_order' => 2]),
        ]])->assertUnprocessable()->assertJsonValidationErrors('fields');

        $this->assertDatabaseHas('module_fields', ['id' => $local->id, 'label' => 'Original']);
        $this->assertDatabaseHas('module_fields', ['id' => $foreign->id, 'module_id' => $otherModule->id]);
    }

    public function test_module_resource_reports_real_field_count_and_registry_is_available(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule();
        ModuleField::factory()->count(3)->for($module)->create();
        Sanctum::actingAs($user);

        $this->getJson("/api/workspaces/{$workspace->id}/applications/{$application->id}/modules/{$module->id}")
            ->assertOk()->assertJsonPath('data.module.fields_count', 3);
        $this->getJson('/api/field-types')->assertOk()
            ->assertJsonCount(17, 'data.field_types')
            ->assertJsonFragment(['type' => 'currency', 'database_type' => 'decimal']);
    }

    private function ownedModule(): array
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->for($user, 'owner')->create();
        $application = Application::factory()->for($workspace)->create();
        $module = Module::factory()->for($application)->create();

        return [$user, $workspace, $application, $module];
    }

    private function fieldsUrl(Workspace $workspace, Application $application, Module $module): string
    {
        return "/api/workspaces/{$workspace->id}/applications/{$application->id}/modules/{$module->id}/fields";
    }

    private function fieldUrl(Workspace $workspace, Application $application, Module $module, ModuleField $field): string
    {
        return $this->fieldsUrl($workspace, $application, $module)."/{$field->id}";
    }

    private function formUrl(Workspace $workspace, Application $application, Module $module): string
    {
        return "/api/workspaces/{$workspace->id}/applications/{$application->id}/modules/{$module->id}/form";
    }

    private function fieldPayload(array $overrides = []): array
    {
        return array_merge([
            'label' => 'Text Field',
            'field_type' => 'text',
            'placeholder' => null,
            'help_text' => null,
            'default_value' => null,
            'is_required' => false,
            'is_unique' => false,
            'is_readonly' => false,
            'is_hidden' => false,
            'validation_rules' => [],
            'options' => [],
            'settings' => [],
            'sort_order' => 1,
            'width' => 12,
            'status' => 'active',
        ], $overrides);
    }
}
