var schemas = {
  project:{
      title:'Add Project',
      fields:function(item){
          var f = [
              {name:'rootdir',display:'Root', comment:'Root directory to install (default is /var)',default:'/var'},
              {name:'email',required:true,comment:'email for ssh key',display:'Email'},
              {name:'http_username',default:'admin',display:'HTTP auth username',comment:'HTTP Authentication username (default: admin)'},
              {name:'http_password',default:'admin',display:'HTTP auth password',comment:'HTTP Authentication password (default: admin)'},
              {name:'http_port',default:4800,display:'HTTP Port',comment:'HTTP Port number'},
              {name:'ws_port',default:4900,display:'Websocket Port',comment:'HTTP Port number'},
              {name:'sac',value:function(){return cuid();},display:'System Administrator Key'},
              {name:'password',display:'Sudo Password',comment:'Password to set up directories (this is used once and not stored)'}
          ];
          return f;
      },
      menu:[
          {name:'Submit',action:'init();',css:'joe-confirm-button'}
      ]
  }
};

var capp = new CraydentApp(true);
var JOE = new JsonObjectEditor({
    schemas:schemas,
    container:'#joeHolder',
    // useHashlink:true,
    // useBackButton:true,
    socket:':2098'/*,
     onServerLoadComplete:function(){
     capp.Reload.all();
     },
     onServerUpdate:function(){
     capp.Reload.all();
     }*/
});
JOE.init();
goJoe({},{schema:'project'});

var guid = cuid();
var socket = io($l.protocol + "//" + $l.hostname + ':4900');
socket.on('initialized',function(data){
    if (data.error) {
        return alert('init failed');
    }
    alert('initialized');
});
$('key').setAttribute('placeholder', guid);
function init() {
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

