export default interface routeData {
    origin: google.maps.LatLngLiteral;
    destination: google.maps.LatLngLiteral;
    waypoints: google.maps.DirectionsWaypoint[];
}