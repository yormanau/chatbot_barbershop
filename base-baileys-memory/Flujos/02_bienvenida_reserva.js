/**
 * Flujo bienvenida, envía un mensaje de bienvenida al usuario y muestra las opciones disponibles para realizar una acción.
 */
// Importaciones
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { iniciar_temporizador, cancelar_temporizador } = require('../Funciones/temporizador.js')
const estadosUsuario = require('../Funciones/estado_usuario.js')
const { Mensaje } = require('../Funciones/mensajesLoader.js')
const { buscar_reservas_activas } = require('../Funciones/mysql.js')
const { controlar_intentos, resetear_intentos } = require('../Funciones/intentos.js')

//Flujos
const flujo_empleados = require('./03_empleados.js')
const flujo_confirmar = require('./confirmar.js')
const flujo_cancelar = require('./cancelar.js')
const flujo_inactivo = require('./inactivo.js')
const flujo_intentos = require('./intentos.js')

//Variables
const segundos_temp = 300


const flujo_bienvenida = addKeyword(EVENTS.ACTION)
    .addAnswer(Mensaje('bienvenida.txt'), {
            delay: 1000
        }, async (ctx) => {
            iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                }, segundos_temp);
            resetear_intentos(ctx.from);
        })
        
    .addAction({capture:true},
        // Espera una respuesta del usuario según las opciones mostradas
        async (ctx, { fallBack, gotoFlow, flowDynamic }) => {

            cancelar_temporizador(ctx.from)

            const msg = ctx.body.trim().toLowerCase();
            const reservas = await buscar_reservas_activas(ctx.from)
            const numero = ctx.from;
            const estado_usuario = estadosUsuario.get(numero);
            
            if (msg === '1') {
                // Comprobará si el usuario tiene reservas pendientes o canceladas
                // De ser verdadero, le dice que no puede agendar

                if (reservas.length > 0) {
                    console.log('reservas')
                    const estado = reservas[0].estado

                    if (estado === 'CONFIRMADO') {
                        await flowDynamic('Ya tiene una reserva confirmada.\nPara editar o generar una nueva reservación por favor cancele la actual.')
                        return gotoFlow(flujo_cancelar)

                    } else {

                        if (estado === 'PENDIENTE' || estado_usuario === 'esperando_confirmacion') {
                            await flowDynamic('Tiene una reserva pendiente.\nConfirme su asistencia o cancele la reservación.')
                            return gotoFlow(flujo_confirmar)
                        }
                    }

                } else {
                    // Si nada de lo anterior se cumple, va al flujo empleados
                    return gotoFlow(flujo_empleados)
                }
            } else if (msg === '2') {
                return gotoFlow(flujo_cancelar)
            } else {
                const intentos = controlar_intentos(ctx.from);

                if (!intentos.permitido) return gotoFlow(flujo_intentos);
                
                iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
                
            
                return fallBack(Mensaje('bienvenidaError.txt'))
            }
        })

module.exports = flujo_bienvenida;