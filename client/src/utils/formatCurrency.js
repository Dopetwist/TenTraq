export const currencySymbols = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£"
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
});

export const formatCurrencyAmount = (amount, currency = "NGN") => {
    const numericAmount = Number(amount ?? 0);
    const symbol = currencySymbols[currency] || currency || "";

    if (!Number.isFinite(numericAmount)) {
        return `${symbol}0`;
    }

    return `${symbol}${moneyFormatter.format(numericAmount)}`;
};

export const formatRentInput = (value) => {
    if (value === "" || value === null || value === undefined) {
        return "";
    }

    const numericValue = Number(String(value).replace(/,/g, ""));

    if (!Number.isFinite(numericValue)) {
        return "";
    }

    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2
    }).format(numericValue);
};

export const sanitizeRentInput = (value) => {
    if (value === "") {
        return "";
    }

    const cleanedValue = value.replace(/,/g, "").replace(/[^\d.]/g, "");
    const parts = cleanedValue.split(".");

    if (parts.length > 2) {
        return `${parts[0]}.${parts.slice(1).join("")}`;
    }

    return cleanedValue;
};
