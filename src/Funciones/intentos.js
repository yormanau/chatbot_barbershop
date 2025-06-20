const intentos = new Map();

/**
 * Controla el número de intentos por clave (como el número de teléfono).
 * @param {string|number} clave - Identificador único (por ejemplo, el número de teléfono del usuario).
 * @param {number} maxIntentos - Límite máximo de intentos (por defecto 3).
 * @returns {{ permitido: boolean, mensaje?: string }}
 */
function controlar_intentos(clave, maxIntentos = 3) {
    let contador = intentos.get(clave) || 0;
    contador += 1;
    intentos.set(clave, contador);

    if (contador > maxIntentos) {
        intentos.delete(clave); // Reinicia si se supera el límite
        return {
            permitido: false,
            mensaje: '⛔ Has superado el número de intentos permitidos.\nVuelve a intentarlo de nuevo.'
        };
    }

    return { permitido: true };
}
function resetear_intentos(clave) {
    intentos.delete(clave);
}

module.exports = { controlar_intentos, resetear_intentos };

