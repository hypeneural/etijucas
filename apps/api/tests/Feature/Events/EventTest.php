<?php

namespace Tests\Feature\Events;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Events Tests
 * 
 * @see FEATURES.md para mapa completo de endpoints
 */
class EventTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_events(): void
    {
        $response = $this->getJson('/api/v1/events');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'title', 'startDate', 'category']
                ]
            ]);
    }

    public function test_can_get_featured_events(): void
    {
        $response = $this->getJson('/api/v1/events/featured');

        $response->assertStatus(200);
    }

    public function test_can_filter_by_category(): void
    {
        $this->markTestIncomplete('Pendente implementação');
    }

    public function test_can_rsvp_to_event(): void
    {
        $this->markTestIncomplete('Pendente implementação');
    }
}
