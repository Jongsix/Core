<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 5 2018
 *
 */

namespace MikoPBX\Common\Models;

use Phalcon\Mvc\Model\Relation;

/**
 * Class SoundFiles
 *
 * @package MikoPBX\Common\Models
 */
class SoundFiles extends ModelsBase
{
    public const CATEGORY_MOH = 'moh';
    public const CATEGORY_CUSTOM = 'custom';
    /**
     * @Primary
     * @Identity
     * @Column(type="integer", nullable=false)
     */
    public $id;
    /**
     * @Column(type="string", nullable=true)
     */
    public ?string $name = null;
    /**
     * @Column(type="string", nullable=true)
     */
    public ?string $path = null;
    /**
     * @Column(type="string", nullable=true)
     */
    public ?string $category = null;

    public function initialize(): void
    {
        $this->setSource('m_SoundFiles');
        parent::initialize();
        $this->hasMany(
            'id',
            CallQueues::class,
            'periodic_announce_sound_id',
            [
                "alias"      => "CallQueues",
                "foreignKey" => [
                    "allowNulls" => true,
                    "action"     => Relation::ACTION_RESTRICT,
                ],
            ]
        );

        $this->hasMany(
            'id',
            OutWorkTimes::class,
            'audio_message_id',
            [
                "alias"      => "OutWorkTimes",
                "foreignKey" => [
                    "allowNulls" => true,
                    "action"     => Relation::ACTION_RESTRICT,
                ],
            ]
        );
        $this->hasMany(
            'id',
            IvrMenu::class,
            'audio_message_id',
            [
                "alias"      => "IvrMenu",
                "foreignKey" => [
                    "allowNulls" => true,
                    "action"     => Relation::ACTION_RESTRICT,
                ],
            ]
        );
    }
}