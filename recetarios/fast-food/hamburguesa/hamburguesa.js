document.addEventListener('DOMContentLoaded', () => {
    // Cantidad original de la receta
    const basePortions = 6;

    // Límites para las porciones
    const minPortions = 1;
    const maxPortions = 20;

    // Elementos de la página
    const portionsValue = document.getElementById('porciones-valor');
    const portionsLabel = document.getElementById('porciones-label');
    const minusButton = document.getElementById('porciones-menos');
    const plusButton = document.getElementById('porciones-mas');

    // Ingredientes que tienen cantidades calculables
    const ingredientAmounts = document.querySelectorAll('[data-base]');

    // Textos que dicen "Ingredientes para X porciones"
    const recipeAmountLabels = document.querySelectorAll('[data-portions-text]');

    // Números de panes u otras cantidades relacionadas con las porciones
    const portionCountLabels = document.querySelectorAll('[data-portions-count]');

    // Si falta alguno de los controles principales, no hacemos nada
    if (!portionsValue || !minusButton || !plusButton) {
        return;
    }

    // La receta empieza con 6 porciones
    let portions = basePortions;

    // Formato de números
    const formatNumber = (value) => {
        if (value >= 100) {
            return Math.round(value).toLocaleString('es-ES');
        }

        if (value >= 10) {
            return Number(value.toFixed(1)).toLocaleString('es-ES');
        }

        return Number(value.toFixed(2)).toLocaleString('es-ES');
    };

    // Calcula y muestra la cantidad nueva
    const formatAmount = (base, unit) => {
        const result = (base / basePortions) * portions;

        // Huevos
        if (unit === 'huevo') {
            if (Math.abs(result - Math.round(result)) < 0.001) {
                return `${Math.round(result)} ${
                    result === 1 ? 'huevo' : 'huevos'
                }`;
            }

            return `${formatNumber(result)} huevos (aprox.)`;
        }

        // Si la cantidad llega a 1000 g, la mostramos en kg
        if (unit === 'kg') {
            if (result >= 1000) {
                return `${formatNumber(result / 1000)} kg`;
            }

            return `${formatNumber(result)} g`;
        }

        return `${formatNumber(result)} ${unit}`;
    };

    // Actualiza toda la receta
    function updateRecipe() {
        // Número grande del selector
        portionsValue.textContent = portions;

        // "porción" o "porciones"
        portionsLabel.textContent =
            portions === 1 ? 'porción' : 'porciones';

        // Actualizar cantidades de ingredientes
        ingredientAmounts.forEach((element) => {
            const base = Number(element.dataset.base);
            const unit = element.dataset.unit || '';

            if (!Number.isFinite(base)) {
                return;
            }

            element.textContent = formatAmount(base, unit);
        });

        // Actualizar textos como:
        // "Ingredientes para 6 porciones"
        recipeAmountLabels.forEach((element) => {
            element.textContent =
                `Ingredientes para ${portions} ${
                    portions === 1 ? 'porción' : 'porciones'
                }`;
        });

        // Actualizar otros números relacionados
        portionCountLabels.forEach((element) => {
            element.textContent = portions;
        });

        // Desactivar botones cuando se llega al mínimo o máximo
        minusButton.disabled = portions <= minPortions;
        plusButton.disabled = portions >= maxPortions;
    }

    // Botón -
    minusButton.addEventListener('click', () => {
        if (portions > minPortions) {
            portions -= 1;
            updateRecipe();
        }
    });

    // Botón +
    plusButton.addEventListener('click', () => {
        if (portions < maxPortions) {
            portions += 1;
            updateRecipe();
        }
    });

    // Mostrar los valores iniciales
    updateRecipe();
});
