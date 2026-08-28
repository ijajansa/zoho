<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_list_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('name', 100)->default('Default');
            $table->json('columns')->nullable();
            $table->string('default_sort_field', 64)->nullable();
            $table->string('default_sort_direction', 4)->default('desc');
            $table->unsignedSmallInteger('records_per_page')->default(20);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_list_views');
    }
};
