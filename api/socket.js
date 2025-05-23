import { Server } from "socket.io";

export default function handler(req, res) {
    if (req.method === 'GET') {
        const io = new Server(res.socket.server);
        io.on('connection', (socket) => {
            console.log('A player connected');
            
            socket.on('shoot', (data) => {
                socket.broadcast.emit('shoot', data); // Emit to other player
            });

            socket.on('disconnect', () => {
                console.log('Player disconnected');
            });
        });
        res.socket.server.io = io;
        res.end();
    }
}
