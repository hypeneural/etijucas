<?php

namespace App\Models;

use App\Domain\Events\Enums\AgeRating;
use App\Domain\Events\Enums\EventStatus;
use App\Domain\Events\Enums\EventType;
use App\Domain\Events\Enums\RsvpStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Event extends Model implements HasMedia
{
    use HasFactory, HasUuids, SoftDeletes, InteractsWithMedia;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'title',
        'edition',
        'slug',
        'category_id',
        'description_short',
        'description_full',
        'start_datetime',
        'end_datetime',
        'venue_id',
        'organizer_id',
        'cover_image_url',
        'banner_image_url',
        'banner_image_mobile_url',
        'age_rating',
        'is_outdoor',
        'has_accessibility',
        'has_parking',
        'popularity_score',
        'expected_audience',
        'confirmed_attendance',
        'status',
        'is_featured',
        'is_recurring',
        'event_type',
        'total_days',
        'recurrence_rule',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'start_datetime' => 'datetime',
            'end_datetime' => 'datetime',
            'age_rating' => AgeRating::class,
            'is_outdoor' => 'boolean',
            'has_accessibility' => 'boolean',
            'has_parking' => 'boolean',
            'popularity_score' => 'integer',
            'expected_audience' => 'integer',
            'confirmed_attendance' => 'integer',
            'status' => EventStatus::class,
            'event_type' => EventType::class,
            'total_days' => 'integer',
            'is_featured' => 'boolean',
            'is_recurring' => 'boolean',
            'recurrence_rule' => 'array',
            'published_at' => 'datetime',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    public function category(): BelongsTo
    {
        return $this->belongsTo(EventCategory::class, 'category_id');
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(Organizer::class);
    }

    public function ticket(): HasOne
    {
        return $this->hasOne(EventTicket::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(EventSchedule::class)->orderBy('date')->orderBy('time')->orderBy('display_order');
    }

    public function days(): HasMany
    {
        return $this->hasMany(EventDay::class)->orderBy('day_number');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'event_tags');
    }

    public function legacyMedia(): HasMany
    {
        return $this->hasMany(EventMedia::class)->orderBy('display_order');
    }

    public function links(): HasMany
    {
        return $this->hasMany(EventLink::class);
    }

    public function rsvps(): HasMany
    {
        return $this->hasMany(EventRsvp::class);
    }

    public function favorites(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'event_favorites')
            ->withPivot('created_at');
    }

    // =====================================================
    // Scopes - Status
    // =====================================================

    public function scopePublished($query)
    {
        return $query->where('status', EventStatus::Published);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', EventStatus::Draft);
    }

    public function scopeActive($query)
    {
        return $query->published()->where('end_datetime', '>=', now());
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    // =====================================================
    // Scopes - Date/Time
    // =====================================================

    public function scopeUpcoming($query)
    {
        return $query->where('start_datetime', '>=', now());
    }

    public function scopeToday($query)
    {
        return $query
            ->whereDate('start_datetime', '<=', today())
            ->whereDate('end_datetime', '>=', today());
    }

    public function scopeTomorrow($query)
    {
        $tomorrow = today()->addDay();
        return $query
            ->whereDate('start_datetime', '<=', $tomorrow)
            ->whereDate('end_datetime', '>=', $tomorrow);
    }

    public function scopeWeekend($query)
    {
        $saturday = today()->next('Saturday');
        $sunday = $saturday->copy()->addDay();

        return $query
            ->where(function ($q) use ($saturday, $sunday) {
                $q->whereBetween('start_datetime', [$saturday->startOfDay(), $sunday->endOfDay()])
                    ->orWhere(function ($q2) use ($saturday, $sunday) {
                        $q2->where('start_datetime', '<=', $saturday->startOfDay())
                            ->where('end_datetime', '>=', $saturday->startOfDay());
                    });
            });
    }

    public function scopeThisWeek($query)
    {
        return $query
            ->where('start_datetime', '<=', now()->endOfWeek())
            ->where('end_datetime', '>=', now()->startOfWeek());
    }

    public function scopeThisMonth($query)
    {
        return $query
            ->where('start_datetime', '<=', now()->endOfMonth())
            ->where('end_datetime', '>=', now()->startOfMonth());
    }

    public function scopeInDateRange($query, $fromDate, $toDate)
    {
        if ($fromDate) {
            $query->where('end_datetime', '>=', $fromDate);
        }
        if ($toDate) {
            $query->where('start_datetime', '<=', $toDate);
        }
        return $query;
    }

    public function scopeOnDate($query, $date)
    {
        return $query
            ->whereDate('start_datetime', '<=', $date)
            ->whereDate('end_datetime', '>=', $date);
    }

    public function scopeInMonth($query, int $year, int $month)
    {
        $startOfMonth = now()->setYear($year)->setMonth($month)->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        return $query
            ->where('start_datetime', '<=', $endOfMonth)
            ->where('end_datetime', '>=', $startOfMonth);
    }

    public function scopeByTimeOfDay($query, string $timeOfDay)
    {
        return match ($timeOfDay) {
            'morning' => $query->whereTime('start_datetime', '>=', '06:00:00')
                ->whereTime('start_datetime', '<', '12:00:00'),
            'afternoon' => $query->whereTime('start_datetime', '>=', '12:00:00')
                ->whereTime('start_datetime', '<', '18:00:00'),
            'night' => $query->where(function ($q) {
                    $q->whereTime('start_datetime', '>=', '18:00:00')
                    ->orWhereTime('start_datetime', '<', '06:00:00');
                }),
            default => $query,
        };
    }

    // =====================================================
    // Scopes - Filters
    // =====================================================

    public function scopeByCategory($query, string $categoryIdOrSlug)
    {
        return $query->where(function ($q) use ($categoryIdOrSlug) {
            $q->where('category_id', $categoryIdOrSlug)
                ->orWhereHas('category', fn($q2) => $q2->where('slug', $categoryIdOrSlug));
        });
    }

    public function scopeByBairro($query, string $bairroId)
    {
        return $query->whereHas('venue', fn($q) => $q->where('bairro_id', $bairroId));
    }

    public function scopeByVenue($query, string $venueId)
    {
        return $query->where('venue_id', $venueId);
    }

    public function scopeByOrganizer($query, string $organizerId)
    {
        return $query->where('organizer_id', $organizerId);
    }

    public function scopeByTag($query, string $tagSlug)
    {
        return $query->whereHas('tags', fn($q) => $q->where('slug', $tagSlug));
    }

    public function scopeByTags($query, array $tagSlugs)
    {
        return $query->whereHas('tags', fn($q) => $q->whereIn('slug', $tagSlugs));
    }

    public function scopeFree($query)
    {
        return $query->whereHas('ticket', fn($q) => $q->where('ticket_type', 'free'));
    }

    public function scopePaid($query)
    {
        return $query->whereHas('ticket', fn($q) => $q->where('ticket_type', 'paid'));
    }

    public function scopeByPrice($query, string $priceType)
    {
        return match ($priceType) {
            'free' => $query->free(),
            'paid' => $query->paid(),
            default => $query,
        };
    }

    public function scopeByPriceRange($query, ?float $minPrice, ?float $maxPrice)
    {
        return $query->whereHas('ticket', function ($q) use ($minPrice, $maxPrice) {
            if ($minPrice !== null) {
                $q->where('min_price', '>=', $minPrice);
            }
            if ($maxPrice !== null) {
                $q->where(function ($q2) use ($maxPrice) {
                    $q2->where('max_price', '<=', $maxPrice)
                        ->orWhere('min_price', '<=', $maxPrice);
                });
            }
        });
    }

    public function scopeByAgeRating($query, string $ageRating)
    {
        return $query->where('age_rating', $ageRating);
    }

    public function scopeAccessible($query)
    {
        return $query->where('has_accessibility', true);
    }

    public function scopeWithParking($query)
    {
        return $query->where('has_parking', true);
    }

    public function scopeOutdoor($query)
    {
        return $query->where('is_outdoor', true);
    }

    public function scopeKidsFriendly($query)
    {
        return $query->where('age_rating', AgeRating::Livre);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('description_short', 'like', "%{$search}%")
                ->orWhere('description_full', 'like', "%{$search}%")
                ->orWhereHas('venue', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
                ->orWhereHas('organizer', fn($q2) => $q2->where('name', 'like', "%{$search}%"));
        });
    }

    // =====================================================
    // Scopes - User Interactions
    // =====================================================

    public function scopeWithUserInteractions($query, ?string $userId)
    {
        if (!$userId) {
            return $query;
        }

        return $query
            ->withExists(['favorites as is_favorited' => fn($q) => $q->where('user_id', $userId)])
            ->with(['rsvps' => fn($q) => $q->where('user_id', $userId)]);
    }

    // =====================================================
    // Scopes - Ordering
    // =====================================================

    public function scopeOrderByPopularity($query, string $direction = 'desc')
    {
        return $query->orderBy('popularity_score', $direction);
    }

    public function scopeOrderByStartDate($query, string $direction = 'asc')
    {
        return $query->orderBy('start_datetime', $direction);
    }

    // =====================================================
    // RSVP Counts
    // =====================================================

    public function getRsvpCountAttribute(): int
    {
        return $this->rsvps()->count();
    }

    public function getGoingCountAttribute(): int
    {
        return $this->rsvps()->going()->sum('guests_count');
    }

    public function getMaybeCountAttribute(): int
    {
        return $this->rsvps()->maybe()->sum('guests_count');
    }

    public function getAttendeesCountAttribute(): int
    {
        return $this->rsvps()->confirmed()->sum('guests_count');
    }

    // =====================================================
    // Status Helpers
    // =====================================================

    public function isPublished(): bool
    {
        return $this->status === EventStatus::Published;
    }

    public function isDraft(): bool
    {
        return $this->status === EventStatus::Draft;
    }

    public function isCancelled(): bool
    {
        return $this->status === EventStatus::Cancelled;
    }

    public function isFinished(): bool
    {
        return $this->status === EventStatus::Finished || $this->end_datetime->isPast();
    }

    public function isHappening(): bool
    {
        return $this->start_datetime->isPast() && $this->end_datetime->isFuture();
    }

    public function isUpcoming(): bool
    {
        return $this->start_datetime->isFuture();
    }

    // =====================================================
    // User Interaction Helpers
    // =====================================================

    public function getUserRsvp(?string $userId): ?EventRsvp
    {
        if (!$userId) {
            return null;
        }

        return $this->rsvps()->where('user_id', $userId)->first();
    }

    public function getUserRsvpStatus(?string $userId): ?RsvpStatus
    {
        return $this->getUserRsvp($userId)?->status;
    }

    public function isFavoritedBy(?string $userId): bool
    {
        if (!$userId) {
            return false;
        }

        return $this->favorites()->where('user_id', $userId)->exists();
    }

    // =====================================================
    // Popularity Score
    // =====================================================

    public function updatePopularityScore(): void
    {
        $rsvpScore = $this->rsvps()->where('created_at', '>=', now()->subDays(7))->count() * 3;
        $favoriteScore = $this->favorites()->where('event_favorites.created_at', '>=', now()->subDays(7))->count() * 2;

        // Proximity bonus: events happening soon get a boost
        $daysUntilEvent = max(0, now()->diffInDays($this->start_datetime, false));
        $proximityBonus = max(0, 50 - $daysUntilEvent);

        $this->update([
            'popularity_score' => $rsvpScore + $favoriteScore + $proximityBonus,
        ]);
    }

    // =====================================================
    // Boot
    // =====================================================

    protected static function boot()
    {
        parent::boot();

        static::creating(function (Event $event) {
            if (empty($event->slug)) {
                $event->slug = \Illuminate\Support\Str::slug($event->title);
            }
        });
    }

    // =====================================================
    // Media Collections
    // =====================================================

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('event_cover')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('event_banner')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('event_banner_mobile')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('event_gallery')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(\Spatie\MediaLibrary\MediaCollections\Models\Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(400)
            ->height(400)
            ->performOnCollections('event_cover', 'event_banner', 'event_banner_mobile', 'event_gallery')
            ->nonQueued();

        $this->addMediaConversion('web')
            ->width(1600)
            ->height(1600)
            ->performOnCollections('event_cover', 'event_banner', 'event_banner_mobile', 'event_gallery')
            ->nonQueued();
    }
}
