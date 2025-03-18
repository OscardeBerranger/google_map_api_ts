'use client'
import {io} from "socket.io-client"
import {useState} from "react";

const socket  = io("ws://localhost:8080");

export default function page() {
    const [info, setInfo] = useState("connecting...");
    const [message, setMessage] = useState("");

    socket.on("message", (message) => {
        setMessage("message received from " + message.id);
    })

    function sendMessage() {
        socket.emit("message", JSON.stringify("i'm here"));
    }
    return (
        <div>
            <h1>WebSocket Client</h1>
            <p>{ info }</p>
            <p> { message } </p>
            <button onClick={sendMessage} >Send data package</button>
        </div>
    );
}
