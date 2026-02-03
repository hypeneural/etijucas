<?php

namespace App\Domains\Reports\Http\Controllers;

use App\Domains\Reports\Http\Resources\ReportCategoryResource;
use App\Domains\Reports\Models\ReportCategory;
use App\Http\Controllers\Controller;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReportCategoryController extends Controller
{
    /**
     * GET /api/v1/report-categories
     * List all active categories
     */
    public function index(): AnonymousResourceCollection
    {
        $categories = ReportCategory::active()
            ->ordered()
            ->get();

        return ReportCategoryResource::collection($categories);
    }
}
