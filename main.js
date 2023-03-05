const fs = require("fs");
const request = require('request');
const { PORT } = require('./server.js');
const { server } = require("./server.js");
const http = require('https');
const login = require("fca-unofficial");
const axios = require("axios");
const YoutubeMusicApi = require('youtube-music-api')
const ytdl = require('ytdl-core');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const ffmpegs = require('fluent-ffmpeg');
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({ apiKey: process.env.OPENAI_SECRET_KEY });
const openai = new OpenAIApi(configuration);
ffmpegs.setFfmpegPath(ffmpeg.path);
const musicApi = new YoutubeMusicApi()
const settings = fs.readFileSync('./customizable/settings.config', 'utf8');
const port = '' + PORT;


var msgs = {}; //ALL MESSAGES[messageID]
var cd = {}; //COOLDOWN[SenderID]
var prevmsgs = Array(2).fill(Array(4)); //PREVIOUS MESSAGES 2D ARRAY [Sender ID][Message Count 1-3]
var prevresponse = Array(2).fill(Array(4)); //AI's RESPONSE TO PREVIOUS MESSAGES [Sender ID][Message Count 1-3]


//FOR GLOBAL SCOPES
var prompt;


//GETSETTINGS

//BOTNAME
const nameRegex = /name\s*=\s*'([^']+)'/;
const match = settings.match(nameRegex);
const botName = match[1];

//ASK THE AI
async function ask(prompt) {
    const got = require('got');
    var output = "Oh wait, I guess something went wrong with my system.";
    const url = 'https://api.openai.com/v1/completions';
    const params = {
        "model": "text-davinci-003",
        "prompt": prompt,
        "max_tokens": 1500,
        "temperature": 1
    };
    const headers = {
        'Authorization': `Bearer ${process.env.OPENAI_SECRET_KEY}`,
    };
    try {
        const response = await got.post(url, {
            json: params,
            headers: headers
        }).json();
        output = `${response.choices[0].text}`;
    } catch (err) {
        console.log(err)
    }
    return output;
}

//GENERATE IMAGE
async function img(prompt) {
    response = await openai.createImage({
        prompt: prompt,
        n: 1,
        size: "512x512"
    });
    image_url = response.data.data[0].url;
    return image_url;
}

