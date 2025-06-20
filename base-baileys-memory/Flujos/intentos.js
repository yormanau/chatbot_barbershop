/* Se activa cuando la funcion intentos se cumple*/
// Importaciones 
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const flujo_intentos = addKeyword(EVENTS.ACTION)
    .addAnswer('⛔ Has superado el número de intentos permitidos.\nVuelve a intentarlo de nuevo.')

module.exports = flujo_intentos;