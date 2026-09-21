<?php
/**
 * Handles error using custom sides
 * @param bool $redirect If was redirected to this page
 * @param int $code HTTP error code
 * @param string|null $message Status message, set to null for none
 * @param string|null $from Overwrite source URL
 * @param string $lang Language of page
 */
function HandleErrorPageLocal(bool $redirect, int $code, string|null $message = null, string|null $from = null, string $lang = "en")
{
    //Check if message not empty
    if($message === "") {
        $message = null;
    }

    //Check if language not emptu
    if($lang === "") {
        $lang = "en";
    }

    //Get JSON databases
    $errors = json_decode(file_get_contents(__DIR__ . "/../JSON/errors_" . $lang . ".json"), true);
    $buttonsLibrary = json_decode(file_get_contents(__DIR__ . "/../JSON/buttons_" . $lang . ".json"), true);

    //Check for empty DB
    if ($errors === null) {
        http_response_code(404);
        echo "Errors database not found.";
        die();
    }

    //Load and fill template
    $template = file_get_contents(__DIR__ . "/../HTML/errorPageTemplate.html");
    $error = $errors["" . $code . ""];

    //Check if error is emptu
    if (!isset($error) || $error === null) {
        //Fill template
        $template = str_replace("[BUTTONS]", "",$template);
        if ($message !== null) {
            $template = str_replace("[STATUS]", $message, $template);
        } else {
            $template = str_replace("[STATUS]", "", $template);
        }
        $template = str_replace("[FROM]", $from === null ? "" : $from, $template);
        $template = str_replace("[LANG]", $lang, $template);
        $template = str_replace("[TITLE]", $code, $template);
        $template = str_replace("[DESC]", "Unknown error", $template);
        if ($message !== null) {
            $template = str_replace("[STATUS]", $message, $template);
        } else {
            $template = str_replace("[STATUS]", "", $template);
        }
        $template = str_replace("[FROM]", $from === null ? "" : $from, $template);

        //Send to browser
        header("Content-Type: text/html");
        echo $template;
        die();
    }

    //Generate buttons
    $buttons = isset($error["buttons"]) ? $error["buttons"] : [];
    if ($redirect === true) {
        $button = [];
        $button["libraryId"] = "retryFrom";
        $buttons[] = $button;
    } else {
        $button = [];
        $button["libraryId"] = "retryReload";
        $buttons[] = $button;
    }

    //Put buttons
    $i = 0;
    $buttonsHTML = "";
    foreach ($buttons as $button) {
        //Check if library
        $libId = isset($button["libraryId"]) ? $button["libraryId"] : "";
        if($libId !== "") {
            $button = $buttonsLibrary[$libId];
            if($button === null) {
                $button = [];
                $button["text"] = "#" . $libId;
            }
        }

        //Create HTML
        if (isset($button["link"]) && $button["link"] !== "") {
            $buttonsHTML .= "<a href='" . $button["link"] . "'>";
        }
        $buttonsHTML .= "<button id='a$i'  class='button'>" . $button["text"] . "</button>";
        if (isset($button["link"]) && $button["link"] !== "") {
            $buttonsHTML .= "</a>";
        }

        //Put JS script action
        if (isset($button["action"]) && $button["action"] !== "") {
            $buttonsHTML .= "<script>";
            $buttonsHTML .= "document.getElementById('a$i').addEventListener('click', async () => {" . $button["action"] . "});";
            $buttonsHTML .= "</script>";
        }
        $i++;
    }

    //Fill template
    $template = str_replace("[BUTTONS]", $buttonsHTML,$template);
    $template = str_replace("[LANG]", $lang, $template);
    $template = str_replace("[TITLE]", $error["title"], $template);
    $template = str_replace("[DESC]", $error["desc"], $template);
    if ($message !== null) {
        $template = str_replace("[STATUS]", $message, $template);
    } else {
        $template = str_replace("[STATUS]", "", $template);
    }
    $template = str_replace("[FROM]", $from === null ? "" : rawurlencode($from), $template);

    //Send to browser
    header("Content-Type: text/html");
    echo $template;
    die();
}

/*
Reserved words - all of these are replaced during parsion:
 - [LANG] = Language code
 - [TITLE] = Title of error
 - [DESC] = Description of error
 - [STATUS] = Status message
 - [FROM] = Source URL of request

Structure of error page JSON - errors_langcode.json -> Example: errors_en.json:
{
    "code": {
        "title": "title = error code - text meaning",
        "desc": "generic description of error",
        "buttons": [ //Optional
            {
                //Variant A = Takes button from library buttons.json
                "libraryId": "abc"
            },
            {
                //Variant B = Define button here
                "text": "text on button",
                "link": "URL", //Optional
                "action": "JS script called on click" //Optional
            }
        ]
    }
}

Structure of button library JSON - buttons_langcode.json -> Example: buttons_en.json:
{
    "id": {
        "text": "text on button",
        "link": "URL", //Optional
        "action": "JS script called on click" //Optional
    }
}
*/
?>
