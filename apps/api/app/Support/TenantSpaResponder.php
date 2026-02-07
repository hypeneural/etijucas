<?php

namespace App\Support;

use Illuminate\Http\Response as HttpResponse;

class TenantSpaResponder
{
    /**
     * Serve the React SPA shell when SEO SSR is not applicable.
     */
    public static function make(): HttpResponse
    {
        $indexPath = public_path('app/index.html');

        if (file_exists($indexPath)) {
            return response(file_get_contents($indexPath), 200, [
                'Content-Type' => 'text/html; charset=UTF-8',
                'X-App-Renderer' => 'spa',
            ]);
        }

        return response((string) view('welcome'), 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'X-App-Renderer' => 'spa',
        ]);
    }
}
