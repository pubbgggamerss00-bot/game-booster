package com.neon.gamebooster.ui.screens

import android.content.Intent
import android.widget.Toast
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
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
import com.neon.gamebooster.data.AppItem
import com.neon.gamebooster.data.AppsRepo
import com.neon.gamebooster.ui.components.AppIcon
import com.neon.gamebooster.ui.components.EmptyText
import com.neon.gamebooster.ui.components.TagChip
import com.neon.gamebooster.ui.theme.NeonAmber
import com.neon.gamebooster.ui.theme.NeonGreen
import com.neon.gamebooster.vm.AppViewModel

@Composable
fun LibraryScreen(vm: AppViewModel) {
    val ctx = LocalContext.current
    val apps by vm.apps.collectAsState()
    val favorites by vm.favorites.collectAsState()
    val selected by vm.selectedGame.collectAsState()

    var query by rememberSaveable { mutableStateOf("") }
    var favOnly by rememberSaveable { mutableStateOf(false) }

    val favAddedMsg = stringResource(R.string.fav_added)
    val favRemovedMsg = stringResource(R.string.fav_removed)

    val filtered = remember(apps, favorites, query, favOnly) {
        apps.filter { app ->
            val matchesQuery = query.isBlank() ||
                app.label.contains(query, ignoreCase = true) ||
                app.pkg.contains(query, ignoreCase = true)
            val matchesFav = !favOnly || app.pkg in favorites
            matchesQuery && matchesFav
        }
    }

    // NOTE: no verticalScroll on this root — LazyColumn below must not be nested
    // inside a scrollable parent (infinite-height constraint crash).
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 18.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            placeholder = {
                Text(
                    text = stringResource(R.string.search_hint),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 12.sp
                )
            },
            leadingIcon = {
                Icon(
                    Icons.Filled.Search,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(18.dp)
                )
            }
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterTab(
                text = stringResource(R.string.all),
                selected = !favOnly,
                onClick = { favOnly = false },
                modifier = Modifier.weight(1f)
            )
            FilterTab(
                text = stringResource(R.string.favorites),
                selected = favOnly,
                onClick = { favOnly = true },
                modifier = Modifier.weight(1f)
            )
        }

        Text(
            text = stringResource(R.string.pm_note),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 10.sp
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (filtered.isEmpty()) {
                item { EmptyText(stringResource(R.string.empty_list)) }
            }
            items(filtered, key = { it.pkg }) { app ->
                AppRow(
                    item = app,
                    selected = selected?.pkg == app.pkg,
                    fav = app.pkg in favorites,
                    onSelect = { vm.selectGame(app) },
                    onToggleFav = {
                        val willBeFav = app.pkg !in favorites
                        vm.toggleFavorite(app.pkg)
                        Toast.makeText(
                            ctx,
                            if (willBeFav) favAddedMsg else favRemovedMsg,
                            Toast.LENGTH_SHORT
                        ).show()
                    },
                    onLaunch = {
                        val intent = AppsRepo.launchIntent(ctx, app.pkg)
                        if (intent != null) {
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            try {
                                ctx.startActivity(intent)
                            } catch (e: Exception) {
                            }
                        }
                    }
                )
            }
        }
    }
}

@Composable
private fun FilterTab(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = if (selected) MaterialTheme.colorScheme.primaryContainer
        else MaterialTheme.colorScheme.surface,
        border = BorderStroke(
            1.dp,
            if (selected) MaterialTheme.colorScheme.primaryContainer
            else MaterialTheme.colorScheme.outline
        )
    ) {
        Text(
            text = text,
            color = if (selected) MaterialTheme.colorScheme.onPrimaryContainer
            else MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 12.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
        )
    }
}

@Composable
private fun AppRow(
    item: AppItem,
    selected: Boolean,
    fav: Boolean,
    onSelect: () -> Unit,
    onToggleFav: () -> Unit,
    onLaunch: () -> Unit
) {
    Surface(
        onClick = onSelect,
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(
            1.dp,
            if (selected) MaterialTheme.colorScheme.primary
            else MaterialTheme.colorScheme.outline
        )
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AppIcon(pkg = item.pkg, sizeDp = 40)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = item.label,
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        modifier = Modifier.weight(1f)
                    )
                    if (selected) {
                        Icon(
                            Icons.Filled.Check,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(16.dp)
                        )
                    } else if (item.isGame) {
                        TagChip(text = stringResource(R.string.chip_game), color = NeonGreen)
                    }
                }
                Text(
                    text = item.pkg,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 10.sp,
                    maxLines = 1
                )
            }
            IconButton(onClick = onToggleFav) {
                Icon(
                    imageVector = if (fav) Icons.Filled.Star else Icons.Filled.StarBorder,
                    contentDescription = null,
                    tint = if (fav) NeonAmber else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp)
                )
            }
            IconButton(onClick = onLaunch) {
                Icon(
                    imageVector = Icons.Filled.PlayArrow,
                    contentDescription = stringResource(R.string.launch),
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
