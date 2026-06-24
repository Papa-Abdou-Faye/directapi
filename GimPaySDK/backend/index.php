<?php
/**
 * Backend de test pour l'app mobile GimPay Tester.
 * Garde la cle secrete marchand cote serveur (jamais envoyee a l'app),
 * recoit du JSON, dispatche vers GimPaySDK, renvoie du JSON.
 *
 * Lancement (depuis la racine du projet) :
 *   php -S 0.0.0.0:8090 -t backend backend/index.php
 *   (port 8080 est deja pris par Apache sur cette machine)
 */

require __DIR__ . '/../GimPaySDK.php';

header('Content-Type: application/json; charset=utf-8');

$cfg = new GimPayConfig(
    'https://omni-uat.gimpay.org/Cube',     // baseUrl
    'b9575e2e2a4b48fefe8436630e2db996',     // Merchant Shared Key (HEX) - reste sur le serveur
    15670306513,                            // MerchantId
    790105                                  // TerminalId
);
$cfg->verifySsl = false;                    // UAT

$gim = new GimPayClient($cfg);

$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$body = json_decode(file_get_contents('php://input'), true) ?? [];

$routes = [
    '/initiate-order'      => 'initiateOrder',
    '/pay-by-card'         => 'payByCard',
    '/pay-by-card-no-cvv'  => 'payByCardWithoutCvv',
    '/filter-transactions' => 'filterTransactions',
    '/capture'             => 'capture',
    '/refund'              => 'refund',
    '/void'                => 'void',
];

if (!isset($routes[$path])) {
    http_response_code(404);
    echo json_encode(['error' => "Route inconnue : $path"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Methode non autorisee, utiliser POST']);
    exit;
}

try {
    $method = $routes[$path];
    $res    = $gim->$method($body);
    echo json_encode($res, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (GimPayException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur : ' . $e->getMessage()]);
}
