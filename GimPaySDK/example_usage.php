<?php
/**
 * ============================================================================
 *  EXEMPLE D'USAGE - GIM PAY SDK
 * ============================================================================
 *  Le SecureHash est calculé AUTOMATIQUEMENT par le SDK a partir de
 *  MerchantId + TerminalId + DateTimeLocalTrxn + Merchant Shared Key.
 * ============================================================================
 */

require __DIR__ . '/GimPaySDK.php';

/* -------------------------------------------------------------------------- */
/*  CONFIG  (en prod : charger ces valeurs depuis la base, pas en dur, c'est plus SAFEE)        */
/* -------------------------------------------------------------------------- */
$cfg = new GimPayConfig(
    'https://omni-uat.gimpay.org/Cube',   // baseUrl 
    'b9575e2e2a4b48fefe8436630e2db996',   //Merchant Shared Key 
    15670306513,                          // MerchantId
    790105                              // TerminalId 
);
$cfg->verifySsl = false;                  // UAT uniquement, si certif. auto-signé

$gim = new GimPayClient($cfg);

/* petit helper local pour afficher proprement le résultat */
function dump_res(string $label, array $res): void {
    echo "==== $label ====\n";
    echo "HTTP : {$res['http']}\n";
    if (is_array($res['body'])) {
        echo "Body : " . json_encode($res['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    } else {
        echo "Raw  : {$res['raw']}\n";  // réponse non-JSON
    }
    echo "\n";
}

try {

    /* ====================================================================== */
    /*  1) INITIATE ORDER  -> crée un ordre / lien de paiement                */
    /* ====================================================================== */
    $res = $gim->initiateOrder([
        'AmountTrxn'        => 500,
        'MerchantReference' => 'CMD_' . date('YmdHis') . '_' . bin2hex(random_bytes(3)),
        'PayerName'         => 'Client Test',
        'CallBackUrl'       => 'https://webhook.site/xxxxxxxx', 
        'ExpiryDateTime'    => date('YmdHis', strtotime('+1 day')),
        'Message'           => 'Paiement abonnement',
        // 'Currency'       => 952,   
        // 'MaxNumberOfPayment' => 1, 
    ]);
    dump_res('InitiateOrder', $res);


    /* ====================================================================== */
    /*  2) PAY BY CARD  -> paiement direct par carte (3DS selon Disable3DS)    */
    /* ====================================================================== */
    $res = $gim->payByCard([
        'PAN'              => '5219570245517691', 
        'DateExpiration'   => '2803',              // format YYMM
        'CVV'              => '659',
        'AmountTrxn'       => 500,
        'MerchantReference'=> 'PAY_' . date('YmdHis'),
        'ReturnURL'        => 'https://ton-site/retour-paiement', 
        // 'Disable3DS'    => false,
    ]);
    dump_res('PayByCard', $res);


    /* ====================================================================== */
    /*  2b) PAY BY CARD SANS CVV (MOTO)                                        */
    /* ====================================================================== */
    $res = $gim->payByCardWithoutCvv([
        'PAN'              => '5219570245517691',
        'DateExpiration'   => '2803',
        'AmountTrxn'       => 500,
        'MerchantReference'=> 'MOTO_' . date('YmdHis'),
    ]);
    dump_res('PayByCard (sans CVV / MOTO)', $res);


    /* ====================================================================== */
    /*  3) FILTER TRANSACTIONS  -> recherche / pagination                     */
    /* ====================================================================== */
    $res = $gim->filterTransactions([
        'DateFrom'      => '20251201',   // YYYYMMDD
        'DateTo'        => date('Ymd'),  // YYYYMMDD
        'DisplayLength' => 10,           // nb de transactions
        'DisplayStart'  => 0,            // index de départ
        // 'MerchantReference' => 'CMD_xxx', // filtrer sur une réf précise
    ]);
    dump_res('FilterTransactions', $res);


    /* ====================================================================== */
    /*  4) CAPTURE  -> capture d'une transaction pré-autorisée                */
    /*     (SystemReference obtenu APRES un paiement réussi)                  */
    /* ====================================================================== */
    $res = $gim->capture([
        'terminalId'      => '49296167',
        'SystemReference' => '163016',
    ]);
    dump_res('Capture', $res);


    /* ====================================================================== */
    /*  5) REFUND  -> remboursement total / partiel                           */
    /*     (TxnId obtenu APRES un paiement réussi)                            */
    /* ====================================================================== */
    $res = $gim->refund([
        'terminalId'   => '49296167',
        'amount'       => 500,
        'amountTrxn'   => 500,
        'TxnId'        => '163000',
        'refundReason' => 'Demande client',
    ]);
    dump_res('Refund', $res);

} catch (GimPayException $e) {
    echo "ERREUR SDK : " . $e->getMessage() . "\n";
}
