<?php

namespace Tests\Unit\Domain\Moderation;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ModerationQueueIndexCoverageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('topic_reports', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id')->nullable();
            $table->string('status', 20);
            $table->timestamp('created_at')->nullable();
            $table->index(['city_id', 'status', 'created_at'], 'topic_reports_city_status_created_idx');
        });

        Schema::create('comment_reports', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id')->nullable();
            $table->string('status', 20);
            $table->timestamp('created_at')->nullable();
            $table->index(['city_id', 'status', 'created_at'], 'comment_reports_city_status_created_idx');
        });

        Schema::create('content_flags', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id')->nullable();
            $table->string('status', 20);
            $table->timestamp('created_at')->nullable();
            $table->index(['city_id', 'status', 'created_at'], 'content_flags_city_status_created_idx');
        });

        DB::table('topic_reports')->insert([
            'id' => '00000000-0000-0000-0000-0000000000t1',
            'city_id' => '00000000-0000-0000-0000-0000000000c1',
            'status' => 'pending',
            'created_at' => now(),
        ]);

        DB::table('comment_reports')->insert([
            'id' => '00000000-0000-0000-0000-0000000000m1',
            'city_id' => '00000000-0000-0000-0000-0000000000c1',
            'status' => 'pending',
            'created_at' => now(),
        ]);

        DB::table('content_flags')->insert([
            'id' => '00000000-0000-0000-0000-0000000000f1',
            'city_id' => '00000000-0000-0000-0000-0000000000c1',
            'status' => 'open',
            'created_at' => now(),
        ]);
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('content_flags');
        Schema::dropIfExists('comment_reports');
        Schema::dropIfExists('topic_reports');

        parent::tearDown();
    }

    public function test_moderation_queue_filters_use_composite_indexes(): void
    {
        $topicPlan = DB::select(
            'EXPLAIN QUERY PLAN SELECT id FROM topic_reports WHERE city_id = ? AND status = ? ORDER BY created_at DESC',
            ['00000000-0000-0000-0000-0000000000c1', 'pending']
        );

        $commentPlan = DB::select(
            'EXPLAIN QUERY PLAN SELECT id FROM comment_reports WHERE city_id = ? AND status = ? ORDER BY created_at DESC',
            ['00000000-0000-0000-0000-0000000000c1', 'pending']
        );

        $flagPlan = DB::select(
            'EXPLAIN QUERY PLAN SELECT id FROM content_flags WHERE city_id = ? AND status = ? ORDER BY created_at DESC',
            ['00000000-0000-0000-0000-0000000000c1', 'open']
        );

        $this->assertTrue($this->planUsesIndex($topicPlan, 'topic_reports_city_status_created_idx'));
        $this->assertTrue($this->planUsesIndex($commentPlan, 'comment_reports_city_status_created_idx'));
        $this->assertTrue($this->planUsesIndex($flagPlan, 'content_flags_city_status_created_idx'));
    }

    /**
     * @param array<int, object> $plan
     */
    private function planUsesIndex(array $plan, string $indexName): bool
    {
        foreach ($plan as $row) {
            if (!isset($row->detail)) {
                continue;
            }

            if (stripos((string) $row->detail, $indexName) !== false) {
                return true;
            }
        }

        return false;
    }
}

