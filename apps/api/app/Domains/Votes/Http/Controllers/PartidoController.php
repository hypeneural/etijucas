<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Controllers;

use App\Domains\Votes\Http\Resources\LegislaturaResource;
use App\Domains\Votes\Http\Resources\PartidoResource;
use App\Domains\Votes\Models\Legislatura;
use App\Domains\Votes\Models\Partido;
use App\Http\Controllers\Controller;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PartidoController extends Controller
{
    /**
     * GET /api/v1/partidos
     * List all political parties
     */
    public function index(): AnonymousResourceCollection
    {
        $partidos = Partido::orderBy('sigla')->get();

        return PartidoResource::collection($partidos);
    }

    /**
     * GET /api/v1/legislaturas
     * List all legislative terms
     */
    public function legislaturas(): AnonymousResourceCollection
    {
        $legislaturas = Legislatura::orderByDesc('ano_inicio')->get();

        return LegislaturaResource::collection($legislaturas);
    }
}
