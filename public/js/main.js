var appStrs = {
	tail:'',
	tail_error:'',
	process_complete:''
};
var baseUrl = $l.protocol + "//" + $l.hostname;
var socket = io(baseUrl + ':4900');
function printTo(data,to){
	var d = $c.format(new Date(),'m/d/y h:i:s');
	var print = data.file + ":"+data.line + "<br />";
	document.getElementById(to).innerHTML += '<small>'+d+'</small> '+print;
	appStrs[to] += print;
	/*goJoe(appStrs[to]);*/
}
socket.on('line', function (data) {
	printTo(data,'tail');
});
socket.on('error', function (data) {
	document.getElementById("tail_error").innerHTML += data + "<br />";
	printTo(data, 'tail');
});
socket.on('add_error',function(data){
	alert('Error adding project - Code: ' + data.code + ", Message: " + data.output);
});
socket.on('process_complete', function (data) {
	document.getElementById("out").innerHTML += data.output.replace(/\n/g,'<br />') + '<br /><br />';
	printTo(data,'tail');
});
function reload_config() {
	$.ajax({
		url:baseUrl+"/RELOAD_CONFIG",
		dataType:"json",
		success:function(data){
			console.log(data);
			alert(data.message);
		}
	});
}




function callServerAction(socketaction,dom,action) {
	var name = dom.innerText;
	if (confirm('Are you sure you want to '+socketaction+' \n'+name)) {
		/*socket.emit('deploy',{passcode:window.location.search.substring(1),name:this.innerText,action:'build'});*/
		socket.emit(socketaction, {
			passcode: window.location.search.substring(1),
			name: name,
			action: action || null
		});
	}
}
$(function(){
	$('outputName').click(function(){
		var index = $(this).index();
		$('outputName,.output_window').removeClass('active');
		$('outputName,.output_window').eq(index).addClass('active');
		$('.output_window').eq(index).addClass('active');
	});
	var capp = new CraydentApp({
		autoInit:true
	});
})