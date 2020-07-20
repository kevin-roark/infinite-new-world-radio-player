const { CloudinaryAdapter } = require('@keystonejs/file-adapters');

const cloudinary = new CloudinaryAdapter({
  cloudName: 'inw-test',
  apiKey: '378186341972476',
  apiSecret: '7_WvboxwTp1N9ZzKZRMS9ldC4sQ',
  folder: 'inw-test-site',
});

module.exports = { cloudinary }
