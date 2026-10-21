package com.neon.gamebooster.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.neon.gamebooster.data.AppsRepo
import com.neon.gamebooster.data.DeviceRepo
import java.util.concurrent.TimeUnit

object JobLog {
    private const val NAME = "gb_jobs"

    fun append(ctx: Context, jobId: String, message: String) {
        val prefs = ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putLong("$jobId.last", System.currentTimeMillis())
            .apply()
        val prev = prefs.getString("$jobId.log", "") ?: ""
        val line = "${System.currentTimeMillis()} :: $message"
        val next = (listOf(line) + prev.split(";;").filter { it.isNotBlank() })
            .take(20)
            .joinToString(";;")
        prefs.edit().putString("$jobId.log", next).apply()
    }

    fun lastRun(ctx: Context, jobId: String): Long =
        ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).getLong("$jobId.last", 0)
}

class CacheCleanWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val ctx = applicationContext
        var mb = 0L
        try {
            mb = DeviceRepo.cleanOwnCache(ctx, true)
        } catch (e: Exception) {
        }
        JobLog.append(ctx, "cache", "cleaned ${mb}MB")
        return Result.success()
    }
}

class AppCheckWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val ctx = applicationContext
        val n = try {
            AppsRepo.countLaunchable(ctx)
        } catch (e: Exception) {
            -1
        }
        JobLog.append(ctx, "check", "scanned $n apps")
        return Result.success()
    }
}

object Jobs {
    const val W_CACHE = "gb_cache_periodic"
    const val W_CHECK = "gb_check_periodic"
    const val ID_CACHE = "cache"
    const val ID_CHECK = "check"

    fun sync(ctx: Context, enabled: Set<String>) {
        val wm = WorkManager.getInstance(ctx)
        if (ID_CACHE in enabled) {
            wm.enqueueUniquePeriodicWork(
                W_CACHE,
                ExistingPeriodicWorkPolicy.UPDATE,
                PeriodicWorkRequestBuilder<CacheCleanWorker>(12, TimeUnit.HOURS).build()
            )
        } else {
            wm.cancelUniqueWork(W_CACHE)
        }
        if (ID_CHECK in enabled) {
            wm.enqueueUniquePeriodicWork(
                W_CHECK,
                ExistingPeriodicWorkPolicy.UPDATE,
                PeriodicWorkRequestBuilder<AppCheckWorker>(24, TimeUnit.HOURS).build()
            )
        } else {
            wm.cancelUniqueWork(W_CHECK)
        }
    }

    fun runNow(ctx: Context, id: String) {
        val wm = WorkManager.getInstance(ctx)
        if (id == ID_CACHE) {
            wm.enqueue(
                OneTimeWorkRequestBuilder<CacheCleanWorker>()
                    .setExpedited(androidx.work.OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
                    .build()
            )
        } else if (id == ID_CHECK) {
            wm.enqueue(
                OneTimeWorkRequestBuilder<AppCheckWorker>()
                    .setExpedited(androidx.work.OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
                    .build()
            )
        }
    }
}
