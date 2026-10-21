package com.neon.gamebooster.ui.screens

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neon.gamebooster.R
import com.neon.gamebooster.ui.components.NeonCard
import com.neon.gamebooster.ui.components.SectionTitle
import com.neon.gamebooster.ui.components.fmtGB
import com.neon.gamebooster.ui.theme.NeonGreen
import com.neon.gamebooster.ui.theme.NeonPurple
import com.neon.gamebooster.vm.AppViewModel

@Composable
fun DeviceScreen(vm: AppViewModel) {
    val device = vm.device.collectAsState().value

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Spec card
        NeonCard {
            DeviceSpecRow(
                label = stringResource(R.string.model_label),
                value = device.model
            )
            DeviceSpecRow(
                label = stringResource(R.string.android_label),
                value = "Android " + device.androidVersion
            )
            DeviceSpecRow(
                label = stringResource(R.string.sdk_label),
                value = device.sdkInt.toString()
            )
            DeviceSpecRow(
                label = stringResource(R.string.cores_label),
                value = stringResource(R.string.cores_fmt, device.cores)
            )
            DeviceSpecRow(
                label = stringResource(R.string.ram_label),
                value = fmtGB(device.ramGB) + " GB"
            )
            DeviceSpecRow(
                label = stringResource(R.string.screen_label),
                value = device.screen,
                mono = true
            )
            DeviceSpecRow(
                label = stringResource(R.string.battery_label),
                value = (device.batteryLevel?.let { it.toString() + "%" }
                    ?: stringResource(R.string.battery_na)) +
                    (if (device.charging) " • " + stringResource(R.string.charging_label) else "")
            )
            DeviceSpecRow(
                label = stringResource(R.string.network_label),
                value = device.networkType,
                mono = true
            )
        }

        // Status cards
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Surface(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        Icons.Filled.Verified,
                        contentDescription = null,
                        tint = NeonGreen,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = stringResource(R.string.root_status),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 10.sp
                    )
                    Text(
                        text = stringResource(R.string.root_ok),
                        color = NeonGreen,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            Surface(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        Icons.Filled.Shield,
                        contentDescription = null,
                        tint = NeonPurple,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = stringResource(R.string.privacy_ok),
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Compatibility
        NeonCard {
            SectionTitle(stringResource(R.string.compat_title))
            Text(
                text = stringResource(R.string.compat_body),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp
            )
        }
    }
}

@Composable
private fun DeviceSpecRow(label: String, value: String, mono: Boolean = false) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 11.sp,
            modifier = Modifier.weight(1f)
        )
        Spacer(Modifier.width(8.dp))
        Text(
            text = value,
            color = MaterialTheme.colorScheme.onBackground,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = if (mono) FontFamily.Monospace else null,
            textAlign = TextAlign.End
        )
    }
}
