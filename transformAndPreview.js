// XSLT dönüştürme ve önizleme fonksiyonu
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
