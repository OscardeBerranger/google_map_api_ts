"use client";

import { useEffect, useState } from "react";
import { GoogleMap, DirectionsRenderer, Marker } from "@react-google-maps/api";

interface MapProps {
    origin: google.maps.LatLngLiteral | null;
    destination: google.maps.LatLngLiteral | null;
    waypoints: google.maps.DirectionsWaypoint[];
    userPositions: { id: number; message: { lat: number; lng: number } }[];
    sharedRoutes: {
        origin: google.maps.LatLngLiteral;
        destination: google.maps.LatLngLiteral;
        waypoints: google.maps.DirectionsWaypoint[];
    }[];
    onMapLoad: (map: google.maps.Map) => void;
}

const containerStyle = {
    width: "100%",
    height: "500px",
};

// Fonction pour générer une couleur aléatoire pour chaque itinéraire
const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

export function Map({ origin, destination, waypoints, userPositions, sharedRoutes, onMapLoad }: MapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [directionsResponses, setDirectionsResponses] = useState<google.maps.DirectionsResult[]>([]);

    useEffect(() => {
        if (map && sharedRoutes.length > 0) {
            const directionsService = new google.maps.DirectionsService();
            const newResponses: google.maps.DirectionsResult[] = [];

            sharedRoutes.forEach((route, index) => {
                directionsService.route(
                    {
                        origin: route.origin,
                        destination: route.destination,
                        waypoints: route.waypoints,
                        travelMode: google.maps.TravelMode.DRIVING,
                    },
                    (result, status) => {
                        if (status === google.maps.DirectionsStatus.OK && result) {
                            newResponses[index] = result;
                            setDirectionsResponses([...newResponses]); // Met à jour l'état avec les nouvelles routes
                        } else {
                            console.error(`Erreur lors de la récupération de l'itinéraire ${index}:`, status);
                        }
                    }
                );
            });
        }
    }, [map, sharedRoutes]);

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={origin || { lat: 48.8566, lng: 2.3522 }} // Centre par défaut : Paris
            zoom={12}
            onLoad={(map) => {
                setMap(map);
                onMapLoad(map);
            }}
        >
            {/* 🔹 Affichage des itinéraires */}
            {directionsResponses.map((response, index) => (
                <DirectionsRenderer
                    key={index}
                    directions={response}
                    options={{
                        polylineOptions: {
                            strokeColor: getRandomColor(),
                            strokeWeight: 5,
                        },
                    }}
                />
            ))}

            {/* 🔹 Affichage des marqueurs */}
            {origin && <Marker position={origin} label="Départ" />}
            {destination && <Marker position={destination} label="Arrivée" />}

            {sharedRoutes.map((route, index) => (
                <>
                    <Marker key={`start-${index}`} position={route.origin} label={`Départ ${index + 1}`} />
                    <Marker key={`end-${index}`} position={route.destination} label={`Arrivée ${index + 1}`} />
                </>
            ))}

            {/* 🔹 Affichage des positions des utilisateurs */}
            {userPositions.map((user) => (
                <Marker key={user.id} position={user.message} label={`User ${user.id}`} />
            ))}
        </GoogleMap>
    );
}
