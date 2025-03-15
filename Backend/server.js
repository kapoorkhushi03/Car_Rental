
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { initializeSocket } = require('./socket'); // Import the socket initialization

const PORT = process.env.PORT || 5524;

const server = http.createServer(app);

// Call initializeSocket to attach socket.io to the server
initializeSocket(server);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
