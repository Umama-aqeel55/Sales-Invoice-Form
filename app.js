document.addEventListener('DOMContentLoaded', function () {
    const salesFormContainer = document.getElementById('salesFormContainer');
    const mainSalesFormElement = document.getElementById('mainSalesForm');   

    const addItemButton = document.getElementById('addItemButton');
    const salesItemsTableBody = document.querySelector('#salesItemsTable tbody');
    const termsOfPaymentSelect = document.getElementById('termsOfPayment');
    const newTermInput = document.getElementById('newTermInput');
    const addTermButton = document.getElementById('addTermButton');
    const listButton = document.getElementById('listButton'); 
    const listButtonBack = document.getElementById('listButtonBack'); 

    const printFormButton = document.getElementById('printFormButton');
    const confirmClearFormButton = document.getElementById('confirmClearFormButton');
    const submitSalesButton = document.getElementById('submitSalesButton');
    const updateSalesButton = document.getElementById('updateSalesButton');
    const clearFormButton = document.getElementById('clearFormButton');

    const salesListContainer = document.getElementById('salesListContainer');
    const salesListTableBody = document.getElementById('salesListTableBody');
    const noEntriesMessage = document.getElementById('noEntriesMessage');

    const backToDashboardButton = document.getElementById('backToDashboardButton'); 
    const backToDashboardButtonList = document.getElementById('backToDashboardButtonList'); 

    const exportButtonForm = document.getElementById('exportButtonForm');
    const exportButtonList = document.getElementById('exportButtonList');
    const exportPdfButton = document.getElementById('exportPdfButton');
    const exportExcelButton = document.getElementById('exportExcelButton');
    const exportWhatsappButton = document.getElementById('exportWhatsappButton');
    const exportEmailButton = document.getElementById('exportEmailButton'); 

    const exportOptionsModal = new bootstrap.Modal(document.getElementById('exportOptionsModal'));

    const totalQuantityField = document.getElementById('totalQuantity');
    const grossAmountField = document.getElementById('grossAmount');
    const discountInput = document.getElementById('discount');
    const cashReceivedInput = document.getElementById('cashReceived');
    const finalNetAmountField = document.getElementById('finalNetAmount');

    const salesInvoiceNoInput = document.getElementById('salesInvoiceNo');

    let salesRecords = [];
    let nextSalesId = 1; 
    let nextInvoiceNumber = 1001; 
    let currentMode = 'add';
    let editingRecordId = null;


    function calculateRowNetAmount(row) {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        const netAmount = qty * rate;
        row.querySelector('.item-net-amount').value = netAmount.toFixed(2);
        updateAllTotals(); 
    }

    function updateAllTotals() {
        let totalQty = 0;
        let grossAmt = 0;

        salesItemsTableBody.querySelectorAll('tr').forEach(row => {
            const qtyInput = row.querySelector('.item-qty');
            const netAmountInput = row.querySelector('.item-net-amount');

            if (qtyInput) {
                totalQty += parseFloat(qtyInput.value) || 0;
            }
            if (netAmountInput) {
                grossAmt += parseFloat(netAmountInput.value) || 0;
            }
        });

        const discount = parseFloat(discountInput.value) || 0;
        const cashReceived = parseFloat(cashReceivedInput.value) || 0;

        const finalNet = grossAmt - discount - cashReceived;

        totalQuantityField.textContent = totalQty;
        grossAmountField.textContent = grossAmt.toFixed(2);
        finalNetAmountField.textContent = finalNet.toFixed(2);
    }

    function attachRowEventListeners(row) {
        const qtyInput = row.querySelector('.item-qty');
        const rateInput = row.querySelector('.item-rate');
        const deleteButton = row.querySelector('.delete-row');

        if (qtyInput) {
            qtyInput.addEventListener('input', () => calculateRowNetAmount(row));
        }
        if (rateInput) {
            rateInput.addEventListener('input', () => calculateRowNetAmount(row));
        }

        if (deleteButton) {
            deleteButton.addEventListener('click', function() {
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
                        row.remove();
                        updateAllTotals(); 
                        Swal.fire(
                            'Deleted!',
                            'Your item has been deleted.',
                            'success'
                        );
                    }
                });
            });
        }
    }


    function setFormFieldsReadonly(readonly) {
        const excludedButtons = [
            'addTermButton', 'addItemButton', 'submitSalesButton', 'updateSalesButton',
            'printFormButton', 'clearFormButton', 'listButton', 'listButtonBack',
            'exportButtonForm', 'exportButtonList', 'exportPdfButton', 'exportExcelButton', 'exportWhatsappButton', 'exportEmailButton', 
            'backToDashboardButton', 'backToDashboardButtonList'
        ];

        const formElements = mainSalesFormElement.querySelectorAll('input, select, textarea, button');
        formElements.forEach(element => {
            if (excludedButtons.includes(element.id)) {
                return;
            }
            if (element.id === 'salesInvoiceNo') {
                 element.setAttribute('readonly', 'readonly');
                 element.setAttribute('tabindex', '-1');
                 return;
            }

            if (readonly) {
                element.setAttribute('readonly', 'readonly');
                element.setAttribute('tabindex', '-1');
                if (element.tagName === 'SELECT') {
                    element.style.pointerEvents = 'none';
                }
            } else {
                element.removeAttribute('readonly');
                element.removeAttribute('tabindex');
                if (element.tagName === 'SELECT') {
                    element.style.pointerEvents = 'auto';
                }
            }
        });

        const deleteRowButtons = salesItemsTableBody.querySelectorAll('.delete-row');
        if (readonly) {
            addItemButton.style.display = 'none';
            deleteRowButtons.forEach(btn => btn.style.display = 'none');
            discountInput.setAttribute('readonly', 'readonly');
            cashReceivedInput.setAttribute('readonly', 'readonly');

        } else {
            addItemButton.style.display = 'inline-block';
            deleteRowButtons.forEach(btn => btn.style.display = 'inline-block');
            discountInput.removeAttribute('readonly');
            cashReceivedInput.removeAttribute('readonly');
        }
    }

    function populateFormWithData(record, readonly = false) {
        document.getElementById('date').value = record.date;
        salesInvoiceNoInput.value = record.salesInvoiceNo; 
        document.getElementById('description').value = record.description;

        document.getElementById('customerCode').value = record.customerCode;
        document.getElementById('customerName').value = record.customerName;

        document.getElementById('customerAddress').value = record.customerAddress;
        document.getElementById('telephone').value = record.telephone;

        const termsSelect = document.getElementById('termsOfPayment');
        if (!Array.from(termsSelect.options).some(option => option.value === record.termsOfPayment)) {
            const newOption = document.createElement('option');
            newOption.value = record.termsOfPayment;
            newOption.textContent = record.termsOfPayment;
            termsSelect.appendChild(newOption);
        }
        termsSelect.value = record.termsOfPayment;

        salesItemsTableBody.innerHTML = '';
        record.items.forEach(item => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="text" class="form-control item-code" value="${item.itemCode}" ${readonly ? 'readonly' : ''}></td>
                <td>
                    <select class="form-select item-description" ${readonly ? 'readonly style="pointer-events: none;"' : ''}>
                        <option value="${item.description}" selected>${item.description}</option>
                        <option>Laptop</option>
                        <option>Monitor</option>
                        <option>Keyboard</option>
                        <option>Mouse</option>
                        <option>Printer</option>
                    </select>
                </td>
                <td><input type="number" class="form-control item-qty" value="${item.qty}" min="1" ${readonly ? 'readonly' : ''}></td>
                <td><input type="text" class="form-control item-unit" value="${item.unit}" ${readonly ? 'readonly' : ''}></td>
                <td><input type="number" class="form-control item-rate" value="${item.rate}" min="0" ${readonly ? 'readonly' : ''}></td>
                <td><input type="number" class="form-control item-net-amount" readonly value="${item.netAmount.toFixed(2)}"></td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm delete-row" ${readonly ? 'style="display: none;"' : ''}>Delete</button>
                </td>
            `;
            salesItemsTableBody.appendChild(newRow);
            if (!readonly) {
                attachRowEventListeners(newRow);
            }
        });

        discountInput.value = record.discount || 0;
        cashReceivedInput.value = record.cashReceived || 0;

        updateAllTotals(); 

        setFormFieldsReadonly(readonly);
    }

    function resetForm() {
        mainSalesFormElement.reset();
        currentMode = 'add';
        editingRecordId = null;

        salesInvoiceNoInput.value = nextInvoiceNumber;

        salesItemsTableBody.innerHTML = `
            <tr>
                <td>
                    <input type="text" class="form-control item-code" value="ITM001">
                </td>
                <td>
                    <select class="form-select item-description">
                        <option selected>Select Description</option>
                        <option>Laptop</option>
                        <option>Monitor</option>
                        <option>Keyboard</option>
                        <option>Mouse</option>
                        <option>Printer</option>
                    </select>
                </td>
                <td><input type="number" class="form-control item-qty" value="1" min="1"></td>
                <td><input type="text" class="form-control item-unit" value="Unit"></td>
                <td><input type="number" class="form-control item-rate" value="1000" min="0"></td>
                <td><input type="number" class="form-control item-net-amount" readonly value="1000"></td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm delete-row">Delete</button>
                </td>
            </tr>
        `;
        attachRowEventListeners(salesItemsTableBody.querySelector('tr'));

        discountInput.value = '0';
        cashReceivedInput.value = '0';

        updateAllTotals(); 

        setFormFieldsReadonly(false);
        submitSalesButton.style.display = 'inline-block';
        updateSalesButton.style.display = 'none';
        clearFormButton.style.display = 'inline-block';
        addItemButton.style.display = 'inline-block';
    }

    function setFormMode(mode, record = null) {
        currentMode = mode;
        if (mode === 'add') {
            resetForm();
            salesFormContainer.style.display = 'block'; 
            salesListContainer.style.display = 'none';

            backToDashboardButton.style.display = 'inline-block';
            listButton.style.display = 'inline-block'; 
            exportButtonForm.style.display = 'inline-block';
            listButtonBack.style.display = 'none';
            backToDashboardButtonList.style.display = 'none';
            exportButtonList.style.display = 'none';

        } else if (mode === 'edit') {
            if (!record) {
                console.error("Record is required for edit mode.");
                return;
            }
            editingRecordId = record.id;
            populateFormWithData(record, false);
            salesFormContainer.style.display = 'block'; 
            salesListContainer.style.display = 'none';

            
            backToDashboardButton.style.display = 'inline-block';
            listButton.style.display = 'none'; 
            exportButtonForm.style.display = 'inline-block';
            listButtonBack.style.display = 'none';
            backToDashboardButtonList.style.display = 'none';
            exportButtonList.style.display = 'none';

            submitSalesButton.style.display = 'none';
            updateSalesButton.style.display = 'inline-block';
            clearFormButton.style.display = 'inline-block';
            addItemButton.style.display = 'inline-block';
        } else if (mode === 'view') {
            if (!record) {
                console.error("Record is required for view mode.");
                return;
            }
            editingRecordId = record.id;
            populateFormWithData(record, true);
            salesFormContainer.style.display = 'block'; 
            salesListContainer.style.display = 'none';

            backToDashboardButton.style.display = 'inline-block';
            listButton.style.display = 'none'; 
            exportButtonForm.style.display = 'inline-block'; 
            listButtonBack.style.display = 'none';
            backToDashboardButtonList.style.display = 'none';
            exportButtonList.style.display = 'none';

            submitSalesButton.style.display = 'none';
            updateSalesButton.style.display = 'none';
            clearFormButton.style.display = 'none';
            addItemButton.style.display = 'none';
        } else if (mode === 'list') {
            salesFormContainer.style.display = 'none'; 
            salesListContainer.style.display = 'block';

            backToDashboardButton.style.display = 'none';
            listButton.style.display = 'none'; 
            exportButtonForm.style.display = 'none'; 
            backToDashboardButtonList.style.display = 'inline-block';
            listButtonBack.style.display = 'inline-block';
            exportButtonList.style.display = 'inline-block'; 

            renderSalesList();
        }
    }

    function exportSalesToExcel() {
        if (salesRecords.length === 0) {
            Swal.fire('No Data', 'There are no sales records to export.', 'info');
            return;
        }

        const dataForExcel = salesRecords.map(record => {
            const itemsSummary = record.items.map(item =>
                `${item.description} (Qty: ${item.qty}, Rate: ${item.rate})`
            ).join('; ');

            return {
                'ID': record.id,
                'Date': record.date,
                'Invoice No.': record.salesInvoiceNo,
                'Description (Overall)': record.description,
                'Customer Code': record.customerCode,
                'Customer Name': record.customerName,
                'Customer Address': record.customerAddress,
                'Telephone': record.telephone,
                'Terms of Payment': record.termsOfPayment,
                'Items Details': itemsSummary,
                'Gross Amount': record.grossAmount,
                'Discount': record.discount,
                'Cash Received': record.cashReceived,
                'Final Net Amount': record.finalNetAmount
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Records');

        const date = new Date();
        const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const filename = `Sales_Records_${dateString}.xlsx`;

        XLSX.writeFile(workbook, filename);
        exportOptionsModal.hide();
        Swal.fire('Export Successful', `Sales data exported to "${filename}"`, 'success');
    }

    async function downloadSalesPdf() {
        if (salesRecords.length === 0) {
            Swal.fire('No Data', 'There are no sales records to download as PDF.', 'info');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Sales Records Summary", 14, 22);

        const headers = [
            'ID', 'Date', 'Invoice No.', 'Customer Name',
            'Gross Amt', 'Discount', 'Cash Rec.', 'Net Amt'
        ];

        const data = salesRecords.map(record => [
            record.id,
            record.date,
            record.salesInvoiceNo,
            record.customerName,
            record.grossAmount.toFixed(2),
            record.discount.toFixed(2),
            record.cashReceived.toFixed(2),
            record.finalNetAmount.toFixed(2)
        ]);

        doc.autoTable({
            startY: 30, 
            head: [headers],
            body: data,
            theme: 'striped', 
            headStyles: { fillColor: [20, 140, 200] }, 
            margin: { top: 10 }
        });

        const finalY = doc.autoTable.previous.finalY;
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, finalY + 10);
        doc.text("Note: This PDF provides a summary of sales records.", 14, finalY + 16);


        
        const date = new Date();
        const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const filename = `Sales_Summary_${dateString}.pdf`;

        doc.save(filename);
        exportOptionsModal.hide(); 
        Swal.fire('Download Successful', `Sales summary downloaded as "${filename}"`, 'success');
    }

    function exportSalesToWhatsApp() {
        if (salesRecords.length === 0) {
            Swal.fire('No Data', 'There are no sales records to share via WhatsApp.', 'info');
            return;
        }

        const messageParts = [];
        messageParts.push("Sales Records Summary:");
        messageParts.push("---------------------");

        salesRecords.forEach((record, index) => {
            messageParts.push(`\nRecord ${index + 1}:`);
            messageParts.push(`Invoice No: ${record.salesInvoiceNo}`);
            messageParts.push(`Date: ${record.date}`);
            messageParts.push(`Customer: ${record.customerName}`);
            messageParts.push(`Net Amount: Rs. ${record.finalNetAmount.toFixed(2)}`);
        });

        const fullMessage = messageParts.join('\n');

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;

        window.open(whatsappUrl, '_blank');

        exportOptionsModal.hide(); 
        Swal.fire({
            icon: 'info',
            title: 'Sharing via WhatsApp',
            text: 'A new window/tab will open to share the sales summary on WhatsApp. Please note this only prepares the message; you need to send it from WhatsApp.',
            showConfirmButton: true
        });
    }

    function exportSalesToEmail() {
        if (salesRecords.length === 0) {
            Swal.fire('No Data', 'There are no sales records to export via email.', 'info');
            return;
        }

        const subject = encodeURIComponent("Sales Records Summary from Your Application");
        let bodyParts = ["Dear Sir/Madam,", "\n\nPlease find the summary of sales records below:\n"];

        salesRecords.forEach((record, index) => {
            bodyParts.push(`--- Sales Record ${index + 1} ---`);
            bodyParts.push(`Invoice No: ${record.salesInvoiceNo}`);
            bodyParts.push(`Date: ${record.date}`);
            bodyParts.push(`Customer Name: ${record.customerName}`);
            bodyParts.push(`Gross Amount: Rs. ${record.grossAmount.toFixed(2)}`);
            bodyParts.push(`Discount: Rs. ${record.discount.toFixed(2)}`);
            bodyParts.push(`Cash Received: Rs. ${record.cashReceived.toFixed(2)}`);
            bodyParts.push(`Final Net Amount: Rs. ${record.finalNetAmount.toFixed(2)}`);
            bodyParts.push(`\n`); 
        });

        bodyParts.push("Regards,\nYour Sales Team");

        const fullBody = encodeURIComponent(bodyParts.join('\n'));
        const mailtoLink = `mailto:?subject=${subject}&body=${fullBody}`;

        window.location.href = mailtoLink; 

        exportOptionsModal.hide(); 
        Swal.fire({
            icon: 'info',
            title: 'Opening Email Client',
            text: 'Your default email client will open with the sales summary pre-filled. You can then add recipients and send the email.',
            showConfirmButton: true
        });
    }


    addItemButton.addEventListener('click', function () {
        const newRowElement = document.createElement('tr');
        newRowElement.innerHTML = `
            <td><input type="text" class="form-control item-code" value=""></td>
            <td>
                <select class="form-select item-description">
                    <option selected>Select Description</option>
                    <option>Laptop</option>
                    <option>Monitor</option>
                    <option>Keyboard</option>
                    <option>Mouse</option>
                    <option>Printer</option>
                </select>
            </td>
            <td><input type="number" class="form-control item-qty" value="1" min="1"></td>
            <td><input type="text" class="form-control item-unit" value="Unit"></td>
            <td><input type="number" class="form-control item-rate" value="0" min="0"></td>
            <td><input type="number" class="form-control item-net-amount" readonly value="0"></td>
            <td>
                <button type="button" class="btn btn-danger btn-sm delete-row">Delete</button>
            </td>
        `;
        salesItemsTableBody.appendChild(newRowElement);
        attachRowEventListeners(newRowElement); 
        calculateRowNetAmount(newRowElement);
    });

    salesItemsTableBody.addEventListener('input', function (event) {
        const target = event.target;
        if (target.classList.contains('item-qty') || target.classList.contains('item-rate')) {
            const row = target.closest('tr');
            calculateRowNetAmount(row);
        }
    });

    discountInput.addEventListener('input', updateAllTotals);
    cashReceivedInput.addEventListener('input', updateAllTotals);


    addTermButton.addEventListener('click', function () {
        const newTerm = newTermInput.value.trim();
        if (newTerm) {
            const newOption = document.createElement('option');
            newOption.value = newTerm;
            newOption.textContent = newTerm;
            termsOfPaymentSelect.appendChild(newOption);
            newTermInput.value = '';

            const termsModal = bootstrap.Modal.getInstance(document.getElementById('termsModal'));
            if (termsModal) {
                termsModal.hide();
            }
            Swal.fire({
                icon: 'success',
                title: 'Term Added!',
                text: `"${newTerm}" has been added to terms of payment.`
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Input Error',
                text: 'Please enter a term.'
            });
        }
    });

    function renderSalesList() {
        salesListTableBody.innerHTML = '';
        if (salesRecords.length === 0) {
            noEntriesMessage.style.display = 'block';
            salesListTableBody.innerHTML = '';
            return;
        } else {
            noEntriesMessage.style.display = 'none';
        }

        salesRecords.forEach(record => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${record.id}</td>
                <td>${record.date}</td>
                <td>${record.salesInvoiceNo}</td>
                <td>${record.customerName || 'N/A'}</td>
                <td>Rs. ${record.grossAmount.toFixed(2)}</td>
                <td>Rs. ${record.discount.toFixed(2)}</td>
                <td>Rs. ${record.cashReceived.toFixed(2)}</td>
                <td>Rs. ${record.finalNetAmount.toFixed(2)}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-success me-1 view-record" data-id="${record.id}"><i class="bi bi-eye"></i> View</button>
                    <button type="button" class="btn btn-sm btn-primary me-1 edit-record" data-id="${record.id}"><i class="bi bi-pencil"></i> Edit</button>
                    <button type="button" class="btn btn-sm btn-info me-1 print-record" data-id="${record.id}"><i class="bi bi-printer"></i> Print</button>
                    <button type="button" class="btn btn-sm btn-danger delete-sales-record" data-id="${record.id}"><i class="bi bi-trash"></i> Delete</button>
                </td>
            `;
            salesListTableBody.appendChild(newRow);
        });

        salesListTableBody.querySelectorAll('.delete-sales-record').forEach(button => {
            button.addEventListener('click', function() {
                const idToDelete = parseInt(this.dataset.id);
                Swal.fire({
                    title: 'Are you sure?',
                    text: "You want to delete this sales record?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, delete it!'
                }).then((result) => {
                    if (result.isConfirmed) {
                        salesRecords = salesRecords.filter(record => record.id !== idToDelete);
                        renderSalesList();
                        Swal.fire(
                            'Deleted!',
                            'The sales record has been deleted.',
                            'success'
                        );
                    }
                });
            });
        });

        salesListTableBody.querySelectorAll('.view-record').forEach(button => {
            button.addEventListener('click', function() {
                const idToView = parseInt(this.dataset.id);
                const recordToView = salesRecords.find(record => record.id === idToView);
                if (recordToView) {
                    setFormMode('view', recordToView);
                } else {
                    Swal.fire('Error', 'Record not found for viewing.', 'error');
                }
            });
        });

        salesListTableBody.querySelectorAll('.edit-record').forEach(button => {
            button.addEventListener('click', function() {
                const idToEdit = parseInt(this.dataset.id);
                const recordToEdit = salesRecords.find(record => record.id === idToEdit);
                if (recordToEdit) {
                    setFormMode('edit', recordToEdit);
                } else {
                    Swal.fire('Error', 'Record not found for editing.', 'error');
                }
            });
        });

        salesListTableBody.querySelectorAll('.print-record').forEach(button => {
            button.addEventListener('click', function() {
                const idToPrint = parseInt(this.dataset.id);
                printSalesRecord(idToPrint);
            });
        });
    }

    function printSalesRecord(recordId) {
        const record = salesRecords.find(rec => rec.id === recordId);
        if (!record) {
            Swal.fire('Error', 'Sales record not found for printing.', 'error');
            return;
        }

        const totalQuantity = record.items.reduce((sum, item) => sum + item.qty, 0);

        let printContent = `
            <html>
            <head>
                <title>Sales Record #${record.salesInvoiceNo}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h2 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .details p { margin: 5px 0; }
                    .total { font-weight: bold; text-align: right; padding-right: 10px; }
                </style>
            </head>
            <body>
                <h2>Sales Record Details - Invoice No: ${record.salesInvoiceNo}</h2>
                <div class="details">
                    <p><strong>Date:</strong> ${record.date}</p>
                    <p><strong>Sales Invoice No:</strong> ${record.salesInvoiceNo || 'N/A'}</p>
                    <p><strong>Description (Overall):</strong> ${record.description || 'N/A'}</p>
                    <p><strong>Customer Name:</strong> ${record.customerName || 'N/A'} (Code: ${record.customerCode || 'N/A'})</p>
                    <p><strong>Customer Address:</strong> ${record.customerAddress || 'N/A'}</p>
                    <p><strong>Telephone:</strong> ${record.telephone || 'N/A'}</p>
                    <p><strong>Terms of Payment:</strong> ${record.termsOfPayment || 'N/A'}</p>
                </div>

                <h3>Sales Items:</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Item Code</th>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>Rate</th>
                            <th>Net Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${record.items.map(item => `
                            <tr>
                                <td>${item.itemCode}</td>
                                <td>${item.description}</td>
                                <td>${item.qty}</td>
                                <td>${item.unit}</td>
                                <td>${item.rate.toFixed(2)}</td>
                                <td>${item.netAmount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" class="total">Total Quantity:</td>
                            <td>${totalQuantity}</td>
                            <td colspan="2" class="total">Gross Amount:</td>
                            <td>Rs. ${record.grossAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="5" class="total">Discount:</td>
                            <td>Rs. ${record.discount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="5" class="total">Cash Received:</td>
                            <td>Rs. ${record.cashReceived.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="5" class="total">Final Net Amount:</td>
                            <td>Rs. ${record.finalNetAmount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    submitSalesButton.addEventListener('click', function (e) {
        e.preventDefault();

        const formData = {
            id: nextSalesId++,
            date: document.getElementById('date').value,
            salesInvoiceNo: salesInvoiceNoInput.value, 
            description: document.getElementById('description').value,
            customerCode: document.getElementById('customerCode').value,
            customerName: document.getElementById('customerName').value,
            customerAddress: document.getElementById('customerAddress').value,
            telephone: document.getElementById('telephone').value,
            termsOfPayment: document.getElementById('termsOfPayment').value,
            items: [],
            grossAmount: parseFloat(grossAmountField.textContent) || 0,
            discount: parseFloat(discountInput.value) || 0,
            cashReceived: parseFloat(cashReceivedInput.value) || 0,
            finalNetAmount: parseFloat(finalNetAmountField.textContent) || 0
        };

        let isValid = true;
        salesItemsTableBody.querySelectorAll('tr').forEach(row => {
            const itemCode = row.querySelector('.item-code').value.trim();
            const description = row.querySelector('.item-description').value;
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const unit = row.querySelector('.item-unit').value.trim();
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            const netAmount = parseFloat(row.querySelector('.item-net-amount').value) || 0;

            if (!itemCode || description === 'Select Description' || qty <= 0 || rate < 0 || !unit) {
                isValid = false;
            }

            formData.items.push({
                itemCode,
                description,
                qty,
                unit,
                rate,
                netAmount
            });
        });

        if (!isValid) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please ensure all sales items have a valid item code, selected description, quantity (>0), rate (>=0), and unit.'
            });
            return;
        }

        salesRecords.push(formData);
        nextInvoiceNumber++; 

        Swal.fire({
            icon: 'success',
            title: 'Sales Added!',
            text: 'Your sales invoice has been successfully added to the list.'
        });

        setFormMode('list'); 
        resetForm(); 
    });

    updateSalesButton.addEventListener('click', function () {
        if (currentMode !== 'edit' || editingRecordId === null) {
            Swal.fire('Error', 'No record is currently being edited.', 'error');
            return;
        }

        const recordIndex = salesRecords.findIndex(record => record.id === editingRecordId);
        if (recordIndex === -1) {
            Swal.fire('Error', 'Record not found for update.', 'error');
            return;
        }

        const updatedData = {
            id: editingRecordId,
            date: document.getElementById('date').value,
            salesInvoiceNo: salesInvoiceNoInput.value,
            description: document.getElementById('description').value,
            customerCode: document.getElementById('customerCode').value,
            customerName: document.getElementById('customerName').value,
            customerAddress: document.getElementById('customerAddress').value,
            telephone: document.getElementById('telephone').value,
            termsOfPayment: document.getElementById('termsOfPayment').value,
            items: [],
            grossAmount: parseFloat(grossAmountField.textContent) || 0,
            discount: parseFloat(discountInput.value) || 0,
            cashReceived: parseFloat(cashReceivedInput.value) || 0,
            finalNetAmount: parseFloat(finalNetAmountField.textContent) || 0
        };

        let isValid = true;
        salesItemsTableBody.querySelectorAll('tr').forEach(row => {
            const itemCode = row.querySelector('.item-code').value.trim();
            const description = row.querySelector('.item-description').value;
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const unit = row.querySelector('.item-unit').value.trim();
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            const netAmount = parseFloat(row.querySelector('.item-net-amount').value) || 0;

            if (!itemCode || description === 'Select Description' || qty <= 0 || rate < 0 || !unit) {
                isValid = false;
            }

            updatedData.items.push({
                itemCode,
                description,
                qty,
                unit,
                rate,
                netAmount
            });
        });

        if (!isValid) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please ensure all sales items have a valid item code, selected description, quantity (>0), rate (>=0), and unit.'
            });
            return;
        }

        salesRecords[recordIndex] = updatedData;

        Swal.fire({
            icon: 'success',
            title: 'Sales Updated!',
            text: 'Your sales invoice has been successfully updated.'
        });

        setFormMode('list'); 
        resetForm(); 
    });

    listButton.addEventListener('click', function () {
        setFormMode('list');
    });

    listButtonBack.addEventListener('click', function() {
        setFormMode('add');
    });

    backToDashboardButton.addEventListener('click', function () {
        Swal.fire({
            title: 'Redirecting...',
            text: 'You will be taken back to the dashboard.',
            icon: 'info',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            // window.location.href = 'dashboard.html';
            console.log("Navigating to dashboard (simulated from form view)");
        });
    });

    backToDashboardButtonList.addEventListener('click', function () {
        Swal.fire({
            title: 'Redirecting...',
            text: 'You will be taken back to the dashboard.',
            icon: 'info',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            // window.location.href = 'dashboard.html';
            console.log("Navigating to dashboard (simulated from list view)");
        });
    });

    printFormButton.addEventListener('click', function () {
        Swal.fire({
            title: 'Printing...',
            text: 'Opening print dialog for the current form view.',
            icon: 'info',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            window.print(); 
        });
    });

    confirmClearFormButton.addEventListener('click', function () {
        resetForm(); 

        Swal.fire({
            icon: 'success',
            title: 'Form Cleared!',
            text: 'All form fields have been reset.'
        });

        const confirmDeleteModal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
        if (confirmDeleteModal) {
            confirmDeleteModal.hide();
        }
    });

    exportPdfButton.addEventListener('click', downloadSalesPdf);
    exportExcelButton.addEventListener('click', exportSalesToExcel);
    exportWhatsappButton.addEventListener('click', exportSalesToWhatsApp);
    exportEmailButton.addEventListener('click', exportSalesToEmail); 



    attachRowEventListeners(salesItemsTableBody.querySelector('tr'));

    salesInvoiceNoInput.value = nextInvoiceNumber;

    updateAllTotals();

    renderSalesList();
    setFormMode('add');
});