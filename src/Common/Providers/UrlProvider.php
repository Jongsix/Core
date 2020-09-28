<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 6 2020
 *
 */

declare(strict_types=1);
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 4 2020
 *
 */

namespace MikoPBX\Common\Providers;


use Phalcon\Di\DiInterface;
use Phalcon\Di\ServiceProviderInterface;
use Phalcon\Url;

/**
 * The URL component is used to generate all kind of urls in the application
 */
class UrlProvider implements ServiceProviderInterface
{
    public const SERVICE_NAME = 'url';

    /**
     * Register url service provider
     *
     * @param \Phalcon\Di\DiInterface $di
     */
    public function register(DiInterface $di): void
    {
        $baseUri = $di->getShared('config')->path('adminApplication.baseUri');
        $di->setShared(
            self::SERVICE_NAME,
            function () use ($baseUri) {
                $url = new Url();
                $url->setBaseUri($baseUri);

                return $url;
            }
        );
    }
}