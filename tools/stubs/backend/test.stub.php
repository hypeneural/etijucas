<?php

namespace Tests\Feature\{{Feature}};

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class {{Model}}Test extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_{{modelPlural}}(): void
    {
        $response = $this->getJson('/api/v1/{{routeSegment}}');

        $response->assertStatus(200);
    }

    public function test_can_view_{{model}}(): void
    {
        $this->markTestIncomplete('TODO: create a {{model}} and assert response');
    }
}
