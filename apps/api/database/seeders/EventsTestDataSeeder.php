<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class EventsTestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🎯 Seeding Events Test Data...');

        // Get existing categories and tags
        $categories = DB::table('event_categories')->pluck('id', 'slug')->toArray();
        $tags = DB::table('tags')->pluck('id', 'slug')->toArray();
        $bairros = DB::table('bairros')->pluck('id', 'nome')->toArray();

        if (empty($categories)) {
            $this->command->error('❌ No categories found. Run EventCategoriesSeeder first.');
            return;
        }

        // =========================================================================
        // 1. VENUES (Locais)
        // =========================================================================
        $this->command->info('📍 Creating venues...');

        $venues = [
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Praça Central de Tijucas',
                'slug' => 'praca-central-tijucas',
                'bairro_id' => $bairros['Centro'] ?? null,
                'address' => 'Praça XV de Novembro',
                'address_number' => 's/n',
                'latitude' => -27.2419,
                'longitude' => -48.6308,
                'capacity' => 5000,
                'phone' => '(48) 3263-1000',
                'description' => 'Principal praça da cidade, palco de grandes eventos e festividades.',
                'is_active' => true,
            ],
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Igreja Matriz São Sebastião',
                'slug' => 'igreja-matriz-sao-sebastiao',
                'bairro_id' => $bairros['Centro'] ?? null,
                'address' => 'Rua Coronel Eugênio Müller',
                'address_number' => '100',
                'latitude' => -27.2425,
                'longitude' => -48.6315,
                'capacity' => 800,
                'description' => 'Igreja histórica de Tijucas, fundada em 1848.',
                'is_active' => true,
            ],
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Centro de Eventos Tijucas',
                'slug' => 'centro-eventos-tijucas',
                'bairro_id' => $bairros['Centro'] ?? null,
                'address' => 'Rua João Pessoa',
                'address_number' => '500',
                'latitude' => -27.2380,
                'longitude' => -48.6290,
                'capacity' => 2000,
                'phone' => '(48) 3263-2500',
                'website' => 'https://eventostijucas.com.br',
                'description' => 'Espaço multiuso para eventos de grande porte.',
                'is_active' => true,
            ],
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Orla de Meia Praia',
                'slug' => 'orla-meia-praia',
                'bairro_id' => $bairros['Meia Praia'] ?? null,
                'address' => 'Avenida Beira Mar',
                'latitude' => -27.2200,
                'longitude' => -48.6100,
                'capacity' => 10000,
                'description' => 'Orla à beira-mar ideal para eventos ao ar livre.',
                'is_active' => true,
            ],
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Ginásio Municipal',
                'slug' => 'ginasio-municipal-tijucas',
                'bairro_id' => $bairros['Centro'] ?? null,
                'address' => 'Rua dos Esportes',
                'address_number' => '200',
                'capacity' => 3000,
                'description' => 'Ginásio poliesportivo para eventos esportivos e culturais.',
                'is_active' => true,
            ],
        ];

        foreach ($venues as $venue) {
            $venue['created_at'] = now();
            $venue['updated_at'] = now();
            DB::table('venues')->updateOrInsert(['slug' => $venue['slug']], $venue);
        }

        $venueIds = DB::table('venues')->pluck('id', 'slug')->toArray();

        // =========================================================================
        // 2. ORGANIZERS (Organizadores)
        // =========================================================================
        $this->command->info('👤 Creating organizers...');

        $organizers = [
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Prefeitura de Tijucas',
                'slug' => 'prefeitura-tijucas',
                'email' => 'eventos@tijucas.sc.gov.br',
                'phone' => '(48) 3263-8000',
                'instagram' => '@prefeituratijucas',
                'website' => 'https://tijucas.sc.gov.br',
                'description' => 'Prefeitura Municipal de Tijucas - Eventos oficiais',
                'is_verified' => true,
            ],
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Paróquia São Sebastião',
                'slug' => 'paroquia-sao-sebastiao',
                'email' => 'paroquia@tijucas.org.br',
                'phone' => '(48) 3263-1234',
                'instagram' => '@paroquiasaosebastiao',
                'description' => 'Eventos religiosos e festas da padroeira.',
                'is_verified' => true,
            ],
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Associação Comercial de Tijucas',
                'slug' => 'acit-tijucas',
                'email' => 'contato@acit.com.br',
                'phone' => '(48) 3263-5000',
                'instagram' => '@acit_tijucas',
                'website' => 'https://acit.com.br',
                'description' => 'Associação de comerciantes e empresários.',
                'is_verified' => true,
            ],
            [
                'id' => Str::uuid()->toString(),
                'name' => 'Banda da Cidade',
                'slug' => 'banda-da-cidade',
                'email' => 'bandadacidade@email.com',
                'phone' => '(48) 99999-1234',
                'instagram' => '@bandadacidade',
                'description' => 'Shows e eventos musicais.',
                'is_verified' => false,
            ],
        ];

        foreach ($organizers as $org) {
            $org['created_at'] = now();
            $org['updated_at'] = now();
            DB::table('organizers')->updateOrInsert(['slug' => $org['slug']], $org);
        }

        $organizerIds = DB::table('organizers')->pluck('id', 'slug')->toArray();

        // =========================================================================
        // 3. EVENTS (Eventos)
        // =========================================================================
        $this->command->info('📅 Creating events...');

        $now = Carbon::now();

        $events = [
            // Evento 1: Festival de Verão (MULTI-DAY)
            [
                'id' => Str::uuid()->toString(),
                'title' => 'Festival de Verão Tijucas 2026',
                'edition' => '5ª Edição',
                'slug' => 'festival-verao-tijucas-2026',
                'category_id' => $categories['show'] ?? null,
                'description_short' => 'O maior festival de música do litoral catarinense! 3 dias de shows inesquecíveis.',
                'description_full' => "## Festival de Verão Tijucas 2026\n\nO maior evento musical do litoral catarinense está de volta!\n\n### O que esperar:\n- 3 dias de shows ao vivo\n- Mais de 20 atrações\n- Food trucks e área gastronômica\n- Espaço kids\n\n### Atrações confirmadas:\n- Dia 1: Bandas locais e DJs\n- Dia 2: Atrações nacionais\n- Dia 3: Show de encerramento",
                'start_datetime' => $now->copy()->addDays(14)->setTime(18, 0),
                'end_datetime' => $now->copy()->addDays(16)->setTime(23, 59),
                'venue_id' => $venueIds['orla-meia-praia'] ?? null,
                'organizer_id' => $organizerIds['prefeitura-tijucas'] ?? null,
                'cover_image_url' => 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
                'banner_image_url' => 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600',
                'banner_image_mobile_url' => 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600',
                'age_rating' => 'livre',
                'is_outdoor' => true,
                'has_accessibility' => true,
                'has_parking' => true,
                'popularity_score' => 2500,
                'expected_audience' => 15000,
                'status' => 'published',
                'event_type' => 'multi_day',
                'total_days' => 3,
                'is_featured' => true,
                'published_at' => now(),
            ],

            // Evento 2: Festa Junina
            [
                'id' => Str::uuid()->toString(),
                'title' => 'Arraiá de São João',
                'slug' => 'arraia-sao-joao-2026',
                'category_id' => $categories['festa'] ?? null,
                'description_short' => 'Tradicional festa junina com comidas típicas, quadrilha e forró!',
                'description_full' => "## Arraiá de São João\n\nVenha curtir a melhor festa junina da região!\n\n- Comidas típicas\n- Quadrilha tradicional\n- Pescaria e correio elegante\n- Forró ao vivo",
                'start_datetime' => $now->copy()->addDays(7)->setTime(18, 0),
                'end_datetime' => $now->copy()->addDays(7)->setTime(23, 0),
                'venue_id' => $venueIds['praca-central-tijucas'] ?? null,
                'organizer_id' => $organizerIds['prefeitura-tijucas'] ?? null,
                'cover_image_url' => 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?w=800',
                'age_rating' => 'livre',
                'is_outdoor' => true,
                'has_accessibility' => true,
                'has_parking' => false,
                'popularity_score' => 1800,
                'status' => 'published',
                'event_type' => 'single',
                'total_days' => 1,
                'is_featured' => true,
                'published_at' => now(),
            ],

            // Evento 3: Show de Rock
            [
                'id' => Str::uuid()->toString(),
                'title' => 'Rock na Praça',
                'slug' => 'rock-na-praca-fev-2026',
                'category_id' => $categories['show'] ?? null,
                'description_short' => 'Noite de rock com as melhores bandas da região!',
                'description_full' => "## Rock na Praça\n\nPrepare-se para uma noite de muito rock!\n\n### Line-up:\n- 20h - Banda Garage\n- 21h30 - The Rockers\n- 23h - Headliner Surpresa",
                'start_datetime' => $now->copy()->addDays(3)->setTime(20, 0),
                'end_datetime' => $now->copy()->addDays(4)->setTime(1, 0),
                'venue_id' => $venueIds['praca-central-tijucas'] ?? null,
                'organizer_id' => $organizerIds['banda-da-cidade'] ?? null,
                'cover_image_url' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
                'age_rating' => '16',
                'is_outdoor' => true,
                'has_accessibility' => false,
                'has_parking' => false,
                'popularity_score' => 950,
                'status' => 'published',
                'event_type' => 'single',
                'total_days' => 1,
                'is_featured' => false,
                'published_at' => now(),
            ],

            // Evento 4: Feira de Artesanato
            [
                'id' => Str::uuid()->toString(),
                'title' => 'Feira de Artesanato Local',
                'slug' => 'feira-artesanato-fev-2026',
                'category_id' => $categories['feira'] ?? null,
                'description_short' => 'Artesanato local, produtos orgânicos e muita cultura!',
                'description_full' => "## Feira de Artesanato Local\n\nConheça o trabalho dos artesãos de Tijucas!\n\n- Artesanato em cerâmica\n- Produtos orgânicos\n- Comida caseira\n- Música ao vivo",
                'start_datetime' => $now->copy()->addDays(1)->setTime(9, 0),
                'end_datetime' => $now->copy()->addDays(1)->setTime(17, 0),
                'venue_id' => $venueIds['praca-central-tijucas'] ?? null,
                'organizer_id' => $organizerIds['acit-tijucas'] ?? null,
                'cover_image_url' => 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
                'age_rating' => 'livre',
                'is_outdoor' => true,
                'has_accessibility' => true,
                'has_parking' => false,
                'popularity_score' => 600,
                'status' => 'published',
                'event_type' => 'single',
                'total_days' => 1,
                'is_featured' => false,
                'published_at' => now(),
            ],

            // Evento 5: Missa Festiva
            [
                'id' => Str::uuid()->toString(),
                'title' => 'Missa em Honra a São Sebastião',
                'slug' => 'missa-sao-sebastiao-2026',
                'category_id' => $categories['religioso'] ?? null,
                'description_short' => 'Missa solene em honra ao padroeiro da cidade.',
                'description_full' => "## Missa Festiva\n\nCelebre conosco a festa do padroeiro!\n\n- Missa cantada\n- Procissão\n- Benção dos doentes",
                'start_datetime' => $now->copy()->addDays(5)->setTime(19, 0),
                'end_datetime' => $now->copy()->addDays(5)->setTime(21, 0),
                'venue_id' => $venueIds['igreja-matriz-sao-sebastiao'] ?? null,
                'organizer_id' => $organizerIds['paroquia-sao-sebastiao'] ?? null,
                'cover_image_url' => 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800',
                'age_rating' => 'livre',
                'is_outdoor' => false,
                'has_accessibility' => true,
                'has_parking' => false,
                'popularity_score' => 400,
                'status' => 'published',
                'event_type' => 'single',
                'total_days' => 1,
                'is_featured' => false,
                'published_at' => now(),
            ],

            // Evento 6: Corrida de Rua
            [
                'id' => Str::uuid()->toString(),
                'title' => '10K Tijucas Run',
                'slug' => '10k-tijucas-run-2026',
                'category_id' => $categories['esportes'] ?? null,
                'description_short' => 'Corrida de rua de 10km pelas ruas de Tijucas.',
                'description_full' => "## 10K Tijucas Run\n\nVenha correr conosco!\n\n### Categorias:\n- Geral masculino\n- Geral feminino\n- Por faixa etária\n\n### Incluído:\n- Kit atleta\n- Medalha finisher\n- Frutas no pós-prova",
                'start_datetime' => $now->copy()->addDays(10)->setTime(7, 0),
                'end_datetime' => $now->copy()->addDays(10)->setTime(11, 0),
                'venue_id' => $venueIds['praca-central-tijucas'] ?? null,
                'organizer_id' => $organizerIds['prefeitura-tijucas'] ?? null,
                'cover_image_url' => 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
                'age_rating' => 'livre',
                'is_outdoor' => true,
                'has_accessibility' => false,
                'has_parking' => true,
                'popularity_score' => 750,
                'status' => 'published',
                'event_type' => 'single',
                'total_days' => 1,
                'is_featured' => false,
                'published_at' => now(),
            ],

            // Evento 7: Workshop de Fotografia
            [
                'id' => Str::uuid()->toString(),
                'title' => 'Workshop de Fotografia Mobile',
                'slug' => 'workshop-foto-mobile-2026',
                'category_id' => $categories['workshop'] ?? null,
                'description_short' => 'Aprenda a tirar fotos incríveis com seu celular!',
                'description_full' => "## Workshop de Fotografia Mobile\n\nTransforme seu celular em uma câmera profissional!\n\n### Conteúdo:\n- Composição e enquadramento\n- Iluminação natural\n- Edição com apps gratuitos\n- Prática supervisionada",
                'start_datetime' => $now->copy()->addDays(8)->setTime(14, 0),
                'end_datetime' => $now->copy()->addDays(8)->setTime(18, 0),
                'venue_id' => $venueIds['centro-eventos-tijucas'] ?? null,
                'organizer_id' => $organizerIds['acit-tijucas'] ?? null,
                'cover_image_url' => 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800',
                'age_rating' => 'livre',
                'is_outdoor' => false,
                'has_accessibility' => true,
                'has_parking' => true,
                'popularity_score' => 320,
                'status' => 'published',
                'event_type' => 'single',
                'total_days' => 1,
                'is_featured' => false,
                'published_at' => now(),
            ],

            // Evento 8: Festival Gastronômico
            [
                'id' => Str::uuid()->toString(),
                'title' => 'Sabores de Tijucas',
                'slug' => 'sabores-de-tijucas-2026',
                'category_id' => $categories['gastronomico'] ?? null,
                'description_short' => 'Festival gastronômico com o melhor da culinária local!',
                'description_full' => "## Sabores de Tijucas\n\nUm passeio pelos sabores da nossa região!\n\n### Participantes:\n- Restaurantes locais\n- Food trucks\n- Doces artesanais\n- Bebidas regionais",
                'start_datetime' => $now->copy()->addDays(12)->setTime(11, 0),
                'end_datetime' => $now->copy()->addDays(12)->setTime(22, 0),
                'venue_id' => $venueIds['orla-meia-praia'] ?? null,
                'organizer_id' => $organizerIds['acit-tijucas'] ?? null,
                'cover_image_url' => 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
                'banner_image_url' => 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1600',
                'age_rating' => 'livre',
                'is_outdoor' => true,
                'has_accessibility' => true,
                'has_parking' => true,
                'popularity_score' => 1200,
                'expected_audience' => 5000,
                'status' => 'published',
                'event_type' => 'single',
                'total_days' => 1,
                'is_featured' => true,
                'published_at' => now(),
            ],

            // Evento 9: Teatro Infantil (HOJE)
            [
                'id' => Str::uuid()->toString(),
                'title' => 'Teatro Infantil: O Pequeno Príncipe',
                'slug' => 'teatro-pequeno-principe-2026',
                'category_id' => $categories['infantil'] ?? null,
                'description_short' => 'Adaptação do clássico de Saint-Exupéry para crianças.',
                'description_full' => "## O Pequeno Príncipe\n\nUma viagem mágica pelo universo!\n\nDuração: 60 minutos\nClassificação: Livre",
                'start_datetime' => $now->copy()->setTime(15, 0),
                'end_datetime' => $now->copy()->setTime(16, 30),
                'venue_id' => $venueIds['centro-eventos-tijucas'] ?? null,
                'organizer_id' => $organizerIds['prefeitura-tijucas'] ?? null,
                'cover_image_url' => 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
                'age_rating' => 'livre',
                'is_outdoor' => false,
                'has_accessibility' => true,
                'has_parking' => true,
                'popularity_score' => 450,
                'status' => 'published',
                'event_type' => 'single',
                'total_days' => 1,
                'is_featured' => false,
                'published_at' => now(),
            ],

            // Evento 10: Exposição de Arte
            [
                'id' => Str::uuid()->toString(),
                'title' => 'Exposição: Artistas de Tijucas',
                'slug' => 'exposicao-artistas-tijucas-2026',
                'category_id' => $categories['cultura'] ?? null,
                'description_short' => 'Mostra coletiva de artistas locais.',
                'description_full' => "## Artistas de Tijucas\n\nConheça o talento dos artistas da nossa cidade!\n\n- Pinturas\n- Esculturas\n- Fotografias\n- Instalações",
                'start_datetime' => $now->copy()->addDays(2)->setTime(10, 0),
                'end_datetime' => $now->copy()->addDays(9)->setTime(18, 0),
                'venue_id' => $venueIds['centro-eventos-tijucas'] ?? null,
                'organizer_id' => $organizerIds['prefeitura-tijucas'] ?? null,
                'cover_image_url' => 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800',
                'age_rating' => 'livre',
                'is_outdoor' => false,
                'has_accessibility' => true,
                'has_parking' => true,
                'popularity_score' => 380,
                'status' => 'published',
                'event_type' => 'single',
                'total_days' => 7,
                'is_featured' => false,
                'published_at' => now(),
            ],
        ];

        foreach ($events as $event) {
            $event['created_at'] = now();
            $event['updated_at'] = now();
            DB::table('events')->updateOrInsert(['slug' => $event['slug']], $event);
        }

        $eventIds = DB::table('events')->pluck('id', 'slug')->toArray();

        // =========================================================================
        // 4. EVENT DAYS (para multi-day events)
        // =========================================================================
        $this->command->info('📆 Creating event days...');

        $festivalId = $eventIds['festival-verao-tijucas-2026'] ?? null;
        if ($festivalId) {
            $festivalStart = $now->copy()->addDays(14);

            $eventDays = [
                [
                    'id' => Str::uuid()->toString(),
                    'event_id' => $festivalId,
                    'day_number' => 1,
                    'date' => $festivalStart->format('Y-m-d'),
                    'title' => 'Dia 1 - Abertura',
                    'start_time' => '18:00:00',
                    'end_time' => '23:59:00',
                    'description' => 'Abertura oficial do festival com bandas locais.',
                    'cover_image_url' => 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'event_id' => $festivalId,
                    'day_number' => 2,
                    'date' => $festivalStart->copy()->addDay()->format('Y-m-d'),
                    'title' => 'Dia 2 - Shows Nacionais',
                    'start_time' => '16:00:00',
                    'end_time' => '23:59:00',
                    'description' => 'Atrações nacionais de peso!',
                    'cover_image_url' => 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800',
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'event_id' => $festivalId,
                    'day_number' => 3,
                    'date' => $festivalStart->copy()->addDays(2)->format('Y-m-d'),
                    'title' => 'Dia 3 - Encerramento',
                    'start_time' => '15:00:00',
                    'end_time' => '23:59:00',
                    'description' => 'Grande final com show especial de encerramento.',
                    'cover_image_url' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
                ],
            ];

            foreach ($eventDays as $day) {
                $day['created_at'] = now();
                $day['updated_at'] = now();
                DB::table('event_days')->updateOrInsert(
                    ['event_id' => $day['event_id'], 'day_number' => $day['day_number']],
                    $day
                );
            }
        }

        // =========================================================================
        // 5. EVENT TICKETS (Ingressos)
        // =========================================================================
        $this->command->info('🎫 Creating tickets...');

        $tickets = [
            // Festival - Pago
            [
                'id' => Str::uuid()->toString(),
                'event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null,
                'ticket_type' => 'paid',
                'min_price' => 80.00,
                'max_price' => 200.00,
                'currency' => 'BRL',
                'purchase_url' => 'https://ingressos.example.com/festival-verao',
                'purchase_info' => 'Vendas online e nas bilheterias oficiais. Meia entrada para estudantes.',
            ],
            // Rock - Pago
            [
                'id' => Str::uuid()->toString(),
                'event_id' => $eventIds['rock-na-praca-fev-2026'] ?? null,
                'ticket_type' => 'paid',
                'min_price' => 30.00,
                'max_price' => 50.00,
                'currency' => 'BRL',
                'purchase_url' => 'https://sympla.com.br/rock-na-praca',
                'purchase_info' => 'Vendas apenas online.',
            ],
            // Corrida - Pago
            [
                'id' => Str::uuid()->toString(),
                'event_id' => $eventIds['10k-tijucas-run-2026'] ?? null,
                'ticket_type' => 'paid',
                'min_price' => 60.00,
                'max_price' => 80.00,
                'currency' => 'BRL',
                'purchase_url' => 'https://corridastijucas.com.br/inscricao',
                'purchase_info' => 'Inclui kit atleta, chip de cronometragem e medalha.',
            ],
            // Workshop - Pago
            [
                'id' => Str::uuid()->toString(),
                'event_id' => $eventIds['workshop-foto-mobile-2026'] ?? null,
                'ticket_type' => 'paid',
                'min_price' => 50.00,
                'max_price' => 50.00,
                'currency' => 'BRL',
                'purchase_info' => 'Vagas limitadas a 30 participantes.',
            ],
            // Festa Junina - Gratuito
            [
                'id' => Str::uuid()->toString(),
                'event_id' => $eventIds['arraia-sao-joao-2026'] ?? null,
                'ticket_type' => 'free',
                'min_price' => 0,
                'purchase_info' => 'Entrada gratuita! Traga toda a família.',
            ],
            // Feira - Gratuito
            [
                'id' => Str::uuid()->toString(),
                'event_id' => $eventIds['feira-artesanato-fev-2026'] ?? null,
                'ticket_type' => 'free',
                'min_price' => 0,
            ],
            // Missa - Gratuito
            [
                'id' => Str::uuid()->toString(),
                'event_id' => $eventIds['missa-sao-sebastiao-2026'] ?? null,
                'ticket_type' => 'free',
                'min_price' => 0,
            ],
            // Teatro - Gratuito
            [
                'id' => Str::uuid()->toString(),
                'event_id' => $eventIds['teatro-pequeno-principe-2026'] ?? null,
                'ticket_type' => 'free',
                'min_price' => 0,
                'purchase_info' => 'Retirar ingresso na bilheteria 1h antes.',
            ],
            // Exposição - Gratuito
            [
                'id' => Str::uuid()->toString(),
                'event_id' => $eventIds['exposicao-artistas-tijucas-2026'] ?? null,
                'ticket_type' => 'free',
                'min_price' => 0,
            ],
            // Festival Gastronômico - Gratuito
            [
                'id' => Str::uuid()->toString(),
                'event_id' => $eventIds['sabores-de-tijucas-2026'] ?? null,
                'ticket_type' => 'free',
                'min_price' => 0,
                'purchase_info' => 'Entrada gratuita. Consumação à parte.',
            ],
        ];

        foreach ($tickets as $ticket) {
            if ($ticket['event_id']) {
                $ticket['created_at'] = now();
                $ticket['updated_at'] = now();
                DB::table('event_tickets')->updateOrInsert(['event_id' => $ticket['event_id']], $ticket);
            }
        }

        $ticketIds = DB::table('event_tickets')->pluck('id', 'event_id')->toArray();

        // =========================================================================
        // 6. TICKET LOTS (Lotes)
        // =========================================================================
        $this->command->info('🎟️ Creating ticket lots...');

        $festivalTicketId = $ticketIds[$eventIds['festival-verao-tijucas-2026'] ?? ''] ?? null;
        if ($festivalTicketId) {
            $lots = [
                [
                    'id' => Str::uuid()->toString(),
                    'event_ticket_id' => $festivalTicketId,
                    'name' => '1º Lote - Super Early Bird',
                    'price' => 80.00,
                    'quantity_total' => 200,
                    'quantity_sold' => 200,
                    'is_active' => false,
                    'display_order' => 1,
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'event_ticket_id' => $festivalTicketId,
                    'name' => '2º Lote',
                    'price' => 120.00,
                    'quantity_total' => 500,
                    'quantity_sold' => 350,
                    'is_active' => true,
                    'display_order' => 2,
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'event_ticket_id' => $festivalTicketId,
                    'name' => '3º Lote',
                    'price' => 150.00,
                    'quantity_total' => 800,
                    'quantity_sold' => 0,
                    'is_active' => false,
                    'display_order' => 3,
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'event_ticket_id' => $festivalTicketId,
                    'name' => 'VIP Passaporte 3 dias',
                    'price' => 200.00,
                    'quantity_total' => 100,
                    'quantity_sold' => 45,
                    'is_active' => true,
                    'display_order' => 4,
                ],
            ];

            foreach ($lots as $lot) {
                $lot['created_at'] = now();
                $lot['updated_at'] = now();
                DB::table('ticket_lots')->updateOrInsert(
                    ['event_ticket_id' => $lot['event_ticket_id'], 'name' => $lot['name']],
                    $lot
                );
            }
        }

        // =========================================================================
        // 7. EVENT SCHEDULES (Programação)
        // =========================================================================
        $this->command->info('⏰ Creating schedules...');

        $schedules = [
            // Festival Dia 1
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'time' => '18:00', 'date' => $now->copy()->addDays(14)->format('Y-m-d'), 'title' => 'Abertura dos Portões', 'description' => 'Chegue cedo!'],
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'time' => '19:00', 'date' => $now->copy()->addDays(14)->format('Y-m-d'), 'title' => 'DJ Set Abertura', 'stage' => 'Palco Principal', 'performer' => 'DJ Local'],
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'time' => '20:30', 'date' => $now->copy()->addDays(14)->format('Y-m-d'), 'title' => 'Banda Garagem', 'stage' => 'Palco Principal', 'performer' => 'Banda Garagem'],
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'time' => '22:00', 'date' => $now->copy()->addDays(14)->format('Y-m-d'), 'title' => 'The Rockers', 'stage' => 'Palco Principal', 'performer' => 'The Rockers'],

            // Festival Dia 2
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'time' => '16:00', 'date' => $now->copy()->addDays(15)->format('Y-m-d'), 'title' => 'Abertura', 'description' => 'Espaço kids disponível'],
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'time' => '18:00', 'date' => $now->copy()->addDays(15)->format('Y-m-d'), 'title' => 'Atração Nacional 1', 'stage' => 'Palco Principal', 'performer' => 'Artista Nacional'],
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'time' => '21:00', 'date' => $now->copy()->addDays(15)->format('Y-m-d'), 'title' => 'Headliner', 'stage' => 'Palco Principal', 'performer' => 'Headliner Nacional'],

            // Festival Dia 3
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'time' => '15:00', 'date' => $now->copy()->addDays(16)->format('Y-m-d'), 'title' => 'Feira Gastronômica', 'description' => 'Food trucks e bebidas'],
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'time' => '17:00', 'date' => $now->copy()->addDays(16)->format('Y-m-d'), 'title' => 'Show Infantil', 'stage' => 'Palco Kids', 'performer' => 'Palhaço Alegria'],
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'time' => '20:00', 'date' => $now->copy()->addDays(16)->format('Y-m-d'), 'title' => 'Show de Encerramento', 'stage' => 'Palco Principal', 'performer' => 'Atração Surpresa'],

            // Rock na Praça
            ['event_id' => $eventIds['rock-na-praca-fev-2026'] ?? null, 'time' => '20:00', 'title' => 'Banda Garagem', 'stage' => 'Palco', 'performer' => 'Banda Garagem'],
            ['event_id' => $eventIds['rock-na-praca-fev-2026'] ?? null, 'time' => '21:30', 'title' => 'The Rockers', 'stage' => 'Palco', 'performer' => 'The Rockers'],
            ['event_id' => $eventIds['rock-na-praca-fev-2026'] ?? null, 'time' => '23:00', 'title' => 'Headliner Surpresa', 'stage' => 'Palco', 'performer' => 'Artista Surpresa'],

            // Arraiá
            ['event_id' => $eventIds['arraia-sao-joao-2026'] ?? null, 'time' => '18:00', 'title' => 'Abertura e barracas'],
            ['event_id' => $eventIds['arraia-sao-joao-2026'] ?? null, 'time' => '19:00', 'title' => 'Quadrilha das Crianças'],
            ['event_id' => $eventIds['arraia-sao-joao-2026'] ?? null, 'time' => '20:00', 'title' => 'Quadrilha Adulto'],
            ['event_id' => $eventIds['arraia-sao-joao-2026'] ?? null, 'time' => '21:00', 'title' => 'Forró ao Vivo', 'performer' => 'Trio Forró Bom'],

            // Corrida
            ['event_id' => $eventIds['10k-tijucas-run-2026'] ?? null, 'time' => '06:00', 'title' => 'Retirada de kit'],
            ['event_id' => $eventIds['10k-tijucas-run-2026'] ?? null, 'time' => '07:00', 'title' => 'Aquecimento'],
            ['event_id' => $eventIds['10k-tijucas-run-2026'] ?? null, 'time' => '07:30', 'title' => 'Largada'],
            ['event_id' => $eventIds['10k-tijucas-run-2026'] ?? null, 'time' => '10:00', 'title' => 'Premiação'],
        ];

        foreach ($schedules as $schedule) {
            if ($schedule['event_id']) {
                $schedule['id'] = Str::uuid()->toString();
                $schedule['display_order'] = 0;
                $schedule['created_at'] = now();
                $schedule['updated_at'] = now();
                DB::table('event_schedules')->insert($schedule);
            }
        }

        // =========================================================================
        // 8. EVENT TAGS (Relacionamento eventos-tags)
        // =========================================================================
        $this->command->info('🏷️ Linking tags to events...');

        $eventTagMappings = [
            'festival-verao-tijucas-2026' => ['musica', 'ao-ar-livre', 'shows-ao-vivo', 'fim-de-semana', 'food-truck'],
            'arraia-sao-joao-2026' => ['familia', 'gratuito', 'ao-ar-livre', 'criancas', 'gastronomia'],
            'rock-na-praca-fev-2026' => ['musica', 'noturno', 'shows-ao-vivo'],
            'feira-artesanato-fev-2026' => ['gratuito', 'ao-ar-livre', 'artesanato', 'familia'],
            'missa-sao-sebastiao-2026' => ['gratuito', 'familia'],
            '10k-tijucas-run-2026' => ['esportivo', 'ao-ar-livre'],
            'workshop-foto-mobile-2026' => ['cultural'],
            'sabores-de-tijucas-2026' => ['gastronomia', 'food-truck', 'ao-ar-livre', 'familia', 'gratuito'],
            'teatro-pequeno-principe-2026' => ['familia', 'criancas', 'gratuito', 'cultural'],
            'exposicao-artistas-tijucas-2026' => ['cultural', 'gratuito', 'artesanato'],
        ];

        foreach ($eventTagMappings as $eventSlug => $tagSlugs) {
            $eventId = $eventIds[$eventSlug] ?? null;
            if (!$eventId)
                continue;

            foreach ($tagSlugs as $tagSlug) {
                $tagId = $tags[$tagSlug] ?? null;
                if (!$tagId)
                    continue;

                DB::table('event_tags')->updateOrInsert([
                    'event_id' => $eventId,
                    'tag_id' => $tagId,
                ]);

                // Update usage count
                DB::table('tags')->where('id', $tagId)->increment('usage_count');
            }
        }

        // =========================================================================
        // 9. EVENT MEDIA (Galeria)
        // =========================================================================
        $this->command->info('🖼️ Creating media galleries...');

        $festivalId = $eventIds['festival-verao-tijucas-2026'] ?? null;
        if ($festivalId) {
            $media = [
                ['url' => 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800', 'caption' => 'Palco principal', 'display_order' => 1],
                ['url' => 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800', 'caption' => 'Público animado', 'display_order' => 2],
                ['url' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', 'caption' => 'Luzes do show', 'display_order' => 3],
            ];

            foreach ($media as $m) {
                DB::table('event_media')->insert([
                    'id' => Str::uuid()->toString(),
                    'event_id' => $festivalId,
                    'media_type' => 'image',
                    'url' => $m['url'],
                    'caption' => $m['caption'],
                    'display_order' => $m['display_order'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // =========================================================================
        // 10. EVENT LINKS (Redes sociais)
        // =========================================================================
        $this->command->info('🔗 Creating event links...');

        $links = [
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'link_type' => 'instagram', 'url' => 'https://instagram.com/festivalveraotijucas'],
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'link_type' => 'whatsapp', 'url' => 'https://wa.me/5548999991234'],
            ['event_id' => $eventIds['festival-verao-tijucas-2026'] ?? null, 'link_type' => 'website', 'url' => 'https://festivalveraotijucas.com.br'],
            ['event_id' => $eventIds['rock-na-praca-fev-2026'] ?? null, 'link_type' => 'instagram', 'url' => 'https://instagram.com/rocknapraca'],
            ['event_id' => $eventIds['sabores-de-tijucas-2026'] ?? null, 'link_type' => 'instagram', 'url' => 'https://instagram.com/saboresdetijucas'],
            ['event_id' => $eventIds['10k-tijucas-run-2026'] ?? null, 'link_type' => 'website', 'url' => 'https://corridastijucas.com.br'],
        ];

        foreach ($links as $link) {
            if ($link['event_id']) {
                DB::table('event_links')->insert([
                    'id' => Str::uuid()->toString(),
                    'event_id' => $link['event_id'],
                    'link_type' => $link['link_type'],
                    'url' => $link['url'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $this->command->info('✅ Events test data seeded successfully!');
        $this->command->info('   - ' . count($venues) . ' venues');
        $this->command->info('   - ' . count($organizers) . ' organizers');
        $this->command->info('   - ' . count($events) . ' events');
        $this->command->info('   - Tickets, schedules, tags, media, and links created');
    }
}
