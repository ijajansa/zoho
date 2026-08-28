<?php

namespace App\Models;

use Database\Factories\ModuleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Module extends Model
{
    /** @use HasFactory<ModuleFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'table_name',
        'description',
        'icon',
        'status',
        'is_system',
        'sort_order',
        'schema_status',
        'schema_version',
        'schema_published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'sort_order' => 'integer',
            'schema_version' => 'integer',
            'schema_published_at' => 'datetime',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function fields(): HasMany
    {
        return $this->hasMany(ModuleField::class)->where('is_archived', false)->orderBy('sort_order')->orderBy('id');
    }

    public function schemaFields(): HasMany
    {
        return $this->hasMany(ModuleField::class)->orderBy('sort_order')->orderBy('id');
    }

    public function schemaChanges(): HasMany
    {
        return $this->hasMany(ModuleSchemaChange::class);
    }
}
