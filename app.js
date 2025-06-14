document.addEventListener('DOMContentLoaded', () => {
    const salesFormContainer = document.getElementById('salesFormContainer');
    const salesListContainer = document.getElementById('salesListContainer');
    const listButton = document.getElementById('listButton');
    const listButtonBack = document.getElementById('listButtonBack');
    const backToDashboardButton = document.getElementById('backToDashboardButton');
    const backToDashboardButtonList = document.getElementById('backToDashboardButtonList');

    const mainSalesForm = document.getElementById('mainSalesForm');
    const dateInput = document.getElementById('date');
    const salesInvoiceNoInput = document.getElementById('salesInvoiceNo');
    const descriptionInput = document.getElementById('description');
    const attachmentInput = document.getElementById('attachment');
    const customerCodeSelect = document.getElementById('customerCode');
    const customerNameSelect = document.getElementById('customerName');
    const customerAddressInput = document.getElementById('customerAddress');
    const telephoneInput = document.getElementById('telephone');
    const termsOfPaymentSelect = document.getElementById('termsOfPayment');
    const newTermInput = document.getElementById('newTermInput');
    const addTermButton = document.getElementById('addTermButton');
    const salesItemsTableBody = document.querySelector('#salesItemsTable tbody');
    const addItemButton = document.getElementById('addItemButton');
    const totalQuantitySpan = document.getElementById('totalQuantity');
    const grossAmountSpan = document.getElementById('grossAmount');
    const discountInput = document.getElementById('discount');
    const cashReceivedInput = document.getElementById('cashReceived');
    const finalNetAmountSpan = document.getElementById('finalNetAmount');
    const submitSalesButton = document.getElementById('submitSalesButton');
    const updateSalesButton = document.getElementById('updateSalesButton');
    const clearFormButton = document.getElementById('clearFormButton');
    const confirmClearFormButton = document.getElementById('confirmClearFormButton');
    const printFormButton = document.getElementById('printFormButton');

    const salesListTableBody = document.getElementById('salesListTableBody');
    const noEntriesMessage = document.getElementById('noEntriesMessage');

    const exportPdfButton = document.getElementById('exportPdfButton');
    const exportExcelButton = document.getElementById('exportExcelButton');
    const exportEmailButton = document.getElementById('exportEmailButton');
    const exportWhatsappButton = document.getElementById('exportWhatsappButton');
    const exportButtonForm = document.getElementById('exportButtonForm');
    const exportButtonList = document.getElementById('exportButtonList');

    let salesRecords = JSON.parse(localStorage.getItem('salesRecords')) || [];
    let currentEditIndex = -1;

    const generateSalesInvoiceNo = () => {
        const lastInvoiceNo = salesRecords.length > 0 ? salesRecords[salesRecords.length - 1].salesInvoiceNo : 'INV-000';
        const num = parseInt(lastInvoiceNo.split('-')[1]) + 1;
        return `INV-${String(num).padStart(3, '0')}`;
    };

    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];

    const updateCalculations = () => {
        let totalQuantity = 0;
        let grossAmount = 0;

        salesItemsTableBody.querySelectorAll('tr').forEach(row => {
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            const netAmount = qty * rate;
            row.querySelector('.item-net-amount').value = netAmount.toFixed(2);
            totalQuantity += qty;
            grossAmount += netAmount;
        });

        totalQuantitySpan.textContent = totalQuantity;
        grossAmountSpan.textContent = grossAmount.toFixed(2);

        const discount = parseFloat(discountInput.value) || 0;
        const cashReceived = parseFloat(cashReceivedInput.value) || 0;
        const finalNetAmount = grossAmount - discount;
        finalNetAmountSpan.textContent = finalNetAmount.toFixed(2);
    };

    const addItemRow = (item = {}) => {
        const newRow = salesItemsTableBody.insertRow();
        newRow.innerHTML = `
            <td><input type="text" class="form-control item-code" value="${item.itemCode || ''}"></td>
            <td>
                <select class="form-select item-description">
                    <option value="">Select Description</option>
                    <option ${item.description === 'Laptop' ? 'selected' : ''}>Laptop</option>
                    <option ${item.description === 'Monitor' ? 'selected' : ''}>Monitor</option>
                    <option ${item.description === 'Keyboard' ? 'selected' : ''}>Keyboard</option>
                    <option ${item.description === 'Mouse' ? 'selected' : ''}>Mouse</option>
                    <option ${item.description === 'Printer' ? 'selected' : ''}>Printer</option>
                </select>
            </td>
            <td><input type="number" class="form-control item-qty" value="${item.qty || 1}" min="1"></td>
            <td><input type="text" class="form-control item-unit" value="${item.unit || 'Unit'}"></td>
            <td><input type="number" class="form-control item-rate" value="${item.rate || 0}" min="0"></td>
            <td><input type="number" class="form-control item-net-amount" readonly value="${item.netAmount || 0}"></td>
            <td>
                <button type="button" class="btn btn-danger btn-sm delete-row">Delete</button>
            </td>
        `;

        newRow.querySelector('.delete-row').addEventListener('click', (e) => {
            e.target.closest('tr').remove();
            updateCalculations();
        });

        newRow.querySelectorAll('.item-qty, .item-rate').forEach(input => {
            input.addEventListener('input', updateCalculations);
        });

        updateCalculations();
    };

    addItemButton.addEventListener('click', () => addItemRow());

    const resetForm = () => {
        mainSalesForm.reset();
        salesInvoiceNoInput.value = generateSalesInvoiceNo();
        dateInput.value = today.toISOString().split('T')[0];
        salesItemsTableBody.innerHTML = '';
        addItemRow({ itemCode: 'ITM001', description: 'Laptop', qty: 1, unit: 'Unit', rate: 1000, netAmount: 1000 });
        totalQuantitySpan.textContent = '0';
        grossAmountSpan.textContent = '0.00';
        discountInput.value = '0';
        cashReceivedInput.value = '0';
        finalNetAmountSpan.textContent = '0.00';
        currentEditIndex = -1;
        submitSalesButton.style.display = 'block';
        updateSalesButton.style.display = 'none';
        attachmentInput.value = '';
    };

    const saveSalesRecord = (e) => {
        e.preventDefault();
        const salesItems = [];
        salesItemsTableBody.querySelectorAll('tr').forEach(row => {
            salesItems.push({
                itemCode: row.querySelector('.item-code').value,
                description: row.querySelector('.item-description').value,
                qty: parseFloat(row.querySelector('.item-qty').value),
                unit: row.querySelector('.item-unit').value,
                rate: parseFloat(row.querySelector('.item-rate').value),
                netAmount: parseFloat(row.querySelector('.item-net-amount').value)
            });
        });

        const formData = {
            id: salesRecords.length > 0 ? Math.max(...salesRecords.map(s => s.id)) + 1 : 1,
            date: dateInput.value,
            salesInvoiceNo: salesInvoiceNoInput.value,
            description: descriptionInput.value,
            attachment: attachmentInput.value,
            customerCode: customerCodeSelect.value,
            customerName: customerNameSelect.value,
            customerAddress: customerAddressInput.value,
            telephone: telephoneInput.value,
            termsOfPayment: termsOfPaymentSelect.value,
            salesItems: salesItems,
            totalQuantity: parseFloat(totalQuantitySpan.textContent),
            grossAmount: parseFloat(grossAmountSpan.textContent),
            discount: parseFloat(discountInput.value),
            cashReceived: parseFloat(cashReceivedInput.value),
            finalNetAmount: parseFloat(finalNetAmountSpan.textContent)
        };

        if (currentEditIndex === -1) {
            salesRecords.push(formData);
            Swal.fire('Saved!', 'New sales record has been added.', 'success');
        } else {
            salesRecords[currentEditIndex] = formData;
            Swal.fire('Updated!', 'Sales record has been updated.', 'success');
        }

        localStorage.setItem('salesRecords', JSON.stringify(salesRecords));
        renderSalesList();
        resetForm();
    };

    mainSalesForm.addEventListener('submit', saveSalesRecord);
    updateSalesButton.addEventListener('click', saveSalesRecord);

    discountInput.addEventListener('input', updateCalculations);
    cashReceivedInput.addEventListener('input', updateCalculations);

    addTermButton.addEventListener('click', () => {
        const newTerm = newTermInput.value.trim();
        if (newTerm) {
            const option = document.createElement('option');
            option.value = newTerm;
            option.textContent = newTerm;
            termsOfPaymentSelect.appendChild(option);
            newTermInput.value = '';
            const modal = bootstrap.Modal.getInstance(document.getElementById('termsModal'));
            modal.hide();
            Swal.fire('Added!', 'New term of payment has been added.', 'success');
        } else {
            Swal.fire('Error!', 'Please enter a term of payment.', 'error');
        }
    });

    confirmClearFormButton.addEventListener('click', () => {
        resetForm();
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
        modal.hide();
        Swal.fire('Cleared!', 'The form has been cleared.', 'info');
    });

    const renderSalesList = () => {
        salesListTableBody.innerHTML = '';
        if (salesRecords.length === 0) {
            noEntriesMessage.style.display = 'block';
            return;
        }
        noEntriesMessage.style.display = 'none';

        salesRecords.forEach((record, index) => {
            const row = salesListTableBody.insertRow();
            row.innerHTML = `
                <td>${record.id}</td>
                <td>${record.date}</td>
                <td>${record.salesInvoiceNo}</td>
                <td>${record.customerName}</td>
                <td>${record.grossAmount.toFixed(2)}</td>
                <td>${record.discount.toFixed(2)}</td>
                <td>${record.cashReceived.toFixed(2)}</td>
                <td>${record.finalNetAmount.toFixed(2)}</td>
                <td>
                    <button type="button" class="btn btn-primary btn-sm view-btn" data-index="${index}"><i class="bi bi-eye"></i> View</button>
                    <button type="button" class="btn btn-info btn-sm edit-btn" data-index="${index}"><i class="bi bi-pencil"></i> Edit</button>
                    <button type="button" class="btn btn-danger btn-sm delete-btn" data-index="${index}"><i class="bi bi-trash"></i> Delete</button>
                </td>
            `;
        });

        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                viewSalesRecord(salesRecords[index]);
            });
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                editSalesRecord(index);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                Swal.fire({
                    title: 'Are you sure?',
                    text: "You won't be able to revert this!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, delete it!'
                }).then((result) => {
                    if (result.isConfirmed) {
                        salesRecords.splice(index, 1);
                        localStorage.setItem('salesRecords', JSON.stringify(salesRecords));
                        renderSalesList();
                        Swal.fire('Deleted!', 'The sales record has been deleted.', 'success');
                    }
                });
            });
        });
    };

    const populateFormWithData = (data) => {
        dateInput.value = data.date;
        salesInvoiceNoInput.value = data.salesInvoiceNo;
        descriptionInput.value = data.description;
        attachmentInput.value = data.attachment;
        customerCodeSelect.value = data.customerCode;
        customerNameSelect.value = data.customerName;
        customerAddressInput.value = data.customerAddress;
        telephoneInput.value = data.telephone;
        termsOfPaymentSelect.value = data.termsOfPayment;

        salesItemsTableBody.innerHTML = '';
        data.salesItems.forEach(item => addItemRow(item));

        discountInput.value = data.discount;
        cashReceivedInput.value = data.cashReceived;
        updateCalculations();
    };

    const viewSalesRecord = (record) => {
        let itemsHtml = record.salesItems.map(item => `
            <tr>
                <td>${item.itemCode}</td>
                <td>${item.description}</td>
                <td>${item.qty}</td>
                <td>${item.unit}</td>
                <td>${item.rate.toFixed(2)}</td>
                <td>${item.netAmount.toFixed(2)}</td>
            </tr>
        `).join('');

        Swal.fire({
            title: `Sales Invoice: ${record.salesInvoiceNo}`,
            html: `
                <div class="text-start">
                    <p><strong>Date:</strong> ${record.date}</p>
                    <p><strong>Description:</strong> ${record.description}</p>
                    <p><strong>Attachment:</strong> ${record.attachment}</p>
                    <p><strong>Customer:</strong> ${record.customerName} (${record.customerCode})</p>
                    <p><strong>Address:</strong> ${record.customerAddress}</p>
                    <p><strong>Telephone:</strong> ${record.telephone}</p>
                    <p><strong>Terms of Payment:</strong> ${record.termsOfPayment}</p>
                    <h5>Items:</h5>
                    <table class="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Description</th>
                                <th>Qty</th>
                                <th>Unit</th>
                                <th>Rate</th>
                                <th>Net Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <p><strong>Total Quantity:</strong> ${record.totalQuantity}</p>
                    <p><strong>Gross Amount:</strong> ${record.grossAmount.toFixed(2)}</p>
                    <p><strong>Discount:</strong> ${record.discount.toFixed(2)}</p>
                    <p><strong>Cash Received:</strong> ${record.cashReceived.toFixed(2)}</p>
                    <p class="fs-5 fw-bold">Final Net Amount: ${record.finalNetAmount.toFixed(2)}</p>
                </div>
            `,
            width: '80%',
            confirmButtonText: 'Close'
        });
    };

    const editSalesRecord = (index) => {
        currentEditIndex = index;
        const recordToEdit = salesRecords[index];
        populateFormWithData(recordToEdit);
        salesFormContainer.style.display = 'block';
        salesListContainer.style.display = 'none';
        submitSalesButton.style.display = 'none';
        updateSalesButton.style.display = 'block';
        window.scrollTo(0, 0);
    };

    listButton.addEventListener('click', () => {
        salesFormContainer.style.display = 'none';
        salesListContainer.style.display = 'block';
        renderSalesList();
    });

    listButtonBack.addEventListener('click', () => {
        salesFormContainer.style.display = 'block';
        salesListContainer.style.display = 'none';
        resetForm();
    });

    backToDashboardButton.addEventListener('click', () => {
        Swal.fire({
            title: 'Go to Dashboard',
            text: 'Are you sure you want to go back to the dashboard? Any unsaved changes will be lost.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, go to Dashboard'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'dashboard.html';
            }
        });
    });

    backToDashboardButtonList.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    printFormButton.addEventListener('click', () => {
        printSalesRecord(getFormData());
    });

    function getFormData() {
        const salesItems = [];
        salesItemsTableBody.querySelectorAll('tr').forEach(row => {
            salesItems.push({
                itemCode: row.querySelector('.item-code').value,
                description: row.querySelector('.item-description').value,
                qty: parseFloat(row.querySelector('.item-qty').value),
                unit: row.querySelector('.item-unit').value,
                rate: parseFloat(row.querySelector('.item-rate').value),
                netAmount: parseFloat(row.querySelector('.item-net-amount').value)
            });
        });

        return {
            date: dateInput.value,
            salesInvoiceNo: salesInvoiceNoInput.value,
            description: descriptionInput.value,
            attachment: attachmentInput.value,
            customerCode: customerCodeSelect.value,
            customerName: customerNameSelect.value,
            customerAddress: customerAddressInput.value,
            telephone: telephoneInput.value,
            termsOfPayment: termsOfPaymentSelect.value,
            salesItems: salesItems,
            totalQuantity: parseFloat(totalQuantitySpan.textContent),
            grossAmount: parseFloat(grossAmountSpan.textContent),
            discount: parseFloat(discountInput.value),
            cashReceived: parseFloat(cashReceivedInput.value),
            finalNetAmount: parseFloat(finalNetAmountSpan.textContent)
        };
    }

    function printSalesRecord(record) {
        const printWindow = window.open('', '', 'height=700,width=900');
        printWindow.document.write('<html><head><title>Sales Invoice</title>');
        printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { text-align: center; color: #0d6efd; margin-bottom: 20px; }
            .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .info-row span:first-child { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total-section { margin-top: 20px; text-align: right; }
            .total-section div { margin-bottom: 5px; }
            .total-section strong { font-size: 1.1em; }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write('<div class="container">');
        printWindow.document.write('<h2 class="text-primary">Sales Invoice</h2>');

        printWindow.document.write('<div class="row">');
        printWindow.document.write(`<div class="col-6">`);
        printWindow.document.write(`<p><strong>Date:</strong> ${record.date}</p>`);
        printWindow.document.write(`</div>`);
        printWindow.document.write(`<div class="col-6 text-end">`);
        printWindow.document.write(`<p><strong>Invoice No.:</strong> ${record.salesInvoiceNo}</p>`);
        printWindow.document.write(`</div>`);
        printWindow.document.write(`</div>`);

        printWindow.document.write(`<p><strong>Description:</strong> ${record.description}</p>`);
        printWindow.document.write(`<p><strong>Attachment:</strong> ${record.attachment}</p>`);

        printWindow.document.write('<div class="section-title">Customer Details</div>');
        printWindow.document.write(`<p><strong>Customer Code:</strong> ${record.customerCode}</p>`);
        printWindow.document.write(`<p><strong>Customer Name:</strong> ${record.customerName}</p>`);
        printWindow.document.write(`<p><strong>Address:</strong> ${record.customerAddress}</p>`);
        printWindow.document.write(`<p><strong>Telephone:</strong> ${record.telephone}</p>`);
        printWindow.document.write(`<p><strong>Terms of Payment:</strong> ${record.termsOfPayment}</p>`);

        printWindow.document.write('<div class="section-title">Sales Items</div>');
        printWindow.document.write('<table class="table table-bordered table-sm">');
        printWindow.document.write('<thead><tr><th>Item Code</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Net Amount</th></tr></thead>');
        printWindow.document.write('<tbody>');
        record.salesItems.forEach(item => {
            printWindow.document.write(`
                <tr>
                    <td>${item.itemCode}</td>
                    <td>${item.description}</td>
                    <td>${item.qty}</td>
                    <td>${item.unit}</td>
                    <td>${item.rate.toFixed(2)}</td>
                    <td>${item.netAmount.toFixed(2)}</td>
                </tr>
            `);
        });
        printWindow.document.write('</tbody></table>');

        printWindow.document.write('<div class="total-section">');
        printWindow.document.write(`<div><strong>Total Quantity:</strong> ${record.totalQuantity}</div>`);
        printWindow.document.write(`<div><strong>Gross Amount:</strong> ${record.grossAmount.toFixed(2)}</div>`);
        printWindow.document.write(`<div><strong>Discount:</strong> ${record.discount.toFixed(2)}</div>`);
        printWindow.document.write(`<div><strong>Cash Received:</strong> ${record.cashReceived.toFixed(2)}</div>`);
        printWindow.document.write(`<div><strong>Final Net Amount:</strong> ${record.finalNetAmount.toFixed(2)}</div>`);
        printWindow.document.write('</div>');

        printWindow.document.write('</div></body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    exportButtonForm.addEventListener('click', () => {
        const currentData = getFormData();
        if (!currentData.salesInvoiceNo) {
            Swal.fire('No Data', 'Please fill the form to export current sales record.', 'warning');
            return;
        }
        document.getElementById('exportPdfButton').onclick = () => downloadSalesPdf([currentData]);
        document.getElementById('exportExcelButton').onclick = () => exportSalesToExcel([currentData]);
        document.getElementById('exportEmailButton').onclick = () => exportSalesToEmail([currentData]);
        document.getElementById('exportWhatsappButton').onclick = () => exportSalesToWhatsApp([currentData]);
    });

    exportButtonList.addEventListener('click', () => {
        if (salesRecords.length === 0) {
            Swal.fire('No Data', 'There are no sales records in the list to export.', 'warning');
            return;
        }
        document.getElementById('exportPdfButton').onclick = () => downloadSalesPdf(salesRecords);
        document.getElementById('exportExcelButton').onclick = () => exportSalesToExcel(salesRecords);
        document.getElementById('exportEmailButton').onclick = () => exportSalesToEmail(salesRecords);
        document.getElementById('exportWhatsappButton').onclick = () => exportSalesToWhatsApp(salesRecords);
    });

    function downloadSalesPdf(records) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        records.forEach((record, recordIndex) => {
            if (recordIndex > 0) {
                doc.addPage();
            }

            doc.setFontSize(18);
            doc.text("Sales Invoice", 105, 20, null, null, "center");
            doc.setFontSize(10);

            let y = 30;
            doc.text(`Date: ${record.date}`, 14, y);
            doc.text(`Invoice No.: ${record.salesInvoiceNo}`, 14, y + 5);
            doc.text(`Description: ${record.description}`, 14, y + 10);
            doc.text(`Attachment: ${record.attachment}`, 14, y + 15);

            y += 25;
            doc.setFontSize(12);
            doc.text("Customer Details", 14, y);
            doc.setFontSize(10);
            doc.text(`Customer Code: ${record.customerCode}`, 14, y + 5);
            doc.text(`Customer Name: ${record.customerName}`, 14, y + 10);
            doc.text(`Address: ${record.customerAddress}`, 14, y + 15);
            doc.text(`Telephone: ${record.telephone}`, 14, y + 20);
            doc.text(`Terms of Payment: ${record.termsOfPayment}`, 14, y + 25);

            y += 35;
            doc.setFontSize(12);
            doc.text("Sales Items", 14, y);
            doc.setFontSize(10);

            const tableColumn = ["Item Code", "Description", "Qty", "Unit", "Rate", "Net Amount"];
            const tableRows = record.salesItems.map(item => [
                item.itemCode,
                item.description,
                item.qty,
                item.unit,
                item.rate.toFixed(2),
                item.netAmount.toFixed(2)
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: y + 5,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [22, 160, 133], textColor: 255 },
                margin: { top: 10 }
            });

            y = doc.autoTable.previous.finalY + 10;

            doc.setFontSize(10);
            doc.text(`Total Quantity: ${record.totalQuantity}`, 14, y);
            doc.text(`Gross Amount: ${record.grossAmount.toFixed(2)}`, 14, y + 5);
            doc.text(`Discount: ${record.discount.toFixed(2)}`, 14, y + 10);
            doc.text(`Cash Received: ${record.cashReceived.toFixed(2)}`, 14, y + 15);
            doc.setFontSize(12);
            doc.text(`Final Net Amount: ${record.finalNetAmount.toFixed(2)}`, 14, y + 25);
        });

        doc.save('sales_invoice.pdf');
        Swal.fire('Exported!', 'Sales data exported to PDF.', 'success');
    }

    function exportSalesToExcel(records) {
        const data = records.map(record => {
            const items = record.salesItems.map(item =>
                `Item Code: ${item.itemCode}, Description: ${item.description}, Qty: ${item.qty}, Unit: ${item.unit}, Rate: ${item.rate}, Net Amount: ${item.netAmount}`
            ).join('; ');
            return {
                ID: record.id,
                Date: record.date,
                'Invoice No.': record.salesInvoiceNo,
                Description: record.description,
                Attachment: record.attachment,
                'Customer Code': record.customerCode,
                'Customer Name': record.customerName,
                Address: record.customerAddress,
                Telephone: record.telephone,
                'Terms of Payment': record.termsOfPayment,
                'Sales Items': items,
                'Total Quantity': record.totalQuantity,
                'Gross Amount': record.grossAmount,
                Discount: record.discount,
                'Cash Received': record.cashReceived,
                'Final Net Amount': record.finalNetAmount
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sales Records");
        XLSX.writeFile(wb, "sales_records.xlsx");
        Swal.fire('Exported!', 'Sales data exported to Excel.', 'success');
    }

    function exportSalesToEmail(records) {
        const subject = 'Sales Invoice Data';
        let body = 'Please find the sales invoice data attached or copied below:\n\n';

        records.forEach(record => {
            body += `Invoice No: ${record.salesInvoiceNo}\n`;
            body += `Date: ${record.date}\n`;
            body += `Description: ${record.description}\n`;
            body += `Attachment: ${record.attachment}\n`;
            body += `Customer Name: ${record.customerName}\n`;
            body += `Gross Amount: ${record.grossAmount.toFixed(2)}\n`;
            body += `Discount: ${record.discount.toFixed(2)}\n`;
            body += `Cash Received: ${record.cashReceived.toFixed(2)}\n`;
            body += `Final Net Amount: ${record.finalNetAmount.toFixed(2)}\n`;
            body += `\nSales Items:\n`;
            record.salesItems.forEach(item => {
                body += `  - ${item.description} (Qty: ${item.qty}, Rate: ${item.rate.toFixed(2)}, Net: ${item.netAmount.toFixed(2)})\n`;
            });
            body += `\n---\n\n`;
        });

        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
        Swal.fire('Exported!', 'Sales data prepared for email.', 'success');
    }

    function exportSalesToWhatsApp(records) {
        let message = 'Sales Invoice Data:\n\n';

        records.forEach(record => {
            message += `*Invoice No:* ${record.salesInvoiceNo}\n`;
            message += `*Date:* ${record.date}\n`;
            message += `*Description:* ${record.description}\n`;
            message += `*Attachment:* ${record.attachment}\n`;
            message += `*Customer:* ${record.customerName}\n`;
            message += `*Gross Amount:* ${record.grossAmount.toFixed(2)}\n`;
            message += `*Discount:* ${record.discount.toFixed(2)}\n`;
            message += `*Cash Received:* ${record.cashReceived.toFixed(2)}\n`;
            message += `*Final Net Amount:* ${record.finalNetAmount.toFixed(2)}\n`;
            message += `\n*Items:*\n`;
            record.salesItems.forEach(item => {
                message += `  - ${item.description} (Qty: ${item.qty}, Rate: ${item.rate.toFixed(2)}, Net: ${item.netAmount.toFixed(2)})\n`;
            });
            message += `\n-------------------\n\n`;
        });

        const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappLink, '_blank');
        Swal.fire('Exported!', 'Sales data prepared for WhatsApp.', 'success');
    }

    resetForm();
    renderSalesList();
});
