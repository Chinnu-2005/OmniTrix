const os = require('os');

function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (interface.family === 'IPv4' && !interface.internal) {
                console.log(`Your local IP address is: ${interface.address}`);
                console.log(`\nTo enable cross-device chat, update your frontend/.env file:`);
                console.log(`VITE_API_BASE_URL=http://${interface.address}:3000/api/v1`);
                console.log(`VITE_SOCKET_URL=http://${interface.address}:3000`);
                return interface.address;
            }
        }
    }
    
    console.log('Could not find local IP address');
    return null;
}

getLocalIPAddress();