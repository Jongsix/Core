<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 5 2018
 *
 */

namespace MikoPBX\AdminCabinet\Controllers;

use MikoPBX\AdminCabinet\Forms\NetworkEditForm;
use MikoPBX\Common\Models\LanInterfaces;

class NetworkController extends BaseController
{

    /**
     * Lan cards settings form
     */
    public function modifyAction(): void
    {
        $networkInterfaces = LanInterfaces::find();
        foreach ($networkInterfaces as $record) {
            if ($record->disabled !== '1') {
                $arrEth[] = $record;
            }
        }
        $template         = new LanInterfaces();
        $template->id     = 'new';
        $template->dhcp   = '1';
        $template->vlanid = '4095';

        $arrEth['new'] = $template;

        $internetInterface = LanInterfaces::findFirstByInternet('1');
        if ($internetInterface === null) {
            $internetInterface = new LanInterfaces();
        }

        // We will find additional interfaces which we can delete
        $deletableInterfaces = [];
        $countInterfaces     = LanInterfaces::count(['group' => 'interface']);
        foreach ($countInterfaces as $record) {
            if ($record->rowcount > 1) {
                $deletableInterfaces[] = $record->interface;
            }
        }
        $form                      = new NetworkEditForm($internetInterface, ['eths' => $arrEth]);
        $this->view->form          = $form;
        $this->view->eths          = $arrEth;
        $this->view->deletableEths = $deletableInterfaces;
        $this->view->submitMode    = null;
    }

    /**
     * Saves the lan cards settings
     */
    public function saveAction(): void
    {
        if ( ! $this->request->isPost()) {
            return;
        }

        $data = $this->request->getPost();
        $this->db->begin();
        $networkInterfaces = LanInterfaces::find();

        // Update interface settings
        foreach ($networkInterfaces as $eth) {
            $this->fillEthStructure($eth, $data);
            if ($eth->save() === false) {
                $errors = $eth->getMessages();
                $this->flash->warning(implode('<br>', $errors));
                $this->view->success = false;
                $this->db->rollback();

                return;
            }
        }

        // Save additional interface settings if it exists
        if ($data['interface_new'] != '') {
            $eth     = new LanInterfaces();
            $eth->id = 'new';
            $this->fillEthStructure($eth, $data);
            $eth->id       = '';
            $eth->disabled = '0';
            if ($eth->save() === false) {
                $errors = $eth->getMessages();
                $this->flash->warning(implode('<br>', $errors));
                $this->view->success = false;
                $this->db->rollback();

                return;
            }
        }

        $this->view->reload = 'network/modify';
        $this->flash->success($this->translation->_('ms_SuccessfulSaved'));
        $this->view->success = true;
        $this->db->commit();
    }

    /**
     * Fills network interface settings
     *
     * @param $eth
     * @param $data
     */
    private function fillEthStructure($eth, $data): void
    {
        foreach ($eth as $name => $value) {
            $itIsInternetInterfce = $eth->id === $data['internet_interface'];
            switch ($name) {
                case 'topology':
                    if ($itIsInternetInterfce) {
                        $eth->$name = ($data['usenat'] === 'on') ? 'private' : 'public';
                    } else {
                        $eth->$name = '';
                    }
                    break;
                case 'extipaddr':
                    if ($itIsInternetInterfce) {
                        if (array_key_exists($name, $data)) {
                            $eth->$name = ($data['usenat'] === 'on') ? $data[$name] : $data['ipaddr_' . $eth->id];
                        } else {
                            $eth->$name = $data['ipaddr_' . $eth->id];
                        }
                    } else {
                        $eth->$name = '';
                    }

                    break;
                case 'exthostname':
                    if ($itIsInternetInterfce) {
                        if (array_key_exists($name, $data)) {
                            $eth->$name = ($data['usenat'] === 'on') ? $data[$name] : $data['hostname'];
                        } else {
                            $eth->$name = $data['hostname'];
                        }
                    } else {
                        $eth->$name = '';
                    }
                    break;
                case 'dhcp':
                    if (array_key_exists($name . '_' . $eth->id, $data)) {
                        $eth->$name = ($data['dhcp_' . $eth->id]) === 'on' ? '1' : '0';
                    }
                    break;
                case 'internet':
                    $eth->$name = $itIsInternetInterfce ? '1' : '0';
                    break;
                case 'ipaddr':
                case 'subnet':
                    $eth->$name = '';
                    if (array_key_exists($name . '_' . $eth->id, $data)) {
                        $eth->$name = ($data['dhcp_' . $eth->id]) === 'on' ? '' : $data[$name . '_' . $eth->id];
                    }
                    break;
                case 'interface':
                    if ($eth->id === 'new') {
                        $eth->$name = LanInterfaces::findFirstById($data[$name . '_' . $eth->id])->interface;
                    }
                    break;
                case 'domain':
                case 'hostname':
                case 'gateway':
                case 'primarydns':
                case 'secondarydns':
                    if (array_key_exists($name, $data) && $itIsInternetInterfce) {
                        $eth->$name = $data[$name];
                    } else {
                        $eth->$name = '';
                    }
                    break;
                default:
                    if (array_key_exists($name . '_' . $eth->id, $data)) {
                        $eth->$name = $data[$name . '_' . $eth->id];
                    }
            }
        }
    }

    /**
     * Delete a lan interface by ID
     *
     * @param string $ethId interface id
     */
    public function deleteAction($ethId = ''): void
    {
        $eth = LanInterfaces::findFirstById($ethId);
        if ($eth !== null && $eth->delete() === false) {
            $errors = $eth->getMessages();
            $this->flash->warning(implode('<br>', $errors));
            $this->view->success = false;
            return;
        }
        $this->view->success = true;
    }
}
