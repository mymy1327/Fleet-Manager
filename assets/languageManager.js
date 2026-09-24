class TranslationData {
  /**
   * Creates new TranslationData
   * @param {string} langFileURL URL of language file on server
   */
  constructor(langFileURL) {
    /** @type {string}  */
    this.langFileURL = langFileURL;
    this.languageData = null;
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
      return;
    }

    //Handle errors
    document.documentElement.lang = resp["lang"];
    if (resp["code"] != 200) {
      console.warn("Failed to load language data: " + resp["message"]);
      return;
    }

    //Set data
    this.languageData = resp["data"];
  }

  /**
   * Translates key to value in that language
   * @param {string} key Key to be translated
   * @param {string} fallback Fallback value can be provided
   * @returns {string} Translated value
   */
  Translate(key, fallback = "") {
    //Check if data is present
    if (this.languageData === null) {
      if (fallback === "") {
        return "#" + key;
      }
      return fallback;
    }

    //Check if key is present
    if (this.languageData[key] === null) {
      if (fallback === "") {
        return "#" + key;
      }
      return fallback;
    }

    //Translate
    return this.languageData[key];
  }

  /**
   * Translates all elements in document with data-i18n attribute
   */
  TranslateDocument() {
    //Get all elements to translate
    const elements = document.querySelectorAll("[data-i18n]");
    for (const element of elements) {
      //Translate
      element.textContent = this.Translate(element.getAttribute("data-i18n"), element.textContent);
    }
  }
}

/**
 * Changes language to new one
 * @param {string} language New language
 */
async function ChangeLanguage(language) {
  await SendPostAPIAndHandleErrors("/assets/languageManager.php", { "language": language });
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
  translationData.Load().then(() => {
    translationData.TranslateDocument();

    //Register switch buttons
    const languages = languagesMeta.getAttribute("content").split(";")
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
        ChangeLanguage(lang)
      })
    }
  });
  window.translationData = translationData;
}
automaticTranslate();
