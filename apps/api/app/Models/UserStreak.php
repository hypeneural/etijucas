<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class UserStreak extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'current_streak',
        'longest_streak',
        'total_check_ins',
        'last_check_in_at',
    ];

    protected $casts = [
        'current_streak' => 'integer',
        'longest_streak' => 'integer',
        'total_check_ins' => 'integer',
        'last_check_in_at' => 'datetime',
    ];

    /**
     * User relationship
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Perform a check-in for the user.
     * Returns array with streak data and milestone info.
     * 
     * Logic:
     * - If already checked in today: no change
     * - If last check-in was yesterday: increment streak
     * - If last check-in was 2 days ago (grace period): keep streak, increment
     * - Otherwise: reset streak to 1
     */
    public function performCheckIn(): array
    {
        $now = Carbon::now();
        $lastCheckIn = $this->last_check_in_at;

        // Already checked in today
        if ($lastCheckIn && $lastCheckIn->isToday()) {
            return $this->getStreakData(false);
        }

        // Determine if streak continues
        $streakContinues = false;
        if ($lastCheckIn) {
            $daysSinceLastCheckIn = $lastCheckIn->startOfDay()->diffInDays($now->startOfDay());

            // Yesterday or 2 days ago (grace period)
            if ($daysSinceLastCheckIn <= 2) {
                $streakContinues = true;
            }
        }

        // Update streak
        if ($streakContinues) {
            $this->current_streak++;
        } else {
            $this->current_streak = 1;
        }

        // Update records
        if ($this->current_streak > $this->longest_streak) {
            $this->longest_streak = $this->current_streak;
        }

        $this->total_check_ins++;
        $this->last_check_in_at = $now;
        $this->save();

        return $this->getStreakData(true);
    }

    /**
     * Get streak data with milestone info
     */
    public function getStreakData(bool $justCheckedIn = false): array
    {
        $milestones = [7, 14, 30, 60, 90, 180, 365];
        $isMilestone = $justCheckedIn && in_array($this->current_streak, $milestones);

        return [
            'current' => $this->current_streak,
            'longest' => $this->longest_streak,
            'total_check_ins' => $this->total_check_ins,
            'last_check_in' => $this->last_check_in_at?->toIso8601String(),
            'checked_in_today' => $this->last_check_in_at?->isToday() ?? false,
            'is_milestone' => $isMilestone,
            'milestone_value' => $isMilestone ? $this->current_streak : null,
        ];
    }

    /**
     * Check if user has checked in today
     */
    public function hasCheckedInToday(): bool
    {
        return $this->last_check_in_at?->isToday() ?? false;
    }
}
