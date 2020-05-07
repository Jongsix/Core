<?php
/**
 * Copyright © MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Alexey Portnov, 2 2020
 */
namespace MikoPBX\Core\Workers;

require_once('globals_boot.php');

use Phalcon\Exception;
use MikoPBX\Core\Config\RegisterDIServices;
use MikoPBX\Core\System\{BeanstalkClient, Util};
use MikoPBX\Common\Models\{CallDetailRecordsTmp, Users};
use PDOException;

/**
 * Class WorkerCdr
 * Обработка записей CDR. Заполение длительности звонков.
 */
class WorkerCdr extends WorkerBase
{

    public const SELECT_CDR_TUBE='select_cdr_tube';
    public const UPDATE_CDR_TUBE='update_cdr_tube';


    /** @var array */
    private $filter;
    private $client_queue;
    private $timeout = 10;
    private $internal_numbers = [];
    private $no_answered_calls = [];


    /**
     * Entry point
     */
    public function start():void
    {
        $this->filter = [
            '(work_completed<>1 OR work_completed IS NULL) AND endtime IS NOT NULL',
            'miko_tmp_db'         => true,
            'columns'             => 'start,answer,src_num,dst_num,dst_chan,endtime,linkedid,recordingfile,dialstatus,UNIQUEID',
            'miko_result_in_file' => true,
        ];


        $this->client_queue = new BeanstalkClient(self::SELECT_CDR_TUBE);
        $this->client_queue->subscribe('ping_'.self::class, [$this, 'pingCallBack']);

        $this->initSettings();

        while (true) {
            $result = false;
            try {
                $result = $this->client_queue->request(json_encode($this->filter), 10);
            } catch (Exception $e) {
                $result = ($result === true) ? $result : false;
                $error  = $e->getMessage();
                Util::sysLogMsg(self::class.'_ERROR', $error);
            }

            if ($result !== false) {
                $this->updateCdr();
            }
            $this->client_queue->wait(5); // instead of sleep
        }
    }

    private function initSettings()
    {
        $this->internal_numbers  = [];
        $this->no_answered_calls = [];
        $users = Users::find();
        foreach ($users as $user) {
            if (empty($user->email)) {
                continue;
            }
            try {
                foreach ($user->Extensions as $exten) {
                    $this->internal_numbers[$exten->number] = [
                        'email'    => $user->email,
                        'language' => $user->language,
                    ];
                }
            } catch (Exception $e) {
                Util::sysLogMsg('WorkerCdr', $e->getMessage());
            }

        }
    }

