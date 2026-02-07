<?php

namespace Tests\Unit\Models;

use App\Models\Module;
use Tests\TestCase;

class ModuleIdentifierTest extends TestCase
{
    public function test_normalizes_legacy_identifiers_to_canonical_module_key(): void
    {
        $this->assertSame('reports', Module::normalizeKey('denuncias'));
        $this->assertSame('tourism', Module::normalizeKey('turismo'));
        $this->assertSame('phones', Module::normalizeKey('telefones'));
        $this->assertSame('trash', Module::normalizeKey('coleta-lixo'));
        $this->assertSame('masses', Module::normalizeKey('missas'));
        $this->assertSame('vehicles', Module::normalizeKey('veiculos'));
        $this->assertSame('weather', Module::normalizeKey('tempo'));
        $this->assertSame('voting', Module::normalizeKey('votacoes'));
        $this->assertSame('council', Module::normalizeKey('vereadores'));
    }

    public function test_keeps_canonical_module_keys_stable(): void
    {
        $this->assertSame('forum', Module::normalizeKey('forum'));
        $this->assertSame('events', Module::normalizeKey('events'));
        $this->assertSame('reports', Module::normalizeKey('reports'));
        $this->assertSame('tourism', Module::normalizeKey('tourism'));
    }
}
