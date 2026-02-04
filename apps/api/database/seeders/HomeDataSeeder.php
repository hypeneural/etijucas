<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class HomeDataSeeder extends Seeder
{
    /**
     * Seed data for Home page components
     * 
     * This seeds: Alerts, Forum Topics/Comments, Citizen Reports
     */
    public function run(): void
    {
        $this->command->info('🏠 Seeding Home Page Data...');

        $bairros = DB::table('bairros')->pluck('id', 'nome')->toArray();
        $users = DB::table('users')->pluck('id', 'email')->toArray();

        // Get a default user
        $defaultUserId = array_values($users)[0] ?? null;
        if (!$defaultUserId) {
            $this->command->warn('⚠️ No users found. Topics and Reports will be skipped.');
        }

        // =========================================================================
        // 1. ALERTS (Alertas da cidade) - JÁ CRIADOS NO PRIMEIRO RUN
        // =========================================================================
        $this->command->info('🚨 Checking alerts...');
        $alertCount = DB::table('alerts')->count();
        if ($alertCount == 0) {
            $alerts = [
                [
                    'id' => Str::uuid()->toString(),
                    'tipo' => 'clima',
                    'titulo' => 'Alerta de Chuva Forte',
                    'descricao' => 'Previsão de chuva intensa para as próximas horas. Evite áreas de alagamento.',
                    'nivel' => 'warning',
                    'icone' => 'cloud-rain',
                    'priority' => 10,
                    'active' => true,
                    'expires_at' => Carbon::now()->addHours(12),
                    'bairro_id' => null,
                    'metadata' => json_encode(['fonte' => 'Defesa Civil']),
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'tipo' => 'transito',
                    'titulo' => 'Interdição na Rua XV de Novembro',
                    'descricao' => 'Obras de pavimentação até sexta-feira. Use rotas alternativas.',
                    'nivel' => 'info',
                    'icone' => 'construction',
                    'priority' => 5,
                    'active' => true,
                    'expires_at' => Carbon::now()->addDays(3),
                    'bairro_id' => $bairros['Centro'] ?? null,
                    'metadata' => json_encode(['rota_alternativa' => 'Rua João Pessoa']),
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'tipo' => 'evento',
                    'titulo' => 'Festival de Verão acontece neste final de semana!',
                    'descricao' => 'Aproveite 3 dias de música e diversão na Orla de Meia Praia.',
                    'nivel' => 'success',
                    'icone' => 'music',
                    'priority' => 8,
                    'active' => true,
                    'expires_at' => Carbon::now()->addDays(7),
                    'bairro_id' => $bairros['Meia Praia'] ?? null,
                    'metadata' => null,
                ],
            ];

            foreach ($alerts as $alert) {
                $alert['created_at'] = now();
                $alert['updated_at'] = now();
                DB::table('alerts')->insert($alert);
            }
            $this->command->info('✅ Created ' . count($alerts) . ' alerts');
        } else {
            $this->command->info("✅ Alerts already exist ({$alertCount})");
        }

        // =========================================================================
        // 2. FORUM TOPICS (Boca no Trombone)
        // =========================================================================
        $this->command->info('💬 Creating forum topics...');

        if ($defaultUserId) {
            $topicCount = DB::table('topics')->count();
            if ($topicCount == 0) {
                $centroId = $bairros['Centro'] ?? null;
                $meiaId = $bairros['Meia Praia'] ?? null;

                $topics = [
                    [
                        'id' => Str::uuid()->toString(),
                        'user_id' => $defaultUserId,
                        'bairro_id' => $centroId,
                        'titulo' => 'Alguém sabe onde está tendo peixe fresco hoje?',
                        'texto' => "Pessoal, tô procurando um lugar bom pra comprar peixe fresco hoje. Alguém tem indicação?\n\nDe preferência no Centro ou Meia Praia.",
                        'categoria' => 'comercio',
                        'status' => 'active',
                        'likes_count' => 12,
                        'comments_count' => 8,
                        'created_at' => Carbon::now()->subDays(2)->subHours(5),
                        'updated_at' => now(),
                    ],
                    [
                        'id' => Str::uuid()->toString(),
                        'user_id' => $defaultUserId,
                        'bairro_id' => $meiaId ?? $centroId,
                        'titulo' => 'Festival de Verão: dicas de quem já foi nos outros anos',
                        'texto' => "Vai ser meu primeiro Festival de Verão em Tijucas! Quem já foi, pode dar umas dicas?\n\n- Melhor horário pra chegar?\n- Onde estacionar?\n- Leva comida de casa ou tem boas opções lá?",
                        'categoria' => 'eventos',
                        'status' => 'active',
                        'likes_count' => 58,
                        'comments_count' => 23,
                        'created_at' => Carbon::now()->subDays(1)->subHours(3),
                        'updated_at' => now(),
                    ],
                    [
                        'id' => Str::uuid()->toString(),
                        'user_id' => $defaultUserId,
                        'bairro_id' => $centroId,
                        'titulo' => 'Problema com coleta de lixo no Centro',
                        'texto' => "Faz 3 dias que não passa caminhão de lixo aqui no Centro, próximo à praça.\n\nAlguém mais tá com esse problema? Será que é greve?",
                        'categoria' => 'reclamacoes',
                        'status' => 'active',
                        'likes_count' => 15,
                        'comments_count' => 11,
                        'created_at' => Carbon::now()->subHours(18),
                        'updated_at' => now(),
                    ],
                    [
                        'id' => Str::uuid()->toString(),
                        'user_id' => $defaultUserId,
                        'bairro_id' => $centroId,
                        'titulo' => 'Grupo de corrida aos domingos - quem topa?',
                        'texto' => "Estou organizando um grupo de corrida para domingos de manhã, saindo da Praça Central às 7h.\n\nTodos os níveis são bem vindos! Quem topa participar?",
                        'categoria' => 'outros',
                        'status' => 'active',
                        'likes_count' => 34,
                        'comments_count' => 15,
                        'created_at' => Carbon::now()->subHours(6),
                        'updated_at' => now(),
                    ],
                    [
                        'id' => Str::uuid()->toString(),
                        'user_id' => $defaultUserId,
                        'bairro_id' => $meiaId ?? $centroId,
                        'titulo' => 'Melhores praias para levar crianças',
                        'texto' => "Vou passar as férias em Tijucas com meus filhos (4 e 7 anos).\n\nQuais praias vocês recomendam que sejam seguras e tenham estrutura para crianças?",
                        'categoria' => 'outros',
                        'status' => 'active',
                        'likes_count' => 28,
                        'comments_count' => 19,
                        'created_at' => Carbon::now()->subDays(3),
                        'updated_at' => now(),
                    ],
                ];

                foreach ($topics as $topic) {
                    if ($topic['bairro_id']) {
                        DB::table('topics')->insert($topic);
                    }
                }

                $this->command->info('✅ Created ' . count($topics) . ' forum topics');
            } else {
                $this->command->info("✅ Topics already exist ({$topicCount})");
            }
        }

        // =========================================================================
        // 3. CITIZEN REPORTS (Fiscaliza Tijucas)
        // =========================================================================
        $this->command->info('📍 Creating citizen reports...');

        $reportCategories = DB::table('report_categories')->pluck('id', 'slug')->toArray();

        if ($defaultUserId && !empty($reportCategories)) {
            $reportCount = DB::table('citizen_reports')->count();

            if ($reportCount == 0) {
                $defaultCategoryId = array_values($reportCategories)[0];
                $centroId = $bairros['Centro'] ?? null;

                $reports = [
                    [
                        'id' => Str::uuid()->toString(),
                        'user_id' => $defaultUserId,
                        'category_id' => $reportCategories['buracos'] ?? $defaultCategoryId,
                        'bairro_id' => $centroId,
                        'title' => 'Buraco grande na Rua XV de Novembro',
                        'description' => 'Buraco de aproximadamente 50cm de diâmetro, perigoso para motos e bicicletas.',
                        'status' => 'em_analise',
                        'protocol' => 'ETJ-' . str_pad(rand(1, 999), 6, '0', STR_PAD_LEFT),
                        'address_text' => 'Rua XV de Novembro, 450',
                        'latitude' => -27.2420,
                        'longitude' => -48.6310,
                        'created_at' => Carbon::now()->subDays(5),
                        'updated_at' => now(),
                    ],
                    [
                        'id' => Str::uuid()->toString(),
                        'user_id' => $defaultUserId,
                        'category_id' => $reportCategories['iluminacao'] ?? $defaultCategoryId,
                        'bairro_id' => $centroId,
                        'title' => 'Lâmpada queimada há 2 semanas',
                        'description' => 'Poste de iluminação sem funcionar perto da escola municipal.',
                        'status' => 'resolvido',
                        'protocol' => 'ETJ-' . str_pad(rand(1, 999), 6, '0', STR_PAD_LEFT),
                        'address_text' => 'Rua das Acácias, próximo ao nº 200',
                        'latitude' => -27.2350,
                        'longitude' => -48.6250,
                        'created_at' => Carbon::now()->subDays(14),
                        'updated_at' => now(),
                        'resolved_at' => Carbon::now()->subDays(2),
                    ],
                    [
                        'id' => Str::uuid()->toString(),
                        'user_id' => $defaultUserId,
                        'category_id' => $reportCategories['lixo'] ?? $defaultCategoryId,
                        'bairro_id' => $bairros['Meia Praia'] ?? $centroId,
                        'title' => 'Entulho de construção abandonado',
                        'description' => 'Alguém largou restos de construção na esquina há mais de uma semana.',
                        'status' => 'recebido',
                        'protocol' => 'ETJ-' . str_pad(rand(1, 999), 6, '0', STR_PAD_LEFT),
                        'address_text' => 'Av. Beira Mar, esquina com Rua dos Pescadores',
                        'latitude' => -27.2200,
                        'longitude' => -48.6100,
                        'created_at' => Carbon::now()->subDays(3),
                        'updated_at' => now(),
                    ],
                    [
                        'id' => Str::uuid()->toString(),
                        'user_id' => $defaultUserId,
                        'category_id' => $reportCategories['agua'] ?? $defaultCategoryId,
                        'bairro_id' => $centroId,
                        'title' => 'Vazamento de água na calçada',
                        'description' => 'Água jorrando de cano quebrado, desperdício enorme há 3 dias.',
                        'status' => 'em_analise',
                        'protocol' => 'ETJ-' . str_pad(rand(1, 999), 6, '0', STR_PAD_LEFT),
                        'address_text' => 'Rua João Pessoa, 180',
                        'latitude' => -27.2380,
                        'longitude' => -48.6290,
                        'created_at' => Carbon::now()->subDays(1),
                        'updated_at' => now(),
                    ],
                ];

                foreach ($reports as $report) {
                    if ($report['bairro_id']) {
                        DB::table('citizen_reports')->insert($report);
                    }
                }

                $this->command->info('✅ Created ' . count($reports) . ' citizen reports');
            } else {
                $this->command->info("✅ Reports already exist ({$reportCount})");
            }
        } else {
            $this->command->warn('⚠️ No report categories found. Run ReportCategorySeeder first.');
        }

        $this->command->newLine();
        $this->command->info('🎉 Home Page data seeding complete!');
    }
}
