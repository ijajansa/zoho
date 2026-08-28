<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'singular_name' => $this->singular_name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'status' => $this->status,
            'sort_order' => $this->sort_order,
            'fields_count' => $this->whenCounted('fields'),
            'schema_status' => $this->schema_status,
            'schema_version' => $this->schema_version,
            'schema_published_at' => $this->schema_published_at?->toISOString(),
            'display_field_id' => $this->display_field_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
