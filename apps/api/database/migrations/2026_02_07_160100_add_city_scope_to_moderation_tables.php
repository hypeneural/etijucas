<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('topic_reports') && !Schema::hasColumn('topic_reports', 'city_id')) {
            Schema::table('topic_reports', function (Blueprint $table): void {
                $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities')->cascadeOnDelete();
                $table->index(['city_id', 'status', 'created_at'], 'topic_reports_city_status_created_idx');
            });
        }

        if (Schema::hasTable('comment_reports') && !Schema::hasColumn('comment_reports', 'city_id')) {
            Schema::table('comment_reports', function (Blueprint $table): void {
                $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities')->cascadeOnDelete();
                $table->index(['city_id', 'status', 'created_at'], 'comment_reports_city_status_created_idx');
            });
        }

        if (Schema::hasTable('content_flags') && !Schema::hasColumn('content_flags', 'city_id')) {
            Schema::table('content_flags', function (Blueprint $table): void {
                $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities')->cascadeOnDelete();
                $table->index(['city_id', 'status', 'created_at'], 'content_flags_city_status_created_idx');
            });
        }

        if (Schema::hasTable('user_restrictions') && !Schema::hasColumn('user_restrictions', 'scope_city_id')) {
            Schema::table('user_restrictions', function (Blueprint $table): void {
                $table->foreignUuid('scope_city_id')->nullable()->after('scope')->constrained('cities')->nullOnDelete();
                $table->index(['scope_city_id', 'type', 'revoked_at'], 'user_restrictions_scope_city_type_idx');
            });
        }

        $this->backfillTopicReportsCityId();
        $this->backfillCommentReportsCityId();
        $this->backfillContentFlagsCityId();
        $this->backfillUserRestrictionsScopeCityId();
    }

    public function down(): void
    {
        if (Schema::hasTable('user_restrictions') && Schema::hasColumn('user_restrictions', 'scope_city_id')) {
            Schema::table('user_restrictions', function (Blueprint $table): void {
                $table->dropIndex('user_restrictions_scope_city_type_idx');
                $table->dropForeign(['scope_city_id']);
                $table->dropColumn('scope_city_id');
            });
        }

        if (Schema::hasTable('content_flags') && Schema::hasColumn('content_flags', 'city_id')) {
            Schema::table('content_flags', function (Blueprint $table): void {
                $table->dropIndex('content_flags_city_status_created_idx');
                $table->dropForeign(['city_id']);
                $table->dropColumn('city_id');
            });
        }

        if (Schema::hasTable('comment_reports') && Schema::hasColumn('comment_reports', 'city_id')) {
            Schema::table('comment_reports', function (Blueprint $table): void {
                $table->dropIndex('comment_reports_city_status_created_idx');
                $table->dropForeign(['city_id']);
                $table->dropColumn('city_id');
            });
        }

        if (Schema::hasTable('topic_reports') && Schema::hasColumn('topic_reports', 'city_id')) {
            Schema::table('topic_reports', function (Blueprint $table): void {
                $table->dropIndex('topic_reports_city_status_created_idx');
                $table->dropForeign(['city_id']);
                $table->dropColumn('city_id');
            });
        }
    }

    private function backfillTopicReportsCityId(): void
    {
        if (!Schema::hasTable('topic_reports') || !Schema::hasColumn('topic_reports', 'city_id')) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            $rows = DB::table('topic_reports as tr')
                ->join('topics as t', 't.id', '=', 'tr.topic_id')
                ->whereNull('tr.city_id')
                ->select(['tr.id', 't.city_id'])
                ->get();

            foreach ($rows as $row) {
                DB::table('topic_reports')
                    ->where('id', $row->id)
                    ->update(['city_id' => $row->city_id]);
            }

            return;
        }

        DB::statement('
            UPDATE topic_reports tr
            JOIN topics t ON t.id = tr.topic_id
            SET tr.city_id = t.city_id
            WHERE tr.city_id IS NULL
        ');
    }

    private function backfillCommentReportsCityId(): void
    {
        if (!Schema::hasTable('comment_reports') || !Schema::hasColumn('comment_reports', 'city_id')) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            $rows = DB::table('comment_reports as cr')
                ->join('comments as c', 'c.id', '=', 'cr.comment_id')
                ->whereNull('cr.city_id')
                ->select(['cr.id', 'c.city_id'])
                ->get();

            foreach ($rows as $row) {
                DB::table('comment_reports')
                    ->where('id', $row->id)
                    ->update(['city_id' => $row->city_id]);
            }

            return;
        }

        DB::statement('
            UPDATE comment_reports cr
            JOIN comments c ON c.id = cr.comment_id
            SET cr.city_id = c.city_id
            WHERE cr.city_id IS NULL
        ');
    }

    private function backfillContentFlagsCityId(): void
    {
        if (!Schema::hasTable('content_flags') || !Schema::hasColumn('content_flags', 'city_id')) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            $flags = DB::table('content_flags')
                ->whereNull('city_id')
                ->select(['id', 'content_type', 'content_id', 'reported_by'])
                ->get();

            foreach ($flags as $flag) {
                $cityId = null;

                if ($flag->content_type === 'topic') {
                    $cityId = DB::table('topics')->where('id', $flag->content_id)->value('city_id');
                } elseif ($flag->content_type === 'comment') {
                    $cityId = DB::table('comments')->where('id', $flag->content_id)->value('city_id');
                } elseif ($flag->content_type === 'report') {
                    $cityId = DB::table('citizen_reports')->where('id', $flag->content_id)->value('city_id');
                } elseif ($flag->content_type === 'user') {
                    $cityId = DB::table('users')->where('id', $flag->content_id)->value('city_id');
                }

                if (!$cityId && $flag->reported_by) {
                    $cityId = DB::table('users')->where('id', $flag->reported_by)->value('city_id');
                }

                if ($cityId) {
                    DB::table('content_flags')
                        ->where('id', $flag->id)
                        ->update(['city_id' => $cityId]);
                }
            }

            return;
        }

        DB::statement("
            UPDATE content_flags cf
            JOIN topics t
              ON cf.content_type = 'topic'
             AND t.id = cf.content_id
            SET cf.city_id = t.city_id
            WHERE cf.city_id IS NULL
        ");

        DB::statement("
            UPDATE content_flags cf
            JOIN comments c
              ON cf.content_type = 'comment'
             AND c.id = cf.content_id
            SET cf.city_id = c.city_id
            WHERE cf.city_id IS NULL
        ");

        DB::statement("
            UPDATE content_flags cf
            JOIN citizen_reports cr
              ON cf.content_type = 'report'
             AND cr.id = cf.content_id
            SET cf.city_id = cr.city_id
            WHERE cf.city_id IS NULL
        ");

        DB::statement("
            UPDATE content_flags cf
            JOIN users u
              ON cf.content_type = 'user'
             AND u.id = cf.content_id
            SET cf.city_id = u.city_id
            WHERE cf.city_id IS NULL
        ");

        DB::statement('
            UPDATE content_flags cf
            JOIN users u ON u.id = cf.reported_by
            SET cf.city_id = u.city_id
            WHERE cf.city_id IS NULL
        ');
    }

    private function backfillUserRestrictionsScopeCityId(): void
    {
        if (!Schema::hasTable('user_restrictions') || !Schema::hasColumn('user_restrictions', 'scope_city_id')) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            $restrictions = DB::table('user_restrictions')
                ->whereNull('scope_city_id')
                ->select(['id', 'user_id', 'scope'])
                ->get();

            foreach ($restrictions as $restriction) {
                $scopeCityId = null;

                if ($restriction->scope !== 'global') {
                    $scopeCityId = DB::table('users')
                        ->where('id', $restriction->user_id)
                        ->value('city_id');
                }

                DB::table('user_restrictions')
                    ->where('id', $restriction->id)
                    ->update(['scope_city_id' => $scopeCityId]);
            }

            return;
        }

        DB::statement("
            UPDATE user_restrictions ur
            JOIN users u ON u.id = ur.user_id
            SET ur.scope_city_id = CASE
                WHEN ur.scope = 'global' THEN NULL
                ELSE u.city_id
            END
            WHERE ur.scope_city_id IS NULL
        ");
    }
};
