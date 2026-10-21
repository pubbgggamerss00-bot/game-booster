package com.neon.gamebooster.data

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

private val Context.dataStore by preferencesDataStore(name = "gb_settings")

object Prefs {

    private val K_LANG = stringPreferencesKey("lang")
    private val K_THEME = stringPreferencesKey("theme")
    private val K_PERF = booleanPreferencesKey("perfMode")
    private val K_BGCLEAN = booleanPreferencesKey("bgClean")
    private val K_GBOOST = booleanPreferencesKey("graphicsBoost")
    private val K_BATTERY = booleanPreferencesKey("batterySaver")
    private val K_SHADER = booleanPreferencesKey("shaderProtect")
    private val K_SENSITIVE = booleanPreferencesKey("sensitiveConfirm")
    private val K_FAVS = stringSetPreferencesKey("favorites")
    private val K_JOBS = stringSetPreferencesKey("jobs")
    private val K_PROFILES = stringPreferencesKey("profiles")
    private val K_HISTORY = stringPreferencesKey("history")
    private val K_SELECTED = stringPreferencesKey("selectedGame")

    const val HISTORY_CAP = 50

    data class Snapshot(
        val lang: String,
        val theme: String,
        val perfMode: Boolean,
        val bgClean: Boolean,
        val graphicsBoost: Boolean,
        val batterySaver: Boolean,
        val shaderProtect: Boolean,
        val sensitiveConfirm: Boolean,
        val favorites: Set<String>,
        val jobs: Set<String>,
        val profiles: Map<String, Pair<String, String>>,
        val history: List<Triple<Long, String, String>>,
        val selected: String?
    )

    fun langSync(ctx: Context): String = runBlocking {
        ctx.dataStore.data.first()[K_LANG] ?: "fa"
    }

    suspend fun load(ctx: Context): Snapshot {
        val p = ctx.dataStore.data.first()
        val profilesRaw = p[K_PROFILES] ?: ""
        val profiles = parseProfiles(profilesRaw)
        val historyRaw = p[K_HISTORY] ?: ""
        val history = historyRaw.split(";;").filter { it.isNotBlank() }.map { entry ->
            val parts = entry.split("::", limit = 3)
            Triple(
                parts.getOrNull(0)?.toLongOrNull() ?: 0L,
                parts.getOrNull(1) ?: "boost",
                parts.getOrNull(2) ?: ""
            )
        }
        return Snapshot(
            lang = p[K_LANG] ?: "fa",
            theme = p[K_THEME] ?: "dark",
            perfMode = p[K_PERF] ?: true,
            bgClean = p[K_BGCLEAN] ?: true,
            graphicsBoost = p[K_GBOOST] ?: false,
            batterySaver = p[K_BATTERY] ?: false,
            shaderProtect = p[K_SHADER] ?: true,
            sensitiveConfirm = p[K_SENSITIVE] ?: true,
            favorites = p[K_FAVS] ?: emptySet(),
            jobs = p[K_JOBS] ?: setOf("cache", "check"),
            profiles = profiles,
            history = history,
            selected = p[K_SELECTED]
        )
    }

    private fun parseProfiles(raw: String): Map<String, Pair<String, String>> {
        val out = mutableMapOf<String, Pair<String, String>>()
        raw.split(";;").filter { it.isNotBlank() }.forEach { entry ->
            val parts = entry.split("|", limit = 3)
            if (parts.size == 3) {
                out[parts[0]] = Pair(parts[1], parts[2])
            }
        }
        return out
    }

    private fun encodeProfiles(map: Map<String, Pair<String, String>>): String =
        map.entries.joinToString(";;") { "${it.key}|${it.value.first}|${it.value.second}" }

    suspend fun putString(ctx: Context, key: String, value: String) {
        val k = when (key) {
            "lang" -> K_LANG
            "theme" -> K_THEME
            else -> K_SELECTED
        }
        ctx.dataStore.edit { it[k] = value }
    }

    suspend fun putBool(ctx: Context, key: String, value: Boolean) {
        val k = when (key) {
            "perfMode" -> K_PERF
            "bgClean" -> K_BGCLEAN
            "graphicsBoost" -> K_GBOOST
            "batterySaver" -> K_BATTERY
            "shaderProtect" -> K_SHADER
            else -> K_SENSITIVE
        }
        ctx.dataStore.edit { it[k] = value }
    }

    suspend fun putFavorites(ctx: Context, value: Set<String>) {
        ctx.dataStore.edit { it[K_FAVS] = value }
    }

    suspend fun putJobs(ctx: Context, value: Set<String>) {
        ctx.dataStore.edit { it[K_JOBS] = value }
    }

    suspend fun putProfiles(ctx: Context, value: Map<String, Pair<String, String>>) {
        ctx.dataStore.edit { it[K_PROFILES] = encodeProfiles(value) }
    }

    suspend fun appendHistory(ctx: Context, at: Long, kind: String, summary: String) {
        val current = ctx.dataStore.data.first()[K_HISTORY] ?: ""
        val list = current.split(";;").filter { it.isNotBlank() }.toMutableList()
        list.add(0, "$at::$kind::$summary")
        while (list.size > HISTORY_CAP) list.removeAt(list.size - 1)
        ctx.dataStore.edit { it[K_HISTORY] = list.joinToString(";;") }
    }

    suspend fun clearAll(ctx: Context) {
        ctx.dataStore.edit { it.clear() }
    }
}
