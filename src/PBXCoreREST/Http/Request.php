<?php

declare(strict_types=1);

namespace MikoPBX\PBXCoreREST\Http;

use Phalcon\Http\Request as PhRequest;

class Request extends PhRequest
{
    /**
     * @return bool
     */
    public function isLocalHostRequest(): bool
    {
        return ($_SERVER['REMOTE_ADDR'] === '127.0.0.1');
    }

    public function isDebugModeEnabled(): bool
    {
        return ($this->getDI()->getShared('config')->path('adminApplication.debugMode'));
    }

    public function isAuthorizedSessionRequest(): bool
    {
        $sessionRO = $this->getDI()->getShared('sessionRO');

        return (is_array($sessionRO) && array_key_exists('auth', $sessionRO));
    }

}