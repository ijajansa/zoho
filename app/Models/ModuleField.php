<?php

namespace App\Models;

use Database\Factories\ModuleFieldFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ModuleField extends Model
{
    /** @use HasFactory<ModuleFieldFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'label',
        'field_type',
        'database_type',
        'placeholder',
        'help_text',
        'default_value',
        'is_required',
        'is_unique',
        'is_readonly',
        'is_hidden',
        'validation_rules',
        'options',
        'settings',
        'sort_order',
        'width',
        'status',
        'is_published',
        'published_at',
        'schema_version',
        'is_archived',
        'published_definition',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'is_unique' => 'boolean',
            'is_readonly' => 'boolean',
            'is_hidden' => 'boolean',
            'validation_rules' => 'array',
            'options' => 'array',
            'settings' => 'array',
            'sort_order' => 'integer',
            'width' => 'integer',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'schema_version' => 'integer',
            'is_archived' => 'boolean',
            'published_definition' => 'array',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function displayedByModules(): HasMany
    {
        return $this->hasMany(Module::class, 'display_field_id');
    }
}
