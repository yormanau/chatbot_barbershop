/* Flujo agradecimiento comprueba si el usuario a escrito alguna palabra de la lista
"palabras_agradecimiento" y da una respuestas aleatoria de la lista "respuesta"*/
const { addKeyword } = require('@bot-whatsapp/bot');

const palabras_agradecimiento = [
    "r", "ok", "listo", "gracias", "muchas gracias", "mil gracias", "todo bien", "bien, gracias",
    "súper", "chévere", "de una", "bacano", "vale", "dale", "de acuerdo", "perfecto", "ya quedó",
    "entiendo", "comprendido", "si señor", "si señora", "sí, todo claro", "todo claro", "graciela",
    "confirmado", "copiado", "estamos", "ya entendí", "me quedó claro", "me sirve", "me parece bien",
    "sí, gracias", "obvio", "parce, gracias", "todo en orden"
];

const respuestas = [
    "¡Estamos atentos! 👀",
    "¡Con gusto, ha sido un placer! 😊",
    "¡Genial!",
    "¡Perfecto!",
    "¡Súper! 🚀",
    "¡Me alegra, cualquier cosa por aquí estoy!",
    "¡Excelente!",
    "¡De una!",
    "¡Vale!"
];


const agradecimiento = addKeyword(palabras_agradecimiento)
    .addAnswer(async (_, { endFlow }) => {
        const respuesta_aleatoria = respuestas[Math.floor(Math.random() * respuestas.length)];
        return endFlow(respuesta_aleatoria);
    });


module.exports = agradecimiento;
