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
        // ==========================================
        $vereadoresData = [
            [
                'nome' => 'Cláudio Eduardo de Souza',
                'nascimento' => '1987-12-06',
                'telefone' => '(48) 3263-0921',
                'email' => 'claudiodojornal@gmail.com',
                'partido' => 'MDB',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/claudio-eduardo-de-souza-100002',
                'redes_sociais' => [
                    'instagram' => 'claudiodojornal',
                    'facebook' => 'claudiodojornal',
                ],
            ],
            [
                'nome' => 'Écio Hélio de Melo',
                'partido' => 'PL',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/ecio-helio-de-melo',
            ],
            [
                'nome' => 'Esaú Bayer',
                'partido' => 'PL',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/esau-bayer',
            ],
            [
                'nome' => 'Flávio Henrique Souza',
                'partido' => 'MDB',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/flavio-henrique-souza',
            ],
            [
                'nome' => 'Júlio Cesar Bucoski',
                'partido' => 'PP',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/julio-cesar-bucoski',
            ],
            [
                'nome' => 'Lizandra Dadam',
                'partido' => 'PDT',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/lizandra-dadam',
            ],
            [
                'nome' => 'Maria Edésia da Silva Vargas',
                'partido' => 'MDB',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/maria-edesia-vargas',
            ],
            [
                'nome' => 'Maurício Poli',
                'partido' => 'MDB',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/mauricio-poli',
            ],
            [
                'nome' => 'Nadir Olindina Amorim',
                'partido' => 'MDB',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/nadir-olindina-amorim',
            ],
            [
                'nome' => 'Paulo Cesar Pereira',
                'partido' => 'MDB',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/paulo-cesar-pereira',
            ],
            [
                'nome' => 'Renato Laurindo Júnior',
                'partido' => 'PSDB',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/renato-laurindo-junior',
            ],
            [
                'nome' => 'José Vicente de Souza e Silva',
                'partido' => 'PL',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/jose-vicente-souza',
            ],
            [
                'nome' => 'Fabiano Morfelle',
                'partido' => 'MDB',
                'site_oficial_url' => 'https://www.camaratijucas.sc.gov.br/vereador/fabiano-morfelle',
            ],
        ];

        $vereadoresMap = [];
        foreach ($vereadoresData as $data) {
            $partido = $data['partido'];
            unset($data['partido']);

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
                    'cargo' => 'Vereador',
                    'inicio' => '2025-01-01',
                    'fim' => '2028-12-31',
                    'em_exercicio' => true,
                ]
            );
        }

        $this->command->info('✅ Vereadores criados: ' . count($vereadoresData));

        // ==========================================
        // 4. Votação de Exemplo (IPTU)
        // ==========================================
        $votacao = Votacao::updateOrCreate(
            ['protocolo' => 'PL-001-2026'],
            [
                'titulo' => 'Aumento do IPTU',
                'subtitulo' => 'Projeto aprovado por 6 a 5',
                'descricao' => 'Votação referente ao projeto de reajuste do IPTU em Tijucas. O projeto prevê atualização da planta genérica de valores e reajuste progressivo ao longo de 3 anos.',
                'ementa' => 'Dispõe sobre a atualização da Planta Genérica de Valores do Município de Tijucas e estabelece reajuste progressivo do IPTU.',
                'tipo' => 'PROJETO_LEI',
                'status' => 'APROVADO',
                'data' => '2026-01-20',
                'sessao' => '1ª Sessão Ordinária de 2026',
                'url_fonte' => 'https://www.camaratijucas.sc.gov.br/sessoes/2026/01/20',
                'tags' => ['IPTU', 'Tributos', 'Impostos'],
            ]
        );

        // Votos na votação
        $votosData = [
            'ecio-helio-de-melo' => 'SIM',
            'julio-cesar-bucoski' => 'SIM',
            'maria-edesia-da-silva-vargas' => 'SIM',
            'mauricio-poli' => 'SIM',
            'nadir-olindina-amorim' => 'SIM',
            'paulo-cesar-pereira' => 'SIM',
            'esau-bayer' => 'NAO',
            'fabiano-morfelle' => 'NAO',
            'jose-vicente-de-souza-e-silva' => 'NAO',
            'lizandra-dadam' => 'NAO',
            'renato-laurindo-junior' => 'NAO',
            'claudio-eduardo-de-souza' => 'ABSTENCAO',
            'flavio-henrique-souza' => 'NAO_VOTOU',
        ];

        foreach ($votosData as $slug => $voto) {
            $vereador = $vereadoresMap[$slug] ?? null;
            if (!$vereador) {
                continue;
            }

            VotoRegistro::updateOrCreate(
                [
                    'votacao_id' => $votacao->id,
                    'vereador_id' => $vereador->id,
                ],
                [
                    'voto' => $voto,
                    'justificativa' => $voto === 'ABSTENCAO'
                        ? 'Conflito de interesse por ser proprietário de imóveis na região afetada.'
                        : null,
                ]
            );
        }

        // Recalcular votos
        $votacao->recalcularVotos();

        $this->command->info('✅ Votação de exemplo criada: ' . $votacao->titulo);
        $this->command->info("   Resultado: {$votacao->votos_sim} SIM x {$votacao->votos_nao} NÃO");
    }
}
