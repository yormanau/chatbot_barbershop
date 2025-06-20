/* Funciona con la función temporizador, cuando se acaba el tiempo se activa este 
flujo */
//Importaciones
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const flujo_inactivo = addKeyword(EVENTS.ACTION)
  .addAnswer('❌ Se canceló por inactividad. Si deseas comenzar de nuevo, escribe *hola*.');
  
module.exports = flujo_inactivo;