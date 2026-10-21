package com.neon.gamebooster.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.neon.gamebooster.R
import com.neon.gamebooster.vm.AppViewModel

@Composable
fun NetworkScreen(vm: AppViewModel) {
    Column(Modifier.fillMaxSize().padding(18.dp)) {
        Text(stringResource(R.string.net_screen_title), color = MaterialTheme.colorScheme.onBackground)
    }
}
