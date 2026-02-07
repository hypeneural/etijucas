<?php

declare(strict_types=1);

namespace App\Domain\Moderation\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ModerationCityBackfillService
{
    /**
     * @return array<string, array<string, int>>
     */
    public function run(): array
    {
        $results = [];

        $results['topic_reports'] = $this->backfillTopicReports();
        $results['comment_reports'] = $this->backfillCommentReports();
        $results['content_flags'] = $this->backfillContentFlags();
        $results['user_restrictions'] = $this->backfillUserRestrictionsScopeCity();

        return $results;
    }

    /**
     * @return array<string, int>
     */
    private function backfillTopicReports(): array
    {
        if (!Schema::hasTable('topic_reports') || !Schema::hasColumn('topic_reports', 'city_id')) {
            return $this->emptyResult();
        }

        $beforeTotal = DB::table('topic_reports')->count();
        $beforeNull = DB::table('topic_reports')->whereNull('city_id')->count();

        DB::statement('
            UPDATE topic_reports
            SET city_id = (
                SELECT topics.city_id
                FROM topics
                WHERE topics.id = topic_reports.topic_id
            )
            WHERE city_id IS NULL
        ');

        $afterTotal = DB::table('topic_reports')->count();
        $afterNull = DB::table('topic_reports')->whereNull('city_id')->count();

        return $this->result($beforeTotal, $beforeNull, $afterTotal, $afterNull);
    }

    /**
     * @return array<string, int>
     */
    private function backfillCommentReports(): array
    {
        if (!Schema::hasTable('comment_reports') || !Schema::hasColumn('comment_reports', 'city_id')) {
            return $this->emptyResult();
        }

        $beforeTotal = DB::table('comment_reports')->count();
        $beforeNull = DB::table('comment_reports')->whereNull('city_id')->count();

        DB::statement('
            UPDATE comment_reports
            SET city_id = (
                SELECT comments.city_id
                FROM comments
                WHERE comments.id = comment_reports.comment_id
            )
            WHERE city_id IS NULL
        ');

        $afterTotal = DB::table('comment_reports')->count();
        $afterNull = DB::table('comment_reports')->whereNull('city_id')->count();

        return $this->result($beforeTotal, $beforeNull, $afterTotal, $afterNull);
    }

    /**
     * @return array<string, int>
     */
    private function backfillContentFlags(): array
    {
        if (!Schema::hasTable('content_flags') || !Schema::hasColumn('content_flags', 'city_id')) {
            return $this->emptyResult();
        }

        $beforeTotal = DB::table('content_flags')->count();
        $beforeNull = DB::table('content_flags')->whereNull('city_id')->count();

        DB::statement("
            UPDATE content_flags
            SET city_id = (
                SELECT topics.city_id
                FROM topics
                WHERE topics.id = content_flags.content_id
            )
            WHERE city_id IS NULL
              AND content_type = 'topic'
        ");

        DB::statement("
            UPDATE content_flags
            SET city_id = (
                SELECT comments.city_id
                FROM comments
                WHERE comments.id = content_flags.content_id
            )
            WHERE city_id IS NULL
              AND content_type = 'comment'
        ");

        DB::statement("
            UPDATE content_flags
            SET city_id = (
                SELECT citizen_reports.city_id
                FROM citizen_reports
                WHERE citizen_reports.id = content_flags.content_id
            )
            WHERE city_id IS NULL
              AND content_type = 'report'
        ");

        DB::statement("
            UPDATE content_flags
            SET city_id = (
                SELECT users.city_id
                FROM users
                WHERE users.id = content_flags.content_id
            )
            WHERE city_id IS NULL
              AND content_type = 'user'
        ");

        DB::statement('
            UPDATE content_flags
            SET city_id = (
                SELECT users.city_id
                FROM users
                WHERE users.id = content_flags.reported_by
            )
            WHERE city_id IS NULL
        ');

        $afterTotal = DB::table('content_flags')->count();
        $afterNull = DB::table('content_flags')->whereNull('city_id')->count();

        return $this->result($beforeTotal, $beforeNull, $afterTotal, $afterNull);
    }

    /**
     * @return array<string, int>
     */
    private function backfillUserRestrictionsScopeCity(): array
    {
        if (!Schema::hasTable('user_restrictions') || !Schema::hasColumn('user_restrictions', 'scope_city_id')) {
            return $this->emptyResult();
        }

        $beforeTotal = DB::table('user_restrictions')->count();
        $beforeNull = DB::table('user_restrictions')->whereNull('scope_city_id')->count();

        DB::statement("
            UPDATE user_restrictions
            SET scope_city_id = CASE
                WHEN scope = 'global' THEN NULL
                ELSE (
                    SELECT users.city_id
                    FROM users
                    WHERE users.id = user_restrictions.user_id
                )
            END
            WHERE scope_city_id IS NULL
        ");

        $afterTotal = DB::table('user_restrictions')->count();
        $afterNull = DB::table('user_restrictions')->whereNull('scope_city_id')->count();

        return $this->result($beforeTotal, $beforeNull, $afterTotal, $afterNull);
    }

    /**
     * @return array<string, int>
     */
    private function result(int $beforeTotal, int $beforeNull, int $afterTotal, int $afterNull): array
    {
        return [
            'before_total' => $beforeTotal,
            'before_null' => $beforeNull,
            'after_total' => $afterTotal,
            'after_null' => $afterNull,
            'updated' => max(0, $beforeNull - $afterNull),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function emptyResult(): array
    {
        return [
            'before_total' => 0,
            'before_null' => 0,
            'after_total' => 0,
            'after_null' => 0,
            'updated' => 0,
        ];
    }
}

