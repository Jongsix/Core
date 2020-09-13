<?php
/**
 * Copyright © MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Alexey Portnov, 6 2020
 */

namespace MikoPBX\Core\System\Upgrade;

use MikoPBX\Common\Models\PbxSettings;
use MikoPBX\Core\System\Util;
use MikoPBX\Core\Config\RegisterDIServices;
use Phalcon\Db\Column;
use Phalcon\Db\Index;
use Phalcon\Di;
use ReflectionClass;
use RuntimeException;

use function MikoPBX\Common\Config\appPath;


class UpdateDatabase extends Di\Injectable
{

    /**
     * @var \Phalcon\Config
     */
    private $config;

    /**
     * UpdateDatabase constructor.
     *
     */
    public function __construct()
    {
        $this->config = $this->di->getShared('config');
    }

    /**
     *
     */
    public function updateDatabaseStructure(): void
    {
        try {
            RegisterDIServices::recreateDBConnections(); // after storage remount
            $this->updateDbStructureByModelsAnnotations();
            RegisterDIServices::recreateDBConnections(); // if we change anything in structure
        } catch (RuntimeException $e) {
            echo "Errors within database upgrade process";
        }
    }

    /**
     * Обходит файлы с описанием моделей и создает таблицы в базе данных
     *
     * @return bool
     */
    private function updateDbStructureByModelsAnnotations(): bool
    {
        $result    = true;
        $modelsDir = appPath('src/Common/Models');
        $results   = glob("{$modelsDir}/*.php", GLOB_NOSORT);
        foreach ($results as $file) {
            $className        = pathinfo($file)['filename'];
            $moduleModelClass = "MikoPBX\\Common\\Models\\{$className}";
            $this->createUpdateDbTableByAnnotations($moduleModelClass);
        }

        return $result;
    }

