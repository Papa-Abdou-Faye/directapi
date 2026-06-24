<?php
require __DIR__ . '/config.php';

// ⚠️ SystemReference doit venir d'une transaction RÉELLE réussie (ex: via FilterTransactions)
$res = $gim->capture([
    'SystemReference' => '163016',   // <-- a remplacer par une vraie référence
]);
dump_res('Capture', $res);
