/* Flujo confirmar, funciona cuando el usuario confirma una reservación,
consulta la db y cambia el estado de la reserva a CONFIRMADO y envía una notifación
al empleado*/

// Importaciones
const { addKeyword } = require('@bot-whatsapp/bot')
const { iniciar_temporizador, cancelar_temporizador } = require('../Funciones/temporizador.js')
const estadosUsuario = require('../Funciones/estado_usuario.js')
const { Mensaje } = require('../Funciones/mensajesLoader.js')
const { controlar_intentos, resetear_intentos } = require('../Funciones/intentos.js')
const { estado_reserva } = require('../Funciones/mysql.js')
const { formatear_fecha } = require('../Funciones/fecha.js')
const { convertirA12Horas } = require('../Funciones/disponibilidad.js')

// Flujos
const flujo_cancelar = require('../Flujos/cancelar.js')
const flujo_inactivo = require('../Flujos/inactivo.js')
const flujo_intentos = require('../Flujos/intentos.js')

//Variables
const segundos_temp = 300

const flujo_confirmar = addKeyword('confirmar')
    //.addAnswer(Mensaje('confirmar_asistencia.txt'))
    .addAction(
        async (ctx, { endFlow, flowDynamic }) => {
            resetear_intentos(ctx.from);
            const numero = ctx.from;
            const estado_usuario = estadosUsuario.get(numero);

            iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
                resetear_intentos(ctx.from);
                
            if (estado_usuario?.estado === 'esperando_confirmacion') {
                const resultado = await estado_reserva(ctx.from, 'CONFIRMADO')
                if (resultado.valido){ 
                    const mensajeEmpleado = `📢 Hola, ${estado_usuario.nombre_empleado}.\n*${estado_usuario.nombre_cliente}* ha confirmado su cita de hoy a las ${estado_usuario.hora}.`;
                    //await enviar_mensaje(adapterProvider, estado_usuario.celular_empleado, mensajeEmpleado)
                    cancelar_temporizador(numero)
                    estadosUsuario.delete(numero)
                    return endFlow(`${resultado.mensaje}\nTe esperamos.`)
                } /*else {
                    console.log(resultado.mensaje)
                }*/
            }

            return await flowDynamic(Mensaje('confirmar_asistencia.txt'))
        }
    )
    .addAction({capture:true, delay: 1000},
        async (ctx, { fallBack, endFlow, gotoFlow }) => {

            cancelar_temporizador(ctx.from)

            const msg = ctx.body.trim().toLowerCase()
            
            if (msg === '1') {
                const resultado = await estado_reserva(ctx.from, 'CONFIRMADO')
                const {nombre_cliente, nombre_empleado, celular_empleado, hora, fecha} = resultado.datos;

                const mensajeEmpleado = `📢 Hola, ${nombre_empleado}.\n*${nombre_cliente}* ha confirmado su cita para ${formatear_fecha(fecha)} a las ${convertirA12Horas(hora)}.`;
                if (resultado.valido){ 
                    //await enviar_mensaje(adapterProvider, estado_usuario.celular_empleado, mensajeEmpleado)
                    //console.log(mensajeEmpleado)
                    return endFlow(`${resultado.mensaje}\nTe esperamos.`)
                } /*else {
                    console.log(resultado.mensaje)
                }*/
                
            } else if (msg === '2') {
                return gotoFlow(flujo_cancelar)
            } else {
                const intentos = controlar_intentos(ctx.from);
                if (!intentos.permitido) return gotoFlow(flujo_intentos);
                
                iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
             
                    
                return fallBack(Mensaje('confirmar_asistencia.txt'))
            }   
    })

module.exports = flujo_confirmar;