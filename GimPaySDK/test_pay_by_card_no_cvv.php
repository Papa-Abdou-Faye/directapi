<?php
require __DIR__ . '/config.php';

$res = $gim->payByCardWithoutCvv([
    'PAN'              => '4240325739707993',
    'DateExpiration'   => '2803',
    'AmountTrxn'       => 500,
    'MerchantReference'=> 'MOTO_' . date('YmdHis') . '_' . bin2hex(random_bytes(3)),
]);
dump_res('PayByCard (MOTO / sans CVV)', $res);
