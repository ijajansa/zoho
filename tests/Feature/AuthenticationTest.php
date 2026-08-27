<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_register_and_receive_a_sanctum_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Alex Morgan',
            'email' => 'alex@example.com',
            'password' => 'secure-password',
            'password_confirmation' => 'secure-password',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'alex@example.com')
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $user = User::query()->where('email', 'alex@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('secure-password', $user->password));
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_registration_validates_required_and_unique_fields(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $this->postJson('/api/register', [
            'name' => '',
            'email' => 'existing@example.com',
            'password' => 'short',
            'password_confirmation' => 'different',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_a_user_can_login_fetch_their_profile_and_logout(): void
    {
        $user = User::factory()->create(['password' => 'secure-password']);

        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'secure-password',
        ])->assertOk()->assertJsonPath('message', 'Login successful');

        $token = $login->json('data.token');
        $headers = ['Authorization' => 'Bearer '.$token];

        $this->withHeaders($headers)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);

        $this->withHeaders($headers)->postJson('/api/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->app['auth']->forgetGuards();
        $this->withHeaders($headers)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'wrong-password'])
            ->assertUnauthorized()
            ->assertJsonPath('success', false);
    }
}
