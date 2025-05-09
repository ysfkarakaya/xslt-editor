// Ana JavaScript dosyası
let currentXsltContent = '';
let currentImgSrc = '';
let codeMirrorEditor;
let currentTableHTML = '';
let currentTableElement = null;

// Tema değiştirme ve dosya sürükle-bırak işlevselliği
let isDarkMode = false;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize CodeMirror
    codeMirrorEditor = CodeMirror(document.getElementById('codeEditor'), {
        mode: 'xml',
        theme: 'dracula',
        lineNumbers: true,
        lineWrapping: true,
        autofocus: true,
        // Arama eklentisi için gerekli ayarlar
        extraKeys: {
            "Ctrl-F": "findPersistent",
            "Cmd-F": "findPersistent",
            "Alt-F": "findPersistent",
            "Ctrl-G": "findNext",
            "Cmd-G": "findNext",
            "Alt-G": "findNext",
            "Shift-Ctrl-G": "findPrev",
            "Shift-Cmd-G": "findPrev",
            "Shift-Alt-G": "findPrev",
            "Ctrl-Alt-F": "replace",
            "Shift-Ctrl-Alt-F": "replaceAll"
        }
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
    
    // Bootstrap 5 tab event listeners
    document.querySelectorAll('#myTab button').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Sekme değiştiğinde CodeMirror'ı yeniden boyutlandır
            if (this.getAttribute('data-bs-target') === '#code') {
                setTimeout(function() {
                    codeMirrorEditor.refresh();
                }, 10);
            }
        });
    });

    document.querySelectorAll('#xsltTab button').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });

    // Yeni satır ekleme butonu için olay dinleyicisi
    document.getElementById('addNewRow').addEventListener('click', function() {
        // Eğer currentTableElement #notesTable ise, yeni satır ekle
        if (currentTableElement && currentTableElement.id === 'notesTable') {
            addNewRow();
        } else {
            alert('Bu işlem sadece #notesTable için geçerlidir.');
        }
    });
    
    // Tema değiştirme butonu için olay dinleyicisi
    document.getElementById('themeToggle').addEventListener('click', function() {
        toggleDarkMode();
    });
    
    // Dosya sürükle-bırak işlevselliği
    const fileDropArea = document.querySelector('.file-drop-area');
    const fileInput = document.getElementById('xsltFile');
    const fileMsg = document.querySelector('.file-msg');
    
    // Dosya seçildiğinde mesajı güncelle
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length) {
            fileMsg.textContent = fileInput.files[0].name;
        } else {
            fileMsg.textContent = 'Dosyayı buraya sürükleyin veya seçin';
        }
    });
    
    // Sürükle-bırak olayları
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        fileDropArea.classList.add('is-active');
    }
    
    function unhighlight() {
        fileDropArea.classList.remove('is-active');
    }
    
    fileDropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            fileInput.files = files;
            fileMsg.textContent = files[0].name;
        }
    }
});

function loadXslt(xsltPath) {
    fetch(xsltPath)
        .then(response => response.text())
        .then(xsltContent => {
            currentXsltContent = xsltContent;
            document.getElementById('myTab').style.display = 'flex';
            var codeTab = new bootstrap.Tab(document.getElementById('code-tab'));
            codeTab.show();
            codeMirrorEditor.setValue(xsltContent);
            // CodeMirror'ı yeniden boyutlandır
            setTimeout(function() {
                codeMirrorEditor.refresh();
            }, 10);
            transformAndPreview(currentXsltContent);
            document.getElementById('myTabContent').style.display = 'block';
            // Artık downloadButton'un parent'ını göstermeye gerek yok, çünkü buton kod sekmesinde
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
            document.getElementById('myTab').style.display = 'flex';
            var codeTab = new bootstrap.Tab(document.getElementById('code-tab'));
            codeTab.show();
            codeMirrorEditor.setValue(currentXsltContent);
            // CodeMirror'ı yeniden boyutlandır
            setTimeout(function() {
                codeMirrorEditor.refresh();
            }, 10);
            transformAndPreview(currentXsltContent);
            document.getElementById('myTabContent').style.display = 'block';
            // Artık downloadButton'un parent'ını göstermeye gerek yok, çünkü buton kod sekmesinde
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

// İkinci DOMContentLoaded event listener'ı kaldırıldı, çünkü kodları ilk listener'a taşındı

// Tema değiştirme fonksiyonu
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    
    // Body'ye dark-mode sınıfını ekle/kaldır
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    // Tema değiştirme butonunun ikonunu güncelle
    const themeToggleIcon = document.querySelector('#themeToggle i');
    if (isDarkMode) {
        themeToggleIcon.classList.remove('fa-moon');
        themeToggleIcon.classList.add('fa-sun');
    } else {
        themeToggleIcon.classList.remove('fa-sun');
        themeToggleIcon.classList.add('fa-moon');
    }
    
    // CodeMirror temasını güncelle
    if (codeMirrorEditor) {
        if (isDarkMode) {
            codeMirrorEditor.setOption('theme', 'dracula');
        } else {
            codeMirrorEditor.setOption('theme', 'default');
        }
        
        // CodeMirror'ı yeniden boyutlandır
        setTimeout(function() {
            codeMirrorEditor.refresh();
        }, 10);
    }
    
    // Kullanıcı tercihini localStorage'a kaydet
    localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
}

// Sayfa yüklendiğinde kullanıcının tema tercihini kontrol et
function checkUserThemePreference() {
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme === 'true') {
        toggleDarkMode();
    }
}

// Sayfa yüklendiğinde tema tercihini kontrol et
document.addEventListener('DOMContentLoaded', checkUserThemePreference);
