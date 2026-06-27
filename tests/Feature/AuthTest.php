<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function createUser(array $overrides = []): User
    {
        return User::create(array_merge([
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
        ], $overrides));
    }

    public function test_user_can_login_with_email(): void
    {
        $this->createUser();

        $response = $this->post(route('login.store'), [
            'login' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertRedirect(route('account.dashboard'));
        $this->assertAuthenticated();
    }

    public function test_user_can_login_with_username(): void
    {
        $this->createUser();

        $response = $this->post(route('login.store'), [
            'login' => 'testuser',
            'password' => 'password',
        ]);

        $response->assertRedirect(route('account.dashboard'));
        $this->assertAuthenticated();
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $this->createUser();

        $response = $this->from(route('login'))
            ->post(route('login.store'), [
                'login' => 'testuser',
                'password' => 'wrong-password',
            ]);

        $response->assertRedirect(route('login'));
        $response->assertSessionHasErrors('login');
        $this->assertGuest();
    }

    public function test_authenticated_user_can_change_password(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->put(route('account.password.update'), [
            'current_password' => 'password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertRedirect(route('account.password.edit'));

        $user->refresh();

        $this->assertTrue(Hash::check('new-password-123', $user->password));
    }

    public function test_change_password_requires_current_password(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)
            ->from(route('account.password.edit'))
            ->put(route('account.password.update'), [
                'current_password' => 'wrong-password',
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ]);

        $response->assertRedirect(route('account.password.edit'));
        $response->assertSessionHasErrors('current_password');
    }
}
