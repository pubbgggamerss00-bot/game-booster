package com.neon.gamebooster.data

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket

object AppsRepo {

    suspend fun scan(ctx: Context): List<AppItem> = withContext(Dispatchers.IO) {
        val pm = ctx.packageManager
        val out = mutableListOf<AppItem>()
        try {
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            for (info in apps) {
                if (info.packageName == ctx.packageName) continue
                if (pm.getLaunchIntentForPackage(info.packageName) == null) continue
                val lbl = try {
                    pm.getApplicationLabel(info).toString()
                } catch (e: Exception) {
                    info.packageName
                }
                val isGame = info.category == ApplicationInfo.CATEGORY_GAME ||
                    lbl.contains("game", ignoreCase = true) ||
                    info.packageName.contains("game", ignoreCase = true)
                out.add(AppItem(info.packageName, lbl, isGame))
            }
        } catch (e: Exception) {
        }
        out.sortWith(compareByDescending<AppItem> { it.isGame }.thenBy { it.label.lowercase() })
        out.take(150)
    }

    fun launchIntent(ctx: Context, pkg: String): Intent? =
        ctx.packageManager.getLaunchIntentForPackage(pkg)

    fun icon(ctx: Context, pkg: String): android.graphics.drawable.Drawable? = try {
        ctx.packageManager.getApplicationIcon(pkg)
    } catch (e: Exception) {
        null
    }

    fun countLaunchable(ctx: Context): Int {
        val pm = ctx.packageManager
        var n = 0
        try {
            for (info in pm.getInstalledApplications(PackageManager.GET_META_DATA)) {
                if (pm.getLaunchIntentForPackage(info.packageName) != null) n++
            }
        } catch (e: Exception) {
        }
        return n
    }
}

object NetRepo {

    val DNS_SERVERS: List<DnsServer> = listOf(
        DnsServer("cloudflare", "Cloudflare", "1.1.1.1", "global", true, true),
        DnsServer("google", "Google", "8.8.8.8", "global", true, true),
        DnsServer("quad9", "Quad9", "9.9.9.9", "global", true, true),
        DnsServer("adguard", "AdGuard", "94.140.14.14", "global", true, true),
        DnsServer("opendns", "OpenDNS", "208.67.222.222", "global", false, true),
        DnsServer("shecan", "Shecan", "178.22.122.100", "ir", true, false),
        DnsServer("radar", "Radar Game", "10.202.10.10", "ir", true, false),
        DnsServer("electro", "Electro", "78.157.42.100", "ir", true, false),
        DnsServer("begzar", "Begzar", "185.55.226.26", "ir", false, false),
        DnsServer("403", "403.online", "10.202.10.202", "ir", true, false)
    )

    fun serverById(id: String): DnsServer? = DNS_SERVERS.firstOrNull { it.id == id }

    suspend fun tcpMs(ip: String, port: Int = 53, timeoutMs: Int = 2500): Int? =
        withContext(Dispatchers.IO) {
            try {
                val socket = Socket()
                val t0 = System.currentTimeMillis()
                socket.connect(InetSocketAddress(ip, port), timeoutMs)
                val ms = (System.currentTimeMillis() - t0).toInt()
                try {
                    socket.close()
                } catch (e: Exception) {
                }
                ms
            } catch (e: Exception) {
                null
            }
        }

    suspend fun dnsResolveMs(host: String = "cloudflare.com"): Long? =
        withContext(Dispatchers.IO) {
            try {
                val t0 = System.currentTimeMillis()
                InetAddress.getByName(host)
                System.currentTimeMillis() - t0
            } catch (e: Exception) {
                null
            }
        }

    suspend fun pingStats(host: String = "1.1.1.1", count: Int = 4): PingStats? =
        withContext(Dispatchers.IO) {
            try {
                val proc = Runtime.getRuntime()
                    .exec(arrayOf("ping", "-c", "$count", "-W", "2", host))
                val out = proc.inputStream.bufferedReader().readText()
                proc.waitFor()
                val samples = Regex("time=([0-9.]+)").findAll(out)
                    .mapNotNull { it.groupValues.getOrNull(1)?.toDoubleOrNull() }
                    .toList()
                val lossPct = Regex("([0-9.]+)% packet loss").find(out)
                    ?.groupValues?.getOrNull(1)?.toDoubleOrNull()
                if (samples.isEmpty() && (lossPct == null || lossPct >= 100.0)) {
                    return@withContext null
                }
                val avg = if (samples.isNotEmpty()) samples.average() else 0.0
                val jitter = if (samples.size >= 2) {
                    var acc = 0.0
                    for (i in 1 until samples.size) acc += Math.abs(samples[i] - samples[i - 1])
                    acc / (samples.size - 1)
                } else 0.0
                PingStats(avg, jitter, lossPct ?: 0.0, samples)
            } catch (e: Exception) {
                null
            }
        }

    fun buildDiag(ps: PingStats?, dnsMs: Long?): NetDiag {
        var score = 100
        if (ps == null) {
            return NetDiag(null, null, null, dnsMs, "poor", 0)
        }
        if (ps.avgMs > 150) score -= 45 else if (ps.avgMs > 90) score -= 25
        if (ps.jitterMs > 25) score -= 20 else if (ps.jitterMs > 15) score -= 10
        if (ps.lossPct > 5) score -= 35 else if (ps.lossPct > 0) score -= 20
        score = score.coerceIn(0, 100)
        val quality = when {
            score >= 85 -> "excellent"
            score >= 65 -> "good"
            score >= 40 -> "fair"
            else -> "poor"
        }
        return NetDiag(ps.avgMs, ps.jitterMs, ps.lossPct, dnsMs, quality, score)
    }
}
