/**
 * Sends PATCH request to API for selected column
 * @param {string} url URL path at API
 * @param {string} column Target column name
 * @param {string} idColumn Name of id column
 * @param {string} id ID
 * @returns {Promise<true|string>} Returns true on success or string as error message
 */
async function SendPatchOfColumn(url, column, idColumn, id) {
  //Create promise
  return new Promise((resolve, reject) => {
    //Create PATCH JSON
    const data = {};
    data[column] = document.getElementById(column).value;
    data[idColumn] = id;
    data.column = column;

    //Send request
    const xhr = new XMLHttpRequest();
    xhr.open("PATCH", url, true); //add path to requested file
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      //Handle request data
      if (xhr.status == 200 || xhr.status == 201) {
        resolve(true);
      } else {
        resolve(xhr.status + "|" + xhr.responceText);
      }
    };
    xhr.send(JSON.stringify(data));
  });
}

/**
 * Sends PATCH request to API for selected columns
 * @param {string} url URL path at API
 * @param {string[]} columns Target columns name
 * @param {string} idColumn Name of id column
 * @param {string} id ID
 * @param {boolean} changeCheck If send values that only changed from original
 * @returns {Promise<boolean|string>} Returns true on success, false on no changes or string as error message
 */
async function SendPatchOfColumns(url, columns, idColumn, id, changeCheck = false) {
  //Create promise
  return new Promise(async (resolve, reject) => {
    //Process every column
    let changes = false;
    for (const column of columns) {
      //Validate change
      if (changeCheck) {
        if (document.getElementById(column).value == document.getElementById(column).originalValue) {
          continue;
        }
      }

      //Send PATCH
      changes = true;
      const result = await SendPatchOfColumn(url, column, idColumn, id);
      if (result !== true) {
        resolve(result);
        break;
      }
    }
    resolve(changes);
  });
}

/**
 * Sends POST request to API for selected columns
 * @param {string} url URL path at API
 * @param {string[]} columns Target columns name
 * @returns {Promise<true|string>} Returns true on success, false on no changes or string as error message
 */
async function SendPostOfColumns(url, columns) {
  //Create promise
  return new Promise(async (resolve, reject) => {
    //Process every column
    const data = {};
    for (const column of columns) {
      data[column] = document.getElementById(column).value;
    }

    //Send using XHR
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true); //add path to requested file
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      //Handle request data
      if (xhr.status == 200 || xhr.status == 201) {
        resolve(true);
      } else {
        resolve(xhr.status + "|" + xhr.responseText);
      }
    };
    xhr.send(JSON.stringify(data));
  });
}

/**
 * Sends GET request to API for selected columns
 * @param {string} url URL path at API
 * @param {string[]} columns Target columns name
 * @param {string} id ID
 * @returns {Promise<true|string>} Returns true on success or string as error message
 */
async function SendGetOfColums(url, columns, id) {
  //Create promise
  return new Promise(async (resolve, reject) => {
    //Disable UI
    for (const column of columns) {
      document.getElementById(column).disabled = true;
    }

    //Load item from API
    const itemResponce = await fetch(url + "/" + encodeURIComponent(id));
    if (!itemResponce.ok) {
      resolve(itemResponce.status + "|" + await itemResponce.text());
      return
    }

    //Get item and put values to input
    const item = JSON.parse(await itemResponce.text());
    for (const column of columns) {
      document.getElementById(column).value = item[column];
       document.getElementById(column).originalValue = item[column];
      document.getElementById(column).disabled = false;
    }
    resolve(true);
  })
}

/**
 * Sends GET request to API for selected columns and redirects to error page on error
 * @param {string} url URL path at API
 * @param {string[]} columns Target columns name
 * @param {idParamName} id Name of parameter for ID
 * @returns {Promise<boolean|string>} Returns id on success, false on error, true on not loading because no id is present
 */
async function SendGetOfColumsAndHandleErrors(url, columns, idParamName) {
  //Create promise
  return new Promise(async (resolve, reject) => {
    //Check if can load
    const params = new URLSearchParams(window.location.search);
    if (!params.has(idParamName)) {
      resolve(true);
      return
    }

    //Send request
    const responce = await SendGetOfColums(url, columns, params.get(idParamName));
    if (responce !== true) {
      const split = responce.split("|", 2)
      window.location.href = ("/errorPages/PHP/handleError.php?code=" + split[0] + "&message=" + encodeURIComponent(split[1]) + "&from=" + encodeURIComponent(window.location.href));
      resolve(false);
      return
    }
    resolve(params.get(idParamName));
  })
}

/**
 * Enable and disable targets based on changes in sources
 * @param {string[]} columns Source elements to be checked
 * @param {string[]} targets Target elements to be disabled (no change) and enabled (change), prefix with ! to invert
 */
function SetupListenForChanges(columns, targets) {
  //Function for checking
  const changeCheck = () => {
    for (const column of columns) {
      if (document.getElementById(column).value != document.getElementById(column).originalValue) {
        return true;
      }
    }
    return false;
  };

  //Function for setting disabled
  const updateStatus = () => {
    const disable = !changeCheck();
    for (const target of targets) {
      //Check if negate logic
      const negate = target.startsWith("!");
      if (negate) {
        target = target.substring(1);
      }

      //Apply to element
      document.getElementById(target).disabled = negate ? !disable : disable;
    }
  };

  //Add event listeners
  for (const column of columns) {
    document.getElementById(column).addEventListener("input", () => {
      updateStatus();
    });
  }
  updateStatus();
}
