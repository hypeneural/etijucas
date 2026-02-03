<?php

declare(strict_types=1);

namespace App\Filament\Admin\Pages\Auth;

use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\Component;
use Filament\Forms\Components\TextInput;
use Filament\Pages\Auth\Login as BaseLogin;
use Filament\Forms\Form;
use Filament\Pages\Concerns\InteractsWithFormActions;
use Illuminate\Validation\ValidationException;
use DanHarrin\LivewireRateLimiting\Exceptions\TooManyRequestsException;
use Filament\Facades\Filament;
use Filament\Http\Responses\Auth\Contracts\LoginResponse;
use Filament\Models\Contracts\FilamentUser;

class Login extends BaseLogin
{
    public function authenticate(): ?LoginResponse
    {
        try {
            $this->rateLimit(5);
        } catch (TooManyRequestsException $exception) {
            $this->getRateLimitedNotification($exception)?->send();

            return null;
        }

        $data = $this->form->getState();

        $credentials = [];
        if (! empty($data['phone'])) {
            $credentials = ['phone' => $data['phone'], 'password' => $data['password']];
        } elseif (! empty($data['email'])) {
            $credentials = ['email' => $data['email'], 'password' => $data['password']];
        }

        if (! Filament::auth()->attempt($credentials, $data['remember'] ?? false)) {
            $this->throwFailureValidationException();
        }

        $user = Filament::auth()->user();

        if (
            ($user instanceof FilamentUser) &&
            (! $user->canAccessPanel(Filament::getCurrentPanel()))
        ) {
            Filament::auth()->logout();

            $this->throwFailureValidationException();
        }

        session()->regenerate();

        return app(LoginResponse::class);
    }

    /**
     * @return array<int | string, string | Form>
     */
    protected function getForms(): array
    {
        return [
            'form' => $this->form(
                $this->makeForm()
                    ->schema([
                        $this->getPhoneFormComponent(),
                        $this->getEmailFormComponent(),
                        $this->getPasswordFormComponent(),
                        $this->getRememberFormComponent(),
                    ])
                    ->statePath('data'),
            ),
        ];
    }

    protected function getPhoneFormComponent(): Component
    {
        return TextInput::make('phone')
            ->label('Telefone')
            ->tel()
            ->autocomplete('tel')
            ->autofocus()
            ->maxLength(11)
            ->mask('99999999999')
            ->placeholder('Ex: 48999999999')
            ->rules([
                'nullable',
                'required_without:data.email',
                'regex:/^[0-9]{11}$/',
            ])
            ->dehydrateStateUsing(fn ($state) => $state ? preg_replace('/\\D+/', '', (string) $state) : null)
            ->extraInputAttributes(['tabindex' => 1]);
    }

    protected function getEmailFormComponent(): Component
    {
        return TextInput::make('email')
            ->label('Email')
            ->email()
            ->autocomplete('email')
            ->placeholder('Ex: admin@etijucas.local')
            ->rules([
                'nullable',
                'required_without:data.phone',
                'email',
            ])
            ->extraInputAttributes(['tabindex' => 2]);
    }

    protected function getRememberFormComponent(): Component
    {
        return Checkbox::make('remember')
            ->label(__('filament-panels::pages/auth/login.form.remember.label'));
    }

    protected function throwFailureValidationException(): never
    {
        throw ValidationException::withMessages([
            'data.phone' => __('filament-panels::pages/auth/login.messages.failed'),
            'data.email' => __('filament-panels::pages/auth/login.messages.failed'),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function getCredentialsFromFormData(array $data): array
    {
        $phone = $data['phone'] ?? null;
        $email = $data['email'] ?? null;

        return [
            'phone' => $phone ?: null,
            'email' => $email ?: null,
            'password' => $data['password'],
        ];
    }
}
