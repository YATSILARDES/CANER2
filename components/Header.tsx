
import React from 'react';
import { PrintIcon, DownloadIcon, ShareIcon, PhotoIcon, BuildingIcon } from './icons';

interface HeaderProps {
    viewMode?: 'editor' | 'proposal' | 'pricelist';
    setViewMode?: (mode: 'editor' | 'proposal' | 'pricelist') => void;
}

export const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode }) => {
    
    const handlePrint = () => {
        const element = document.getElementById('printable-area');
        if (!element) return;

        // 1. Pencere aç
        const printWindow = window.open('', '_blank', 'width=900,height=900');
        if (!printWindow) {
            alert('Lütfen pop-up engelleyicisini kapatın.');
            return;
        }

        // 2. HTML içeriğini hazırla
        // Tailwind'i CDN ile yüklüyoruz ki stiller korunsun
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Onay Mühendislik Teklifi Yazdır</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background-color: white;
                        display: flex;
                        justify-content: center;
                    }
                    @page { size: A4; margin: 0; }
                    @media print {
                        body { 
                            -webkit-print-color-adjust: exact; 
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                ${element.outerHTML}
                <script>
                    // Resimlerin yüklenmesini bekle, sonra yazdır
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 1000);
                    };
                </script>
            </body>
            </html>
        `;

        // 3. İçeriği yaz
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleDownloadPdf = () => {
        const element = document.getElementById('printable-area');
        if (!element) return;

        // @ts-ignore
        if (!window.html2pdf) {
            alert('PDF oluşturucu yükleniyor, lütfen tekrar deneyin.');
            return;
        }

        const opt = {
            margin: 0,
            filename: 'onay-muhendislik-teklif.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // @ts-ignore
        window.html2pdf().set(opt).from(element).save();
    };

    const handleDownloadImage = async () => {
        const element = document.getElementById('printable-area');
        if (!element) return;
        
        // @ts-ignore
        if (!window.html2canvas) {
             alert('Resim oluşturucu yükleniyor...');
             return;
        }

        try {
            // @ts-ignore
            const canvas = await window.html2canvas(element, {
                scale: 2, // Yüksek çözünürlük
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const image = canvas.toDataURL("image/jpeg", 1.0);
            const link = document.createElement('a');
            link.href = image;
            link.download = 'onay-muhendislik-teklif.jpg';
            link.click();
        } catch (err) {
            console.error(err);
            alert("Resim oluşturulurken bir hata oluştu.");
        }
    };

    const handleShare = async () => {
        const element = document.getElementById('printable-area');
        if (!element) return;
         // @ts-ignore
         if (!window.html2pdf) {
            alert('Paylaşım servisi yükleniyor...');
            return;
        }

        try {
            const opt = {
                margin: 0,
                filename: 'Teklif.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // @ts-ignore
            const pdfBlob = await window.html2pdf().set(opt).from(element).output('blob');
            const file = new File([pdfBlob], "Teklif.pdf", { type: "application/pdf" });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Doğalgaz Keşif Teklifi',
                    text: 'Onay Mühendislik Doğalgaz Keşif Teklifi ektedir.'
                });
            } else {
                alert("Tarayıcınız dosya paylaşımını desteklemiyor. Lütfen 'PDF İndir' butonunu kullanın.");
            }
        } catch (error) {
            console.error('Paylaşım hatası:', error);
            alert('Paylaşım sırasında bir hata oluştu.');
        }
    };

    return (
        <header className="bg-white shadow-md no-print relative z-10">
            <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2.25 2.25 0 00-2.25-2.25a2.25 2.25 0 00-2.25 2.25a2.25 2.25 0 002.25 2.25a2.25 2.25 0 002.25-2.25z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.732 3.732a2.25 2.25 0 00-2.25 2.25a2.25 2.25 0 002.25 2.25a2.25 2.25 0 002.25-2.25a2.25 2.25 0 00-2.25-2.25z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75a2.25 2.25 0 002.25 2.25a2.25 2.25 0 002.25-2.25a2.25 2.25 0 00-2.25-2.25z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 15.75v-3.75a.75.75 0 00-1.5 0v3.75m0 0a2.25 2.25 0 00-4.5 0m4.5 0v.75a.75.75 0 01-1.5 0v-.75m-6-12v3.75a.75.75 0 01-1.5 0V3.75m0 0a2.25 2.25 0 00-4.5 0m4.5 0v.75a.75.75 0 001.5 0v-.75M4.5 15.75v-3.75a.75.75 0 00-1.5 0v3.75m0 0a2.25 2.25 0 00-4.5 0m4.5 0v.75a.75.75 0 01-1.5 0v-.75" />
                        </svg>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Doğalgaz Keşif Asistanı</h1>
                    </div>

                    {setViewMode && (
                        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                            <button 
                                type="button"
                                onClick={() => setViewMode('editor')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'editor' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Veri Girişi
                            </button>
                            <button 
                                type="button"
                                onClick={() => setViewMode('pricelist')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'pricelist' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Fiyat Listesi
                            </button>
                            <button 
                                type="button"
                                onClick={() => setViewMode('proposal')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'proposal' ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Teklif Formu
                            </button>
                        </div>
                    )}
                    
                    {viewMode === 'proposal' && (
                        <div className="flex space-x-2">
                             <button 
                                type="button"
                                onClick={handleShare}
                                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm text-sm"
                            >
                                <ShareIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Paylaş</span>
                            </button>
                             <button 
                                type="button"
                                onClick={handleDownloadImage}
                                className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm text-sm"
                            >
                                <PhotoIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Resim İndir</span>
                            </button>
                             <button 
                                type="button"
                                onClick={handleDownloadPdf}
                                className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-sm text-sm"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">PDF</span>
                            </button>
                            <button 
                                type="button"
                                onClick={handlePrint}
                                className="flex items-center space-x-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition shadow-sm text-sm"
                            >
                                <PrintIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Yazdır</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
