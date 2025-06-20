
// Función para enviar mensaje a un número específico por WhatsApp
const enviar_mensaje = async (provider, numeroSinPrefijo, mensaje) => {
    try {
        // Asegurarse de que el número esté en formato correcto (con código país)
        const numeroFormateado = `${numeroSinPrefijo}@s.whatsapp.net`;

        await provider.sendText(numeroFormateado, mensaje);

        console.log(`✅ Mensaje enviado a ${numeroSinPrefijo}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Error al enviar mensaje a ${numeroSinPrefijo}:`, error);
        return { success: false, error };
    }
};


module.exports = { enviar_mensaje };