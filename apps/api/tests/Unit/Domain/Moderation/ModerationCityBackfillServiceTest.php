<?php

namespace Tests\Unit\Domain\Moderation;

use App\Domain\Moderation\Services\ModerationCityBackfillService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ModerationCityBackfillServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('topics', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id')->nullable();
        });

        Schema::create('comments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id')->nullable();
        });

        Schema::create('citizen_reports', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id')->nullable();
        });

        Schema::create('users', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id')->nullable();
        });

        Schema::create('topic_reports', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('topic_id');
            $table->uuid('city_id')->nullable();
        });

        Schema::create('comment_reports', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('comment_id');
            $table->uuid('city_id')->nullable();
        });

        Schema::create('content_flags', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('content_type', 20);
            $table->uuid('content_id')->nullable();
            $table->uuid('reported_by')->nullable();
            $table->uuid('city_id')->nullable();
        });

        Schema::create('user_restrictions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('scope', 20)->default('global');
            $table->uuid('scope_city_id')->nullable();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('user_restrictions');
        Schema::dropIfExists('content_flags');
        Schema::dropIfExists('comment_reports');
        Schema::dropIfExists('topic_reports');
        Schema::dropIfExists('users');
        Schema::dropIfExists('citizen_reports');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('topics');

        parent::tearDown();
    }

    public function test_backfill_updates_city_scopes_without_losing_rows(): void
    {
        DB::table('topics')->insert([
            'id' => '00000000-0000-0000-0000-0000000000t1',
            'city_id' => '00000000-0000-0000-0000-0000000000c1',
        ]);

        DB::table('comments')->insert([
            'id' => '00000000-0000-0000-0000-0000000000m1',
            'city_id' => '00000000-0000-0000-0000-0000000000c1',
        ]);

        DB::table('citizen_reports')->insert([
            'id' => '00000000-0000-0000-0000-0000000000r1',
            'city_id' => '00000000-0000-0000-0000-0000000000c2',
        ]);

        DB::table('users')->insert([
            [
                'id' => '00000000-0000-0000-0000-0000000000u1',
                'city_id' => '00000000-0000-0000-0000-0000000000c1',
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000u2',
                'city_id' => '00000000-0000-0000-0000-0000000000c2',
            ],
        ]);

        DB::table('topic_reports')->insert([
            'id' => '00000000-0000-0000-0000-0000000000tr',
            'topic_id' => '00000000-0000-0000-0000-0000000000t1',
            'city_id' => null,
        ]);

        DB::table('comment_reports')->insert([
            'id' => '00000000-0000-0000-0000-0000000000cr',
            'comment_id' => '00000000-0000-0000-0000-0000000000m1',
            'city_id' => null,
        ]);

        DB::table('content_flags')->insert([
            [
                'id' => '00000000-0000-0000-0000-0000000000f1',
                'content_type' => 'topic',
                'content_id' => '00000000-0000-0000-0000-0000000000t1',
                'reported_by' => '00000000-0000-0000-0000-0000000000u1',
                'city_id' => null,
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000f2',
                'content_type' => 'comment',
                'content_id' => '00000000-0000-0000-0000-0000000000m1',
                'reported_by' => '00000000-0000-0000-0000-0000000000u1',
                'city_id' => null,
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000f3',
                'content_type' => 'report',
                'content_id' => '00000000-0000-0000-0000-0000000000r1',
                'reported_by' => '00000000-0000-0000-0000-0000000000u2',
                'city_id' => null,
            ],
        ]);

        DB::table('user_restrictions')->insert([
            [
                'id' => '00000000-0000-0000-0000-0000000000ur',
                'user_id' => '00000000-0000-0000-0000-0000000000u2',
                'scope' => 'forum',
                'scope_city_id' => null,
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000ug',
                'user_id' => '00000000-0000-0000-0000-0000000000u1',
                'scope' => 'global',
                'scope_city_id' => null,
            ],
        ]);

        $service = new ModerationCityBackfillService();
        $result = $service->run();

        $this->assertSame(1, $result['topic_reports']['before_total']);
        $this->assertSame(1, $result['topic_reports']['after_total']);
        $this->assertSame(0, $result['topic_reports']['after_null']);

        $this->assertSame(1, $result['comment_reports']['before_total']);
        $this->assertSame(1, $result['comment_reports']['after_total']);
        $this->assertSame(0, $result['comment_reports']['after_null']);

        $this->assertSame(3, $result['content_flags']['before_total']);
        $this->assertSame(3, $result['content_flags']['after_total']);
        $this->assertSame(0, $result['content_flags']['after_null']);

        $this->assertSame('00000000-0000-0000-0000-0000000000c1', DB::table('topic_reports')->value('city_id'));
        $this->assertSame('00000000-0000-0000-0000-0000000000c1', DB::table('comment_reports')->value('city_id'));
        $this->assertSame(0, DB::table('content_flags')->whereNull('city_id')->count());
        $this->assertSame(1, DB::table('user_restrictions')->whereNull('scope_city_id')->count());
    }
}

