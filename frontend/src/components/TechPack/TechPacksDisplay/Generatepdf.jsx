// generatePDF.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDF(techPackData, styleNumber) {
  console.log('Starting PDF generation with data:', techPackData);
  
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Helper to safely get nested property
  const safeGet = (obj, path, defaultValue = 'N/A') => {
    try {
      const result = path.split('.').reduce((current, key) => current?.[key], obj);
      return result !== undefined && result !== null && result !== '' ? result : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  // Helper to check if value exists and is not N/A
  const hasValue = (value) => {
    return value !== undefined && value !== null && value !== '' && value !== 'N/A';
  };

  // Helper to check if array has content
  const hasArrayContent = (arr) => {
    return Array.isArray(arr) && arr.length > 0;
  };

  try {
    // Create PDF using direct text approach (more reliable)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace = 10) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper to add text with wrapping
    const addText = (text, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setTextColor(color[0], color[1], color[2]);
      
      const lines = pdf.splitTextToSize(text, contentWidth);
      const lineHeight = fontSize * 0.5;
      
      lines.forEach(line => {
        checkPageBreak(lineHeight);
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      
      return lines.length * lineHeight;
    };

    // Helper to add section header
    const addSectionHeader = (title) => {
      checkPageBreak(15);
      yPosition += 5;
      pdf.setFillColor(124, 58, 237);
      pdf.rect(margin, yPosition - 5, contentWidth, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin + 2, yPosition);
      yPosition += 10;
      pdf.setTextColor(0, 0, 0);
    };

    // Helper to add table
    const addTable = (headers, rows) => {
      const colWidth = contentWidth / headers.length;
      const rowHeight = 8;
      
      checkPageBreak(rowHeight * (rows.length + 2));
      
      // Headers
      pdf.setFillColor(124, 58, 237);
      pdf.rect(margin, yPosition, contentWidth, rowHeight, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      headers.forEach((header, i) => {
        pdf.text(header, margin + (i * colWidth) + 2, yPosition + 5);
      });
      
      yPosition += rowHeight;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      
      // Rows
      rows.forEach((row, rowIndex) => {
        checkPageBreak(rowHeight);
        
        if (rowIndex % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPosition, contentWidth, rowHeight, 'F');
        }
        
        row.forEach((cell, i) => {
          const cellText = String(cell || 'N/A');
          const truncated = cellText.length > 30 ? cellText.substring(0, 27) + '...' : cellText;
          pdf.text(truncated, margin + (i * colWidth) + 2, yPosition + 5);
        });
        
        yPosition += rowHeight;
      });
      
      yPosition += 3;
    };

    // Helper to add key-value pair (only if value exists)
    const addKeyValue = (key, value) => {
      if (!hasValue(value)) return false;
      
      checkPageBreak(7);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${key}:`, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      const keyWidth = pdf.getTextWidth(`${key}: `);
      const valueLines = pdf.splitTextToSize(String(value), contentWidth - keyWidth);
      pdf.text(valueLines[0], margin + keyWidth, yPosition);
      yPosition += 6;
      
      if (valueLines.length > 1) {
        valueLines.slice(1).forEach(line => {
          checkPageBreak(6);
          pdf.text(line, margin + keyWidth, yPosition);
          yPosition += 6;
        });
      }
      
      return true;
    };

    // ===== HEADER =====
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(124, 58, 237);
    const styleName = safeGet(techPackData, 'tech_pack.product_overview.style_name', 'Tech Pack');
    pdf.text(styleName, margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    pdf.setFont('helvetica', 'normal');
    const styleNum = safeGet(techPackData, 'tech_pack.product_overview.style_number');
    const revision = safeGet(techPackData, 'tech_pack.product_overview.revision');
    const date = formatDate(techPackData?.updatedAt || techPackData?.createdAt);
    pdf.text(`Style Number: ${styleNum} | Revision: ${revision} | Date: ${date}`, margin, yPosition);
    yPosition += 8;

    pdf.setDrawColor(124, 58, 237);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // ===== PRODUCT OVERVIEW =====
    const overviewItems = [
      ['Style Name', safeGet(techPackData, 'tech_pack.product_overview.style_name')],
      ['Style Number', safeGet(techPackData, 'tech_pack.product_overview.style_number')],
      ['Garment Type', safeGet(techPackData, 'tech_pack.product_overview.garment_type')],
      ['Season', safeGet(techPackData, 'tech_pack.product_overview.season', safeGet(techPackData, 'tech_pack.general_info.season'))],
      ['Gender', safeGet(techPackData, 'tech_pack.product_overview.gender')],
      ['Market', safeGet(techPackData, 'tech_pack.general_info.market')],
      ['Designer', safeGet(techPackData, 'tech_pack.general_info.designer')],
      ['Revision', safeGet(techPackData, 'tech_pack.product_overview.revision')],
    ];

    // Check if there's any content in overview
    const hasOverviewContent = overviewItems.some(([_, value]) => hasValue(value)) || 
                               hasValue(techPackData?.tech_pack?.product_overview?.description);

    if (hasOverviewContent) {
      addSectionHeader('Product Overview');
      
      overviewItems.forEach(([key, value]) => addKeyValue(key, value));

      if (hasValue(techPackData?.tech_pack?.product_overview?.description)) {
        yPosition += 3;
        addKeyValue('Description', techPackData.tech_pack.product_overview.description);
      }

      yPosition += 5;
    }

    // ===== FABRICS & TRIMS =====
    const mainFabric = techPackData?.tech_pack?.suggested_fabrics_and_trims?.main_fabric || {};
    const trims = techPackData?.tech_pack?.suggested_fabrics_and_trims?.trims || [];
    
    const hasFabricsContent = 
      hasValue(mainFabric.composition) || 
      hasValue(safeGet(techPackData, 'tech_pack.materials.material_composition')) ||
      hasValue(mainFabric.weight) ||
      hasValue(mainFabric.characteristics) ||
      hasValue(mainFabric.supplier) ||
      hasArrayContent(trims);

    if (hasFabricsContent) {
      addSectionHeader('Fabrics & Trims');
      
      const hasMainFabricContent = 
        hasValue(mainFabric.composition) || 
        hasValue(safeGet(techPackData, 'tech_pack.materials.material_composition')) ||
        hasValue(mainFabric.weight) ||
        hasValue(mainFabric.characteristics) ||
        hasValue(mainFabric.supplier);

      if (hasMainFabricContent) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Main Fabric', margin, yPosition);
        yPosition += 7;
        
        addKeyValue('Composition', mainFabric.composition || safeGet(techPackData, 'tech_pack.materials.material_composition'));
        addKeyValue('Weight', mainFabric.weight);
        addKeyValue('Characteristics', mainFabric.characteristics);
        addKeyValue('Supplier', mainFabric.supplier);
        
        yPosition += 5;
      }

      // Trims
      if (hasArrayContent(trims)) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Trims', margin, yPosition);
        yPosition += 7;
        
        trims.forEach(trim => {
          checkPageBreak(6);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`• ${typeof trim === 'string' ? trim : (trim.name || trim.description || 'Trim')}`, margin + 3, yPosition);
          yPosition += 6;
        });
        
        yPosition += 3;
      }
    }

    // ===== BILL OF MATERIALS =====
    const hasBOMContent = 
      (techPackData?.bom?.structure === 'single' && hasArrayContent(techPackData.bom.flatItems)) ||
      (techPackData?.bom?.structure === 'multi' && hasArrayContent(techPackData.bom.sections));

    if (hasBOMContent) {
      addSectionHeader('Bill of Materials');

      // Single-level BOM
      if (techPackData.bom.structure === 'single' && hasArrayContent(techPackData.bom.flatItems)) {
        const headers = ['Item', 'Material', 'Qty', 'Unit', 'Color', 'Cost'];
        const rows = techPackData.bom.flatItems.map(item => [
          item.item || 'N/A',
          item.material || 'N/A',
          item.quantity || 0,
          item.unit || 'N/A',
          item.color || 'N/A',
          item.includeCost ? `$${(item.totalCost || 0).toFixed(2)}` : '-'
        ]);
        
        addTable(headers, rows);

        if (techPackData.bom.grandTotal > 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Grand Total: $${techPackData.bom.grandTotal.toFixed(2)}`, pageWidth - margin - 40, yPosition);
          yPosition += 8;
        }
      }

      // Multi-level BOM
      if (techPackData.bom.structure === 'multi' && hasArrayContent(techPackData.bom.sections)) {
        techPackData.bom.sections.forEach(section => {
          if (hasArrayContent(section.items)) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(section.name, margin, yPosition);
            yPosition += 7;

            const headers = ['Item', 'Material', 'Qty', 'Unit', 'Color', 'Cost'];
            const rows = section.items.map(item => [
              (item.level > 0 ? '  '.repeat(item.level) : '') + (item.item || 'N/A'),
              item.material || 'N/A',
              item.quantity || 0,
              item.unit || 'N/A',
              item.color || 'N/A',
              item.includeCost ? `$${(item.totalCost || 0).toFixed(2)}` : '-'
            ]);
            
            addTable(headers, rows);
          }
        });

        if (techPackData.bom.grandTotal > 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Grand Total: $${techPackData.bom.grandTotal.toFixed(2)}`, pageWidth - margin - 40, yPosition);
          yPosition += 8;
        }
      }
    }

    // ===== PRINTS & EMBELLISHMENTS =====
    const pe = techPackData?.tech_pack?.prints_and_embellishments;
    const hasPrintsContent = 
      hasArrayContent(pe?.print_techniques) ||
      hasArrayContent(pe?.embellishments) ||
      hasArrayContent(pe?.placements);

    if (hasPrintsContent) {
      addSectionHeader('Prints & Embellishments');

      if (hasArrayContent(pe.print_techniques)) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Print Techniques', margin, yPosition);
        yPosition += 6;
        
        pe.print_techniques.forEach(tech => {
          checkPageBreak(6);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`• ${tech}`, margin + 3, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      }

      if (hasArrayContent(pe.embellishments)) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Embellishments', margin, yPosition);
        yPosition += 6;
        
        pe.embellishments.forEach(emb => {
          checkPageBreak(6);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`• ${emb}`, margin + 3, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      }

      if (hasArrayContent(pe.placements)) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Placements', margin, yPosition);
        yPosition += 6;
        
        pe.placements.forEach(placement => {
          checkPageBreak(6);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`• ${placement}`, margin + 3, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      }
    }

    // ===== CONSTRUCTION NOTES =====
    const cn = techPackData?.tech_pack?.construction_notes;
    const hasConstructionContent = 
      hasArrayContent(cn?.seam_types) ||
      hasArrayContent(cn?.stitch_details) ||
      hasArrayContent(cn?.special_techniques) ||
      hasArrayContent(cn?.assembly_sequence);

    if (hasConstructionContent) {
      addSectionHeader('Construction Notes');

      if (hasArrayContent(cn.seam_types)) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Seam Types', margin, yPosition);
        yPosition += 6;
        
        cn.seam_types.forEach(seam => {
          checkPageBreak(6);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`• ${seam}`, margin + 3, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      }

      if (hasArrayContent(cn.stitch_details)) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Stitch Details', margin, yPosition);
        yPosition += 6;
        
        cn.stitch_details.forEach(stitch => {
          checkPageBreak(6);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`• ${stitch}`, margin + 3, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      }

      if (hasArrayContent(cn.special_techniques)) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Special Techniques', margin, yPosition);
        yPosition += 6;
        
        cn.special_techniques.forEach(tech => {
          checkPageBreak(6);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`• ${tech}`, margin + 3, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      }

      if (hasArrayContent(cn.assembly_sequence)) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Assembly Sequence', margin, yPosition);
        yPosition += 6;
        
        cn.assembly_sequence.forEach((step, idx) => {
          checkPageBreak(8);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const stepLines = pdf.splitTextToSize(`${idx + 1}. ${step}`, contentWidth - 5);
          stepLines.forEach(line => {
            pdf.text(line, margin + 3, yPosition);
            yPosition += 6;
          });
        });
        yPosition += 3;
      }
    }

    // ===== PACKAGING INSTRUCTIONS =====
    const pi = techPackData?.tech_pack?.packaging_instructions;
    const hasPackagingContent = 
      hasArrayContent(pi?.care_label_instructions) ||
      (pi?.polybag_packaging && (
        hasValue(pi.polybag_packaging.type) ||
        hasValue(pi.polybag_packaging.folding) ||
        hasValue(pi.polybag_packaging.accessories)
      ));

    if (hasPackagingContent) {
      addSectionHeader('Packaging Instructions');

      if (hasArrayContent(pi.care_label_instructions)) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Care Instructions', margin, yPosition);
        yPosition += 6;
        
        pi.care_label_instructions.forEach(inst => {
          checkPageBreak(6);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`✓ ${inst}`, margin + 3, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      }

      if (pi.polybag_packaging) {
        const poly = pi.polybag_packaging;
        const hasPolyContent = hasValue(poly.type) || hasValue(poly.folding) || hasValue(poly.accessories);
        
        if (hasPolyContent) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Polybag Packaging', margin, yPosition);
          yPosition += 6;
          
          addKeyValue('Type', poly.type);
          addKeyValue('Folding', poly.folding);
          addKeyValue('Accessories', poly.accessories);
          yPosition += 3;
        }
      }
    }

    // ===== NOTES =====
    if (hasArrayContent(techPackData?.notes)) {
      addSectionHeader('Notes');

      techPackData.notes.forEach(note => {
        if (note.type === 'general') {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(note.name || 'Note', margin, yPosition);
          yPosition += 6;

          if (hasValue(note.summary)) {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'italic');
            const summaryLines = pdf.splitTextToSize(note.summary, contentWidth);
            summaryLines.forEach(line => {
              checkPageBreak(6);
              pdf.text(line, margin, yPosition);
              yPosition += 6;
            });
          }

          if (hasArrayContent(note.items)) {
            pdf.setFont('helvetica', 'normal');
            note.items.forEach(item => {
              checkPageBreak(6);
              pdf.text(`• ${item.content || item}`, margin + 3, yPosition);
              yPosition += 6;
            });
          }
          yPosition += 3;
        } else if (note.type === 'checklist') {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(note.name || 'Checklist', margin, yPosition);
          yPosition += 6;

          if (hasArrayContent(note.items)) {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            note.items.forEach(item => {
              checkPageBreak(6);
              pdf.text(`${item.completed ? '☑' : '☐'} ${item.content}`, margin + 3, yPosition);
              yPosition += 6;
            });
          }
          yPosition += 3;
        }
      });
    }

    // ===== FOOTER =====
    const footerY = pageHeight - 10;
    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, footerY, { align: 'center' });

    // Generate filename and save
    const fileName = `${styleNumber.replace(/[^a-z0-9]/gi, '_')}_TechPack_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    console.log('PDF generated successfully:', fileName);
    return true;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
}