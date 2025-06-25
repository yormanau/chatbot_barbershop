const { createBot, createProvider, createFlow } = require('@bot-whatsapp/bot')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const adapterProvider = createProvider(BaileysProvider)

module.exports = adapterProvider;

const { enviar_mensaje } = require('./Funciones/enviar_mensaje.js')
const { enviar_notificacion } = require('./Funciones/mysql.js')
const cron = require('node-cron');
const { convertirA12Horas } = require('./Funciones/disponibilidad.js')
const estadosUsuario = require('./Funciones/estado_usuario.js')
const QRPortalWeb = require('@bot-whatsapp/portal')
const MockAdapter = require('@bot-whatsapp/database/mock')
const { delay, ALL_WA_PATCH_NAMES } = require('@whiskeysockets/baileys')


cron.schedule('* * * * *', async () => {
  try {
    const reservas = await enviar_notificacion(); // Obtiene reservas con estado PENDIENTE

    for (const reserva of reservas) {
      
        const mensaje = `🔔 Hola *${reserva.nombre_cliente}*, recuerda tu reserva para hoy a las ${convertirA12Horas(reserva.hora)} con ${reserva.nombre_empleado}.\n\nRecuerde llegar con anticipación.\n\nPor favor escriba *CONFIRMAR* o *CANCELAR.*`;
        const estadoAnterior = estadosUsuario.get(reserva.celular_cliente);
        
        if (estadoAnterior && estadoAnterior.reserva_id === reserva.id) {
        // Ya se envió notificación para esta reserva, lo ignoramos
            //console.log(`⏩ Ya se envió recordatorio para ${reserva.nombre_cliente}`);
          continue;
        }
        // Enviar al cliente
        await enviar_mensaje(adapterProvider, reserva.celular_cliente, mensaje);

        estadosUsuario.set(reserva.celular_cliente, {
            estado: 'esperando_confirmacion',
            nombre_cliente: reserva.nombre_cliente,
            hora: convertirA12Horas(reserva.hora),
            celular_empleado: reserva.celular_empleado,
            nombre_empleado: reserva.nombre_empleado,
            reserva_id: reserva.id,
        });

        // Enviar al empleado (si aplica)
        const mensajeEmpleado = `📢 El Sr. ${reserva.nombre_cliente} ha confirmado su reserva.`;
        await enviar_mensaje(adapterProvider, reserva.celular_empleado, mensajeEmpleado);

        //console.log(`Recordatorio enviado para ${reserva.nombre_cliente}`);
    }
  } catch (error) {
    console.error('Error en el cron:', error);
  }
});

const flujo_captar_datos = require('./Flujos/01_captar_datos.js')
const flujo_bienvenida = require('./Flujos/02_bienvenida_reserva.js')
const flujo_empleados = require('./Flujos/03_empleados.js')
const flujo_fecha = require('./Flujos/04_fecha.js')
const flujo_hora = require('./Flujos/05_hora.js')
const flujo_datos_user = require('./Flujos/06_datos_user.js')
const flujo_mostrar_datos = require('./Flujos/07_mostrar_datos.js')


const flujo_confirmar = require('./Flujos/confirmar.js')
const flujo_cancelar = require('./Flujos/cancelar.js')
const flujo_inactivo = require('./Flujos/inactivo.js')
const flujo_intentos = require('./Flujos/intentos.js')

const agradecimiento = require('./Flujos/agradecimiento.js')

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([
        flujo_captar_datos,
        flujo_bienvenida,
        flujo_empleados,
        flujo_fecha,
        flujo_hora,
        flujo_datos_user,
        flujo_mostrar_datos,
        
        flujo_cancelar,
        flujo_confirmar,
        flujo_inactivo,
        flujo_intentos,
        
        agradecimiento])
    
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB
    })

    QRPortalWeb()
     
}

main()