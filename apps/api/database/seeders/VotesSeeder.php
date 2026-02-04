<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Votes\Models\Legislatura;
use App\Domains\Votes\Models\Mandato;
use App\Domains\Votes\Models\Partido;
use App\Domains\Votes\Models\Vereador;
use App\Domains\Votes\Models\Votacao;
use App\Domains\Votes\Models\VotoRegistro;
use Illuminate\Database\Seeder;

class VotesSeeder extends Seeder
{
    public function run(): void
    {
        // ==========================================
        // 1. Partidos
        // ==========================================
        $partidos = [
            ['sigla' => 'MDB', 'nome' => 'Movimento Democrático Brasileiro', 'cor_hex' => '#00A859'],
            ['sigla' => 'PL', 'nome' => 'Partido Liberal', 'cor_hex' => '#003399'],
            ['sigla' => 'PP', 'nome' => 'Progressistas', 'cor_hex' => '#0066B3'],
            ['sigla' => 'PDT', 'nome' => 'Partido Democrático Trabalhista', 'cor_hex' => '#D32F2F'],
            ['sigla' => 'PSDB', 'nome' => 'Partido da Social Democracia Brasileira', 'cor_hex' => '#0033A0'],
            ['sigla' => 'PSD', 'nome' => 'Partido Social Democrático', 'cor_hex' => '#F5A623'],
            ['sigla' => 'PT', 'nome' => 'Partido dos Trabalhadores', 'cor_hex' => '#CC0000'],
            ['sigla' => 'UNIÃO', 'nome' => 'União Brasil', 'cor_hex' => '#1E3A8A'],
            ['sigla' => 'REPUBLICANOS', 'nome' => 'Republicanos', 'cor_hex' => '#1E40AF'],
            ['sigla' => 'PODE', 'nome' => 'Podemos', 'cor_hex' => '#00BCD4'],
            ['sigla' => 'CIDADANIA', 'nome' => 'Cidadania', 'cor_hex' => '#E91E63'],
        ];

        $partidosMap = [];
        foreach ($partidos as $data) {
            $partidosMap[$data['sigla']] = Partido::updateOrCreate(
                ['sigla' => $data['sigla']],
                $data
            );
        }

        $this->command->info('✅ Partidos criados: ' . count($partidos));

        // ==========================================
        // 2. Legislatura Atual
        // ==========================================
        $legislatura = Legislatura::updateOrCreate(
            ['numero' => 20],
            [
                'ano_inicio' => 2025,
                'ano_fim' => 2028,
                'atual' => true,
            ]
        );

        // Desmarcar outras legislaturas como não atuais
        Legislatura::where('id', '!=', $legislatura->id)->update(['atual' => false]);

        $this->command->info('✅ Legislatura: ' . $legislatura->nome_completo);

        // ==========================================
        // 3. Vereadores da 20ª Legislatura (2025-2028)
        // Dados baseados na Câmara de Tijucas
        // ==========================================
        $vereadoresData = [
            [
                'nome' => 'Cláudio Eduardo de Souza',
                'nascimento' => '1987-12-06',
                'telefone' => '(48) 3263-0921',
                'email' => 'claudio.souza@camaratijucas.sc.gov.br',
                'partido' => 'MDB',
                'cargo' => 'Vereador',
                'foto_url' => '/storage/vereadores/claudio-souza.jpg',
                'bio' => 'Jornalista de formação, conhecido como Cláudio do Jornal. Atua na defesa da comunicação social e transparência pública. Eleito pela primeira vez em 2020, reeleito em 2024.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/claudio-eduardo-de-souza',
                'redes_sociais' => [
                    'instagram' => 'claudiodojornal',
                    'facebook' => 'claudiodojornal',
                ],
            ],
            [
                'nome' => 'Écio Hélio de Melo',
                'telefone' => '(48) 3263-0921',
                'email' => 'ecio.melo@camaratijucas.sc.gov.br',
                'partido' => 'PL',
                'cargo' => 'Vereador',
                'foto_url' => '/storage/vereadores/ecio-melo.jpg',
                'bio' => 'Empresário e líder comunitário. Defensor do desenvolvimento econômico e geração de empregos no município. Primeiro mandato como vereador.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/ecio-helio-de-melo',
                'redes_sociais' => [
                    'instagram' => 'eciomelo',
                ],
            ],
            [
                'nome' => 'Esaú Bayer',
                'telefone' => '(48) 3263-0921',
                'email' => 'esau.bayer@camaratijucas.sc.gov.br',
                'partido' => 'PL',
                'cargo' => 'Vice-Presidente',
                'foto_url' => '/storage/vereadores/esau-bayer.jpg',
                'bio' => 'Agricultor e defensor do agronegócio tijucano. Trabalha pela valorização do produtor rural e melhoria da infraestrutura nas áreas rurais do município.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/esau-bayer',
                'redes_sociais' => [
                    'instagram' => 'esaubayer',
                    'facebook' => 'esaubayervereador',
                ],
            ],
            [
                'nome' => 'Flávio Henrique Souza',
                'telefone' => '(48) 3263-0921',
                'email' => 'flavio.souza@camaratijucas.sc.gov.br',
                'partido' => 'MDB',
                'cargo' => 'Vereador',
                'foto_url' => '/storage/vereadores/flavio-souza.jpg',
                'bio' => 'Servidor público com experiência em gestão. Focado em melhorias na saúde pública e educação municipal.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/flavio-henrique-souza',
                'redes_sociais' => [],
            ],
            [
                'nome' => 'Júlio César Bucoski',
                'telefone' => '(48) 3263-0921',
                'email' => 'julio.bucoski@camaratijucas.sc.gov.br',
                'partido' => 'PP',
                'cargo' => '1º Secretário',
                'foto_url' => '/storage/vereadores/julio-bucoski.jpg',
                'bio' => 'Bacharel em Direito e ex-secretário municipal. Atua nas áreas de segurança pública e desenvolvimento urbano. Terceiro mandato consecutivo.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/julio-cesar-bucoski',
                'redes_sociais' => [
                    'instagram' => 'juliobucoski',
                    'facebook' => 'juliobucoskivereador',
                ],
            ],
            [
                'nome' => 'Lizandra Dadam',
                'telefone' => '(48) 3263-0921',
                'email' => 'lizandra.dadam@camaratijucas.sc.gov.br',
                'partido' => 'PDT',
                'cargo' => 'Vereadora',
                'foto_url' => '/storage/vereadores/lizandra-dadam.jpg',
                'bio' => 'Pedagoga e defensora dos direitos das mulheres e crianças. Primeira mulher eleita vereadora pelo PDT em Tijucas. Trabalha por creches e escolas de qualidade.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/lizandra-dadam',
                'redes_sociais' => [
                    'instagram' => 'lizandradadam',
                    'facebook' => 'lizandradadam',
                ],
            ],
            [
                'nome' => 'Maria Edésia da Silva Vargas',
                'telefone' => '(48) 3263-0921',
                'email' => 'edesia.vargas@camaratijucas.sc.gov.br',
                'partido' => 'MDB',
                'cargo' => 'Presidente',
                'foto_url' => '/storage/vereadores/edesia-vargas.jpg',
                'bio' => 'Presidente da Câmara Municipal. Professora aposentada com longa trajetória na educação tijucana. Defensora da terceira idade e dos direitos sociais. Quarto mandato.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/maria-edesia-vargas',
                'redes_sociais' => [
                    'facebook' => 'edesiavargas',
                ],
            ],
            [
                'nome' => 'Maurício Poli',
                'telefone' => '(48) 3263-0921',
                'email' => 'mauricio.poli@camaratijucas.sc.gov.br',
                'partido' => 'MDB',
                'cargo' => 'Vereador',
                'foto_url' => '/storage/vereadores/mauricio-poli.jpg',
                'bio' => 'Comerciante e empresário do setor de vestuário. Defende o comércio local e o turismo como vetores de desenvolvimento econômico.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/mauricio-poli',
                'redes_sociais' => [
                    'instagram' => 'mauriciopoli',
                ],
            ],
            [
                'nome' => 'Nadir Olindina Amorim',
                'telefone' => '(48) 3263-0921',
                'email' => 'nadir.amorim@camaratijucas.sc.gov.br',
                'partido' => 'MDB',
                'cargo' => '2º Secretária',
                'foto_url' => '/storage/vereadores/nadir-amorim.jpg',
                'bio' => 'Professora e líder comunitária. Atua pela valorização dos profissionais da educação e por políticas de inclusão social.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/nadir-olindina-amorim',
                'redes_sociais' => [],
            ],
            [
                'nome' => 'Paulo César Pereira',
                'telefone' => '(48) 3263-0921',
                'email' => 'paulo.pereira@camaratijucas.sc.gov.br',
                'partido' => 'MDB',
                'cargo' => 'Vereador',
                'foto_url' => '/storage/vereadores/paulo-pereira.jpg',
                'bio' => 'Ex-atleta e técnico de futebol. Defensor do esporte como ferramenta de transformação social. Trabalha pela construção de praças e quadras esportivas nos bairros.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/paulo-cesar-pereira',
                'redes_sociais' => [
                    'instagram' => 'paulocesarvereador',
                ],
            ],
            [
                'nome' => 'Renato Laurindo Junior',
                'telefone' => '(48) 3263-0921',
                'email' => 'renato.laurindo@camaratijucas.sc.gov.br',
                'partido' => 'PSDB',
                'cargo' => 'Vereador',
                'foto_url' => '/storage/vereadores/renato-laurindo.jpg',
                'bio' => 'Advogado e ex-presidente da OAB local. Atua na fiscalização do executivo e na defesa dos direitos do consumidor.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/renato-laurindo-junior',
                'redes_sociais' => [
                    'instagram' => 'renatolaurindo',
                ],
            ],
            [
                'nome' => 'José Vicente de Souza e Silva',
                'telefone' => '(48) 3263-0921',
                'email' => 'vicente.silva@camaratijucas.sc.gov.br',
                'partido' => 'PL',
                'cargo' => 'Vereador',
                'foto_url' => '/storage/vereadores/vicente-silva.jpg',
                'bio' => 'Sindicalista e defensor dos trabalhadores. Atua por melhores condições de trabalho e valorização do funcionalismo municipal.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/jose-vicente-souza',
                'redes_sociais' => [],
            ],
            [
                'nome' => 'Fabiano Morfelle',
                'telefone' => '(48) 3263-0921',
                'email' => 'fabiano.morfelle@camaratijucas.sc.gov.br',
                'partido' => 'MDB',
                'cargo' => 'Vereador',
                'foto_url' => '/storage/vereadores/fabiano-morfelle.jpg',
                'bio' => 'Empresário do setor de construção civil. Defensor de políticas habitacionais e regularização fundiária. Trabalha pela expansão da infraestrutura urbana.',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/fabiano-morfelle',
                'redes_sociais' => [
                    'instagram' => 'fabianomorfelle',
                    'facebook' => 'fabianomorfelle',
                ],
            ],
        ];

        $vereadoresMap = [];
        foreach ($vereadoresData as $data) {
            $partido = $data['partido'];
            $cargo = $data['cargo'] ?? 'Vereador';
            unset($data['partido'], $data['cargo']);

            // Create or update vereador
            $vereador = Vereador::updateOrCreate(
                ['nome' => $data['nome']],
                array_merge($data, ['ativo' => true])
            );

            $vereadoresMap[$vereador->slug] = $vereador;

            // Create mandato for current legislatura
            Mandato::updateOrCreate(
                [
                    'vereador_id' => $vereador->id,
                    'legislatura_id' => $legislatura->id,
                ],
                [
                    'partido_id' => $partidosMap[$partido]->id,
                    'cargo' => $cargo,
                    'inicio' => '2025-01-01',
                    'fim' => '2028-12-31',
                    'em_exercicio' => true,
                ]
            );
        }

        $this->command->info('✅ Vereadores criados/atualizados: ' . count($vereadoresData));

        // ==========================================
        // 4. Votações Históricas
        // ==========================================
        $slugs = array_keys($vereadoresMap);

        $votacoesData = [
            // Votação 1 - IPTU
            [
                'protocolo' => 'PL-001/2026',
                'titulo' => 'Reajuste do IPTU',
                'subtitulo' => 'Atualização da Planta Genérica de Valores',
                'descricao' => 'Projeto de Lei que dispõe sobre a atualização da Planta Genérica de Valores do Município de Tijucas e estabelece reajuste progressivo do IPTU ao longo de 3 anos, buscando adequar a arrecadação municipal às necessidades de investimento em infraestrutura.',
                'ementa' => 'Dispõe sobre a atualização da Planta Genérica de Valores do Município de Tijucas.',
                'tipo' => 'PROJETO_LEI',
                'data' => '2026-01-20',
                'sessao' => '1ª Sessão Ordinária de 2026',
                'tags' => ['IPTU', 'Tributos', 'Orçamento'],
                'votos' => [
                    ['slug' => 'maria-edesia-da-silva-vargas', 'voto' => 'SIM'],
                    ['slug' => 'julio-cesar-bucoski', 'voto' => 'SIM'],
                    ['slug' => 'nadir-olindina-amorim', 'voto' => 'SIM'],
                    ['slug' => 'mauricio-poli', 'voto' => 'SIM'],
                    ['slug' => 'paulo-cesar-pereira', 'voto' => 'SIM'],
                    ['slug' => 'ecio-helio-de-melo', 'voto' => 'SIM'],
                    ['slug' => 'esau-bayer', 'voto' => 'NAO'],
                    ['slug' => 'fabiano-morfelle', 'voto' => 'NAO'],
                    ['slug' => 'jose-vicente-de-souza-e-silva', 'voto' => 'NAO'],
                    ['slug' => 'lizandra-dadam', 'voto' => 'NAO'],
                    ['slug' => 'renato-laurindo-junior', 'voto' => 'NAO'],
                    ['slug' => 'claudio-eduardo-de-souza', 'voto' => 'ABSTENCAO', 'justificativa' => 'Conflito de interesse por ser proprietário de imóveis na região afetada.'],
                    ['slug' => 'flavio-henrique-souza', 'voto' => 'NAO_VOTOU', 'justificativa' => 'Ausente por motivos de saúde.'],
                ],
            ],
            // Votação 2 - Praça Nova
            [
                'protocolo' => 'PL-002/2026',
                'titulo' => 'Construção da Praça Central',
                'subtitulo' => 'Revitalização do Centro Histórico',
                'descricao' => 'Projeto de Lei autorizando a construção de uma nova praça no centro histórico de Tijucas, incluindo área de lazer, playground, academia ao ar livre e espaço para eventos culturais.',
                'ementa' => 'Autoriza a construção da Praça Central no Centro Histórico.',
                'tipo' => 'PROJETO_LEI',
                'data' => '2026-01-27',
                'sessao' => '2ª Sessão Ordinária de 2026',
                'tags' => ['Urbanismo', 'Lazer', 'Centro'],
                'votos' => [
                    ['slug' => 'maria-edesia-da-silva-vargas', 'voto' => 'SIM'],
                    ['slug' => 'julio-cesar-bucoski', 'voto' => 'SIM'],
                    ['slug' => 'nadir-olindina-amorim', 'voto' => 'SIM'],
                    ['slug' => 'mauricio-poli', 'voto' => 'SIM'],
                    ['slug' => 'paulo-cesar-pereira', 'voto' => 'SIM'],
                    ['slug' => 'ecio-helio-de-melo', 'voto' => 'SIM'],
                    ['slug' => 'esau-bayer', 'voto' => 'SIM'],
                    ['slug' => 'fabiano-morfelle', 'voto' => 'SIM'],
                    ['slug' => 'jose-vicente-de-souza-e-silva', 'voto' => 'SIM'],
                    ['slug' => 'lizandra-dadam', 'voto' => 'SIM'],
                    ['slug' => 'renato-laurindo-junior', 'voto' => 'SIM'],
                    ['slug' => 'claudio-eduardo-de-souza', 'voto' => 'SIM'],
                    ['slug' => 'flavio-henrique-souza', 'voto' => 'SIM'],
                ],
            ],
            // Votação 3 - Creche
            [
                'protocolo' => 'PL-003/2026',
                'titulo' => 'Construção de Creche no Bairro São Roque',
                'subtitulo' => 'Ampliação da rede de educação infantil',
                'descricao' => 'Projeto de Lei que autoriza a construção de uma nova creche municipal no Bairro São Roque, com capacidade para 120 crianças, visando atender a crescente demanda por vagas na educação infantil.',
                'ementa' => 'Autoriza construção de Centro de Educação Infantil no Bairro São Roque.',
                'tipo' => 'PROJETO_LEI',
                'data' => '2026-01-28',
                'sessao' => '2ª Sessão Ordinária de 2026',
                'tags' => ['Educação', 'Creche', 'São Roque'],
                'votos' => [
                    ['slug' => 'maria-edesia-da-silva-vargas', 'voto' => 'SIM'],
                    ['slug' => 'julio-cesar-bucoski', 'voto' => 'SIM'],
                    ['slug' => 'nadir-olindina-amorim', 'voto' => 'SIM'],
                    ['slug' => 'mauricio-poli', 'voto' => 'SIM'],
                    ['slug' => 'paulo-cesar-pereira', 'voto' => 'SIM'],
                    ['slug' => 'ecio-helio-de-melo', 'voto' => 'SIM'],
                    ['slug' => 'esau-bayer', 'voto' => 'SIM'],
                    ['slug' => 'fabiano-morfelle', 'voto' => 'SIM'],
                    ['slug' => 'jose-vicente-de-souza-e-silva', 'voto' => 'SIM'],
                    ['slug' => 'lizandra-dadam', 'voto' => 'SIM'],
                    ['slug' => 'renato-laurindo-junior', 'voto' => 'SIM'],
                    ['slug' => 'claudio-eduardo-de-souza', 'voto' => 'SIM'],
                    ['slug' => 'flavio-henrique-souza', 'voto' => 'SIM'],
                ],
            ],
            // Votação 4 - Novo Código de Obras
            [
                'protocolo' => 'PL-004/2026',
                'titulo' => 'Novo Código de Obras e Edificações',
                'subtitulo' => 'Modernização das normas de construção',
                'descricao' => 'Projeto de Lei que institui o novo Código de Obras e Edificações do município, atualizando normas técnicas e procedimentos para aprovação de projetos de construção civil.',
                'ementa' => 'Institui o Código de Obras e Edificações do Município de Tijucas.',
                'tipo' => 'PROJETO_LEI',
                'data' => '2026-02-03',
                'sessao' => '3ª Sessão Ordinária de 2026',
                'tags' => ['Urbanismo', 'Construção', 'Legislação'],
                'votos' => [
                    ['slug' => 'maria-edesia-da-silva-vargas', 'voto' => 'SIM'],
                    ['slug' => 'julio-cesar-bucoski', 'voto' => 'SIM'],
                    ['slug' => 'nadir-olindina-amorim', 'voto' => 'SIM'],
                    ['slug' => 'mauricio-poli', 'voto' => 'SIM'],
                    ['slug' => 'paulo-cesar-pereira', 'voto' => 'NAO'],
                    ['slug' => 'ecio-helio-de-melo', 'voto' => 'SIM'],
                    ['slug' => 'esau-bayer', 'voto' => 'NAO'],
                    ['slug' => 'fabiano-morfelle', 'voto' => 'ABSTENCAO', 'justificativa' => 'Empresário do setor de construção civil, declara possível conflito de interesse.'],
                    ['slug' => 'jose-vicente-de-souza-e-silva', 'voto' => 'NAO'],
                    ['slug' => 'lizandra-dadam', 'voto' => 'SIM'],
                    ['slug' => 'renato-laurindo-junior', 'voto' => 'SIM'],
                    ['slug' => 'claudio-eduardo-de-souza', 'voto' => 'SIM'],
                    ['slug' => 'flavio-henrique-souza', 'voto' => 'SIM'],
                ],
            ],
            // Votação 5 - Feira do Produtor Rural
            [
                'protocolo' => 'REQ-001/2026',
                'titulo' => 'Criação da Feira do Produtor Rural',
                'subtitulo' => 'Valorização da agricultura familiar',
                'descricao' => 'Requerimento solicitando ao Executivo Municipal a criação de uma Feira do Produtor Rural permanente, com espaço coberto e infraestrutura adequada para comercialização de produtos locais.',
                'ementa' => 'Solicita criação de Feira do Produtor Rural.',
                'tipo' => 'REQUERIMENTO',
                'data' => '2026-01-15',
                'sessao' => '1ª Sessão Ordinária de 2026',
                'tags' => ['Agricultura', 'Feira', 'Produtor Rural'],
                'votos' => [
                    ['slug' => 'maria-edesia-da-silva-vargas', 'voto' => 'SIM'],
                    ['slug' => 'julio-cesar-bucoski', 'voto' => 'SIM'],
                    ['slug' => 'nadir-olindina-amorim', 'voto' => 'SIM'],
                    ['slug' => 'mauricio-poli', 'voto' => 'SIM'],
                    ['slug' => 'paulo-cesar-pereira', 'voto' => 'SIM'],
                    ['slug' => 'ecio-helio-de-melo', 'voto' => 'SIM'],
                    ['slug' => 'esau-bayer', 'voto' => 'SIM'],
                    ['slug' => 'fabiano-morfelle', 'voto' => 'SIM'],
                    ['slug' => 'jose-vicente-de-souza-e-silva', 'voto' => 'SIM'],
                    ['slug' => 'lizandra-dadam', 'voto' => 'SIM'],
                    ['slug' => 'renato-laurindo-junior', 'voto' => 'SIM'],
                    ['slug' => 'claudio-eduardo-de-souza', 'voto' => 'SIM'],
                    ['slug' => 'flavio-henrique-souza', 'voto' => 'SIM'],
                ],
            ],
            // Votação 6 - Taxa de Coleta de Lixo
            [
                'protocolo' => 'PL-005/2026',
                'titulo' => 'Reajuste da Taxa de Coleta de Lixo',
                'subtitulo' => 'Adequação aos custos do serviço',
                'descricao' => 'Projeto de Lei que autoriza o reajuste da Taxa de Coleta de Resíduos Sólidos para adequação aos custos operacionais do serviço, com aplicação de descontos para contribuintes de baixa renda.',
                'ementa' => 'Dispõe sobre o reajuste da Taxa de Coleta de Resíduos Sólidos.',
                'tipo' => 'PROJETO_LEI',
                'data' => '2026-02-01',
                'sessao' => '3ª Sessão Ordinária de 2026',
                'tags' => ['Tributos', 'Lixo', 'Saneamento'],
                'votos' => [
                    ['slug' => 'maria-edesia-da-silva-vargas', 'voto' => 'SIM'],
                    ['slug' => 'julio-cesar-bucoski', 'voto' => 'SIM'],
                    ['slug' => 'nadir-olindina-amorim', 'voto' => 'SIM'],
                    ['slug' => 'mauricio-poli', 'voto' => 'NAO'],
                    ['slug' => 'paulo-cesar-pereira', 'voto' => 'NAO'],
                    ['slug' => 'ecio-helio-de-melo', 'voto' => 'NAO'],
                    ['slug' => 'esau-bayer', 'voto' => 'NAO'],
                    ['slug' => 'fabiano-morfelle', 'voto' => 'NAO'],
                    ['slug' => 'jose-vicente-de-souza-e-silva', 'voto' => 'NAO'],
                    ['slug' => 'lizandra-dadam', 'voto' => 'NAO'],
                    ['slug' => 'renato-laurindo-junior', 'voto' => 'NAO'],
                    ['slug' => 'claudio-eduardo-de-souza', 'voto' => 'ABSTENCAO'],
                    ['slug' => 'flavio-henrique-souza', 'voto' => 'NAO_VOTOU'],
                ],
            ],
            // Votação 7 - Dia do Voluntário
            [
                'protocolo' => 'PL-006/2026',
                'titulo' => 'Institui o Dia Municipal do Voluntário',
                'subtitulo' => 'Reconhecimento ao trabalho voluntário',
                'descricao' => 'Projeto de Lei que institui o Dia Municipal do Voluntário, a ser comemorado no dia 5 de dezembro, com programação especial de reconhecimento às entidades e voluntários do município.',
                'ementa' => 'Institui o Dia Municipal do Voluntário.',
                'tipo' => 'PROJETO_LEI',
                'data' => '2026-02-02',
                'sessao' => '3ª Sessão Ordinária de 2026',
                'tags' => ['Social', 'Voluntariado', 'Cultura'],
                'votos' => [
                    ['slug' => 'maria-edesia-da-silva-vargas', 'voto' => 'SIM'],
                    ['slug' => 'julio-cesar-bucoski', 'voto' => 'SIM'],
                    ['slug' => 'nadir-olindina-amorim', 'voto' => 'SIM'],
                    ['slug' => 'mauricio-poli', 'voto' => 'SIM'],
                    ['slug' => 'paulo-cesar-pereira', 'voto' => 'SIM'],
                    ['slug' => 'ecio-helio-de-melo', 'voto' => 'SIM'],
                    ['slug' => 'esau-bayer', 'voto' => 'SIM'],
                    ['slug' => 'fabiano-morfelle', 'voto' => 'SIM'],
                    ['slug' => 'jose-vicente-de-souza-e-silva', 'voto' => 'SIM'],
                    ['slug' => 'lizandra-dadam', 'voto' => 'SIM'],
                    ['slug' => 'renato-laurindo-junior', 'voto' => 'SIM'],
                    ['slug' => 'claudio-eduardo-de-souza', 'voto' => 'SIM'],
                    ['slug' => 'flavio-henrique-souza', 'voto' => 'SIM'],
                ],
            ],
        ];

        foreach ($votacoesData as $votacaoData) {
            $votos = $votacaoData['votos'];
            unset($votacaoData['votos']);

            $votacao = Votacao::updateOrCreate(
                ['protocolo' => $votacaoData['protocolo']],
                $votacaoData
            );

            foreach ($votos as $votoData) {
                $vereador = $vereadoresMap[$votoData['slug']] ?? null;
                if (!$vereador) {
                    continue;
                }

                VotoRegistro::updateOrCreate(
                    [
                        'votacao_id' => $votacao->id,
                        'vereador_id' => $vereador->id,
                    ],
                    [
                        'voto' => $votoData['voto'],
                        'justificativa' => $votoData['justificativa'] ?? null,
                    ]
                );
            }

            // Recalcular votos
            $votacao->recalcularVotos();
        }

        $this->command->info('✅ Votações criadas: ' . count($votacoesData));
        $this->command->info('');
        $this->command->info('📊 Resumo:');
        $this->command->info('   - Vereadores: ' . Vereador::count());
        $this->command->info('   - Votações: ' . Votacao::count());
        $this->command->info('   - Votos registrados: ' . VotoRegistro::count());
    }
}
