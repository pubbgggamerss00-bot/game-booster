package com.neon.gamebooster.ui.screens

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
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neon.gamebooster.R
import com.neon.gamebooster.data.HistoryEntry
import com.neon.gamebooster.ui.components.EmptyText
import com.neon.gamebooster.ui.components.Meter
import com.neon.gamebooster.ui.components.NeonCard
import com.neon.gamebooster.ui.components.SectionTitle
import com.neon.gamebooster.ui.components.TagChip
import com.neon.gamebooster.ui.components.fmtGB
import com.neon.gamebooster.ui.components.ramColor
import com.neon.gamebooster.ui.theme.NeonAmber
import com.neon.gamebooster.ui.theme.NeonCyan
import com.neon.gamebooster.ui.theme.NeonGreen
import com.neon.gamebooster.ui.theme.NeonPurple
import com.neon.gamebooster.ui.theme.NeonRed
import com.neon.gamebooster.vm.AppViewModel

@Composable
fun MonitorScreen(vm: AppViewModel) {
    val perf = vm.perf.collectAsState().value
    val device = vm.device.collectAsState().value
    val history = vm.history.collectAsState().value
    var tab by rememberSaveable { mutableStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Tabs
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MonitorTab(
                modifier = Modifier.weight(1f),
                label = stringResource(R.string.tab_cpu),
                selected = tab == 0,
                onClick = { tab = 0 }
            )
            MonitorTab(
                modifier = Modifier.weight(1f),
                label = stringResource(R.string.tab_ram),
                selected = tab == 1,
                onClick = { tab = 1 }
            )
            MonitorTab(
                modifier = Modifier.weight(1f),
                label = stringResource(R.string.tab_temp),
                selected = tab == 2,
                onClick = { tab = 2 }
            )
            MonitorTab(
                modifier = Modifier.weight(1f),
                label = stringResource(R.string.tab_history),
                selected = tab == 3,
                onClick = { tab = 3 }
            )
        }

        when (tab) {
            0 -> {
                // CPU
                NeonCard {
                    SectionTitle(stringResource(R.string.cpu_section))
                    Text(
                        text = perf.cpuFreqMhz?.let { it.toString() + " MHz" }
                            ?: stringResource(R.string.cpu_freq_na),
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Filled.Memory,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = stringResource(R.string.cores_fmt, perf.cores),
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 12.sp
                        )
                    }
                }
            }
            1 -> {
                // RAM
                NeonCard {
                    SectionTitle(stringResource(R.string.ram_section))
                    Text(
                        text = fmtGB(perf.ramUsedGB) + " / " + fmtGB(perf.ramTotalGB) + " GB",
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Meter(pct = perf.ramPct / 100f, color = ramColor(perf.ramPct))
                    Text(
                        text = stringResource(
                            R.string.ram_usage_fmt,
                            fmtGB(perf.ramUsedGB),
                            fmtGB(perf.ramTotalGB)
                        ),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp
                    )
                    Text(
                        text = stringResource(
                            when {
                                perf.ramPct < 70 -> R.string.pressure_low
                                perf.ramPct < 85 -> R.string.pressure_mid
                                else -> R.string.pressure_high
                            }
                        ),
                        color = ramColor(perf.ramPct),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            2 -> {
                // Temperature
                val t = perf.tempC
                val tempColor = when {
                    t == null -> MaterialTheme.colorScheme.onSurfaceVariant
                    t < 38 -> NeonGreen
                    t < 43 -> NeonAmber
                    else -> NeonRed
                }
                NeonCard {
                    SectionTitle(stringResource(R.string.temp_section))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Filled.Thermostat,
                            contentDescription = null,
                            tint = tempColor,
                            modifier = Modifier.size(26.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = t?.let { stringResource(R.string.temp_value, fmtGB(it)) }
                                ?: stringResource(R.string.temp_na),
                            color = tempColor,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Text(
                        text = stringResource(R.string.temp_title),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp
                    )
                }
            }
            else -> {
                // History
                SectionTitle(stringResource(R.string.history_title))
                if (history.isEmpty()) {
                    EmptyText(stringResource(R.string.history_empty))
                } else {
                    for (entry in history.take(30)) {
                        MonitorHistoryRow(entry = entry)
                    }
                }
            }
        }
    }
}

@Composable
private fun MonitorTab(
    modifier: Modifier = Modifier,
    label: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = if (selected) {
            MaterialTheme.colorScheme.primaryContainer
        } else {
            MaterialTheme.colorScheme.surfaceVariant
        }
    ) {
        Text(
            text = label,
            color = if (selected) {
                MaterialTheme.colorScheme.onPrimaryContainer
            } else {
                MaterialTheme.colorScheme.onSurfaceVariant
            },
            fontSize = 11.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onClick)
                .padding(vertical = 8.dp)
        )
    }
}

@Composable
private fun MonitorHistoryRow(entry: HistoryEntry) {
    val chipRes = when (entry.kind) {
        "boost" -> R.string.hist_boost
        "network" -> R.string.hist_network
        "dns" -> R.string.hist_dns
        else -> R.string.hist_cache
    }
    val chipColor = when (entry.kind) {
        "boost" -> NeonGreen
        "network" -> NeonCyan
        "dns" -> NeonPurple
        else -> NeonAmber
    }
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TagChip(stringResource(chipRes), chipColor)
            Spacer(Modifier.width(8.dp))
            Text(
                text = entry.summary,
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 11.sp,
                maxLines = 2,
                modifier = Modifier.weight(1f)
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = java.text.DateFormat.getDateTimeInstance()
                    .format(java.util.Date(entry.at)),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 9.sp
            )
        }
    }
}
