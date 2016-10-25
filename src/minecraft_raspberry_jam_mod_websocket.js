
(function (ext) {

    var mcSocket = null;
    var MCPI = Object.create(null);
  
    function mc_init(host) {
        if(mcSocket == null) {
            mcSocket = new WebSocket("ws://"+host+":14711");
            mcSocket.onopen    = onOpen;
            mcSocket.onmessage = onMessage;
            mcSocket.onclose   = onClose;
            mcSocket.onerror   = onError;
        }
    }

    function onOpen(event) { 
        getPlayerPos();
    }

    function onMessage(event) {
        if (event && event.data) {
            console.log("onMessage: " + event.data);
        }
    }

    function onError(event) {
        if(event && event.data) {
            console.log("onError: " + event.data);
        } else {
            console.log("onError");
        }
    }

    function onClose(event) {
        webSocket = null;
    }
    
    function connect(target) {
        if(mcSocket!=null) {
            mcSocket.close();
            mcSocket = null;
        }
        mc_init(target);
    }
  
    function mcSend(text) {
        if(mcSocket!=null) {
            mcSocket.send(text);
        }
    }
    
    function mcSendWCB(text, func) {
        if(mcSocket!=null) {
            mcSocket.onmessage = function(event) {
                if( typeof func != "undefined" && func!=null ) {
                    func(text);
                }
                mcSocket.onmessage = onMessage;
            };
            mcSocket.send(text);
        }
    }

    function getPlayerPos(callback) {
        // PlayerPos
        mcSocket.onmessage = function (event) {
            if(event && event.data) {
                console.log("PlayerPos : " + event.data);
            }
            var args = event.data.trim().split(",");
            MCPI.playerX = Math.floor(parseFloat(args[0]));
            MCPI.playerY = Math.floor(parseFloat(args[1]));
            MCPI.playerZ = Math.floor(parseFloat(args[2]));
            MCPI.curX = MCPI.playerX;
            MCPI.curY = MCPI.playerY;
            MCPI.curZ = MCPI.playerZ;
            MCPI.playerShiftedHeight = MCPI.playerY;
            
            function getrot_cb(txt) {
                console.log("Rotation : " + txt);
                if( typeof callback != "undefined" && callback!=null) {
                    MCPI.yaw = parseFloat(event.data.trim());
                    callback();
                }
            }
            
            mcSendWCB("player.getRotation()", getrot_cb);
        }
        mcSend("player.getPos()");
    }

    //
    // Minecraft Control function
    //
    function postToChat(msg)
    {
        mcSend("chat.post(" + msg + ")");
    }

    function setBlock(x,y,z,block){
        mcSend("world.setBlock("+x+","+y+","+z+","+block+")");
    }

    function setBlocks(x1,y1,z1,x2,y2,z2,block){
        var str = [ x1, y1, z1, x2, y2, z2, block ].join();
        mcSend( "world.setBlocks(" + str + ")" );
    }

    function setPlayer(x,y,z) {
        mcSend("player.setPos("+x+","+y+","+z+")");
    }
    
    function sendRawMsg(msg) {
        mcSend(msg);
    }
    
    function getPlayerId() {
        mcSend("world.getPlayerId()");
    }
    
    function getPlayerYXZ(posCoord) {
        if( posCoord == 'x' ) { return MCPI.playerX; }
        if( posCoord == 'y' ) { return MCPI.playerY; }
        return MCPI.playerZ;
    }
    
    function getBlock(x,y,z,callback) {
        var msg = ["world.getBlock("+ x, y, z+ ")"].join();
        function getb_cb(txt) {
            console.log("getBlock : " + txt);
            if( typeof callback != "undefined" && callback!=null) {
                callback( Number(event.data.trim()) );
            }
        }
        mcSendWCB(msg, getb_cb);
    }

    ext._getStatus = function() {
        return { status:2, msg:'Ready' };
    };
    
    ext._shutdown = function() {
    };
    
    ext.postToChat   = postToChat;
    ext.setBlock     = setBlock;
    ext.setBlocks    = setBlocks;
    ext.setPlayer    = setPlayer;
    ext.getPlayerPos = getPlayerPos;
    ext.playerXYZ    = getPlayerYXZ;
    ext.playerY      = function() { return MCPI.playerY; };
    ext.playerZ      = function() { return MCPI.playerZ; };
    ext.sendRawMsg   = sendRawMsg;
    ext.getBlock     = getBlock;
    ext.connect      = connect;
    ext.connect_url  = function() { return mcSocket.url; }

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
          [' ', 'Connect to %s ', 'connect', 'localhost' ],
          ['r', 'Connection URL', 'connect_url'  ],
          [' ', 'Chat %s', 'postToChat', 'Hello!' ],
          ['R', 'GetBlock X=%n Y=%n Z=%n', 'getBlock', 0, 0, 0 ],
          [' ', 'SetBlock X=%n Y=%n Z=%n, BlockID=%n', 'setBlock', 0, 0, 0, 0 ],
          [' ', 'SetBlocks X1=%n, Y1=%d, Z1=%d, X2=%n Y2=%d Z2=%d, BlockID=%n ', 'setBlocks', 0,0,0,0,0,0,0 ],
          [' ', 'SetPlayerPos X=%n Y=%n Z=%n ', 'setPlayer', '0', '0', '0','0' ],
          ['w', 'GetPlayerPos', 'getPlayerPos'],
          ['r', 'Player %m.pos position', 'playerXYZ', 'x'],

          // for debug
          [' ', '(DBG)RawMsg %s', 'sendRawMsg', '' ],

        ],
        menus: {
            pos: ['x', 'y', 'z'],
            blockPos: ['abs', 'rel'],
        }
    };
    
    mc_init("localhost");

    // Register the extension
    ScratchExtensions.register('MinecraftWebSocket-Scratch', descriptor, ext);

})({});