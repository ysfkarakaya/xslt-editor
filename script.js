let currentXsltContent = '';
let currentImgSrc = '';
let codeMirrorEditor;
let currentTableHTML = '';
let currentTableElement = null;

// Function to escape special characters for regular expressions
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize CodeMirror
    codeMirrorEditor = CodeMirror(document.getElementById('codeEditor'), {
        mode: 'xml',
        theme: 'dracula',
        lineNumbers: true,
        lineWrapping: true,
        autofocus: true
    });

    // Load default XSLT on page load
    //loadXslt('default/arsiv_default.xslt');

    document.getElementById('xsltSelect').addEventListener('change', function() {
        const selectedXslt = this.value;
        loadXslt(selectedXslt);
    });

    document.getElementById('loadDefaultButton').addEventListener('click', function() {
        const selectedXslt = document.getElementById('xsltSelect').value;
        loadXslt(selectedXslt);
    });
});

function loadXslt(xsltPath) {
    fetch(xsltPath)
        .then(response => response.text())
        .then(xsltContent => {
            currentXsltContent = xsltContent;
            $('#myTab').show();
            $('#code-tab').tab('show');
            codeMirrorEditor.setValue(xsltContent);
            transformAndPreview(currentXsltContent);
            $('#myTabContent').show();
            $('#downloadButton').parent().show();
        })
        .catch(error => {
            console.error('XSLT yükleme hatası:', error);
            alert('XSLT dosyası yüklenirken bir hata oluştu. Lütfen konsolu kontrol edin.');
        });
}

document.getElementById('uploadButton').addEventListener('click', function() {
    const fileInput = document.getElementById('xsltFile');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(event) {
            currentXsltContent = event.target.result;
            $('#myTab').show();
            $('#code-tab').tab('show');
            codeMirrorEditor.setValue(currentXsltContent);
            transformAndPreview(currentXsltContent);
            $('#myTabContent').show();
            $('#downloadButton').parent().show();
        };

        reader.onerror = function(error) {
            console.error('XSLT dosyası okuma hatası:', error);
            alert('XSLT dosyası okunurken bir hata oluştu. Lütfen konsolu kontrol edin.');
        };

        reader.readAsText(file);
    } else {
        alert('Lütfen bir XSLT dosyası seçin.');
    }
});

document.getElementById('updateButton').addEventListener('click', function() {
    currentXsltContent = codeMirrorEditor.getValue();
    transformAndPreview(currentXsltContent);
});

document.getElementById('downloadButton').addEventListener('click', function() {
    downloadXslt(currentXsltContent);
});

