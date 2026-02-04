<?php

use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Api\BairroController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\OtpController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application.
| These routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group.
|
*/

// =====================================================
// API v1 Routes
// =====================================================
Route::prefix('v1')->group(function () {

    // =====================================================
    // Public Routes
    // =====================================================

    // Auth Routes
    Route::prefix('auth')->group(function () {
        Route::post('send-otp', [OtpController::class, 'send'])
            ->middleware('throttle:10,1'); // 10 requests per minute

        Route::post('verify-otp', [OtpController::class, 'verify'])
            ->middleware('throttle:10,1');

        Route::post('resend-otp', [OtpController::class, 'resend'])
            ->middleware('throttle:3,1'); // Stricter: 3 per minute

        Route::post('login', [AuthController::class, 'login'])
            ->middleware('throttle:10,1'); // 10 attempts per minute

        Route::post('register', [AuthController::class, 'register'])
            ->middleware('throttle:5,1'); // 5 registrations per minute

        Route::post('forgot-password', [\App\Http\Controllers\Auth\ForgotPasswordController::class, 'sendResetLink'])
            ->middleware('throttle:5,1');
        Route::post('reset-password', [\App\Http\Controllers\Auth\ResetPasswordController::class, 'reset'])
            ->middleware('throttle:5,1');

        // Passwordless OTP Login (WhatsApp)
        Route::prefix('otp')->group(function () {
            Route::post('login', [\App\Http\Controllers\Auth\PasswordlessAuthController::class, 'requestOtp'])
                ->middleware('throttle:5,1');
            Route::get('session/{sid}', [\App\Http\Controllers\Auth\PasswordlessAuthController::class, 'getSessionContext'])
                ->middleware('throttle:30,1');
            Route::post('verify', [\App\Http\Controllers\Auth\PasswordlessAuthController::class, 'verifyOtp'])
                ->middleware('throttle:10,1');
        });

        // Authenticated profile completion (requires token from OTP verify)
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('profile/complete', [\App\Http\Controllers\Auth\PasswordlessAuthController::class, 'completeProfile']);
        });
    });

    // Public Data (cached)
    Route::get('bairros', [BairroController::class, 'index'])
        ->middleware('cache.headers:static');

    // =====================================================
    // Forum Public Routes (no auth required, with optional auth)
    // =====================================================
    Route::prefix('forum')->middleware('throttle:forum')->group(function () {
        // Public read endpoints - supports optional auth for liked/saved status
        Route::get('topics', [\App\Http\Controllers\Api\Forum\TopicController::class, 'index']);
        Route::get('topics/{topic}', [\App\Http\Controllers\Api\Forum\TopicController::class, 'show']);
        Route::get('topics/{topic}/comments', [\App\Http\Controllers\Api\Forum\CommentController::class, 'index']);
    });

    // =====================================================
    // Events Public Routes (no auth required, with optional auth)
    // =====================================================
    Route::prefix('events')->group(function () {
        // List and filters
        Route::get('/', [\App\Http\Controllers\Api\Events\EventController::class, 'index']);
        Route::get('/upcoming', [\App\Http\Controllers\Api\Events\EventController::class, 'upcoming']);
        Route::get('/today', [\App\Http\Controllers\Api\Events\EventController::class, 'today']);
        Route::get('/weekend', [\App\Http\Controllers\Api\Events\EventController::class, 'weekend']);
        Route::get('/featured', [\App\Http\Controllers\Api\Events\EventController::class, 'featured']);

        // V2 Optimized endpoints
        Route::get('/home-featured', [\App\Http\Controllers\Api\Events\EventController::class, 'homeFeatured']);
        Route::get('/calendar-summary', [\App\Http\Controllers\Api\Events\EventController::class, 'calendarSummary']);
        Route::get('/search', [\App\Http\Controllers\Api\Events\EventController::class, 'search']);
        Route::get('/date/{date}', [\App\Http\Controllers\Api\Events\EventController::class, 'byDate']);
        Route::get('/month/{year}/{month}', [\App\Http\Controllers\Api\Events\EventController::class, 'byMonth']);
        Route::get('/category/{slug}', [\App\Http\Controllers\Api\Events\EventController::class, 'byCategory']);
        Route::get('/bairro/{bairro}', [\App\Http\Controllers\Api\Events\EventController::class, 'byBairro']);
        Route::get('/venue/{venue}', [\App\Http\Controllers\Api\Events\EventController::class, 'byVenue']);
        Route::get('/tag/{slug}', [\App\Http\Controllers\Api\Events\EventController::class, 'byTag']);
        Route::get('/organizer/{organizer}', [\App\Http\Controllers\Api\Events\EventController::class, 'byOrganizer']);

        // Categories and tags
        Route::get('/categories', [\App\Http\Controllers\Api\Events\EventCategoryController::class, 'index']);
        Route::get('/tags', [\App\Http\Controllers\Api\Events\EventTagController::class, 'index']);
        Route::get('/tags/trending', [\App\Http\Controllers\Api\Events\EventTagController::class, 'trending']);

        // Event details and attendees (public)
        Route::get('/{event}', [\App\Http\Controllers\Api\Events\EventController::class, 'show']);
        Route::get('/{event}/attendees', [\App\Http\Controllers\Api\Events\EventRsvpController::class, 'attendees']);
    });

    // =====================================================
    // Tourism Public Routes
    // =====================================================
    Route::prefix('tourism')->group(function () {
        Route::get('spots', [\App\Domains\Tourism\Http\Controllers\TourismSpotController::class, 'index'])->name('tourism.index');
        Route::get('spots/{id}', [\App\Domains\Tourism\Http\Controllers\TourismSpotController::class, 'show'])->name('tourism.show');
        Route::get('spots/{spotId}/reviews', [\App\Domains\Tourism\Http\Controllers\TourismReviewController::class, 'index']);
        Route::get('categories', [\App\Domains\Tourism\Http\Controllers\TourismSpotController::class, 'categories']);
    });

    // =====================================================
    // Citizen Reports Public Routes
    // =====================================================
    Route::get('report-categories', [\App\Domains\Reports\Http\Controllers\ReportCategoryController::class, 'index'])
        ->middleware('cache.headers:static');

    Route::prefix('reports')->group(function () {
        Route::get('/', [\App\Domains\Reports\Http\Controllers\ReportController::class, 'index']);
        Route::get('/stats', [\App\Domains\Reports\Http\Controllers\ReportController::class, 'stats']);
        Route::get('/map', [\App\Domains\Reports\Http\Controllers\ReportMapController::class, 'index']);
        Route::get('/{id}', [\App\Domains\Reports\Http\Controllers\ReportController::class, 'show'])
            ->whereUuid('id');
    });

    // =====================================================
    // Geocoding Public Routes (cached proxy)
    // =====================================================
    Route::prefix('geocode')->middleware('throttle:30,1')->group(function () {
        Route::get('autocomplete', [\App\Domains\Geocoding\Http\Controllers\GeocodeController::class, 'autocomplete']);
        Route::get('reverse', [\App\Domains\Geocoding\Http\Controllers\GeocodeController::class, 'reverse']);
    });

    // =====================================================
    // Authenticated Routes
    // =====================================================
    Route::middleware('auth:sanctum')->group(function () {

        // Auth Routes
        Route::prefix('auth')->group(function () {
            Route::post('refresh', [AuthController::class, 'refresh']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });

        // User Profile Routes
        Route::prefix('users')->group(function () {
            Route::get('me', [UserController::class, 'show']);
            Route::put('me', [UserController::class, 'update']);
            Route::post('me/avatar', [UserController::class, 'uploadAvatar']);
            Route::delete('me/avatar', [UserController::class, 'deleteAvatar']);
            Route::put('me/notifications', [UserController::class, 'updateNotifications']);
        });

        // =====================================================
        // Admin Routes (requires admin or moderator role)
        // =====================================================
        Route::prefix('admin')->middleware('role:admin|moderator')->group(function () {
            Route::apiResource('users', AdminUserController::class);
            Route::post('users/{user}/roles', [AdminUserController::class, 'assignRoles'])
                ->middleware('role:admin'); // Only admins can assign roles

            // Forum Moderation
            Route::post('forum/topics/{topic}/hide', [\App\Http\Controllers\Admin\AdminForumController::class, 'hideTopic']);
            Route::post('forum/users/{user}/suspend', [\App\Http\Controllers\Admin\AdminForumController::class, 'suspendUser']);
        });

        // =====================================================
        // Forum Authenticated Routes
        // =====================================================
        Route::prefix('forum')->middleware('throttle:forum')->group(function () {
            // Topics CRUD
            Route::post('topics', [\App\Http\Controllers\Api\Forum\TopicController::class, 'store']);
            Route::put('topics/{topic}', [\App\Http\Controllers\Api\Forum\TopicController::class, 'update']);
            Route::delete('topics/{topic}', [\App\Http\Controllers\Api\Forum\TopicController::class, 'destroy']);

            // Topic interactions
            Route::post('topics/{topic}/like', [\App\Http\Controllers\Api\Forum\TopicLikeController::class, 'toggle']);
            Route::post('topics/{topic}/save', [\App\Http\Controllers\Api\Forum\SavedTopicController::class, 'toggle']);
            Route::post('topics/{topic}/report', [\App\Http\Controllers\Api\Forum\ReportController::class, 'reportTopic']);

            // Comments
            Route::post('topics/{topic}/comments', [\App\Http\Controllers\Api\Forum\CommentController::class, 'store']);
            Route::delete('topics/{topic}/comments/{comment}', [\App\Http\Controllers\Api\Forum\CommentController::class, 'destroy']);

            // Comment interactions
            Route::post('comments/{comment}/like', [\App\Http\Controllers\Api\Forum\CommentLikeController::class, 'toggle']);
            Route::post('comments/{comment}/report', [\App\Http\Controllers\Api\Forum\ReportController::class, 'reportComment']);

            // Upload
            Route::post('upload', [\App\Http\Controllers\Api\Forum\ForumUploadController::class, 'store']);

            // Saved topics
            Route::get('saved', [\App\Http\Controllers\Api\Forum\SavedTopicController::class, 'index']);
        });

        // =====================================================
        // Events Authenticated Routes
        // =====================================================
        Route::prefix('events')->group(function () {
            // RSVP
            Route::get('/{event}/rsvp', [\App\Http\Controllers\Api\Events\EventRsvpController::class, 'show']);
            Route::post('/{event}/rsvp', [\App\Http\Controllers\Api\Events\EventRsvpController::class, 'store']);
            Route::put('/{event}/rsvp', [\App\Http\Controllers\Api\Events\EventRsvpController::class, 'update']);
            Route::delete('/{event}/rsvp', [\App\Http\Controllers\Api\Events\EventRsvpController::class, 'destroy']);

            // Favorites
            Route::post('/{event}/favorite', [\App\Http\Controllers\Api\Events\EventFavoriteController::class, 'toggle']);
        });

        // User Events (RSVPs and Favorites)
        Route::get('users/me/events', [\App\Http\Controllers\Api\Events\UserEventController::class, 'myEvents']);
        Route::get('users/me/favorites/events', [\App\Http\Controllers\Api\Events\UserEventController::class, 'myFavorites']);

        // =====================================================
        // Tourism Authenticated Routes
        // =====================================================
        Route::prefix('tourism')->group(function () {
            Route::post('spots/{id}/like', [\App\Domains\Tourism\Http\Controllers\TourismSpotController::class, 'toggleLike']);
            Route::post('spots/{id}/save', [\App\Domains\Tourism\Http\Controllers\TourismSpotController::class, 'toggleSave']);
            Route::post('spots/{spotId}/reviews', [\App\Domains\Tourism\Http\Controllers\TourismReviewController::class, 'store']);
            Route::delete('reviews/{id}', [\App\Domains\Tourism\Http\Controllers\TourismReviewController::class, 'destroy']);
        });

        // =====================================================
        // Citizen Reports Authenticated Routes
        // =====================================================
        Route::prefix('reports')->middleware('throttle:5,1')->group(function () {
            // Create report (with rate limiting)
            Route::post('/', [\App\Domains\Reports\Http\Controllers\ReportController::class, 'store']);

            // My reports
            Route::get('/me', [\App\Domains\Reports\Http\Controllers\ReportController::class, 'myReports']);

            // Report details
            Route::get('/{id}', [\App\Domains\Reports\Http\Controllers\ReportController::class, 'show'])
                ->whereUuid('id');

            // Add/remove media
            Route::post('/{id}/media', [\App\Domains\Reports\Http\Controllers\ReportController::class, 'addMedia'])
                ->whereUuid('id');
            Route::delete('/{id}/media/{mediaId}', [\App\Domains\Reports\Http\Controllers\ReportController::class, 'removeMedia'])
                ->whereUuid(['id', 'mediaId']);

            // Update status (admin only)
            Route::patch('/{id}/status', [\App\Domains\Reports\Http\Controllers\ReportController::class, 'updateStatus'])
                ->whereUuid('id')
                ->middleware('role:admin|moderator');
        });

        // =====================================================
        // Admin Routes (role-protected)
        // =====================================================
        Route::prefix('admin')->middleware('role:admin|moderator')->group(function () {
            Route::get('reports', [\App\Domains\Reports\Http\Controllers\ReportController::class, 'adminIndex']);
        });
    });

    // =====================================================
    // System Routes (Public - for maintenance without SSH)
    // =====================================================
    Route::prefix('system')->group(function () {
        // Fix storage symlink - access via:
        // https://etijucas.com.br/api/v1/system/fix-storage?token=etijucas2026fix
        Route::get('fix-storage', function (\Illuminate\Http\Request $request) {
            $token = 'etijucas2026fix';

            if ($request->query('token') !== $token) {
                return response()->json(['error' => 'Unauthorized. Use ?token=' . $token], 403);
            }

            $target = storage_path('app/public');
            $link = public_path('storage');

            $result = [
                'target' => $target,
                'link' => $link,
                'target_exists' => file_exists($target),
                'link_exists' => file_exists($link),
                'link_is_symlink' => is_link($link),
            ];

            // If target doesn't exist, create it
            if (!file_exists($target)) {
                mkdir($target, 0755, true);
                $result['target_created'] = true;
            }

            // Check if link exists
            if (file_exists($link)) {
                if (is_link($link)) {
                    $result['status'] = 'Symlink already exists';
                    $result['points_to'] = readlink($link);
                } else {
                    // It's a directory, check if empty
                    $files = array_diff(scandir($link), ['.', '..']);
                    if (count($files) === 0) {
                        rmdir($link);
                        $result['empty_dir_removed'] = true;
                    } else {
                        $result['status'] = 'Directory exists with files';
                        $result['files'] = array_values($files);
                        return response()->json($result);
                    }
                }
            }

            // Create symlink
            if (!file_exists($link)) {
                try {
                    if (symlink($target, $link)) {
                        $result['status'] = 'Symlink created successfully!';
                        $result['symlink_created'] = true;
                    } else {
                        $result['status'] = 'Failed to create symlink';
                        $result['error'] = error_get_last()['message'] ?? 'Unknown error';
                    }
                } catch (\Exception $e) {
                    $result['status'] = 'Exception creating symlink';
                    $result['error'] = $e->getMessage();
                }
            }

            // Verify
            $result['final_check'] = [
                'link_exists' => file_exists($link),
                'link_is_symlink' => is_link($link),
                'test_path_13' => file_exists($link . '/13'),
            ];

            if (file_exists($link . '/13')) {
                $result['files_in_13'] = array_values(array_diff(scandir($link . '/13'), ['.', '..']));
            }

            return response()->json($result);
        });
    });
});

