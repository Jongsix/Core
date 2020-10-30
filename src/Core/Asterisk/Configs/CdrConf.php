<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 5 2020
 *
 */

namespace MikoPBX\Core\Asterisk\Configs;


use MikoPBX\Modules\Config\ConfigClass;

class CdrConf extends ConfigClass
{
    protected string $description = 'cdr.conf';

    protected function generateConfigProtected(): void
    {
        $conf = "[general]\n" .
            "enable=yes\n" .
            "unanswered=yes\n\n" .
            "[sqlite]\n" .
            "usegmtime=no\n" .
            "loguniqueid=yes\n" .
            "loguserfield=yes\n";
        file_put_contents($this->config->path('asterisk.astetcdir') . '/cdr.conf', $conf);
    }
}