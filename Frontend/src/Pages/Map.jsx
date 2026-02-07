import Searchbar from "../Components/Searchbar";
import Panel from "../Components/panel";
import { useState } from "react";
import MapCard from "../Components/Map";
function Map() {

    const [isOpen, setIsOpen] = useState(true);
    const [amenities, setAmenities] = useState([]);



    return(

       <div className="Map-container">
        <Searchbar />

        <MapCard/>

        <Panel 
        isOpen={isOpen} 
        closePanel={() => setIsOpen(false)}
        amenities ={amenities}
        />
      </div>
    )
}
export default Map;

