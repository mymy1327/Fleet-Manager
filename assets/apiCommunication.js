/**
 * Simple logic for processsing API error messages
 * @param {string} responceText Incomming responce text
 * @returns {string} Result message
 */
function parseApiErrorMessage(responceText) {
  try {
    const resp = JSON.parse(responceText);
    if (resp) {
      return resp["message"];
    } else {
      return responceText;
    }
  } catch {
    return responceText
  }
}

/**
 * Sends PATCH request to API for selected columns
 * @param {string} url URL path at API
 * @param {string[]} columns Target columns name
 * @param {string} id ID
 * @param {boolean} changeCheck If send values that only changed from original
 * @returns {Promise<boolean|string>} Returns true on success, false on no changes or string as error message
 */
async function SendPatchOfColumns(url, columns, id, changeCheck = false) {
  //Create promise
  return new Promise(async (resolve, reject) => {
    //Process every column
    let changes = false;
    const data = {};
    for (const column of columns) {
      //Validate change
      if (changeCheck) {
        if (document.getElementById(column).value == document.getElementById(column).originalValue) {
          continue;
        }
      }

      //Create PATCH JSON
      changes = true;
      data[column] = document.getElementById(column).value;
    }
    if(changes) {
      //Send request
      const xhr = new XMLHttpRequest();
      xhr.open("PATCH", url + "/" + id, true); //add path to requested file
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {
        //Handle request data
        if (xhr.status == 200 || xhr.status == 201) {
          resolve(true);
        } else {
          resolve(xhr.status + "|" + parseApiErrorMessage(xhr.responceText));
        }
      };
      xhr.send(JSON.stringify(data));
    }
    resolve(changes);
  });
}

/**
 * Sends POST request to API
 * @param {string} url URL path at API
 * @param {any} data JSON object data to be send
 * @param {string} method Method to be requested
 * @returns {Promise<[true|string,any]>} Returns true on success or string as error message and value got from API
 */
async function SendRequestAPI(url, data, method) {
  //Create promise
  return new Promise(async (resolve, reject) => {
    //Send using XHR
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true); //add path to requested file
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      //Handle request data
      if (xhr.status == 200 || xhr.status == 201) {
        resolve([true,JSON.parse(xhr.responseText)]);
      } else {
        resolve([xhr.status + "|" + parseApiErrorMessage(xhr.responceText),null]);
      }
    };
    xhr.send(JSON.stringify(data));
  });
}

/**
 * Sends POST request to API
 * @param {string} url URL path at API
 * @param {any} data JSON object data to be send
 * @param {string} method Method to be requested
 * @returns {Promise<[boolean,any]>} Returns true on success or false on error and value got from API
 */
async function SendRequestAPIAndHandleErrors(url, data, method) {
  //Create promise
  return new Promise(async (resolve, reject) => {
    //Send GET
    const [resp, dataResp] = await SendRequestAPI(url,data,method)
    if (resp !== true) {
      const split = responce.split("|", 2)
      window.location.href = ("/errorPages/PHP/handleError.php?code=" + split[0] + "&message=" + encodeURIComponent(split[1]) + "&from=" + encodeURIComponent(window.location.href));
      resolve([false,null]);
      return
    }

    //Get JSON
    resolve([true,dataResp]);
  })
}

/**
 * Sends POST request to API
 * @param {string} url URL path at API
 * @param {any} data JSON object data to be send
 * @returns {Promise<[boolean,any]>} Returns true on success or string as error message and value got from API
 */
async function SendPostAPI(url, data) {
  return SendRequestAPI(url, data, "POST")
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

    //Send POST
    const [resp, _] = await SendPostAPI(url, data);
    resolve(resp);
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
    const [resp, item] = await SendGetAPI(url + "/" + encodeURIComponent(id));
    if (resp !== true) {
      resolve(resp);
      return
    }

    //Get item and put values to input
    for (const column of columns) {
      document.getElementById(column).value = item[column];
      document.getElementById(column).originalValue = item[column];
      document.getElementById(column).disabled = false;
    }
    resolve(true);
  })
}

/**
 * Sends GET request to API
 * @param {string} url URL path at API
 * @returns {Promise<[true|string,any]>} Returns true on success or string as error message and value got from API
 */
async function SendGetAPI(url) {
  return SendRequestAPI(url, null, "GET")
}

/**
 * Sends GET request to API
 * @param {string} url URL path at API
 * @returns {Promise<[boolean,any]>} Returns true on success or false on error and value got from API
 */
async function SendGetAPIAndHandleErrors(url) {
  return SendRequestAPIAndHandleErrors(url, null, "GET")
}

/**
 * Sends POST request to API
 * @param {string} url URL path at API
 * @param {any} data JSON object data to be send
 * @returns {Promise<[boolean,any]>} Returns true on success or string as error message and value got from API
 */
async function SendPostAPIAndHandleErrors(url,data) {
  return SendRequestAPIAndHandleErrors(url, data, "POST")
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
    for (let target of targets) {
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

/**
 * Gets currently logged in user
 * @returns {Promise<null|number>} User ID
 */
async function GetLoggedInUserID() {
  //Create promise
  return new Promise(async (resolve, reject) => {
    //Send API request
    const [ok, id] = await SendGetAPIAndHandleErrors("/userManagement/PHP/login.php?getUserId");
    if (!ok) {
      resolve(null);
    }
    resolve(id.id);
  });
}
