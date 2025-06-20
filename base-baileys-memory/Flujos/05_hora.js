/* Flujo hora, consulta la base de datos la fecha y empleado ingresado por el usuario y luego
valida las horas ocupadas para mostrar un rango de horas disponibles */

// Importaciones
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { iniciar_temporizador, cancelar_temporizador } = require('../Funciones/temporizador.js')
const { controlar_intentos, resetear_intentos } = require('../Funciones/intentos.js')
const { detectar_hora, validar_hora_turno, esta_en_tramos, validar_rangos } = require('../Funciones/hora.js')
const { generar_disponibilidad, obtener_horas_ocupadas, formato12Horas, obtener_hora_inicio } = require('../Funciones/disponibilidad.js')

//Flujos
const flujo_inactivo = require('./inactivo.js')
const flujo_intentos = require('./intentos.js')
const flujo_datos_user = require('./06_datos_user.js')


//Variables
const segundos_temp = 300;
const date = new Date();
const fecha_actual = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const flujo_hora = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, flowDynamic, gotoFlow }) => {
        resetear_intentos(ctx.from);
        const myState = state.getMyState()
        iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
                resetear_intentos(ctx.from);

        try {    
                

                const empleado_id = myState.empleado_id;
                const fecha_user = myState.fechaSQL; 
            
              
                const horaInicio = obtener_hora_inicio(fecha_user);
                
                const horas_ocupadas = await obtener_horas_ocupadas(empleado_id, fecha_user);
     

                const rangos_disponibles = generar_disponibilidad(horaInicio, horas_ocupadas);

                //console.log(rangos_disponibles)

                let horarios = ' ';

                if (fecha_user === fecha_actual) {
                    const validar_rangos_disponibles = validar_rangos(rangos_disponibles)
                    horarios = validar_rangos_disponibles;
                } else {
                    horarios = rangos_disponibles; 
                }
                //const horarios = formato12Horas(rangos_disponibles)
                await state.update({horarios: horarios})
                await flowDynamic(` ⏰Horarios disponibles:⏰\n\n_(Escriba una hora según su disponibilidad)_\n\n\*${formato12Horas(horarios).join('\*\n\n\*')}*`);

              } catch (error) {
                console.error('Error:', error);
              }

    })
    .addAction(
        {capture:true,delay: 1000},
        async (ctx, { state, fallBack, gotoFlow }) => {
            const myState = state.getMyState()
            const horarios = myState.horarios

            cancelar_temporizador(ctx.from)
            
            const msg = ctx.body.trim().toLowerCase()
            const fecha = myState.fecha;
            const hora = detectar_hora(msg);

            if (!hora.valido) {
                const intentos = controlar_intentos(ctx.from);
                if (!intentos.permitido) return gotoFlow(flujo_intentos);

                
               iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
              
                    
                return fallBack(hora.motivo + `\n\n⏰*Horarios disponibles:*⏰\n\n_(Escriba una hora según su disponibilidad)_\n\n\*${formato12Horas(horarios).join('\*\n\n\*')}*`)
            }

            const resultado = validar_hora_turno(msg, fecha)
            

            if (!resultado.valido) {
                const intentos = controlar_intentos(ctx.from);
                if (!intentos.permitido) return gotoFlow(flujo_intentos);
                
                iniciar_temporizador(ctx.from, () => {
                    return gotoFlow(flujo_inactivo);
                    }, segundos_temp);
             
                    
                return fallBack(resultado.motivo + `\n\n⏰*Horarios disponibles:*⏰\n\n_(Escriba una hora según su disponibilidad)_\n\n\*${formato12Horas(horarios).join('\*\n\n\*')}*`)
            } else {
                if (esta_en_tramos(resultado.hora24, horarios)) {
                    //console.log('✅ Hora válida');
                    await state.update({ hour: resultado.hora, hora24 : resultado.hora24})

                    return gotoFlow(flujo_datos_user)

                } else {
                    const intentos = controlar_intentos(ctx.from);
                    if (!intentos.permitido) return gotoFlow(flujo_intentos);
                        iniciar_temporizador(ctx.from, () => {
                        return gotoFlow(flujo_inactivo);
                        }, segundos_temp);
                     
                    return fallBack(`❌ Ingrese una hora válida.\n\n⏰*Horarios disponibles:*⏰\n\n_(Escriba una hora según su disponibilidad)_\n\n\*${formato12Horas(horarios).join('\*\n\n\*')}*`)
                    }
                
            }
        }
    )

module.exports = flujo_hora;