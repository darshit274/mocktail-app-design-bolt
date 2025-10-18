const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure resolver to exclude native-only modules on web
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Platform-specific aliasing - only for web platform
config.resolver.alias = {
  ...config.resolver.alias,
};

// Add resolver with platform-specific handling
const originalResolverRequest = config.resolver.resolverMainFields;
config.resolver.resolveRequest = (context, realModuleName, platform) => {
  // Replace react-native-pdf with web fallback on web platform
  if (realModuleName === 'react-native-pdf' && platform === 'web') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'src/utils/pdf-web-fallback.js'),
    };
  }

  // Use default resolver for everything else
  return context.resolveRequest(context, realModuleName, platform);
};

// Configure source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Enable tree-shaking for better optimization
config.resolver.unstable_enablePackageExports = true;

// Production optimizations for minification and tree-shaking
config.transformer = {
  ...config.transformer,
  minifierPath: require.resolve('metro-minify-terser'),
  minifierConfig: {
    compress: {
      // Remove console logs in production
      drop_console: process.env.NODE_ENV === 'production',
      // Remove debugger statements
      drop_debugger: true,
      // Remove unused code
      dead_code: true,
      // Optimize boolean expressions
      booleans: true,
      // Evaluate constant expressions
      evaluate: true,
      // Inline functions
      inline: 2,
      // Remove unreachable code
      passes: 3,
      // Better tree-shaking
      unused: true,
      side_effects: true,
    },
    mangle: {
      // Mangle variable names for smaller output
      toplevel: process.env.NODE_ENV === 'production',
      // Better variable name compression
      safari10: true,
    },
    output: {
      // Remove comments
      comments: false,
      // Use ASCII-only output
      ascii_only: true,
      // Smaller output
      beautify: false,
    },
  },
  // Enable experimental tree-shaking
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: true,
      inlineRequires: true,
    },
  }),
};

module.exports = config;