<?php

namespace App\Http\Controllers\Api\{{Feature}};

use App\Http\Controllers\Controller;
use App\Http\Requests\{{Feature}}\Store{{Model}}Request;
use App\Http\Requests\{{Feature}}\Update{{Model}}Request;
use App\Http\Resources\{{Feature}}\{{Model}}Collection;
use App\Http\Resources\{{Feature}}\{{Model}}Resource;
use App\Models\{{Model}};
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class {{Model}}Controller extends Controller
{
    public function index(Request $request): {{Model}}Collection
    {
        $perPage = min($request->input('perPage', 15), 50);
        $items = {{Model}}::query()->paginate($perPage);

        return new {{Model}}Collection($items);
    }

    public function show(Request $request, {{Model}} ${{model}}): JsonResponse
    {
        return response()->json([
            'data' => new {{Model}}Resource(${{model}}),
            'success' => true,
        ]);
    }

    public function store(Store{{Model}}Request $request): JsonResponse
    {
        $validated = $request->validated();

        $item = {{Model}}::create([
{{storeMapping}}
        ]);

        return response()->json([
            'data' => new {{Model}}Resource($item),
            'success' => true,
            'message' => '{{Model}} created successfully',
        ], 201);
    }

    public function update(Update{{Model}}Request $request, {{Model}} ${{model}}): JsonResponse
    {
        $validated = $request->validated();
        $updateData = [];

{{updateMapping}}

        ${{model}}->update($updateData);

        return response()->json([
            'data' => new {{Model}}Resource(${{model}}),
            'success' => true,
            'message' => '{{Model}} updated successfully',
        ]);
    }

    public function destroy(Request $request, {{Model}} ${{model}}): JsonResponse
    {
        ${{model}}->delete();

        return response()->json([
            'success' => true,
            'message' => '{{Model}} deleted successfully',
        ]);
    }
}
