<?php
require __DIR__ . '/config.php';

// ⚠️ TxnId doit venir d'une transaction RÉELLE réussie
$res = $gim->refund([
    'amount'       => 500,
    'amountTrxn'   => 500,
    'TxnId'        => '163000',      // <-- a remplacer par un vrai TxnId
    'refundReason' => 'Demande client',
]);
dump_res('Refund', $res);