function transformAndPreview(xsltContent) {
    fetch('data.xml')
        .then(response => response.text())
        .then(xmlContent => {
            const xsltProcessor = new XSLTProcessor();
            const xsltParser = new DOMParser();
            try {
                const xsltDOM = xsltParser.parseFromString(xsltContent, 'application/xml');
                xsltProcessor.importStylesheet(xsltDOM);

                const xmlParser = new DOMParser();
                const xmlDOM = xmlParser.parseFromString(xmlContent, 'application/xml');

                const resultDocument = xsltProcessor.transformToDocument(xmlDOM);

                const previewFrame = document.getElementById('previewFrame');
                previewFrame.contentDocument.body.innerHTML = '';
                
                // Add CSS styles to iframe content
                const styleElement = previewFrame.contentDocument.createElement('style');
                styleElement.textContent = `
                    .image-container {
                        position: relative;
                        display: inline-block;
                    }
                    .image-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(13, 110, 253, 0.15);
                        border: 2px dashed #0d6efd;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        pointer-events: auto;
                        z-index: 1000;
                        color: white;
                        font-size: 1.5em;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        opacity: 0.2;
                        transition: opacity 0.2s ease-in-out;
                    }
                    .image-container:hover .image-overlay {
                        opacity: 1;
                        background-color: rgba(13, 110, 253, 0.3);
                    }
                    
                    .table-container {
                        position: relative;
                        display: inline-block;
                        width: 100%;
                    }
                    .table-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(13, 110, 253, 0.15);
                        border: 2px dashed #0d6efd;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        pointer-events: auto;
                        z-index: 1000;
                        color: white;
                        font-size: 1.5em;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        opacity: 0.2;
                        transition: opacity 0.2s ease-in-out;
                    }
                    .table-container:hover .table-overlay {
                        opacity: 1;
                        background-color: rgba(13, 110, 253, 0.3);
                    }
                    
                    .editable-cell {
                        padding: 5px;
                        border: 1px solid #dee2e6;
                    }
                    .editable-cell:focus {
                        outline: 2px solid #0d6efd;
                        outline-offset: -2px;
                    }
                `;
                previewFrame.contentDocument.head.appendChild(styleElement);
                
                // Add Font Awesome to iframe content for icons
                const linkElement = previewFrame.contentDocument.createElement('link');
                linkElement.rel = 'stylesheet';
                linkElement.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
                linkElement.integrity = 'sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==';
                linkElement.crossOrigin = 'anonymous';
                linkElement.referrerPolicy = 'no-referrer';
                previewFrame.contentDocument.head.appendChild(linkElement);
                
                previewFrame.contentDocument.body.appendChild(resultDocument.documentElement);

                // Add overlay to editable images and handle click event
                $(previewFrame.contentDocument.body).find('img').each(function() {
                    $(this).wrap('<div class="image-container"></div>');
                    $(this).before('<div class="image-overlay"><i class="fas fa-camera"></i> <span style="font-size: 0.7em; margin-left: 5px;">Değiştir</span></div>');
                    $(this).parent().on('click', function(event) {
                        currentImgSrc = $(this).find('img').attr('src');
                        $('#imageModal').modal('show');
                    });
                });
                
                // Add overlay to tables and handle click event
                $(previewFrame.contentDocument.body).find('table').each(function() {
                    // Sadece #notesTable ID'sine sahip tabloları veya banka_hesap_bilgileri sınıfına sahip tabloları hedefle
                    if ($(this).attr('id') === 'notesTable' || $(this).hasClass('banka_hesap_bilgileri')) {
                        $(this).wrap('<div class="table-container"></div>');
                        $(this).before('<div class="table-overlay"><i class="fas fa-edit"></i> <span style="font-size: 0.7em; margin-left: 5px;">Tabloyu Düzenle</span></div>');
                        
                        $(this).parent().on('click', function(event) {
                            currentTableElement = $(this).find('table')[0];
                            currentTableHTML = currentTableElement.outerHTML;
                            
                            // Tablo ID'sini veya sınıfını saklayalım
                            if (currentTableElement.id) {
                                currentTableElement.setAttribute('data-original-id', currentTableElement.id);
                            }
                            if (currentTableElement.className) {
                                currentTableElement.setAttribute('data-original-class', currentTableElement.className);
                            }
                            
                            // Tablo içeriğini düzenlenebilir formatta modalda göster
                            openTableEditor(currentTableElement);
                            
                            $('#tableModal').modal('show');
                        });
                    }
                });

                previewFrame.contentDocument.body.addEventListener('click', function(event) {
                    if (event.target.tagName === 'IMG') {
                        const imgElement = event.target;
                        currentImgSrc = imgElement.src;
                        $('#imageModal').modal('show');
                    }
                });
                
                // Tablo düzenleme modalı için event listener
                document.getElementById('saveTableChanges').addEventListener('click', function() {
                    saveTableChanges();
                });
            } catch (error) {
                console.error('XSLT dönüştürme hatası:', error);
                alert('XSLT dönüştürme sırasında bir hata oluştu. Lütfen konsolu kontrol edin.');
            }
        })
        .catch(error => {
            console.error('XML dosyası okuma hatası:', error);
            alert('XML dosyası okunurken bir hata oluştu. Lütfen konsolu kontrol edin.');
        });
}

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