    /**
     * Create, update DB structure by code description
     *
     * @param $modelClassName string class name with namespace
     *                        i.e. MikoPBX\Common\Models\Extensions or Modules\ModuleSmartIVR\Models\Settings
     *
     * @return bool
     */
    public function createUpdateDbTableByAnnotations(string $modelClassName): bool
    {
        $result = true;
        if (
            ! class_exists($modelClassName)
            || count(get_class_vars($modelClassName)) === 0) {
            return true;
        }
        // Test is abstract
        try {
            $reflection = new ReflectionClass($modelClassName);
            if ($reflection->isAbstract()) {
                return true;
            }
        } catch (\ReflectionException $exception) {
            return false;
        }
        $model                 = new $modelClassName();
        $connectionServiceName = $model->getReadConnectionService();
        if (empty($connectionServiceName)) {
            return false;
        }

        $connectionService = $this->di->getShared($connectionServiceName);
        $metaData          = $this->di->get('modelsMetadata');

        //https://docs.phalcon.io/4.0/ru-ru/annotations
        $modelAnnotation = $this->di->get('annotations')->get($model);

        $tableName       = $model->getSource();
        $table_structure = [];
        $indexes         = [];

        // Create columns list by code annotations
        $newColNames       = $metaData->getAttributes($model);
        $previousAttribute = '';
        foreach ($newColNames as $attribute) {
            $table_structure[$attribute] = [
                'type'      => Column::TYPE_VARCHAR,
                'after'     => $previousAttribute,
                'notNull'   => false,
                'isNumeric' => false,
                'primary'   => false,
            ];
            $previousAttribute           = $attribute;
        }

        // Set data types
        $propertiesAnnotations = $modelAnnotation->getPropertiesAnnotations();
        $attributeTypes        = $metaData->getDataTypes($model);
        foreach ($attributeTypes as $attribute => $type) {
            $table_structure[$attribute]['type'] = $type;
            // Try to find size of field
            if (array_key_exists($attribute, $propertiesAnnotations)) {
                $propertyDescription = $propertiesAnnotations[$attribute];
                if ($propertyDescription->has('Column')
                    && $propertyDescription->get('Column')->hasArgument('length')
                ) {
                    $table_structure[$attribute]['size'] = $propertyDescription->get('Column')->getArgument('length');
                }
            }
        }

        // For each numeric column change type
        $numericAttributes = $metaData->getDataTypesNumeric($model);
        foreach ($numericAttributes as $attribute => $value) {
            $table_structure[$attribute]['type']      = Column::TYPE_INTEGER;
            $table_structure[$attribute]['isNumeric'] = true;
        }

        // For each not nullable column change type
        $notNull = $metaData->getNotNullAttributes($model);
        foreach ($notNull as $attribute) {
            $table_structure[$attribute]['notNull'] = true;
        }

        // Set default values for initial save, later it fill at Models\ModelBase\beforeValidationOnCreate
        $defaultValues = $metaData->getDefaultValues($model);
        foreach ($defaultValues as $key => $value) {
            if ($value !== null) {
                $table_structure[$key]['default'] = $value;
            }
        }

        // Set primary keys
        // $primaryKeys = $metaData->getPrimaryKeyAttributes($model);
        // foreach ($primaryKeys as $attribute) {
        //     $indexes[$attribute] = new Index($attribute, [$attribute], 'UNIQUE');
        // }

        // Set bind types
        $bindTypes = $metaData->getBindTypes($model);
        foreach ($bindTypes as $attribute => $value) {
            $table_structure[$attribute]['bindType'] = $value;
        }

        // Find auto incremental column, usually it is ID column
        $keyFiled = $metaData->getIdentityField($model);
        if ($keyFiled) {
            unset($indexes[$keyFiled]);
            $table_structure[$keyFiled] = [
                'type'          => Column::TYPE_INTEGER,
                'notNull'       => true,
                'autoIncrement' => true,
                'primary'       => true,
                'isNumeric'     => true,
                'first'         => true,
            ];
        }

        // Some exceptions
        if ($modelClassName === PbxSettings::class) {
            $keyFiled = 'key';
            unset($indexes[$keyFiled]);
            $table_structure[$keyFiled] = [
                'type'          => Column::TYPE_VARCHAR,
                'notNull'       => true,
                'autoIncrement' => false,
                'primary'       => true,
                'isNumeric'     => false,
                'first'         => true,
            ];
        }

        // Create additional indexes
        $modelClassAnnotation = $modelAnnotation->getClassAnnotations();
        if ($modelClassAnnotation->has('Indexes')) {
            $additionalIndexes = $modelClassAnnotation->get('Indexes')->getArguments();
            foreach ($additionalIndexes as $index) {
                $indexName = "i_{$tableName}_{$index['name']}";
                $indexes[$indexName] = new Index($indexName, $index['columns'], $index['type']);
            }
        }

        // Create new table structure
        $columns = [];
        foreach ($table_structure as $colName => $colType) {
            $columns[] = new Column($colName, $colType);
        }

        $columnsNew = [
            'columns' => $columns,
            'indexes' => $indexes,
        ];

        $connectionService->begin();

        if ( ! $connectionService->tableExists($tableName)) {
            Util::echoWithSyslog(' - UpdateDatabase: Create new table: ' . $tableName . ' ');
            $result = $connectionService->createTable($tableName, '', $columnsNew);
            Util::echoGreenDone();
        } else {
            // Table exists, we have to check/upgrade its structure
            $currentColumnsArr = $connectionService->describeColumns($tableName, '');

            if ($this->isTableStructureNotEqual($currentColumnsArr, $columns)) {
                Util::echoWithSyslog(' - UpdateDatabase: Upgrade table: ' . $tableName . ' ');
                // Create new table and copy all data
                $currentStateColumnList = [];
                $oldColNames            = []; // Старые названия колонок
                $countColumnsTemp       = count($currentColumnsArr);
                for ($k = 0; $k < $countColumnsTemp; $k++) {
                    $currentStateColumnList[$k] = $currentColumnsArr[$k]->getName();
                    $oldColNames[]              = $currentColumnsArr[$k]->getName();
                }

                // Create temporary clone on current table with all columns and date
                // Delete original table
                $gluedColumns = implode(',', $currentStateColumnList);
                $query        = "CREATE TEMPORARY TABLE {$tableName}_backup({$gluedColumns}); 
INSERT INTO {$tableName}_backup SELECT {$gluedColumns} FROM {$tableName}; 
DROP TABLE  {$tableName}";
                $result       = $result && $connectionService->execute($query);

                // Create new table with new columns structure
                $result = $result && $connectionService->createTable($tableName, '', $columnsNew);

                // Copy data from temporary table to newly created
                $newColumnNames  = array_intersect($newColNames, $oldColNames);
                $gluedNewColumns = implode(',', $newColumnNames);
                $result          = $result && $connectionService->execute(
                        "INSERT INTO {$tableName} ( {$gluedNewColumns}) SELECT {$gluedNewColumns}  FROM {$tableName}_backup;"
                    );

                // Drop temporary table
                $result = $result && $connectionService->execute("DROP TABLE {$tableName}_backup;");
                Util::echoGreenDone();
            }
        }


        if ($result) {
            $this->updateIndexes($tableName, $connectionService, $indexes);
        }

        if ($result) {
            $connectionService->commit();
        } else {
            Util::sysLogMsg('createUpdateDbTableByAnnotations', "Error: Failed on create/update table {$tableName}");
            $connectionService->rollback();
        }

        return $result;
    }

