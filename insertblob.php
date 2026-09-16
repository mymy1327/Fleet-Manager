<?php
require "./assets/config.php";
// Handle file upload
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_FILES["myfile"])) {
        $tempPath = $_FILES["myfile"]["tmp_name"];
        $fileName = $_FILES["myfile"]["name"];
        $fileType = $_FILES["myfile"]["type"];

        $fileContent = file_get_contents($tempPath);

        unlink($tempPath);
    }

    $stmt = $conn->prepare("INSERT INTO `files` (`name`, `type`, `data`) VALUES (?, ?, ?)");

    $stmt->bind_param("sss", $fileName, $fileType, $fileContent);

    if ($stmt->execute()) {
        echo "<p>File uploaded successfully!</p>";
    } else {
        echo "<p>Error uploading file.</p>";
    }

    $stmt->close();
    die();
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>File Upload</title>
</head>
<body>

    <h2>Upload a File</h2>

    <form method="POST" enctype="multipart/form-data">

        <label>Select file:</label>
        <input type="file" name="myfile" required>

        <br><br>

        <button type="submit">Upload</button>

    </form>

</body>
</html>
