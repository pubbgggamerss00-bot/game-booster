package com.neon.gamebooster.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neon.gamebooster.R
import com.neon.gamebooster.data.DnsServer
import com.neon.gamebooster.data.NetRepo
import com.neon.gamebooster.ui.components.NeonButton
import com.neon.gamebooster.ui.components.NeonCard
import com.neon.gamebooster.ui.components.TagChip
import com.neon.gamebooster.ui.theme.NeonCyan
import com.neon.gamebooster.ui.theme.NeonGreen
import com.neon.gamebooster.ui.theme.NeonPurple
import com.neon.gamebooster.ui.theme.NeonRed
import com.neon.gamebooster.vm.AppViewModel

@Composable
fun DnsScreen(vm: AppViewModel) {
    val context = LocalContext.current
    val results by vm.dnsResults.collectAsState()
    val testing by vm.dnsTesting.collectAsState()
    val best = results.firstOrNull { it.ms != null }
    val bestServer = best?.let { NetRepo.serverById(it.id) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Intro
        NeonCard {
            Text(
                text = stringResource(R.string.dns_intro),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp
            )
        }

        // Test all servers
        NeonButton(
            text = stringResource(R.string.test_all),
            onClick = { vm.runDnsTests() },
            modifier = Modifier.fillMaxWidth(),
            loading = testing
        )

        // Best server banner
        if (best != null && bestServer != null) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, NeonGreen)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Filled.Check,
                        contentDescription = null,
                        tint = NeonGreen,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.dns_recommended) + ": " +
                            bestServer.name + " — " +
                            stringResource(R.string.dns_ms_fmt, best.ms ?: 0),
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Server rows
        for (server in NetRepo.DNS_SERVERS) {
            val ms: Int? = results.firstOrNull { it.id == server.id }?.ms
            DnsServerRow(
                server = server,
                ms = ms,
                testing = testing,
                isBest = best?.id == server.id,
                onCopy = {
                    val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    cm.setPrimaryClip(ClipData.newPlainText("dns", server.ip))
                    Toast.makeText(context, R.string.copied, Toast.LENGTH_SHORT).show()
                }
            )
        }

        // Apply hint + privacy note
        NeonCard {
            Text(
                text = stringResource(R.string.dns_apply_hint),
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 11.sp
            )
            Text(
                text = stringResource(R.string.dns_privacy_note),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp
            )
        }
    }
}

@Composable
private fun DnsServerRow(
    server: DnsServer,
    ms: Int?,
    testing: Boolean,
    isBest: Boolean,
    onCopy: () -> Unit
) {
    val isIr = server.region == "ir"
    val accent = if (isIr) NeonGreen else NeonCyan

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(
            1.dp,
            if (isBest) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 12.dp, end = 4.dp, top = 10.dp, bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(accent)
            )
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = server.name,
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                    Spacer(Modifier.width(6.dp))
                    TagChip(
                        text = stringResource(
                            if (isIr) R.string.dns_region_ir else R.string.dns_region_global
                        ),
                        color = accent
                    )
                }
                Spacer(Modifier.height(2.dp))
                Text(
                    text = server.ip,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(Modifier.height(4.dp))
                Row {
                    if (server.doh) {
                        TagChip(text = "DoH", color = NeonPurple)
                    }
                    if (server.doh && server.dot) {
                        Spacer(Modifier.width(4.dp))
                    }
                    if (server.dot) {
                        TagChip(text = "DoT", color = NeonCyan)
                    }
                }
            }
            Spacer(Modifier.width(8.dp))
            when {
                ms != null -> Text(
                    text = stringResource(R.string.dns_ms_fmt, ms),
                    color = if (isBest) NeonGreen else MaterialTheme.colorScheme.onBackground,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                testing -> CircularProgressIndicator(
                    modifier = Modifier.size(14.dp),
                    strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.primary
                )
                else -> Text(
                    text = stringResource(R.string.dns_failed),
                    color = NeonRed,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            IconButton(onClick = onCopy, modifier = Modifier.size(30.dp)) {
                Icon(
                    Icons.Filled.ContentCopy,
                    contentDescription = stringResource(R.string.dns_copy_ip),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(15.dp)
                )
            }
        }
    }
}
