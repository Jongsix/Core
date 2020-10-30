<?php

declare(strict_types=1);

/**
 * This file is part of the Phalcon API.
 *
 * (c) Phalcon Team <team@phalcon.io>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

namespace MikoPBX\PBXCoreREST\Providers;

use MikoPBX\PBXCoreREST\Http\Request;
use Phalcon\Di\DiInterface;
use Phalcon\Di\ServiceProviderInterface;

class RequestProvider implements ServiceProviderInterface
{
    public const SERVICE_NAME = 'request';

    /**
     * Register request service provider
     *
     * @param \Phalcon\Di\DiInterface $di
     */
    public function register(DiInterface $di): void
    {
        $di->setShared(self::SERVICE_NAME, new Request());
    }
}