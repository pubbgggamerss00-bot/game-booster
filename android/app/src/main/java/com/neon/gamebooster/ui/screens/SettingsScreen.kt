package com.neon.gamebooster.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.BatterySaver
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Eraser
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neon.gamebooster.MainActivity
import com.neon.gamebooster.R
import com.neon.gamebooster.data.JobInfo
import com.neon.gamebooster.ui.components.NeonButton
import com.neon.gamebooster.ui.components.NeonCard
import com.neon.gamebooster.ui.components.SectionTitle
import com.neon.gamebooster.ui.components.TagChip
import com.neon.gamebooster.ui.theme.NeonAmber
import com.neon.gamebooster.ui.theme.NeonCyan
import com.neon.gamebooster.ui.theme.NeonGreen
import com.neon.gamebooster.ui.theme.NeonRed
import com.neon.gamebooster.vm.AppViewModel

@Composable
fun SettingsScreen(vm: AppViewModel) {
    val s = vm.settings.collectAsState().value
    val jobsInfo = vm.jobsInfo.collectAsState().value
    val context = LocalContext.current
    var showReset by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Language
        NeonCard {
            SectionTitle(stringResource(R.string.lang_title))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SettingsSegButton(
                    modifier = Modifier.weight(1f),
                    text = stringResource(R.string.lang_fa),
                    selected = s.lang == "fa",
                    onClick = {
                        vm.setLang("fa")
                        (context as? MainActivity)?.recreateWithLang("fa")
                    }
                )
                SettingsSegButton(
                    modifier = Modifier.weight(1f),
                    text = stringResource(R.string.lang_en),
                    selected = s.lang == "en",
                    onClick = {
                        vm.setLang("en")
                        (context as? MainActivity)?.recreateWithLang("en")
                    }
                )
            }
            Text(
                text = stringResource(R.string.lang_note),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp
            )
        }

        // Theme (live, no recreate)
        NeonCard {
            SectionTitle(stringResource(R.string.theme_title))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SettingsSegButton(
                    modifier = Modifier.weight(1f),
                    text = stringResource(R.string.theme_dark),
                    icon = Icons.Filled.DarkMode,
                    selected = s.theme == "dark",
                    onClick = { vm.setTheme("dark") }
                )
                SettingsSegButton(
                    modifier = Modifier.weight(1f),
                    text = stringResource(R.string.theme_light),
                    icon = Icons.Filled.LightMode,
                    selected = s.theme == "light",
                    onClick = { vm.setTheme("light") }
                )
            }
        }

        // Boost preferences
        NeonCard {
            SectionTitle(stringResource(R.string.boosts_title))
            SettingsToggleRow(
                icon = Icons.Filled.Bolt,
                tint = MaterialTheme.colorScheme.primary,
                title = stringResource(R.string.perf_mode),
                sub = stringResource(R.string.perf_mode_sub),
                checked = s.perfMode,
                onChange = { vm.toggleSetting("perfMode") }
            )
            SettingsToggleRow(
                icon = Icons.Filled.Eraser,
                tint = MaterialTheme.colorScheme.primary,
                title = stringResource(R.string.bg_clean),
                sub = stringResource(R.string.bg_clean_sub),
                checked = s.bgClean,
                onChange = { vm.toggleSetting("bgClean") }
            )
            SettingsToggleRow(
                icon = Icons.Filled.AutoAwesome,
                tint = MaterialTheme.colorScheme.primary,
                title = stringResource(R.string.graphics_boost),
                sub = stringResource(R.string.graphics_boost_sub),
                checked = s.graphicsBoost,
                onChange = { vm.toggleSetting("graphicsBoost") }
            )
            SettingsToggleRow(
                icon = Icons.Filled.BatterySaver,
                tint = MaterialTheme.colorScheme.primary,
                title = stringResource(R.string.battery_saver),
                sub = stringResource(R.string.battery_saver_sub),
                checked = s.batterySaver,
                onChange = { vm.toggleSetting("batterySaver") }
            )
        }

        // Data protection (no section title)
        NeonCard {
            SettingsToggleRow(
                icon = Icons.Filled.Shield,
                tint = NeonAmber,
                title = stringResource(R.string.shader_protect),
                sub = stringResource(R.string.shader_protect_sub),
                checked = s.shaderProtect,
                onChange = { vm.toggleSetting("shaderProtect") }
            )
            SettingsToggleRow(
                icon = Icons.Filled.HelpOutline,
                tint = NeonCyan,
                title = stringResource(R.string.sensitive_confirm),
                sub = stringResource(R.string.sensitive_confirm_sub),
                checked = s.sensitiveConfirm,
                onChange = { vm.toggleSetting("sensitiveConfirm") }
            )
        }

        // Background jobs
        NeonCard {
            SectionTitle(stringResource(R.string.jobs_title))
            for (info in jobsInfo) {
                SettingsJobRow(
                    info = info,
                    onToggle = { vm.toggleJob(info.id) },
                    onRunNow = { vm.runJobNow(info.id) }
                )
            }
            Text(
                text = stringResource(R.string.jobs_note),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp
            )
        }

        // Danger zone
        NeonCard {
            NeonButton(
                text = stringResource(R.string.reset_btn),
                onClick = { showReset = true },
                modifier = Modifier.fillMaxWidth(),
                container = NeonRed,
                contentColor = Color.White
            )
        }

        // About
        NeonCard {
            SectionTitle(stringResource(R.string.about_title))
            Text(
                text = stringResource(R.string.about_body),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TagChip(stringResource(R.string.root_ok), NeonGreen, Modifier.weight(1f))
                TagChip(stringResource(R.string.privacy_ok), NeonCyan, Modifier.weight(1f))
            }
        }
    }

    if (showReset) {
        AlertDialog(
            onDismissRequest = { showReset = false },
            title = { Text(stringResource(R.string.reset_confirm_title)) },
            text = { Text(stringResource(R.string.reset_confirm_body)) },
            confirmButton = {
                TextButton(
                    onClick = {
                        vm.resetAll()
                        showReset = false
                        Toast.makeText(
                            context,
                            context.getString(R.string.settings_title),
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                ) {
                    Text(stringResource(R.string.reset_btn))
                }
            },
            dismissButton = {
                TextButton(onClick = { showReset = false }) {
                    Text(stringResource(R.string.close))
                }
            }
        )
    }
}

@Composable
private fun SettingsSegButton(
    modifier: Modifier = Modifier,
    text: String,
    icon: ImageVector? = null,
    selected: Boolean,
    onClick: () -> Unit
) {
    val fg = if (selected) {
        MaterialTheme.colorScheme.onPrimaryContainer
    } else {
        MaterialTheme.colorScheme.onSurfaceVariant
    }
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = if (selected) {
            MaterialTheme.colorScheme.primaryContainer
        } else {
            MaterialTheme.colorScheme.surfaceVariant
        },
        border = BorderStroke(
            1.dp,
            if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
        )
    ) {
        Row(
            modifier = Modifier
                .clickable(onClick = onClick)
                .padding(horizontal = 10.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (icon != null) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = fg,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(Modifier.width(6.dp))
            }
            Text(
                text = text,
                color = fg,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun SettingsToggleRow(
    icon: ImageVector,
    tint: Color,
    title: String,
    sub: String,
    checked: Boolean,
    onChange: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(20.dp)
        )
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text(
                text = title,
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = sub,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp
            )
        }
        Switch(checked = checked, onCheckedChange = { onChange() })
    }
}

@Composable
private fun SettingsJobRow(info: JobInfo, onToggle: () -> Unit, onRunNow: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            Icons.Filled.Work,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp)
        )
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text(
                text = stringResource(
                    if (info.id == "cache") R.string.job_cache else R.string.job_check
                ),
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
            val lastRunText = if (info.lastRun > 0) {
                java.text.DateFormat.getDateTimeInstance().format(java.util.Date(info.lastRun))
            } else {
                stringResource(R.string.job_never)
            }
            Text(
                text = stringResource(R.string.job_interval_fmt, info.intervalH) +
                    " • " + stringResource(R.string.job_last_run) + ": " + lastRunText,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp
            )
            Text(
                text = stringResource(R.string.job_run_now),
                color = MaterialTheme.colorScheme.primary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .padding(top = 2.dp)
                    .clickable(onClick = onRunNow)
            )
        }
        Switch(checked = info.enabled, onCheckedChange = { onToggle() })
    }
}
