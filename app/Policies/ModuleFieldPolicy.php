<?php

namespace App\Policies;

use App\Models\ModuleField;
use App\Models\User;

class ModuleFieldPolicy
{
    public function view(User $user, ModuleField $field): bool
    {
        return $field->module()->whereHas('application.workspace', fn ($query) => $query->where('owner_id', $user->id))->exists();
    }

    public function update(User $user, ModuleField $field): bool
    {
        return $this->view($user, $field);
    }

    public function delete(User $user, ModuleField $field): bool
    {
        return $this->view($user, $field);
    }
}
