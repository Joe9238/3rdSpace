import { useState } from "react";

function Searchbar(){
    const [value, setValue] = useState('');

    const handleSearch = async () =>{

        try{
            //data to filter
        }catch(err){}


    }

    return(
    <div classname= "search-container">
        <input
        type="text"
        placeholder="Search"
        classname="serachbox"
        value={value}
        onChange={(e) =>
            setValue = e.target.value
        }
        />
        <button onClick={handleSearch}>Search</button>
    </div>
    )
}



export default Searchbar;