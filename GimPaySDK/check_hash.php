<?php
require __DIR__ . '/GimPaySDK.php';

$key = 'b9575e2e2a4b48fefe8436630e2db996'; 
$M   = '15670306513';
$T   = '790105';
$D   = '20260617112800';        

echo "message = DateTimeLocalTrxn=$D&MerchantId=$M&TerminalId=$T\n";
echo "hash    = " . GimPaySecureHash::compute($M, $T, $D, $key) . "\n";