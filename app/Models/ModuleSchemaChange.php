<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleSchemaChange extends Model
{
    protected $fillable = [
        'schema_version',
        'change_type',
        'field_id',
        'payload',
        'status',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'schema_version' => 'integer',
            'payload' => 'array',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(ModuleField::class, 'field_id');
    }
}
