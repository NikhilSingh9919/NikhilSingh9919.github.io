// Common loan simulation function
function simulateLoan(principal, emi, monthlyRate, applyPartPayment, type, partPaymentAmount) {
    let currentPrincipal = principal;
    let month = 0;
    let totalInterest = 0;
    const schedule = [];

    while (currentPrincipal > 0 && month < 1000) {
        let part = 0;
        if (applyPartPayment) {
            if (type === 'one-time' && month === 0) {
                part = Math.min(partPaymentAmount, currentPrincipal);
                currentPrincipal -= part;
            } else if (type === 'monthly') {
                part = Math.min(partPaymentAmount, currentPrincipal);
                currentPrincipal -= part;
            }
        }

        const interest = currentPrincipal * monthlyRate;
        totalInterest += interest;
        let principalRepayment = emi - interest;
        if (principalRepayment > currentPrincipal) principalRepayment = currentPrincipal;
        currentPrincipal -= principalRepayment;

        month++;
        schedule.push({
            month,
            interest,
            principal: principalRepayment,
            partPayment: part,
            balance: currentPrincipal < 0 ? 0 : currentPrincipal
        });
    }

    return { totalInterest, monthsTaken: month, schedule };
}

function formatYearsMonths(months) {
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    if (years && remaining) {
        return `${years} year${years > 1 ? 's' : ''} ${remaining} month${remaining > 1 ? 's' : ''}`;
    } else if (years) {
        return `${years} year${years > 1 ? 's' : ''}`;
    }
    return `${remaining} month${remaining !== 1 ? 's' : ''}`;
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(tab + 'Tab').classList.remove('hidden');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('border-blue-600', 'text-blue-600'));
        btn.classList.add('border-blue-600', 'text-blue-600');
    });
});

// Simple mode calculation
const simpleBtn = document.getElementById('simpleCalculateBtn');
if (simpleBtn) {
    simpleBtn.addEventListener('click', () => {
        const form = document.getElementById('simpleForm');
        const emi = parseFloat(form.querySelector('[name="emi"]').value);
        const annualRate = parseFloat(form.querySelector('[name="interestRate"]').value);
        const tenureMonths = parseInt(form.querySelector('[name="tenure"]').value);
        const partPaymentType = form.querySelector('[name="paymentType"]:checked').value;
        const partPaymentAmount = parseFloat(form.querySelector('[name="partPaymentAmount"]').value);

        const monthlyRate = annualRate / 12 / 100;
        const principal = (emi / monthlyRate) * (1 - Math.pow(1 + monthlyRate, -tenureMonths));

        const baseline = simulateLoan(principal, emi, monthlyRate, false, null, 0);
        const withPart = simulateLoan(principal, emi, monthlyRate, true, partPaymentType, partPaymentAmount);

        const interestSaved = baseline.totalInterest - withPart.totalInterest;
        const tenureSaved = baseline.monthsTaken - withPart.monthsTaken;

        document.getElementById('interestSaved').innerText = `₹ ${interestSaved.toFixed(2)}`;
        document.getElementById('tenureSaved').innerText = `${tenureSaved} months (${formatYearsMonths(tenureSaved)})`;
        document.getElementById('newTotalInterest').innerText = `₹ ${withPart.totalInterest.toFixed(2)}`;
        document.getElementById('newTenure').innerText = `${withPart.monthsTaken} months (${formatYearsMonths(withPart.monthsTaken)})`;

        const resEl = document.getElementById('simpleResults');
        resEl.classList.remove('hidden', 'opacity-0');
        resEl.classList.add('opacity-100');
    });
}

// Advanced mode calculation
const advBtn = document.getElementById('advancedCalculateBtn');
if (advBtn) {
    advBtn.addEventListener('click', () => {
        const form = document.getElementById('advancedForm');
        const loanAmount = parseFloat(form.querySelector('[name="loanAmount"]').value);
        const annualRate = parseFloat(form.querySelector('[name="interestRate"]').value);
        const tenureMonths = parseInt(form.querySelector('[name="tenure"]').value);
        const partPaymentType = form.querySelector('[name="paymentType"]:checked').value;
        const partPaymentAmount = parseFloat(form.querySelector('[name="partPaymentAmount"]').value);

        const monthlyRate = annualRate / 12 / 100;
        const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);

        const baseline = simulateLoan(loanAmount, emi, monthlyRate, false, null, 0);
        const withPart = simulateLoan(loanAmount, emi, monthlyRate, true, partPaymentType, partPaymentAmount);

        const interestSaved = baseline.totalInterest - withPart.totalInterest;
        const tenureSaved = baseline.monthsTaken - withPart.monthsTaken;
        const totalPayable = loanAmount + withPart.totalInterest;

        document.getElementById('advRemainingTenure').innerText = `${withPart.monthsTaken} months (${formatYearsMonths(withPart.monthsTaken)})`;
        document.getElementById('advTenureSaved').innerText = `${tenureSaved} months (${formatYearsMonths(tenureSaved)})`;
        document.getElementById('advAmountPayable').innerText = `₹ ${totalPayable.toFixed(2)}`;
        document.getElementById('advInterestSaved').innerText = `₹ ${interestSaved.toFixed(2)}`;

        const body = document.getElementById('scheduleBody');
        body.innerHTML = '';
        withPart.schedule.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="border px-2">${row.month}</td>` +
                           `<td class="border px-2">${row.interest.toFixed(2)}</td>` +
                           `<td class="border px-2">${row.principal.toFixed(2)}</td>` +
                           `<td class="border px-2">${row.partPayment.toFixed(2)}</td>` +
                           `<td class="border px-2">${row.balance.toFixed(2)}</td>`;
            body.appendChild(tr);
        });

        const resEl = document.getElementById('advancedResults');
        resEl.classList.remove('hidden', 'opacity-0');
        resEl.classList.add('opacity-100');
    });
}

// PDF Download
const pdfBtn = document.getElementById('downloadPdfBtn');
if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('Payment Schedule', 10, 10);
        doc.autoTable({ html: '#scheduleTable', startY: 20 });
        doc.save('payment_schedule.pdf');
    });
}
