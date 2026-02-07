<?php

namespace App\Providers;

use App\Console\Commands\MakeAdminCrud;
use App\Domains\Reports\Models\CitizenReport;
use App\Domains\Reports\Models\ReportCategory;
use App\Domains\Tourism\Models\TourismReview;
use App\Domains\Tourism\Models\TourismSpot;
use App\Domains\Votes\Models\Legislatura;
use App\Domains\Votes\Models\Mandato;
use App\Domains\Votes\Models\Partido;
use App\Domains\Votes\Models\Vereador;
use App\Domains\Votes\Models\Votacao;
use App\Domains\Votes\Models\VotoRegistro;
use App\Models\Bairro;
use App\Models\Comment;
use App\Models\CommentReport;
use App\Models\ContentFlag;
use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\EventCategory;
use App\Models\Organizer;
use App\Models\Phone;
use App\Models\Tag;
use App\Models\Topic;
use App\Models\TopicReport;
use App\Models\User;
use App\Models\UserRestriction;
use App\Models\Venue;
use App\Policies\ActivityPolicy;
use App\Policies\BairroPolicy;
use App\Policies\CitizenReportPolicy;
use App\Policies\CommentPolicy;
use App\Policies\CommentReportPolicy;
use App\Policies\ContentFlagPolicy;
use App\Policies\EventRsvpPolicy;
use App\Policies\EventPolicy;
use App\Policies\EventCategoryPolicy;
use App\Policies\OrganizerPolicy;
use App\Policies\LegislaturaPolicy;
use App\Policies\MandatoPolicy;
use App\Policies\PartidoPolicy;
use App\Policies\PhonePolicy;
use App\Policies\ReportCategoryPolicy;
use App\Policies\RolePolicy;
use App\Policies\TagPolicy;
use App\Policies\TopicPolicy;
use App\Policies\TopicReportPolicy;
use App\Policies\TourismReviewPolicy;
use App\Policies\TourismSpotPolicy;
use App\Policies\UserPolicy;
use App\Policies\UserRestrictionPolicy;
use App\Policies\VereadorPolicy;
use App\Policies\VotacaoPolicy;
use App\Policies\VotoRegistroPolicy;
use App\Policies\VenuePolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Role;
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
        Gate::policy(CommentReport::class, CommentReportPolicy::class);
        Gate::policy(Topic::class, TopicPolicy::class);
        Gate::policy(TopicReport::class, TopicReportPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(ReportCategory::class, ReportCategoryPolicy::class);
        Gate::policy(CitizenReport::class, CitizenReportPolicy::class);
        Gate::policy(Partido::class, PartidoPolicy::class);
        Gate::policy(Legislatura::class, LegislaturaPolicy::class);
        Gate::policy(Mandato::class, MandatoPolicy::class);
        Gate::policy(Vereador::class, VereadorPolicy::class);
        Gate::policy(Votacao::class, VotacaoPolicy::class);
        Gate::policy(VotoRegistro::class, VotoRegistroPolicy::class);

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

        // API rate limiter - tenant-aware
        RateLimiter::for('api', function (Request $request) {
            $tenantKey = $request->attributes->get('tenant_city_id', 'global');

            if ($request->user()) {
                // Authenticated: 120 requests/min per user per tenant
                return Limit::perMinute(120)
                    ->by("{$tenantKey}:{$request->user()->id}");
            }

            // Anonymous: 30 requests/min per IP per tenant
            return Limit::perMinute(30)
                ->by("{$tenantKey}:{$request->ip()}");
        });

        // Tenant-level rate limiter (for expensive operations)
        RateLimiter::for('tenant', function (Request $request) {
            $tenantKey = $request->attributes->get('tenant_city_id', 'global');

            // 1000 requests/min per tenant (all users combined)
            return Limit::perMinute(1000)->by($tenantKey);
        });

        // Auth rate limiter (login attempts)
        RateLimiter::for('auth', function (Request $request) {
            $tenantKey = $request->attributes->get('tenant_city_id', 'global');

            // 5 attempts per minute per IP per tenant
            return Limit::perMinute(5)
                ->by("{$tenantKey}:{$request->ip()}");
        });
    }
}
