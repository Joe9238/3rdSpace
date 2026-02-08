import React from "react";
import { useGeolocated } from "react-geolocated";
import { useState, useEffect } from "react";

function Safehaven(){
    const [location, setLocation] = useState(null);

   const reverseGeoSearch = async (lat, lon)=>{
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        const res = await fetch(url, {
					method: 'GET',
					 'Accept': 'application/json'

				});
        const data = await res.json();

        const city =
        data.address.town ||
        data.address.city ||
        data.address.village ||
        data.address.hamlet;

        const postcode = data.address.postcode.slice(0, 3)
    
       return {city, postcode};   
    }

    //find location
    
    const { coords, isGeolocationAvailable, isGeolocationEnabled } =
    useGeolocated({
      positionOptions: {
        enableHighAccuracy: false,
      },
      userDecisionTimeout: 5000,
    });

  useEffect(() => {
    if (coords) {
      reverseGeoSearch(coords.latitude, coords.longitude).then((loc) => {
        setLocation(loc);
      });
    }
  }, [coords]);
 
     
     if (!isGeolocationAvailable) {
    return <div>Your browser does not support Geolocation</div>;
  }

  if (!isGeolocationEnabled) {
    return <div>Geolocation is not enabled</div>;
  }

  if (!coords) {
    return <div>Getting your location…</div>;
  }

  if (!location) {
    return <div>Finding nearby Safehavens…</div>;
  }

   const safehavenUrl = `https://www.safeplaces.org.uk/search/?query=${location.city}%20${location.postcode},%20UK`;


  return (
    <a href={safehavenUrl} target="_blank" rel="noopener noreferrer">
      Link to nearby Safehavens
    </a>
  );


        

}
export default  Safehaven;