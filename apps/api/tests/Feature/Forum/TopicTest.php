<?php

namespace Tests\Feature\Forum;

use Tests\TestCase;
use App\Models\User;
use App\Models\Topic;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Forum Topic Tests
 * 
 * Testes básicos do módulo Forum.
 * @see FEATURES.md para mapa completo de endpoints
 */
class TopicTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Can list topics (public)
     */
    public function test_can_list_topics(): void
    {
        // TODO: Seed topics

        $response = $this->getJson('/api/v1/forum/topics');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'title', 'slug', 'category', 'author']
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total']
            ]);
    }

    /**
     * Test: Can view single topic (public)
     */
    public function test_can_view_topic(): void
    {
        // TODO: Create topic

        $this->markTestIncomplete('Pendente implementação');
    }

    /**
     * Test: Authenticated user can create topic
     */
    public function test_authenticated_user_can_create_topic(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/forum/topics', [
            'title' => 'Test Topic',
            'content' => 'This is a test topic content.',
            'category' => 'sugestao',
        ]);

        // TODO: Assert created
        $this->markTestIncomplete('Pendente implementação');
    }

    /**
     * Test: Unauthenticated user cannot create topic
     */
    public function test_unauthenticated_user_cannot_create_topic(): void
    {
        $response = $this->postJson('/api/v1/forum/topics', [
            'title' => 'Test Topic',
            'content' => 'This is a test topic content.',
            'category' => 'sugestao',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test: Can like topic
     */
    public function test_can_like_topic(): void
    {
        $this->markTestIncomplete('Pendente implementação');
    }

    /**
     * Test: Can comment on topic
     */
    public function test_can_comment_on_topic(): void
    {
        $this->markTestIncomplete('Pendente implementação');
    }
}
