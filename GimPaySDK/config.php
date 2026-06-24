<?php
/**
 * Configuration partagée par tous les tests GIM Pay.
 * Modifie les identifiants ICI uniquement (un seul endroit).
 */
require __DIR__ . '/../GimPaySDK.php';

$cfg = new GimPayConfig(
    'https://omni-uat.gimpay.org/Cube',     // baseUrl
    'b9575e2e2a4b48fefe8436630e2db996',     // Merchant Shared Key (HEX) du marchand 
    15670306513,                            // MerchantId
    790105                                  // TerminalId
);
$cfg->verifySsl = false;                    // UAT

$gim = new GimPayClient($cfg);

/** Affichage standardisé d'une réponse */
function dump_res(string $label, array $res): void {
    echo "==== $label ====\n";
    echo "HTTP : {$res['http']}\n";
    if (is_array($res['body'])) {
        echo "Body : " . json_encode($res['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
        if (array_key_exists('Success', $res['body'])) {
            echo ($res['body']['Success'] ? "✅ Success\n" : "❌ " . ($res['body']['Message'] ?? '') . "\n");
        }
    } else {
        echo "Raw  : {$res['raw']}\n";
    }
    echo "\n";
}
