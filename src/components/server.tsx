"use client";


import {io} from "socket.io-client";
import {useState} from "react";
import {Marker} from "@react-google-maps/api";
import {type} from "node:os";

interface serverProps {
    coordinates: google.maps.LatLng;
}

type messageCoordinates = {
    lat: number;
    lng: number;
}

type userLocation = {
    id: number;
    message: messageCoordinates;
}

const socket  = io("ws://localhost:8080");

socket.on('connect', () => {
    console.log("Connected");
})


function handleSocketAction(coordinates) {
    socket.emit("message", JSON.stringify(coordinates));
}



const server = ({coordinates}: serverProps) => {
    const [displayButton, setDisplayButton] = useState(false);
    const [message, setMessage] = useState("Connecting ...");
    const [usersInformations, setUsersInformations] = useState<userLocation[]>([]);
    function handleClick(){
        handleSocketAction(coordinates);
    }



    socket.on("message", (msg) => {
        if(msg.id !== socket.id) {
            setUsersInformations((prevUser)=>{
                const filtered = prevUser.filter(
                    (user)=>user.id !== msg.id
                )
                let desMsg = JSON.parse(msg.message);
                console.log({id: msg.id, message: {lat: desMsg.lat, lng: desMsg.lng}})
                return [...filtered, {id: msg.id, message: {lat: desMsg.lat, lng: desMsg.lng}}]
            });
        }
    })
    return (
        <div>
            <p>{message}</p>
                <button onClick={() => handleClick()} >Submit</button>

            {
                Object.values(usersInformations).map((user) => (
                    <div key={user.id}>
                        <Marker
                            key={user.id}
                            position={{lat: user.message.lat, lng: user.message.lng}}
                        />
                        <p>For user : {user.id}</p>
                        <p>{user.message.lat} : {user.message.lng} </p>
                    </div>

                ))
            }
        </div>

    );
};

export default server;
