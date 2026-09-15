<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Checklist item</title>
</head>
<body>
    <h1><?php echo (isset($_GET["id"]) ? "Edit" : "Add") ?> checklist item</h1>
    <label for="name">Name:</label><br>
    <input type="text" id="name" maxlength=255 name="name"><br>
    <label for="name">Description:</label><br>
    <input type="textarea" id="description" maxlength=512 name="description"><br>
    <button id="btnSubmit">Submit</button>
</body>
</html>
