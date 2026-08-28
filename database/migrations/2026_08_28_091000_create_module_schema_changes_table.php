<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_schema_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('schema_version');
            $table->string('change_type', 30);
            $table->foreignId('field_id')->nullable()->constrained('module_fields')->nullOnDelete();
            $table->json('payload')->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['module_id', 'schema_version']);
            $table->index(['module_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_schema_changes');
    }
};
