<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 5 2020
 *
 */

namespace MikoPBX\Core\Asterisk\Configs;


use MikoPBX\Core\System\Util;
use MikoPBX\Modules\Config\ConfigClass;

class CelConf extends ConfigClass
{
    protected string $description = 'cel.conf';

    protected function generateConfigProtected(): void
    {
        $conf = "[general]\n" .
            "enable=yes\n" .
            "events=CHAN_START,CHAN_END,ANSWER\n" .
            "dateformat = %F %T\n\n" .
            "[manager]\n" .
            "enabled = yes\n\n";
        Util::fileWriteContent($this->config->path('asterisk.astetcdir') . '/cel.conf', $conf);
    }
}