<?php
require __DIR__ . '/config.php';

$res = $gim->filterTransactions([
    'DateFrom'      => '20251201',   // YYYYMMDD
    'DateTo'        => date('Ymd'),  // YYYYMMDD
    'DisplayLength' => 10,
    'DisplayStart'  => 0,
]);
dump_res('FilterTransactions', $res);
