"use client";

import { useState, useEffect } from "react";
import { MapProvider } from "@/providers/MapProvider";
import { Map } from "@/components/Map";
import { SearchBox } from "@/components/SearchBox";
import { RoutePlanner } from "@/components/RoutePlanner";
import { Marker } from "@react-google-maps/api";
import { io } from "socket.io-client";

interface UserLocation {
    id: number;
    message: { lat: number; lng: number };
}

interface RouteData {
    socketId: string;
    origin: google.maps.LatLngLiteral;
    destination: google.maps.LatLngLiteral;
    waypoints: google.maps.DirectionsWaypoint[];
}

const socket = io("https://websocket-server.oscadeberranger.com");

socket.on("connect", () => {
    console.log("Connected to WebSocket");
});

export default function Home() {
    const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(null);
    const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
    const [waypointsInputs, setWaypointsInputs] = useState<{ id: number; location: google.maps.LatLngLiteral | null }[]>([]);
    const [showRoute, setShowRoute] = useState(false);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [userAddress, setUserAddress] = useState<string>("Chargement...");
    const [travelTime, setTravelTime] = useState<string | null>(null);
    const [sharedRoutes, setSharedRoutes] = useState<RouteData[]>([]);
    const [usersInformations, setUsersInformations] = useState<UserLocation[]>([]);

    useEffect(() => {
        refreshCurrentCoordinates();
    }, []);

    async function refreshCurrentCoordinates() {
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                setOrigin(userLocation);
                resolve(userLocation);

                fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${userLocation.lng}&lat=${userLocation.lat}`)
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.features.length > 0) {
                            setUserAddress(data.features[0].properties.label);
                        }
                    });
            });
        });
    }

    function shareRoute() {
        if (origin && destination) {
            const routeData = {
                socketId: socket.id,
                origin,
                destination,
                waypoints: waypointsInputs.map(w => w.location).filter(Boolean) as google.maps.DirectionsWaypoint[],
            };

            socket.emit("route", JSON.stringify(routeData));
            console.log("Route shared:", routeData);
        }
    }

    useEffect(() => {
        socket.on("route", (msg) => {
            console.log("Route received:", msg);
            const receivedRoute: RouteData = JSON.parse(msg.route);

            if (receivedRoute && receivedRoute.socketId !== socket.id) {
                setSharedRoutes((prevRoutes) => {
                    const routeExists = prevRoutes.some(route => route.socketId === receivedRoute.socketId);
                    if (!routeExists) {
                        return [...prevRoutes, receivedRoute];
                    }
                    return prevRoutes;
                });
            }
        });

        return () => {
            socket.off("route");
        };
    }, []);

    return (
        <div>
            <MapProvider>
                <div className="flex flex-col items-center gap-4 p-4">
                    <p className="font-bold">Départ : {userAddress}</p>

                    <SearchBox onSelect={(location) => setDestination(location)} />

                    <div className="flex gap-4">
                        <button className="p-2 bg-blue-500 text-white rounded" onClick={() => setShowRoute(true)} disabled={!destination}>
                            Afficher l'itinéraire
                        </button>
                        <button className="p-2 bg-red-500 text-white rounded" onClick={() => setDestination(null)}>
                            Réinitialiser
                        </button>
                    </div>

                    {travelTime && <p className="text-lg font-semibold mt-2">Temps estimé : {travelTime}</p>}

                    <Map
                        origin={origin}
                        destination={destination}
                        waypoints={waypointsInputs.map(w => w.location).filter(Boolean) as google.maps.DirectionsWaypoint[]}
                        userPositions={usersInformations}
                        sharedRoutes={sharedRoutes}
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

                <button onClick={() => setShowRoute(!showRoute)}>Afficher l'itinéraire : {showRoute.toString()}</button>

                <div className="flex flex-col items-center mt-4">
                    <button className="p-2 bg-green-500 text-white rounded" onClick={shareRoute}>
                        Partager l'itinéraire
                    </button>
                </div>

                {usersInformations.map((user) => (
                    <div key={user.id}>
                        <Marker position={{ lat: user.message.lat, lng: user.message.lng }} />
                        <p>Utilisateur {user.id}</p>
                        <p>{user.message.lat} : {user.message.lng}</p>
                    </div>
                ))}

                {/* Affichage des itinéraires partagés avec une clé unique */}
                <div>
                    {sharedRoutes.map((route) => (
                        <div key={`${route.socketId}-${route.origin.lat}-${route.origin.lng}`}>
                            <p>Route de {route.socketId}</p>
                            <p>Départ: {route.origin.lat}, {route.origin.lng}</p>
                            <p>Arrivée: {route.destination.lat}, {route.destination.lng}</p>
                        </div>
                    ))}
                </div>
            </MapProvider>
        </div>
    );
}