    /**
     * Обработчик результата запроса.
     *
     */
    private function updateCdr():void
    {
        $this->initSettings();
        $result_data = $this->client_queue->getBody();
        // Получаем результат.
        $result = json_decode($result_data, true);
        if (file_exists($result)) {
            $file_data = json_decode(file_get_contents($result), true);
            unlink($result);
            $result = $file_data;
        }
        if ( ! is_array($result) && ! is_object($result)) {
            return;
        }
        if (count($result) < 1) {
            return;
        }
        $arr_update_cdr = [];
        // Получаем идентификаторы активных каналов.
        $channels_id = $this->getActiveIdChannels();
        foreach ($result as $row) {
            if (array_key_exists($row['linkedid'], $channels_id)) {
                // Цепочка вызовов еще не завершена.
                continue;
            }
            if (trim($row['recordingfile']) !== '') {
                // Если каналов не существует с ID, то можно удалить временные файлы.
                $p_info = pathinfo($row['recordingfile']);
                $fname  = $p_info['dirname'] . '/' . $p_info['filename'] . '.wav';
                if (file_exists($fname)) {
                    @unlink($fname);
                }
            }
            $start      = strtotime($row['start']);
            $answer     = strtotime($row['answer']);
            $end        = strtotime($row['endtime']);
            $dialstatus = trim($row['dialstatus']);

            $duration = max(($end - $start), 0);
            $billsec  = ($end != 0 && $answer != 0) ? ($end - $answer) : 0;

            $disposition = 'NOANSWER';
            if ($billsec > 0) {
                $disposition = 'ANSWERED';
            } elseif ('' !== $dialstatus) {
                $disposition = ($dialstatus === 'ANSWERED') ? $disposition : $dialstatus;
            }

            if ($billsec <= 0) {
                $row['answer'] = '';
                $billsec       = 0;

                if ( ! empty($row['recordingfile'])) {
                    $p_info    = pathinfo($row['recordingfile']);
                    $file_list = [
                        $p_info['dirname'] . '/' . $p_info['filename'] . '.mp3',
                        $p_info['dirname'] . '/' . $p_info['filename'] . '.wav',
                        $p_info['dirname'] . '/' . $p_info['filename'] . '_in.wav',
                        $p_info['dirname'] . '/' . $p_info['filename'] . '_out.wav',
                    ];
                    foreach ($file_list as $file) {
                        if ( ! file_exists($file)) {
                            continue;
                        }
                        @unlink($file);
                    }
                }
            }

            if ($disposition !== 'ANSWERED') {
                if (file_exists($row['recordingfile'])) {
                    @unlink($row['recordingfile']);
                }
            } elseif ( ! file_exists(Util::trimExtensionForFile($row['recordingfile']) . 'wav') && ! file_exists($row['recordingfile'])) {
                /** @var CallDetailRecordsTmp $rec_data */
                $rec_data = CallDetailRecordsTmp::findFirst("linkedid='{$row['linkedid']}' AND dst_chan='{$row['dst_chan']}'");
                if ($rec_data!==null) {
                    $row['recordingfile'] = $rec_data->recordingfile;
                }
            }

            $data = [
                'work_completed' => 1,
                'duration'       => $duration,
                'billsec'        => $billsec,
                'disposition'    => $disposition,
                'UNIQUEID'       => $row['UNIQUEID'],
                'recordingfile'  => ($disposition === 'ANSWERED') ? $row['recordingfile'] : '',
                'tmp_linked_id'  => $row['linkedid'],
            ];

            $arr_update_cdr[] = $data;
            $this->checkNoAnswerCall(array_merge($row, $data));
        }

        foreach ($arr_update_cdr as $data) {
            $linkedid              = $data['tmp_linked_id'];
            $data['GLOBAL_STATUS'] = $data['disposition'];
            if (isset($this->no_answered_calls[$linkedid]) &&
                isset($this->no_answered_calls[$linkedid]['NOANSWER']) &&
                $this->no_answered_calls[$linkedid]['NOANSWER'] == false) {

                $data['GLOBAL_STATUS'] = 'ANSWERED';
            }
            unset($data['tmp_linked_id']);
            $this->client_queue->publish(json_encode($data), null, WorkerCdr::UPDATE_CDR_TUBE);
        }

        $this->notifyByEmail();


    }

    /**
     * Функция позволяет получить активные каналы.
     * Возвращает ассоциативный массив. Ключ - Linkedid, значение - массив каналов.
     *
     * @return array
     */
    private function getActiveIdChannels():array
    {
        $am           = Util::getAstManager('off');
        $active_chans = $am->GetChannels(true);
        $am->Logoff();

        return $active_chans;
    }

    /**
     * Анализируем не отвеченные вызовы. Наполняем временный массив для дальнейшей обработки.
     *
     * @param $row
     */
    private function checkNoAnswerCall($row): void
    {
        if ($row['disposition'] === 'ANSWERED') {
            $this->no_answered_calls[$row['linkedid']]['NOANSWER'] = false;

            return;
        }
        if ( ! array_key_exists($row['dst_num'], $this->internal_numbers)) {
            // dst_num - не является номером сотрудника. Это исходящий.
            return;
        }
        $is_internal = false;
        if ((array_key_exists($row['src_num'], $this->internal_numbers))) {
            // Это внутренний вызов.
            $is_internal = true;
        }

        $this->no_answered_calls[$row['linkedid']][] = [
            'from_number' => $row['src_num'],
            'to_number'   => $row['dst_num'],
            'start'       => $row['start'],
            'answer'      => $row['answer'],
            'endtime'     => $row['endtime'],
            'email'       => $this->internal_numbers[$row['dst_num']]['email'],
            'language'    => $this->internal_numbers[$row['dst_num']]['language'],
            'is_internal' => $is_internal,
            'duration'    => $row['duration'],
        ];
    }

    /**
     * Постановка задачи в очередь на оповещение по email.
     */
    private function notifyByEmail():void
    {
        foreach ($this->no_answered_calls as $call) {
            $this->client_queue->publish(json_encode($call), null, WorkerNotifyByEmail::class);
        }
        $this->no_answered_calls = [];
    }

}

// Start worker process
$workerClassname = WorkerCdr::class;
if (isset($argv) && count($argv) > 1 && $argv[1] === 'start') {
    cli_set_process_title($workerClassname);
    try {
        $worker = new $workerClassname();
        $worker->start();
    } catch (\Exception $e) {
        global $errorLogger;
        $errorLogger->captureException($e);
        Util::sysLogMsg("{$workerClassname}_EXCEPTION", $e->getMessage());
    }
}