package com.neon.gamebooster.ui.screens

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neon.gamebooster.R
import com.neon.gamebooster.ui.components.EmptyText
import com.neon.gamebooster.ui.components.Meter
import com.neon.gamebooster.ui.components.NeonButton
import com.neon.gamebooster.ui.components.NeonCard
import com.neon.gamebooster.ui.components.StatTile
import com.neon.gamebooster.ui.components.fmtGB
import com.neon.gamebooster.ui.theme.NeonAmber
import com.neon.gamebooster.ui.theme.NeonCyan
import com.neon.gamebooster.ui.theme.NeonGreen
import com.neon.gamebooster.ui.theme.NeonPurple
import com.neon.gamebooster.ui.theme.NeonRed
import com.neon.gamebooster.vm.AppViewModel

@Composable
fun NetworkScreen(vm: AppViewModel) {
    val diag by vm.netDiag.collectAsState()
    val running by vm.netRunning.collectAsState()
    val device by vm.device.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Run test
        NeonButton(
            text = stringResource(R.string.run_test),
            onClick = { vm.runNetDiag() },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            loading = running
        )

        val d = diag
        if (d == null) {
            NeonCard {
                EmptyText(
                    text = stringResource(R.string.net_checking),
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }
        } else {
            val ping = d.pingAvg ?: 0.0
            val jitter = d.jitter ?: 0.0
            val loss = d.lossPct ?: 0.0
            val dnsMs = d.dnsMs ?: 0L
            val qualityColor = when (d.quality) {
                "excellent", "good" -> MaterialTheme.colorScheme.primary
                "fair" -> NeonAmber
                else -> NeonRed
            }
            val pingColor = when {
                ping < 60 -> NeonGreen
                ping < 120 -> NeonAmber
                else -> NeonRed
            }
            val jitterColor = if (jitter > 15) NeonAmber else NeonGreen
            val lossColor = if (loss > 0) NeonRed else NeonGreen

            // Results: 4 stat tiles
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatTile(
                    icon = Icons.Filled.Speed,
                    title = stringResource(R.string.ping_fmt, fmtGB(ping, 0)),
                    value = fmtGB(ping, 0),
                    color = pingColor,
                    modifier = Modifier.weight(1f)
                )
                StatTile(
                    icon = Icons.Filled.Wifi,
                    title = stringResource(R.string.jitter_fmt, fmtGB(jitter, 0)),
                    value = fmtGB(jitter, 0),
                    color = jitterColor,
                    modifier = Modifier.weight(1f)
                )
                StatTile(
                    icon = Icons.Filled.Warning,
                    title = stringResource(R.string.loss_fmt, fmtGB(loss, 0)),
                    value = fmtGB(loss, 0),
                    color = lossColor,
                    modifier = Modifier.weight(1f)
                )
                StatTile(
                    icon = Icons.Filled.Dns,
                    title = stringResource(R.string.dns_probe_fmt, dnsMs.toString()),
                    value = dnsMs.toString(),
                    color = NeonCyan,
                    modifier = Modifier.weight(1f)
                )
            }

            // Quality
            NeonCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = stringResource(qualityRes(d.quality)),
                        color = qualityColor,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = stringResource(R.string.score_fmt, d.score),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp
                    )
                }
                Meter(pct = d.score / 100f, color = qualityColor)
            }

            // Connection
            NeonCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Filled.Wifi,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.conn_type),
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.weight(1f))
                    Text(
                        text = device.networkType,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Text(
                    text = stringResource(R.string.test_note),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 9.sp
                )
            }

            // Suggestions
            if (ping > 90) {
                CalloutCard(color = NeonAmber, text = stringResource(R.string.suggest_ping))
            }
            if (jitter > 15) {
                CalloutCard(color = NeonAmber, text = stringResource(R.string.suggest_jitter))
            }
            if (loss > 0) {
                CalloutCard(color = NeonRed, text = stringResource(R.string.suggest_loss))
            }
            CalloutCard(color = NeonPurple, text = stringResource(R.string.suggest_dns)) {
                NeonButton(
                    text = stringResource(R.string.tiles_dns),
                    onClick = { vm.runDnsTests() },
                    container = NeonPurple,
                    contentColor = Color.White
                )
            }
            if (ping <= 90 && jitter <= 15 && loss <= 0) {
                CalloutCard(color = NeonGreen, text = stringResource(R.string.all_good))
            }
        }
    }
}

@Composable
private fun CalloutCard(
    color: Color,
    text: String,
    trailing: (@Composable () -> Unit)? = null
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = color.copy(alpha = 0.12f),
        border = BorderStroke(1.dp, color.copy(alpha = 0.45f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = text,
                color = color,
                fontSize = 11.sp,
                modifier = Modifier.weight(1f)
            )
            if (trailing != null) {
                Spacer(Modifier.width(8.dp))
                trailing()
            }
        }
    }
}
