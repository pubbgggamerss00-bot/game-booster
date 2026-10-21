package com.neon.gamebooster.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neon.gamebooster.R
import com.neon.gamebooster.data.BoostState
import com.neon.gamebooster.ui.components.NeonButton
import com.neon.gamebooster.ui.screens.DeviceScreen
import com.neon.gamebooster.ui.screens.DnsScreen
import com.neon.gamebooster.ui.screens.HomeScreen
import com.neon.gamebooster.ui.screens.LibraryScreen
import com.neon.gamebooster.ui.screens.MonitorScreen
import com.neon.gamebooster.ui.screens.NetworkScreen
import com.neon.gamebooster.ui.screens.RamScreen
import com.neon.gamebooster.ui.screens.SettingsScreen
import com.neon.gamebooster.vm.AppViewModel

private val MAIN_SCREENS = listOf("home", "library", "monitor", "settings")

@Composable
fun AppRoot(vm: AppViewModel) {
    var screen by rememberSaveable { mutableStateOf("home") }
    val showBar = screen in MAIN_SCREENS

    BackHandler(enabled = !showBar) { screen = "home" }

    Box(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(Modifier.fillMaxSize()) {
            HeaderBar(screen, onBack = { screen = "home" })
            Box(Modifier.weight(1f)) {
                when (screen) {
                    "home" -> HomeScreen(
                        vm = vm,
                        onOpen = { screen = it },
                        onBoost = { vm.startBoost() }
                    )
                    "library" -> LibraryScreen(vm)
                    "ram" -> RamScreen(vm)
                    "dns" -> DnsScreen(vm)
                    "network" -> NetworkScreen(vm)
                    "monitor" -> MonitorScreen(vm)
                    "settings" -> SettingsScreen(vm)
                    "device" -> DeviceScreen(vm)
                }
            }
            if (showBar) {
                BottomBar(screen, onSelect = { screen = it })
            }
        }
        BoostOverlay(vm, onClose = { vm.resetBoost() })
    }
}

@Composable
private fun HeaderBar(screen: String, onBack: () -> Unit) {
    val sub = screen !in MAIN_SCREENS
    Surface(color = MaterialTheme.colorScheme.background) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (sub) {
                IconButton(onClick = onBack) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = stringResource(R.string.back),
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }
            }
            Text(
                text = titleFor(screen),
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun titleFor(screen: String): String = when (screen) {
    "home" -> stringResource(R.string.app_name)
    "library" -> stringResource(R.string.library_title)
    "ram" -> stringResource(R.string.ram_screen_title)
    "dns" -> stringResource(R.string.dns_screen_title)
    "network" -> stringResource(R.string.net_screen_title)
    "monitor" -> stringResource(R.string.monitor_screen_title)
    "settings" -> stringResource(R.string.settings_title)
    "device" -> stringResource(R.string.device_title)
    else -> stringResource(R.string.app_name)
}

@Composable
private fun BottomBar(screen: String, onSelect: (String) -> Unit) {
    NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
        NavigationBarItem(
            selected = screen == "home",
            onClick = { onSelect("home") },
            icon = { Icon(Icons.Filled.Home, contentDescription = null) },
            label = { Text(stringResource(R.string.nav_home), fontSize = 10.sp) }
        )
        NavigationBarItem(
            selected = screen == "library",
            onClick = { onSelect("library") },
            icon = { Icon(Icons.Filled.Apps, contentDescription = null) },
            label = { Text(stringResource(R.string.nav_library), fontSize = 10.sp) }
        )
        NavigationBarItem(
            selected = screen == "monitor",
            onClick = { onSelect("monitor") },
            icon = { Icon(Icons.Filled.BarChart, contentDescription = null) },
            label = { Text(stringResource(R.string.nav_monitor), fontSize = 10.sp) }
        )
        NavigationBarItem(
            selected = screen == "settings",
            onClick = { onSelect("settings") },
            icon = { Icon(Icons.Filled.Settings, contentDescription = null) },
            label = { Text(stringResource(R.string.nav_settings), fontSize = 10.sp) }
        )
    }
}

@Composable
fun BoostOverlay(vm: AppViewModel, onClose: () -> Unit) {
    val boost by vm.boost.collectAsState()
    when (val b = boost) {
        is BoostState.Running -> {
            OverlayShell {
                CircularProgressIndicator(
                    modifier = Modifier.size(44.dp),
                    color = MaterialTheme.colorScheme.primary,
                    strokeWidth = 4.dp
                )
                Text(
                    text = when (b.step) {
                        0 -> stringResource(R.string.boost_step_ram)
                        1 -> stringResource(R.string.boost_step_net)
                        2 -> stringResource(R.string.boost_step_profile)
                        else -> stringResource(R.string.boost_step_launch)
                    },
                    color = MaterialTheme.colorScheme.onBackground,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                if (b.gameLabel != null) {
                    Text(
                        text = b.gameLabel ?: "",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp
                    )
                }
                LinearProgressIndicator(
                    progress = (b.step + 1) / 4f,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
        is BoostState.Done -> {
            OverlayShell {
                Icon(
                    Icons.Filled.CheckCircle,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(48.dp)
                )
                Text(
                    text = stringResource(R.string.boost_done_title),
                    color = MaterialTheme.colorScheme.onBackground,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = stringResource(
                        R.string.boost_done_fmt,
                        b.freedMB.toString(),
                        b.processes
                    ),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 13.sp
                )
                val netLine = stringResource(R.string.boost_net_line) +
                    " • " + (b.pingMs?.toInt()?.toString() ?: "-") + "ms / DNS " +
                    (b.dnsMs?.toString() ?: "-") + "ms"
                Text(
                    text = netLine,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 11.sp
                )
                Text(
                    text = if (b.launched) {
                        stringResource(R.string.boost_launch_ok)
                    } else {
                        stringResource(R.string.boost_launch_skip)
                    },
                    color = if (b.launched) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                NeonButton(
                    text = stringResource(R.string.close),
                    onClick = onClose,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
        BoostState.Idle -> {}
    }
}

@Composable
private fun OverlayShell(content: @Composable () -> Unit) {
    Box(
        Modifier
            .fillMaxSize()
            .background(Color(0xB3070B14))
            .padding(28.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .padding(22.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                content()
            }
        }
    }
}
