<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ModuleFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'label' => $this->label,
            'field_type' => $this->field_type,
            'placeholder' => $this->placeholder,
            'help_text' => $this->help_text,
            'default_value' => $this->default_value,
            'is_required' => $this->is_required,
            'is_unique' => $this->is_unique,
            'is_readonly' => $this->is_readonly,
            'is_hidden' => $this->is_hidden,
            'validation_rules' => $this->validation_rules ?? (object) [],
            'options' => $this->options ?? [],
            'settings' => $this->settings ?? (object) [],
            'sort_order' => $this->sort_order,
            'width' => $this->width,
            'status' => $this->status,
            'is_published' => $this->is_published,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
