/* Flujo fecha, comprueba el dato ingresado por el usuario y que sea una fecha
válida*/

// Importaciones
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { iniciar_temporizador, cancelar_temporizador } = require('../Funciones/temporizador.js')
const { Mensaje } = require('../Funciones/mensajesLoader.js')
const { controlar_intentos, resetear_intentos } = require('../Funciones/intentos.js')
const { esDiaValido } = require('../Funciones/fecha.js')

//Flujos
const flujo_inactivo = require('./inactivo.js')
const flujo_intentos = require('./intentos.js')
const flujo_hora = require('./05_hora.js')

//Variables
const segundos_temp = 300
//const horaActual = date.getHours() // devuelve formato 24HRS

const flujo_fecha = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const horaActual = new Date().getHours();
        resetear_intentos(ctx.from);

        iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
                resetear_intentos(ctx.from);

        if (horaActual >= 0 && horaActual < 20) {
            return await flowDynamic(Mensaje('fecha.txt'))
        } else {
            return await flowDynamic(Mensaje('fechaAlt.txt'))
        }
    
    })
    .addAction({capture:true,delay: 1000}, 
        async (ctx, { state, gotoFlow, fallBack, flowDynamic }) => {
            const msg = ctx.body.trim().toLowerCase()
            const horaActual = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" })).getHours();

            //const horaActual = new Date().getHours();
            cancelar_temporizador(ctx.from)

            const fecha = [{id: '1', valor: 'hoy'},
                {id: '2', valor: 'elegir'}];

            const seleccion = fecha.find(f => f.id === msg);

            if (horaActual >= 0 && horaActual < 20) {

                if (seleccion?.id === '1') {

                    await state.update({ fecha: esDiaValido(seleccion.valor).fecha })
                    await state.update({fechaSQL : esDiaValido(seleccion.valor).fechaSQL})

                    return gotoFlow(flujo_hora)

                } else if (seleccion?.id === '2') {
                    
                    iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
                resetear_intentos(ctx.from);
                    
                    return await flowDynamic('📅 Indique el día del mes...')
                } else {

                    const intentos = controlar_intentos(ctx.from);
                    if (!intentos.permitido) return gotoFlow(flujo_intentos);

                    
                    iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
               

                    return fallBack(Mensaje('fecha.txt'))
                }
            } else {
                if (msg === '1') {
                    await state.update({ fecha: esDiaValido('mañana').fecha })
                    await state.update({fechaSQL : esDiaValido('mañana').fechaSQL})
                    
                    return gotoFlow(flujo_hora)

                } else if (msg === '2') {
                    
                    iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
                resetear_intentos(ctx.from);
                    return await flowDynamic('📅 Indique el día del mes...')
                } else {
                    const intentos = controlar_intentos(ctx.from);
                    if (!intentos.permitido) return gotoFlow(flujo_intentos);

                    
                    iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
             

                    return fallBack(Mensaje('fechaAlt.txt'))
                }
            }
        }
    )
    .addAction({capture:true,delay: 1000}, 
        async (ctx, { gotoFlow, state, fallBack }) => {
           
            const msg = ctx.body.trim().toLowerCase()
            const esValido = esDiaValido(msg)

            cancelar_temporizador(ctx.from)

            if (esValido.valido === false) {
                const intentos = controlar_intentos(ctx.from);
                if (!intentos.permitido) return gotoFlow(flujo_intentos); 
               
                
                iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
            

                return fallBack(esValido.motivo)
            } else {
                await state.update({fecha : esValido.fecha, fechaSQL : esValido.fechaSQL})

                return gotoFlow(flujo_hora)
            }
        }
    )

module.exports = flujo_fecha;