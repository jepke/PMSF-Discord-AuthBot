var myArgs = process.argv.slice(2);
const Discord=require('discord.js');
const bot=new Discord.Client();
const config=require(myArgs[0]);
const mysql = require('mysql');
//var sqlConnection;
var approvedUsers = {};


bot.login(config.token);

bot.on('ready', () => {
    console.info(GetTimestamp()+'-- DISCORD BOT IS READY --');

    // UPDATE PMSF USERS
    SQLConnect().then(users => { UpdateUsers() }).catch(console.error);
});

// DATABASE TIMER FOR CHECKING ROLES
setInterval(function(){UpdateUsers();},config.timer);

function UpdateUsers()
{
    var guildsFetched = [];
    for(var guild in config.guilds)
    {
        guildsFetched.push(bot.guilds.get(guild).fetchMembers());
    }

    sqlConnection.query("UPDATE users SET access_level=0 WHERE login_system = 'discord'", function(err, result) {
        if(err)
        {
            if(err.code==="PROTOCOL_CONNECTION_LOST" || err.code==="PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR")
            {
                console.log(GetTimestamp()+"Reconnecting to DB server...");
                SQLConnect().then(result => {
                    UpdateUsers();
                });
            }
        }
        else if(!err)
        {
            console.log(GetTimestamp()+"SQL Query successful");
            Promise.all(guildsFetched).then(fetched => {
                CheckAllGuilds();
                UpdateAllUsers();
            });
        }
    });
}

function CheckAllGuilds()
{
    for(var guild in config.guilds)
    {
        console.log("Checking guild ID "+guild+" for valid members");
        for(var role in config.guilds[guild])
        {
            console.log("Looking for users with role ID "+role);          
            
            let currentRole = bot.guilds.get(guild).roles.get(role);
            
            currentRole.members.forEach(function(member) {
                if(!approvedUsers[member.user.id])
                {
                    //If user doesnt exist, make an array for them with their name, the first role, and its value
                    approvedUsers[member.user.id] = {};
                    approvedUsers[member.user.id].roles = {};
                    approvedUsers[member.user.id].roles[role] = config.guilds[guild][role];
                    approvedUsers[member.user.id].name = member.user.tag;
                    console.log(GetTimestamp()+"User ID "+member.user.id+" approved at level "+config.guilds[guild][role]+" for guild "+guild);
                }
                else if(approvedUsers[member.user.id])
                {
                    //If the user exists, add the new role and its value to their array
                    approvedUsers[member.user.id].roles[role] = config.guilds[guild][role];
                    console.log("User ID "+member.user.id+" approved at level "+config.guilds[guild][role]);                    
                }
                else
                {
                    console.log("Something's not right");
                }
            });
        }
        
    }
}

function UpdateAllUsers()
{
    for(var user in approvedUsers)
    {
        UpdateUser(user);
    }
}

function UpdateUser(user)
{
    if(!approvedUsers[user]) { return; }
    let userLevel = 0;
    for(var role in approvedUsers[user].roles)
    {
        if(approvedUsers[user].roles[role] > userLevel)
        {
            userLevel = approvedUsers[user].roles[role];
        }
    }
    ApproveUser(user, userLevel, approvedUsers[user].name);
}

function ApproveUser(userID, accessLevel, name)
{
    // REPLACE NON ASCII CHARACTERS
    name = name.replace(/[^\x00-\x7F]/g, "");
    var sqlStatement;
    if(accessLevel > 0)
    {
        sqlStatement = "INSERT INTO users (id,user,access_level,expire_timestamp,login_system) VALUES ("+userID+",\""+name+"\","+accessLevel+",1,'discord') ON DUPLICATE KEY UPDATE user=VALUES(user),access_level=VALUES(access_level),login_system=VALUES(login_system);";
    }
    else
    {
        sqlStatement = "INSERT INTO users (id,user,access_level,expire_timestamp,login_system,session_id) VALUES ("+userID+",\""+name+"\","+accessLevel+",1,'discord',NULL) ON DUPLICATE KEY UPDATE user=VALUES(user),access_level=VALUES(access_level),login_system=VALUES(login_system),expire_timestamp=VALUES(expire_timestamp),session_id=VALUES(session_id);";
    }
    sqlConnection.query(sqlStatement, function(err, result) {
        if(err)
        {
            if(err.code==="PROTOCOL_CONNECTION_LOST" || err.code==="PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR")
            {
                console.log(GetTimestamp()+"Reconnecting to DB server...");
                SQLConnect().then(result => {
                    ApproveUser(userID, accessLevel, name);
                });
            }
        }
        else if(!err)
        {
            console.log(GetTimestamp()+"SQL Query successfully updated "+name);
        }
    });
}

