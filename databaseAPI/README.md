code to access api:

```js

const xhr = new XMLHttpRequest();
xhr.open("POST", "./getVehicleDetails.php", true); //add path to requested file
xhr.setRequestHeader("Content-Type", "application/json");
xhr.onload = () => {console.log(xhr.responseText)};
xhr.send(JSON.stringify(data)); //data is a list send to requested file
```