<?php

namespace Database\Seeders;

use App\Models\EventCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EventCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Show',
                'description' => 'Shows musicais, bandas, DJs',
                'icon' => 'music',
                'color' => '#9333EA',
                'display_order' => 1,
            ],
            [
                'name' => 'Festa',
                'description' => 'Festas, bailes, formaturas',
                'icon' => 'party-popper',
                'color' => '#F97316',
                'display_order' => 2,
            ],
            [
                'name' => 'Cultura',
                'description' => 'Teatro, cinema, exposições',
                'icon' => 'theater',
                'color' => '#3B82F6',
                'display_order' => 3,
            ],
            [
                'name' => 'Infantil',
                'description' => 'Eventos para crianças',
                'icon' => 'baby',
                'color' => '#10B981',
                'display_order' => 4,
            ],
            [
                'name' => 'Gastronômico',
                'description' => 'Feiras, festivais de comida',
                'icon' => 'utensils',
                'color' => '#EF4444',
                'display_order' => 5,
            ],
            [
                'name' => 'Esportes',
                'description' => 'Torneios, corridas, campeonatos',
                'icon' => 'trophy',
                'color' => '#FBBF24',
                'display_order' => 6,
            ],
            [
                'name' => 'Religioso',
                'description' => 'Festas de igreja, celebrações',
                'icon' => 'church',
                'color' => '#8B5CF6',
                'display_order' => 7,
            ],
            [
                'name' => 'Feira',
                'description' => 'Feiras de artesanato, bazar',
                'icon' => 'store',
                'color' => '#EC4899',
                'display_order' => 8,
            ],
            [
                'name' => 'Workshop',
                'description' => 'Cursos, palestras, oficinas',
                'icon' => 'graduation-cap',
                'color' => '#06B6D4',
                'display_order' => 9,
            ],
            [
                'name' => 'Beneficente',
                'description' => 'Ações sociais, arrecadações',
                'icon' => 'heart',
                'color' => '#F43F5E',
                'display_order' => 10,
            ],
        ];

        foreach ($categories as $category) {
            EventCategory::updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'slug' => Str::slug($category['name']),
                    'description' => $category['description'],
                    'icon' => $category['icon'],
                    'color' => $category['color'],
                    'display_order' => $category['display_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('✅ Event categories seeded successfully!');
    }
}
