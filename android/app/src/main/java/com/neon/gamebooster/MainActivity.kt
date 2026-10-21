package com.neon.gamebooster

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.BatteryManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.TextUtils
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import java.net.InetAddress
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.concurrent.thread

/**
 * Game Booster — no-root performance booster.
 * MVVM-lite: this Activity acts as the View; small "model" helpers below
 * (memory / thermal / network / app catalog) feed state back to the UI thread.
 */
class MainActivity : Activity() {

    private data class AppRow(val info: ApplicationInfo, val label: String, val isGame: Boolean)

    private val main = Handler(Looper.getMainLooper())

    // Neon dark palette
    private val colBg = 0xFF070B14.toInt()
    private val colSurface = 0xFF0E1526.toInt()
    private val colSurface2 = 0xFF111A2E.toInt()
    private val colBorder = 0xFF1E2A44.toInt()
    private val colText = 0xFFE6EDF7.toInt()
    private val colDim = 0xFF8A94A8.toInt()
    private val colGreen = 0xFF22C55E.toInt()
    private val colPurple = 0xFFA855F7.toInt()
    private val colCyan = 0xFF22D3EE.toInt()
    private val colAmber = 0xFFF59E0B.toInt()
    private val colRed = 0xFFEF4444.toInt()
    private val colOnGreen = 0xFF04110A.toInt()

    private val GB = 1024.0 * 1024.0 * 1024.0
    private val MB = 1024L * 1024L

