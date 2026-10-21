package com.neon.gamebooster.vm

import android.app.ActivityManager
import android.app.Application
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.neon.gamebooster.data.AppItem
import com.neon.gamebooster.data.BoostState
import com.neon.gamebooster.data.Cleanable
import com.neon.gamebooster.data.DeviceInfo
import com.neon.gamebooster.data.DeviceRepo
import com.neon.gamebooster.data.DnsTestResult
import com.neon.gamebooster.data.GameProfile
import com.neon.gamebooster.data.HistoryEntry
import com.neon.gamebooster.data.JobInfo
import com.neon.gamebooster.data.NetDiag
import com.neon.gamebooster.data.NetRepo
import com.neon.gamebooster.data.PerfSnapshot
import com.neon.gamebooster.data.Prefs
import com.neon.gamebooster.data.RamHog
import com.neon.gamebooster.data.Settings
import com.neon.gamebooster.data.AppsRepo
import com.neon.gamebooster.work.Jobs
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AppViewModel(app: Application) : AndroidViewModel(app) {

    private val ctx: Context = app

    private val _settings = MutableStateFlow(Settings())
    val settings: StateFlow<Settings> = _settings.asStateFlow()

    private val _perf = MutableStateFlow(PerfSnapshot())
    val perf: StateFlow<PerfSnapshot> = _perf.asStateFlow()

    private val _device = MutableStateFlow(DeviceInfo())
    val device: StateFlow<DeviceInfo> = _device.asStateFlow()

    private val _apps = MutableStateFlow<List<AppItem>>(emptyList())
    val apps: StateFlow<List<AppItem>> = _apps.asStateFlow()

    private val _selected = MutableStateFlow<AppItem?>(null)
    val selectedGame: StateFlow<AppItem?> = _selected.asStateFlow()

    private val _favorites = MutableStateFlow<Set<String>>(emptySet())
    val favorites: StateFlow<Set<String>> = _favorites.asStateFlow()

    private val _profiles = MutableStateFlow<Map<String, GameProfile>>(emptyMap())
    val profiles: StateFlow<Map<String, GameProfile>> = _profiles.asStateFlow()

    private val _dnsResults = MutableStateFlow<List<DnsTestResult>>(emptyList())
    val dnsResults: StateFlow<List<DnsTestResult>> = _dnsResults.asStateFlow()

    private val _dnsTesting = MutableStateFlow(false)
    val dnsTesting: StateFlow<Boolean> = _dnsTesting.asStateFlow()

    private val _netDiag = MutableStateFlow<NetDiag?>(null)
    val netDiag: StateFlow<NetDiag?> = _netDiag.asStateFlow()

    private val _netRunning = MutableStateFlow(false)
    val netRunning: StateFlow<Boolean> = _netRunning.asStateFlow()

    private val _boost = MutableStateFlow<BoostState>(BoostState.Idle)
    val boost: StateFlow<BoostState> = _boost.asStateFlow()

    private val _history = MutableStateFlow<List<HistoryEntry>>(emptyList())
    val history: StateFlow<List<HistoryEntry>> = _history.asStateFlow()

    private val _jobsInfo = MutableStateFlow<List<JobInfo>>(emptyList())
    val jobsInfo: StateFlow<List<JobInfo>> = _jobsInfo.asStateFlow()

    private val _hogs = MutableStateFlow<List<RamHog>>(emptyList())
    val hogs: StateFlow<List<RamHog>> = _hogs.asStateFlow()

    private val _cleanables = MutableStateFlow<List<Cleanable>>(emptyList())
    val cleanables: StateFlow<List<Cleanable>> = _cleanables.asStateFlow()

    private val _lastCleanedMB = MutableStateFlow(0L)
    val lastCleanedMB: StateFlow<Long> = _lastCleanedMB.asStateFlow()

    init {
        viewModelScope.launch {
            val snap = Prefs.load(ctx)
            _settings.value = Settings(
                lang = snap.lang,
                theme = snap.theme,
                perfMode = snap.perfMode,
                bgClean = snap.bgClean,
                graphicsBoost = snap.graphicsBoost,
                batterySaver = snap.batterySaver,
                shaderProtect = snap.shaderProtect,
                sensitiveConfirm = snap.sensitiveConfirm,
                jobs = snap.jobs
            )
            _favorites.value = snap.favorites
            _profiles.value = snap.profiles.mapValues {
                GameProfile(it.value.first, it.value.second)
            }
            _history.value = snap.history.map { HistoryEntry(it.first, it.second, it.third) }
            refreshJobsInfo()
            Jobs.sync(ctx, snap.jobs)
            refreshHogs()
        }
        viewModelScope.launch {
            val list = AppsRepo.scan(ctx)
            _apps.value = list
            val sel = Prefs.load(ctx).selected
            if (sel != null) {
                _selected.value = list.firstOrNull { it.pkg == sel }
            }
        }
        viewModelScope.launch {
            while (isActive) {
                _perf.value = computePerf()
                _device.value = withContext(Dispatchers.IO) { DeviceRepo.info(ctx) }
                delay(1000)
            }
        }
    }

    private fun computePerf(): PerfSnapshot {
        val ram = DeviceRepo.ram(ctx)
        val temp = DeviceRepo.batteryTemp(ctx)
        val freq = DeviceRepo.cpuFreqMhz()
        return PerfSnapshot(
            ramUsedGB = ram.usedGB,
            ramTotalGB = ram.totalGB,
            ramPct = ram.pct,
            availGB = ram.availGB,
            tempC = temp,
            cpuFreqMhz = freq,
            cores = DeviceRepo.cores()
        )
    }

    // ---------- selection / favorites / profiles ----------

    fun selectGame(item: AppItem?) {
        _selected.value = item
        viewModelScope.launch {
            Prefs.putString(ctx, "selected", item?.pkg ?: "")
        }
    }

    fun toggleFavorite(pkg: String) {
        val next = if (pkg in _favorites.value) _favorites.value - pkg else _favorites.value + pkg
        _favorites.value = next
        viewModelScope.launch { Prefs.putFavorites(ctx, next) }
    }

    fun saveProfile(pkg: String, graphics: String?, priority: String?) {
        val current = _profiles.value[pkg] ?: GameProfile()
        val updated = GameProfile(
            graphics = graphics ?: current.graphics,
            priority = priority ?: current.priority
        )
        val next = _profiles.value + (pkg to updated)
        _profiles.value = next
        viewModelScope.launch {
            Prefs.putProfiles(ctx, next.mapValues { Pair(it.value.graphics, it.value.priority) })
        }
    }

    // ---------- settings ----------

    fun setLang(v: String) {
        _settings.value = _settings.value.copy(lang = v)
        viewModelScope.launch { Prefs.putString(ctx, "lang", v) }
    }

    fun setTheme(v: String) {
        _settings.value = _settings.value.copy(theme = v)
        viewModelScope.launch { Prefs.putString(ctx, "theme", v) }
    }

    fun toggleSetting(key: String) {
        val s = _settings.value
        val oldValue = when (key) {
            "perfMode" -> s.perfMode
            "bgClean" -> s.bgClean
            "graphicsBoost" -> s.graphicsBoost
            "batterySaver" -> s.batterySaver
            "shaderProtect" -> s.shaderProtect
            "sensitiveConfirm" -> s.sensitiveConfirm
            else -> return
        }
        val newValue = !oldValue
        _settings.value = when (key) {
            "perfMode" -> s.copy(perfMode = newValue)
            "bgClean" -> s.copy(bgClean = newValue)
            "graphicsBoost" -> s.copy(graphicsBoost = newValue)
            "batterySaver" -> s.copy(batterySaver = newValue)
            "shaderProtect" -> s.copy(shaderProtect = newValue)
            else -> s.copy(sensitiveConfirm = newValue)
        }
        viewModelScope.launch { Prefs.putBool(ctx, key, newValue) }
    }

    fun toggleJob(id: String) {
        val current = _settings.value.jobs
        val next = if (id in current) current - id else current + id
        _settings.value = _settings.value.copy(jobs = next)
        Jobs.sync(ctx, next)
        refreshJobsInfo()
        viewModelScope.launch {
            Prefs.putJobs(ctx, next)
            delay(1200)
            refreshJobsInfo()
        }
    }

    fun runJobNow(id: String) {
        Jobs.runNow(ctx, id)
        viewModelScope.launch {
            delay(1500)
            refreshJobsInfo()
        }
    }

    private fun refreshJobsInfo() {
        val enabled = _settings.value.jobs
        _jobsInfo.value = listOf(
            JobInfo("cache", "cache" in enabled, JobLog_lastRun("cache"), 12),
            JobInfo("check", "check" in enabled, JobLog_lastRun("check"), 24)
        )
    }

    private fun JobLog_lastRun(id: String): Long =
        com.neon.gamebooster.work.JobLog.lastRun(ctx, id)

    // ---------- DNS ----------

    fun runDnsTests() {
        if (_dnsTesting.value) return
        viewModelScope.launch {
            _dnsTesting.value = true
            val results = mutableListOf<DnsTestResult>()
            for (server in NetRepo.DNS_SERVERS) {
                val ms = NetRepo.tcpMs(server.ip)
                results.add(DnsTestResult(server.id, ms))
                _dnsResults.value = results.sortedWith(
                    compareBy<DnsTestResult> { it.ms ?: Int.MAX_VALUE }
                )
            }
            _dnsTesting.value = false
            val best = results.filter { it.ms != null }.minByOrNull { it.ms!! }
            addHistory(
                "dns",
                "tested " + results.size + " servers • best: " + (best?.id ?: "-") +
                    if (best != null) " (${best.ms}ms)" else ""
            )
        }
    }

    fun bestDnsId(): String? =
        _dnsResults.value.firstOrNull { it.ms != null }?.id

    // ---------- network ----------

    fun runNetDiag() {
        if (_netRunning.value) return
        viewModelScope.launch {
            _netRunning.value = true
            val ps = NetRepo.pingStats()
            val dnsMs = NetRepo.dnsResolveMs()
            val diag = NetRepo.buildDiag(ps, dnsMs)
            _netDiag.value = diag
            _netRunning.value = false
            addHistory(
                "network",
                "ping " + (ps?.avgMs?.toInt() ?: -1) + "ms • jitter " +
                    (ps?.jitterMs?.toInt() ?: -1) + "ms • loss " +
                    (ps?.lossPct?.toInt() ?: -1) + "% • score " + diag.score
            )
        }
    }

    // ---------- boost ----------

    fun startBoost() {
        if (_boost.value is BoostState.Running) return
        viewModelScope.launch {
            val game = _selected.value
            _boost.value = BoostState.Running(0, game?.label)

            val am = ctx.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val before = DeviceRepo.ram(ctx)
            var asked = 0
            if (_settings.value.bgClean) {
                asked = withContext(Dispatchers.IO) { killBackground(am) }
            }
            delay(700)
            val after = DeviceRepo.ram(ctx)
            val freedMB = maxOf(0L, ((after.availGB - before.availGB) * 1024).toLong())

            _boost.value = BoostState.Running(1, game?.label)
            val ps = NetRepo.pingStats()
            val dnsMs = NetRepo.dnsResolveMs()
            val diag = NetRepo.buildDiag(ps, dnsMs)
            _netDiag.value = diag
            delay(500)

            _boost.value = BoostState.Running(2, game?.label)
            delay(600)

            var launched = false
            if (game != null) {
                _boost.value = BoostState.Running(3, game.label)
                val intent = AppsRepo.launchIntent(ctx, game.pkg)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    try {
                        ctx.startActivity(intent)
                        launched = true
                    } catch (e: Exception) {
                    }
                }
                delay(900)
            }

            addHistory(
                "boost",
                (game?.label ?: "-") + " • freed " + freedMB + "MB • " + asked + " procs"
            )
            addHistory(
                "network",
                "ping " + (ps?.avgMs?.toInt() ?: -1) + "ms • score " + diag.score
            )
            _boost.value = BoostState.Done(freedMB, asked, ps?.avgMs, dnsMs, launched)
        }
    }

    private fun killBackground(am: ActivityManager): Int {
        val pm = ctx.packageManager
        var asked = 0
        try {
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            for (info in apps) {
                if (info.packageName == ctx.packageName) continue
                if (info.flags and ApplicationInfo.FLAG_SYSTEM != 0) continue
                if (info.flags and ApplicationInfo.FLAG_STOPPED != 0) continue
                try {
                    am.killBackgroundProcesses(info.packageName)
                    asked++
                } catch (e: Exception) {
                }
            }
        } catch (e: Exception) {
        }
        return asked
    }

    fun resetBoost() {
        _boost.value = BoostState.Idle
    }

    // ---------- RAM manager ----------

    fun refreshHogs() {
        val jobs = _settings.value.jobs
        val hogs = mutableListOf<RamHog>()
        if ("cache" in jobs) hogs.add(RamHog("job_cache", true))
        if ("check" in jobs) hogs.add(RamHog("job_check", true))
        hogs.add(RamHog("system_protected", false))
        _hogs.value = hogs
    }

    fun stopOwnJobs(): Int {
        val jobs = _settings.value.jobs
        if (jobs.isEmpty()) return 0
        _settings.value = _settings.value.copy(jobs = emptySet())
        Jobs.sync(ctx, emptySet())
        refreshJobsInfo()
        refreshHogs()
        viewModelScope.launch {
            Prefs.putJobs(ctx, emptySet())
            addHistory("boost", "stopped own background jobs (" + jobs.size + ")")
        }
        return jobs.size
    }

    fun refreshCleanables() {
        viewModelScope.launch {
            val cacheMB = DeviceRepo.ownCacheSizeMB(ctx)
            val shaderMB = DeviceRepo.ownShaderSizeMB(ctx)
            val items = mutableListOf<Cleanable>()
            if (cacheMB > 0) items.add(Cleanable("app_cache", "safe", cacheMB))
            if (shaderMB > 0) items.add(Cleanable("shader_cache", "shader", shaderMB))
            _cleanables.value = items
        }
    }

    fun cleanOwnCache(includeShader: Boolean) {
        viewModelScope.launch {
            val freed = DeviceRepo.cleanOwnCache(ctx, !includeShader)
            _lastCleanedMB.value = freed
            addHistory("cache", "cleaned " + freed + "MB")
            refreshCleanables()
        }
    }

    // ---------- history ----------

    fun addHistory(kind: String, summary: String) {
        val at = System.currentTimeMillis()
        _history.value = listOf(HistoryEntry(at, kind, summary)) + _history.value
        viewModelScope.launch { Prefs.appendHistory(ctx, at, kind, summary) }
    }

    // ---------- reset ----------

    fun resetAll() {
        viewModelScope.launch {
            Prefs.clearAll(ctx)
            Jobs.sync(ctx, emptySet())
            _settings.value = Settings()
            _favorites.value = emptySet()
            _profiles.value = emptyMap()
            _history.value = emptyList()
            _selected.value = null
            _dnsResults.value = emptyList()
            _netDiag.value = null
            _hogs.value = emptyList()
            _cleanables.value = emptyList()
            refreshJobsInfo()
        }
    }
}
