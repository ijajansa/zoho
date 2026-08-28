<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Module;
use App\Models\ModuleField;
use App\Models\User;
use App\Models\Workspace;
use App\Services\DynamicSchemaService;
use App\Services\ModuleFieldService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DynamicRecordApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_view_update_and_delete_a_generic_record(): void
    {
        [$user, $workspace, $application, $module, $fields] = $this->publishedProducts();
        Sanctum::actingAs($user);

        $created = $this->postJson($this->recordsUrl($workspace, $application, $module), [
            'product_name' => 'Barcode Printer', 'sku' => 'BP001', 'price' => 25000,
            'quantity' => 10, 'field_status' => 'active', 'description' => 'Industrial printer',
        ])->assertCreated()->assertJsonPath('data.record.product_name', 'Barcode Printer')
            ->assertJsonMissingPath('data.record.secret')->json('data.record');

        $this->getJson($this->recordsUrl($workspace, $application, $module).'/'.$created['id'])
            ->assertOk()->assertJsonPath('data.record.sku', 'BP001');
        $this->putJson($this->recordsUrl($workspace, $application, $module).'/'.$created['id'], [
            'product_name' => 'Updated Printer', 'sku' => 'BP001', 'price' => 24000,
            'quantity' => 9, 'field_status' => 'inactive', 'description' => 'Updated',
        ])->assertOk()->assertJsonPath('data.record.product_name', 'Updated Printer');
        $this->deleteJson($this->recordsUrl($workspace, $application, $module).'/'.$created['id'])->assertOk();
        $this->getJson($this->recordsUrl($workspace, $application, $module).'/'.$created['id'])->assertNotFound();
    }

    public function test_dynamic_required_email_number_dropdown_and_unique_validation_work(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule('Customers');
        $this->field($module, ['label' => 'Customer Name', 'is_required' => true]);
        $this->field($module, ['label' => 'Email', 'field_type' => 'email', 'is_required' => true, 'is_unique' => true]);
        $this->field($module, ['label' => 'Age', 'field_type' => 'number']);
        $this->field($module, ['label' => 'Status', 'field_type' => 'select', 'options' => [['label' => 'Active'], ['label' => 'Inactive']]]);
        app(DynamicSchemaService::class)->publish($module);
        Sanctum::actingAs($user);
        $url = $this->recordsUrl($workspace, $application, $module);

        $this->postJson($url, ['email' => 'bad', 'age' => 'many', 'field_status' => 'unknown'])
            ->assertUnprocessable()->assertJsonValidationErrors(['customer_name', 'email', 'age', 'field_status']);
        $this->postJson($url, ['customer_name' => 'A', 'email' => 'a@example.com', 'age' => 30, 'field_status' => 'active'])->assertCreated();
        $this->postJson($url, ['customer_name' => 'B', 'email' => 'a@example.com', 'age' => 31, 'field_status' => 'inactive'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_readonly_hidden_archived_and_password_fields_are_protected(): void
    {
        [$user, $workspace, $application, $module] = $this->ownedModule('Employees');
        $this->field($module, ['label' => 'Employee Name', 'is_required' => true]);
        $readonly = $this->field($module, ['label' => 'Employee Code', 'is_readonly' => true, 'default_value' => 'AUTO']);
        $hidden = $this->field($module, ['label' => 'Internal Note', 'is_hidden' => true]);
        $password = $this->field($module, ['label' => 'Secret', 'field_type' => 'password']);
        $archived = $this->field($module, ['label' => 'Old Value']);
        app(DynamicSchemaService::class)->publish($module);
        app(ModuleFieldService::class)->remove($archived);
        app(DynamicSchemaService::class)->publish($module->fresh());
        Sanctum::actingAs($user);
        $url = $this->recordsUrl($workspace, $application, $module);

        $this->postJson($url, ['employee_name' => 'Jane', 'employee_code' => 'HACK'])->assertUnprocessable()->assertJsonValidationErrors('employee_code');
        $this->postJson($url, ['employee_name' => 'Jane', 'internal_note' => 'HACK'])->assertUnprocessable()->assertJsonValidationErrors('internal_note');
        $this->postJson($url, ['employee_name' => 'Jane', 'old_value' => 'HACK'])->assertUnprocessable()->assertJsonValidationErrors('old_value');
        $record = $this->postJson($url, ['employee_name' => 'Jane', 'secret' => 'super-secret'])->assertCreated()
            ->assertJsonMissingPath('data.record.secret')->json('data.record');
        $stored = DB::table($module->table_name)->where('id', $record['id'])->first();
        $this->assertSame('AUTO', $stored->employee_code);
        $this->assertTrue(Hash::check('super-secret', $stored->secret));
        $this->getJson($url.'/'.$record['id'])->assertJsonMissingPath('data.record.secret');
        $this->putJson($url.'/'.$record['id'], ['employee_name' => 'Jane Two', 'secret' => ''])
            ->assertOk()->assertJsonMissingPath('data.record.secret');
        $this->assertSame($stored->secret, DB::table($module->table_name)->where('id', $record['id'])->value('secret'));
    }

    public function test_list_search_sort_filters_and_pagination_are_metadata_whitelisted(): void
    {
        [$user, $workspace, $application, $module] = $this->publishedProducts();
        Sanctum::actingAs($user);
        $url = $this->recordsUrl($workspace, $application, $module);
        foreach ([
            ['Barcode Printer', 'BP001', 25000, 10, 'active'],
            ['Office Scanner', 'SC001', 10000, 20, 'inactive'],
            ['Label Printer', 'LP001', 15000, 5, 'active'],
        ] as [$name, $sku, $price, $quantity, $status]) {
            $this->postJson($url, ['product_name' => $name, 'sku' => $sku, 'price' => $price, 'quantity' => $quantity, 'field_status' => $status])->assertCreated();
        }

        $searchResponse = $this->getJson($url.'?search=printer&sort=price&direction=asc&per_page=10')
            ->assertOk()->assertJsonPath('data.pagination.total', 2);
        $this->assertEquals(15000, $searchResponse->json('data.records.0.price'));
        $this->getJson($url.'?filters[field_status]=active&per_page=10')
            ->assertOk()->assertJsonPath('data.pagination.total', 2)->assertJsonPath('data.pagination.per_page', 10);
        $this->getJson($url.'?sort=not_metadata')->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->getJson($url.'?filters[field_status]=hacked')->assertUnprocessable()->assertJsonValidationErrors('filters.field_status');
    }

    public function test_runtime_dashboard_returns_real_counts_and_only_active_published_modules(): void
    {
        [$user, $workspace, $application, $products] = $this->publishedProducts();
        DB::table($products->table_name)->insert(['product_name' => 'One', 'sku' => 'ONE', 'created_at' => now(), 'updated_at' => now()]);
        $draft = Module::factory()->for($application)->create(['name' => 'Drafts', 'table_name' => "app_{$application->id}_drafts"]);
        Sanctum::actingAs($user);

        $this->getJson("/api/applications/{$application->id}/runtime")
            ->assertOk()->assertJsonPath('data.application.workspace_id', $workspace->id)
            ->assertJsonPath('data.modules.0.name', 'Products')->assertJsonPath('data.modules.0.record_count', 1)
            ->assertJsonCount(1, 'data.modules');
    }

    public function test_record_api_rejects_draft_and_out_of_sync_modules(): void
    {
        [$user, $workspace, $application, $draft] = $this->ownedModule('Drafts');
        Sanctum::actingAs($user);
        $this->getJson($this->recordsUrl($workspace, $application, $draft))->assertUnprocessable()->assertJsonValidationErrors('module');

        $this->field($draft, ['label' => 'Name']);
        app(DynamicSchemaService::class)->publish($draft);
        $this->field($draft, ['label' => 'New Field']);
        $this->postJson($this->recordsUrl($workspace, $application, $draft), ['name' => 'No'])->assertUnprocessable()->assertJsonValidationErrors('module');
    }

    public function test_runtime_authorization_and_nested_module_scope_are_enforced(): void
    {
        [$owner, $workspace, $application, $module] = $this->publishedProducts();
        $attacker = User::factory()->create();
        Sanctum::actingAs($attacker);
        $this->getJson("/api/applications/{$application->id}/runtime")->assertForbidden();
        $this->getJson($this->recordsUrl($workspace, $application, $module))->assertForbidden();

        Sanctum::actingAs($owner);
        $otherApplication = Application::factory()->for($workspace)->create();
        $this->getJson($this->recordsUrl($workspace, $otherApplication, $module))->assertNotFound();
        $this->postJson($this->recordsUrl($workspace, $application, $module), ['table_name' => 'users'])->assertUnprocessable()->assertJsonValidationErrors('table_name');
    }

    public function test_list_view_configuration_rejects_cross_module_fields_and_controls_columns(): void
    {
        [$user, $workspace, $application, $module, $fields] = $this->publishedProducts();
        $other = Module::factory()->for($application)->create(['table_name' => "app_{$application->id}_other"]);
        $foreign = ModuleField::factory()->for($other)->create();
        Sanctum::actingAs($user);
        $url = "/api/workspaces/{$workspace->id}/applications/{$application->id}/modules/{$module->id}/list-view";
        $this->putJson($url, ['columns' => [['field_id' => $foreign->id, 'visible' => true]], 'default_sort_field' => 'created_at', 'default_sort_direction' => 'desc', 'records_per_page' => 20])
            ->assertUnprocessable()->assertJsonValidationErrors('columns');
        $name = $fields['name'];
        $this->putJson($url, ['columns' => [['field_id' => $name->id, 'visible' => true]], 'default_sort_field' => $name->name, 'default_sort_direction' => 'asc', 'records_per_page' => 10])->assertOk();
        $this->getJson($url)->assertOk()->assertJsonPath('data.list_view.columns.0.field_id', $name->id);
        $this->getJson($this->recordsUrl($workspace, $application, $module))->assertOk()->assertJsonMissingPath('data.records.0.sku');
    }

    private function publishedProducts(): array
    {
        [$user, $workspace, $application, $module] = $this->ownedModule('Products');
        $fields = [
            'name' => $this->field($module, ['label' => 'Product Name', 'is_required' => true]),
            'sku' => $this->field($module, ['label' => 'SKU', 'is_required' => true, 'is_unique' => true]),
            'price' => $this->field($module, ['label' => 'Price', 'field_type' => 'currency']),
            'quantity' => $this->field($module, ['label' => 'Quantity', 'field_type' => 'number']),
            'status' => $this->field($module, ['label' => 'Status', 'field_type' => 'select', 'options' => [['label' => 'Active'], ['label' => 'Inactive']]]),
            'description' => $this->field($module, ['label' => 'Description', 'field_type' => 'textarea']),
        ];
        $module->update(['display_field_id' => $fields['name']->id, 'singular_name' => 'Product']);
        app(DynamicSchemaService::class)->publish($module);

        return [$user, $workspace, $application, $module->fresh(), $fields];
    }

    private function field(Module $module, array $attributes): ModuleField
    {
        return app(ModuleFieldService::class)->create($module, array_merge([
            'label' => 'Field', 'field_type' => 'text', 'default_value' => null, 'is_required' => false,
            'is_unique' => false, 'is_readonly' => false, 'is_hidden' => false,
            'validation_rules' => [], 'options' => [], 'width' => 12, 'status' => 'active',
        ], $attributes));
    }

    private function ownedModule(string $name): array
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->for($user, 'owner')->create();
        $application = Application::factory()->for($workspace)->create(['name' => 'Inventory Manager']);
        $module = Module::factory()->for($application)->create(['name' => $name, 'singular_name' => Str::singular($name), 'table_name' => "app_{$application->id}_".strtolower($name)]);

        return [$user, $workspace, $application, $module];
    }

    private function recordsUrl(Workspace $workspace, Application $application, Module $module): string
    {
        return "/api/workspaces/{$workspace->id}/applications/{$application->id}/modules/{$module->id}/records";
    }
}
