"use client";

import { useEffect, useRef } from "react";

interface SearchBoxProps {
    onSelect: (location: google.maps.LatLngLiteral) => void;
}

const SearchBox = ({ onSelect }: SearchBoxProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, { types: ["geocode"] });

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                onSelect({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                });
            }
        });
    }, []);

    return <input ref={inputRef} type="text" placeholder="Saisissez une adresse d'arrivée" className="w-full p-2 border rounded text-black" />;
};

export { SearchBox };