<?php

require __DIR__ . '/GimPaySDK.php';


$cfg = new GimPayConfig(
    'https://omni-uat.gimpay.org/Cube',        
    'b9575e2e2a4b48fefe8436630e2db996',         // Merchant Shared Key (HEX)
    15670306513,                                // MerchantId
    790105                                      // TerminalId
);
$cfg->verifySsl = false;                        // UAT (certif. éventuellement auto-signé)

$gim = new GimPayClient($cfg);


$res = $gim->initiateOrder([
    'AmountTrxn'        => 600,
    'MerchantReference' => 'REF_' . date('YmdHis') . '_' . bin2hex(random_bytes(3)),
    'PayerName'         => 'mostafa hassan test',
    'CallBackUrl'       => 'https://webhook.site/7e4a702d-028b-4846-904f-3eb19c28c0d9',
    'ExpiryDateTime'    => '202612121032',
]);

/* --- Affichage du résultat --- */
echo "HTTP : {$res['http']}\n";
echo "Réponse :\n";
echo json_encode($res['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";

if (!empty($res['body']['Success'])) {
    echo "\n✅ OK -> OrderURL : " . ($res['body']['OrderURL'] ?? '(voir réponse)') . "\n";
} else {
    echo "\n❌ Echec -> Message : " . ($res['body']['Message'] ?? $res['raw']) . "\n";
}