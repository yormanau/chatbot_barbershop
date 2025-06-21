/* Flujo mostrar_datos, muestra los datos de la reserva al usuario, genera la reservación
en la db de la tabla reservas y también crea un evento en calendar con los datos de la reservación*/

// Importaciones
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { Mayus } = require('../Funciones/mayuscula.js')
const { buscar_numero_celular, generar_reserva, guardar_event_id } = require('../Funciones/mysql.js')
const { createEvent, fechaISO } = require('../Google Calendar/index.js')
// Variables
const date = new Date();
const fecha_actual = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const flujo_mostrar_datos = addKeyword(EVENTS.ACTION)
    .addAnswer('Datos de la reserva:')
    .addAction(
        async (ctx, { flowDynamic, state }) => {
            const myState = state.getMyState()
           
            return await flowDynamic(`*Nombre y apellido:* ${Mayus(myState.names)} \n*Para:* ${myState.fechaSQL === fecha_actual ? 'Hoy': myState.fecha} \n*Hora:* ${myState.hour} \n*Barbero:* ${Mayus(myState.name_empleado)}`)
    })
    .addAction(async (ctx, { state, endFlow }) => {
        const myState = state.getMyState()
        const cliente = await buscar_numero_celular(ctx.from)
        const datos_reserva = { fecha: myState.fechaSQL,
                            hora: myState.hora24,
                            cliente_id: cliente.id,
                            empleado_id: myState.empleado_id,
                            estado: 'PENDIENTE'}

        generar_reserva(datos_reserva, (respuesta) => {

        if (respuesta.success) {
            //console.log('✅ Reserva exitosa. ID:', respuesta.reserva_id);

            createEvent(`${Mayus(myState.name_empleado)}`, `${Mayus(myState.names)}`, fechaISO(myState.fechaSQL, myState.hora24), 1).then(async (eventId) => {
                                await guardar_event_id(respuesta.reserva_id, eventId);
                                }).catch(console.error);
            return endFlow('Te esperamos.')
            
        } /*else {
            //console.log('❌ Error:', respuesta.message);
            if (respuesta.error) {
                console.error(respuesta.error)
            }; // Para ver el error técnico si lo hay
        }*/
        })
    })

module.exports = flujo_mostrar_datos;