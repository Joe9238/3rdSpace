function Dashboard(){

    return(
    <div id="mySidenav" class="sidenav">
    <form onSubmit={handleSubmit}>
      <p>Select your :</p>
      <label>
        <input 
          type="radio" 
          name="fruit" 
          value="park" 
          checked={selectedFruit === 'apple'} 
          onChange={handleChange} 
        /> Apple
      </label>
      <br />
      <label>
        <input 
          type="radio" 
          name="fruit" 
          value="cafe" 
          checked={selectedFruit === 'cafe'} 
          onChange={handleChange} 
        /> Banana
      </label>
      <br />
      <label>
        <input 
          type="radio" 
          name="fruit" 
          value="library" 
          checked={selectedFruit === 'cherry'} 
          onChange={handleChange} 
        /> Cherry
      </label>
      <br />
      <button type="submit">Submit</button>
    </form>
    </div>
    )
}