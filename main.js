const Discord = require('discord.js');
const {
    prefix,
    token,
} = require('./settings.json');
const ytdl = require('ytdl-core');

const client = new Discord.Client();

const queue = new Map();

client.on('ready', () => {
    console.log(`${client.user.tag} ONLINE`);
    client.user.setActivity('/play', {type: 'LISTENING'}).catch(console.error);
});



client.on('message', async message => {
    if (!message.guild) return;
    if (message.content.startsWith(`${prefix}satan`)) {
        const user = message.mentions.users.first();
        if (user) {
            const member = message.guild.member(user);

            if (member) {

                message.channel.send
            }
        }
    }
});

client.on('message', async message => {
    if (!message.guild) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    const lowerCaseMessage = message.content.toLowerCase();

    if (lowerCaseMessage.startsWith(`${prefix}play`)) {
        //Play command
        execute(message, serverQueue);
        return;
    } else if (lowerCaseMessage.startsWith(`${prefix}skip`)) {
        //Skip command
        skip(message, serverQueue);
        return;
    } else if (lowerCaseMessage.startsWith(`${prefix}stop`)) {
        //Stop command
        stop(message, serverQueue);
        return;
    }
});

async function execute(message, serverQueue) {
    const args = message.content.split(' ');
    const voiceChannel = message.member.voiceChannel;

    if (!voiceChannel) return message.channel.send(':bangbang:You should be on the voice channel:bangbang:');
    const permissions = voiceChannel.permissionsFor(message.client.user);

    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.send(':bangbang:You dont have permission!');
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url,
    };

    if (!serverQueue) {

        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };


        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {

            var connection = await voiceChannel.join();
            queueContruct.connection = connection;

            play(message.guild, queueContruct.songs[0]);
        } catch (err) {

            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }

    } else {

        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        return message.channel.send(`:poop:${song.title} Queued.:poop:`);
    }
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', () => {
            console.log('It s Over');

            serverQueue.songs.shift();

            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => {
            console.log(error);
        });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

function skip(message, serverQueue) {
    if (!message.member.voiceChannel) return message.channel.send(':bangbang:You should be on the voice channel:bangbang:');
    if (!serverQueue) return message.channel.send(':bangbang:There is no song you can skip:bangbang:');
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
    if (!message.member.voiceChannel) return message.channel.send(':bangbang:You should be on the voice channel:bangbang:');
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

client.login(token);