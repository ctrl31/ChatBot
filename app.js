const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
} = require("@bot-whatsapp/bot");

const QRPortalWeb = require("@bot-whatsapp/portal");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MySQLAdapter = require("@bot-whatsapp/database/mysql");

/**
 * Configuración de MySQL
 */
const MYSQL_DB_HOST = "localhost";
const MYSQL_DB_USER = "root";
const MYSQL_DB_PASSWORD = "";
const MYSQL_DB_NAME = "bot";
const MYSQL_DB_PORT = "3306";

/**
 * Subflujos
 */

// Flow de Reporte
const flowReporte = addKeyword(["1", "reporte"])
  .addAnswer(
    [
      "🛠️ Has elegido *Reporte de falla o fuga de agua*.",
      "🚨 Puede indicar si la fuga es en su domicilio o en la vialidad ",
      "Por favor solo escriba *domicilio* o *vialidad",
    ],
    { capture: true },
    async (ctx, { fallBack, state, flowDynamic }) => {
      const tipo = ctx.body.toLowerCase();
      if (tipo != "domicilio" && tipo != "vialidad") return fallBack();
      await state.update({ tipo });
      
    }
  )
  .addAnswer(
    [
      "👍 Entendido. Ahora, por favor indícame:",
      "📍 Dirección exacta o una referencia del lugar.",
    ],
    { capture: true },
    async (ctx, { state, flowDynamic }) => {
      const ubicacion = ctx.body;
      await state.update({ ubicacion });
      const data = await state.getMyState();
      await flowDynamic([
        "✅ Gracias por el reporte.",
        `📝 *Resumen del reporte:*`,
        `📌 Tipo: ${data.tipo}`,
        `📍 Dirección: ${data.ubicacion}`,
        "",
        "Nuestro equipo tomará acción pronto. 🙌",
        "¿Deseas hacer algo más? Escribe *menu* para volver al inicio o *salir* para terminar.",
      ]);
    }
  );

// Flow de Solicitud
const flowSolicitud = addKeyword(["2", "solicitud"]).addAnswer([
  "📝 Has elegido *Solicitud de nuevo servicio*.",
  "Por favor indícanos:\n📍 Dirección del predio\n👤 Nombre del solicitante\n📞 Teléfono de contacto",
]);

// Flow de Consulta de Saldo
const flowConsultaSaldo = addKeyword(["3", "consulta", "saldo"])
  .addAnswer(
    "💰 Para consultar tu saldo, por favor ingresa tu número de cuenta:"
  )
  .addAnswer({ capture: true }, async (ctx, { flowDynamic }) => {
    const numero = ctx.body.trim();
    // Simulación de saldo
    const saldo = Math.floor(Math.random() * 1000) + 100;
    await flowDynamic([
      `🔎 El saldo del número *${numero}* es de *$${saldo}*.`,
      "¿Deseas hacer algo más? Escribe *menu* para volver al inicio o *salir* para finalizar.",
    ]);
  });

// Flow de Seguimiento
const flowSeguimiento = addKeyword(["4", "seguimiento"]).addAnswer([
  "📦 Para dar seguimiento, por favor proporciona tu número de folio o servicio:",
]);

// Flow de Otras
const flowOtras = addKeyword(["5", "otras"]).addAnswer([
  "📚 Por favor, escribe tu duda o describe brevemente cómo podemos ayudarte.",
]);

// Secundarios de documentación
const flowSecundario = addKeyword(["2", "siguiente"]).addAnswer([
  "📄 Aquí tenemos el flujo secundario",
]);

const flowDocs = addKeyword([
  "doc",
  "documentacion",
  "documentación",
]).addAnswer(
  [
    "📄 Aquí encuentras la documentación: https://bot-whatsapp.netlify.app/",
    "*2* Para siguiente paso.",
  ],
  null,
  null,
  [flowSecundario]
);

const flowGracias = addKeyword(["gracias", "grac"]).addAnswer(
  [
    "🚀 Puedes apoyar este proyecto en los siguientes enlaces:",
    "https://opencollective.com/bot-whatsapp",
    "https://www.buymeacoffee.com/leifermendez",
    "*2* Para siguiente paso.",
  ],
  null,
  null,
  [flowSecundario]
);

/**
 * Flujo Principal
 */
const flowPrincipal = addKeyword([
  "hola",
  "holaa",
  "hola!",
  "ola",
  "oli",
  "hi",
  "hello",
  "buenas",
  "holi",
])
  .addAnswer(
    "🤖 ¡Hola! Bienvenido al asistente virtual de *CAAMTH* 💧\nEstoy aquí para ayudarte."
  )
  .addAnswer(
    [
      "Por favor elige una opción escribiendo el número o palabra clave:",
      "",
      "1️⃣ *Reporte* de falla o fuga de agua",
      "2️⃣ *Solicitud* de nuevo servicio",
      "3️⃣ *Consulta* de saldo",
      "4️⃣ *Seguimiento* de un trámite o servicio",
      "5️⃣ *Otras* consultas o ayuda adicional",
    ],
    { capture: true },
    async (ctx, { gotoFlow, flowDynamic }) => {
      const input = ctx.body.toLowerCase();

      if (input.includes("1") || input.includes("reporte")) {
        return gotoFlow(flowReporte);
      }

      if (input.includes("2") || input.includes("solicitud")) {
        return gotoFlow(flowSolicitud);
      }

      if (
        input.includes("3") ||
        input.includes("consulta") ||
        input.includes("saldo")
      ) {
        return gotoFlow(flowConsultaSaldo);
      }

      if (input.includes("4") || input.includes("seguimiento")) {
        return gotoFlow(flowSeguimiento);
      }

      if (input.includes("5") || input.includes("otras")) {
        return gotoFlow(flowOtras);
      }

      await flowDynamic([
        "❌ Lo siento, no entendí tu respuesta.",
        "Por favor escribe el *número* o *palabra clave* de la opción que necesitas.",
      ]);
    },
    [flowDocs, flowGracias]
  );

/**
 * Main
 */
const main = async () => {
  const adapterDB = new MySQLAdapter({
    host: MYSQL_DB_HOST,
    user: MYSQL_DB_USER,
    database: MYSQL_DB_NAME,
    password: MYSQL_DB_PASSWORD,
    port: MYSQL_DB_PORT,
  });

  const adapterFlow = createFlow([
    flowPrincipal,
    flowDocs,
    flowGracias,
    flowReporte,
    flowSolicitud,
    flowConsultaSaldo,
    flowSeguimiento,
    flowOtras,
  ]);

  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};

main();
