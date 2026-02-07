<?php

namespace App\DataTransferObjects;

use Illuminate\Contracts\Support\Arrayable;
use JsonSerializable;

/**
 * CityBrandDTO - Branding configuration for a city
 * 
 * Stored in cities.brand JSON column.
 * Used for:
 * - PWA manifest generation
 * - SEO meta tags
 * - UI theming
 * 
 * @see SEO_PUBLIC_PAGES.md
 */
class CityBrandDTO implements Arrayable, JsonSerializable
{
    public function __construct(
        // Identity
        public readonly ?string $logoUrl = null,
        public readonly ?string $logoAltUrl = null,  // Logo alternativa (escura/clara)
        public readonly ?string $faviconUrl = null,
        public readonly ?string $slogan = null,
        public readonly ?string $description = null,

        // Colors
        public readonly ?string $primaryColor = null,
        public readonly ?string $secondaryColor = null,
        public readonly ?string $accentColor = null,
        public readonly ?string $backgroundColor = null,

        // Social
        public readonly ?string $instagram = null,
        public readonly ?string $facebook = null,
        public readonly ?string $twitter = null,
        public readonly ?string $whatsapp = null,
        public readonly ?string $website = null,

        // Contact
        public readonly ?string $email = null,
        public readonly ?string $phone = null,
        public readonly ?string $address = null,

        // PWA
        public readonly ?string $pwaName = null,
        public readonly ?string $pwaShortName = null,
        public readonly ?string $pwaThemeColor = null,
        public readonly ?string $pwaBackgroundColor = null,
    ) {
    }

    /**
     * Create from array (e.g., JSON from database)
     */
    public static function fromArray(?array $data): ?self
    {
        if (!$data) {
            return null;
        }

        return new self(
            logoUrl: $data['logo_url'] ?? $data['logoUrl'] ?? null,
            logoAltUrl: $data['logo_alt_url'] ?? $data['logoAltUrl'] ?? null,
            faviconUrl: $data['favicon_url'] ?? $data['faviconUrl'] ?? null,
            slogan: $data['slogan'] ?? null,
            description: $data['description'] ?? null,
            primaryColor: $data['primary_color'] ?? $data['primaryColor'] ?? null,
            secondaryColor: $data['secondary_color'] ?? $data['secondaryColor'] ?? null,
            accentColor: $data['accent_color'] ?? $data['accentColor'] ?? null,
            backgroundColor: $data['background_color'] ?? $data['backgroundColor'] ?? null,
            instagram: $data['instagram'] ?? null,
            facebook: $data['facebook'] ?? null,
            twitter: $data['twitter'] ?? null,
            whatsapp: $data['whatsapp'] ?? null,
            website: $data['website'] ?? null,
            email: $data['email'] ?? null,
            phone: $data['phone'] ?? null,
            address: $data['address'] ?? null,
            pwaName: $data['pwa_name'] ?? $data['pwaName'] ?? null,
            pwaShortName: $data['pwa_short_name'] ?? $data['pwaShortName'] ?? null,
            pwaThemeColor: $data['pwa_theme_color'] ?? $data['pwaThemeColor'] ?? null,
            pwaBackgroundColor: $data['pwa_background_color'] ?? $data['pwaBackgroundColor'] ?? null,
        );
    }

    /**
     * Create default brand for a city
     */
    public static function default(string $cityName): self
    {
        return new self(
            slogan: "Portal de {$cityName}",
            primaryColor: '#3b82f6',
            secondaryColor: '#1e40af',
            accentColor: '#f59e0b',
            backgroundColor: '#ffffff',
            pwaName: $cityName,
            pwaShortName: substr($cityName, 0, 12),
            pwaThemeColor: '#3b82f6',
            pwaBackgroundColor: '#ffffff',
        );
    }

    /**
     * Check if brand has logo
     */
    public function hasLogo(): bool
    {
        return $this->logoUrl !== null;
    }

    /**
     * Check if brand has colors defined
     */
    public function hasColors(): bool
    {
        return $this->primaryColor !== null;
    }

