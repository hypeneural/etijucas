<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Z-API configuration.
     */
    protected string $instanceId;
    protected string $token;
    protected string $clientToken;
    protected string $baseUrl = 'https://api.z-api.io';

    public function __construct()
    {
        $this->instanceId = config('services.zapi.instance_id', '');
        $this->token = config('services.zapi.token', '');
        $this->clientToken = config('services.zapi.client_token', '');
    }

    /**
     * Send OTP code via WhatsApp (simple text, legacy).
     *
     * @param string $phone Phone number (11 digits)
     * @param string $code OTP code (6 digits)
     * @return bool Success status
     */
    public function sendOtp(string $phone, string $code): bool
    {
        $message = $this->formatOtpMessage($code);

        return $this->sendText($phone, $message);
    }

    /**
     * Send OTP code with interactive buttons via Z-API.
     * Uses send-button-actions for "Abrir eTijucas" and "Copiar código".
     *
     * @param string $phone Phone number (11 digits)
     * @param string $code OTP code (6 digits)
     * @param string $sid Session ID for magic link
     * @return bool Success status
     */
    public function sendOtpWithButtons(string $phone, string $code, string $sid): bool
    {
        // In development without credentials, just log
        if ($this->isDevMode()) {
            return $this->logButtonMessage($phone, $code, $sid);
        }

        try {
            $url = "{$this->baseUrl}/instances/{$this->instanceId}/token/{$this->token}/send-button-actions";

            $appUrl = config('app.frontend_url', 'https://etijucas.com.br');
            $copyCodeUrl = "https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code={$code}";
            $magicLinkUrl = "{$appUrl}/login/otp?sid={$sid}";

            $payload = [
                'phone' => $this->formatPhoneNumber($phone),
                'message' => $this->formatOtpButtonMessage($code),
                'title' => 'Acesso rápido',
                'footer' => 'Não compartilhe este código.',
                'buttonActions' => [
                    [
                        'id' => '1',
                        'type' => 'URL',
                        'url' => $magicLinkUrl,
                        'label' => 'Abrir eTijucas',
                    ],
                    [
                        'id' => '2',
                        'type' => 'URL',
                        'url' => $copyCodeUrl,
                        'label' => 'Copiar código',
                    ],
                ],
            ];

            $response = Http::withHeaders([
                'Client-Token' => $this->clientToken,
                'Content-Type' => 'application/json',
            ])->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();

                Log::channel('single')->info('Z-API: OTP with buttons sent successfully', [
                    'phone' => $phone,
                    'sid' => $sid,
                    'zaapId' => $data['zaapId'] ?? null,
                    'messageId' => $data['messageId'] ?? null,
                ]);

                return true;
            }

            Log::channel('single')->error('Z-API: Failed to send OTP with buttons', [
                'phone' => $phone,
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            // Fallback to simple text if buttons fail
            Log::channel('single')->info('Z-API: Falling back to simple text OTP');
            return $this->sendOtp($phone, $code);

        } catch (\Exception $e) {
            Log::channel('single')->error('Z-API: Exception while sending OTP with buttons', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            // Fallback to simple text
            return $this->sendOtp($phone, $code);
        }
    }

    /**
     * Send a text message via WhatsApp using Z-API.
     *
     * @param string $phone Phone number (11 digits, will be formatted)
     * @param string $message Message content (supports WhatsApp formatting)
     * @param int|null $delayTyping Optional delay showing "typing..." status (1-15 sec)
     * @return bool Success status
     */
    public function sendText(string $phone, string $message, ?int $delayTyping = null): bool
    {
        // In development without credentials, just log
        if ($this->isDevMode()) {
            return $this->logMessage($phone, $message);
        }

        try {
            $url = "{$this->baseUrl}/instances/{$this->instanceId}/token/{$this->token}/send-text";

            $payload = [
                'phone' => $this->formatPhoneNumber($phone),
                'message' => $message,
            ];

            // Add optional delay typing (shows "typing..." status)
            if ($delayTyping !== null && $delayTyping >= 1 && $delayTyping <= 15) {
                $payload['delayTyping'] = $delayTyping;
            }

            $response = Http::withHeaders([
                'Client-Token' => $this->clientToken,
                'Content-Type' => 'application/json',
            ])->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();

                Log::channel('single')->info('Z-API: Message sent successfully', [
                    'phone' => $phone,
                    'zaapId' => $data['zaapId'] ?? null,
                    'messageId' => $data['messageId'] ?? null,
                ]);

                return true;
            }

            Log::channel('single')->error('Z-API: Failed to send message', [
                'phone' => $phone,
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return false;

        } catch (\Exception $e) {
            Log::channel('single')->error('Z-API: Exception while sending message', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send alert/notification message.
     *
     * @param string $phone Phone number
     * @param string $title Alert title
     * @param string $body Alert body
     * @return bool Success status
     */
    public function sendAlert(string $phone, string $title, string $body): bool
    {
        $message = "🚨 *{$title}*\n\n{$body}";

        return $this->sendText($phone, $message, 3);
    }

    /**
     * Send event notification.
     *
     * @param string $phone Phone number
     * @param string $eventName Event name
     * @param string $date Event date
     * @param string $location Event location
     * @return bool Success status
     */
    public function sendEventNotification(string $phone, string $eventName, string $date, string $location): bool
    {
        $message = "📅 *Novo Evento em Tijucas*\n\n"
            . "*{$eventName}*\n"
            . "📆 {$date}\n"
            . "📍 {$location}";

        return $this->sendText($phone, $message);
    }

    /**
     * Format the OTP message with WhatsApp formatting.
     */
    protected function formatOtpMessage(string $code): string
    {
        return "🔐 *eTijucas - Código de Verificação*\n\n"
            . "Seu código é: *{$code}*\n\n"
            . "⏱️ Este código expira em 5 minutos.\n\n"
            . "_Se você não solicitou este código, ignore esta mensagem._";
    }

    /**
     * Format the OTP message for button actions (shorter).
     */
    protected function formatOtpButtonMessage(string $code): string
    {
        return "🔐 Seu código de acesso ao eTijucas é: *{$code}*\n\n"
            . "Ele expira em 5 minutos.\n"
            . "Se você não solicitou, ignore.";
    }

    /**
     * Format phone number for Z-API (Brazil DDI + DDD + Number).
     * Input: 11 digits (DDD + Number)
     * Output: 13 digits (55 + DDD + Number)
     */
    protected function formatPhoneNumber(string $phone): string
    {
        // Remove non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Add Brazil country code if not present
        if (strlen($phone) === 11) {
            return '55' . $phone;
        }

        // Already has country code
        if (strlen($phone) === 13 && str_starts_with($phone, '55')) {
            return $phone;
        }

        return $phone;
    }

    /**
     * Check if running in development mode without Z-API credentials.
     * Only checks if credentials are configured - will send in any environment
     * as long as credentials exist.
     */
    protected function isDevMode(): bool
    {
        return empty($this->instanceId) || empty($this->token);
    }

    /**
     * Log message for development purposes.
     */
    protected function logMessage(string $phone, string $message): bool
    {
        Log::channel('single')->info('Z-API [DEV MODE]: WhatsApp message logged', [
            'phone' => $this->formatPhoneNumber($phone),
            'message' => $message,
        ]);

        return true;
    }

    /**
     * Log button message for development purposes.
     */
    protected function logButtonMessage(string $phone, string $code, string $sid): bool
    {
        Log::channel('single')->info('Z-API [DEV MODE]: OTP with buttons logged', [
            'phone' => $this->formatPhoneNumber($phone),
            'code' => $code,
            'sid' => $sid,
            'message' => $this->formatOtpButtonMessage($code),
        ]);

        return true;
    }

    /**
     * Check if Z-API is properly configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->instanceId) && !empty($this->token);
    }
}
