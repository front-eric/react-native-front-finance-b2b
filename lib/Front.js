import React, { useCallback, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { FrontApi } from "@front-finance/api";

export function FrontFinance(props) {
  const isDarkMode = useColorScheme() === "dark";

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const [iframeLink, setIframeLink] = useState(null);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [showWebView, setShowWebView] = useState(false);

  const getAuthLink = useCallback(async () => {
    setError(null);
    setIframeLink(null);
    const api = new FrontApi({
      baseURL: "https://sandbox-integration-api.getfront.com",
      headers: {
        "x-client-id": props.client_id,
        "x-client-secret": props.client_secret,
      },
      // headers: {
      //   "x-client-id": "f9723cdc-349a-4009-9d50-09e8fbc4a37c", // insert your client id here
      //   "x-client-secret":
      //     "sk_sand_2twb11hv.l02pueziydqs97b6105jslhh8rhkvzmc8s28fxovrkeklmue3vbzldh618mn9hys", // do not use your clientSecret on the FE
      // },
    });
    setShowWebView(true);

    // this request should be performed from the backend side
    const response = await api.managedAccountAuthentication.v1CataloglinkList({
      // userId: "7652B44F-9CDB-4519-AC82-4FA5500F7455", // insert your unique user identifier here
      // callbackUrl: window.location.href // insert your callback URL here
      userId: props.userId,
    });

    const data = response.data;
    // console.log("Reponse =>", response.data)
    if (response.status !== 200 || !data?.content) {
      const error = data?.message || response.statusText;
      console.error("Error!", error);
      setError(error);
    } else if (!data.content.url) {
      setError("Iframe url is empty");
    } else {
      setIframeLink(data.content.url);
    }
  }, []);

  const handleNavState = (event) => {
    console.log("Nav", event);
  };

  const handleMessage = (event) => {
    const { type, payload } = JSON.parse(event.nativeEvent.data);
    if (
      type === "close" ||
      type === "done" ||
      type === "delayedAuthentication"
    ) {
      setShowWebView(false);
    }
    if (type === "brokerageAccountAccessToken") {
      setPayload(payload);
      props.onReceive(payload);
      setShowWebView(false);
    }
  };

  const INJECTED_JAVASCRIPT = `
    window.addEventListener('message', (event) => {
      if (event?.data?.type === 'brokerageAccountAccessToken') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: event.data.type,
          payload: event.data.payload
        }))
      }
      if (event?.data?.type === 'delayedAuthentication') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: event.data.type,
          payload: event.data.payload
        }))
      }
      if (event?.data?.type === 'close') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: event.data.type,
        }))
      }
      if (event?.type === 'done') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: event.data.type,
        }))
      }
    })
  `;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <View style={styles.container}>
        {!showWebView && (
          <>
            {payload ? (
              <View>
                <Text>
                  <Text style={{ fontWeight: "bold" }}>Broker:</Text>{" "}
                  {payload?.brokerName}
                  {"\n"}
                  <Text style={{ fontWeight: "bold" }}>Token:</Text>{" "}
                  {payload?.accountTokens[0].accessToken}
                  {"\n"}
                  <Text style={{ fontWeight: "bold" }}>
                    Refresh Token:
                  </Text>{" "}
                  {payload?.accountTokens[0].refreshToken}
                  {"\n"}
                  <Text style={{ fontWeight: "bold" }}>
                    Token expires in seconds:
                  </Text>{" "}
                  {payload?.expiresInSeconds}
                  {"\n"}
                  <Text style={{ fontWeight: "bold" }}>ID:</Text>{" "}
                  {payload?.accountTokens[0].account.accountId}
                  {"\n"}
                  <Text style={{ fontWeight: "bold" }}>Name:</Text>{" "}
                  {payload?.accountTokens[0].account.accountName}
                  {"\n"}
                  <Text style={{ fontWeight: "bold" }}>Cash:</Text> $
                  {payload?.accountTokens[0].account.cash}
                  {"\n"}
                </Text>
              </View>
            ) : (
              <Text style={styles.noText}>
                No accounts connected recently! Please press the button below to
                use Front and authenticate
              </Text>
            )}

            {error && <Text style={{ color: "red" }}>Error: {error}</Text>}

            <View style={{ width: "100%", alignItems: "center" }}>
              <TouchableOpacity style={styles.button} onPress={getAuthLink}>
                <Text style={styles.btnText}>Front Broker Connection</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {showWebView && iframeLink && (
          <WebView
            source={{ uri: iframeLink ? iframeLink : "" }}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            injectedJavaScript={INJECTED_JAVASCRIPT}
            onNavigationStateChange={handleNavState}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  webView: {
    backgroundColor: "red",
    flex: 1,
    position: "absolute",
  },
  noText: {
    fontSize: 20,
  },
  button: {
    marginTop: 50,
    padding: 10,
    backgroundColor: "black",
  },
  btnText: {
    fontSize: 15,
    color: "white",
  },
});
