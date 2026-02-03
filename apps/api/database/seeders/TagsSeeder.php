<?php

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TagsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tags = [
            ['name' => 'ao ar livre', 'color' => '#22C55E', 'is_featured' => true],
            ['name' => 'família', 'color' => '#3B82F6', 'is_featured' => true],
            ['name' => 'música', 'color' => '#9333EA', 'is_featured' => true],
            ['name' => 'gratuito', 'color' => '#10B981', 'is_featured' => true],
            ['name' => 'food truck', 'color' => '#F97316', 'is_featured' => false],
            ['name' => 'crianças', 'color' => '#EC4899', 'is_featured' => true],
            ['name' => 'noturno', 'color' => '#6366F1', 'is_featured' => false],
            ['name' => 'fim de semana', 'color' => '#8B5CF6', 'is_featured' => true],
            ['name' => 'acessível', 'color' => '#14B8A6', 'is_featured' => false],
            ['name' => 'pet friendly', 'color' => '#F59E0B', 'is_featured' => false],
            ['name' => 'shows ao vivo', 'color' => '#EF4444', 'is_featured' => true],
            ['name' => 'gastronomia', 'color' => '#DC2626', 'is_featured' => false],
            ['name' => 'artesanato', 'color' => '#A855F7', 'is_featured' => false],
            ['name' => 'cultural', 'color' => '#0EA5E9', 'is_featured' => false],
            ['name' => 'esportivo', 'color' => '#FBBF24', 'is_featured' => false],
        ];

        foreach ($tags as $tag) {
            Tag::updateOrCreate(
                ['slug' => Str::slug($tag['name'])],
                [
                    'name' => $tag['name'],
                    'slug' => Str::slug($tag['name']),
                    'color' => $tag['color'],
                    'is_featured' => $tag['is_featured'],
                    'usage_count' => 0,
                ]
            );
        }

        $this->command->info('✅ Tags seeded successfully!');
    }
}
