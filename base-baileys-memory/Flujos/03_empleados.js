/*Flujo empleados, consulta la base de datos los empleados activos y los
muestra al usuario para que elija el de su preferencia */
// Importaciones
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { iniciar_temporizador, cancelar_temporizador } = require('../Funciones/temporizador.js')
const { Mensaje } = require('../Funciones/mensajesLoader.js')
const { obtener_empleados } = require('../Funciones/mysql.js')
const { numero_emoji } = require('../Funciones/mayuscula.js')
const { controlar_intentos, resetear_intentos } = require('../Funciones/intentos.js')
const { buscar_empleados } = require('../Funciones/buscar_empleados.js')

//Flujos
const flujo_inactivo = require('./inactivo.js')
const flujo_intentos = require('./intentos.js')
const flujo_fecha = require('./04_fecha.js')

//Variables
const segundos_temp = 300

const flujo_empleados = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state, endFlow, gotoFlow }) => {
        resetear_intentos(ctx.from);
        try {
            
            iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
                resetear_intentos(ctx.from);
            const empleados = await obtener_empleados(); 
            await state.update({ empleados })
            const myState = await state.getMyState()
            const empleado = myState.empleados;
            

            const lista = empleado.map(emp => `    ${numero_emoji(emp.opcion)} *${emp.nombres}*`).join('\n');
            await state.update({ listaEmpleados : lista })

            return await flowDynamic(`${Mensaje('empleados.txt')}\n\n${lista}`)

        } catch (error) {
            console.log(error)
            
            return endFlow('Hubo un error, vuelva a intentarlo.')
        }
    })
    .addAction({capture:true,delay: 1000}, 
        async (ctx, {fallBack, state, gotoFlow}) => {

            cancelar_temporizador(ctx.from)

            const msg = ctx.body.trim()

            const myState = await state.getMyState()
            const empleados = myState.empleados
            
            const resultado = buscar_empleados(empleados, msg)

            if (resultado.error) {

                const intentos = controlar_intentos(ctx.from);
                if (!intentos.permitido) return gotoFlow(flujo_intentos);

                
                iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
                

                return fallBack(`${resultado.error}\n\n_(Por favor responde con el número de tu opción)_\n\n${myState.listaEmpleados}`);
            }

            const elegido = resultado.empleado;
            await state.update({ empleado_id: elegido.id, name_empleado: elegido.nombres });

            return gotoFlow(flujo_fecha);
        }
    )

module.exports = flujo_empleados;