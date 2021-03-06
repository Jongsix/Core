<?php
/*
 * MikoPBX - free phone system for small business
 * Copyright (C) 2017-2020 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

declare(strict_types=1);

namespace MikoPBX\Common\Providers;


use Nats\Connection as NatsConnection;
use Nats\ConnectionOptions as NatsConnectionOptions;
use Phalcon\Di\DiInterface;
use Phalcon\Di\ServiceProviderInterface;

/**
 * Main database connection is created based in the parameters defined in the configuration file
 */
class NatsConnectionProvider implements ServiceProviderInterface
{
    public const SERVICE_NAME = 'natsConnection';

    /**
     * Registers natsConnection service provider
     *
     * @param \Phalcon\Di\DiInterface $di
     */
    public function register(DiInterface $di): void
    {
        $gnatsConfig = $di->getShared('config')->get('gnats');
        $di->setShared(
            self::SERVICE_NAME,
            function () use ($gnatsConfig) {
                $connectionOptions = new NatsConnectionOptions();
                $host              = $gnatsConfig->host;
                $port              = $gnatsConfig->port;
                $connectionOptions->setHost($host)->setPort($port);

                return new NatsConnection($connectionOptions);
            }
        );
    }
}