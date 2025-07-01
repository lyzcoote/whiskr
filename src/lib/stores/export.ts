import { writable } from 'svelte/store';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
    format: 'png' | 'pdf' | 'md';
    includeMetadata: boolean;
    quality: number;
}

function createExportStore() {
    const { subscribe, set, update } = writable({
        isExporting: false,
        progress: 0
    });

    return {
        subscribe,

        exportToPNG: async (element: HTMLElement, filename: string = 'document.png') => {
            set({ isExporting: true, progress: 0 });
            
            try {
                update(state => ({ ...state, progress: 25 }));
                
                const canvas = await html2canvas(element, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    allowTaint: true
                });
                
                update(state => ({ ...state, progress: 75 }));
                
                const link = document.createElement('a');
                link.download = filename;
                link.href = canvas.toDataURL('image/png');
                link.click();
                
                update(state => ({ ...state, progress: 100 }));
                
                setTimeout(() => {
                    set({ isExporting: false, progress: 0 });
                }, 1000);
                
            } catch (error) {
                console.error('Error exporting to PNG:', error);
                set({ isExporting: false, progress: 0 });
                throw error;
            }
        },

        exportToPDF: async (element: HTMLElement, filename: string = 'document.pdf') => {
            set({ isExporting: true, progress: 0 });
            
            try {
                update(state => ({ ...state, progress: 20 }));
                
                const canvas = await html2canvas(element, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    allowTaint: true
                });
                
                update(state => ({ ...state, progress: 50 }));
                
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                
                const imgWidth = 210;
                const pageHeight = 295;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;
                
                update(state => ({ ...state, progress: 75 }));
                
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                pdf.save(filename);
                
                update(state => ({ ...state, progress: 100 }));
                
                setTimeout(() => {
                    set({ isExporting: false, progress: 0 });
                }, 1000);
                
            } catch (error) {
                console.error('Error exporting to PDF:', error);
                set({ isExporting: false, progress: 0 });
                throw error;
            }
        },

        exportToMarkdown: (content: string, title: string, filename: string = 'document.md') => {
            set({ isExporting: true, progress: 50 });
            
            try {
                const blob = new Blob([content], { type: 'text/markdown' });
                const link = document.createElement('a');
                link.download = filename;
                link.href = URL.createObjectURL(blob);
                link.click();
                
                URL.revokeObjectURL(link.href);
                
                set({ isExporting: false, progress: 100 });
                
                setTimeout(() => {
                    set({ isExporting: false, progress: 0 });
                }, 1000);
                
            } catch (error) {
                console.error('Error exporting to Markdown:', error);
                set({ isExporting: false, progress: 0 });
                throw error;
            }
        }
    };
}

export const exportStore = createExportStore();