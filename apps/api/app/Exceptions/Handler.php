<?php

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        AuthenticationException::class,
        AuthorizationException::class,
        ValidationException::class,
        ModelNotFoundException::class,
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // Render JSON responses for API requests
        $this->renderable(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return $this->renderApiException($e, $request);
            }
        });
    }

    /**
     * Render an exception as a JSON response for API requests.
     */
    protected function renderApiException(Throwable $e, Request $request): JsonResponse
    {
        // Authentication failed
        if ($e instanceof AuthenticationException) {
            return $this->errorResponse(
                'Não autenticado',
                'UNAUTHENTICATED',
                401
            );
        }

        // Authorization failed
        if ($e instanceof AuthorizationException || $e instanceof UnauthorizedException) {
            return $this->errorResponse(
                'Você não tem permissão para realizar esta ação',
                'FORBIDDEN',
                403
            );
        }

        // Model not found
        if ($e instanceof ModelNotFoundException) {
            $model = class_basename($e->getModel());
            return $this->errorResponse(
                "{$model} não encontrado",
                'NOT_FOUND',
                404
            );
        }

        // Route not found
        if ($e instanceof NotFoundHttpException) {
            return $this->errorResponse(
                'Endpoint não encontrado',
                'NOT_FOUND',
                404
            );
        }

        // Validation errors
        if ($e instanceof ValidationException) {
            return response()->json([
                'message' => 'Dados inválidos',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        }

        // Rate limiting
        if ($e instanceof TooManyRequestsHttpException) {
            $retryAfter = $e->getHeaders()['Retry-After'] ?? 60;
            return response()->json([
                'message' => 'Muitas requisições. Tente novamente em breve.',
                'code' => 'TOO_MANY_REQUESTS',
                'retryAfter' => (int) $retryAfter,
            ], 429);
        }

        // HTTP exceptions
        if ($e instanceof HttpException) {
            return $this->errorResponse(
                $e->getMessage() ?: 'Erro na requisição',
                'HTTP_ERROR',
                $e->getStatusCode()
            );
        }

        // Generic server errors (hide details in production)
        $message = config('app.debug')
            ? $e->getMessage()
            : 'Ocorreu um erro interno. Tente novamente mais tarde.';

        return $this->errorResponse(
            $message,
            'INTERNAL_ERROR',
            500
        );
    }

    /**
     * Create a standardized error response.
     */
    protected function errorResponse(string $message, string $code, int $status): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'code' => $code,
        ], $status);
    }
}
