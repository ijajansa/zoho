<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->string('singular_name', 100)->nullable()->after('name');
            $table->foreignId('display_field_id')->nullable()->after('schema_published_at')
                ->constrained('module_fields')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('display_field_id');
            $table->dropColumn('singular_name');
        });
    }
};
