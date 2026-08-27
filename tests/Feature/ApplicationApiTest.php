<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApplicationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_owner_can_create_and_list_applications_in_their_workspace(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->for($user, 'owner')->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/workspaces/{$workspace->id}/applications", [
            'name' => 'Inventory Management',
            'description' => 'Manage inventory and products',
            'icon' => 'package',
        ])->assertCreated()
            ->assertJsonPath('data.application.name', 'Inventory Management')
            ->assertJsonPath('data.application.slug', 'inventory-management')
            ->assertJsonPath('data.application.icon', 'package')
            ->assertJsonMissingPath('data.application.workspace_id');

        $this->getJson("/api/workspaces/{$workspace->id}/applications")
            ->assertOk()
            ->assertJsonCount(1, 'data.applications')
            ->assertJsonPath('data.pagination.per_page', 12);
    }

    public function test_an_owner_can_view_update_and_delete_an_application(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->for($user, 'owner')->create();
        $application = Application::factory()->for($workspace)->create([
            'name' => 'Inventory',
            'slug' => 'inventory',
        ]);
        Sanctum::actingAs($user);

        $this->getJson("/api/workspaces/{$workspace->id}/applications/{$application->id}")
            ->assertOk()
            ->assertJsonPath('data.application.id', $application->id);

        $this->putJson("/api/workspaces/{$workspace->id}/applications/{$application->id}", [
            'name' => 'Inventory Management',
            'description' => 'Updated description',
            'icon' => 'database',
            'status' => 'inactive',
        ])->assertOk()
            ->assertJsonPath('data.application.name', 'Inventory Management')
            ->assertJsonPath('data.application.slug', 'inventory')
            ->assertJsonPath('data.application.status', 'inactive');

        $this->deleteJson("/api/workspaces/{$workspace->id}/applications/{$application->id}")
            ->assertOk();

        $this->assertDatabaseMissing('applications', ['id' => $application->id]);
    }

    public function test_application_slugs_are_unique_inside_a_workspace(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->for($user, 'owner')->create();
        Sanctum::actingAs($user);

        $slugs = collect(range(1, 3))->map(fn () => $this
            ->postJson("/api/workspaces/{$workspace->id}/applications", ['name' => 'CRM'])
            ->assertCreated()
            ->json('data.application.slug'));

        $this->assertSame(['crm', 'crm-2', 'crm-3'], $slugs->all());
    }

    public function test_the_same_slug_can_exist_in_different_workspaces(): void
    {
        $user = User::factory()->create();
        $firstWorkspace = Workspace::factory()->for($user, 'owner')->create();
        $secondWorkspace = Workspace::factory()->for($user, 'owner')->create();
        Sanctum::actingAs($user);

        $first = $this->postJson("/api/workspaces/{$firstWorkspace->id}/applications", ['name' => 'CRM']);
        $second = $this->postJson("/api/workspaces/{$secondWorkspace->id}/applications", ['name' => 'CRM']);

        $first->assertCreated()->assertJsonPath('data.application.slug', 'crm');
        $second->assertCreated()->assertJsonPath('data.application.slug', 'crm');
    }

    public function test_a_user_cannot_access_or_create_applications_in_another_users_workspace(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $workspace = Workspace::factory()->for($owner, 'owner')->create();
        $application = Application::factory()->for($workspace)->create();
        Sanctum::actingAs($attacker);

        $this->getJson("/api/workspaces/{$workspace->id}/applications")->assertForbidden();
        $this->postJson("/api/workspaces/{$workspace->id}/applications", ['name' => 'Stolen'])->assertForbidden();
        $this->getJson("/api/workspaces/{$workspace->id}/applications/{$application->id}")->assertForbidden();
        $this->putJson("/api/workspaces/{$workspace->id}/applications/{$application->id}", [
            'name' => 'Stolen', 'status' => 'active',
        ])->assertForbidden();
        $this->deleteJson("/api/workspaces/{$workspace->id}/applications/{$application->id}")->assertForbidden();
    }

    public function test_an_application_cannot_escape_its_workspace_through_nested_route_binding(): void
    {
        $user = User::factory()->create();
        $workspaceA = Workspace::factory()->for($user, 'owner')->create();
        $workspaceB = Workspace::factory()->for($user, 'owner')->create();
        $applicationB = Application::factory()->for($workspaceB)->create();
        Sanctum::actingAs($user);

        $this->getJson("/api/workspaces/{$workspaceA->id}/applications/{$applicationB->id}")->assertNotFound();
        $this->putJson("/api/workspaces/{$workspaceA->id}/applications/{$applicationB->id}", [
            'name' => 'Moved', 'status' => 'active',
        ])->assertNotFound();
        $this->deleteJson("/api/workspaces/{$workspaceA->id}/applications/{$applicationB->id}")->assertNotFound();
    }

    public function test_application_input_is_validated_and_workspace_id_is_ignored(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->for($user, 'owner')->create();
        $otherWorkspace = Workspace::factory()->for($user, 'owner')->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/workspaces/{$workspace->id}/applications", [
            'workspace_id' => $otherWorkspace->id,
            'name' => 'Valid App',
            'status' => 'active',
        ])->assertCreated();

        $this->assertDatabaseHas('applications', [
            'workspace_id' => $workspace->id,
            'name' => 'Valid App',
        ]);

        $this->postJson("/api/workspaces/{$workspace->id}/applications", [
            'name' => str_repeat('a', 101),
            'status' => 'archived',
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'status']);
    }

    public function test_deleting_a_workspace_cascades_to_its_applications(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->for($user, 'owner')->create();
        $application = Application::factory()->for($workspace)->create();
        Sanctum::actingAs($user);

        $this->deleteJson("/api/workspaces/{$workspace->id}")->assertOk();

        $this->assertDatabaseMissing('applications', ['id' => $application->id]);
    }
}
