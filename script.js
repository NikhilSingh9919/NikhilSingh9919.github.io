document.getElementById('calculateBtn').addEventListener('click', function () {
    const emi = parseFloat(document.querySelector('[name="emi"]').value);
    const annualRate = parseFloat(document.querySelector('[name="interestRate"]').value);
    const tenureMonths = parseInt(document.querySelector('[name="tenure"]').value);
    const partPaymentType = document.querySelector('[name="paymentType"]:checked').value;
    const partPaymentAmount = parseFloat(document.querySelector('[name="partPaymentAmount"]').value);

    const monthlyRate = annualRate / 12 / 100;

    // Calculate initial principal from EMI formula:
    const P = (emi / monthlyRate) * (1 - Math.pow(1 + monthlyRate, -tenureMonths));

    // Function to simulate loan and return { totalInterest, monthsTaken }
    function simulateLoan(principal, applyPartPayment, type) {
        let currentPrincipal = principal;
        let month = 0;
        let totalInterest = 0;

        while (currentPrincipal > 0) {
            // Apply part payment first
            if (applyPartPayment) {
                if (type === 'one-time' && month === 0) {
                    currentPrincipal -= partPaymentAmount;
                    if (currentPrincipal < 0) currentPrincipal = 0;
                } else if (type === 'monthly') {
                    currentPrincipal -= partPaymentAmount;
                    if (currentPrincipal < 0) currentPrincipal = 0;
                }
            }

            // Recompute interest AFTER part payment
            const interest = currentPrincipal * monthlyRate;
            totalInterest += interest;

            // Pay EMI (interest + principal repayment)
            const principalRepayment = emi - interest;
            currentPrincipal -= principalRepayment;
            if (currentPrincipal < 0) currentPrincipal = 0;

            month++;

            // Safety limit
            if (month > 1000) break;
        }

        return {
            totalInterest,
            monthsTaken: month
        };
    }

    // Simulate baseline (no part payment)
    const baseline = simulateLoan(P, false, null);

    // Simulate with part payment
    const withPartPayment = simulateLoan(P, true, partPaymentType);

    // Calculate savings
    const interestSaved = baseline.totalInterest - withPartPayment.totalInterest;
    const tenureSaved = baseline.monthsTaken - withPartPayment.monthsTaken;

    // Update UI
    document.getElementById('interestSaved').innerText = `₹ ${interestSaved.toFixed(2)}`;
    document.getElementById('tenureSaved').innerText = `${tenureSaved} months`;
    document.getElementById('newTotalInterest').innerText = `₹ ${withPartPayment.totalInterest.toFixed(2)}`;
    document.getElementById('newTenure').innerText = `${withPartPayment.monthsTaken} months`;

    // Show results
    const resultsEl = document.getElementById("results");
    resultsEl.classList.remove("hidden", "opacity-0");
    resultsEl.classList.add("opacity-100");
});