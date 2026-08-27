<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_create_and_list_only_their_workspaces(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        Workspace::factory()->for($other, 'owner')->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/workspaces', [
            'name' => 'TrueLabel Technologies',
            'description' => 'Company operations workspace.',
        ])->assertCreated()
            ->assertJsonPath('data.workspace.slug', 'truelabel-technologies')
            ->assertJsonPath('data.workspace.owner.id', $user->id);

        $this->getJson('/api/workspaces')
            ->assertOk()
            ->assertJsonCount(1, 'data.workspaces')
            ->assertJsonPath('data.workspaces.0.name', 'TrueLabel Technologies');
    }

    public function test_duplicate_workspace_names_receive_unique_slugs(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $first = $this->postJson('/api/workspaces', ['name' => 'Product Team'])->json('data.workspace.slug');
        $second = $this->postJson('/api/workspaces', ['name' => 'Product Team'])->json('data.workspace.slug');
        $third = $this->postJson('/api/workspaces', ['name' => 'Product Team'])->json('data.workspace.slug');

        $this->assertSame(['product-team', 'product-team-2', 'product-team-3'], [$first, $second, $third]);
    }

    public function test_an_owner_can_view_update_and_delete_their_workspace(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->for($user, 'owner')->create();
        Sanctum::actingAs($user);

        $this->getJson("/api/workspaces/{$workspace->id}")
            ->assertOk()
            ->assertJsonPath('data.workspace.id', $workspace->id);

        $this->putJson("/api/workspaces/{$workspace->id}", [
            'name' => 'Updated workspace',
            'description' => 'Updated description',
        ])->assertOk()->assertJsonPath('data.workspace.name', 'Updated workspace');

        $this->deleteJson("/api/workspaces/{$workspace->id}")->assertOk();
        $this->assertDatabaseMissing('workspaces', ['id' => $workspace->id]);
    }

    public function test_a_user_cannot_access_another_users_workspace(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $workspace = Workspace::factory()->for($owner, 'owner')->create();
        Sanctum::actingAs($attacker);

        $this->getJson("/api/workspaces/{$workspace->id}")->assertForbidden();
        $this->putJson("/api/workspaces/{$workspace->id}", ['name' => 'Stolen', 'description' => null])->assertForbidden();
        $this->deleteJson("/api/workspaces/{$workspace->id}")->assertForbidden();

        $this->assertDatabaseHas('workspaces', ['id' => $workspace->id, 'owner_id' => $owner->id]);
    }

    public function test_workspace_routes_require_authentication(): void
    {
        $workspace = Workspace::factory()->create();

        $this->getJson('/api/workspaces')->assertUnauthorized();
        $this->postJson('/api/workspaces', ['name' => 'Unauthorized'])->assertUnauthorized();
        $this->getJson("/api/workspaces/{$workspace->id}")->assertUnauthorized();
    }
}
