<?php
require __DIR__ . '/config.php';

$res = $gim->payByCard([
    'PAN'              => '4240325739707993',   // carte de test UAT
    'DateExpiration'   => '2803',               // YYMM
    'CVV'              => '659',
    'AmountTrxn'       => 500,
    'MerchantReference'=> 'PAY_' . date('YmdHis') . '_' . bin2hex(random_bytes(3)),
    'ReturnURL'        => 'https://webhook.site/7e4a702d-028b-4846-904f-3eb19c28c0d9',
]);
dump_res('PayByCard', $res);
