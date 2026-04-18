import { Colors } from '@/theme';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';

const DisplayHtml = ({ maxHeight = 120, ...props }) => {
  const { width } = useWindowDimensions();

  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const showReadMore = contentHeight > maxHeight;

  return (
    <View style={{ marginTop: 10 }}>
      {/* Visible content */}
      <View
        style={{
          maxHeight: expanded ? undefined : maxHeight,
          overflow: 'hidden',
        }}
      >
        <RenderHTML
          contentWidth={width}
          enableCSSInlineProcessing={true}
          {...props}
          tagsStyles={{
            ...baseHtmlTagStyles,
            // ...getDynamicHtmlStyles(),
            ...props?.tagsStyles,
          }}
        />
      </View>

      {/* Hidden full-height content for measurement */}
      <View
        style={{
          position: 'absolute',
          opacity: 0,
          zIndex: -1,
          width: '100%',
        }}
        pointerEvents="none"
        onLayout={(e) => {
          const height = e.nativeEvent.layout.height;
          if (height !== contentHeight) {
            setContentHeight(height);
          }
        }}
      >
        <RenderHTML
          contentWidth={width}
          enableCSSInlineProcessing={true}
          {...props}
        />
      </View>

      {showReadMore && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={{ color: '#007BFF', marginTop: 6 }}>
            {expanded ? 'Read less' : 'Read more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default DisplayHtml;
const baseHtmlTagStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    // color: Colors.textPrimary,
  },

  /* Paragraph */
  p: {
    marginBottom: 8,
    // color: Colors.textPrimary,
  },

  /* Headings */
  h1: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  h2: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  h3: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  h4: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  h5: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  h6: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },

  /* Text emphasis */
  strong: { fontWeight: 'bold' },
  b: { fontWeight: 'bold' },
  em: { fontStyle: 'italic' },
  i: { fontStyle: 'italic' },
  u: { textDecorationLine: 'underline' },
  ins: { textDecorationLine: 'underline' },
  s: { textDecorationLine: 'line-through' },
  del: { textDecorationLine: 'line-through' },
  strike: { textDecorationLine: 'line-through' },
  mark: { backgroundColor: '#FFFF00', color: '#000000' },
  sub: { fontSize: 10, lineHeight: 14 },
  sup: { fontSize: 10, lineHeight: 14 },
  small: { fontSize: 12 },

  /* Links */
  a: {
    color: '#007BFF',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },

  /* Lists */
  ul: { marginLeft: 16 },
  ol: { marginLeft: 16 },
  li: { marginBottom: 4 },

  /* Line break */
  br: {
    height: 8,
  },

  /* Images */
  img: {
    maxWidth: '100%',
    height: 'auto',
  },

  /* Blockquote */
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#DDD',
    paddingLeft: 12,
    color: '#666',
    marginVertical: 8,
    fontStyle: 'italic',
  },

  /* Horizontal rule */
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginVertical: 12,
  },

  /* Code */
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 4,
    borderRadius: 4,
  },

  pre: {
    fontFamily: 'monospace',
    backgroundColor: '#F4F4F4',
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
  },

};
