package com.lynxai.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();

        // Allow camera/video to autoplay without user gesture (fixes black/play-button camera)
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);

        // Wrap the existing WebChromeClient to add permission granting
        // WITHOUT losing Capacitor's built-in file chooser support
        final WebChromeClient originalClient = (WebChromeClient) webView.getTag();
        final WebChromeClient existingClient;

        // Get Capacitor's existing client by storing a reference before overriding
        // We need to use a different approach - override only onPermissionRequest
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Auto-grant camera/microphone permissions to WebView
                runOnUiThread(() -> request.grant(request.getResources()));
            }

            // Delegate file chooser to Capacitor's handler so "Choose Photo" works
            @Override
            public boolean onShowFileChooser(
                    WebView webView,
                    android.webkit.ValueCallback<android.net.Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {
                // Let Capacitor's bridge handle file selection
                return getBridge().getWebChromeClient().onShowFileChooser(
                        webView, filePathCallback, fileChooserParams);
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Handle Google Sign-In result
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN &&
            requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {

            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("GoogleAuth", "SocialLogin plugin handle is null");
                return;
            }

            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("GoogleAuth", "Plugin instance is not SocialLoginPlugin");
                return;
            }

            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }
}