function downloadXslt(xsltContent) {
    const blob = new Blob([xsltContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'updated.xslt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Tablo düzenleme fonksiyonları
function openTableEditor(tableElement) {
    const tableEditorContainer = document.getElementById('tableEditorContainer');
    tableEditorContainer.innerHTML = '';
    
    // Düzenlenebilir tablo oluştur
    const editableTable = document.createElement('table');
    editableTable.className = 'table table-bordered';
    editableTable.id = 'editableTable';
    
    const tbody = document.createElement('tbody');
    
    // Orijinal tablodaki satırları ve hücreleri kopyala
    const rows = tableElement.querySelectorAll('tr');
    
    rows.forEach((row, rowIndex) => {
        const newRow = document.createElement('tr');
        
        // Orijinal satırın özelliklerini kopyala
        if (row.hasAttribute('align')) {
            newRow.setAttribute('align', row.getAttribute('align'));
        }
        
        // Orijinal satırın sınıfını kopyalaf
        if (row.className) {
            newRow.className = row.className;
        }
        
        // Satırın düzenlenebilir olup olmadığını kontrol et
        let isEditable = true;
        
        if (tableElement.id === 'notesTable') {
            // notesTable için kontrol
            // 1. Satırın kendisi duzenle sınıfına sahipse
            // 2. Satırın içinde duzenle sınıfına sahip bir hücre varsa
            isEditable = row.classList.contains('duzenle') || 
                         row.querySelector('td.duzenle') !== null;
        }
        
        const cells = row.querySelectorAll('td, th');
        
        cells.forEach((cell, cellIndex) => {
            const newCell = document.createElement(cell.tagName.toLowerCase());
            
            // Orijinal hücrenin width özelliğini kopyala
            if (cell.hasAttribute('width')) {
                newCell.setAttribute('width', cell.getAttribute('width'));
            }
            
            // Hücre içeriğini HTML olarak kopyala
            const cellHTML = cell.innerHTML;
            
            // Düzenlenebilir hücreler için textarea kullan
            if (isEditable) {
                // Textarea oluştur
                const textarea = document.createElement('textarea');
                textarea.className = 'form-control editable-cell';
                textarea.rows = 5; // Satır sayısını ayarla
                
                // Tüm <br> etiketlerini \n karakterlerine dönüştür
                let content = cellHTML
                    .replace(/<br\s*\/?>/gi, '\n') // Tüm <br>, <br/>, <br /> vb. etiketleri
                    .replace(/&#160;/g, ' ') // &#160; karakterlerini boşluğa dönüştür
                    .replace(/&nbsp;/g, ' '); // &nbsp; karakterlerini boşluğa dönüştür
                
                // HTML etiketlerini kaldır
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                content = tempDiv.textContent || tempDiv.innerText || '';
                
                // Textarea içeriğini ayarla
                textarea.value = content;
                
                // Textarea'yı hücreye ekle
                newCell.appendChild(textarea);
                
                console.log('Textarea içeriği:', content);
            } else {
                // Salt okunur hücreler için normal içerik
                newCell.className = 'readonly-cell';
                newCell.innerHTML = cellHTML;
                newCell.style.backgroundColor = '#f8f9fa';
                newCell.style.color = '#6c757d';
            }
            
            newRow.appendChild(newCell);
        });
        
        tbody.appendChild(newRow);
    });
    
    editableTable.appendChild(tbody);
    tableEditorContainer.appendChild(editableTable);
}

function saveTableChanges() {
    if (!currentTableElement) {
        console.error('currentTableElement tanımlı değil');
        return;
    }
    
    const editableTable = document.getElementById('editableTable');
    if (!editableTable) {
        console.error('editableTable bulunamadı');
        return;
    }
    
    // Düzenlenen tablodan yeni içerik oluştur
    const tableData = extractTableData(editableTable);
    console.log('Çıkarılan tablo verileri:', tableData);
    
    // Özellikle banka_hesap_bilgileri tablosu için özel işlem yapalım
    if (currentTableElement.className && currentTableElement.className.includes('banka_hesap_bilgileri')) {
        console.log('Banka hesap bilgileri tablosu tespit edildi');
        
        // XSLT içeriğini doğrudan CodeMirror'dan alalım
        const xsltContent = codeMirrorEditor.getValue();
        
        // Banka hesap bilgileri tablosunu XSLT içinde bulalım
        const bankTableRegex = /<table[^>]*class=["'][^"']*banka_hesap_bilgileri[^"']*["'][^>]*>[\s\S]*?<\/table>/g;
        
        if (bankTableRegex.test(xsltContent)) {
            console.log('Banka tablosu XSLT içinde bulundu');
            
            // Tablo içeriğini güncelleyelim
            let updatedXsltContent = xsltContent.replace(bankTableRegex, function(match) {
                console.log('Eşleşen tablo:', match);
                
                // Tablo yapısını koruyarak içeriği değiştirelim
                let updatedTable = match;
                
                // Tablo satırlarını güncelleyelim
                tableData.forEach((row, rowIndex) => {
                    if (rowIndex === 0) return; // Başlık satırını atla
                    
                    // Banka adı ve IBAN için regex oluştur
                    const bankName = escapeRegExp(row[0]);
                    const iban = escapeRegExp(row[1]);
                    
                    // Eski değerleri bul ve değiştir
                    const cellRegex = new RegExp(`(<td[^>]*>)([^<]*)(</td><td[^>]*>)([^<]*)(</td>)`, 'g');
                    
                    // Her satırı kontrol et ve eşleşenleri değiştir
                    updatedTable = updatedTable.replace(cellRegex, function(cellMatch, td1, oldBankName, td2, oldIban, td3) {
                        // Eğer bu satır bizim değiştirmek istediğimiz satır ise
                        if (oldBankName.trim() === row[0].trim() || oldIban.trim() === row[1].trim()) {
                            return `${td1}${row[0]}${td2}${row[1]}${td3}`;
                        }
                        return cellMatch;
                    });
                });
                
                return updatedTable;
            });
            
            try {
                // XML doğrulaması yap
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(updatedXsltContent, "application/xml");
                
                // XML hata kontrolü
                const parseError = xmlDoc.getElementsByTagName("parsererror");
                if (parseError.length > 0) {
                    console.error("XML doğrulama hatası:", parseError[0].textContent);
                    alert("XSLT içeriği geçerli bir XML formatında değil. Değişiklikler kaydedilemedi.");
                    return;
                }
                
                // XSLT içeriğini güncelle
                codeMirrorEditor.setValue(updatedXsltContent);
                currentXsltContent = updatedXsltContent;
                
                // Önizlemeyi güncelle
                transformAndPreview(currentXsltContent);
            } catch (error) {
                console.error("XML doğrulama hatası:", error);
                alert("XSLT içeriği geçerli bir XML formatında değil. Değişiklikler kaydedilemedi.");
            }
            
            console.log('XSLT içeriği başarıyla güncellendi');
        } else {
            console.error('Banka tablosu XSLT içinde bulunamadı');
            
            // Genel tablo arama yöntemini deneyelim
            const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/g;
            let found = false;
            
            let updatedXsltContent = xsltContent.replace(tableRegex, function(match) {
                // Eğer bu tablo bizim aradığımız tablo ise (içerik benzerliği kontrolü)
                if (!found && isSimilarTable(match, tableData)) {
                    found = true;
                    console.log('Benzer tablo bulundu, güncelleniyor...');
                    
                    // Tablo içeriğini güncelle
                    return updateTableContent(match, tableData);
                }
                return match;
            });
            
            if (found) {
                // XSLT içeriğini güncelle
                codeMirrorEditor.setValue(updatedXsltContent);
                currentXsltContent = updatedXsltContent;
                
                // Önizlemeyi güncelle
                transformAndPreview(currentXsltContent);
                
                console.log('XSLT içeriği başarıyla güncellendi');
            } else {
                console.error('Hiçbir tablo eşleşmedi');
                alert('Tablo XSLT içeriğinde bulunamadı. Değişiklikler kaydedilemedi.');
            }
        }
    } else if (currentTableElement.id === 'notesTable') {
        // notesTable için özel işlem - sadece düzenlenen satırı güncelle
        console.log('notesTable tespit edildi, sadece düzenlenen satırı güncelliyoruz');
        
        // XSLT içeriğini doğrudan CodeMirror'dan alalım
        const xsltContent = codeMirrorEditor.getValue();
        
        // Düzenlenebilir satırları tespit et
        const editableRows = editableTable.querySelectorAll('tr');
        const editableCells = [];
        
        // Düzenlenebilir satırları ve hücreleri topla
        editableRows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                if (cell.querySelector('textarea')) {
                    editableCells.push({
                        rowIndex: rowIndex,
                        cell: cell
                    });
                }
            });
        });
        
        // notesTable'ı XSLT içinde bul
        const notesTableRegex = /<table[^>]*id=["']notesTable["'][^>]*>[\s\S]*?<\/table>/g;
        
        if (notesTableRegex.test(xsltContent)) {
            console.log('notesTable XSLT içinde bulundu');
            
            // Resim değiştirme işlemindeki gibi bir yaklaşım kullanalım
            // Önce düzenlenen içeriği alalım
            const editableCell = editableCells[0]; // Sadece ilk düzenlenebilir hücreyi kullanalım
            if (!editableCell) {
                console.error('Düzenlenebilir hücre bulunamadı');
                return;
            }
            
            // Düzenlenen içeriği al - textarea'dan value özelliğini kullan
            const textarea = editableCell.cell.querySelector('textarea');
            if (!textarea) {
                console.error('Textarea bulunamadı');
                alert('Düzenlenebilir içerik bulunamadı. Değişiklikler kaydedilemedi.');
                return;
            }
            
            // Textarea'dan içeriği al
            const newContent = textarea.value;
            console.log('Yeni içerik:', newContent);
            
            // Resim değiştirme işlemindeki gibi regex kullanarak değişiklik yapalım
            // <td class="duzenle">...</td> etiketini bulup içeriğini değiştirelim
            
            // Önce <td class="duzenle"> etiketini ve içeriğini bulmak için regex oluşturalım
            const tdDuzenleRegex = /<td\s+class=["']duzenle["'][^>]*>([\s\S]*?)<\/td>/;
            
            // XSLT içeriğinde bu regex ile eşleşen kısmı bulalım
            const tdDuzenleMatch = xsltContent.match(tdDuzenleRegex);
            
            if (!tdDuzenleMatch) {
                console.error('Düzenlenebilir bölüm bulunamadı');
                alert('Düzenlenebilir bölüm bulunamadı. Değişiklikler kaydedilemedi.');
                return;
            }
            
            // Eşleşen kısmın tamamı
            const fullMatch = tdDuzenleMatch[0];
            // Eşleşen kısmın içeriği (td etiketleri arasındaki kısım)
            const oldContent = tdDuzenleMatch[1];
            
            console.log('Eşleşen kısım:', fullMatch);
            console.log('Eski içerik:', oldContent);
            
            // &nbsp; karakterini &#160; karakterine dönüştürelim
            // Ayrıca \n karakterlerini <br/> etiketlerine dönüştürelim
            // Eğer <br> etiketleri varsa, bunları da <br/> olarak değiştirelim
            let processedNewContent = newContent
                .replace(/&nbsp;/g, '&#160;')
                .replace(/\n/g, '<br/>')
                .replace(/<br\s*>/g, '<br/>');
                
            console.log('İşlenmiş yeni içerik:', processedNewContent);
            
            // Yeni içerikle değiştirelim, ancak td etiketlerini koruyalım
            const newFullMatch = fullMatch.replace(oldContent, processedNewContent);
            
            console.log('Yeni eşleşen kısım:', newFullMatch);
            
            // XSLT içeriğinde değişiklik yapalım
            const updatedXsltContent = xsltContent.replace(fullMatch, newFullMatch);
            
            // XSLT içeriğini güncelle
            codeMirrorEditor.setValue(updatedXsltContent);
            currentXsltContent = updatedXsltContent;
            
            // Önizlemeyi güncelle
            transformAndPreview(currentXsltContent);
            
            console.log('XSLT içeriği başarıyla güncellendi');
        } else {
            console.error('notesTable XSLT içinde bulunamadı');
            alert('Tablo XSLT içeriğinde bulunamadı. Değişiklikler kaydedilemedi.');
        }
    } else {
        // Diğer tablolar için genel yaklaşım
        const newTableHTML = createTableHTML(editableTable, currentTableElement);
        console.log('Yeni tablo HTML:', newTableHTML);
        
        // XSLT içeriğini doğrudan CodeMirror'dan alalım
        const xsltContent = codeMirrorEditor.getValue();
        
        // Tablo içeriğini güncelle
        const tableRegex = /<table[^>]*>[\
