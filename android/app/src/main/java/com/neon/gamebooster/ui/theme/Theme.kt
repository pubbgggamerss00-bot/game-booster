package com.neon.gamebooster.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val NeonGreen = Color(0xFF22C55E)
val NeonPurple = Color(0xFFA855F7)
val NeonCyan = Color(0xFF22D3EE)
val NeonPink = Color(0xFFEC4899)
val NeonAmber = Color(0xFFF59E0B)
val NeonRed = Color(0xFFEF4444)
val BgDark = Color(0xFF070B14)
val SurfaceDark = Color(0xFF0E1526)
val Surface2Dark = Color(0xFF111A2E)
val BorderDark = Color(0xFF1E2A44)
val TextDark = Color(0xFFE6EDF7)
val DimDark = Color(0xFF8A94A8)
val OnGreenDark = Color(0xFF04110A)

val BgLight = Color(0xFFF4F6FB)
val SurfaceLight = Color(0xFFFFFFFF)
val BorderLight = Color(0xFFDCE3F0)
val TextLight = Color(0xFF10192B)
val DimLight = Color(0xFF5A6478)

private val DarkScheme = darkColorScheme(
    primary = NeonGreen,
    onPrimary = OnGreenDark,
    secondary = NeonPurple,
    onSecondary = Color.White,
    tertiary = NeonCyan,
    background = BgDark,
    onBackground = TextDark,
    surface = SurfaceDark,
    onSurface = TextDark,
    surfaceVariant = Surface2Dark,
    onSurfaceVariant = DimDark,
    outline = BorderDark,
    error = NeonRed
)

private val LightScheme = lightColorScheme(
    primary = Color(0xFF15803D),
    onPrimary = Color.White,
    secondary = Color(0xFF7E22CE),
    onSecondary = Color.White,
    tertiary = Color(0xFF0891B2),
    background = BgLight,
    onBackground = TextLight,
    surface = SurfaceLight,
    onSurface = TextLight,
    surfaceVariant = Color(0xFFEDF1F9),
    onSurfaceVariant = DimLight,
    outline = BorderLight,
    error = Color(0xFFDC2626)
)

@Composable
fun GameBoosterTheme(darkTheme: Boolean = true, content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkScheme else LightScheme,
        content = content
    )
}
