<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\User;

class ApplicationPolicy
{
    public function view(User $user, Application $application): bool
    {
        return $application->workspace()->where('owner_id', $user->id)->exists();
    }

    public function update(User $user, Application $application): bool
    {
        return $this->view($user, $application);
    }

    public function delete(User $user, Application $application): bool
    {
        return $this->view($user, $application);
    }
}
