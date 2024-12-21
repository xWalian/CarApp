import React from 'react';
import {View, Text, StyleSheet, Animated, ViewStyle} from 'react-native';

interface ProgressBarProps {
  progress: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  borderRadius?: number;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 20,
  backgroundColor = '#e0e0df',
  fillColor = '#76c7c0',
  borderRadius = 10,
  showPercentage = true,
}) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500, // Animacja w ms
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, {height, borderRadius, backgroundColor}]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: progressWidth,
            backgroundColor: fillColor,
            borderRadius,
          },
        ]}
      />
      {showPercentage && (
        <Text style={styles.text}>{Math.round(progress)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  fill: {
    height: '100%',
    position: 'absolute',
  } as ViewStyle,
  text: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#000',
    fontWeight: 'bold',
  },
});

export default ProgressBar;
