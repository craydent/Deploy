$c.DEBUG_MODE = true;
var schemas = {
    config:{
        title:'Deploy Config Setup',
        fields:function(item){
            var f = [
                {name:'rootdir',display:'Root', comment:'Root directory to install (default is /var)',default:'/var'},
                {name:'email',required:true,comment:'email for ssh key',display:'Email'},
                {name:'http_username',default:'admin',display:'HTTP auth username',comment:'HTTP Authentication username (default: admin)'},
                {name:'http_password',default:'admin',display:'HTTP auth password',comment:'HTTP Authentication password (default: admin)'},
                {name:'http_port',default:4800,display:'HTTP Port',comment:'HTTP Port number'},
                {name:'ws_port',default:4900,display:'Websocket Port',comment:'HTTP Port number'},
                {name:'sac',value:function(){return cuid();},display:'System Administrator Key',comment:'Use previous Sys Admin Key to overwrite'},
                {name:'password',display:'Sudo Password',comment:'Password to set up directories (this is used once and not stored)'}
            ];
            return f;
        },
        menu:[
            {name:'Submit',action:'createConfig();',css:'joe-confirm-button'}
        ]
    },
    project:{
        title:'Add Project',
        fields:function(item){
            var f = [
                'name',
                {name:'email',display:'email'},
                {name:'passcode',value:window.location.search.substring(1)},
                {label:'ssh'},       
                {name:'ssh_creator',type:'content',run:function(){
                    return 'add a name -> click button<br/> show list below';
                }},
                {name:'key_name',display:'Key Name',select:'STRING of keyname'},

                
                {label:'git'},
                {name:'git_address',display:'git ssh url'},
                {name:'git_user',display:'Git Username'},
                {name:'git_password',display:'Git Password'},

                
                {label:'directories'},
                {name:'nodejs',display:'NodeJS Directory',comment:'direcdtory of node starting point within the project'},
                {name:'www',display:'WWW Directory',
                    comment:'Full directory path to your web directory on the server (ex:/var/www)'},
                 {name:'webdir',display:'Local Web Directory',
                    comment:'Relative directory path to your web directory on git (ex: webdir)'},  
                {label:'server'}, 
                {name:'server',comment:'enter the path to the file',display:'Node Files',type:'objectList',
                    properties:['filepath'],
                    hideHeadings:true
                }

            ];
            return f;
        },
        menu:[
            {name:'Submit',action:'createEnvironment();',css:'joe-confirm-button'}
        ]
    }
};

var capp = new CraydentApp(true);
var JOE = new JsonObjectEditor({
    schemas:schemas,
    container:'#joeHolder',
/*     useHashlink:true,
     useBackButton:true,
  */
    socket:':2098'/*,
     onServerLoadComplete:function(){
     capp.Reload.all();
     },
     onServerUpdate:function(){
     capp.Reload.all();
     }*/
});
JOE.init();
goJoe({},{schema:'config'});

var guid = cuid();
var socket = io($l.protocol + "//" + $l.hostname + ':4900');
socket.on('initialized',function(data){
    if (data.error) {
        return alert('init failed');
    }
    alert('initialized');
});
socket.on('projectadded',function(data){
    if (data.error) {
        return alert('add failed');
    }
    alert('project added');
});
socket.on('showsshkey',function(data){
    if (data.error) {
        return alert('sshkey failed');
    }
    if (!$('ssh'+data.name,true)) {
        $('sshkeynames').innerHTML += '<div id="ssh'+data.name+'" ondblclick="getsshkey(this);">'+data.name+'</div>';
    }
    $('sshkeycontent').innerHTML=data.content;
});


function createEnvironment(){
    var obj = _joe.Object.construct();
    if(_joe.Object.validate(obj)){
        var servers = [];
        console.log('gitadd',obj);
    }
    
    /*
                var servers = [];
            var txtboxes = $('#servers input');
            for (var i = 0, len = txtboxes.length; i < len; i++) {
                servers.push(txtboxes[i].value);
            }
            var obj = {
                passcode: window.location.search.substring(1),
                'name': $('pname').value,
                git_address:$('gitaddress').value,
                git_user:$('gitu').value,
                git_password:$('gitp').value,
                key_name:$('kname').value,
                servers: servers,
                www:$('wwwdir').value,
                nodejs:$('nodedir').value,
                webdir:$('webdir').value,
                email:$('email').value
            };
            socket.emit('gitadd',obj);
            */
}
function createConfig() {
    var obj = _joe.Object.construct();
    if(_joe.Object.validate(obj)){
        console.log('init',obj);
        socket.emit('init',obj);
    }

/*    socket.emit('init',{
        rootdir:$('rootdir').value,
        email:$('email').value,
        password:$('sudo').value,
        http_username:$('ausername').value || "admin",
        http_password:$('apassword').value || "admin",
        http_port:$('httpport').value || 4800,
        ws_port:$('wsport').value || 4900,
        sac:$('key').value || guid
    });*/
}

