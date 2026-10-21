package com.neon.gamebooster.data

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

object DeviceRepo {

    data class Ram(val usedGB: Double, val totalGB: Double, val availGB: Double, val pct: Int)

    private const val GB = 1024.0 * 1024.0 * 1024.0

    fun ram(ctx: Context): Ram {
        val am = ctx.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        val mi = android.app.ActivityManager.MemoryInfo()
        am.getMemoryInfo(mi)
        val total = mi.totalMem / GB
        val avail = mi.availMem / GB
        val used = total - avail
        val pct = if (mi.totalMem > 0) (((mi.totalMem - mi.availMem) * 100) / mi.totalMem).toInt() else 0
        return Ram(used, total, avail, pct)
    }

    fun batteryTemp(ctx: Context): Double? {
        return try {
            val intent = ctx.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            val t = intent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, Int.MIN_VALUE) ?: Int.MIN_VALUE
            if (t != Int.MIN_VALUE && t > 0 && t < 900) t / 10.0 else null
        } catch (e: Exception) {
            null
        }
    }

    fun battery(ctx: Context): Pair<Int?, Boolean> {
        return try {
            val intent = ctx.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100
            val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            val pct = if (level >= 0 && scale > 0) (level * 100) / scale else null
            val charging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL
            Pair(pct, charging)
        } catch (e: Exception) {
            Pair(null, false)
        }
    }

    fun cores(): Int = Runtime.getRuntime().availableProcessors()

    fun cpuFreqMhz(): Int? {
        return try {
            var max = -1
            for (i in 0 until cores()) {
                val f = File("/sys/devices/system/cpu/cpu$i/cpufreq/scaling_cur_freq")
                if (f.canRead()) {
                    val khz = f.readText().trim().toLongOrNull() ?: continue
                    val mhz = (khz / 1000).toInt()
                    if (mhz > max) max = mhz
                }
            }
            if (max > 0) max else null
        } catch (e: Exception) {
            null
        }
    }

    fun networkType(ctx: Context): String {
        return try {
            val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val net = cm.activeNetwork ?: return "offline"
            val caps = cm.getNetworkCapabilities(net) ?: return "unknown"
            when {
                caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
                caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
                caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN) -> "vpn"
                else -> "other"
            }
        } catch (e: Exception) {
            "unknown"
        }
    }

    fun screenInfo(ctx: Context): String {
        return try {
            val dm = ctx.resources.displayMetrics
            "${dm.widthPixels}x${dm.heightPixels}"
        } catch (e: Exception) {
            "-"
        }
    }

    fun info(ctx: Context): DeviceInfo {
        val ram = ram(ctx)
        val battery = battery(ctx)
        return DeviceInfo(
            model = Build.MANUFACTURER.replaceFirstChar { it.uppercase() } + " " + Build.MODEL,
            androidVersion = Build.VERSION.RELEASE ?: "",
            sdkInt = Build.VERSION.SDK_INT,
            cores = cores(),
            ramGB = ram.totalGB,
            screen = screenInfo(ctx),
            batteryLevel = battery.first,
            charging = battery.second,
            networkType = networkType(ctx)
        )
    }

    fun systemBrightnessMode(ctx: Context): Int {
        return try {
            Settings.System.getInt(ctx.contentResolver, Settings.System.SCREEN_BRIGHTNESS_MODE)
        } catch (e: Exception) {
            -1
        }
    }

    suspend fun ownCacheSizeMB(ctx: Context): Long = withContext(Dispatchers.IO) {
        dirSizeMB(ctx.cacheDir) + dirSizeMB(ctx.externalCacheDir)
    }

    suspend fun ownShaderSizeMB(ctx: Context): Long = withContext(Dispatchers.IO) {
        dirSizeMB(ctx.codeCacheDir)
    }

    private fun dirSizeMB(dir: File?): Long {
        if (dir == null || !dir.exists()) return 0
        var bytes = 0L
        try {
            dir.walkTopDown().filter { it.isFile }.forEach { bytes += it.length() }
        } catch (e: Exception) {
        }
        return bytes / (1024L * 1024L)
    }

    suspend fun cleanOwnCache(ctx: Context, keepShader: Boolean): Long = withContext(Dispatchers.IO) {
        var freed = 0L
        freed += deleteDir(ctx.cacheDir)
        freed += deleteDir(ctx.externalCacheDir)
        if (!keepShader) freed += deleteDir(ctx.codeCacheDir)
        freed
    }

    private fun deleteDir(dir: File?): Long {
        if (dir == null || !dir.exists()) return 0
        var bytes = 0L
        try {
            dir.walkTopDown().filter { it.isFile }.forEach {
                bytes += it.length()
                it.delete()
            }
        } catch (e: Exception) {
        }
        return bytes / (1024L * 1024L)
    }
}