    /**
     * Compare database structure with metadata info
     *
     * @param $currentTableStructure
     * @param $newTableStructure
     *
     * @return bool
     */
    private function isTableStructureNotEqual($currentTableStructure, $newTableStructure): bool
    {
        //1. Check fields count
        if (count($currentTableStructure) !== count($newTableStructure)) {
            return true;
        }

        $comparedSettings = [
            'getName',
            'getType',
            'getTypeReference',
            'getTypeValues',
            'getSize',
            'getScale',
            'isUnsigned',
            'isNotNull',
            'isPrimary',
            'isAutoIncrement',
            'isNumeric',
            'isFirst',
            'getAfterPosition',
            //'getBindType',
            'getDefault',
            'hasDefault',
        ];

        //2. Check fields types
        foreach ($newTableStructure as $index => $newField) {
            $oldField = $currentTableStructure[$index];
            foreach ($comparedSettings as $compared_setting) {
                if ($oldField->$compared_setting() !== $newField->$compared_setting()) {
                    // Sqlite transform "1" to ""1"" in default settings, but it is normal
                    if ($compared_setting === 'getDefault'
                        && $oldField->$compared_setting() === '"' . $newField->$compared_setting() . '"') {
                        continue;
                    }

                    return true; // find different columns
                }
            }
        }

        return false;
    }


    /**
     * @param string $tableName
     * @param mixed $connectionService DependencyInjection connection service used to read data
     * @param array $indexes
     *
     * @return bool
     */
    private function updateIndexes(string $tableName, $connectionService, array $indexes):bool
    {
        $result = true;
        $currentIndexes = $connectionService->describeIndexes($tableName);

        // Drop not exist indexes
        foreach ($currentIndexes as $indexName => $currentIndex){
           if(stripos($indexName, 'sqlite_autoindex')===false
           && !array_key_exists($indexName, $indexes)
           ) {
                Util::echoWithSyslog(" - UpdateDatabase: Delete index: {$indexName} ");
                $result = $result + $connectionService->dropIndex($tableName, '', $indexName);
                Util::echoGreenDone();
            }
        }

        // Add/update exist indexes
        foreach ($indexes as $indexName =>$describedIndex){
            if (array_key_exists($indexName, $currentIndexes)){
                $currentIndex = $currentIndexes[$indexName];
                if ($describedIndex->getColumns() !== $currentIndex->getColumns()){
                    Util::echoWithSyslog(" - UpdateDatabase: Update index: {$indexName} ");
                    $result = $result + $connectionService->dropIndex($tableName, '', $indexName);
                    $result = $result + $connectionService->addIndex($tableName, '', $describedIndex);
                    Util::echoGreenDone();
                }
            } else {
                Util::echoWithSyslog(" - UpdateDatabase: Add new index: {$indexName} ");
                $result = $result + $connectionService->addIndex($tableName, '', $describedIndex);
                Util::echoGreenDone();
            }
        }

        return $result;
    }
}