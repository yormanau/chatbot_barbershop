/** Flujo captar datos, se activa con cualquier palabra se no sea una palabra clave en 
 * cualquiera de los otros flujos
 */

// Probando git

// Importaciones
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { iniciar_temporizador, cancelar_temporizador } = require('../Funciones/temporizador.js')
const { Mensaje } = require('../Funciones/mensajesLoader.js')
const { controlar_intentos  } = require('../Funciones/intentos.js')
const estadosUsuario = require('../Funciones/estado_usuario.js')


//Flujos
const flujo_bienvenida = require('./02_bienvenida_reserva.js') 
const flujo_confirmar = require('./confirmar.js') 
const flujo_cancelar = require('./cancelar.js') 
const flujo_inactivo = require('./inactivo.js')
const flujo_intentos = require('./intentos.js')


//Variables
const segundos_temp = 300

const flujo_captar_datos = addKeyword(EVENTS.WELCOME)
    .addAction(
        // Comprueba que el usuario no esté en espera para confirmar la reservación.
        async (ctx, { flowDynamic, gotoFlow }) => {
            const numero = ctx.from;
            iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                }, segundos_temp);
                
            const estado_usuario = estadosUsuario.get(numero);
            
            if (estado_usuario?.estado === 'esperando_confirmacion') {
                // El bot esperará la respuesta del usuario si está en estado de espera
                return await flowDynamic(Mensaje('confirmar_asistencia.txt'))
            } else {
                // Lo envía al flujo bienvenida en caso de ser falso
                return gotoFlow(flujo_bienvenida)
            }
    })
    .addAction({capture:true},
        async (ctx, {fallBack, gotoFlow}) => {
            // El usuario responderá si confirma o no
            cancelar_temporizador(ctx.from)

            const msg = ctx.body.trim().toLowerCase()
            const intentos = controlar_intentos(ctx.from);

            if (!intentos.permitido) {
                
                return gotoFlow(flujo_intentos);
            }
            
            if (msg === '1') {
                
                return gotoFlow(flujo_confirmar)
            } else if (msg === '2') {
                return gotoFlow(flujo_cancelar)
            } else {
                
                iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                }, segundos_temp);
                return fallBack(Mensaje('confirmar_asistencia.txt'))
            }   
        }
    )


module.exports =  flujo_captar_datos;