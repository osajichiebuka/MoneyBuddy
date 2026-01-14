const pdf = require('pdf-parse');

/**
 * Parses raw buffer from PDF and returns an array of transaction objects.
 */
const parseBankStatement = async (fileBuffer) => {
    try {
        const data = await pdf(fileBuffer);
        const text = data.text;

        // 1. Identify the Bank (Optional but good for scaling)
        // Simple keyword check to decide which Regex strategy to use
        let bank = 'UNKNOWN';
        if (text.includes('Guaranty Trust Bank') || text.includes('GTBank')) bank = 'GTBANK';
        else if (text.includes('Zenith Bank')) bank = 'ZENITH';
        else if (text.includes('Kuda')) bank = 'KUDA';

        console.log(`Detected Bank: ${bank}`);

        // 2. Extract Transactions
        // We pass the raw text to a specific extractor based on the bank
        // For now, I will provide a "Generic" regex that works for many standard line-items
        return extractTransactionsFromText(text, bank);

    } catch (error) {
        console.error('PDF Parsing Error:', error);
        throw new Error('Failed to parse PDF');
    }
};

const extractTransactionsFromText = (text, bank) => {
    const transactions = [];
    const lines = text.split('\n');

    // REGEX EXPLANATION:
    // This is a generic pattern for: DATE | DESCRIPTION | AMOUNT
    // It looks for a date at the start, followed by text, followed by a number.
    // Nigerian Date format is usually DD/MMM/YYYY or DD-MM-YYYY
    const dateRegex = /(\d{1,2}[/-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[/-]\d{2,4})/i;

    // Helper to clean currency strings (e.g., "1,200.00 CR" -> 1200.00)
    const parseAmount = (str) => {
        return parseFloat(str.replace(/,/g, '').replace('NGN', '').trim());
    };

    lines.forEach(line => {
        // Skip empty lines or headers
        if (!line.trim() || line.includes('Opening Balance')) return;

        const dateMatch = line.match(dateRegex);

        if (dateMatch) {
            // This line likely contains a transaction
            // NOTE: This logic needs to be refined per bank as you get real PDFs

            // simplistic splitting strategy for MVP
            const parts = line.split(/\s{2,}/); // Split by 2 or more spaces (common in tables)

            if (parts.length >= 3) {
                const date = dateMatch[0]; // The date string

                // Description is usually the longest text block
                const description = parts.find(p => p.length > 10 && !p.match(/\d/)) || "Unknown Transaction";

                // Amount is usually at the end (Credit/Debit)
                // This is tricky without specific bank logic, but we look for numbers
                const potentialAmounts = parts.filter(p => p.match(/[\d,]+\.\d{2}/));
                const amountStr = potentialAmounts[potentialAmounts.length - 1]; // Usually the last number is the amount or balance

                if (amountStr) {
                    transactions.push({
                        date: date, // You might need to format this to YYYY-MM-DD for Postgres
                        description: description.trim(),
                        amount: parseAmount(amountStr),
                        type: line.toLowerCase().includes('cr') ? 'income' : 'expense', // basic guess
                        original_text: line // keeping this for debugging
                    });
                }
            }
        }
    });

    return transactions;
};

module.exports = { parseBankStatement };
