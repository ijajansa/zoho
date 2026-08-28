<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleListView extends Model
{
    protected $fillable = ['name', 'columns', 'default_sort_field', 'default_sort_direction', 'records_per_page'];

    protected function casts(): array
    {
        return ['columns' => 'array', 'records_per_page' => 'integer'];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}
