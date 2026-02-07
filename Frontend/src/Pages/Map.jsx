import Searchbar from "../Components/Searchbar";
import Panel from "../Components/panel";
import { useState } from "react";
function Map() {

    const [isOpen, setIsOpen] = useState(true);
    const [amenities, setAmenities] = useState([]);



    return(

       <div className="Map-container">
        <Searchbar />

        <Panel 
        isOpen={isOpen} 
        closePanel={() => setIsOpen(false)}
        amenities ={amenities}
        />
      </div>
    )
}
export default Map;

