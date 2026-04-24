/**
 * Simple tunnel script using localtunnel
 * Creates a public URL for the backend server
 */
const localtunnel = require('localtunnel');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 5000 });
    console.log(`\n🌐 Public URL: ${tunnel.url}`);
    console.log(`\n📋 Update your server/.env BASE_URL to: ${tunnel.url}\n`);
    console.log('Press Ctrl+C to close the tunnel.\n');

    tunnel.on('close', () => {
      console.log('Tunnel closed');
      process.exit(0);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });
  } catch (error) {
    console.error('Failed to start tunnel:', error.message);
    process.exit(1);
  }
})();
