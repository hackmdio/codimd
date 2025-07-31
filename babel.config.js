module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: '14'
      },
      useBuiltIns: 'usage',
      corejs: 3
    }]
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {
      corejs: 3
    }],
    '@babel/plugin-transform-nullish-coalescing-operator'
  ]
}
