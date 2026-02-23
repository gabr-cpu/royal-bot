require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const pendingBets = new Map();
const fila = [];

client.once("ready", () => {
  console.log(`✅ RoyalBet online como ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  // ========================
  // CRIAR APOSTA
  // ========================
  if (interaction.customId === "criar_aposta") {

    const dados = {
      userId: interaction.user.id,
      valor: "20",
      modo: "1v1",
      dispositivo: "Mobile"
    };

    pendingBets.set(interaction.user.id, dados);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirmar_aposta")
        .setLabel("✅ Confirmar PIX")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("recusar_aposta")
        .setLabel("❌ Recusar")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      content: "⏳ Aguardando verificação do administrador...",
      components: [row]
    });
  }

  // ========================
  // CONFIRMAR (SÓ DONO)
  // ========================
  if (interaction.customId === "confirmar_aposta") {

    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ Apenas o dono pode confirmar.",
        ephemeral: true
      });
    }

    const autorId = interaction.message.interaction.user.id;
    const dados = pendingBets.get(autorId);
    if (!dados) return;

    pendingBets.delete(autorId);
    fila.push(dados);

    const embed = new EmbedBuilder()
      .setTitle("🎯 Jogador na fila")
      .setDescription(`<@${dados.userId}> está na fila`)
      .addFields(
        { name: "💵 Valor", value: `R$${dados.valor}`, inline: true },
        { name: "⚔️ Modo", value: dados.modo, inline: true },
        { name: "🎮 Dispositivo", value: dados.dispositivo, inline: true }
      )
      .setColor("#ff0000");

    await interaction.channel.send({ embeds: [embed] });

    await interaction.update({
      content: "✅ PIX confirmado. Jogador entrou na fila.",
      components: []
    });

    // ========================
    // FORMAR DUELO AUTOMÁTICO
    // ========================
    if (fila.length >= 2) {

      const player1 = fila.shift();
      const player2 = fila.shift();

      const duelo = new EmbedBuilder()
        .setTitle("⚔️ DUELO FORMADO")
        .setDescription(
          `<@${player1.userId}> 🆚 <@${player2.userId}>`
        )
        .addFields(
          { name: "💵 Valor", value: `R$${player1.valor}`, inline: true },
          { name: "⚔️ Modo", value: player1.modo, inline: true },
          { name: "🎮 Dispositivo", value: player1.dispositivo, inline: true }
        )
        .setColor("#ff0000");

      await interaction.channel.send({ embeds: [duelo] });
    }
  }

  // ========================
  // RECUSAR
  // ========================
  if (interaction.customId === "recusar_aposta") {

    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ Apenas o dono pode recusar.",
        ephemeral: true
      });
    }

    const autorId = interaction.message.interaction.user.id;
    pendingBets.delete(autorId);

    return interaction.update({
      content: "❌ Aposta recusada.",
      components: []
    });
  }

});

client.login(process.env.TOKEN);
