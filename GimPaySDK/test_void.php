<?php
require __DIR__ . '/config.php';

// ⚠️ Dans la collection, Void pointe vers RefundTransaction (a confirmer cote GIM)
$res = $gim->void([
    'amount'       => 500,
    'amountTrxn'   => 500,
    'TxnId'        => '163000',      // <-- a remplacer par un vrai TxnId
    'refundReason' => 'Annulation',
]);
dump_res('Void / Cancel', $res);
