package com.neon.gamebooster.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Smartphone
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neon.gamebooster.R
import com.neon.gamebooster.data.BoostState
import com.neon.gamebooster.data.NetRepo
import com.neon.gamebooster.ui.components.AppIcon
import com.neon.gamebooster.ui.components.EmptyText
import com.neon.gamebooster.ui.components.Meter
import com.neon.gamebooster.ui.components.NeonButton
import com.neon.gamebooster.ui.components.NeonCard
import com.neon.gamebooster.ui.components.SectionTitle
import com.neon.gamebooster.ui.components.StatTile
import com.neon.gamebooster.ui.components.fmtGB
import com.neon.gamebooster.ui.components.ramColor
import com.neon.gamebooster.ui.theme.NeonCyan
import com.neon.gamebooster.ui.theme.NeonPurple
import com.neon.gamebooster.vm.AppViewModel

@Composable
fun HomeScreen(vm: AppViewModel, onOpen: (String) -> Unit, onBoost: () -> Unit) {
    val perf by vm.perf.collectAsState()
    val device by vm.device.collectAsState()
    val selected by vm.selectedGame.collectAsState()
    val history by vm.history.collectAsState()
    val netDiag by vm.netDiag.collectAsState()
    val dnsResults by vm.dnsResults.collectAsState()
    val boost by vm.boost.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Selected game strip
        NeonCard {
            Row(verticalAlignment = Alignment.CenterVertically) {
                val game = selected
                if (game != null) {
                    AppIcon(pkg = game.pkg, sizeDp = 42)
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text(
                            text = game.label,
                            color = MaterialTheme.colorScheme.onBackground,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                        Text(
                            text = game.pkg,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 10.sp,
                            maxLines = 1
                        )
                    }
                    IconButton(onClick = { vm.selectGame(null) }) {
                        Icon(
                            Icons.Filled.Close,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                } else {
                    Icon(
                        Icons.Filled.PlayArrow,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.select_game_none),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp
                    )
                }
            }
        }

        // RAM card
        NeonCard {
            SectionTitle(stringResource(R.string.ram_title))
            Text(
                text = fmtGB(perf.ramUsedGB) + " / " + fmtGB(perf.ramTotalGB) + " GB",
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 22.sp,
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
        }

        // Quick tiles (2 x 2)
        val best = dnsResults.firstOrNull { it.ms != null }
        val bestServer = best?.let { NetRepo.serverById(it.id) }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatTile(
                icon = Icons.Filled.Memory,
                title = stringResource(R.string.tiles_ram),
                value = perf.ramPct.toString() + "%",
                sub = stringResource(R.string.cores_fmt, perf.cores),
                color = NeonPurple,
                modifier = Modifier.weight(1f),
                onClick = { onOpen("ram") }
            )
            StatTile(
                icon = Icons.Filled.Dns,
                title = stringResource(R.string.tiles_dns),
                value = if (bestServer != null) (best?.ms?.toString() ?: "-") + "ms" else "-",
                sub = bestServer?.name,
                color = NeonCyan,
                modifier = Modifier.weight(1f),
                onClick = { onOpen("dns") }
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatTile(
                icon = Icons.Filled.Wifi,
                title = stringResource(R.string.tiles_network),
                value = netDiag?.quality ?: device.networkType,
                sub = netDiag?.let { it.score.toString() + "/100" },
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f),
                onClick = { onOpen("network") }
            )
            StatTile(
                icon = Icons.Filled.Smartphone,
                title = stringResource(R.string.tiles_device),
                value = device.model,
                sub = "Android " + device.androidVersion,
                color = NeonPurple,
                modifier = Modifier.weight(1f),
                onClick = { onOpen("device") }
            )
        }

        // Temp + CPU
        NeonCard {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Filled.Thermostat,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(Modifier.width(8.dp))
                Column {
                    Text(
                        text = stringResource(R.string.temp_title),
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = perf.tempC?.let {
                            stringResource(R.string.temp_value, fmtGB(it))
                        } ?: stringResource(R.string.temp_na),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp
                    )
                }
                Spacer(Modifier.weight(1f))
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = stringResource(R.string.cpu_title),
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = stringResource(R.string.cores_fmt, perf.cores) +
                            (perf.cpuFreqMhz?.let { " • " + it + "MHz" } ?: ""),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp
                    )
                }
            }
        }

        // BOOST button
        NeonButton(
            text = stringResource(R.string.boost_btn),
            onClick = onBoost,
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            loading = boost is BoostState.Running
        )

        // Last boost
        NeonCard {
            SectionTitle(stringResource(R.string.last_boost))
            val last = history.firstOrNull { it.kind == "boost" }
            if (last == null) {
                EmptyText(stringResource(R.string.no_history))
            } else {
                Text(
                    text = last.summary,
                    color = MaterialTheme.colorScheme.onBackground,
                    fontSize = 12.sp
                )
            }
        }

        // Network mini status
        NeonCard {
            SectionTitle(stringResource(R.string.net_title))
            Text(
                text = netDiag?.let {
                    stringResource(
                        R.string.quality_line,
                        stringResource(qualityRes(it.quality)),
                        it.score
                    )
                } ?: stringResource(R.string.net_checking),
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = stringResource(R.string.net_note),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp
            )
        }
        Spacer(Modifier.height(8.dp))
    }
}

fun qualityRes(quality: String): Int = when (quality) {
    "excellent" -> R.string.quality_excellent
    "good" -> R.string.quality_good
    "fair" -> R.string.quality_fair
    else -> R.string.quality_poor
}
