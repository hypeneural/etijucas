/**
 * CategoryIcon - Renders a category icon from Iconify (MDI) or fallback emoji
 * 
 * This component handles both new MDI icons (e.g., "mdi:road-variant") 
 * and legacy emoji icons for backward compatibility.
 */

import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface CategoryIconProps {
    icon: string; // "mdi:road-variant" or emoji like "🕳️"
    color?: string; // hex color
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    withBackground?: boolean;
}

const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
};

const containerSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
};

export function CategoryIcon({
    icon,
    color = '#6b7280',
    size = 'md',
    className,
    withBackground = false,
}: CategoryIconProps) {
    // Check if it's an Iconify icon (contains ":")
    const isIconify = icon.includes(':');

    if (isIconify) {
        if (withBackground) {
            return (
                <div
                    className={cn(
                        'rounded-xl flex items-center justify-center',
                        containerSizeClasses[size],
                        className
                    )}
                    style={{ backgroundColor: `${color}20` }}
                >
                    <Icon
                        icon={icon}
                        className={sizeClasses[size]}
                        style={{ color }}
                    />
                </div>
            );
        }

        return (
            <Icon
                icon={icon}
                className={cn(sizeClasses[size], className)}
                style={{ color }}
            />
        );
    }

    // Fallback to emoji
    if (withBackground) {
        return (
            <div
                className={cn(
                    'rounded-xl flex items-center justify-center',
                    containerSizeClasses[size],
                    className
                )}
                style={{ backgroundColor: `${color}20` }}
            >
                <span className={cn('text-center', size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl')}>
                    {icon}
                </span>
            </div>
        );
    }

    return (
        <span className={cn('text-center', size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl', className)}>
            {icon}
        </span>
    );
}

export default CategoryIcon;
