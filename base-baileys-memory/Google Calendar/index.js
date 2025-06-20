//
require('dotenv').config();

const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: './google.json',
  scopes: ['https://www.googleapis.com/auth/calendar']
})

const calendarID = process.env.CALENDAR_ID;

const timeZone = 'America/Bogota';

const rangeLimit = {
  days: [1,2,3,4,5,6,7],
  startHour : 9,
  endHour: 20
};

const standarDuration = 1;
const dateLimit = 30;


// Crear un evento
/**
 * 
 * @param {string} eventName - Nombre del evento.
 * @param {string} description - Descripción del evento.
 * @param {*} date - Fecha y hora de inicio deel evento en formato ISO
 * @param {number} [duration=standarDuration]
 * @param {string} URL - URL de la invitacion al evento 
 */

async function createEvent(eventName, description, date, duration = standarDuration) {
  try {
    const authClient = await auth.getClient();
    //google.options({ auth: authClient })
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const startDateTime = new Date(date)

    const endDateTime = new Date(startDateTime);
    //endDateTime.setHours(startDateTime.getHours() + duration)
    endDateTime.setMinutes(startDateTime.getMinutes() + duration * 60);


    const event = {
      summary: eventName,
      description: description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: timeZone,
      },
      colorId: '2'
    };

    const response = await calendar.events.insert({
      calendarId: calendarID,
      resource: event,
    });

    const eventId = response.data.id;
    console.log('Evento creado con éxito.')
    return eventId

  } catch (error) {
    console.log('Hubo un error al crear el evento en el servicio de Calendar:')
    throw error;
  }
}

/*
createEvent(
  'Reunión de equipo',
  'Discusión semanal de progreso del proyecto.',
  '2025-06-13T15:00:00-05:00',
  1
).then(eventId => {
  console.log('ID del evento:', eventId);
}).catch(console.error);

*/
function fechaISO(fecha, hora, zona = '-05:00') {
  return `${fecha}T${hora}:00${zona}`;
}

async function deleteEvent(eventId) {
    try {
        const authClient = await auth.getClient();
        //google.options({ auth: authClient })
        const calendar = google.calendar({ version: 'v3', auth: authClient });
        await calendar.events.delete({
            calendarId: calendarID, // Cambia si usas otro calendario
            eventId,
        });
        console.log(`✅ Evento eliminado: ${eventId}`);
    } catch (error) {
        console.error(`❌ Error al eliminar el evento ${eventId}:`, error);
    }
}

module.exports = { createEvent, fechaISO, deleteEvent }