"use client";

import { useState, useEffect } from "react";
import { MapProvider } from "@/providers/MapProvider";
import { Map } from "@/components/Map";
import { SearchBox } from "@/components/SearchBox";
import { RoutePlanner } from "@/components/RoutePlanner";
import Server from "@/components/server";
import {Marker} from "@react-google-maps/api";
import {io} from "socket.io-client";
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
    if(coordinates){
        if (coordinates.lat !== undefined || null ) {
            if (coordinates.lng !== undefined || null){
                socket.emit("message", JSON.stringify(coordinates));
                console.log("Coordinates sent")

            }else {
                console.log("Checkup failed");
                console.log(coordinates);
            }
        }
        else {
            console.log("Checkup failed");
            console.log(coordinates);
        }
    }
}

export default function Home() {
    const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(null);
    const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
    const [destinationKey, setDestinationKey] = useState<number>(0);
    const [waypointsInputs, setWaypointsInputs] = useState<{ id: number; location: google.maps.LatLngLiteral | null }[]>([]);
    const [showRoute, setShowRoute] = useState(false);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [userAddress, setUserAddress] = useState<string>("Chargement...");
    const [travelTime, setTravelTime] = useState<string | null>(null);
    const [displayButton, setDisplayButton] = useState(false);
    const [message, setMessage] = useState("Connecting ...");
    const [usersInformations, setUsersInformations] = useState<userLocation[]>([]);

    function handleClick(){
        handleSocketAction(origin);
        console.log("Handler triggered")
    }

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setOrigin(userLocation);


            // Obtenir l'adresse de la position actuelle
            fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${userLocation.lng}&lat=${userLocation.lat}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.features.length > 0) {
                        setUserAddress(data.features[0].properties.label);
                    }
                });
            console.log("Sending coordinates")

            setInterval(handleClick, 5000)

        });
    }, []);

    // Ajouter une nouvelle étape intermédiaire
    const addWaypoint = () => {
        setWaypointsInputs([...waypointsInputs, { id: Date.now(), location: null }]);
        setShowRoute(false);
    };

    // Mettre à jour un waypoint lorsqu'une adresse est sélectionnée
    const updateWaypoint = (id: number, location: google.maps.LatLngLiteral | null) => {
        setWaypointsInputs((prevWaypoints) =>
            prevWaypoints.map((waypoint) =>
                waypoint.id === id ? { ...waypoint, location } : waypoint
            )
        );
        setShowRoute(false);
    };

    // Réinitialiser tous les champs et la carte
    const resetRoute = () => {
        setDestination(null);
        setDestinationKey((prevKey) => prevKey + 1); // 🔹 Change la clé de destination pour reset l'input
        setWaypointsInputs([]);
        setShowRoute(false);
        setTravelTime(null);
    };

    socket.on("message", (msg) => {
        console.log("Coordinates received")
        if(msg.id !== socket.id) {
            let desMsg = JSON.parse(msg.message);

            if (desMsg.lat !== undefined || null ) {
                if (desMsg.lng !== undefined || null){
                    console.log(desMsg)
                    setUsersInformations((prevUser)=>{
                        const filtered = prevUser.filter(
                            (user)=>user.id !== msg.id
                        )
                        //console.log({id: msg.id, message: {lat: desMsg.lat, lng: desMsg.lng}})
                        console.log([...filtered, {id: msg.id, message: {lat: desMsg.lat, lng: desMsg.lng}}])

                        return [...filtered, {id: msg.id, message: {lat: desMsg.lat, lng: desMsg.lng}}]
                    });
                }else {
                    console.log("Checkup failed");
                    console.log(desMsg);
                }

            }else {
                console.log("Checkup failed");
                console.log(desMsg);
            }

        }
    })
    return (
        <div>
            <MapProvider>

                <div className="flex flex-col items-center gap-4 p-4">
                    <p className="font-bold">Départ : {userAddress}</p>

                    <SearchBox key={destinationKey} onSelect={(location) => setDestination(location)} />

                    {/* Inputs pour les étapes intermédiaires */}
                    {waypointsInputs.map((waypoint, index) => (
                        <SearchBox
                            key={waypoint.id}
                            onSelect={(location) => updateWaypoint(waypoint.id, location)}
                        />
                    ))}

                    <div className="flex gap-4">
                        {/* Bouton pour ajouter une nouvelle étape */}
                        <button
                            className="p-2 bg-green-500 text-white rounded"
                            onClick={addWaypoint}
                        >
                            Ajouter une étape
                        </button>

                        {/* Bouton pour afficher l'itinéraire */}
                        <button
                            className="p-2 bg-blue-500 text-white rounded"
                            onClick={() => setShowRoute(true)}
                            disabled={!destination}
                        >
                            Afficher l'itinéraire
                        </button>

                        {/* Bouton pour réinitialiser */}
                        <button
                            className="p-2 bg-red-500 text-white rounded"
                            onClick={resetRoute}
                        >
                            Réinitialiser
                        </button>
                    </div>

                    {travelTime && <p className="text-lg font-semibold mt-2">Temps estimé : {travelTime}</p>}

                    <Map
                        origin={origin}
                        destination={destination}
                        waypoints={waypointsInputs.map(w => w.location).filter(Boolean) as google.maps.DirectionsWaypoint[]}
                        userPositions={usersInformations}
                        onMapLoad={setMap}
                    />

                    {showRoute && (
                        <RoutePlanner
                            origin={origin}
                            destination={destination}
                            waypoints={waypointsInputs
                                .map((w) => (w.location ? { location: w.location, stopover: true } : null))
                                .filter(Boolean) as google.maps.DirectionsWaypoint[]}
                            map={map}
                            onDurationUpdate={setTravelTime}
                        />
                    )}
                </div>
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
            </MapProvider>
        </div>

);
}