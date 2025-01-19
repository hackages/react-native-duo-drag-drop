/* eslint-disable react-native/no-inline-styles */
import "react-native-gesture-handler";
import { useRef, useState } from "react";
import { StyleSheet, View, Text, Button, SafeAreaView } from "react-native";
import DuoDragDrop, { Word, Placeholder, Lines } from "@jamsch/react-native-duo-drag-drop";
import type { DuoDragDropRef, DuoAnimatedStyleWorklet } from "@jamsch/react-native-duo-drag-drop";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import { withSpring, withTiming } from "react-native-reanimated";

const customAnimatedStyle: DuoAnimatedStyleWorklet = (style, isGestureActive) => {
  "worklet";
  // Scale the word when the gesture is active
  style.transform.push({
    scale: withTiming(isGestureActive ? 1.5 : 1, { duration: 200 }),
  });
  style.opacity = withTiming(isGestureActive ? 0.8 : 1, { duration: 200 });
  style.top = withTiming(isGestureActive ? -10 : 0, { duration: 200 });

  // Apply a spring when the word moves to it's destination
  if (!isGestureActive) {
    style.transform[0].translateX = withSpring(style.transform[0].translateX);
    style.transform[1].translateY = withSpring(style.transform[1].translateY);
  }

  return style;
};

export default function App() {
  const duoDragDropRef = useRef<DuoDragDropRef>(null);
  const words = ["Juan", "She", "apples", "today", "with", "eats", "her", "another"];

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <View style={{ 
              backgroundColor: 'white', 
              borderColor: 'lightblue',
              borderWidth: 1,
              padding: 15, 
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              width: '90%',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'black' }}>
                What does IT stand for?
              </Text>
            </View>
          </View>
          <View style={styles.dragDropContainer}>
            <DuoDragDrop
              ref={duoDragDropRef}
              words={words}
              wordHeight={40}
              lineHeight={49}
              wordGap={4}
              gesturesDisabled={false}
              rtl={false}
              wordBankOffsetY={10}
              wordBankAlignment="center"
              animatedStyleWorklet={customAnimatedStyle}
              onDrop={(ev) => {
                const { destination, index, position } = ev;
                console.log(destination, index, position);
              }}
              renderWord={(_word, index) => (
                <Word
                  containerStyle={{
                    backgroundColor: "white",
                    borderColor: "lightblue",
                  }}
                  textStyle={{
                    color: "black",
                  }}
                />
              )}
              renderPlaceholder={({ style }) => <Placeholder style={[style, { borderRadius: 5 }]} />}
              renderLines={(props) => (
                <Lines
                  {...props}
                  containerStyle={{ backgroundColor: "transparent" }}
                  lineStyle={{ borderColor: "#CCC" }}
                />
              )}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragDropContainer: {
    margin: 20,
    flex: 1,
  },
  debugLogText: {
    fontWeight: "500",
  },
  logContainer: {
    height: 130,
    padding: 5,
  },
});
