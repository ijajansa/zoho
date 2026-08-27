<?php

namespace App\Policies;

use App\Models\Module;
use App\Models\User;

class ModulePolicy
{
    public function view(User $user, Module $module): bool
    {
        return $module->application()
            ->whereHas('workspace', fn ($query) => $query->where('owner_id', $user->id))
            ->exists();
    }

    public function update(User $user, Module $module): bool
    {
        return $this->view($user, $module);
    }

    public function delete(User $user, Module $module): bool
    {
        return $this->view($user, $module);
    }
}
