import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';


const PORT=process.env.PORT||5000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});


const rooms={};

const __dirname=path.resolve();

io.on('connection',(socket)=>{
    console.log('New client Connected')

    socket.on('joinRoom',({roomId,userId}) =>{
        socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId}`)

        if(rooms[roomId]){
            socket.emit('initialData',rooms[roomId]);

        }else{
            rooms[roomId] =[]
        }
    })
    socket.on('draw' ,(data)=>{
        const{roomId} =data;
        if(rooms[roomId]){
            rooms[roomId].push(data);
        }else{
            rooms[roomId]=[data]
        }
        socket.to(roomId).emit('draw',data)
    })
    
    socket.on('undoCanvas', (roomId) => {
  if (rooms[roomId] && rooms[roomId].length > 0) {
    console.log(`Undo request in room ${roomId}`);
    rooms[roomId].pop(); // Remove the last stroke
    io.to(roomId).emit('initialData', rooms[roomId]); // Re-render updated data
  }
});

    socket.on('clearCanvas',(roomId)=>{
        if(rooms[roomId]){
            rooms[roomId]=[];
        }
        socket.to(roomId).emit('clearCanvas')

    })

    socket.on('toolChange',({roomId,tool,value}) =>{
        socket.to(roomId).emit('toolChange',{tool,value})
    })

    socket.on('disconnect',()=>{
    console.log('Client Disconnected')
})
})

app.use(express.static(path.join(__dirname, 'app', 'dist')));

app.get('/*splat', (_, res) => {
  res.sendFile(path.resolve(__dirname, 'app', 'dist', 'index.html'));
});


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
