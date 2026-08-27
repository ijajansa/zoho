<?php

namespace Database\Factories;

use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ModuleFieldFactory extends Factory
{
    public function definition(): array
    {
        $label = Str::title(fake()->unique()->words(2, true));
        $suffix = fake()->unique()->numberBetween(1000, 9999);

        return [
            'module_id' => Module::factory(),
            'name' => Str::snake($label).'_'.$suffix,
            'label' => $label,
            'field_type' => 'text',
            'database_type' => 'string',
            'placeholder' => null,
            'help_text' => null,
            'default_value' => null,
            'is_required' => false,
            'is_unique' => false,
            'is_readonly' => false,
            'is_hidden' => false,
            'validation_rules' => null,
            'options' => null,
            'settings' => null,
            'sort_order' => 1,
            'width' => 12,
            'status' => 'active',
        ];
    }
}
