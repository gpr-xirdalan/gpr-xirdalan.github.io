<?php 
$target_dir = "img/";
$target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);
$uploadOk = 1;
$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));
$imageName = htmlspecialchars( basename( $_FILES["fileToUpload"]["name"]));

// Check if image file is a actual image or fake image
if(isset($_POST["submit"])) {
  $check = getimagesize($_FILES["fileToUpload"]["tmp_name"]);
  if($check !== false) {
    echo "File is an image - " . $check["mime"] . ".";
    $uploadOk = 1;
  } else {
    echo "File is not an image.";
    $uploadOk = 0;
  }
}

// Check if file already exists
if (file_exists($target_file)) {
  echo "Sorry, file already exists.";
  $uploadOk = 0;
}

// Check file size
if ($_FILES["fileToUpload"]["size"] > 5000000) {
  echo "Sorry, your file is too large.";
  $uploadOk = 0;
}

// Allow certain file formats
if($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg"
&& $imageFileType != "gif" && $imageFileType != "webp") {
  echo "Sorry, only JPG, JPEG, PNG & GIF files are allowed.";
  $uploadOk = 0;
}

// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
  echo "Sorry, your file was not uploaded.";
// if everything is ok, try to upload file
} else {
  if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {
    echo "The file ".$imageName. " has been uploaded.";
  } else {
    echo "Sorry, there was an error uploading your file.";
  }
}

$productName = $_POST['productName'];
$productPrice = $_POST['productPrice'];
$productCategory = $_POST['productCategory'];
$productBrand = $_POST['productBrand'];
$discount = $_POST['productDsicount'];
$productGroup = $_POST['productGroup'];
$productAddedDated = date('d.m.Y');

if(!empty($_POST['productName'])) {



$file = 'products.json'; // Путь к JSON-файлу

// 1. Читаем текущий JSON (если файл существует)
$jsonData = file_exists($file) ? file_get_contents($file) : '[]';

// 2. Декодируем в массив
$dataArray = json_decode($jsonData, true);

// 3. Добавляем новую запись
// "name": "YADDAS USB 2GB EUROACS",
// "price": "4.80",
// "imageSrc": "/img/yaddas-usb-2gb.png",
// "category": "Flash drive",
// "brand": "Euroacs",
// "pinned": true,
// "hasNew": false
$newEntry = [
    'name' => $productName,
    'price' => $productPrice,
    'imageSrc' => 'img/'.$imageName,
    'category' => $productCategory,
    'group' => $productGroup ?: false,
    'brand' => $productBrand,
    'discount' => $discount,
    'pinned' => false,
    'hasNew' => false,
    'addedDate' => $productAddedDated
];

// $dataArray['products'][] = $newEntry;

array_unshift($dataArray['products'], $newEntry);

// 4. Кодируем обратно в JSON
$newJsonData = json_encode($dataArray, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// 5. Записываем в файл
file_put_contents($file, $newJsonData);
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Document</title>
</head>
<body>
<form action="upload.php" method="post" enctype="multipart/form-data" style="
    display: flex;
    flex-direction: column;
    gap: 9px;
    width: 200px;
    border: 2px solid;
    padding: 6px;
    margin: 0 auto;
">
  Select image to upload:
  <label for="fileToUpload">Image</label>
  <input type="file" name="fileToUpload" id="fileToUpload">

  <label for="productName">Name</label>
  <input type="text" name="productName">

  <label for="productPrice">Price</label>
  <input type="text" name="productPrice">

  <label for="productCategory">Category</label>
  <input type="text" name="productCategory">

  <label for="productDsicount">Group</label>
  <input type="text" name="productGroup">  

  <label for="productBrand">Brand</label>
  <input type="text" name="productBrand">


  <label for="productDsicount">Discount</label>
  <input type="text" name="productDsicount">

  <input type="submit" value="Upload Image" name="submit">
</form>
</body>
</html>