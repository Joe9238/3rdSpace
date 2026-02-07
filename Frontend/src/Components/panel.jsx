import "./Panel.css";




function Panel({isOpen, closePanel, amenities}){
  
  if (!isOpen) return null;




      const ThirdspaceCard = ({ amenity}) => {
        
        const name = amenity.tags.name && amenity.tags ? amenity.tags.name  : "no name";
        const type =amenity.tags && amenity.tags.amenity ? amenity.tags.amenity : (amenity.tags && amenity.tags.leisure ? amenity.tags.leisure : 'Amenity')
         if (!lat || !lon) return null;
        const lat = amenity.lat || (amenity.center && amenity.center.lat)
        const lon = amenity.lon || (amenity.center && amenity.center.lon)  
    

      return(
        <div className="Card-details">

        <strong>{name}</strong>
        <p>{type}</p>
        {lat && lon &&(
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`}>Location</a>
        )}
        </div>
      );
        };

    return(
  
        <dialog className="Panel-container" open>
        <button className="exit" onClick={closePanel}>X</button>
        <div className="Title"> <h1>Amenities Nearby</h1></div>
        <div className="list">
                               {amenities === null && (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>Loading amenities...</p>
                    )}
              {Array.isArray(amenities)&&amenities.length === 0 && (
        <p className="no-data">no third spaces found</p>
      )}   
        {amenities && amenities.map((amenity) =>(
         <ThirdspaceCard key={amenity.idx} amenity={amenity}/>
        ))}
       </div>
       </dialog>
    )
    }
    
 
export default Panel;

