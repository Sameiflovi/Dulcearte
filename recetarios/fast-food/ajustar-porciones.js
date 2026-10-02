document.addEventListener("DOMContentLoaded", () => {
    const control = document.querySelector("[data-portion-control]");
    if (!control) return;

    const baseAmount = Number(control.dataset.baseAmount || 1);
    const minAmount = Number(control.dataset.minAmount || 1);
    const maxAmount = Number(control.dataset.maxAmount || 20);
    const stepAmount = Number(control.dataset.stepAmount || 1);

    const valueElement = control.querySelector("[data-portion-value]");
    const labelElement = control.querySelector("[data-portion-label]");
    const minusButton = control.querySelector("[data-portion-minus]");
    const plusButton = control.querySelector("[data-portion-plus]");

    if (!valueElement || !labelElement || !minusButton || !plusButton) return;

    let amount = baseAmount;

    const singularLabel = control.dataset.labelSingular || "persona";
    const pluralLabel = control.dataset.labelPlural || singularLabel + "s";

    function nearlyInteger(value) {
        return Math.abs(value - Math.round(value)) < 0.0001;
    }

    function formatNumber(value) {
        if (nearlyInteger(value)) return String(Math.round(value));

        const rounded = Math.round(value * 100) / 100;
        return rounded.toLocaleString("es-ES", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

    function formatQuantity(value) {
        const commonFractions = [
            [0.125, "1/8"],
            [0.25, "1/4"],
            [0.375, "3/8"],
            [0.5, "1/2"],
            [0.625, "5/8"],
            [0.75, "3/4"],
            [0.875, "7/8"]
        ];

        if (value >= 1 && !nearlyInteger(value)) {
            const whole = Math.floor(value);
            const fraction = value - whole;
            const match = commonFractions.find(([number]) => Math.abs(number - fraction) < 0.02);

            if (match) return whole + " " + match[1];
        }

        const match = commonFractions.find(([number]) => Math.abs(number - value) < 0.02);
        if (match) return match[1];

        return formatNumber(value);
    }

    function formatScaledElement(element) {
        const base = Number(element.dataset.base);
        if (!Number.isFinite(base)) return;

        const scaledValue = (base / baseAmount) * amount;
        const singular = element.dataset.unit || "";
        const plural = element.dataset.unitPlural || (singular.endsWith("s") ? singular : singular + "s");
        const unit = nearlyInteger(scaledValue) && Math.round(scaledValue) === 1 ? singular : plural;

        element.textContent = unit
            ? `${formatQuantity(scaledValue)} ${unit}`
            : formatQuantity(scaledValue);
    }

    function formatScaledRangeElement(element) {
        const minBase = Number(element.dataset.baseMin);
        const maxBase = Number(element.dataset.baseMax);
        if (!Number.isFinite(minBase) || !Number.isFinite(maxBase)) return;

        const scaledMin = (minBase / baseAmount) * amount;
        const scaledMax = (maxBase / baseAmount) * amount;
        const unit = element.dataset.unit || "";

        element.textContent = `${formatQuantity(scaledMin)}–${formatQuantity(scaledMax)}${unit ? " " + unit : ""}`;
    }

    function updateRecipe() {
        valueElement.textContent = formatNumber(amount);
        labelElement.textContent = nearlyInteger(amount) && Math.round(amount) === 1
            ? singularLabel
            : pluralLabel;

        control.querySelectorAll("[data-scale]").forEach(formatScaledElement);
        control.querySelectorAll("[data-scale-range]").forEach(formatScaledRangeElement);

        minusButton.disabled = amount <= minAmount;
        plusButton.disabled = amount >= maxAmount;
    }

    minusButton.addEventListener("click", () => {
        amount = Math.max(minAmount, Math.round((amount - stepAmount) * 100) / 100);
        updateRecipe();
    });

    plusButton.addEventListener("click", () => {
        amount = Math.min(maxAmount, Math.round((amount + stepAmount) * 100) / 100);
        updateRecipe();
    });

    updateRecipe();
});
