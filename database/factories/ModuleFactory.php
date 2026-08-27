<?php

namespace Database\Factories;

use App\Models\Application;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ModuleFactory extends Factory
{
    public function definition(): array
    {
        $name = Str::title(fake()->unique()->words(2, true));
        $suffix = fake()->unique()->numberBetween(1000, 9999);

        return [
            'application_id' => Application::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.$suffix,
            'table_name' => 'app_'.fake()->numberBetween(1, 999).'_'.Str::snake($name).'_'.$suffix,
            'description' => fake()->sentence(),
            'icon' => fake()->randomElement(['users', 'package', 'shopping-cart', 'database', 'file']),
            'status' => 'active',
            'is_system' => false,
            'sort_order' => 1,
        ];
    }
}
