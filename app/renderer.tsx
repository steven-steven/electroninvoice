import { BrowserWindow, app } from 'electron';
import { Invoice } from './features/invoice/invoiceSlice';

const { dialog } = require('electron');
const fs = require('fs');
const PDFDocument = require('./pdfkit.standalone');

type DocType = typeof PDFDocument;

function generateTableRow(
  doc: DocType,
  y: number,
  item: string,
  description: string,
  unitCost: string | number,
  quantity: string | number,
  lineTotal: string
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: 'right' })
    .text(quantity, 370, y, { width: 90, align: 'right' })
    .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc: DocType, y: number) {
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function formatCurrency(cents: number) {
  // return `$${(cents / 100).toFixed(2)}`;
  const priceFormatted = new Intl.NumberFormat('ID').format(cents);
  return `IDR ${priceFormatted}`;
}

function generateHeader(doc: DocType) {
  doc
    .image('./resources/icon.png', 50, 45, { width: 50 })
    .fillColor('#444444')
    .fontSize(20)
    .text('Pt. Dwiprima Karyaguna', 110, 57)
    .fontSize(10)
    .text('Pt. Dwiprima Karyaguna', 200, 50, { align: 'right' })
    .text('Jln. Raya Anyer Km. 122', 200, 65, { align: 'right' })
    .text('​Cilegon, Banten, Indonesia', 200, 80, { align: 'right' })
    .moveDown();
}

function generateCustomerInformation(doc: DocType, invoice: Invoice) {
  doc.fillColor('#444444').fontSize(20).text('Invoice', 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text('Invoice Number:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text(invoice.id, 150, customerInformationTop)
    .font('Helvetica')
    .text('Invoice Date:', 50, customerInformationTop + 15)
    .text(invoice.date, 150, customerInformationTop + 15)
    .text('Balance Due:', 50, customerInformationTop + 30)
    .text(formatCurrency(invoice.total), 150, customerInformationTop + 30)

    .font('Helvetica-Bold')
    .text(invoice.client, 300, customerInformationTop);

  if (invoice.client_address) {
    const addressLine1 = invoice.client_address.address;
    const addressLine2 = [
      invoice.client_address.city,
      invoice.client_address.state,
      invoice.client_address.country,
    ]
      .filter(Boolean)
      .join(', ');

    if (addressLine1) {
      doc
        .font('Helvetica')
        .text(addressLine1, 300, customerInformationTop + 15);
    }
    if (addressLine2) {
      doc.text(addressLine2, 300, customerInformationTop + 30);
    }
  }

  doc.moveDown();
  generateHr(doc, 252);
}

function generateInvoiceTable(doc: DocType, invoice: Invoice) {
  let i;
  const invoiceTableTop = 330;

  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    invoiceTableTop,
    'No.',
    'Nama Barang/Jasa',
    'Harga Satuan',
    'Kuantum',
    'Jumlah'
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font('Helvetica');

  for (i = 0; i < invoice.items.length; i += 1) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      (i + 1).toString(),
      item.name,
      formatCurrency(item.rate),
      item.quantity,
      formatCurrency(item.amount)
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(
    doc,
    subtotalPosition,
    '',
    '',
    'Subtotal',
    '',
    formatCurrency(invoice.total - invoice.tax)
  );

  const paidToDatePosition = subtotalPosition + 20;
  generateTableRow(
    doc,
    paidToDatePosition,
    '',
    '',
    'Tax',
    '',
    formatCurrency(invoice.tax)
  );

  const duePosition = paidToDatePosition + 25;
  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    duePosition,
    '',
    '',
    'Grand Total',
    '',
    formatCurrency(invoice.total)
  );
  doc.font('Helvetica');
}

function generateFooter(doc: DocType) {
  doc.fontSize(10).text('Thank you for your business.', 50, 780, {
    align: 'center',
    width: 500,
  });
}

function createInvoice(invoice: DocType, path: string) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc);

  doc.end();
  doc.pipe(fs.createWriteStream(path));
}

export default {
  save(win: BrowserWindow, invoice: Invoice) {
    const options = {
      title: 'Save file',
      defaultPath: `${app.getPath('downloads')}/invoice_${invoice.id}`,
      buttonLabel: 'Save',

      filters: [
        { name: 'pdf', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    };

    return dialog.showSaveDialog(win, options).then((result) => {
      const savePath = result.filePath;
      if (savePath === undefined) {
        throw new Error('undefined filename');
      }
      createInvoice(invoice, savePath);
      return savePath;
    });
  },
};
