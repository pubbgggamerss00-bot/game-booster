package com.neon.gamebooster.data

import android.graphics.drawable.Drawable

data class Settings(
    val lang: String = "fa",
    val theme: String = "dark",
    val perfMode: Boolean = true,
    val bgClean: Boolean = true,
    val graphicsBoost: Boolean = false,
    val batterySaver: Boolean = false,
    val shaderProtect: Boolean = true,
    val sensitiveConfirm: Boolean = true,
    val jobs: Set<String> = setOf("cache", "check")
)

data class PerfSnapshot(
    val ramUsedGB: Double = 0.0,
    val ramTotalGB: Double = 0.0,
    val ramPct: Int = 0,
    val availGB: Double = 0.0,
    val tempC: Double? = null,
    val cpuFreqMhz: Int? = null,
    val cores: Int = 0
)

data class DeviceInfo(
    val model: String = "",
    val androidVersion: String = "",
    val sdkInt: Int = 0,
    val cores: Int = 0,
    val ramGB: Double = 0.0,
    val screen: String = "",
    val batteryLevel: Int? = null,
    val charging: Boolean = false,
    val networkType: String = ""
)

data class AppItem(
    val pkg: String,
    val label: String,
    val isGame: Boolean
)

data class GameProfile(
    val graphics: String = "balanced",
    val priority: String = "fps"
)

data class DnsServer(
    val id: String,
    val name: String,
    val ip: String,
    val region: String,
    val doh: Boolean,
    val dot: Boolean
)

data class DnsTestResult(
    val id: String,
    val ms: Int?
)

data class PingStats(
    val avgMs: Double,
    val jitterMs: Double,
    val lossPct: Double,
    val samples: List<Double>
)

data class NetDiag(
    val pingAvg: Double?,
    val jitter: Double?,
    val lossPct: Double?,
    val dnsMs: Long?,
    val quality: String,
    val score: Int
)

data class RamHog(
    val id: String,
    val own: Boolean
)

data class Cleanable(
    val id: String,
    val kind: String, // safe | shader
    val mb: Long
)

data class HistoryEntry(
    val at: Long,
    val kind: String, // boost | network | dns | cache
    val summary: String
)

data class JobInfo(
    val id: String,
    val enabled: Boolean,
    val lastRun: Long,
    val intervalH: Int
)

sealed class BoostState {
    object Idle : BoostState()
    data class Running(val step: Int, val gameLabel: String?) : BoostState()
    data class Done(
        val freedMB: Long,
        val processes: Int,
        val pingMs: Double?,
        val dnsMs: Long?,
        val launched: Boolean
    ) : BoostState()
}

data class AppIconRequest(val pkg: String, val drawable: Drawable?)
