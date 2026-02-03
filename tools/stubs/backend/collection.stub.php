<?php

namespace App\Http\Resources\{{Feature}};

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class {{Model}}Collection extends ResourceCollection
{
    public $collects = {{Model}}Resource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
        ];
    }

    public function with(Request $request): array
    {
        return [
            'meta' => [
                'total' => $this->resource->total(),
                'page' => $this->resource->currentPage(),
                'perPage' => $this->resource->perPage(),
                'lastPage' => $this->resource->lastPage(),
                'from' => $this->resource->firstItem(),
                'to' => $this->resource->lastItem(),
            ],
        ];
    }
}