    /**
     * Check if brand has social links
     */
    public function hasSocialLinks(): bool
    {
        return $this->instagram !== null
            || $this->facebook !== null
            || $this->twitter !== null;
    }

    /**
     * Get PWA manifest data
     */
    public function getPwaManifest(string $cityName, string $citySlug): array
    {
        return [
            'name' => $this->pwaName ?? $cityName,
            'short_name' => $this->pwaShortName ?? substr($cityName, 0, 12),
            'description' => $this->description ?? "Portal da cidade de {$cityName}",
            'theme_color' => $this->pwaThemeColor ?? $this->primaryColor ?? '#3b82f6',
            'background_color' => $this->pwaBackgroundColor ?? '#ffffff',
            'display' => 'standalone',
            'orientation' => 'portrait',
            'start_url' => "/{$citySlug}",
            'scope' => "/{$citySlug}",
            'icons' => $this->getPwaIcons(),
        ];
    }

    /**
     * Get PWA icons array
     */
    private function getPwaIcons(): array
    {
        $iconUrl = $this->logoUrl ?? '/icons/default-icon.png';

        return [
            ['src' => $iconUrl, 'sizes' => '192x192', 'type' => 'image/png'],
            ['src' => $iconUrl, 'sizes' => '512x512', 'type' => 'image/png'],
        ];
    }

    /**
     * Get social links as array
     */
    public function getSocialLinks(): array
    {
        return array_filter([
            'instagram' => $this->instagram,
            'facebook' => $this->facebook,
            'twitter' => $this->twitter,
            'whatsapp' => $this->whatsapp,
            'website' => $this->website,
        ]);
    }

    /**
     * Merge with another DTO (fills gaps)
     */
    public function merge(CityBrandDTO $other): self
    {
        return new self(
            logoUrl: $this->logoUrl ?? $other->logoUrl,
            logoAltUrl: $this->logoAltUrl ?? $other->logoAltUrl,
            faviconUrl: $this->faviconUrl ?? $other->faviconUrl,
            slogan: $this->slogan ?? $other->slogan,
            description: $this->description ?? $other->description,
            primaryColor: $this->primaryColor ?? $other->primaryColor,
            secondaryColor: $this->secondaryColor ?? $other->secondaryColor,
            accentColor: $this->accentColor ?? $other->accentColor,
            backgroundColor: $this->backgroundColor ?? $other->backgroundColor,
            instagram: $this->instagram ?? $other->instagram,
            facebook: $this->facebook ?? $other->facebook,
            twitter: $this->twitter ?? $other->twitter,
            whatsapp: $this->whatsapp ?? $other->whatsapp,
            website: $this->website ?? $other->website,
            email: $this->email ?? $other->email,
            phone: $this->phone ?? $other->phone,
            address: $this->address ?? $other->address,
            pwaName: $this->pwaName ?? $other->pwaName,
            pwaShortName: $this->pwaShortName ?? $other->pwaShortName,
            pwaThemeColor: $this->pwaThemeColor ?? $other->pwaThemeColor,
            pwaBackgroundColor: $this->pwaBackgroundColor ?? $other->pwaBackgroundColor,
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'logo_url' => $this->logoUrl,
            'logo_alt_url' => $this->logoAltUrl,
            'favicon_url' => $this->faviconUrl,
            'slogan' => $this->slogan,
            'description' => $this->description,
            'primary_color' => $this->primaryColor,
            'secondary_color' => $this->secondaryColor,
            'accent_color' => $this->accentColor,
            'background_color' => $this->backgroundColor,
            'instagram' => $this->instagram,
            'facebook' => $this->facebook,
            'twitter' => $this->twitter,
            'whatsapp' => $this->whatsapp,
            'website' => $this->website,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'pwa_name' => $this->pwaName,
            'pwa_short_name' => $this->pwaShortName,
            'pwa_theme_color' => $this->pwaThemeColor,
            'pwa_background_color' => $this->pwaBackgroundColor,
        ];
    }

    /**
     * JSON serialize
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
