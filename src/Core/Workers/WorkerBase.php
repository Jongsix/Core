<?php
/**
 * Copyright © MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Alexey Portnov, 2 2020
 */
namespace MikoPBX\Core\Workers;


use MikoPBX\Core\System\BeanstalkClient;
use Phalcon\Di;

abstract class WorkerBase
{
    /** @var \Phalcon\Di $di */
    protected $di;

    /**
     * Workers shared constructor
     */
    public function __construct()
    {
        $this->di = Di::getDefault();
        file_put_contents($this->getPidFile(), getmypid());
    }

    /**
     * Обработка пинга демона.
     *
     * @param BeanstalkClient $message
     */
    public function pingCallBack($message): void
    {
        $message->reply(json_encode($message->getBody() . ':pong'));
    }

    public function getPidFile():string
    {
        $name = str_replace("\\", '-', self::class);
        return "/var/run/{$name}.pid";
    }
}