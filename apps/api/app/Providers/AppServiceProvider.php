<?php

namespace App\Providers;

use App\Console\Commands\MakeAdminCrud;
use App\Domains\Reports\Models\CitizenReport;
use App\Domains\Reports\Models\ReportCategory;
use App\Domains\Tourism\Models\TourismReview;
use App\Domains\Tourism\Models\TourismSpot;
use App\Models\Bairro;
use App\Models\Comment;
use App\Models\ContentFlag;
use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\EventCategory;
use App\Models\Organizer;
use App\Models\Phone;
use App\Models\Tag;
use App\Models\User;
use App\Models\UserRestriction;
use App\Models\Venue;
use App\Policies\ActivityPolicy;
use App\Policies\BairroPolicy;
use App\Policies\CitizenReportPolicy;
use App\Policies\CommentPolicy;
use App\Policies\ContentFlagPolicy;
use App\Policies\EventRsvpPolicy;
use App\Policies\EventPolicy;
use App\Policies\EventCategoryPolicy;
use App\Policies\OrganizerPolicy;
use App\Policies\PhonePolicy;
use App\Policies\ReportCategoryPolicy;
use App\Policies\TagPolicy;
use App\Policies\TourismReviewPolicy;
use App\Policies\TourismSpotPolicy;
use App\Policies\UserPolicy;
use App\Policies\UserRestrictionPolicy;
use App\Policies\VenuePolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->commands([
            MakeAdminCrud::class,
        ]);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Policies
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Bairro::class, BairroPolicy::class);
        Gate::policy(UserRestriction::class, UserRestrictionPolicy::class);
        Gate::policy(ContentFlag::class, ContentFlagPolicy::class);
        Gate::policy(Phone::class, PhonePolicy::class);
        Gate::policy(Activity::class, ActivityPolicy::class);
        Gate::policy(EventCategory::class, EventCategoryPolicy::class);
        Gate::policy(Tag::class, TagPolicy::class);
        Gate::policy(Venue::class, VenuePolicy::class);
        Gate::policy(Event::class, EventPolicy::class);
        Gate::policy(Organizer::class, OrganizerPolicy::class);
        Gate::policy(EventRsvp::class, EventRsvpPolicy::class);
        Gate::policy(TourismSpot::class, TourismSpotPolicy::class);
        Gate::policy(TourismReview::class, TourismReviewPolicy::class);
        Gate::policy(Comment::class, CommentPolicy::class);
        Gate::policy(ReportCategory::class, ReportCategoryPolicy::class);
        Gate::policy(CitizenReport::class, CitizenReportPolicy::class);

        // Rate Limiters
        $this->configureRateLimiting();
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // Forum rate limiter - differentiated by auth status
        RateLimiter::for('forum', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(60)->by($request->user()->id)  // Authenticated: 60/min
                : Limit::perMinute(20)->by($request->ip());        // Anonymous: 20/min
        });
    }
}
