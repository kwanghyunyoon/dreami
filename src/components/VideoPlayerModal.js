import React from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';

// YouTube blocks plain WebView loads and shows "Video player configuration error".
// Fix: serve a full HTML page with a proper <iframe> and a browser user-agent
// so YouTube's embed player initialises correctly.
function buildHtml(videoId) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; width: 100vw; height: 100vh; overflow: hidden; }
    iframe {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <iframe
    src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</body>
</html>`.trim();
}

// Spoof a real mobile Safari UA so YouTube serves the embed without complaint.
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

/**
 * Full-screen in-app YouTube player.
 *
 * Props:
 *   visible  {boolean}   – show/hide the modal
 *   videoId  {string}    – YouTube video ID
 *   title    {string}    – displayed in the header
 *   type     {string}    – sub-label (e.g. "수면 명상")
 *   onClose  {function}  – called when the user taps ✕
 */
export default function VideoPlayerModal({ visible, videoId, title, type, onClose }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {type ? <Text style={styles.type}>{type}</Text> : null}
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── Video (16 : 9) ──────────────────────────────────────────────── */}
        <View style={styles.videoWrapper}>
          {videoId ? (
            <WebView
              // Render a full HTML doc — YouTube rejects bare embed URLs in WebView
              source={{ html: buildHtml(videoId) }}
              style={styles.webview}
              // Spoof a real browser so YouTube's embed player initialises
              userAgent={MOBILE_UA}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loader}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            />
          ) : (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>

        {/* ── Tip ─────────────────────────────────────────────────────────── */}
        <View style={styles.tip}>
          <Ionicons name="headset-outline" size={16} color={colors.subtext} />
          <Text style={styles.tipText}>
            {'  '}헤드폰을 착용하면 더 깊은 몰입감을 느낄 수 있어요.
          </Text>
        </View>

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  type: {
    ...typography.caption,
    marginTop: 2,
    color: colors.primary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },

  // 16:9 video area
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  tipText: {
    ...typography.caption,
    flex: 1,
    lineHeight: 20,
  },
});
