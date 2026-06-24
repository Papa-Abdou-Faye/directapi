<?php
/**
 *
 *  Endpoints couverts :
 *    - InitiateOrder        -> /PayLink.svc/api/InitiateOrder
 *    - PayByCard            -> /PayLink.svc/api/PayByCard
 *    - PayByCard sans CVV   -> /PayLink.svc/api/PayByCard   (MotoFlag = 1)
 *    - FilterTransactions   -> /PayLink.svc/api/FilterTransactions
 *    - Capture              -> /PayLink.svc/api/CaptureGIM
 *    - Refund               -> /PayLink.svc/api/RefundTransaction
 *    - Void / Cancel        -> /PayLink.svc/api/RefundTransaction  (a confirmer)
 * ============================================================================
 */

/* -------------------------------------------------------------------------- */
/*  1) CONFIGURATION                                                          */
/* -------------------------------------------------------------------------- */
class GimPayConfig
{
    public string $baseUrl;          
    public string $secretKey;        
    public $merchantId;             
    public $terminalId;             
    public int    $currency = 952;  
    public int    $timeout  = 30;    
    public bool   $verifySsl = true; 

    public function __construct(string $baseUrl, string $secretKey, $merchantId = null, $terminalId = null)
    {
        $this->baseUrl    = rtrim($baseUrl, '/');
        $this->secretKey  = $secretKey;
        $this->merchantId = $merchantId;
        $this->terminalId = $terminalId;
    }
}

/* -------------------------------------------------------------------------- */
/*  2) SECUREHASH                                     */
/* -------------------------------------------------------------------------- */
class GimPaySecureHash
{
    /**

     * @param array  $orderedValues  valeurs DANS L'ORDRE attendu par GIM Pay
     * @param string $key            clé secrète
     */

    public static function compute($merchantId, $terminalId, string $dateTimeLocalTrxn, string $key): string
    {
        $message = 'DateTimeLocalTrxn=' . $dateTimeLocalTrxn
                 . '&MerchantId='       . $merchantId
                 . '&TerminalId='       . $terminalId;

        $binKey = hex2bin($key);                        
        if ($binKey === false) {
            throw new GimPayException('Merchant Shared Key invalide (doit être une chaîne hexadécimale).');
        }

        return hash_hmac('sha256', $message, $binKey); 
    }
}

/* -------------------------------------------------------------------------- */
/*  3) EXCEPTION                                                              */
/* -------------------------------------------------------------------------- */
class GimPayException extends \Exception {}

/* -------------------------------------------------------------------------- */
/*  4) CLIENT HTTP                                                           */
/* -------------------------------------------------------------------------- */
class GimPayClient
{
    private GimPayConfig $cfg;

    public function __construct(GimPayConfig $cfg)
    {
        $this->cfg = $cfg;
    }

    public function config(): GimPayConfig
    {
        return $this->cfg;
    }

    /** Horodatage transaction au format YYYYMMDDHHmmss */
    public static function now(): string
    {
        return date('YmdHis');
    }

