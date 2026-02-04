<?php

use App\Domains\Reports\Models\CitizenReport;

$report = CitizenReport::with('media')->latest()->first();

if (!$report) {
    echo "No reports found.\n";
    exit;
}

echo "Report ID: " . $report->id . "\n";
echo "Media Count: " . $report->media->count() . "\n";

foreach ($report->media as $media) {
    echo " - Media ID: " . $media->id . "\n";
    echo " - Collection: " . $media->collection_name . "\n";
    echo " - URL: " . $media->getUrl() . "\n";
    echo " - Path: " . $media->getPath() . "\n";
}
