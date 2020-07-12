module.exports = {
  presets: [
    [
      '@babel/env',
      {
        modules: false,
      },
    ],
    '@babel/react',
  ],
  plugins: ['@babel/plugin-proposal-class-properties', 'react-node-key/babel'],
}