function UpdateMember(member)
{
    let guild = member.guild.id;

    if(!config.guilds[guild]) { return; }

    for(var role in config.guilds[guild])
    {
        if(member.roles.get(role))
        {
            if(!approvedUsers[member.user.id])
            {
                //If user doesnt exist, make an array for them with the first role
                approvedUsers[member.user.id] = {};
                approvedUsers[member.user.id].roles = {};
                approvedUsers[member.user.id].roles[role] = config.guilds[guild][role];
                approvedUsers[member.user.id].name = member.user.tag;
                console.log(GetTimestamp()+"User ID "+member.user.id+" added at level "+config.guilds[guild][role]+" for guild "+guild);
            }
            else
            {
                if(!approvedUsers[member.user.id].roles[role])
                {
                    approvedUsers[member.user.id].roles[role] = config.guilds[guild][role];
                    console.log(GetTimestamp()+"User ID "+member.user.id+" added at level "+config.guilds[guild][role]);
                }
            }
        }
        else
        {
            if(approvedUsers[member.user.id] && approvedUsers[member.user.id].roles[role])
            {
                delete approvedUsers[member.user.id].roles[role];
                console.log(GetTimestamp()+"User ID "+member.user.id+" lost role "+role);
            }
        }
    }

    UpdateUser(member.user.id);
}

function SQLConnect()
{
    return new Promise(function(resolve) {
        sqlConnection = mysql.createConnection({
            host: config.host,
            user: config.username,
            port: config.port,
            password: config.password,
            database: config.database,
            supportBigNumbers: true
        });
        sqlConnection.connect(function(err) {
            if(err)
            {
                throw err;
                process.exit(1);
            }
            console.log(GetTimestamp()+"Connected to SQL!");
            resolve(true);
        });
    });
}

function GetTimestamp()
{
    let now = new Date();

    return "["+now.toLocaleString()+"] ";
}

function RestartBot(type)
{
    if(type == 'manual'){ process.exit(1); }
    else{
        console.error(GetTimestamp()+"Unexpected error, bot stopping, likely websocket");
        process.exit(1);
    }
    return;
}

bot.on('guildMemberRemove', member => {
    let guild = member.guild.id;

    if(!config.guilds[guild]) { return; }
    if(!approvedUsers[member.user.id]) { return; }

    for(var role in config.guilds[guild])
    {
        if(approvedUsers[member.user.id].roles[role])
        {
            delete approvedUsers[member.user.id].roles[role];
            console.log(GetTimestamp()+"User ID "+member.user.id+" lost role "+role+" due to no longer being in the server");
        }
    }

    UpdateUser(member.user.id);

});

bot.on('guildMemberAdd', member => {
    let guild = member.guild.id;
    if(!config.guilds[guild]) { return; }
    UpdateMember(member);
});

bot.on('guildMemberUpdate', (oldMember, newMember) => {
    UpdateMember(newMember);
});

bot.on('error', function(err)  {
    if(typeof err == 'object')
    {
        err = JSON.stringify(err);
    }
    console.error(GetTimestamp()+'Uncaught exception (error): '+err);
    RestartBot();
    return;
});

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, GetTimestamp()+'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
        console.log(GetTimestamp()+"Lost connection to the DB server. Waiting for activity before reconnecting...");
        return;
    } else {
        console.error(err, GetTimestamp()+'Uncaught Exception thrown');
        process.exit(1);
    }
  });

bot.on('disconnect', function(closed) {
    console.error(GetTimestamp()+'Disconnected from Discord');
    return;
});
