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

namespace MikoPBX\AdminCabinet\Forms;

use Phalcon\Forms\Element\Check;
use Phalcon\Forms\Element\Hidden;
use Phalcon\Forms\Element\Numeric;
use Phalcon\Forms\Element\Password;
use Phalcon\Forms\Element\Select;
use Phalcon\Forms\Element\Text;
use Phalcon\Forms\Element\TextArea;
use Phalcon\Forms\Form;

/**
 * Class SipProviderEditForm
 *
 * @package MikoPBX\AdminCabinet\Forms
 * @property \MikoPBX\Common\Providers\TranslationProvider translation
 */
class SipProviderEditForm extends Form
{
    public function initialize($entity = null): void
    {
        // Не нужны провайдеру
        // Busylevel
        // Extension
        // Networkfilterid

        // ProviderType
        $this->add(new Hidden('providerType', ['value' => 'SIP']));

        // Disabled
        $this->add(new Hidden('disabled'));

        // ID
        $this->add(new Hidden('id'));

        // Uniqid
        $this->add(new Hidden('uniqid'));

        // Type
        $this->add(new Hidden('type'));


        // Description
        $this->add(new Text('description'));

        // Username
        $this->add(new Text('username'));

        // Secret
        $this->add(new Password('secret'));

        // Host
        $this->add(new Text('host'));

        // Dtmfmode
        $arrDTMFType = [
            'auto'      => $this->translation->_('auto'),
            'inband'    => $this->translation->_('inband'),
            'info'      => $this->translation->_('info'),
            'rfc4733'   => $this->translation->_('rfc4733'),
            'auto_info' => $this->translation->_('auto_info'),
        ];

        $dtmfmode = new Select(
            'dtmfmode', $arrDTMFType, [
            'using'    => [
                'id',
                'name',
            ],
            'useEmpty' => false,
            'value'    => $entity->dtmfmode,
            'class'    => 'ui selection dropdown dtmfmode-select',
        ]
        );
        $this->add($dtmfmode);


        // Port
        $this->add(new Numeric('port'));

        // Nat
        $arrNatType = [
            'force_rport,comedia' => 'force_rport, comedia',
            'force_rport'         => 'force_rport',
            'comedia'             => 'comedia',
            'auto_force_rport'    => 'auto_force_rport',
            'no'                  => 'no',
        ];

        $nat = new Select(
            'nat', $arrNatType, [
            'using'    => [
                'id',
                'name',
            ],
            'useEmpty' => false,
            'value'    => $entity->nat,
            'class'    => 'ui selection dropdown protocol-select',
        ]
        );
        $this->add($nat);

        // Qualify
        $cheskarr = ['value' => null];
        if ($entity->qualify) {
            $cheskarr = ['checked' => 'checked', 'value' => null];
        }

        $this->add(new Check('qualify', $cheskarr));

        // Qualifyfreq
        $this->add(new Numeric('qualifyfreq'));

        // Defaultuser
        $this->add(new Text('defaultuser'));

        // Fromuser
        $this->add(new Text('fromuser'));

        // Fromdomain
        $this->add(new Text('fromdomain'));

        // Noregister
        $cheskarr = ['value' => null];
        if ($entity->noregister) {
            $cheskarr = ['checked' => 'checked', 'value' => null];
        }
        $this->add(new Check('noregister', $cheskarr));


        // Disablefromuser
        $cheskarr = ['value' => null];
        if ($entity->disablefromuser) {
            $cheskarr = ['checked' => 'checked', 'value' => null];
        }
        $this->add(new Check('disablefromuser', $cheskarr));

        // Receive_calls_without_auth
        $cheskarr = ['value' => null];
        if ($entity->receive_calls_without_auth) {
            $cheskarr = ['checked' => 'checked', 'value' => null];
        }
        $this->add(new Check('receive_calls_without_auth', $cheskarr));

        // Manualattributes
        $rows = max(round(strlen($entity->manualattributes) / 95), 2);
        $this->add(new TextArea('manualattributes', ["rows" => $rows]));
    }
}