    private lateinit var ramValue: TextView
    private lateinit var ramBar: ProgressBar
    private lateinit var tempValue: TextView
    private lateinit var netValue: TextView
    private lateinit var boostBtn: Button
    private lateinit var resultBox: LinearLayout
    private lateinit var resultBody: TextView
    private lateinit var appsBox: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setTheme(android.R.style.Theme_Material_NoActionBar)
        window.statusBarColor = colBg
        window.navigationBarColor = colBg
        setContentView(buildUi())
        refreshRam()
        refreshTemp()
        runNetCheck()
        showLastResult()
        loadApps()
    }

    // ---------- view helpers ----------

    private fun dip(v: Int): Int = (v * resources.displayMetrics.density).toInt()

    private fun rounded(color: Int, radiusDp: Int, strokeColor: Int, strokeDp: Int): GradientDrawable {
        val d = GradientDrawable()
        d.setColor(color)
        d.cornerRadius = dip(radiusDp).toFloat()
        if (strokeDp > 0) d.setStroke(dip(strokeDp), strokeColor)
        return d
    }

    private fun addColumn(parent: LinearLayout, v: View, marginTopDp: Int) {
        val lp = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
        lp.topMargin = dip(marginTopDp)
        parent.addView(v, lp)
    }

    private fun label(text: String, sizeSp: Float, color: Int, bold: Boolean): TextView {
        val tv = TextView(this)
        tv.text = text
        tv.textSize = sizeSp
        tv.setTextColor(color)
        if (bold) tv.typeface = Typeface.DEFAULT_BOLD
        return tv
    }

    private fun sectionTitle(text: String, color: Int): TextView {
        val tv = label(text, 12f, color, true)
        tv.letterSpacing = 0.12f
        return tv
    }

    private fun card(): LinearLayout {
        val box = LinearLayout(this)
        box.orientation = LinearLayout.VERTICAL
        box.setPadding(dip(16), dip(14), dip(16), dip(16))
        box.background = rounded(colSurface, 18, colBorder, 1)
        return box
    }

    // ---------- UI tree ----------

    private fun buildUi(): View {
        val root = ScrollView(this)
        root.setBackgroundColor(colBg)
        root.isFillViewport = true

        val col = LinearLayout(this)
        col.orientation = LinearLayout.VERTICAL
        col.setPadding(dip(18), dip(26), dip(18), dip(30))
        root.addView(
            col,
            ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        )

        // Header
        val header = label("⚡ " + getString(R.string.app_name), 26f, colGreen, true)
        header.letterSpacing = 0.08f
        col.addView(header)
        addColumn(col, label(getString(R.string.subtitle), 12f, colDim, false), 4)

        // RAM card
        val ramCard = card()
        ramCard.addView(sectionTitle(getString(R.string.ram_title), colText))
        ramValue = label("", 22f, colText, true)
        addColumn(ramCard, ramValue, 6)
        ramBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal)
        ramBar.max = 100
        ramBar.progressTintList = ColorStateList.valueOf(colGreen)
        ramBar.progressBackgroundTintList = ColorStateList.valueOf(colBorder)
        addColumn(ramCard, ramBar, 8)
        addColumn(col, ramCard, 18)

        // Temperature card
        val tempCard = card()
        tempCard.addView(sectionTitle(getString(R.string.temp_title), colText))
        tempValue = label(getString(R.string.temp_na), 20f, colGreen, true)
        addColumn(tempCard, tempValue, 6)
        addColumn(col, tempCard, 12)

        // Network card
        val netCard = card()
        netCard.addView(sectionTitle(getString(R.string.net_title), colText))
        netValue = label(getString(R.string.net_checking), 15f, colCyan, true)
        addColumn(netCard, netValue, 6)
        addColumn(netCard, label(getString(R.string.net_note), 10f, colDim, false), 6)
        addColumn(col, netCard, 12)

        // Boost button
        boostBtn = Button(this)
        boostBtn.text = getString(R.string.boost)
        boostBtn.textSize = 16f
        boostBtn.isAllCaps = false
        boostBtn.typeface = Typeface.DEFAULT_BOLD
        boostBtn.setTextColor(colOnGreen)
        boostBtn.background = rounded(colGreen, 16, colBorder, 0)
        boostBtn.setPadding(dip(8), dip(14), dip(8), dip(14))
        boostBtn.setOnClickListener { startBoost() }
        addColumn(col, boostBtn, 20)

        // Result / history card
        resultBox = card()
        resultBox.addView(sectionTitle(getString(R.string.last_title), colPurple))
        resultBody = label(getString(R.string.no_history), 12f, colDim, false)
        addColumn(resultBox, resultBody, 6)
        addColumn(col, resultBox, 14)

        // Apps section
        addColumn(col, sectionTitle(getString(R.string.games_title), colText), 22)
        addColumn(col, label(getString(R.string.tap_to_launch), 10f, colDim, false), 3)
        appsBox = LinearLayout(this)
        appsBox.orientation = LinearLayout.VERTICAL
        addColumn(col, appsBox, 8)
        appsBox.addView(label(getString(R.string.games_loading), 12f, colDim, false))

        // Footer note
        val noteCard = card()
        noteCard.background = rounded(colSurface, 18, colPurple, 1)
        noteCard.addView(label(getString(R.string.no_root_note), 11f, colDim, false))
        addColumn(col, noteCard, 22)

        return root
    }

    // ---------- model: memory ----------

    private fun refreshRam() {
        val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val mi = ActivityManager.MemoryInfo()
        am.getMemoryInfo(mi)
        val totalGB = mi.totalMem / GB
        val usedGB = (mi.totalMem - mi.availMem) / GB
        val pct = if (mi.totalMem > 0) (((mi.totalMem - mi.availMem) * 100) / mi.totalMem).toInt() else 0
        ramValue.text = getString(
            R.string.ram_usage,
            String.format(Locale.US, "%.1f", usedGB),
            String.format(Locale.US, "%.1f", totalGB)
        )
        ramBar.progress = pct
        ramBar.progressTintList = ColorStateList.valueOf(
            when {
                pct >= 85 -> colRed
                pct >= 70 -> colAmber
                else -> colGreen
            }
        )
    }

    // ---------- model: thermal ----------

    private fun refreshTemp() {
        thread {
            var text: String? = null
            var hot = false
            try {
                val bm = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                val t = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_TEMPERATURE)
                if (t in 1..900) {
                    val c = t / 10.0
                    hot = c >= 40.0
                    text = String.format(Locale.US, "%.1f", c)
                }
            } catch (e: Exception) {
            }
            main.post {
                tempValue.text =
                    if (text != null) getString(R.string.temp_value, text) else getString(R.string.temp_na)
                tempValue.setTextColor(if (hot) colAmber else colGreen)
            }
        }
    }

    // ---------- model: network ----------

    private fun runNetCheck() {
        thread {
            var pingMs: Double? = null
            try {
                val proc = Runtime.getRuntime().exec(arrayOf("ping", "-c", "3", "-W", "2", "1.1.1.1"))
                val out = proc.inputStream.bufferedReader().readText()
                proc.waitFor()
                val times = Regex("time=([0-9.]+)").findAll(out)
                    .mapNotNull { it.groupValues.getOrNull(1)?.toDoubleOrNull() }
                    .toList()
                if (times.isNotEmpty()) pingMs = times.average()
            } catch (e: Exception) {
            }
            val dnsMs = dnsTimeMs()
            main.post {
                netValue.text = when {
                    pingMs != null && dnsMs >= 0 ->
                        getString(R.string.net_result, String.format(Locale.US, "%.0f", pingMs), dnsMs)
                    dnsMs >= 0 ->
                        getString(R.string.net_dns_only, dnsMs)
                    else ->
                        getString(R.string.net_fail)
                }
            }
        }
    }

    private fun dnsTimeMs(): Long {
        return try {
            val t0 = System.currentTimeMillis()
            InetAddress.getByName("cloudflare.com")
            System.currentTimeMillis() - t0
        } catch (e: Exception) {
            -1
        }
    }

    // ---------- boost flow ----------

    private fun startBoost() {
        boostBtn.isEnabled = false
        boostBtn.text = getString(R.string.boosting)
        thread {
            val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val mi = ActivityManager.MemoryInfo()
            am.getMemoryInfo(mi)
            val before = mi.availMem
            var asked = 0
            val pm = packageManager
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            for (info in apps) {
                if (info.packageName == packageName) continue
                if (info.flags and ApplicationInfo.FLAG_SYSTEM != 0) continue   // never touch system apps
                if (info.flags and ApplicationInfo.FLAG_STOPPED != 0) continue  // already stopped
                try {
                    am.killBackgroundProcesses(info.packageName)
                    asked++
                } catch (e: Exception) {
                }
            }
            Thread.sleep(1000) // let the system settle
            val mi2 = ActivityManager.MemoryInfo()
            am.getMemoryInfo(mi2)
            val freedMB = Math.max(0, (mi2.availMem - before) / MB)
            val dnsMs = dnsTimeMs()
            main.post { showBoostDone(freedMB, asked, dnsMs) }
        }
    }

    private fun showBoostDone(freedMB: Long, asked: Int, dnsMs: Long) {
        val prefs = getSharedPreferences("gb_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putLong("lastBoostAt", System.currentTimeMillis())
            .putLong("lastFreedMB", freedMB)
            .putInt("lastKilled", asked)
            .putLong("lastDnsMs", dnsMs)
            .apply()
        refreshRam()
        boostBtn.isEnabled = true
        boostBtn.text = getString(R.string.boost)
        resultBox.visibility = View.VISIBLE
        val dnsPart = if (dnsMs >= 0) " • DNS ${dnsMs}ms" else ""
        resultBody.text = getString(R.string.boost_done_line, freedMB.toString(), asked) + dnsPart
    }

    private fun showLastResult() {
        val prefs = getSharedPreferences("gb_prefs", Context.MODE_PRIVATE)
        val at = prefs.getLong("lastBoostAt", 0)
        if (at <= 0) return
        val stamp = SimpleDateFormat.getDateTimeInstance().format(Date(at))
        resultBox.visibility = View.VISIBLE
        resultBody.text = getString(
            R.string.last_line,
            prefs.getLong("lastFreedMB", 0).toString(),
            prefs.getInt("lastKilled", 0),
            stamp
        )
    }

    // ---------- model: installed apps ----------

    private fun loadApps() {
        thread {
            val pm = packageManager
            val rows = mutableListOf<AppRow>()
            try {
                val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
                for (info in apps) {
                    if (info.packageName == packageName) continue
                    if (pm.getLaunchIntentForPackage(info.packageName) == null) continue
                    val lbl = try {
                        pm.getApplicationLabel(info).toString()
                    } catch (e: Exception) {
                        info.packageName
                    }
                    val isGame = info.category == ApplicationInfo.CATEGORY_GAME ||
                        lbl.contains("game", ignoreCase = true) ||
                        info.packageName.contains("game", ignoreCase = true)
                    rows.add(AppRow(info, lbl, isGame))
                }
            } catch (e: Exception) {
            }
            rows.sortWith(compareByDescending<AppRow> { it.isGame }.thenBy { it.label.lowercase() })
            val limited = rows.take(80)
            main.post { renderApps(limited, rows.size) }
        }
    }

    private fun renderApps(rows: List<AppRow>, total: Int) {
        appsBox.removeAllViews()
        if (rows.isEmpty()) {
            appsBox.addView(label(getString(R.string.games_empty), 12f, colDim, false))
            return
        }
        val pm = packageManager
        for (row in rows) {
            addColumn(appsBox, appRowView(pm, row), 6)
        }
        if (total > rows.size) {
            addColumn(appsBox, label("… +" + (total - rows.size), 11f, colDim, false), 8)
        }
    }

    private fun appRowView(pm: PackageManager, row: AppRow): View {
        val line = LinearLayout(this)
        line.orientation = LinearLayout.HORIZONTAL
        line.gravity = Gravity.CENTER_VERTICAL
        line.setPadding(dip(10), dip(8), dip(10), dip(8))
        line.background = rounded(colSurface2, 14, colBorder, 1)
        line.minimumHeight = dip(56)

        val icon = ImageView(this)
        try {
            icon.setImageDrawable(pm.getApplicationIcon(row.info))
        } catch (e: Exception) {
        }
        line.addView(icon, LinearLayout.LayoutParams(dip(44), dip(44)))

        val texts = LinearLayout(this)
        texts.orientation = LinearLayout.VERTICAL
        texts.setPadding(dip(10), 0, 0, 0)
        val name = label(row.label, 14f, colText, true)
        name.maxLines = 1
        name.ellipsize = TextUtils.TruncateAt.END
        texts.addView(name)
        val pkg = label(row.info.packageName, 10f, colDim, false)
        pkg.maxLines = 1
        pkg.ellipsize = TextUtils.TruncateAt.END
        texts.addView(pkg)
        line.addView(
            texts,
            LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        )

        if (row.isGame) {
            val chip = label(getString(R.string.chip_game), 9f, colOnGreen, true)
            chip.background = rounded(colGreen, 20, colBorder, 0)
            chip.setPadding(dip(8), dip(3), dip(8), dip(3))
            line.addView(chip)
        }

        line.setOnClickListener {
            val intent = pm.getLaunchIntentForPackage(row.info.packageName)
            if (intent != null) startActivity(intent)
        }
        return line
    }
}
