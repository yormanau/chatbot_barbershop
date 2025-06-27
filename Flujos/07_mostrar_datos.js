/* Flujo mostrar_datos, muestra los datos de la reserva al usuario, genera la reservación
en la db de la tabla reservas y también crea un evento en calendar con los datos de la reservación*/

// Importaciones
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { Mayus } = require('../Funciones/mayuscula.js')
const { buscar_numero_celular, generar_reserva, guardar_event_id } = require('../Funciones/mysql.js')
const { createEvent, fechaISO } = require('../Google Calendar/index.js')
const { enviar_mensaje } = require('../Funciones/enviar_mensaje.js')
const adapterProvider = require('../app.js')
const { formatear_fecha } = require('../Funciones/fecha.js')
// Variables
const date = new Date()
const fecha_actual = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function convertirFecha(fecha) {
  const [dia, mes, año] = fecha.split('/'); // Dividir la fecha por "/"
  return `${año}-${mes}-${dia}`; // Reorganizar al formato yyyy-mm-dd
}

const flujo_mostrar_datos = addKeyword(EVENTS.ACTION)
    .addAnswer('📍 Reserva registrada')
    .addAction(
        async (ctx, { flowDynamic, state }) => {
            const myState = state.getMyState()
           
            return await flowDynamic(`📛 *Nombre:* ${Mayus(myState.names)} \n📅 *Fecha:* ${myState.fechaSQL === fecha_actual ? 'Hoy': formatear_fecha(myState.fechaSQL)} \n🕘 *Hora:* ${myState.hour} \n✂️ *Barbero:* ${Mayus(myState.name_empleado)}`)
    })
    .addAction(
        async (ctx, { state, endFlow }) => {
            const myState = state.getMyState()
            const cliente = await buscar_numero_celular(ctx.from)

            const fecha_hora = `${convertirFecha(myState.fecha)} ${myState.hora24}`;

            function limpiar_fecha(fechaISO) {
                return fechaISO.replace('T', ' ').replace('Z', '')
            }
            const fecha = new Date(fecha_hora).toISOString()
            const fecha_insert = limpiar_fecha(fecha);


            const datos_reserva = { fecha: myState.fechaSQL,
                                hora: myState.hora24,
                                cliente_id: cliente.id,
                                empleado_id: myState.empleado_id,
                                estado: 'PENDIENTE',
                                fecha_hora: fecha_insert}


            generar_reserva(datos_reserva, async (respuesta) => {

            if (respuesta.success) {
                
                /*
                

                createEvent(`${Mayus(myState.name_empleado)}`, `${Mayus(myState.names)}`, fechaISO(myState.fechaSQL, myState.hora24), 1).then(async (eventId) => {
                                    await guardar_event_id(respuesta.reserva_id, eventId);
                                    }).catch(console.error);*/
                
                const mensajeEmpleado = `📢¡Hola! el Sr. *${myState.names}* ha *RESERVADO* contigo para el ${formatear_fecha(myState.fechaSQL)} a las ${myState.hour}.`;
                await enviar_mensaje(adapterProvider, myState.num_empleado, mensajeEmpleado);
                return endFlow('¡Te esperamos! 😎✨')
                
            } /*else {
                //console.log('❌ Error:', respuesta.message);
                if (respuesta.error) {
                    console.error(respuesta.error)
                }; // Para ver el error técnico si lo hay
            }*/
            })
        })

module.exports = flujo_mostrar_datos;