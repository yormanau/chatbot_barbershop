/* Flujo datos_user, consulta el numero de celular del usuario en la tabla clientes,
si no existe le solitará los datos al usuario como nombre y apellido, inserta esos
datos en la tabla clientes. */

// Importaciones
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { iniciar_temporizador, cancelar_temporizador } = require('../Funciones/temporizador.js')
const { controlar_intentos, resetear_intentos } = require('../Funciones/intentos.js')
const { validar_nombres } = require('../Funciones/mayuscula.js')

const { insertar_cliente_db, buscar_numero_celular } = require('../Funciones/mysql.js')
//Flujos
const flujo_inactivo = require('./inactivo.js')
const flujo_intentos = require('./intentos.js')
const flujo_mostrar_datos = require('./07_mostrar_datos.js')

//Variables
const segundos_temp = 300

const flujo_datos_user = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, {state, flowDynamic, gotoFlow }) => {
        const cliente = await buscar_numero_celular(ctx.from)
        resetear_intentos(ctx.from);

        if (cliente) {
            await state.update({names: cliente.nombres, celular: ctx.from, cliente_id: cliente.id});
            return gotoFlow(flujo_mostrar_datos)
        } else {
            
            iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
                resetear_intentos(ctx.from);
            return await flowDynamic('Ingrese su nombre y apellido.')
        }
    })
    .addAction({capture:true, delay: 1000},
        async (ctx, { state, fallBack, gotoFlow }) => {

            cancelar_temporizador(ctx.from)

            const resultado = validar_nombres(ctx.body)

            if (resultado.valido) {
                await state.update({names: resultado.nombres, celular: ctx.from})
                await insertar_cliente_db(resultado.nombres, ctx.from)
                return gotoFlow(flujo_mostrar_datos)
            } else {
                const intentos = controlar_intentos(ctx.from);
                if (!intentos.permitido) return gotoFlow(flujo_intentos);

                
                iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
                resetear_intentos(ctx.from);         
                return fallBack(resultado.mensaje)
            }
    })

module.exports = flujo_datos_user;