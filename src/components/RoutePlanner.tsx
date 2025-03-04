'use client'

import { useEffect, useState } from "react";

interface RoutePlannerProps {
    origin: google.maps.LatLngLiteral | null;
    destination: google.maps.LatLngLiteral | null;
    waypoints: google.maps.DirectionsWaypoint[];
    map: google.maps.Map | null;
    onDurationUpdate: (duration: string | null) => void;
}

const RoutePlanner = ({ origin, destination, waypoints, map, onDurationUpdate }: RoutePlannerProps) => {
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [renderer, setRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

    useEffect(() => {
        if (!origin || !destination || !map) return;

        if (renderer) {
            renderer.setMap(null);
        }
        const directionsService = new google.maps.DirectionsService();
        const newRenderer = new google.maps.DirectionsRenderer();

        directionsService.route(
            {
                origin,
                destination,
                waypoints,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.WALKING,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                    newRenderer.setDirections(result);
                    newRenderer.setMap(map);
                    setRenderer(newRenderer);
                    const duration = result?.routes[0]?.legs.reduce((acc, leg) => acc + leg.duration?.text + " + ", "").slice(0, -3) || null;
                    onDurationUpdate(duration);
                } else {
                    console.error("Erreur Directions API:", status);
                }
            }
        )

        return () => {
            if (renderer) {
                renderer.setMap(null);
            }
        };
    }, [origin, destination, waypoints, map]);

    return null;
};

export { RoutePlanner };