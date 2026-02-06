<?php

namespace App\Exceptions;

use Exception;

/**
 * CepNotFoundException
 * 
 * Thrown when a CEP lookup fails.
 */
class CepNotFoundException extends Exception
{
    public function __construct(string $message = 'CEP não encontrado.')
    {
        parent::__construct($message);
    }
}
