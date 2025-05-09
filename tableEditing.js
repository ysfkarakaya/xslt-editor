// Tablo düzenleme fonksiyonları
// Yeni satır ekleme fonksiyonu - doğrudan XSLT içeriğine ekler
function addNewRow() {
    // Eğer currentTableElement tanımlı değilse, işlemi durdur
    if (!currentTableElement) {
        console.error('currentTableElement tanımlı değil');
        alert('Lütfen önce bir tablo seçin.');
        return;
    }
    
    // Eğer tablo #notesTable değilse, işlemi durdur
    if (currentTableElement.id !== 'notesTable') {
        console.error('Bu işlem sadece #notesTable için geçerlidir');
        alert('Bu işlem sadece #notesTable için geçerlidir.');
        return;
    }
    
    // XSLT içeriğini al
    const xsltContent = codeMirrorEditor.getValue();
    
    // notesTable'ı XSLT içinde bul
    const notesTableRegex = /<table[^>]*id=["']notesTable["'][^>]*>[\s\S]*?<\/table>/g;
    
    if (notesTableRegex.test(xsltContent)) {
        console.log('notesTable XSLT içinde bulundu');
        
        // Tüm tabloyu güncelleyelim
        let updatedXsltContent = xsltContent.replace(notesTableRegex, function(match) {
            console.log('Eşleşen tablo:', match);
            
            // Tablonun kapanış etiketini bul
            const tableCloseTagIndex = match.lastIndexOf('</table>');
            if (tableCloseTagIndex === -1) {
                console.error('Tablo kapanış etiketi bulunamadı');
                return match;
            }
            
            // Tablonun tbody kapanış etiketini bul
            const tbodyCloseTagIndex = match.lastIndexOf('</tbody>');
            
            // Eğer tbody etiketi varsa, tbody'nin içine ekle
            // Yoksa doğrudan table'ın içine ekle
            const insertIndex = tbodyCloseTagIndex !== -1 ? tbodyCloseTagIndex : tableCloseTagIndex;
            
            // Hücre sayısını belirle (ilk satırdaki hücre sayısı)
            const firstRow = currentTableElement.querySelector('tr');
            const cellCount = firstRow ? firstRow.querySelectorAll('td, th').length : 1;
            
            // Yeni satır HTML'i oluştur
            let newRowHTML = '<tr class="duzenle">';
            
            // Yeni satıra hücreler ekle
            for (let i = 0; i < cellCount; i++) {
                newRowHTML += '<td class="duzenle">&#160;</td>';
            }
            
            // Satırı kapat
            newRowHTML += '</tr>';
            
            // Yeni satırı tabloya ekle
            const updatedTable = match.substring(0, insertIndex) + newRowHTML + match.substring(insertIndex);
            
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
            
            console.log('Yeni satır eklendi ve XSLT içeriği başarıyla güncellendi');
            
            // Modalı kapatmak yerine, modalı güncelleyelim
            // Önce currentTableElement'i güncelleyelim
            // Önizleme çerçevesindeki tabloyu alalım
            const previewFrame = document.getElementById('previewFrame');
            if (previewFrame && previewFrame.contentDocument) {
                const updatedTable = previewFrame.contentDocument.getElementById('notesTable');
                if (updatedTable) {
                    // currentTableElement'i güncelleyelim
                    currentTableElement = updatedTable;
                    
                    // Tablo içeriğini düzenlenebilir formatta modalda göster
                    openTableEditor(currentTableElement);
                    
                    console.log('Modal güncellendi, yeni satır eklendi.');
                    alert('Yeni satır başarıyla eklendi. Şimdi düzenleyebilirsiniz.');
                } else {
                    console.error('Güncellenmiş tablo bulunamadı');
                    // Modalı kapat
                    $('#tableModal').modal('hide');
                    alert('Yeni satır başarıyla eklendi.');
                }
            } else {
                console.error('Önizleme çerçevesi bulunamadı');
                // Modalı kapat
                $('#tableModal').modal('hide');
                alert('Yeni satır başarıyla eklendi.');
            }
        } catch (error) {
            console.error("XML doğrulama hatası:", error);
            alert("XSLT içeriği geçerli bir XML formatında değil. Değişiklikler kaydedilemedi.");
        }
    } else {
        console.error('notesTable XSLT içinde bulunamadı');
        alert('Tablo XSLT içeriğinde bulunamadı. Değişiklikler kaydedilemedi.');
    }
}

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
        // notesTable için özel işlem - sadece düzenlenen satırları güncelle
        console.log('notesTable tespit edildi, sadece düzenlenen satırları güncelliyoruz');
        
        // XSLT içeriğini doğrudan CodeMirror'dan alalım
        const xsltContent = codeMirrorEditor.getValue();
        
        // notesTable'ı XSLT içinde bul
        const notesTableRegex = /<table[^>]*id=["']notesTable["'][^>]*>[\s\S]*?<\/table>/g;
        
        if (notesTableRegex.test(xsltContent)) {
            console.log('notesTable XSLT içinde bulundu');
            
            // Düzenlenebilir tablodaki tüm textarea'ları bul
            const textareas = editableTable.querySelectorAll('textarea');
            console.log('Bulunan textarea sayısı:', textareas.length);
            
            if (textareas.length === 0) {
                console.error('Hiç textarea bulunamadı');
                alert('Düzenlenebilir içerik bulunamadı. Değişiklikler kaydedilemedi.');
                return;
            }
            
            // Her bir textarea için, içeriği al ve XSLT içeriğindeki ilgili <td class="duzenle"> etiketini güncelle
            let updatedXsltContent = xsltContent;
            
            // Önce tüm <td class="duzenle"> etiketlerini bul
            const tdDuzenleRegex = /<td\s+class=["']duzenle["'][^>]*>([\s\S]*?)<\/td>/g;
            const tdDuzenleMatches = xsltContent.match(tdDuzenleRegex);
            
            if (!tdDuzenleMatches) {
                console.error('Düzenlenebilir bölüm bulunamadı');
                alert('Düzenlenebilir bölüm bulunamadı. Değişiklikler kaydedilemedi.');
                return;
            }
            
            console.log('Bulunan <td class="duzenle"> sayısı:', tdDuzenleMatches.length);
            
            // Her bir textarea için, ilgili <td class="duzenle"> etiketini güncelle
            textareas.forEach((textarea, index) => {
                if (index >= tdDuzenleMatches.length) {
                    console.error('Textarea sayısı, <td class="duzenle"> sayısından fazla');
                    return;
                }
                
                // Textarea'dan içeriği al
                const newContent = textarea.value;
                console.log('Yeni içerik:', newContent);
                
                // İlgili <td class="duzenle"> etiketini bul
                const tdDuzenleMatch = tdDuzenleMatches[index];
                
                // Eşleşen kısmın içeriği (td etiketleri arasındaki kısım)
                const tdDuzenleRegexSingle = /<td\s+class=["']duzenle["'][^>]*>([\s\S]*?)<\/td>/;
                const tdDuzenleMatchSingle = tdDuzenleMatch.match(tdDuzenleRegexSingle);
                
                if (!tdDuzenleMatchSingle) {
                    console.error('Düzenlenebilir bölüm içeriği bulunamadı');
                    return;
                }
                
                const oldContent = tdDuzenleMatchSingle[1];
                
                console.log('Eşleşen kısım:', tdDuzenleMatch);
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
                const newTdDuzenleMatch = tdDuzenleMatch.replace(oldContent, processedNewContent);
                
                console.log('Yeni eşleşen kısım:', newTdDuzenleMatch);
                
                // XSLT içeriğinde değişiklik yapalım
                updatedXsltContent = updatedXsltContent.replace(tdDuzenleMatch, newTdDuzenleMatch);
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
                
                console.log('XSLT içeriği başarıyla güncellendi');
            } catch (error) {
                console.error("XML doğrulama hatası:", error);
                alert("XSLT içeriği geçerli bir XML formatında değil. Değişiklikler kaydedilemedi.");
            }
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
        const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/g;
        let found = false;
        
        let updatedXsltContent = xsltContent.replace(tableRegex, function(match) {
            // Eğer bu tablo bizim aradığımız tablo ise (içerik benzerliği kontrolü)
            if (!found && isSimilarTable(match, extractTableData(currentTableElement))) {
                found = true;
                console.log('Benzer tablo bulundu, güncelleniyor...');
                return newTableHTML;
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
    
    // Modalı kapat
    $('#tableModal').modal('hide');
}

// Tablodan veri çıkarma fonksiyonu
function extractTableData(tableElement) {
    const rows = tableElement.querySelectorAll('tr');
    const data = [];
    
    rows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll('td, th');
        
        cells.forEach(cell => {
            // Eğer cell bir textarea içeriyorsa, textarea'nın değerini al
            const textarea = cell.querySelector('textarea');
            if (textarea) {
                rowData.push(textarea.value.trim());
            } else {
                // Eğer cell'in içinde bir textarea varsa (daha derin bir seviyede)
                const deepTextarea = cell.getElementsByTagName('textarea')[0];
                if (deepTextarea) {
                    rowData.push(deepTextarea.value.trim());
                } else {
                    rowData.push(cell.textContent.trim());
                }
            }
        });
        
        if (rowData.length > 0) {
            data.push(rowData);
        }
    });
    
    return data;
}

// İki tablonun benzer olup olmadığını kontrol eden fonksiyon
function isSimilarTable(tableHTML, tableData) {
    // Geçici bir div oluştur ve HTML'i içine yerleştir
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tableHTML;
    
    // Tablodaki satırları al
    const table = tempDiv.querySelector('table');
    if (!table) return false;
    
    // Tablodaki verileri çıkar
    const extractedData = extractTableData(table);
    
    // Veri yapılarının benzerliğini kontrol et
    if (extractedData.length !== tableData.length) {
        return false;
    }
    
    // En az bir satırın benzer olup olmadığını kontrol et
    let similarRowCount = 0;
    for (let i = 0; i < extractedData.length; i++) {
        for (let j = 0; j < tableData.length; j++) {
            if (areSimilarRows(extractedData[i], tableData[j])) {
                similarRowCount++;
                break;
            }
        }
    }
    
    // En az %50 benzerlik varsa true döndür
    return similarRowCount >= Math.floor(tableData.length / 2);
}

// İki satırın benzer olup olmadığını kontrol eden fonksiyon
function areSimilarRows(row1, row2) {
    if (row1.length !== row2.length) {
        return false;
    }
    
    let similarCellCount = 0;
    for (let i = 0; i < row1.length; i++) {
        if (row1[i].includes(row2[i]) || row2[i].includes(row1[i])) {
            similarCellCount++;
        }
    }
    
    // En az %50 benzerlik varsa true döndür
    return similarCellCount >= Math.floor(row1.length / 2);
}

// Tablo içeriğini güncelleme fonksiyonu
function updateTableContent(tableHTML, newData) {
    // Geçici bir div oluştur ve HTML'i içine yerleştir
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tableHTML;
    
    // Tablodaki satırları al
    const table = tempDiv.querySelector('table');
    if (!table) return tableHTML;
    
    const rows = table.querySelectorAll('tr');
    
    // Her satırı güncelle
    rows.forEach((row, rowIndex) => {
        if (rowIndex >= newData.length) return;
        
        const cells = row.querySelectorAll('td, th');
        
        cells.forEach((cell, cellIndex) => {
            if (cellIndex < newData[rowIndex].length) {
                // Orijinal hücrenin HTML içeriğini koru
                // Sadece düzenlenebilir hücrelerin içeriğini güncelle
                if (row.classList.contains('duzenle') || cell.classList.contains('duzenle')) {
                    // Düzenlenebilir hücrelerin içeriğini güncelle, ancak HTML yapısını koru
                    const originalHTML = cell.innerHTML;
                    const newText = newData[rowIndex][cellIndex];
                    
                    // Eğer orijinal içerikte HTML etiketleri varsa, onları koru
                    if (originalHTML.includes('<br>') || originalHTML.includes('<b>')) {
                        // <br> etiketlerini koru
                        const brMatches = originalHTML.match(/<br\s*\/?>/g) || [];
                        let updatedHTML = newText;
                        
                        // <br> etiketlerini yeni içeriğe ekle
                        brMatches.forEach(br => {
                            updatedHTML += br;
                        });
                        
                        // <br> etiketlerini <br/> olarak değiştir
                        // &nbsp; karakterlerini &#160; karakterlerine dönüştür
                        cell.innerHTML = updatedHTML
                            .replace(/<br\s*\/?>/g, '<br/>')
                            .replace(/&nbsp;/g, '&#160;');
                    } else {
                        cell.textContent = newText;
                    }
                }
            }
        });
    });
    
    return tempDiv.innerHTML;
}

function createTableHTML(editableTable, originalTable) {
    // Orijinal tablonun özelliklerini (class, style, vb.) kopyala
    const newTable = document.createElement('table');
    
    // Orijinal tablonun tüm özelliklerini kopyala
    Array.from(originalTable.attributes).forEach(attr => {
        newTable.setAttribute(attr.name, attr.value);
    });
    
    const tbody = document.createElement('tbody');
    
    // Orijinal tablodaki satırları al
    const originalRows = originalTable.querySelectorAll('tr');
    
    // Düzenlenebilir tablodaki satırları ve hücreleri kopyala
    const editableRows = editableTable.querySelectorAll('tr');
    
    editableRows.forEach((editableRow, rowIndex) => {
        // Orijinal satırı al (eğer varsa)
        const originalRow = rowIndex < originalRows.length ? originalRows[rowIndex] : null;
        
        const newRow = document.createElement('tr');
        
        // Eğer editableRow'da duzenle sınıfı varsa, newRow'a da ekle
        if (editableRow.classList.contains('duzenle')) {
            newRow.className = 'duzenle';
        }
        
        // Orijinal satırın tüm özelliklerini kopyala
        if (originalRow) {
            Array.from(originalRow.attributes).forEach(attr => {
                // Eğer editableRow'da duzenle sınıfı varsa, class özelliğini atla
                if (editableRow.classList.contains('duzenle') && attr.name === 'class') {
                    return;
                }
                newRow.setAttribute(attr.name, attr.value);
            });
        }
        
        // Düzenlenebilir hücreleri al
        const editableCells = editableRow.querySelectorAll('.editable-cell');
        // Salt okunur hücreleri al
        const readonlyCells = editableRow.querySelectorAll('.readonly-cell');
        
        // Düzenlenebilir hücreleri kopyala
        editableCells.forEach((cell) => {
            const newCell = document.createElement(cell.tagName.toLowerCase());
            
            // Hücrenin özelliklerini kopyala
            Array.from(cell.attributes)
                .filter(attr => attr.name !== 'contenteditable' && attr.name !== 'style')
                .forEach(attr => {
                    newCell.setAttribute(attr.name, attr.value);
                });
            
            // Hücre içeriğini kopyala, HTML yapısını koru
            // Eğer içerikte <br> etiketleri varsa, bunları koru
            const cellContent = cell.innerHTML;
            
            // HTML içeriğini düzgün şekilde işle
            if (cellContent.includes('<br') || cellContent.includes('&nbsp;') || cellContent.includes('&#160;')) {
                // HTML içeriğini olduğu gibi koru, ancak <br> etiketlerini <br/> olarak değiştir
                // Ayrıca &nbsp; karakterlerini &#160; karakterlerine dönüştür
                newCell.innerHTML = cellContent
                    .replace(/<br\s*\/?>/g, '<br/>')
                    .replace(/&nbsp;/g, '&#160;');
            } else {
                // Düz metin olarak işle
                newCell.textContent = cell.textContent;
            }
            
            newRow.appendChild(newCell);
        });
        
        // Salt okunur hücreleri orijinal içerikleriyle kopyala
        if (originalRow) {
            readonlyCells.forEach((cell, cellIndex) => {
                // Orijinal satırdaki aynı indeksteki hücreyi bul
                const originalCells = originalRow.querySelectorAll('td, th');
                if (cellIndex < originalCells.length) {
                    const originalCell = originalCells[cellIndex];
                    newRow.appendChild(originalCell.cloneNode(true));
                }
            });
        }
        
        tbody.appendChild(newRow);
    });
    
    newTable.appendChild(tbody);
    return newTable.outerHTML;
}