    /** POST JSON unique pour tous les endpoints */
    private function post(string $path, array $payload): array
    {
        $url = $this->cfg->baseUrl . $path;
        $ch  = curl_init($url);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_SLASHES),
            CURLOPT_TIMEOUT        => $this->cfg->timeout,
            CURLOPT_SSL_VERIFYPEER => $this->cfg->verifySsl,
            CURLOPT_SSL_VERIFYHOST => $this->cfg->verifySsl ? 2 : 0,
        ]);

        $raw  = curl_exec($ch);
        $err  = curl_error($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if (PHP_VERSION_ID < 80000) {
            curl_close($ch);   // inutile (no-op) et déprécié à partir de PHP 8.0+
        }

        if ($raw === false) {
            throw new GimPayException("Echec cURL ($url) : $err");
        }

        return [
            'http' => $code,
            'body' => json_decode($raw, true),  // null si non-JSON
            'raw'  => $raw,
        ];
    }

    /** Résout merchantId / terminalId (surcharge appel > défaut config) */
    private function ids(array $o): array
    {
        $m = $o['merchantId'] ?? $this->cfg->merchantId;
        $t = $o['terminalId'] ?? $this->cfg->terminalId;
        if ($m === null || $t === null) {
            throw new GimPayException('merchantId / terminalId manquant (config ou appel).');
        }
        return [$m, $t];
    }

    /* ====================================================================== */
    /*  ENDPOINTS                                                            */
    /*  NB : chaque méthode construit son payload PUIS son SecureHash.        */
    /*       Le tableau $hashInput = ordre des champs a CONFIRMER.            */
    /* ====================================================================== */

    /** InitiateOrder : crée un lien / un ordre de paiement */
    public function initiateOrder(array $o): array
    {
        [$merchantId, $terminalId] = $this->ids($o);
        $dt = $o['DateTimeLocalTrxn'] ?? self::now();

        $payload = [
            'AmountTrxn'                    => $o['AmountTrxn'],
            'Currency'                      => $o['Currency'] ?? $this->cfg->currency,
            'ExpiryDateTime'                => $o['ExpiryDateTime'] ?? '',
            'MerchantReference'             => $o['MerchantReference'],
            'PayerName'                     => $o['PayerName'] ?? '',
            'CallBackUrl'                   => $o['CallBackUrl'] ?? '',
            'MaxNumberOfPayment'            => $o['MaxNumberOfPayment'] ?? 1,
            'Message'                       => $o['Message'] ?? '',
            'PayLinkType'                   => $o['PayLinkType'] ?? 1,
            'TokenizationCustomerOperatorId'=> $o['TokenizationCustomerOperatorId'] ?? null,
            'OrderReceiptPath'              => $o['OrderReceiptPath'] ?? '',
            'OrderReceiptName'              => $o['OrderReceiptName'] ?? '',
            'TerminalId'                    => $terminalId,
            'MerchantId'                    => $merchantId,
            'DateTimeLocalTrxn'             => $dt,
            'HostName'                      => $o['HostName'] ?? 0,
            'CorrelationId'                 => $o['CorrelationId'] ?? null,
        ];

        $payload['SecureHash'] = GimPaySecureHash::compute(
            $merchantId, $terminalId, $dt, $this->cfg->secretKey
        );

        return $this->post('/PayLink.svc/api/InitiateOrder', $payload);
    }

    /** PayByCard : paiement direct par carte  */
    public function payByCard(array $o): array
    {
        [$merchantId, $terminalId] = $this->ids($o);
        $dt = $o['DateTimeLocalTrxn'] ?? self::now();

        $payload = [
            'PAN'              => $o['PAN'],
            'DateExpiration'   => $o['DateExpiration'],          // format YYMM ex "2604"
            'CVV'              => $o['CVV'] ?? '',
            'AmountTrxn'       => $o['AmountTrxn'],
            'IsWebRequest'     => $o['IsWebRequest'] ?? true,
            'CurrencyCodeTrxn' => (string) ($o['CurrencyCodeTrxn'] ?? $this->cfg->currency),
            'MerchantReference'=> $o['MerchantReference'],
            'Disable3DS'       => $o['Disable3DS'] ?? false,
            'TerminalId'       => $terminalId,
            'MerchantId'       => $merchantId,
            'DateTimeLocalTrxn'=> $dt,
            'ReturnURL'        => $o['ReturnURL'] ?? '',
        ];
        if (isset($o['MotoFlag'])) {
            $payload['MotoFlag'] = $o['MotoFlag'];
        }

        $payload['SecureHash'] = GimPaySecureHash::compute(
            $merchantId, $terminalId, $dt, $this->cfg->secretKey
        );

        return $this->post('/PayLink.svc/api/PayByCard', $payload);
    }

    /** PayByCard sans CVV (MOTO) : MotoFlag = 1, CVV vide */
    public function payByCardWithoutCvv(array $o): array
    {
        $o['CVV']      = '';
        $o['MotoFlag'] = $o['MotoFlag'] ?? 1;
        return $this->payByCard($o);
    }

    /** FilterTransactions : recherche/pagination des transactions */
    public function filterTransactions(array $o): array
    {
        [$merchantId, $terminalId] = $this->ids($o);
        $dt = $o['DateTimeLocalTrxn'] ?? self::now();

        $payload = [
            'MerchantId'        => (string) $merchantId,
            'MerchantReference' => $o['MerchantReference'] ?? '',
            'TerminalId'        => (string) $terminalId,
            'DisplayLength'     => (string) ($o['DisplayLength'] ?? 10),
            'DisplayStart'      => (string) ($o['DisplayStart'] ?? 0),
            'DateFrom'          => $o['DateFrom'],   // YYYYMMDD
            'DateTo'            => $o['DateTo'],      // YYYYMMDD
            'DateTimeLocalTrxn' => $dt,
        ];

        $payload['SecureHash'] = GimPaySecureHash::compute(
            $merchantId, $terminalId, $dt, $this->cfg->secretKey
        );

        return $this->post('/PayLink.svc/api/FilterTransactions', $payload);
    }

    /** Capture (CaptureGIM) : capture d'une transaction pré-autorisée */
    public function capture(array $o): array
    {
        [$merchantId, $terminalId] = $this->ids($o);
        $dt = $o['DateTimeLocalTrxn'] ?? self::now();

        $payload = [
            'terminalId'        => (string) $terminalId,
            'merchantId'        => (string) $merchantId,
            'DateTimeLocalTrxn' => $dt,
            'SystemReference'   => $o['SystemReference'],
        ];

        $payload['SecureHash'] = GimPaySecureHash::compute(
            $merchantId, $terminalId, $dt, $this->cfg->secretKey
        );

        return $this->post('/PayLink.svc/api/CaptureGIM', $payload);
    }

    /** Refund (RefundTransaction) : remboursement total/partiel */
    public function refund(array $o): array
    {
        [$merchantId, $terminalId] = $this->ids($o);
        $dt = $o['DateTimeLocalTrxn'] ?? self::now();

        $payload = [
            'terminalId'        => (string) $terminalId,
            'merchantId'        => (string) $merchantId,
            'amount'            => $o['amount'],
            'amountTrxn'        => $o['amountTrxn'] ?? $o['amount'],
            'DateTimeLocalTrxn' => $dt,
            'refundReason'      => $o['refundReason'] ?? '',
            'TxnId'             => $o['TxnId'],
            'isMobileSDK'       => $o['isMobileSDK'] ?? false,
        ];

        $payload['SecureHash'] = GimPaySecureHash::compute(
            $merchantId, $terminalId, $dt, $this->cfg->secretKey
        );

        return $this->post('/PayLink.svc/api/RefundTransaction', $payload);
    }


    public function void(array $o): array
    {
        return $this->refund($o);   
    }
}