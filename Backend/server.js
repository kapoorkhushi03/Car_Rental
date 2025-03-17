const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');


dotenv.config();



const app = require('./app');
const { initializeSocket } = require('./socket'); // Import the socket initialization

const PORT = process.env.PORT || 5524;
// Allow requests from your frontend
app.use(cors({
    origin: 'https://car-rental-pa1x.vercel.app', // Change this to match your frontend URL
    credentials: true
}));

const server = http.createServer(app);

// Call initializeSocket to attach socket.io to the server
initializeSocket(server);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
