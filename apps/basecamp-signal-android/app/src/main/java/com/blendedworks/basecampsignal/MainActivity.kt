package com.blendedworks.basecampsignal

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telephony.CellInfoLte
import android.telephony.CellInfoNr
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import android.util.Base64
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject

class MainActivity : Activity() {
    private val permissionRequest = 42
    private lateinit var status: TextView
    private lateinit var returnButton: Button
    private var returnUrl: String? = null
    private var reading: JSONObject? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        returnUrl = intent?.data?.getQueryParameter("return")?.takeIf { it.startsWith("https://") }
        buildScreen()
        requestReading()
    }

    private fun buildScreen() {
        val density = resources.displayMetrics.density
        val page = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding((24 * density).toInt(), (56 * density).toInt(), (24 * density).toInt(), (24 * density).toInt())
            setBackgroundColor(Color.rgb(247, 243, 234))
        }
        page.addView(TextView(this).apply {
            text = "Basecamp Signal"
            textSize = 28f
            setTextColor(Color.rgb(23, 58, 50))
            gravity = Gravity.CENTER
        }, matchWrap())
        page.addView(TextView(this).apply {
            text = "Android radio diagnostics for Blended Basecamp"
            textSize = 15f
            setTextColor(Color.rgb(82, 101, 94))
            gravity = Gravity.CENTER
            setPadding(0, (10 * density).toInt(), 0, (30 * density).toInt())
        }, matchWrap())
        status = TextView(this).apply {
            text = "Waiting for permission…"
            textSize = 16f
            setTextColor(Color.rgb(29, 53, 47))
            setPadding((18 * density).toInt(), (18 * density).toInt(), (18 * density).toInt(), (18 * density).toInt())
            setBackgroundColor(Color.WHITE)
        }
        page.addView(status, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        returnButton = Button(this).apply {
            text = if (returnUrl == null) "Measure again" else "Return reading to Basecamp"
            isEnabled = false
            setOnClickListener { if (returnUrl == null) requestReading() else returnToBasecamp() }
        }
        page.addView(returnButton, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { topMargin = (24 * density).toInt() })
        setContentView(page)
    }

    private fun matchWrap() = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

    private fun requestReading() {
        val permissions = arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.READ_PHONE_STATE)
        if (permissions.all { checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }) readRadio() else requestPermissions(permissions, permissionRequest)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == permissionRequest && grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) readRadio()
        else {
            status.text = "Location and phone permissions are required to read the cellular generation, carrier, tower, and signal strength. No reading was shared."
            returnButton.isEnabled = true
        }
    }

    private fun readRadio() {
        try {
            val baseManager = getSystemService(TelephonyManager::class.java)
            val subscriptionId = SubscriptionManager.getDefaultDataSubscriptionId()
            val manager = if (SubscriptionManager.isValidSubscriptionId(subscriptionId)) baseManager.createForSubscriptionId(subscriptionId) else baseManager
            val networkType = manager.dataNetworkType
            val cell = manager.allCellInfo?.firstOrNull { it.isRegistered }
            val result = JSONObject().apply {
                put("capturedAt", System.currentTimeMillis())
                put("carrier", manager.networkOperatorName.takeIf { it.isNotBlank() } ?: JSONObject.NULL)
                put("networkType", networkName(networkType))
                put("networkTypeCode", networkType)
                put("roaming", manager.isNetworkRoaming)
                when (cell) {
                    is CellInfoNr -> {
                        val signal = cell.cellSignalStrength
                        val identity = cell.cellIdentity
                        put("dbm", signal.dbm)
                        put("level", signal.level)
                        putIfAvailable(this, "rsrp", readNumber(signal, "getSsRsrp"))
                        putIfAvailable(this, "rsrq", readNumber(signal, "getSsRsrq"))
                        putIfAvailable(this, "sinr", readNumber(signal, "getSsSinr"))
                        putIfAvailable(this, "bandChannel", readNumber(identity, "getNrarfcn"))
                        putIfAvailable(this, "cellId", readNumber(identity, "getNci"))
                        putIfAvailable(this, "pci", readNumber(identity, "getPci"))
                        putIfAvailable(this, "tac", readNumber(identity, "getTac"))
                    }
                    is CellInfoLte -> {
                        val signal = cell.cellSignalStrength
                        val identity = cell.cellIdentity
                        put("dbm", signal.dbm)
                        put("rsrp", signal.rsrp)
                        put("rsrq", signal.rsrq)
                        put("sinr", signal.rssnr)
                        put("level", signal.level)
                        put("bandChannel", identity.earfcn)
                        put("cellId", identity.ci)
                        put("pci", identity.pci)
                        put("tac", identity.tac)
                    }
                    else -> {
                        val signal = manager.signalStrength
                        put("dbm", signal?.cellSignalStrengths?.firstOrNull()?.dbm ?: JSONObject.NULL)
                        put("level", signal?.level ?: JSONObject.NULL)
                    }
                }
            }
            reading = result
            status.text = buildSummary(result)
            returnButton.isEnabled = true
        } catch (error: SecurityException) {
            status.text = "Android did not grant access to the active cellular subscription. Check the app permissions and try again."
            returnButton.isEnabled = true
        } catch (error: Exception) {
            status.text = "This device did not provide a cellular reading: ${error.message ?: "unknown error"}"
            returnButton.isEnabled = true
        }
    }

    private fun buildSummary(value: JSONObject): String = listOfNotNull(
        value.optString("carrier").takeIf { it.isNotBlank() && it != "null" },
        value.optString("networkType").takeIf { it.isNotBlank() },
        value.optInt("dbm", Int.MAX_VALUE).takeIf { it != Int.MAX_VALUE }?.let { "$it dBm" },
        value.optInt("rsrp", Int.MAX_VALUE).takeIf { it != Int.MAX_VALUE }?.let { "RSRP $it dBm" },
        value.optInt("rsrq", Int.MAX_VALUE).takeIf { it != Int.MAX_VALUE }?.let { "RSRQ $it dB" },
        value.optInt("sinr", Int.MAX_VALUE).takeIf { it != Int.MAX_VALUE }?.let { "SINR $it dB" }
    ).joinToString("\n")

    private fun readNumber(target: Any, getter: String): Number? = try {
        target.javaClass.getMethod(getter).invoke(target) as? Number
    } catch (_: Exception) {
        null
    }

    private fun putIfAvailable(target: JSONObject, key: String, value: Number?) {
        if (value != null) target.put(key, value)
    }

    private fun returnToBasecamp() {
        val destination = returnUrl ?: return
        val result = reading ?: return
        val encoded = Base64.encodeToString(result.toString().toByteArray(), Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
        val uri = Uri.parse(destination).buildUpon().fragment("basecamp-signal=$encoded").build()
        startActivity(Intent(Intent.ACTION_VIEW, uri))
        finish()
    }

    private fun networkName(type: Int): String = when (type) {
        TelephonyManager.NETWORK_TYPE_NR -> "5G NR"
        TelephonyManager.NETWORK_TYPE_LTE -> "LTE"
        TelephonyManager.NETWORK_TYPE_HSPAP -> "HSPA+"
        TelephonyManager.NETWORK_TYPE_HSPA, TelephonyManager.NETWORK_TYPE_HSDPA, TelephonyManager.NETWORK_TYPE_HSUPA -> "3G HSPA"
        TelephonyManager.NETWORK_TYPE_UMTS -> "3G UMTS"
        TelephonyManager.NETWORK_TYPE_EDGE -> "2G EDGE"
        TelephonyManager.NETWORK_TYPE_GPRS -> "2G GPRS"
        TelephonyManager.NETWORK_TYPE_CDMA, TelephonyManager.NETWORK_TYPE_1xRTT, TelephonyManager.NETWORK_TYPE_EVDO_0, TelephonyManager.NETWORK_TYPE_EVDO_A, TelephonyManager.NETWORK_TYPE_EVDO_B -> "CDMA"
        TelephonyManager.NETWORK_TYPE_IWLAN -> "Wi-Fi calling"
        else -> "Unknown cellular generation"
    }
}
