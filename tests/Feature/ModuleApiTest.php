<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Module;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ModuleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_owner_can_create_and_list_modules_with_generated_metadata(): void
    {
        [$user, $workspace, $application] = $this->ownedApplication();
        Sanctum::actingAs($user);

        $response = $this->postJson($this->modulesUrl($workspace, $application), [
            'name' => 'Customer Orders',
            'description' => 'Manage customer orders',
            'icon' => 'shopping-cart',
        ])->assertCreated()
            ->assertJsonPath('data.module.slug', 'customer-orders')
            ->assertJsonPath('data.module.status', 'active')
            ->assertJsonMissingPath('data.module.table_name');

        $module = Module::query()->findOrFail($response->json('data.module.id'));
        $this->assertSame("app_{$application->id}_customer_orders", $module->table_name);
        $this->assertMatchesRegularExpression('/^[a-z0-9_]+$/', $module->table_name);

        $this->getJson($this->modulesUrl($workspace, $application))
            ->assertOk()
            ->assertJsonCount(1, 'data.modules')
            ->assertJsonPath('data.modules.0.name', 'Customer Orders');
    }

    public function test_module_slugs_are_unique_inside_an_application(): void
    {
        [$user, $workspace, $application] = $this->ownedApplication();
        Sanctum::actingAs($user);

        $slugs = collect(range(1, 3))->map(fn () => $this
            ->postJson($this->modulesUrl($workspace, $application), ['name' => 'Products'])
            ->assertCreated()
            ->json('data.module.slug'));

        $this->assertSame(['products', 'products-2', 'products-3'], $slugs->all());
    }

    public function test_the_same_module_slug_can_exist_in_different_applications(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->for($user, 'owner')->create();
        $firstApplication = Application::factory()->for($workspace)->create();
        $secondApplication = Application::factory()->for($workspace)->create();
        Sanctum::actingAs($user);

        $first = $this->postJson($this->modulesUrl($workspace, $firstApplication), ['name' => 'Products']);
        $second = $this->postJson($this->modulesUrl($workspace, $secondApplication), ['name' => 'Products']);

        $first->assertCreated()->assertJsonPath('data.module.slug', 'products');
        $second->assertCreated()->assertJsonPath('data.module.slug', 'products');
        $this->assertDatabaseHas('modules', ['application_id' => $firstApplication->id, 'slug' => 'products']);
        $this->assertDatabaseHas('modules', ['application_id' => $secondApplication->id, 'slug' => 'products']);
    }

    public function test_module_slug_and_table_name_remain_stable_after_rename(): void
    {
        [$user, $workspace, $application] = $this->ownedApplication();
        $module = Module::factory()->for($application)->create([
            'name' => 'Products',
            'slug' => 'products',
            'table_name' => "app_{$application->id}_products",
        ]);
        Sanctum::actingAs($user);

        $this->putJson($this->moduleUrl($workspace, $application, $module), [
            'name' => 'Product Master',
            'description' => 'Renamed module',
            'icon' => 'boxes',
            'status' => 'inactive',
        ])->assertOk()
            ->assertJsonPath('data.module.name', 'Product Master')
            ->assertJsonPath('data.module.slug', 'products');

        $module->refresh();
        $this->assertSame('products', $module->slug);
        $this->assertSame("app_{$application->id}_products", $module->table_name);
    }

    public function test_user_cannot_create_or_view_modules_in_another_users_application(): void
    {
        [$owner, $workspace, $application] = $this->ownedApplication();
        $module = Module::factory()->for($application)->create();
        $attacker = User::factory()->create();
        Sanctum::actingAs($attacker);

        $this->postJson($this->modulesUrl($workspace, $application), ['name' => 'Stolen'])->assertForbidden();
        $this->getJson($this->moduleUrl($workspace, $application, $module))->assertForbidden();
        $this->putJson($this->moduleUrl($workspace, $application, $module), [
            'name' => 'Stolen', 'status' => 'active',
        ])->assertForbidden();
        $this->deleteJson($this->moduleUrl($workspace, $application, $module))->assertForbidden();
    }

    public function test_module_cannot_escape_its_application_through_a_nested_route(): void
    {
        [$user, $workspace, $applicationA] = $this->ownedApplication();
        $applicationB = Application::factory()->for($workspace)->create();
        $moduleB = Module::factory()->for($applicationB)->create();
        Sanctum::actingAs($user);

        $wrongUrl = $this->moduleUrl($workspace, $applicationA, $moduleB);
        $this->getJson($wrongUrl)->assertNotFound();
        $this->putJson($wrongUrl, ['name' => 'Moved', 'status' => 'active'])->assertNotFound();
        $this->deleteJson($wrongUrl)->assertNotFound();
    }

    public function test_owner_can_view_update_and_delete_a_module(): void
    {
        [$user, $workspace, $application] = $this->ownedApplication();
        $module = Module::factory()->for($application)->create();
        Sanctum::actingAs($user);

        $this->getJson($this->moduleUrl($workspace, $application, $module))
            ->assertOk()
            ->assertJsonPath('data.module.id', $module->id);

        $this->putJson($this->moduleUrl($workspace, $application, $module), [
            'name' => 'Updated Module',
            'description' => null,
            'icon' => 'file',
            'status' => 'active',
        ])->assertOk()->assertJsonPath('data.module.name', 'Updated Module');

        $this->deleteJson($this->moduleUrl($workspace, $application, $module))->assertOk();
        $this->assertDatabaseMissing('modules', ['id' => $module->id]);
    }

    public function test_module_ordering_accepts_only_modules_from_the_selected_application(): void
    {
        [$user, $workspace, $application] = $this->ownedApplication();
        $first = Module::factory()->for($application)->create(['sort_order' => 1]);
        $second = Module::factory()->for($application)->create(['sort_order' => 2]);
        $otherApplication = Application::factory()->for($workspace)->create();
        $outsider = Module::factory()->for($otherApplication)->create(['sort_order' => 1]);
        Sanctum::actingAs($user);
        $url = $this->modulesUrl($workspace, $application).'/reorder';

        $this->putJson($url, ['modules' => [
            ['id' => $first->id, 'sort_order' => 2],
            ['id' => $outsider->id, 'sort_order' => 1],
        ]])->assertUnprocessable()->assertJsonValidationErrors('modules');

        $this->putJson($url, ['modules' => [
            ['id' => $first->id, 'sort_order' => 2],
            ['id' => $second->id, 'sort_order' => 1],
        ]])->assertOk()
            ->assertJsonPath('data.modules.0.id', $second->id)
            ->assertJsonPath('data.modules.1.id', $first->id);
    }

    public function test_internal_table_names_are_sanitized_bounded_and_server_controlled(): void
    {
        [$user, $workspace, $application] = $this->ownedApplication();
        Sanctum::actingAs($user);

        $response = $this->postJson($this->modulesUrl($workspace, $application), [
            'name' => 'Products & DROP TABLE users '.str_repeat('X', 55),
            'table_name' => 'users',
            'slug' => 'hacked',
            'is_system' => true,
            'sort_order' => 999,
        ])->assertCreated();

        $module = Module::query()->findOrFail($response->json('data.module.id'));
        $this->assertStringStartsWith("app_{$application->id}_products_drop_table_users_", $module->table_name);
        $this->assertLessThanOrEqual(64, strlen($module->table_name));
        $this->assertFalse($module->is_system);
        $this->assertNotSame(999, $module->sort_order);
        $this->assertNotSame('hacked', $module->slug);
    }

    private function ownedApplication(): array
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->for($user, 'owner')->create();
        $application = Application::factory()->for($workspace)->create();

        return [$user, $workspace, $application];
    }

    private function modulesUrl(Workspace $workspace, Application $application): string
    {
        return "/api/workspaces/{$workspace->id}/applications/{$application->id}/modules";
    }

    private function moduleUrl(Workspace $workspace, Application $application, Module $module): string
    {
        return $this->modulesUrl($workspace, $application)."/{$module->id}";
    }
}
