<?php

namespace App\Domains\Reports\Http\Controllers;

use App\Domains\Reports\Models\CitizenReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportMapController
{
    /**
     * Get reports for map visualization
     * 
     * Optimized endpoint for map pins with minimal data.
     * Supports bbox filtering for viewport-based loading.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'bbox' => 'nullable|string', // minLat,minLon,maxLat,maxLon
            'zoom' => 'nullable|integer|min:1|max:20',
            'status' => 'nullable|string',
            'category' => 'nullable|string',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $limit = min($request->input('limit', 200), 500);

        $query = CitizenReport::with(['category:id,name,slug,icon,color', 'media'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->orderBy('created_at', 'desc');

        // Filter by bounding box (viewport)
        if ($request->has('bbox')) {
            $bbox = explode(',', $request->input('bbox'));
            if (count($bbox) === 4) {
                $minLat = floatval($bbox[0]);
                $minLon = floatval($bbox[1]);
                $maxLat = floatval($bbox[2]);
                $maxLon = floatval($bbox[3]);

                $query->whereBetween('latitude', [$minLat, $maxLat])
                    ->whereBetween('longitude', [$minLon, $maxLon]);
            }
        }

        // Filter by status (comma-separated)
        if ($request->has('status') && $request->input('status') !== 'all') {
            $statuses = explode(',', $request->input('status'));
            $query->whereIn('status', $statuses);
        }

        // Filter by category slugs (comma-separated)
        if ($request->has('category')) {
            $slugs = explode(',', $request->input('category'));
            $query->whereHas('category', fn($q) => $q->whereIn('slug', $slugs));
        }

        $reports = $query->limit($limit)->get();

        // Transform to lightweight map format
        $mapReports = $reports->map(function (CitizenReport $report) {
            // Get up to 3 images for carousel
            // Use getMedia() to ensure we get the collection correctly and then map to URLs
            $images = $report->getMedia('report_images')->take(3)->map(fn($m) => [
                'url' => $m->getUrl(),
                'thumb' => $m->hasGeneratedConversion('thumb') ? $m->getUrl('thumb') : $m->getUrl(),
            ])->values()->all();

            return [
                'id' => $report->id,
                'lat' => (float) $report->latitude,
                'lon' => (float) $report->longitude,
                'category' => $report->category ? [
                    'slug' => $report->category->slug,
                    'name' => $report->category->name,
                    'icon' => $report->category->icon,
                    'color' => $report->category->color,
                ] : null,
                'status' => $report->status,
                'title' => $report->title,
                'description' => $report->description ? mb_substr($report->description, 0, 200) : null,
                'protocol' => $report->protocol,
                'address' => $report->address,
                'addressShort' => $this->shortenAddress($report->address),
                'images' => $images,
                'thumbUrl' => $images[0]['thumb'] ?? null,
                'createdAt' => $report->created_at->toISOString(),
            ];
        });

        return response()->json([
            'bbox' => $request->input('bbox'),
            'zoom' => $request->input('zoom'),
            'reports' => $mapReports,
            'total' => $mapReports->count(),
        ]);
    }

    /**
     * Shorten address for map preview
     */
    private function shortenAddress(?string $address): string
    {
        if (!$address) {
            return 'Tijucas, SC';
        }

        // Remove country and state suffix
        $short = preg_replace('/, (Santa Catarina|SC|Brasil|Brazil)$/i', '', $address);

        // Limit to ~40 chars
        if (strlen($short) > 40) {
            $short = substr($short, 0, 37) . '...';
        }

        return $short;
    }
}
