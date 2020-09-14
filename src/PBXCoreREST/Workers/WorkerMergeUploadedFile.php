<?php
/**
 * Copyright © MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Alexey Portnov, 7 2020
 */

namespace MikoPBX\PBXCoreREST\Workers;
require_once 'Globals.php';

use MikoPBX\Core\Workers\WorkerBase;
use MikoPBX\Core\System\Util;


class WorkerMergeUploadedFile extends WorkerBase
{
    public function start($argv): void
    {
        $settings_file = trim($argv[1]);
        if ( ! file_exists($settings_file)) {
            Util::sysLogMsg("WorkerMergeUploadedFile", 'File with settings not found');
            return;
        }
        $file_data = json_decode(file_get_contents($settings_file), true);
        if ( ! isset($file_data['action'])) {
            Util::sysLogMsg("WorkerMergeUploadedFile", 'Wrong json settings');
            return;
        }

        if ($file_data['action'] === 'merge') {
            $settings = $file_data['data'];
            if ( ! file_exists($settings['result_file'])) {
                Util::mergeFilesInDirectory(
                    $settings['temp_dir'],
                    $settings['resumableFilename'],
                    $settings['resumableTotalChunks'],
                    $settings['result_file'],
                    dirname($settings['result_file'])
                );
            }
            // $res = file_exists($settings['result_file']);
            // Отложенное удаление файла.
            $rm_file = basename(dirname($settings['result_file'])) === 'tmp' ? $settings['result_file'] : dirname(
                $settings['result_file']
            );
            Util::mwExecBg(
                '/sbin/shell_functions.sh killprocesses ' . $rm_file . ' -TERM 0;rm -rf ' . $rm_file,
                '/dev/null',
                120
            );
        }
    }

}


// Start worker process
$workerClassname = WorkerMergeUploadedFile::class;
if (isset($argv) && count($argv) > 1) {
    cli_set_process_title($workerClassname);
    try {
        $worker = new $workerClassname();
        $worker->start($argv);
    } catch (\Error $e) {
        global $errorLogger;
        $errorLogger->captureException($e);
        Util::sysLogMsg("{$workerClassname}_EXCEPTION", $e->getMessage());
    }
}
