/* Flujo cancelar, funciona cuando el usuario desea cancelar una reservación,
consulta la db y cambia el estado de la reserva a CANCELADO y elimina el evento del 
calendar*/

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
const flujo_inactivo = require('../Flujos/inactivo.js')
const flujo_intentos = require('../Flujos/intentos.js')

//Variables
const segundos_temp = 3000

const flujo_cancelar = addKeyword('cancelar')
    .addAction(
        async (ctx, { endFlow, flowDynamic }) => {
            resetear_intentos(ctx.from);

            iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
                resetear_intentos(ctx.from);
            const numero = ctx.from;
            const estado_usuario = estadosUsuario.get(numero);
            //const reservas = await buscarReservasPorCelular(ctx.from);
            

            if (estado_usuario?.estado === 'esperando_confirmacion') {
                const resultado = await estado_reserva(ctx.from, 'CANCELADO')
                

                if (resultado.valido){ 
                    //await enviar_mensaje(adapterProvider, estado_usuario.celular_empleado, mensajeEmpleado)
                    //const mensajeEmpleado = `📢 Hola, ${estado_usuario.nombre_empleado}.\n*${estado_usuario.nombre_cliente}* ha cancelado su cita de hoy a las ${estado_usuario.hora}.`;
                    cancelar_temporizador(numero)
                    estadosUsuario.delete(numero)
                    return endFlow(`${resultado.mensaje}\nTe esperamos.`)
                } else {
                    console.log(resultado.mensaje)
                }
            } /*else if (reservas.length === 0) {
                return endFlow('📭 No tienes reservas activas para cancelar.');
            }*/
            return await flowDynamic(Mensaje('cancelar_asistencia.txt'))
        }
    )
    .addAction({capture:true, delay:1000}, 
        async (ctx, {fallBack, endFlow}) => {

            cancelar_temporizador(ctx.from)

            const msg = ctx.body.trim().toLowerCase()
            
            if (msg === '1') {
                const resultado = await estado_reserva(ctx.from, 'CANCELADO')
                
                if (resultado.valido){ 

                    const {nombre_cliente, nombre_empleado, celular_empleado, hora, fecha} = resultado.datos;
                    const mensajeEmpleado = `📢 Hola, ${nombre_empleado}.\n*${nombre_cliente}* ha cancelado su cita para el ${formatear_fecha(fecha)} a las ${convertirA12Horas(hora)}.`;
                    console.log(mensajeEmpleado)
                    return endFlow(`${resultado.mensaje}\nTe esperamos pronto.`)
                    
                } else {
                    return endFlow(`${resultado.mensaje}\nTe esperamos pronto.`)
                }

            } else if (msg === '2') {
                return endFlow('Te esperamos.')
            } else {
                const intentos = controlar_intentos(ctx.from);
                if (!intentos.permitido) return gotoFlow(flujo_intentos);
                
                iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
             
                    
                return fallBack(`_(Por favor responde con el número de tu opción)_\n\n*1️⃣ Si.*\n*2️⃣ No.*`)
            }
        }
    )

module.exports = flujo_cancelar;