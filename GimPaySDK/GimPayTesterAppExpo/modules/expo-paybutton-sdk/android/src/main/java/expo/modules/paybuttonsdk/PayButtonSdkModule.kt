package expo.modules.paybuttonsdk

import android.app.Activity
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

// TODO(package inconnu) : le PDF GIM_PayButton_SDK.pdf ne montre aucun import,
// seulement des appels du type `new PayButton(context)`. Ce chemin de package
// est une supposition à corriger via l'autocomplete d'Android Studio une fois
// que le JitPack AAR (com.github.GIMPAY:paybutton) est résolu.
import com.paysky.paybutton.PayButton
import com.paysky.paybutton.model.SuccessfulCardTransaction
import com.paysky.paybutton.model.SuccessfulWalletTransaction
import com.paysky.paybutton.exception.TransactionException

class PayButtonSdkModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PayButtonSdkModule")

    AsyncFunction("startPayment") { params: Map<String, Any?>, promise: Promise ->
      val activity: Activity? = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Aucune activite Android disponible pour lancer le paiement.", null)
        return@AsyncFunction
      }

      activity.runOnUiThread {
        try {
          val payButton = PayButton(activity)
          payButton.setMerchantId(params["merchantId"] as? String)
          payButton.setTerminalId(params["terminalId"] as? String)
          // TODO: type reel de setPayAmount (String/Int/Double ?) non documente.
          payButton.setPayAmount(params["amount"] as? String)
          payButton.setCurrencyCode(params["currencyCode"] as? String)
          payButton.setMerchantSecureHash(params["secureHash"] as? String)
          payButton.setTransactionReferenceNumber(params["transactionReference"] as? String)

          // TODO(constante UAT inconnue) : le PDF ne documente que PRODUCTION,
          // aucune constante sandbox/UAT n'apparait. On resout par nom depuis
          // le JS et on remonte les valeurs reelles de l'enum en cas d'echec,
          // ce qui permettra de decouvrir la bonne valeur des le premier essai.
          val statusName = (params["productionStatus"] as? String) ?: "PRODUCTION"
          val status = try {
            PayButton.ProductionStatus.valueOf(statusName)
          } catch (e: IllegalArgumentException) {
            val available = PayButton.ProductionStatus.values().joinToString()
            promise.reject(
              "UNKNOWN_PRODUCTION_STATUS",
              "Valeur '$statusName' inconnue pour ProductionStatus. Valeurs disponibles : $available",
              e
            )
            return@runOnUiThread
          }
          payButton.setProductionStatus(status)

          @Suppress("UNCHECKED_CAST")
          val customer = params["customer"] as? Map<String, Any?>
          when (customer?.get("type")) {
            "email" -> payButton.setCustomerEmail(customer["value"] as? String)
            "subscribed" -> payButton.setCustomerId(customer["value"] as? String)
            else -> payButton.setCustomerMobile(customer?.get("value") as? String)
          }

          payButton.createTransaction(object : PayButton.PaymentTransactionCallback {
            // TODO(champs incertains) : la doc se contredit entre l'exemple de
            // code (page 7 : cardTransaction.SystemReference, .tokenCustomerId)
            // et la liste "Retourne :" (page 8 : NetworkReference, AuthCode,
            // ActionCode, ReceiptNumber, Amount). On suit la page 8 ci-dessous ;
            // Android Studio signalera immediatement si les noms different.
            override fun onCardTransactionSuccess(cardTransaction: SuccessfulCardTransaction) {
              promise.resolve(
                mapOf(
                  "type" to "card",
                  "networkReference" to cardTransaction.NetworkReference,
                  "authCode" to cardTransaction.AuthCode,
                  "actionCode" to cardTransaction.ActionCode,
                  "receiptNumber" to cardTransaction.ReceiptNumber,
                  "amount" to cardTransaction.Amount
                )
              )
            }

            override fun onWalletTransactionSuccess(walletTransaction: SuccessfulWalletTransaction) {
              promise.resolve(
                mapOf(
                  "type" to "wallet",
                  "networkReference" to walletTransaction.NetworkReference,
                  "amount" to walletTransaction.Amount
                )
              )
            }

            override fun onError(error: TransactionException) {
              promise.reject("PAYBUTTON_ERROR", error.message ?: "Erreur de paiement inconnue.", error)
            }
          })
        } catch (e: Exception) {
          promise.reject("PAYBUTTON_EXCEPTION", e.message ?: "Erreur inattendue du SDK PayButton.", e)
        }
      }
    }
  }
}