//LOG IN FACEBOOK
try {
    login({
        appState: JSON.parse(fs.readFileSync('customizable/appstate.json', 'utf8'))
    }, async (err, api) => {
        if (err) return console.error(err);
        else console.clear();

        //FUNCTIONS

        //CHECK IF THE MESSAGE IS FROM A GROUP
        async function isGroup(id) {
            return new Promise((resolve, reject) => {
                api.getThreadInfo(id, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        const isGroup = data.isGroup;
                        resolve(isGroup);
                    }
                });
            });
        }



        //GET NAME USING USER ID
        async function getName(id) {
            return new Promise((resolve, reject) => {
                api.getUserInfo(id, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        const name = data[id].name;
                        resolve(name);
                    }
                });
            });
        }



        //GET NICKNAME USING USER ID
        async function getNickname(id) {
            return new Promise((resolve, reject) => {
                api.getUserInfo(id, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        const nickname = data[id].alternateName;
                        resolve(nickname);
                    }
                });
            });
        }

        //GET PROFILE LINK USING USER ID
        async function getProfileUrl(id) {
            return new Promise((resolve, reject) => {
                api.getUserInfo(id, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        const url = data[id].profileUrl;
                        resolve(url);
                    }
                });
            });
        }

        //FUNCTIONS END


        //GET ACCOUNT INFO
        const botID = api.getCurrentUserID(); //GET THE CURRENT's USER ID
        const accountName = await getName(botID); //GET THE NAME OF THE CURRENT USER
        var accountNickname = await getNickname(botID);
        if (accountNickname == undefined) {
            var accountNickname = 'None'
        }; //GET THE NICKNAME OF THE CURRENT USER
        const accountProfileUrl = await getProfileUrl(botID); //GET THE PROFILE URL OF THE CURRENT USER



        //CONSOLE VERIFIER
        console.log("\x1b[33m", 'Bot Info: ', "\x1b[0m");
        console.log(' Bot name:   ', "\x1b[32m", botName, "\x1b[0m");
        console.log("\x1b[30m", '------------------------------------------------------------');
        console.log("\x1b[33m", 'Account Info: ', "\x1b[0m");
        console.log(' Name:       ', "\x1b[32m", accountName, "\x1b[0m");
        console.log(' ID:         ', "\x1b[32m", botID, "\x1b[0m");
        console.log(' Nickname:   ', "\x1b[32m", accountNickname, "\x1b[0m");
        console.log(' Profile URL:', "\x1b[32m", accountProfileUrl, "\x1b[0m");
        console.log("\x1b[30m", '------------------------------------------------------------');
        console.log("\x1b[33m", 'Server Info: ', "\x1b[0m");
        console.log(' Port:       ', "\x1b[32m", port, "\x1b[0m");

        console.log("\x1b[30m", '------------------------------------------------------------');
        console.log("\x1b[33m", 'REPL Info: ', "\x1b[0m");
        console.log(' REPL name:  ', "\x1b[32m", process.env.REPL_SLUG, "\x1b[0m");
        console.log(' REPL owner: ', "\x1b[32m", process.env.REPL_OWNER, "\x1b[0m");
        if (process.env.REPL_DB_URL != undefined) {
            console.log(' REPL DB URL:', "\x1b[32m", process.env.REPL_DB_URL, "\x1b[0m");
        }
        console.log(' REPL ID:    ', "\x1b[32m", process.env.REPL_ID, "\x1b[0m");




        //THE OPTION OF THE ACCOUNT
        api.setOptions({
            listenEvents: true,
            selfListen: true,
            autoMarkDelivery: false,
            online: true
        });

        //LISTEN FOR MESSAGES
        const listenEmitter = api.listen(async (err, event) => {
            if (err) return console.error(err);

            switch (event.type) {


                //IF THE MESSAGE IS A REPLY TO A MESSAGE
                case "message_reply":

                    //SAVES THE NEW MESSAGE TO THE MSGS ARRAY WITH THE INDEX OF THE MESSAGE ID
                    if (event.attachments.length != 0) {
                        if (event.attachments[0].type == "photo") {
                            msgs[event.messageID] = ['img', event.attachments[0].url]
                        }
                        else if (event.attachments[0].type == "animated_image") {
                            msgs[event.messageID] = ['gif', event.attachments[0].url]
                        }
                        else if (event.attachments[0].type == "sticker") {
                            msgs[event.messageID] = ['sticker', event.attachments[0].url]
                        }
                        else if (event.attachments[0].type == "video") {
                            msgs[event.messageID] = ['vid', event.attachments[0].url]
                        }
                        else if (event.attachments[0].type == "audio") {
                            msgs[event.messageID] = ['vm', event.attachments[0].url]
                        }
                    } else {
                        msgs[event.messageID] = event.body
                    }


                    var msg = event.body;

                    var fromGroup = await isGroup(event.threadID) //CHECK IF FROM A GROUP
                    var senderName = await getName(event.senderID) // GET THE SENDERNAME

                    if (!fromGroup) { //CHECK IF FROM A GROUP

                        if (event.messageReply.senderID === botID && event.senderID != botID) { // CHECK IF THE MESSAGE THAT HAS BEEN REPLIED IS FROM THE BOT

                            var prompt = 'This is a conversation between an AI(Druit) and a Human, if the Human is asking for an image respond "/d (the description of the image"), if the Human is asking for an image respond "/d (the description of the image")\n\n' + botName + ': ' + event.messageReply.body + '\n\n' + senderName + ': ' + msg; //BOT: (Replied message) \n\n USER: (message)

                            var response = await ask(prompt + '\n\n' + botName + ':') //ASK THE AI WITH THE ARRANGED PROMPT

                            api.sendMessage(response, event.threadID, event.messageID); //SEND THE AI's RESPONSE TO THE USER

                        }

                    }
                    break


                    //IF A MESSAGE IS JUST A NORMAL MESSAGE
                case "message":

                    //SAVES THE NEW MESSAGE TO THE MSGS ARRAY WITH THE INDEX OF THE MESSAGE ID
                    if (event.attachments.length != 0) {
                        if (event.attachments[0].type == "photo") {
                            msgs[event.messageID] = ['img', event.attachments[0].url]
                        }
                        else if (event.attachments[0].type == "animated_image") {
                            msgs[event.messageID] = ['gif', event.attachments[0].url]
                        }
                        else if (event.attachments[0].type == "sticker") {
                            msgs[event.messageID] = ['sticker', event.attachments[0].url]
                        }
                        else if (event.attachments[0].type == "video") {
                            msgs[event.messageID] = ['vid', event.attachments[0].url]
                        }
                        else if (event.attachments[0].type == "audio") {
                            msgs[event.messageID] = ['vm', event.attachments[0].url]
                        }
                    } else {
                        msgs[event.messageID] = event.body
                    }


                    var msg = event.body;

                    var fromGroup = await isGroup(event.threadID) //CHECK IF FROM A GROUP
                    var senderName = await getName(event.senderID) // GET THE SENDERNAME

                    if (event.attachments.length < 1 && !fromGroup) { //CHECK IF FROM A GROUP

                        //IF FIRST TIME MESSAGING THE AI
                        if (!(event.senderID in prevmsgs)) {

                            prevmsgs[event.senderID] = {}; //CREATE AN ARRAY FOR MESSAGE

                            prevmsgs[event.senderID][0] = msg; //SAVE THE NEW MESSAGE AS THE FIRST MESSAGE

                            var prompt = 'This is a conversation between an AI(Druit) and a Human, if the Human is asking for an image respond "/d (the description of the image")\n\n' + senderName + ': ' + prevmsgs[event.senderID][0]; //ARRANGE THE PROMPT TO BE SENDED INTO THE AI

                            //IF SECOND TIME MESSAGING THE AI
                        } else if ((0 in prevmsgs[event.senderID])) {

                            prevmsgs[event.senderID][1] = prevmsgs[event.senderID][0]; //MOVE THE FIRST MESSAGE AS THE SECOND MESSAGE

                            prevmsgs[event.senderID][0] = msg; //SAVE THE NEW MESSAGE AS THE FIRST MESSAGE

                            try {
                                var prompt = 'This is a conversation between an AI(Druit) and a Human, if the Human is asking for an image respond "/d (the description of the image")\n\n' + senderName + ': ' + prevmsgs[event.senderID][1] + '\n\n' + botName + ': ' + prevresponse[event.senderID][1] + '\n\n' + senderName + ': ' + prevmsgs[event.senderID][0];
                            } catch (err) {
                                console.log()
                            } //ARRANGE THE PROMPT TO BE SENDED INTO THE AI (user: prompt, ai: response, user: prompt)

                            //IF MANY TIMES MESSAGING THE AI 
                        } else if ((1 in prevmsgs[event.senderID])) {

                            prevmsgs[event.senderID][1] = prevmsgs[event.senderID][2]; //MOVE THE SECOND MESSAGE AS THE THIRD MESSAGE

                            prevmsgs[event.senderID][2] = prevmsgs[event.senderID][1]; //MOVE THE FIRST MESSAGE AS THE SECOND MESSAGE

                            prevmsgs[event.senderID][0] = msg; //SAVE THE NEW MESSAGE AS THE FIRST MESSAGE

                            var prompt = 'This is a conversation between an AI(Druit) and a Human, if the Human is asking for an image respond "/d (the description of the image")\n\n' + senderName + ': ' + prevmsgs[event.senderID][2] + '\n\n' + botName + ': ' + prevresponse[event.senderID][2] + '\n\n' + senderName + ': ' + prevmsgs[event.senderID][1] + '\n\n' + botName + ': ' + prevresponse[event.senderID][1] + '\n\n' + senderName + ': ' + prevmsgs[event.senderID][0]; //ARRANGE THE PROMPT TO BE SENDED INTO THE AI (user: prompt, ai: response, user: prompt, ai:response, user: prompt)
                        }

                        var response = await ask(prompt + '\n\n' + botName + ':') //ASK THE AI WITH THE ARRANGED PROMPT

                        //IF THE USER WANTS AN IMAGE
                        if (response.includes('/d')) {

                            var imagedes = response.substring(response.indexOf(" ") + 4).toLowerCase(); //IMAGE DESCRIPTION

                            var image_url = await img(imagedes); //IMAGE GENERATION(URL RETURN)

                            var callback = () => api.sendMessage({
                                body: `Here's ${imagedes}`,
                                attachment: fs.createReadStream(__dirname + "/cache/img.png")
                            }, event.threadID, () => fs.unlinkSync(__dirname + "/cache/img.png")); //FUNCTION THAT CREATES A READSTREAM AND DELETES IT AFTER SENDING TO THE USER

                            request(image_url).pipe(fs.createWriteStream(__dirname + "/cache/img.png")).on("close", () => callback()); //WRITES THE IMAGE ON THE READSTREAM THAT HAS BEEN CREATED AND CALLS THE CALLBACK FUNCTION

                        } else api.sendMessage(response, event.threadID, event.messageID); //SEND THE AI's RESPONSE TO THE USER

                        //IF FIRST TIME RESPONSING TO THE CONVO
                        if (!(event.senderID in prevresponse)) {

                            prevresponse[event.senderID] = {}; //CREATE AN ARRAY FOR RESPONSE

                            prevresponse[event.senderID][0] = response; //SAVE THE NEW RESPONSE AS THE FIRST RESPONSE

                            //IF SECOND TIME RESPONSING TO THE CONVO
                        } else if ((0 in prevresponse[event.senderID])) {

                            prevresponse[event.senderID][1] = prevresponse[event.senderID][0]; // MOVE THE FIRST RESPONSE AS THE SECOND RESPONSE

                            prevresponse[event.senderID][0] = response; //SAVE THE NEW RESPONSE AS THE FIRST RESPONSE

                            //IF MANY TIMES RESPONSING TO THE CONVO
                        } else if ((1 in prevresponse[event.senderID])) {

                            prevresponse[event.senderID][1] = prevresponse[event.senderID][2]; //MOVE THE SECOND RESPONSE AS THE THIRD RESPONSE

                            prevresponse[event.senderID][1] = prevresponse[event.senderID][0]; // MOVE THE FIRST RESPONSE AS THE SECOND RESPONSE

                            prevresponse[event.senderID][0] = response; //SAVE THE NEW RESPONSE AS THE FIRST RESPONSE
                        }

                    }
            }
        });
    });
} catch (err) {
    console.log(err);
}