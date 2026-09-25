class TranslationData {
  /**
   * Creates new TranslationData
   * @param {string} langFileURL URL of language file on server
   */
  constructor(langFileURL) {
    /** @type {string}  */
    this.langFileURL = langFileURL;
    this.languageData = null;
    this.loaded = false;
  }

  /**
   * Loads language data from API
   */
  async Load() {
    //Get root URL
    const urlObj = new URL(this.langFileURL, document.location);
    const cleanPath = urlObj.pathname + urlObj.search + urlObj.hash;

    //Send request
    const [ok, resp] = await SendGetAPIAndHandleErrors("/assets/languageManager.php?file=" + encodeURIComponent(cleanPath));
    if (!ok) {
      this.loaded = true;
      return;
    }

    //Handle errors
    document.documentElement.lang = resp["lang"];
    if (resp["code"] != 200) {
      console.warn("Failed to load language data: " + resp["message"]);
      this.loaded = true;
      return;
    }

    //Set data
    this.languageData = resp["data"];
    this.loaded = true;
  }

  /**
   * Translates key to value in that language
   * @param {string} key Key to be translated
   * @param {string} fallback Fallback value can be provided
   * @returns {Promise<string>} Translated value
   */
  async Translate(key, fallback = "") {
    //Create Promise
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        //Check if ready
        if (!this.loaded) {
          return;
        }
        clearInterval(interval);

        //Check if data is present
        if (this.languageData === null) {
          if (fallback === "") {
            resolve("#" + key);
            return
          }
          resolve(fallback);
          return
        }

        //Check if key is present
        if (this.languageData[key] == null || this.languageData[key] == "") {
          if (fallback === "") {
            resolve("#" + key);
            return
          }
          resolve(fallback);
          return
        }

        //Translate
        resolve(this.languageData[key]);
      }, 100);
    });
  }

  /**
   * Translates all elements in document with data-i18n attribute
   */
  async TranslateDocument() {
    //Get all elements to translate
    const elements = document.querySelectorAll("[data-i18n]");
    for (const element of elements) {
      //Translate
      element.textContent = await this.Translate(element.getAttribute("data-i18n"), element.textContent);
    }
  }

  /**
   * Get current language
   * @returns {Promise<string>} Language
   */
  async GetLanguage() {
    //Create Promise
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        //Check if ready
        if (!this.loaded) {
          return;
        }
        clearInterval(interval);

        //Resolve
        resolve(document.documentElement.lang);
      }, 100);
    });
  }

  /**
   * Get current language with region (en-US)
   * @returns {Promise<string>} Language with region
   */
  async GetRegionLanguage() {
    //Create Promise
    return new Promise(async (resolve, reject) => {
      let lang = await this.GetLanguage();
      if (lang == "en") {
        resolve(lang + "-US");
        return;
      }
      resolve(lang);
    });
  }
}

/**
 * Changes language to new one
 * @param {string} language New language
 */
async function ChangeLanguage(language) {
  await SendPostAPIAndHandleErrors("/assets/languageManager.php", { language: language });
  window.location.reload();
}

/**
 * Tries to automaticTranslate on load
 */
function automaticTranslate() {
  //Get meta url element
  const urlMeta = document.querySelector("meta[name='data-i18n-url']");
  if (urlMeta === null) {
    console.log("Skipping automaticTranslate - no data-i18n-url meta tag found.");
    return;
  }

  //Get meta language switch element
  const languagesMeta = document.querySelector("meta[name='data-i18n-languages']");
  if (languagesMeta === null) {
    console.log("Skipping automaticTranslate - no data-i18n-languages meta tag found. Should contain language list: en;fi;es;...");
    return;
  }

  //Translate
  const translationData = new TranslationData(urlMeta.getAttribute("content"));
  translationData.Load().then(async () => {
    await translationData.TranslateDocument();

    //Register switch buttons
    const languages = languagesMeta.getAttribute("content").split(";");
    for (const element of document.getElementsByClassName("language-switch")) {
      //Get next language
      const indexOfNextLang = languages.indexOf(document.documentElement.lang) + 1;
      let lang = "";
      if (indexOfNextLang >= languages.length) {
        lang = languages[0];
      } else {
        lang = languages[indexOfNextLang];
      }

      //Change event
      element.textContent = lang.toUpperCase();
      element.addEventListener("click", () => {
        ChangeLanguage(lang);
      });
    }
  });
  window.translationData = translationData;
}

//Automatic object detection
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Element node
        if(node.hasAttribute("data-i18n")) {
          node.textContent = window.GetTranslationData().Translate(node.getAttribute("data-i18n"), node.textContent)
        }
      }
    });
  });
});
observer.observe(document.body, { childList: true, subtree: true });
automaticTranslate();

/**
 * Get translation data
 * @returns {TranslationData} Translation data
 */
function GetTranslationData() {
  return window.translationData;
}
