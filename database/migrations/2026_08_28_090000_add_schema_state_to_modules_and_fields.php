<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->string('schema_status', 20)->default('draft')->after('sort_order');
            $table->unsignedInteger('schema_version')->default(0)->after('schema_status');
            $table->timestamp('schema_published_at')->nullable()->after('schema_version');
            $table->index('schema_status');
        });

        Schema::table('module_fields', function (Blueprint $table) {
            $table->boolean('is_published')->default(false)->after('status');
            $table->timestamp('published_at')->nullable()->after('is_published');
            $table->unsignedInteger('schema_version')->default(0)->after('published_at');
            $table->boolean('is_archived')->default(false)->after('schema_version');
            $table->json('published_definition')->nullable()->after('is_archived');
            $table->index(['module_id', 'is_archived']);
            $table->index(['module_id', 'is_published']);
        });
    }

    public function down(): void
    {
        Schema::table('module_fields', function (Blueprint $table) {
            $table->dropIndex(['module_id', 'is_archived']);
            $table->dropIndex(['module_id', 'is_published']);
            $table->dropColumn(['is_published', 'published_at', 'schema_version', 'is_archived', 'published_definition']);
        });

        Schema::table('modules', function (Blueprint $table) {
            $table->dropIndex(['schema_status']);
            $table->dropColumn(['schema_status', 'schema_version', 'schema_published_at']);
        });
    }
};
