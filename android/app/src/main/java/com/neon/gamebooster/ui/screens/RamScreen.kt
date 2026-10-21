package com.neon.gamebooster.ui.screens

import android.widget.Toast
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neon.gamebooster.R
import com.neon.gamebooster.ui.components.AppIcon
import com.neon.gamebooster.ui.components.EmptyText
import com.neon.gamebooster.ui.components.Meter
import com.neon.gamebooster.ui.components.NeonButton
import com.neon.gamebooster.ui.components.NeonCard
import com.neon.gamebooster.ui.components.SectionTitle
import com.neon.gamebooster.ui.components.TagChip
import com.neon.gamebooster.ui.components.fmtGB
import com.neon.gamebooster.ui.components.fmtInt
import com.neon.gamebooster.ui.components.ramColor
import com.neon.gamebooster.ui.theme.NeonAmber
import com.neon.gamebooster.ui.theme.NeonGreen
import com.neon.gamebooster.ui.theme.NeonPurple
import com.neon.gamebooster.ui.theme.NeonRed
import com.neon.gamebooster.vm.AppViewModel

@Composable
fun RamScreen(vm: AppViewModel) {
    val ctx = LocalContext.current
    val perf by vm.perf.collectAsState()
    val settings by vm.settings.collectAsState()
    val selected by vm.selectedGame.collectAsState()
    val hogs by vm.hogs.collectAsState()
    val cleanables by vm.cleanables.collectAsState()
    val lastCleanedMB by vm.lastCleanedMB.collectAsState()

    LaunchedEffect(Unit) {
        vm.refreshHogs()
        vm.refreshCleanables()
    }

    var showShaderConfirm by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // ---- Memory status ----
        NeonCard {
            SectionTitle(text = stringResource(R.string.ram_title))
            Text(
                text = fmtGB(perf.ramUsedGB) + " / " + fmtGB(perf.ramTotalGB) + " GB",
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold
            )
            Meter(pct = perf.ramPct / 100f, color = ramColor(perf.ramPct))
            val pressureText = when {
                perf.ramPct < 60 -> stringResource(R.string.pressure_low)
                perf.ramPct < 85 -> stringResource(R.string.pressure_mid)
                else -> stringResource(R.string.pressure_high)
            }
            val pressureColor = when {
                perf.ramPct < 60 -> NeonGreen
                perf.ramPct < 85 -> NeonAmber
                else -> NeonRed
            }
            Text(
                text = pressureText,
                color = pressureColor,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = fmtGB(perf.availGB) + " GB free",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp
            )
        }

        // ---- Pre-launch check ----
        NeonCard {
            SectionTitle(text = stringResource(R.string.precheck_title))
            val game = selected
            if (game == null) {
                EmptyText(stringResource(R.string.precheck_none))
            } else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    AppIcon(pkg = game.pkg, sizeDp = 36)
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text(
                            text = game.label,
                            color = MaterialTheme.colorScheme.onBackground,
                            fontSize = 13.sp,
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
                }
                val memOk = perf.availGB >= 2.5
                Text(
                    text = if (memOk) {
                        stringResource(R.string.precheck_ok, fmtGB(perf.availGB))
                    } else {
                        stringResource(R.string.precheck_low, fmtGB(perf.availGB))
                    },
                    color = if (memOk) NeonGreen else NeonAmber,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // ---- Active background work (own app) ----
        NeonCard {
            SectionTitle(text = stringResource(R.string.hogs_title))
            if (hogs.isEmpty()) {
                EmptyText(stringResource(R.string.hogs_empty))
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    for (hog in hogs) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (hog.own) {
                                Text(
                                    text = stringResource(
                                        if (hog.id == "job_cache") R.string.job_cache
                                        else R.string.job_check
                                    ),
                                    color = MaterialTheme.colorScheme.onBackground,
                                    fontSize = 12.sp,
                                    modifier = Modifier.weight(1f)
                                )
                                TagChip(text = stringResource(R.string.own_app), color = NeonGreen)
                            } else {
                                Icon(
                                    Icons.Filled.Lock,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    text = stringResource(R.string.system_app),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 12.sp,
                                    modifier = Modifier.weight(1f)
                                )
                                TagChip(
                                    text = stringResource(R.string.system_app),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
            NeonButton(
                text = stringResource(R.string.stop_own_btn),
                onClick = {
                    val n = vm.stopOwnJobs()
                    Toast.makeText(
                        ctx,
                        ctx.getString(R.string.stop_own_done_fmt, n),
                        Toast.LENGTH_SHORT
                    ).show()
                    vm.refreshHogs()
                },
                modifier = Modifier.fillMaxWidth()
            )
        }

        // ---- Cleanables (own app only) ----
        NeonCard {
            SectionTitle(text = stringResource(R.string.cleanables_title))
            if (cleanables.isEmpty()) {
                EmptyText(stringResource(R.string.empty_list))
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    for (c in cleanables) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (c.kind == "safe") Icons.Filled.CheckCircle
                                else Icons.Filled.Memory,
                                contentDescription = null,
                                tint = if (c.kind == "safe") NeonGreen else NeonPurple,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = if (c.kind == "safe") stringResource(R.string.hist_cache)
                                else "Shader",
                                color = MaterialTheme.colorScheme.onBackground,
                                fontSize = 12.sp,
                                modifier = Modifier.weight(1f)
                            )
                            Text(
                                text = fmtInt(c.mb) + " MB",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 11.sp
                            )
                            if (c.kind == "shader") {
                                Spacer(Modifier.width(8.dp))
                                if (settings.shaderProtect) {
                                    Icon(
                                        Icons.Filled.Lock,
                                        contentDescription = null,
                                        tint = NeonAmber,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(Modifier.width(4.dp))
                                    TagChip(
                                        text = stringResource(R.string.shader_protected),
                                        color = NeonAmber
                                    )
                                } else {
                                    TagChip(
                                        text = stringResource(R.string.shader_warning),
                                        color = NeonRed
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                NeonButton(
                    text = stringResource(R.string.clean_btn),
                    onClick = { vm.cleanOwnCache(false) },
                    modifier = Modifier.weight(1f)
                )
                Surface(
                    onClick = {
                        if (settings.sensitiveConfirm) {
                            showShaderConfirm = true
                        } else {
                            vm.cleanOwnCache(true)
                        }
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, NeonRed)
                ) {
                    Text(
                        text = "Shader",
                        color = NeonRed,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 14.dp)
                    )
                }
            }

            if (lastCleanedMB > 0) {
                Text(
                    text = stringResource(R.string.last_clean_fmt, fmtInt(lastCleanedMB)),
                    color = MaterialTheme.colorScheme.primary,
                    fontSize = 11.sp
                )
            }
        }

        // ---- No-root policy note ----
        NeonCard {
            Text(
                text = stringResource(R.string.safe_policy),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp
            )
        }

        Spacer(Modifier.height(8.dp))
    }

    if (showShaderConfirm) {
        AlertDialog(
            onDismissRequest = { showShaderConfirm = false },
            title = {
                Text(
                    text = stringResource(R.string.clean_confirm_title),
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = stringResource(R.string.clean_confirm_body),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showShaderConfirm = false
                        vm.cleanOwnCache(true)
                    }
                ) {
                    Text(
                        text = stringResource(R.string.clean_btn),
                        color = NeonRed
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { showShaderConfirm = false }) {
                    Text(
                        text = stringResource(R.string.close),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        )
    }
}
