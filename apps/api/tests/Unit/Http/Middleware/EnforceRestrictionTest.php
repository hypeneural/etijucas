<?php

namespace Tests\Unit\Http\Middleware;

use App\Domain\Moderation\Enums\RestrictionScope;
use App\Domain\Moderation\Enums\RestrictionType;
use App\Domain\Moderation\Services\RestrictionEnforcementService;
use App\Http\Middleware\EnforceRestriction;
use App\Models\User;
use App\Models\UserRestriction;
use Illuminate\Http\Request;
use Mockery;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class EnforceRestrictionTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    public function test_allows_request_without_authenticated_user(): void
    {
        $service = Mockery::mock(RestrictionEnforcementService::class);
        $service->shouldNotReceive('firstBlockingRestriction');

        $middleware = new EnforceRestriction($service);
        $request = Request::create('/api/v1/forum/topics', 'POST');

        $response = $middleware->handle(
            $request,
            fn() => new Response('ok', 200),
            'forum',
            'mute_forum|shadowban_forum'
        );

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_blocks_request_when_active_restriction_exists(): void
    {
        $user = Mockery::mock(User::class)->makePartial();
        $user->forceFill(['id' => 'user-1']);

        $restriction = new UserRestriction();
        $restriction->forceFill([
            'type' => RestrictionType::MuteForum->value,
            'scope' => RestrictionScope::Forum->value,
            'scope_module_key' => 'forum',
            'scope_city_id' => 'city-1',
            'ends_at' => now()->addHour(),
        ]);

        $service = Mockery::mock(RestrictionEnforcementService::class);
        $service->shouldReceive('firstBlockingRestriction')
            ->once()
            ->andReturn($restriction);

        $middleware = new EnforceRestriction($service);
        $request = Request::create('/api/v1/forum/topics', 'POST');
        $request->setUserResolver(static fn() => $user);

        $response = $middleware->handle(
            $request,
            fn() => new Response('ok', 200),
            'forum',
            'mute_forum|shadowban_forum'
        );

        $this->assertSame(403, $response->getStatusCode());
        $this->assertStringContainsString('RESTRICTION_ACTIVE', $response->getContent());
        $this->assertStringContainsString('mute_forum', $response->getContent());
    }
}
