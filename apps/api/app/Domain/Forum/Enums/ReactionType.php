<?php

namespace App\Domain\Forum\Enums;

/**
 * ReactionType Enum
 * 
 * Types of reactions users can make on topics.
 */
enum ReactionType: string
{
    case Confirm = 'confirm';  // "Eu vi também"
    case Support = 'support';  // "Apoiar"

    public function label(): string
    {
        return match ($this) {
            self::Confirm => 'Eu vi também',
            self::Support => 'Apoiar',
        };
    }
}
