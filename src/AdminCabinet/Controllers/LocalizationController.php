<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 11 2018
 *
 */

namespace MikoPBX\AdminCabinet\Controllers;

class LocalizationController extends BaseController
{

    /**
     * Возвращает массив переводов для локализации в JavaScript
     *
     */
    public function getTranslatedArrayAction(): void
    {
        $arrStr = [];
        foreach ($this->di->getShared('messages') as $key => $value) {
            $arrStr[$key] = str_replace(["\n", "  ", '"'], ['', '', '\\"'], $value);
        }

        $this->view->success = true;
        $this->view->results = json_encode($arrStr);
    }
}