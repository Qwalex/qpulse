import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import type { MarketCapChartPoint } from '@qpulse/shared';
import { radii, spacing } from '@/constants/theme';

const CHART_HEIGHT = 88;

interface MarketCapChartProps {
  points: MarketCapChartPoint[];
  lineColor: string;
  fillColor: string;
}

function buildAreaPath(
  values: number[],
  width: number,
  height: number,
  paddingY: number,
): { line: string; area: string } {
  if (values.length < 2 || width <= 0) {
    return { line: '', area: '' };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerHeight = height - paddingY * 2;

  const coords = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = paddingY + innerHeight - ((value - min) / range) * innerHeight;
    return { x, y };
  });

  const line = coords
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const last = coords[coords.length - 1];
  const first = coords[0];
  const area = `${line} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;

  return { line, area };
}

export function MarketCapChart({ points, lineColor, fillColor }: MarketCapChartProps) {
  const [width, setWidth] = useState(0);

  const values = useMemo(() => points.map((point) => point.valueUsd), [points]);

  const paths = useMemo(
    () => buildAreaPath(values, width, CHART_HEIGHT, 6),
    [values, width],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  if (points.length < 2) {
    return null;
  }

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {width > 0 && paths.area ? (
        <Svg width={width} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="capGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={fillColor} stopOpacity="0.45" />
              <Stop offset="100%" stopColor={fillColor} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          <Path d={paths.area} fill="url(#capGradient)" />
          <Path
            d={paths.line}
            fill="none"
            stroke={lineColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: CHART_HEIGHT,
    marginTop: spacing.sm,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
});
