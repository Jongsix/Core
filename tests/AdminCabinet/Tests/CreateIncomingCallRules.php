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

class CreateIncomingCallRules extends MikoPBXTestsBase
{
    /**
     * @depends testLogin
     */
    public function testDeleteCallRules():void
    {
        $this->clickSidebarMenuItemByHref('/admin-cabinet/incoming-routes/index/');
        $tableId = 'routingTable';
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
    public function testCreateIncomingCallRule($params):void
    {
        $this->clickSidebarMenuItemByHref('/admin-cabinet/incoming-routes/index/');
        $this->clickDeleteButtonOnRowWithText($params['note']);

        $this->clickButtonByHref('/admin-cabinet/incoming-routes/modify');
        $this->changeTextAreaValue('note', $params['note']);
        $this->selectDropdownItem('provider', $params['provider']);
        $this->changeInputField('number', $params['number']);
        $this->selectDropdownItem('extension', $params['extension']);
        $this->changeInputField('timeout', $params['timeout']);


        $this->submitForm('incoming-route-form');

        //Remember ID
        $id = $this->getCurrentRecordID();
        $this->clickSidebarMenuItemByHref('/admin-cabinet/incoming-routes/index/');
        $this->clickModifyButtonOnRowWithID($id);

        //Asserts
        $this->assertTextAreaValueIsEqual('note', $params['note']);
        $this->assertMenuItemSelected('provider', $params['provider']);
        $this->assertInputFieldValueEqual('number', $params['number']);
        $this->assertMenuItemSelected('extension', $params['extension']);
        $this->assertInputFieldValueEqual('timeout', $params['timeout']);

    }

    /**
     * Dataset provider
     * @return array
     */
    public function additionProvider() :array
    {
        $params=[];
        $params[] = [[
            'note' => 'First rule',
            'provider'        => 'none',
            'number'   => 74952293042,
            'extension'   => 201,
            'timeout'=>14
        ]];

        $params[] = [[
            'note' => 'Second rule',
            'provider'        => 'SIP-PROVIDER-34F7CCFE873B9DABD91CC8D75342CB43',
            'number'   => 74952293043,
            'extension'   => 202,
            'timeout'=>16
        ]];

        return $params;
    }
}