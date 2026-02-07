import "./Panel.css";
import { Link} from "react-router-dom";




function Panel({isOpen, closePanel, amenities}){
  
  if (!isOpen) return null;



      const ThirdspaceCard = ({ amenity}) => (
  <Link to={``} className="spacecard">
    <div className="details">
      <strong>{amenity.name || "no name"}</strong>
      <p>{amenity.location || "no location"}</p>
      <p>{amenity.description || "no description"}</p>
      
    
    </div>
  </Link>
);

    return(

    
        <dialog className="Panel-container" open>
        <button className="exit" onClick={closePanel}>X</button>
        <div className="Title"> <h1>Location</h1></div>
        <div className="list">
              {amenities.length === 0 && (
        <p className="no-data">no third spaces found</p>
      )}   
        {amenities.map((amenity) =>(
         <ThirdspaceCard key={amenity.id} amenity={amenity}/>
        ))}
       </div>
       </dialog>
    )
    }
    
 
export default Panel;

