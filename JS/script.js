/* ==========================================================================
   CYBERPUNK NEON CALCULATOR LOGIC - SITE CALCULADORA
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element Selections
    const display = document.getElementById('display');
    const historico = document.getElementById('historico');
    const botoes = document.querySelectorAll('.botao');

    // Calculator State
    let expressao = '';
    let resultadoExibido = false;

    /**
     * Updates the main calculator display.
     * If the value is empty, the HTML placeholder ("0") will be shown.
     * @param {string} valor 
     */
    function atualizarDisplay(valor) {
        display.value = valor;
    }

    /**
     * Updates the secondary history display.
     * @param {string} valor 
     */
    function atualizarHistorico(valor) {
        historico.textContent = valor;
    }

    /**
     * Resets the calculator state.
     */
    function limparTudo() {
        expressao = '';
        resultadoExibido = false;
        atualizarDisplay('');
        atualizarHistorico('');
    }

    /**
     * Deletes the last character from the current expression.
     */
    function apagarUltimo() {
        if (resultadoExibido) {
            limparTudo();
            return;
        }
        expressao = expressao.slice(0, -1);
        atualizarDisplay(expressao);
    }

    /**
     * Toggles the sign (+/-) of the last number in the expression.
     * Correctly handles wrapping in parentheses (e.g. 5 -> (-5)) and unwrapping them.
     */
    function inverterSinal() {
        if (resultadoExibido) {
            expressao = display.value;
            resultadoExibido = false;
        }

        if (!expressao) return;

        // Check if the expression ends with a parenthesized negative number like "(-5)" or "(-5.23)"
        const parenMatch = expressao.match(/\((-\d+(\.\d+)?)\)$/);
        
        if (parenMatch) {
            // Extract the number and remove the negative sign
            const valorSemSinal = parenMatch[1].substring(1);
            expressao = expressao.slice(0, -parenMatch[0].length) + valorSemSinal;
        } else {
            // Find if there's a trailing number (possibly decimal) to negate
            const numMatch = expressao.match(/(\d+(\.\d+)?)$/);
            if (numMatch) {
                const valorOriginal = numMatch[1];
                expressao = expressao.slice(0, -valorOriginal.length) + `(-${valorOriginal})`;
            }
        }
        atualizarDisplay(expressao);
    }

    /**
     * Adds a digit or a decimal point to the expression.
     * Validates input to prevent syntax errors (like duplicate decimals).
     * @param {string} char 
     */
    function adicionarCaractere(char) {
        if (resultadoExibido) {
            // If a result is currently shown, typing a number resets the board.
            if (!isNaN(char) || char === '.') {
                expressao = '';
            } else {
                // Typing an operator continues the calculation.
                expressao = display.value;
            }
            resultadoExibido = false;
        }

        // Prevent multiple decimals in a single number
        if (char === '.') {
            // Split by math operators to isolate the current number being typed
            const partes = expressao.split(/[\+\-\*\/]/);
            const ultimoNumero = partes[partes.length - 1];
            if (ultimoNumero.includes('.')) {
                return;
            }
        }

        expressao += char;
        atualizarDisplay(expressao);
    }

    /**
     * Adds an operator to the expression.
     * Handles replacing existing trailing operators.
     * @param {string} op 
     */
    function adicionarOperador(op) {
        if (resultadoExibido) {
            expressao = display.value;
            resultadoExibido = false;
        }

        if (expressao === '') {
            // Permit starting expression with a minus sign
            if (op === '-') {
                expressao += op;
                atualizarDisplay(expressao);
            }
            return;
        }

        const ultimoChar = expressao.slice(-1);
        const operadores = ['+', '-', '*', '/'];

        if (operadores.includes(ultimoChar)) {
            // Special case: allow negative numbers after operators (e.g. 5 * -2)
            if (op === '-' && (ultimoChar === '*' || ultimoChar === '/' || ultimoChar === '+')) {
                expressao += op;
            } else {
                // Otherwise replace the trailing operator(s)
                let tempExpr = expressao;
                while (operadores.includes(tempExpr.slice(-1))) {
                    tempExpr = tempExpr.slice(0, -1);
                }
                expressao = tempExpr + op;
            }
        } else {
            expressao += op;
        }
        
        atualizarDisplay(expressao);
    }

    /**
     * Safely evaluates the expression and displays the result.
     * Formats decimal places and handles division by zero.
     */
    function calcular() {
        if (!expressao) return;

        // Strip trailing operators before evaluation
        let exprParaCalcular = expressao;
        const operadores = ['+', '-', '*', '/'];
        while (operadores.includes(exprParaCalcular.slice(-1))) {
            exprParaCalcular = exprParaCalcular.slice(0, -1);
        }

        if (!exprParaCalcular) return;

        try {
            // Strictly check expression characters for safety (only digits, operators, dots, parentheses, and spaces)
            const safePattern = /^[0-9+\-*/().\s]+$/;
            if (!safePattern.test(exprParaCalcular)) {
                throw new Error('Caracteres inválidos na expressão.');
            }

            // Check for division by zero using regex (e.g., /0, /0.00)
            if (/\/0+(\.0+)?(?!\d)/.test(exprParaCalcular)) {
                atualizarHistorico(exprParaCalcular + ' =');
                atualizarDisplay('Erro: Div 0');
                expressao = '';
                resultadoExibido = true;
                return;
            }

            // Evaluate expression safely
            const result = new Function(`return ${exprParaCalcular}`)();

            if (result === Infinity || result === -Infinity || isNaN(result)) {
                throw new Error('Resultado inválido');
            }

            // Format result to prevent giant float numbers breaking the layout
            let resultadoFormatado = result;
            if (typeof result === 'number' && !Number.isInteger(result)) {
                resultadoFormatado = parseFloat(result.toFixed(8));
            }

            atualizarHistorico(exprParaCalcular + ' =');
            atualizarDisplay(resultadoFormatado);
            expressao = String(resultadoFormatado);
            resultadoExibido = true;

        } catch (error) {
            console.error('Erro de Cálculo:', error);
            atualizarHistorico(exprParaCalcular + ' =');
            atualizarDisplay('Erro');
            expressao = '';
            resultadoExibido = true;
        }
    }

    // ==========================================================================
    // EVENT LISTENERS
    // ==========================================================================

    // Handle button clicks
    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const valor = botao.getAttribute('data-val');

            if (!valor) return;

            switch (valor) {
                case 'C':
                    limparTudo();
                    break;
                case 'DEL':
                    apagarUltimo();
                    break;
                case '+/-':
                    inverterSinal();
                    break;
                case '=':
                    calcular();
                    break;
                case '+':
                case '-':
                case '*':
                case '/':
                    adicionarOperador(valor);
                    break;
                default:
                    // Numbers and decimal point
                    adicionarCaractere(valor);
                    break;
            }
        });
    });

    // Handle physical keyboard inputs
    window.addEventListener('keydown', (e) => {
        const key = e.key;

        // Prevent default actions for standard browser shortcuts (like Backspace moving back or / searching)
        if (key === 'Backspace' || key === '/' || key === 'Enter') {
            e.preventDefault();
        }

        if (key >= '0' && key <= '9') {
            adicionarCaractere(key);
        } else if (key === '.') {
            adicionarCaractere('.');
        } else if (key === '+' || key === '-' || key === '*' || key === '/') {
            adicionarOperador(key);
        } else if (key === 'Enter' || key === '=') {
            calcular();
        } else if (key === 'Backspace') {
            apagarUltimo();
        } else if (key === 'Escape' || key === 'c' || key === 'C') {
            limparTudo();
        }
    });
});
