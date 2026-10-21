package com.neon.gamebooster

import android.app.Activity
import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.neon.gamebooster.data.Prefs
import com.neon.gamebooster.ui.AppRoot
import com.neon.gamebooster.ui.theme.GameBoosterTheme
import com.neon.gamebooster.vm.AppViewModel
import java.util.Locale

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        applyLang(Prefs.langSync(applicationContext))
        setContent {
            val vm: AppViewModel = viewModel()
            val s by vm.settings.collectAsState()
            GameBoosterTheme(darkTheme = s.theme != "light") {
                AppRoot(vm)
            }
        }
    }

    private fun applyLang(code: String) {
        val locale = Locale(if (code == "en") "en" else "fa")
        Locale.setDefault(locale)
        val config = Configuration()
        config.setLocale(locale)
        @Suppress("DEPRECATION")
        resources.updateConfiguration(config, resources.displayMetrics)
    }

    fun recreateWithLang(code: String) {
        applyLang(code)
        recreate()
    }
}
