/*
 * QR Code generator output demo (TypeScript)
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/qr-code-generator-library
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */
"use strict";
var app;
(function (app) {
    let outputElem = document.getElementById("output");
    // The main application program.
    function main() {
        while (outputElem.firstChild !== null)
            outputElem.removeChild(outputElem.firstChild);
        doBasicDemo();
        doVarietyDemo();
        doSegmentDemo();
        doMaskDemo();
    }
    // Creates a single QR Code, then appends it to the document.
    function doBasicDemo() {
        appendHeading("Basic");
        const text = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // User-supplied Unicode text
        const errCorLvl = qrcodegen.QrCode.Ecc.LOW; // Error correction level
        const qr = qrcodegen.QrCode.encodeText(text, errCorLvl); // Make the QR Code symbol
        drawCanvas(qr, 10, 4, "#FFFFFF", "#000000", appendCanvas("")); // Draw it on screen
    }
    // Creates a variety of QR Codes that exercise different features of the library, and appends each one to the document.
    
    function appendHeading(text) {
        let h2 = outputElem.appendChild(document.createElement("h2"));
        h2.textContent = text;
    }
    function appendCanvas(caption) {
        let p = outputElem.appendChild(document.createElement("p"));
        p.textContent = caption + "";
        let result = document.createElement("canvas");
        outputElem.appendChild(result);
        return result;
    }
    // Draws the given QR Code, with the given module scale and border modules, onto the given HTML
    // canvas element. The canvas's width and height is resized to (qr.size + border * 2) * scale.
    // The drawn image is purely dark and light, and fully opaque.
    // The scale must be a positive integer and the border must be a non-negative integer.
    function drawCanvas(qr, scale, border, lightColor, darkColor, canvas) {
        if (scale <= 0 || border < 0)
            throw new RangeError("Value out of range");
        const width = (qr.size + border * 2) * scale;
        canvas.width = width;
        canvas.height = width;
        let ctx = canvas.getContext("2d");
        for (let y = -border; y < qr.size + border; y++) {
            for (let x = -border; x < qr.size + border; x++) {
                ctx.fillStyle = qr.getModule(x, y) ? darkColor : lightColor;
                ctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
            }
        }
    }
    function toUtf8ByteArray(str) {
        str = encodeURI(str);
        let result = [];
        for (let i = 0; i < str.length; i++) {
            if (str.charAt(i) != "%")
                result.push(str.charCodeAt(i));
            else {
                result.push(parseInt(str.substring(i + 1, i + 3), 16));
                i += 2;
            }
        }
        return result;
    }
    main();
})(app || (app = {}));
