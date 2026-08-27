<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->string('name', 64);
            $table->string('label', 100);
            $table->string('field_type', 30);
            $table->string('database_type', 30);
            $table->string('placeholder')->nullable();
            $table->text('help_text')->nullable();
            $table->text('default_value')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_unique')->default(false);
            $table->boolean('is_readonly')->default(false);
            $table->boolean('is_hidden')->default(false);
            $table->json('validation_rules')->nullable();
            $table->json('options')->nullable();
            $table->json('settings')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedTinyInteger('width')->default(12);
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->unique(['module_id', 'name']);
            $table->index(['module_id', 'status']);
            $table->index(['module_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_fields');
    }
};
