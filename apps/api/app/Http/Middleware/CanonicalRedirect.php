<?php

namespace App\Http\Middleware;

use App\Models\CityDomain;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CanonicalRedirect Middleware
 * 
 * Redirects non-canonical domains to canonical with 301.
 * Ensures SEO best practices by avoiding duplicate content.
 */
class CanonicalRedirect
{
    public function handle(Request $request, Closure $next): Response
    {
        // Skip for API routes - no redirect needed
        if ($request->is('api/*')) {
            return $next($request);
        }

        // Skip for internal requests (dev, localhost)
        $host = $request->getHost();
        if (in_array($host, ['localhost', '127.0.0.1'])) {
            return $next($request);
        }

        // Find domain config
        $domainConfig = CityDomain::where('domain', $host)->first();

        // If domain has redirect_to set, perform 301 redirect
        if ($domainConfig && $domainConfig->redirect_to) {
            $canonicalUrl = 'https://' . $domainConfig->redirect_to . $request->getRequestUri();
            return redirect($canonicalUrl, 301);
        }

        return $next($request);
    }
}
