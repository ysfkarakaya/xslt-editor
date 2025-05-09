// Resim işleme fonksiyonları

// Modal işlemleri
$('#imageModal').on('show.bs.modal', function (event) {
  // Butona tıklayan elementi al
  var button = $(event.relatedTarget)
})

// "Yükle" düğmesine tıklama dinleyicisi
document.getElementById('uploadNewImage').addEventListener('click', function() {
    const newImageInput = document.getElementById('newImage');
    const newImageFile = newImageInput.files[0];

    if (newImageFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const newSrc = event.target.result;

            const escapedCurrentImgSrc = escapeRegExp(currentImgSrc);
            const regex = new RegExp(`(<img[^>]*src=")${escapedCurrentImgSrc}"`, 'g');
            currentXsltContent = currentXsltContent.replace(regex, `$1${newSrc}"`);

            transformAndPreview(currentXsltContent);
            $('#imageModal').modal('hide');
        };
        reader.readAsDataURL(newImageFile);
    } else {
        alert('Please select a new image.');
    }
});
