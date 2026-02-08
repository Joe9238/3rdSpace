import "./Panel.css";




function Panel({isOpen, closePanel, amenities}){
  
  if (!isOpen) return null;




      const ThirdspaceCard = ({ amenity}) => {

        function getAccessibility(){
           const tags = amenity?.tags || {};

         return{
            wheelchair: tags.wheelchair || "unknown",
            ramp: tags.ramp || "unknown",
            smoothness: tags.smoothness || "unknown",
            surface: tags.surface || "unknown",
         }


        }


        const name = amenity.tags.name && amenity.tags ? amenity.tags.name  : "no name";
        const tags = amenity.tags || {};

            const type =
            tags.amenity ||
            tags.leisure ||
            tags.shop ||
            tags.natural ||
            tags.landuse ||
            (tags.boundary === "protected_area" && tags.protect_class === "2"
                ? "national_park"
                : null) ||
            tags.boundary ||
            "Amenity";
         
        const lat = amenity.lat || (amenity.center && amenity.center.lat)
        const lon = amenity.lon || (amenity.center && amenity.center.lon)  
        if (!lat || !lon) return null;
        const acc = getAccessibility();

      return(
        <div className="Card-details">

        <strong>{name}</strong>
        <p>{type}</p>
        <p>Accessibility</p>
        <ui>
            <li>Wheelchair friendly: {acc.wheelchair}</li>
            <li>Ramp: {acc.ramp}</li>
            <li>Smoothness: {acc.smoothness}</li>
            <li>Surface: {acc.surface}</li>
        </ui>
        
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
        {amenities && amenities
        .filter(amenity => amenity.tags?.name)
        .map((amenity) =>(
         <ThirdspaceCard key={amenity.idx} amenity={amenity}/>
        ))}
       </div>
       </dialog>
    )
    }
    
 
export default Panel;

