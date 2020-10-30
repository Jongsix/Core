<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 5 2020
 *
 */

namespace MikoPBX\Tests\AdminCabinet\Tests;


use Facebook\WebDriver\WebDriverBy;
use MikoPBX\Tests\AdminCabinet\Lib\MikoPBXTestsBase;

class CreateFirewallRules extends MikoPBXTestsBase
{
    /**
     * @depends testLogin
     */
    public function testDeleteAllFirewallRules():void
    {
        $this->clickSidebarMenuItemByHref("/admin-cabinet/firewall/index/");
        $tableId = 'firewall-table';
        $this->deleteAllRecordsOnTable($tableId);
        $xpath         = "//table[@id='{$tableId}']//a[contains(@href,'delete') and not(contains(@class,'disabled'))]";
        $this->assertElementNotFound(WebDriverBy::xpath($xpath));
    }

    /**
     * @depends testLogin
     * @dataProvider additionProvider
     *
     * @param array $params
     */
    public function testFirewallRule(array $params): void
    {
        $this->clickSidebarMenuItemByHref("/admin-cabinet/firewall/index/");
        $this->clickButtonByHref('/admin-cabinet/firewall/modify');
        $this->changeInputField('description',$params['description']);
        $this->changeInputField('network',$params['network']);
        $this->selectDropdownItem('subnet',$params['subnet']);

        foreach ($params['rules'] as $key=>$value){
            $this->changeCheckBoxState('rule_'.$key, $value);
        }
        $this->changeCheckBoxState('local_network',$params['local_network']);
        $this->changeCheckBoxState('newer_block_ip',$params['newer_block_ip']);

        $this->submitForm('firewall-form');

        //Remember ID
        $id = $this->getCurrentRecordID();
        $this->clickSidebarMenuItemByHref('/admin-cabinet/firewall/index/');
        $this->clickModifyButtonOnRowWithID($id);


        //asserts
        $this->assertInputFieldValueEqual('description',$params['description']);
        $this->assertInputFieldValueEqual('network',$params['network']);
        $this->assertMenuItemSelected('subnet',$params['subnet']);

        foreach ($params['rules'] as $key=>$value){
            $this->assertCheckBoxStageIsEqual('rule_'.$key, $value);
        }
        $this->assertCheckBoxStageIsEqual('local_network',$params['local_network']);
        $this->assertCheckBoxStageIsEqual('newer_block_ip',$params['newer_block_ip']);

    }

    /**
     * Dataset provider
     * @return array
     */
    public function additionProvider(): array
    {
        $params   = [];
        $params[] = [
            [
                'description' => 'MikoNetwork',
                'network'      => '172.16.32.0',
                'subnet'        => 24,
                'local_network'=>true,
                'newer_block_ip'=>true,
                'rules'=>[
                    'SIP'=>true,
                    'WEB'=>true,
                    'SSH'=>true,
                    'AMI'=>true,
                    'AJAM'=>true,
                    'ICMP'=>true,
                ],
            ]
        ];
        $params[] = [
            [
                'description' => 'Nikolay macbook',
                'network'      => '172.16.32.69',
                'subnet'        => 32,
                'local_network'=>true,
                'newer_block_ip'=>true,
                'rules'=>[
                    'SIP'=>true,
                    'WEB'=>true,
                    'SSH'=>true,
                    'AMI'=>true,
                    'AJAM'=>true,
                    'ICMP'=>true,
                ],
            ]
        ];
        $params[] = [
            [
                'description' => 'MIKOVPN',
                'network'      => '172.16.34.0',
                'subnet'        => 24,
                'local_network'=>true,
                'newer_block_ip'=>true,
                'rules'=>[
                    'SIP'=>true,
                    'WEB'=>false,
                    'SSH'=>false,
                    'AMI'=>false,
                    'AJAM'=>false,
                    'ICMP'=>true,
                ],
            ]
        ];
        return $params;
    }
}