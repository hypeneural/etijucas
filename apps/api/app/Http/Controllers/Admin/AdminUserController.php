<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AdminUserController extends Controller
{
    /**
     * List users with filters and pagination.
     * 
     * GET /api/v1/admin/users
     */
    public function index(Request $request): JsonResponse
    {
        $users = QueryBuilder::for(User::class)
            ->allowedFilters([
                AllowedFilter::exact('bairro_id'),
                AllowedFilter::exact('phone_verified'),
                AllowedFilter::scope('verified'),
                AllowedFilter::callback('search', function ($query, $value) {
                    $query->where(function ($q) use ($value) {
                        $q->where('nome', 'like', "%{$value}%")
                            ->orWhere('email', 'like', "%{$value}%")
                            ->orWhere('phone', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::callback('role', function ($query, $value) {
                    $query->role($value);
                }),
            ])
            ->allowedSorts(['nome', 'created_at', 'updated_at'])
            ->defaultSort('-created_at')
            ->with(['bairro', 'roles'])
            ->paginate($request->input('perPage', 20));

        return response()->json([
            'data' => UserResource::collection($users),
            'meta' => [
                'total' => $users->total(),
                'page' => $users->currentPage(),
                'perPage' => $users->perPage(),
                'lastPage' => $users->lastPage(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
        ]);
    }

    /**
     * Get a specific user.
     * 
     * GET /api/v1/admin/users/{id}
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($user->load('bairro', 'roles')),
        ]);
    }

    /**
     * Update a user.
     * 
     * PUT /api/v1/admin/users/{id}
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['sometimes', 'string', 'min:2', 'max:100'],
            'email' => ['sometimes', 'nullable', 'email', 'unique:users,email,' . $user->id],
            'bairro_id' => ['sometimes', 'nullable', 'uuid', 'exists:bairros,id'],
            'phone_verified' => ['sometimes', 'boolean'],
        ]);

        $user->update($validated);

        return response()->json([
            'data' => new UserResource($user->fresh()->load('bairro', 'roles')),
            'message' => 'Usuário atualizado com sucesso',
        ]);
    }

    /**
     * Delete a user (soft delete).
     * 
     * DELETE /api/v1/admin/users/{id}
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Usuário removido com sucesso',
        ]);
    }

    /**
     * Assign roles to a user.
     * 
     * POST /api/v1/admin/users/{id}/roles
     */
    public function assignRoles(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'roles' => ['required', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ]);

        $user->syncRoles($validated['roles']);

        return response()->json([
            'data' => new UserResource($user->fresh()->load('bairro', 'roles')),
            'message' => 'Roles atualizadas com sucesso',
        ]);
    }
}
