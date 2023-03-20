const fs = require("fs");
const request = require('request');
const cron = require('node-cron');
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

cron.schedule('5 * * * *', () => {
    process.exit()
  });

//FOR GLOBAL SCOPES
var prompt;


//GETSETTINGS

//BOTNAME
const nameRegex = /botname\s*=\s*'([^']+)'/;
var match = settings.match(nameRegex);
const botName = match[1];
const ownerRegex = /owner\s*=\s*'([^']+)'/;
match = settings.match(ownerRegex);
const ownerName = match[1];


//ASK THE AI
async function ask(prompt) {
    response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: prompt
      });
      response = response.data.choices[0].message
      return response;
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

                    if (event.attachments.length < 1 && !fromGroup && event.senderID!=botID) { //CHECK IF FROM A GROUP

                        api.sendTypingIndicator(event.threadID);
                          
                            //PROMPT MANAGEMENT
    
                            if (!(event.senderID in msgs)) {
    
                                msgs[event.senderID] = [];
    
                            msgs[event.senderID].push({
                                role: "system",
                                content: "This is a conversation between an AI(you) and a human("+senderName+"), you are the AI created by "+ownerName+", named "+botName+", you help people find answer to any question and you can send image by responsing '/d (image description)' for example the user said: 'send me an image of an elephant' you just respond: 'Here's an image of an elephant /d elephant' no need to code or anything and you can only send one image at a time"
                              });}
    
                              
                          msgs[event.senderID].push({
                            role: "user",
                            content: msg+" (replying to the message: '"+event.messageReply.body+"')"
                          });
                            
                            var response1 = await ask(msgs[event.senderID]) //ASK THE AI WITH THE ARRANGED PROMPT

                            var response = response1.content
                            //IF THE USER WANTS AN IMAGE
                            if (response.includes('/d')) {
    
                                var parts = response.split('/d');
    
                                var imagedes =  parts[1];//IMAGE DESCRIPTION
    
                                response = imagedes;
    
                                var image_url = await img(imagedes); //IMAGE GENERATION(URL RETURN)
    
                                var callback = () => api.sendMessage({
                                    body: `${parts[0]}`,
                                    attachment: fs.createReadStream(__dirname + "/cache/img.png")
                                }, event.threadID, () => fs.unlinkSync(__dirname + "/cache/img.png")); //FUNCTION THAT CREATES A READSTREAM AND DELETES IT AFTER SENDING TO THE USER
    
                                request(image_url).pipe(fs.createWriteStream(__dirname + "/cache/img.png")).on("close", () => callback()); //WRITES THE IMAGE ON THE READSTREAM THAT HAS BEEN CREATED AND CALLS THE CALLBACK FUNCTION
                              
    
                            } else api.sendMessage(response, event.threadID, event.messageID); //SEND THE AI's RESPONSE TO THE USER
    
                            //RESPONSE MANAGEMENT
    
                            msgs[event.senderID].push(response1);
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

                    api.sendTypingIndicator(event.threadID);
                      
                        //PROMPT MANAGEMENT

                        if (!(event.senderID in msgs)) {

                            msgs[event.senderID] = [];

                        msgs[event.senderID].push({
                            role: "system",
                            content: "This is a conversation between an AI(you) and a human("+senderName+"), you are the AI created by "+ownerName+", named "+botName+", you help people find answer to any question and you can send image by responsing '/d (image description)'"
                          });}

                          
                      msgs[event.senderID].push({
                        role: "user",
                        content: msg
                      });
                        
                        var response1 = await ask(msgs[event.senderID]) //ASK THE AI WITH THE ARRANGED PROMPT
                    
                        var response = response1.content
                        //IF THE USER WANTS AN IMAGE
                        if (response.includes('/d')) {

                            var parts = response.split('/d');

                            var imagedes =  parts[1];//IMAGE DESCRIPTION

                            response = imagedes;

                            var image_url = await img(imagedes); //IMAGE GENERATION(URL RETURN)

                            var callback = () => api.sendMessage({
                                body: `${parts[0]}`,
                                attachment: fs.createReadStream(__dirname + "/cache/img.png")
                            }, event.threadID, () => fs.unlinkSync(__dirname + "/cache/img.png")); //FUNCTION THAT CREATES A READSTREAM AND DELETES IT AFTER SENDING TO THE USER

                            request(image_url).pipe(fs.createWriteStream(__dirname + "/cache/img.png")).on("close", () => callback()); //WRITES THE IMAGE ON THE READSTREAM THAT HAS BEEN CREATED AND CALLS THE CALLBACK FUNCTION
                          

                        } else api.sendMessage(response, event.threadID, event.messageID); //SEND THE AI's RESPONSE TO THE USER

                        //RESPONSE MANAGEMENT

                        msgs[event.senderID].push(response1);
                    }
            }
        });
    });
} catch (err) {
    console.log(err);
}